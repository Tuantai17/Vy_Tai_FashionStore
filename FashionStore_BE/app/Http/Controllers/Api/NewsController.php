<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Article;

class NewsController extends Controller
{
    // GET /api/news
    public function index(Request $req)
    {
        $q = Article::query()->when($req->filled('tag'), function ($qq) use ($req) {
            $qq->whereJsonContains('tags', $req->string('tag'));
        })->where('is_published', true)->latest('published_at');

        return $q->paginate($req->integer('per_page', 12));
    }

    // GET /api/news/{slug}
    public function show($slug)
    {
        return Article::where('slug', $slug)->firstOrFail();
    }

    // POST /api/news  (n8n sẽ gọi)
    public function store(Request $req)
    {
        $data = $req->validate([
            'title'        => 'required|string|max:200',
            'slug'         => 'required|string|max:220|unique:articles,slug',
            'excerpt'      => 'nullable|string|max:500',
            'content_md'   => 'nullable|string',
            'content_html' => 'required|string',
            'cover_image'  => 'nullable|string',
            'tags'         => 'nullable|array',
            'tags.*'       => 'string|max:40',
            'category_id'  => 'nullable|exists:categories,id',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'seo_title'    => 'nullable|string|max:70',
            'seo_desc'     => 'nullable|string|max:160',
            'source_url'   => 'nullable|string',
        ]);

        $article = Article::create([
            'title'        => $data['title'],
            'slug'         => $data['slug'],
            'excerpt'      => $data['excerpt'] ?? null,
            'content_md'   => $data['content_md'] ?? null,
            'content_html' => $data['content_html'],
            'cover_image'  => $data['cover_image'] ?? null,
            'tags'         => $data['tags'] ?? [],
            'category_id'  => $data['category_id'] ?? null,
            'is_published' => $data['is_published'] ?? true,
            'published_at' => $data['published_at'] ?? now(),
            'meta'         => [
                'seo_title' => $data['seo_title'] ?? null,
                'seo_desc'  => $data['seo_desc'] ?? null,
                'source_url' => $data['source_url'] ?? null,
            ],
            'author_id'    => optional($req->user())->id, // có thể null nếu bạn cho phép
        ]);

        return response()->json(['id' => $article->id, 'slug' => $article->slug], 201);
    }

    // PUT /api/news/{id} (tuỳ chọn)
    public function update(Request $req, $id)
    {
        $a = Article::findOrFail($id);
        $data = $req->validate([
            'title'        => 'sometimes|string|max:200',
            'slug'         => 'sometimes|string|max:220|unique:articles,slug,' . $a->id,
            'excerpt'      => 'nullable|string|max:500',
            'content_md'   => 'nullable|string',
            'content_html' => 'sometimes|string',
            'cover_image'  => 'nullable|string',
            'tags'         => 'nullable|array',
            'tags.*'       => 'string|max:40',
            'category_id'  => 'nullable|exists:categories,id',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'seo_title'    => 'nullable|string|max:70',
            'seo_desc'     => 'nullable|string|max:160',
        ]);
        $a->fill($data)->save();
        return $a->refresh();
    }
}
