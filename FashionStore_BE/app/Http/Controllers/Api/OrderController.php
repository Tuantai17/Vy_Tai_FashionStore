<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Product;                     // ✅ thêm
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;          // ✅ thêm
use Illuminate\Validation\ValidationException;

use App\Models\Coupon;                 // mã giảm giá


class OrderController extends Controller
{
    // public function checkout(Request $request)
    // {
    //     // Validate
    //     $data = $request->validate([
    //         'customer_name'   => 'required|string|max:100',
    //         'phone'           => 'required|string|max:20',
    //         'address'         => 'required|string|max:255',
    //         'email'           => 'required|email|max:255',
    //         'items'           => 'required|array|min:1',
    //         'items.*.id'      => 'required|integer',      // id sản phẩm
    //         'items.*.name'    => 'required|string',
    //         'items.*.price'   => 'required|numeric',
    //         'items.*.qty'     => 'required|integer|min:1',
    //     ]);

    //     // Tổng tiền chỉ để trả về / ghi chú (không liên quan tồn kho)
    //     $total = collect($data['items'])->sum(fn($i) => $i['price'] * $i['qty']);

    //     // ✅ TẤT CẢ trong transaction để trừ kho an toàn
    //     $order = DB::transaction(function () use ($data, $total) {
    //         // Tạo đơn
    //         $order = Order::create([
    //             'name'     => $data['customer_name'],
    //             'phone'    => $data['phone'],
    //             'email'    => $data['email'],
    //             'address'  => $data['address'],
    //             'user_id'  => Auth::id() ?? null,
    //             'status'   => 0,  // pending
    //             'note'     => "Tổng đơn: {$total} đ",
    //         ]);

    //         // Cho từng item: kiểm tra & trừ kho ngay
    //         foreach ($data['items'] as $item) {
    //             $pid = (int) $item['id'];
    //             $buyQty = (int) $item['qty'];

    //             // Khóa dòng sản phẩm để tránh race condition
    //             $product = Product::where('id', $pid)->lockForUpdate()->first();
    //             if (!$product) {
    //                 throw ValidationException::withMessages([
    //                     'items' => ["Sản phẩm #{$pid} không tồn tại."],
    //                 ]);
    //             }

    //             // Không đủ hàng
    //             if ((int)$product->qty < $buyQty) {
    //                 throw ValidationException::withMessages([
    //                     'items' => ["Sản phẩm '{$product->name}' chỉ còn {$product->qty} cái trong kho."],
    //                 ]);
    //             }

    //             // Lưu chi tiết đơn
    //             OrderDetail::create([
    //                 'order_id'   => $order->id,
    //                 'product_id' => $pid,
    //                 'price_buy'  => (float)$item['price'],
    //                 'qty'        => $buyQty,
    //                 'amount'     => (float)$item['price'] * $buyQty,
    //             ]);

    //             // ✅ TRỪ KHO NGAY
    //             $product->qty = (int)$product->qty - $buyQty;
    //             $product->save();
    //         }

    //         return $order;
    //     });

    //     return response()->json([
    //         'message'  => 'Đặt hàng thành công',
    //         'order_id' => $order->id,
    //         'total'    => $total,
    //     ]);
    // }



