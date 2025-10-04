<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    // Tên bảng review
    protected $table = 'nqtv_reviews';

    // Các cột cho phép fill
    protected $fillable = [
        'user_id',
        'product_id',
        'rating',
        'comment',
        'is_verified',
    ];

    // Cast kiểu dữ liệu
    protected $casts = [
        'rating'      => 'integer',
        'is_verified' => 'boolean',
    ];

    // ================= Quan hệ =================

    // Người viết review
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Sản phẩm được review
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}