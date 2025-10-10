<?php
// app/Models/Category.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Category extends Model
{
    use SoftDeletes;

    protected $table = 'nqtv_category';

    protected $fillable = [
        'name','slug','image','parent_id','sort_order','description',
        'created_by','updated_by','status',
    ];

    protected $casts = [
        'parent_id'  => 'integer',
        'sort_order' => 'integer',
        'status'     => 'integer',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        // if (!$this->image) return null;

        if (!$this->image) {
            return asset('assets/images/no-image.png'); // ảnh mặc định
        }

        $path = ltrim($this->image, '/');

        // Đã là URL tuyệt đối hoặc đường dẫn bắt đầu bằng /
        // if (preg_match('#^(https?://|/)#', $this->image)) {
        //     return $this->image;
        // }

        if (preg_match('~^https?://~i', $path)) {
        return $path;
    }
        // Ảnh lưu trên disk public (storage/app/public/...)
        // if (Storage::disk('public')->exists($this->image)) {
        //     return Storage::url($this->image);   // -> /storage/categories/abc.png
        // }

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
        
        // Dự phòng: ảnh cũ còn nằm trong public/assets/images
        // return url('assets/images/' . ltrim($this->image, '/'));
    }
}
