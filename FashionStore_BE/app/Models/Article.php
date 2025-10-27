<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory;

    protected $table = 'articles';

    /**
     * Các cột cho phép gán hàng loạt (mass assignment)
     */
    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content_html',
        'content_md',
        'cover_image',
        'source_url',
        'tags',
        'seo_title',
        'seo_desc',
        'category_id',
        'author_id',
        'is_published',
        'published_at',
        'meta'
    ];

    /**
     * Các cột cần chuyển đổi kiểu dữ liệu
     */
    protected $casts = [
        'tags' => 'array',
        'meta' => 'array',
        'is_published' => 'boolean',
        'published_at' => 'datetime',
    ];

    /**
     * Tự động tạo slug khi chưa có
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title, '-');
            }
        });
    }

    /**
     * Quan hệ: mỗi bài viết có thể thuộc một category
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Quan hệ: mỗi bài viết có thể có một tác giả (user)
     */
    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Trả về URL đầy đủ của ảnh đại diện (cover)
     */
    public function getCoverImageUrlAttribute()
    {
        if (!$this->cover_image) {
            return asset('images/default-news.jpg'); // ảnh mặc định
        }

        // Nếu đã là URL tuyệt đối, trả nguyên
        if (Str::startsWith($this->cover_image, ['http://', 'https://'])) {
            return $this->cover_image;
        }

        // Nếu là đường dẫn tương đối, thêm base URL
        return asset('storage/' . ltrim($this->cover_image, '/'));
    }

    /**
     * Scope lọc bài đã publish
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope lọc theo tag
     */
    public function scopeHasTag($query, $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }
}
