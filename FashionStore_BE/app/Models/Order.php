<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $table = 'nqtv_order';   // ✅ tên bảng thật
    protected $primaryKey = 'id';      // ✅ khóa chính
    public $timestamps = true;         // có created_at, updated_at

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'address',
        'note',
        'status',
        'updated_by',
    ];

    // Quan hệ: 1 order có nhiều order detail
    public function details()
    {
        return $this->hasMany(OrderDetail::class, 'order_id');
    }
}
