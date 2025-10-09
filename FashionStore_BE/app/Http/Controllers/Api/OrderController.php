<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

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
            'items.*.id'      => 'required|integer',
            'items.*.name'    => 'required|string',
            'items.*.price'   => 'required|numeric',
            'items.*.qty'     => 'required|integer|min:1',
        ]);

        // Tổng tiền
        $total = collect($data['items'])->sum(fn($i) => $i['price'] * $i['qty']);

        // Tạo đơn
        $order = Order::create([
            'name'     => $data['customer_name'],
            'phone'    => $data['phone'],
            'email'    => $data['email'],
            'address'  => $data['address'],
            'user_id'  => Auth::id() ?? null,
            'status'   => 0,  // pending (giữ nguyên lược đồ cũ)
            'note'     => "Tổng đơn: {$total} đ",
        ]);

        // Chi tiết đơn
        foreach ($data['items'] as $item) {
            OrderDetail::create([
                'order_id'   => $order->id,
                'product_id' => $item['id'],
                'price_buy'  => $item['price'],
                'qty'        => $item['qty'],
                'amount'     => $item['price'] * $item['qty'],
            ]);
        }

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

            // trạng thái số (đã dùng trước đây)
            'status'       => (int)($order->status ?? 0),

            // 5-bước nếu DB có
            'status_step'  => $order->status_step,
            'step_code'    => $order->step_code,

            // mốc thời gian (nếu có cột)
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
                $img = $p?->thumbnail_url ?? $p?->thumbnail; // accessor từ Product

                return [
                    'id'            => $d->id,
                    'product_id'    => $d->product_id,
                    'name'          => $p?->name ?? 'Sản phẩm',

                    // 2 key ảnh cho tương thích
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

    // ====== Cập nhật step (giữ nguyên, chỉ chặn nếu đã hủy) ======

    public function updateStatusStep(Request $request, Order $order)
    {
        // Nếu đã hủy rồi thì không cho đổi
        if ($order->status_step === 'canceled' || (int)$order->status === 2) {
            return response()->json(['message' => 'Order already canceled'], 409);
        }

        $status = $request->input('status_step') ?? $request->input('status');
        $statusKey = strtolower($status);

        // Nếu xác nhận đơn hàng (confirmed) - trừ số lượng tồn kho
        if ($statusKey === 'confirmed') {
            // Load chi tiết đơn hàng và sản phẩm
            $order->load('details.product');

            foreach ($order->details as $detail) {
                $product = $detail->product;
                if ($product) {
                    // Trừ số lượng tồn
                    $product->qty = max(0, $product->qty - $detail->qty);
                    $product->save();
                }
            }

            $order->confirmed_at = now();
        }

        // Cập nhật trạng thái đơn hàng
        $map = [
            'pending'   => 0,
            'confirmed' => 1,
            'ready'     => 2,
            'shipping'  => 3,
            'delivered' => 4,
        ];

        $order->status_step = $statusKey;
        $order->step_code = $map[$statusKey] ?? 0;

        // Cập nhật thời gian các bước
        if ($statusKey === 'ready')     $order->ready_at = now();
        if ($statusKey === 'shipping')  $order->shipped_at = now();
        if ($statusKey === 'delivered') $order->delivered_at = now();

        $order->save();

        return response()->json($order);
    }
    public function updateStatusStepById(Request $r)
    {
        $order = Order::findOrFail($r->id);
        // gọi đúng tham số (request trước, model sau)
        return $this->updateStatusStep($r, $order);
    }

    /* ==================== Endpoints HỦY ĐƠN ==================== */

    // POST /api/orders/{order}/cancel
    public function cancelById(Order $order)
    {
        return $this->performCancel($order);
    }

    // POST /api/orders/cancel  (body: { code: "id-hoặc-code" })
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

    private function performCancel(Order $order)
    {
        // nếu đã hủy thì trả về luôn
        if ($order->status_step === 'canceled' || (int)$order->status === 2) {
            return response()->json($order);
        }

        // đánh dấu hủy theo cả 2 cơ chế để FE nhận ra
        $order->status      = 2;               // số: 2 = Cancelled (giữ tương thích)
        $order->status_step = 'canceled';      // chuỗi: canceled
        $order->step_code   = null;            // ẩn nấc

        if (Schema::hasColumn('nqtv_order', 'canceled_at')) {
            $order->canceled_at = now();
        }

        $order->save();

        return response()->json($order);
    }
}
