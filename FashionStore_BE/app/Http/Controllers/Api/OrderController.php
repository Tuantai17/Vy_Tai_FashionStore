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

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        // Validate
        $data = $request->validate([
            'customer_name'   => 'required|string|max:100',
            'phone'           => 'required|string|max:20',
            'address'         => 'required|string|max:255',
            'email'           => 'required|email|max:255',
            'items'           => 'required|array|min:1',
            'items.*.id'      => 'required|integer',      // id sản phẩm
            'items.*.name'    => 'required|string',
            'items.*.price'   => 'required|numeric',
            'items.*.qty'     => 'required|integer|min:1',
        ]);

        // Tổng tiền chỉ để trả về / ghi chú (không liên quan tồn kho)
        $total = collect($data['items'])->sum(fn($i) => $i['price'] * $i['qty']);

        // ✅ TẤT CẢ trong transaction để trừ kho an toàn
        $order = DB::transaction(function () use ($data, $total) {
            // Tạo đơn
            $order = Order::create([
                'name'     => $data['customer_name'],
                'phone'    => $data['phone'],
                'email'    => $data['email'],
                'address'  => $data['address'],
                'user_id'  => Auth::id() ?? null,
                'status'   => 0,  // pending
                'note'     => "Tổng đơn: {$total} đ",
            ]);

            // Cho từng item: kiểm tra & trừ kho ngay
            foreach ($data['items'] as $item) {
                $pid = (int) $item['id'];
                $buyQty = (int) $item['qty'];

                // Khóa dòng sản phẩm để tránh race condition
                $product = Product::where('id', $pid)->lockForUpdate()->first();
                if (!$product) {
                    throw ValidationException::withMessages([
                        'items' => ["Sản phẩm #{$pid} không tồn tại."],
                    ]);
                }

                // Không đủ hàng
                if ((int)$product->qty < $buyQty) {
                    throw ValidationException::withMessages([
                        'items' => ["Sản phẩm '{$product->name}' chỉ còn {$product->qty} cái trong kho."],
                    ]);
                }

                // Lưu chi tiết đơn
                OrderDetail::create([
                    'order_id'   => $order->id,
                    'product_id' => $pid,
                    'price_buy'  => (float)$item['price'],
                    'qty'        => $buyQty,
                    'amount'     => (float)$item['price'] * $buyQty,
                ]);

                // ✅ TRỪ KHO NGAY
                $product->qty = (int)$product->qty - $buyQty;
                $product->save();
            }

            return $order;
        });

        return response()->json([
            'message'  => 'Đặt hàng thành công',
            'order_id' => $order->id,
            'total'    => $total,
        ]);
    }

    public function index(Request $request)
    {
        $status   = $request->integer('status', null);
        $search   = $request->string('search')->toString();
        $perPage  = max(1, min(100, (int) $request->get('per_page', 20)));

        $q = Order::query()
            ->withCount('details')
            ->withSum('details as total', 'amount');

        if (!is_null($status)) {
            $q->where('status', $status);
        }

        if ($search) {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        $orders = $q->latest('id')->paginate($perPage);

        return response()->json($orders);
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

        $order->load(['details.product:id,name,thumbnail'])
            ->loadSum('details as total', 'amount');

        $items = $order->details->map(function ($d) {
            $p = $d->product;
            return [
                'id'            => $d->id,
                'product_id'    => $d->product_id,
                'name'          => $p?->name ?? 'Sản phẩm',
                'thumbnail_url' => $p?->thumbnail_url ?? $p?->thumbnail,
                'price'         => (float)$d->price_buy,
                'qty'           => (int)$d->qty,
                'subtotal'      => (float)($d->amount ?? $d->price_buy * $d->qty),
            ];
        })->values();

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

            'total'        => (float)$order->total,
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

        $order->status_step = $statusKey;
        $order->step_code   = $map[$statusKey] ?? 0;

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
            ->withSum('details as total', 'amount')
            ->latest('id')
            ->paginate($perPage);

        return response()->json($orders);
    }









    private function performCancel(Order $order)
    {
        if ($order->status_step === 'canceled' || (int)$order->status === 2) {
            return response()->json($order);
        }

        $order->status      = 2;
        $order->status_step = 'canceled';
        $order->step_code   = null;

        if (Schema::hasColumn('nqtv_order', 'canceled_at')) {
            $order->canceled_at = now();
        }

        $order->save();

        return response()->json($order);
    }
}
