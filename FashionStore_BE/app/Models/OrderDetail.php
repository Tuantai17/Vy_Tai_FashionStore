<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    protected $table = 'nqtv_orderdetail'; // đúng theo DB của bạn

    // Nếu bảng có cột id tự tăng: có thể bỏ 2 dòng dưới.
    // Nếu KHÔNG dùng 'id' (ví dụ không có PK, hoặc PK khác),
    // hãy khai báo cho đúng, vd:
    // protected $primaryKey = 'id';    // sửa nếu khác
    // public $incrementing = true;     // hoặc false nếu không tự tăng
    // protected $keyType = 'int';

    protected $fillable = [
        'order_id',
        'product_id',
        'price_buy',
        'qty',
        'amount',
    ];

    public $timestamps = false;

    // Quan hệ tiện dụng
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // (không bắt buộc) ép kiểu số để withSum/tính toán ổn định
    protected $casts = [
        'price_buy' => 'float',
        'qty'       => 'int',
        'amount'    => 'float',
    ];

}
