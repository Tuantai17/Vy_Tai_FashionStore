<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        // ✅ Validate dữ liệu gửi lên
        $data = $request->validate([
            'customer_name'   => 'required|string|max:100',
            'phone'           => 'required|string|max:20',
            'address'         => 'required|string|max:255',
            'email'           => 'required|email|max:255', // 🔒 bắt buộc email
            'items'           => 'required|array|min:1',
            'items.*.id'      => 'required|integer',
            'items.*.name'    => 'required|string',
            'items.*.price'   => 'required|numeric',
            'items.*.qty'     => 'required|integer|min:1',
        ]);

        // ✅ Tính tổng tiền
        $total = collect($data['items'])->sum(fn($i) => $i['price'] * $i['qty']);

        // ✅ Tạo đơn hàng
        $order = Order::create([
            'name'     => $data['customer_name'],
            'phone'    => $data['phone'],
            'email'    => $data['email'],
            'address'  => $data['address'],
            'user_id'  => Auth::id() ?? null,
            'status'   => 0,  // pending
            'note'     => "Tổng đơn: {$total} đ",
        ]);

        // ✅ Thêm chi tiết đơn hàng
        foreach ($data['items'] as $item) {
            OrderDetail::create([
                'order_id'   => $order->id,
                'product_id' => $item['id'],
                'price_buy'  => $item['price'],                  // 👈 khớp DB
                'qty'        => $item['qty'],                    // 👈 khớp DB
                'amount'     => $item['price'] * $item['qty'],   // 👈 khớp DB
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
        ->withSum('details as total', 'amount'); // ✅ alias ra cột total

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


    public function show(Order $order)
{
    $order->load(['details.product:id,name,thumbnail'])
          ->loadSum('details as total', 'amount');

    return response()->json([
        'id'         => $order->id,
        'name'       => $order->name,
        'email'      => $order->email,
        'phone'      => $order->phone,
        'address'    => $order->address,
        'note'       => $order->note,
        'status'     => (int)($order->status ?? 0),
        'total'      => (float)$order->total,
        'created_at' => $order->created_at,
        'updated_at' => $order->updated_at,
        'items'      => $order->details->map(function ($d) {
            $p = $d->product;
            return [
                'id'            => $d->id,
                'product_id'    => $d->product_id,
                'name'          => $p?->name ?? 'Sản phẩm',
                // ✅ THỐNG NHẤT TRẢ thumbnail_url
                'thumbnail_url' => $p?->thumbnail_url ?? $p?->thumbnail,
                'price'         => (float)$d->price_buy,
                'qty'           => (int)$d->qty,
                'subtotal'      => (float)($d->amount ?? $d->price_buy * $d->qty),
            ];
        })->values(),
    ]);
}
// App\Http\Controllers\Api\OrderController.php

public function track(Request $r)
{
    $code  = $r->query('code');
    $phone = $r->query('phone');

    if (!$code) {
        return response()->json(['message' => 'Missing code'], 422);
    }

    $q = Order::query();
    if (ctype_digit((string)$code)) $q->where('id', (int)$code);
    else $q->where('code', $code);

    if ($phone) $q->where('phone', 'like', '%'.$phone.'%');

    $order = $q->first();
    if (!$order) return response()->json(['message'=>'Order not found'], 404);

    $order->load(['details.product:id,name,thumbnail'])
          ->loadSum('details as total', 'amount');

    $items = $order->details->map(function ($d) {
        $p = $d->product;
        return [
            'id'            => $d->id,
            'product_id'    => $d->product_id,
            'name'          => $p?->name ?? 'Sản phẩm',
            // ✅ THỐNG NHẤT TRẢ thumbnail_url
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
        'total'        => (float)$order->total,
        'items'        => $items,
    ]);
}


    public function updateStatusStep(Request $request, Order $order)
{
    $status = $request->input('status_step') ?? $request->input('status');

    $map = [
        'pending'   => 0,
        'confirmed' => 1,
        'ready'     => 2,
        'shipping'  => 3,
        'delivered' => 4,
    ];

    // chuẩn hóa key
    $statusKey = strtolower($status);
    $order->status_step = $statusKey;
    $order->step_code   = $map[$statusKey] ?? 0;

    // set timestamp nếu có
    if ($statusKey === 'confirmed') $order->confirmed_at = now();
    if ($statusKey === 'ready')     $order->ready_at = now();
    if ($statusKey === 'shipping')  $order->shipped_at = now();
    if ($statusKey === 'delivered') $order->delivered_at = now();

    $order->save();

    return response()->json($order);
}


public function updateStatusStepById(Request $r) {
    $order = Order::findOrFail($r->id);
    return $this->updateStatusStep($order, $r);
}

}
