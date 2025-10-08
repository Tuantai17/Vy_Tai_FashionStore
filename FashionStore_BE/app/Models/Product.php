<?php

// namespace App\Models;

// use Illuminate\Database\Eloquent\Model;

// class Product extends Model
// {
//     protected $table = 'nqtv_product';
//     protected $primaryKey = 'id';
//     public $timestamps = true;

//     protected $fillable = [
//         'category_id',
//         'brand_id',
//         'name',
//         'slug',
//         'price_root',
//         'price_sale',
//         'thumbnail',
//         'qty',
//         'detail',
//         'description',
//         'status',
//     ];

//     protected $casts = [
//         'price_root' => 'float',
//         'price_sale' => 'float',
//     ];

//     // ✅ Không ẩn thumbnail nữa, để append thêm url
//     protected $appends = ['thumbnail_url'];

//     public function getThumbnailUrlAttribute()
//     {
//         if (!$this->thumbnail) {
//             return asset('assets/images/no-image.png');
//         }

//         $path = ltrim($this->thumbnail, '/');

//         if (str_starts_with($path, 'http')) {
//             return $path;
//         }

//         if (str_starts_with($path, 'assets/')) {
//             return asset($path);
//         }

//         return asset('assets/images/' . $path);
//     }
// }

// lay đc anh dashboad

// namespace App\Models;

// use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Illuminate\Database\Eloquent\Model;

// class Product extends Model
// {
//     use HasFactory;

//     protected $table = 'nqtv_product';
//     protected $primaryKey = 'id';
//     public $timestamps = true;

//     protected $fillable = [
//         'category_id',
//         'brand_id',
//         'name',
//         'slug',
//         'price_root',
//         'price_sale',
//         'thumbnail',
//         'qty',
//         'detail',
//         'description',
//         'status',
//         'created_by',
//         'updated_by',
//     ];

//     protected $casts = [
//         'price_root' => 'float',
//         'price_sale' => 'float',
//         'qty'        => 'integer',
//         'status'     => 'integer',
//     ];

//     // Thuộc tính ảo trả ra API
//     protected $appends = ['thumbnail_url', 'brand_name'];

//     // ================== Quan hệ ==================
//     public function brand()
//     {
//         return $this->belongsTo(Brand::class, 'brand_id');
//     }

//     // ================== Accessors ==================

//     /**
//      * URL đầy đủ của ảnh thumbnail.
//      *
//      * Ưu tiên:
//      * 1. Nếu giá trị đã là URL tuyệt đối (http/https) -> trả nguyên
//      * 2. Nếu nằm trong public/assets/... -> asset()
//      * 3. Nếu lưu bằng store('products','public') -> /storage/<path>
//      * 4. Nếu rỗng -> trả placeholder
//      */
//     public function getThumbnailUrlAttribute(): ?string
//     {
//         $thumb = $this->thumbnail;

//         if (!$thumb) {
//             return asset('assets/images/no-image.png');
//         }

//         // 1) Đã là URL tuyệt đối
//         if (preg_match('~^https?://~i', $thumb)) {
//             return $thumb;
//         }

//         $path = ltrim($thumb, '/');

//         // 2) Ảnh đặt trong thư mục public/assets
//         if (str_starts_with($path, 'assets/')) {
//             return asset($path);
//         }

//         // 3) Ảnh lưu qua store('products','public')
//         return url('storage/' . $path);
//     }

//     /**
//      * Lấy tên brand để FE hiển thị nhanh.
//      */
//     public function getBrandNameAttribute(): ?string
//     {
//         return optional($this->brand)->name;
//     }
// }



namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;
    protected $table = 'nqtv_product';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'price_root',
        'price_sale',
        'thumbnail',
        'qty',
        'detail',
        'description',
        'status',
        'created_by',
        'updated_by', // 👈 giữ nguyên + đảm bảo có để fill/update được
    ];

    protected $casts = [
        'price_root' => 'float',
        'price_sale' => 'float',
        'qty'        => 'int',   // 👈 bổ sung để ép kiểu số nguyên khi trả về
        'status'     => 'int',   // 👈 bổ sung để tiện lọc/trạng thái
    ];

    // ✅ Thuộc tính ảo để FE dùng trực tiếp
    protected $appends = ['thumbnail_url', 'brand_name'];

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id');
    }

    public function getBrandNameAttribute()
    {
        return optional($this->brand)->name; // "Nike", "Levis", ...
    }

    public function getThumbnailUrlAttribute()
{
    if (!$this->thumbnail) {
        return asset('assets/images/no-image.png'); // ảnh mặc định
    }

    $path = ltrim($this->thumbnail, '/');

    // 1) Nếu đã là full URL
    if (preg_match('~^https?://~i', $path)) {
        return $path;
    }

    // 2) Nếu tồn tại trong storage/app/public (ảnh upload mới)
    if (Storage::disk('public')->exists($path)) {
        return asset('storage/' . $path);
    }

    // 3) Nếu đường dẫn bắt đầu bằng assets/... (ảnh cũ nằm trong /public/assets/images)
    if (str_starts_with($path, 'assets/')) {
        return asset($path);
    }

    // 4) Nếu tồn tại trong thư mục public/images hoặc assets/images
    if (file_exists(public_path($path))) {
        return asset($path);
    }

    if (file_exists(public_path('assets/images/' . $path))) {
        return asset('assets/images/' . $path);
    }

    // 5) fallback cuối cùng
    return asset('assets/images/no-image.png');
}


}
