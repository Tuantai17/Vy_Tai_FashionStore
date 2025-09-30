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
        // optional filters
        $status   = $request->integer('status', null);
        $search   = $request->string('search')->toString();
        $perPage  = max(1, min(100, (int) $request->get('per_page', 20)));

        $q = Order::query()
            ->withCount('details')                   // details_count
            ->withSum('details as total', 'amount'); // tổng tiền từ order_details.amount

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
        $order->load(['details.product:id,thumbnail,name'])
            ->loadSum('details as total', 'amount');

        return response()->json([
            'id'         => $order->id,
            'name'       => $order->name,
            'email'      => $order->email,
            'phone'      => $order->phone,
            'address'    => $order->address,
            'note'       => $order->note,
            'status'     => (int)($order->status ?? 0),
            'total'      => (float)$order->total,  // alias từ loadSum
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'items'      => $order->details->map(function ($d) {
                $p = $d->product;                          // có thể null nếu bị xóa
                $img = $p?->thumbnail_url ?? $p?->thumbnail;
                return [
                    'id'            => $d->id,
                    'product_id'    => $d->product_id,
                    'product_name'  => $p?->name ?? 'Sản phẩm',
                    'product_image' => $img,               // ẢNH (không tạo cột)
                    'price'         => (float)$d->price_buy,
                    'qty'           => (int)$d->qty,
                    'subtotal'      => (float)($d->amount ?? $d->price_buy * $d->qty),
                ];
            })->values(),
        ]);
    }
}
