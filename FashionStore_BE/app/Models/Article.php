<?php


//tin tuc


namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'source',
        'author',
        'url',
        'image_url',
        'summary',
        'content_html',
        'published_at'
    ];
    protected $casts = ['published_at' => 'datetime'];
}