    public function checkout(Request $request)
    {
        // 1) Validate payload
        $data = $request->validate([
            'customer_name'   => 'required|string|max:100',
            'phone'           => 'required|string|max:20',
            'address'         => 'required|string|max:255',
            'email'           => 'required|email|max:255',
            'items'           => 'required|array|min:1',
            'items.*.id'      => 'required|integer',
            'items.*.name'    => 'required|string',
            'items.*.price'   => 'required|numeric|min:0',
            'items.*.qty'     => 'required|integer|min:1',

            // tuỳ chọn
            'coupon_code'     => 'nullable|string|max:50',
            'shipping_fee'    => 'nullable|numeric|min:0',
        ]);

        $shipping = (float)($data['shipping_fee'] ?? 0);
        $couponCode = trim((string)($data['coupon_code'] ?? ''));
        if ($couponCode !== '') {
            $couponCode = mb_strtoupper($couponCode);
        }

        // 2) Chạy trong transaction để trừ kho + ghi order + tăng used_count
        $result = DB::transaction(function () use ($data, $shipping, $couponCode) {

            // 2.1 Tạo order khung
            $order = Order::create([
                'name'    => $data['customer_name'],
                'phone'   => $data['phone'],
                'email'   => $data['email'],
                'address' => $data['address'],
                'user_id' => Auth::id() ?? null,
                'status'  => 0, // pending
            ]);

            // 2.2 Ghi chi tiết + trừ kho, đồng thời cộng subtotal
            $subtotal = 0;

            foreach ($data['items'] as $item) {
                $pid = (int)$item['id'];
                $buyQty = (int)$item['qty'];
                $price  = (float)$item['price'];
                $amount = $price * $buyQty;

                // Khóa sản phẩm để tránh race condition
                $product = Product::where('id', $pid)->lockForUpdate()->first();
                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => ["Sản phẩm #{$pid} không tồn tại."],
                    ]);
                }
                if ((int)$product->qty < $buyQty) {
                    throw ValidationException::withMessages([
                        'items' => ["Sản phẩm '{$product->name}' chỉ còn {$product->qty} cái trong kho."],
                    ]);
                }

                OrderDetail::create([
                    'order_id'   => $order->id,
                    'product_id' => $pid,
                    'price_buy'  => $price,
                    'qty'        => $buyQty,
                    'amount'     => $amount,
                ]);

                // trừ kho
                $product->qty = (int)$product->qty - $buyQty;
                $product->save();

                $subtotal += $amount;
            }

            // 2.3 Áp mã giảm giá (nếu có) – khoá coupon khi tăng used_count
            $discount = 0;
            $couponApplied = null;

