<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $table = 'nqtv_category'; // ✅ trỏ đúng bảng trong DB

    protected $fillable = ['name', 'slug', 'image', 'parent_id', 'sort_order', 'description'];

    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }
}



// namespace App\Models;

// use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes;

// class Category extends Model
// {
//     use HasFactory, SoftDeletes;

//     // Tên bảng đúng trong database
//     protected $table = 'nqtv_category';

//     // Cho phép gán hàng loạt các trường này
//     protected $fillable = [
//         'name',
//         'slug',
//         'image',
//         'parent_id',
//         'sort_order',
//         'description',
//         'created_by',
//         'updated_by',
//         'status'
//     ];

//     // Ép kiểu dữ liệu khi lấy ra
//     protected $casts = [
//         'status'     => 'boolean',
//         'parent_id'  => 'integer',
//         'sort_order' => 'integer',
//     ];

//     /**
//      * Quan hệ: Danh mục cha
//      */
//     public function parent()
//     {
//         return $this->belongsTo(self::class, 'parent_id');
//     }

//     /**
//      * Quan hệ: Danh mục có nhiều sản phẩm
//      */
//     public function products()
//     {
//         return $this->hasMany(Product::class, 'category_id');
//     }
// }
