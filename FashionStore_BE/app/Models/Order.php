<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $table = 'nqtv_order';
    protected $primaryKey = 'id';
    public $timestamps = true;

    // protected $fillable = [
    //     'user_id',
    //     'name',
    //     'phone',
    //     'email',
    //     'address',
    //     'note',
    //     'status',
    //     'updated_by',
    //     // khuyên nên có:
    //     'total',
    //     'payment_method',
    //     'created_by',
    //     'status_step', 
    //     'step_code',
    // ];

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'address',
        'note',
        'status',
        'updated_by',
        'total',
        'payment_method',     // + đã có thể dùng: 'cod' | 'momo'
        'payment_status',     // + 'pending' | 'paid' | 'failed' | 'canceled'
        'momo_trans_id',      // + transId từ MoMo
        'momo_request_id',    // + requestId đã gửi đi
        'created_by',
        'status_step',
        'step_code',
    ];


    // Quan hệ gốc bạn đang dùng
    public function details()
    {
        return $this->hasMany(OrderDetail::class, 'order_id');
    }

    // Alias để FE dùng 'items'
    public function items()
    {
        return $this->hasMany(OrderDetail::class, 'order_id');
    }



    public function show(Order $order)
    {
        // nạp details + product để lấy ảnh, đồng thời tính total từ amount
        $order->load(['details.product:id,thumbnail,name'])
            ->loadSum('details as total', 'amount');

        // map về schema FE đang dùng (OrderDetail.jsx)
        $resp = [
            'id'         => $order->id,
            'name'       => $order->name,
            'email'      => $order->email,
            'phone'      => $order->phone,
            'address'    => $order->address,
            'note'       => $order->note,
            'status'     => (int)($order->status ?? 0),
            'total'      => (float)($order->total ?? $order->total), // total do loadSum alias
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'items'      => $order->details->map(function ($d) {
                $p = $d->product; // có thể null nếu SP bị xóa
                $image = $p?->thumbnail_url ?? $p?->thumbnail;

                return [
                    'id'            => $d->id,
                    'product_id'    => $d->product_id,
                    // ưu tiên tên hiện tại của product; fallback tên snapshot nếu bạn có cột đó
                    'product_name'  => $p?->name ?? ($d->product_name ?? 'Sản phẩm'),
                    'product_image' => $image,                     // ← ẢNH lấy từ bảng products
                    'price'         => (float)$d->price_buy,       // map price_buy -> price
                    'qty'           => (int)$d->qty,
                    'subtotal'      => (float)($d->amount ?? $d->price_buy * $d->qty), // map amount -> subtotal
                ];
            })->values(),
        ];

        return response()->json($resp);
    }
}