            if ($couponCode !== '') {
                // tìm không phân biệt hoa thường + khóa dòng để tránh over-use
                $coupon = Coupon::whereRaw('LOWER(code) = ?', [mb_strtolower($couponCode)])
                    ->lockForUpdate()
                    ->first();

                if (!$coupon) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['Mã giảm giá không tồn tại.'],
                    ]);
                }
                if (!$coupon->canUse()) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['Mã đã hết hạn hoặc hết lượt dùng.'],
                    ]);
                }
                if ($subtotal < (float)$coupon->min_order_total) {
                    throw ValidationException::withMessages([
                        'coupon_code' => ['Chưa đạt giá trị đơn tối thiểu để áp dụng mã.'],
                    ]);
                }

                $discount = (float)$coupon->calcDiscount($subtotal);

                // Lưu vào order (chỉ set nếu có cột tương ứng)
                $couponApplied = $coupon->code;

                if (\Schema::hasColumn($order->getTable(), 'coupon_code')) {
                    $order->coupon_code = $coupon->code;
                }
                if (\Schema::hasColumn($order->getTable(), 'discount_amount')) {
                    $order->discount_amount = $discount;
                }

                // Tăng used_count an toàn
                if (\Schema::hasColumn($coupon->getTable(), 'used_count')) {
                    $coupon->increment('used_count');
                }
            }

            // 2.4 Tính total và lưu
            $finalTotal = max(0, $subtotal + $shipping - $discount);

            if (\Schema::hasColumn($order->getTable(), 'total')) {
                $order->total = $finalTotal;
            }
            if (\Schema::hasColumn($order->getTable(), 'subtotal')) {
                $order->subtotal = $subtotal;
            }
            if (\Schema::hasColumn($order->getTable(), 'shipping')) {
                $order->shipping = $shipping;
            }

            $order->save();

            return [
                'order'    => $order,
                'subtotal' => $subtotal,
                'shipping' => $shipping,
                'discount' => $discount,
                'coupon_code' => $couponApplied ?? $order->coupon_code ?? null,
                'total'    => $finalTotal,
            ];
        });

        return response()->json([
            'message'   => 'Đặt hàng thành công',
            'order_id'  => $result['order']->id,
            'subtotal'  => $result['subtotal'],
            'shipping'  => $result['shipping'],
            'discount'  => $result['discount'],
            'total'     => $result['total'],
            'coupon'    => $result['coupon_code'],
        ], 201);
    }







    public function index(Request $request)
    {
        $search   = $request->string('search')->toString();
        $perPage  = max(1, min(100, (int) $request->get('per_page', 20)));
        $fetchAll = $request->boolean('all', false);

        $rawStatus      = $request->query('status');
        $rawStatusStep  = $request->query('status_step');

        $status = null;
        $statusStep = null;

        if ($rawStatus !== null && $rawStatus !== '') {
            $rawStatusTrimmed = trim((string) $rawStatus);
            if (is_numeric($rawStatusTrimmed) && ((string) (int) $rawStatusTrimmed === $rawStatusTrimmed)) {
                $status = (int) $rawStatusTrimmed;
            } else {
                $statusStep = $rawStatusTrimmed;
            }
        }

        if ($rawStatusStep !== null && trim((string) $rawStatusStep) !== '') {
            $statusStep = trim((string) $rawStatusStep);
        }

        $normalizedStep = $this->normalizeStatusStep($statusStep);

        $q = Order::query()
            ->withCount('details')
            ->withSum('details as items_subtotal', 'amount');

        if (!is_null($status)) {
            $q->where('status', $status);
        }

        if ($normalizedStep !== null) {
            $q->where(function ($qq) use ($normalizedStep) {
                $qq->where('status_step', $normalizedStep);

                if ($normalizedStep === 'canceled') {
                    $qq->orWhere('status', 2);
                }
            });
        }

        if ($search) {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        $transform = function (Order $order) {
            $money = $this->summarizeMoney($order, $order->items_subtotal ?? null);
            foreach ($money as $key => $value) {
                $order->setAttribute($key, $value);
            }
            $order->setAttribute('total_due', $money['total']);
            $order->setAttribute('total', $money['total']);
            return $order;
        };

        if ($fetchAll) {
            $orders = $q->latest('id')->get()->map($transform);
            return response()->json($orders);
        }

        $orders = $q->latest('id')->paginate($perPage);
        $orders->getCollection()->transform($transform);

        return response()->json($orders);
    }

    private function normalizeStatusStep(?string $status): ?string
    {
        if ($status === null) {
            return null;
        }

        $value = strtolower(trim($status));
        if ($value === '') {
            return null;
        }

        $map = [
            'pending'   => ['pending', '0', 'new', 'processing', 'awaiting', 'waiting'],
            'confirmed' => ['confirmed', '1', 'paid', 'accepted'],
            'ready'     => ['ready', 'packed', 'packing', 'prepared'],
            'shipping'  => ['shipping', 'shipped', 'in_transit', 'delivering'],
            'delivered' => ['delivered', 'completed', 'done', 'finished'],
            'canceled'  => ['canceled', 'cancelled', 'void', '2'],
        ];

        foreach ($map as $canonical => $aliases) {
            if ($value === $canonical || in_array($value, $aliases, true)) {
                return $canonical;
            }
        }

        return null;
    }

    // ====== SHOW (giữ nguyên UI FE, chỉ trả thêm trường step nếu có) ======
    public function show(Order $order)
    {
        $order->load(['details.product:id,name,thumbnail'])
            ->loadSum('details as total', 'amount');

        return response()->json([
            'id'         => $order->id,
            'code'       => $order->code ?? $order->id,
            'name'       => $order->name,
            'email'      => $order->email,
            'phone'      => $order->phone,
            'address'    => $order->address,
            'note'       => $order->note,

            'status'       => (int)($order->status ?? 0),
            'status_step'  => $order->status_step,
            'step_code'    => $order->step_code,

            'created_at'   => $order->created_at,
            'updated_at'   => $order->updated_at,
            'confirmed_at' => $order->confirmed_at,
            'ready_at'     => $order->ready_at,
            'shipped_at'   => $order->shipped_at,
            'delivered_at' => $order->delivered_at,
            'canceled_at'  => $order->canceled_at ?? null,

            'total'      => (float)$order->total,

            'items'      => $order->details->map(function ($d) {
                $p   = $d->product;
                $img = $p?->thumbnail_url ?? $p?->thumbnail;

                return [
                    'id'            => $d->id,
                    'product_id'    => $d->product_id,
                    'name'          => $p?->name ?? 'Sản phẩm',
                    'product_image' => $img,
                    'thumbnail_url' => $img,
                    'price'         => (float)$d->price_buy,
                    'qty'           => (int)$d->qty,
                    'subtotal'      => (float)($d->amount ?? $d->price_buy * $d->qty),
                ];
            })->values(),
        ]);
    }

    public function track(Request $r)
    {
        $code  = $r->query('code');
        $phone = $r->query('phone');

        if (!$code) return response()->json(['message' => 'Missing code'], 422);

        $q = Order::query();
        if (ctype_digit((string)$code)) $q->where('id', (int)$code);
        else $q->where('code', $code);

        if ($phone) $q->where('phone', 'like', '%' . $phone . '%');

        $order = $q->first();
        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        $order->load(['details.product:id,name,thumbnail']);

        $items = $order->details->map(function ($d) {
            $p = $d->product;
            $amount = (float)($d->amount ?? $d->price_buy * $d->qty);
            return [
                'id'            => $d->id,
                'product_id'    => $d->product_id,
                'name'          => $p?->name ?? 'Sản phẩm',
                'thumbnail_url' => $p?->thumbnail_url ?? $p?->thumbnail,
                'price'         => (float)$d->price_buy,
                'qty'           => (int)$d->qty,
                'subtotal'      => $amount,
            ];
        })->values();

        $itemsSubtotal = round($items->sum(fn ($i) => $i['subtotal']), 2);
        $money = $this->summarizeMoney($order, $itemsSubtotal);

        return response()->json([
            'id'           => $order->id,
            'code'         => $order->code ?? $order->id,
            'name'         => $order->name,
            'email'        => $order->email,
            'phone'        => $order->phone,
            'address'      => $order->address,
            'note'         => $order->note,

            'status'       => (int)($order->status ?? 0),
            'status_step'  => $order->status_step,
            'step_code'    => $order->step_code,

            'created_at'   => $order->created_at,
            'updated_at'   => $order->updated_at,
            'confirmed_at' => $order->confirmed_at,
            'ready_at'     => $order->ready_at,
            'shipped_at'   => $order->shipped_at,
            'delivered_at' => $order->delivered_at,
            'canceled_at'  => $order->canceled_at ?? null,

            'items_subtotal' => $money['items_subtotal'],
            'subtotal'       => $money['subtotal'],
            'shipping_fee'   => $money['shipping_fee'],
            'discount'       => $money['discount'],
            'total'          => $money['total'],
            'coupon_code'    => $money['coupon_code'],

            'items'        => $items,
        ]);
    }

    // ====== Cập nhật step (giữ nguyên, NHƯNG KHÔNG trừ kho nữa để tránh trừ 2 lần) ======
    public function updateStatusStep(Request $request, Order $order)
    {
        if ($order->status_step === 'canceled' || (int)$order->status === 2) {
            return response()->json(['message' => 'Order already canceled'], 409);
        }

        $status = $request->input('status_step') ?? $request->input('status');
        $statusKey = strtolower($status);

        // ❌ BỎ đoạn trừ kho ở đây (đã trừ trong checkout)
        if ($statusKey === 'confirmed') {
            $order->confirmed_at = now();
        }

        $map = [
            'pending'   => 0,
            'confirmed' => 1,
            'ready'     => 2,
            'shipping'  => 3,
            'delivered' => 4,
        ];

        $table = $order->getTable();
        if (Schema::hasColumn($table, 'status_step')) {
            $order->status_step = $statusKey;
        }
        if (Schema::hasColumn($table, 'step_code')) {
            $order->step_code = $map[$statusKey] ?? 0;
        }

        if ($statusKey === 'ready')     $order->ready_at    = now();
        if ($statusKey === 'shipping')  $order->shipped_at  = now();
        if ($statusKey === 'delivered') $order->delivered_at = now();

        $order->save();

        return response()->json($order);
    }

    public function updateStatusStepById(Request $r)
    {
        $order = Order::findOrFail($r->id);
        return $this->updateStatusStep($r, $order);
    }

    /* ==================== Endpoints HỦY ĐƠN ==================== */

    public function cancelById(Order $order)
    {
        return $this->performCancel($order);
    }

    public function cancel(Request $r)
    {
        $code = $r->input('code');
        if (!$code) return response()->json(['message' => 'Missing code'], 422);

        $q = Order::query();
        if (ctype_digit((string)$code)) $q->where('id', (int)$code);
        else $q->where('code', $code);

        $order = $q->firstOrFail();
        return $this->performCancel($order);
    }





    public function mine(Request $request)
    {
        $uid = \Illuminate\Support\Facades\Auth::id();
        if (!$uid) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = max(1, min(100, (int) $request->get('per_page', 20)));
        $orders = \App\Models\Order::query()
            ->where('user_id', $uid)
            ->withCount('details')
            ->withSum('details as items_subtotal', 'amount')
            ->latest('id')
            ->paginate($perPage);

        $orders->getCollection()->transform(function ($order) {
            $money = $this->summarizeMoney($order, $order->items_subtotal ?? null);
            foreach ($money as $key => $value) {
                $order->setAttribute($key, $value);
            }
            // convenience alias for FE
            $order->setAttribute('total_due', $money['total']);
            $order->setAttribute('total', $money['total']);
            return $order;
        });

        return response()->json($orders);
    }

    private function summarizeMoney(Order $order, ?float $itemsSubtotal = null): array
    {
        $table = $order->getTable();
        $hasSubtotal = Schema::hasColumn($table, 'subtotal');
        $hasShipping = Schema::hasColumn($table, 'shipping');
        $hasDiscount = Schema::hasColumn($table, 'discount_amount');
        $hasTotal = Schema::hasColumn($table, 'total');
        $hasCoupon = Schema::hasColumn($table, 'coupon_code');

        if ($itemsSubtotal === null) {
            if ($order->relationLoaded('details')) {
                $itemsSubtotal = $order->details->sum(function ($d) {
                    return (float)($d->amount ?? $d->price_buy * $d->qty);
                });
            } elseif (isset($order->items_subtotal)) {
                $itemsSubtotal = (float)$order->items_subtotal;
            } else {
                $itemsSubtotal = 0.0;
            }
        }

        $subtotal = $hasSubtotal && $order->subtotal !== null
            ? (float)$order->subtotal
            : (float)$itemsSubtotal;

        $shipping = $hasShipping && $order->shipping !== null
            ? (float)$order->shipping
            : 0.0;

        $discount = null;
        if ($hasDiscount && $order->discount_amount !== null) {
            $discount = (float)$order->discount_amount;
        }

        $finalTotal = $hasTotal && $order->total !== null
            ? (float)$order->total
            : (float)$order->final_total;

        if ($discount === null) {
            $discount = max(0, round(($subtotal + $shipping) - $finalTotal, 2));
        }

        $couponCode = $hasCoupon ? $order->coupon_code : null;

        return [
            'items_subtotal' => round((float)$itemsSubtotal, 2),
            'subtotal'       => round($subtotal, 2),
            'shipping_fee'   => round($shipping, 2),
            'discount'       => round($discount, 2),
            'total'          => round($finalTotal, 2),
            'coupon_code'    => $couponCode,
        ];
    }










    private function performCancel(Order $order)
    {
        if ($order->status_step === 'canceled' || (int)$order->status === 2) {
            return response()->json($order);
        }

        $order->status = 2;

        if (Schema::hasColumn($order->getTable(), 'status_step')) {
            $order->status_step = 'canceled';
        }

        if (Schema::hasColumn($order->getTable(), 'step_code')) {
            $order->step_code = null;
        }

        $table = $order->getTable();

        if (Schema::hasColumn($table, 'canceled_at')) {
            $order->canceled_at = now();
        }

        $order->save();

        return response()->json($order);
    }
}
