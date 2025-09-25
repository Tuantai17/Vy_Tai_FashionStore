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
