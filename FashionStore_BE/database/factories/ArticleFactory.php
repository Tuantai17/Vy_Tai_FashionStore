<?php

namespace Database\Factories;

use App\Models\Article;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ArticleFactory extends Factory
{
    protected $model = Article::class;

    public function definition(): array
    {
        $title = $this->faker->sentence(6);

        return [
            'title' => $title,
            // có boot()->creating() nên có/không có slug đều được,
            // nhưng ta set luôn cho tiện test độc lập:
            'slug'  => Str::slug($title),
            'excerpt' => $this->faker->paragraph(2),
            'content_html' => '<p>' . $this->faker->paragraphs(3, true) . '</p>',
            'cover_image' => null,
            'source_url'  => null,
            'tags' => ['thoi-trang', 'xu-huong'],
            'seo_title' => substr($title, 0, 70),
            'seo_desc'  => substr($this->faker->sentence(25), 0, 160),
            'category_id' => null,
            'author_id' => null,
            'is_published' => true,
            'published_at' => now(),
            'meta' => null,
        ];
    }
}
