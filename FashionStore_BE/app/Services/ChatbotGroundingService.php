<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Article;
use App\Models\Review;

class ChatbotGroundingService
{
    public function buildContext(string $userMessage): string
    {
        $relatedProducts = Product::query()
            ->where('name', 'LIKE', "%{$userMessage}%")
            ->orWhere('description', 'LIKE', "%{$userMessage}%")
            ->limit(3)
            ->get(['name', 'price_sale', 'description'])
            ->map(fn($p) => "- {$p->name}: {$p->price_sale}  {$p->description}")
            ->join("\n");

        $relatedArticles = Article::query()
            ->where('title', 'LIKE', "%{$userMessage}%")
            ->orWhere('summary', 'LIKE', "%{$userMessage}%")
            ->limit(2)
            ->get()
            ->map(fn($a) => "- {$a->title}: {$a->summary}")
            ->join("\n");

        $relatedReviews = Review::query()
            ->where('comment', 'LIKE', "%{$userMessage}%")
            ->limit(2)
            ->get()
            ->map(fn($r) => "- ({$r->rating}/5) {$r->comment}")
            ->join("\n");

        return <<<TXT
Dưới đây là dữ liệu thật từ hệ thống:

[Sản phẩm liên quan]
{$relatedProducts}

[Bài viết / tin tức liên quan]
{$relatedArticles}

[Đánh giá liên quan]
{$relatedReviews}
TXT;
    }

    /**
     * Very small intent extractor used by the Gemini controller.
     * Returns an array with possible 'budget' (int, VND) and 'keywords' (array of strings).
     */
    public function extractIntent(string $userMessage): array
    {
        $msg = mb_strtolower($userMessage ?? '');

        $signals = ['budget' => null, 'keywords' => []];

        if (preg_match('/([0-9]+(?:[\\.,][0-9]+)?)\\s*(k|kho|nghìn|nghin|triệu|tr|m|đ|vnd)?/iu', $msg, $m)) {
            $numRaw = $m[1] ?? null;
            $unit = $m[2] ?? null;
            if ($numRaw !== null) {
                $normalized = str_replace(['.', ','], ['', '.'], $numRaw);
                $normalized = preg_replace('/[^0-9\\.]/', '', $normalized);
                $value = is_numeric($normalized) ? (float) $normalized : null;
                if ($value !== null) {
                    $budget = (int) round($value);
                    if ($unit) {
                        $unit = trim($unit);
                        if (mb_stripos($unit, 'tri') !== false) $budget *= 1000000;
                        elseif (mb_stripos($unit, 'k') !== false || mb_stripos($unit, 'ngh') !== false) $budget *= 1000;
                        elseif (mb_stripos($unit, 'm') !== false) $budget *= 1000000;
                    }
                    $signals['budget'] = $budget;
                }
            }
        }

        $clean = preg_replace('/[^\\p{L}0-9\\s]+/u', ' ', $msg);
        $parts = array_filter(array_map('trim', preg_split('/\\s+/', $clean)));
        $stop = ['cho', 'cái', 'là', 'và', 'cần', 'muốn', 'tôi', 'mình', 'giúp', 'với', 'có', 'theo', 'trong', 'đi', 'gì', 'làm', 'không', 'có'];
        $keywords = [];
        foreach ($parts as $p) {
            if (mb_strlen($p) < 2) continue;
            if (in_array($p, $stop, true)) continue;
            $keywords[] = $p;
            if (count($keywords) >= 8) break;
        }
        $signals['keywords'] = array_values(array_unique($keywords));

        return $signals;
    }
}
