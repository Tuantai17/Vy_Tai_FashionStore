<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    // Tên bảng trong DB
    protected $table = 'nqtv_orderdetail';

    // Các cột cho phép gán dữ liệu
    protected $fillable = [
        'order_id',
        'product_id',
        'price_buy',
        'qty',
        'amount',
    ];

    // ❌ Bảng này không có created_at, updated_at
    public $timestamps = false;
}
