<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// use Illuminate\Database\Eloquent\SoftDeletes; // nếu muốn xoá mềm thì bật

class Category extends Model
{
    use HasFactory;
    // use SoftDeletes;

    protected $table = 'nqtv_category';

    protected $fillable = [
        'name',
        'slug',
        'image',        // chỉ lưu tên file (vd: ao.jpg) hoặc đường dẫn tuỳ bạn
        'parent_id',
        'sort_order',
        'description',
        'created_by',
        'updated_by',
        'status',       // 0/1
    ];

    protected $casts = [
        'parent_id'  => 'integer',
        'sort_order' => 'integer',
        'status'     => 'integer', // hoặc 'boolean' nếu bạn muốn true/false
    ];

    // FE nhận thêm field image_url luôn
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) return null;

        // Nếu DB đã lưu URL tuyệt đối thì trả nguyên
        if (str_starts_with($this->image, 'http://')
            || str_starts_with($this->image, 'https://')
            || str_starts_with($this->image, '/')) {
            return $this->image;
        }

        // Bạn đang để ảnh trong public/assets/images
        return url('assets/images/' . ltrim($this->image, '/'));

        // Nếu sau này chuyển sang storage:
        // return asset('storage/' . ltrim($this->image, '/'));
    }

    // Quan hệ sản phẩm (giữ nguyên)
    public function products()
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    // Tuỳ chọn: nếu cần dùng cây danh mục:
    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }
    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
