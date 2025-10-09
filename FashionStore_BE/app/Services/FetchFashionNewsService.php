<?php
//tin tuc
namespace App\Services;

use App\Models\Article;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class FetchFashionNewsService
{
    private array $feeds = [
        ['source' => 'Vogue',          'url' => 'https://www.vogue.com/rss'],
        ['source' => 'Elle',           'url' => 'https://www.elle.com/rss/all.xml/'],
        ['source' => 'Harper’s Bazaar', 'url' => 'https://www.harpersbazaar.com/rss/all.xml/'],
        ['source' => 'NYTimes Fashion', 'url' => 'https://rss.nytimes.com/services/xml/rss/nyt/FashionandStyle.xml'],
    ];

    public function run(int $limitPerFeed = 20): int
    {
        $created = 0;

        foreach ($this->feeds as $feed) {
            try {
                $res = Http::timeout(20)->get($feed['url']);
                if (!$res->ok()) continue;

                $xml = @simplexml_load_string($res->body(), "SimpleXMLElement", LIBXML_NOCDATA);
                if (!$xml) continue;

                $items = $xml->channel->item ?? $xml->entry ?? [];

                $count = 0;
                foreach ($items as $item) {
                    if ($count >= $limitPerFeed) break;

                    $title = (string)($item->title ?? '');
                    $link  = (string)($item->link['href'] ?? $item->link ?? '');
                    $desc  = (string)($item->description ?? $item->summary ?? '');
                    $content = (string)($item->children('content', true)->encoded ?? $item->content ?? $desc);
                    $author = (string)($item->author->name ?? $item->author ?? '');
                    $pub    = (string)($item->pubDate ?? $item->updated ?? $item->published ?? '');
                    $image  = $this->extractImage($item, $content, $desc);

                    if (!$title || !$link) continue;
                    if (Article::where('url', $link)->exists()) continue;

                    $slug = Str::slug(Str::limit($title, 80, ''));
                    if (Article::where('slug', $slug)->exists()) {
                        $slug .= '-' . Str::random(5);
                    }

                    Article::create([
                        'title'        => html_entity_decode($title),
                        'slug'         => $slug,
                        'source'       => $feed['source'],
                        'author'       => $author ?: null,
                        'url'          => $link,
                        'image_url'    => $image,
                        'summary'      => strip_tags($desc),
                        'content_html' => $content ?: null,
                        'published_at' => $pub ? date('Y-m-d H:i:s', strtotime($pub)) : now(),
                    ]);
                    $created++;
                    $count++;
                }
            } catch (\Throwable $e) {
                // \Log::warning($e->getMessage());
                continue;
            }
        }

        return $created;
    }

    private function extractImage($item, string $html, string $desc): ?string
    {
        if (isset($item->enclosure) && (string)$item->enclosure['url']) {
            return (string)$item->enclosure['url'];
        }

        $media = $item->children('media', true);
        if (isset($media->content) && (string)$media->content->attributes()->url) {
            return (string)$media->content->attributes()->url;
        }

        if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html ?: $desc, $m)) {
            return $m[1];
        }

        return null;
    }
}
