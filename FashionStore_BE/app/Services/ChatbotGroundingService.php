<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Article;
use App\Models\Review;
use Illuminate\Support\Str;

class ChatbotGroundingService
{
    public function buildContext(
        string $userMessage,
        ?int $budget = null,
        array $signals = [],
        int $limitProducts = 5,
        int $limitArticles = 2,
        int $limitReviews = 2
    ): string {
        $terms = $this->buildSearchTerms($userMessage, $signals['keywords'] ?? []);
        $minBudget = $signals['budget_min'] ?? null;
        $maxBudget = $signals['budget_max'] ?? null;

        if ($minBudget === null && $maxBudget === null && $budget !== null) {
            $minBudget = (int) max(0, round($budget * 0.8));
            $maxBudget = (int) round($budget * 1.2);
        }

        $products = Product::query()
            ->when($minBudget !== null && $maxBudget !== null, function ($q) use ($minBudget, $maxBudget) {
                $q->whereBetween('price_sale', [$minBudget, $maxBudget]);
            })
            ->when($minBudget !== null && $maxBudget === null, function ($q) use ($minBudget) {
                $q->where('price_sale', '>=', $minBudget);
            })
            ->when($maxBudget !== null && $minBudget === null, function ($q) use ($maxBudget) {
                $q->where('price_sale', '<=', $maxBudget);
            })
            ->when(!empty($terms), function ($q) use ($terms) {
                $q->where(function ($sub) use ($terms) {
                    foreach ($terms as $term) {
                        $like = $this->likeTerm($term);
                        $sub->orWhere('name', 'LIKE', $like)
                            ->orWhere('description', 'LIKE', $like);
                    }
                });
            })
            ->orderBy('price_sale')
            ->limit($limitProducts)
            ->get(['id', 'name', 'price_sale', 'description']);

        if ($products->isEmpty() && trim($userMessage) !== '') {
            $fallbackTerm = $this->likeTerm($userMessage);
            $products = Product::query()
                ->where(function ($q) use ($fallbackTerm) {
                    $q->where('name', 'LIKE', $fallbackTerm)
                        ->orWhere('description', 'LIKE', $fallbackTerm);
                })
                ->orderBy('price_sale')
                ->limit($limitProducts)
                ->get(['id', 'name', 'price_sale', 'description']);
        }

        $relatedProducts = $products->map(function ($p) {
            $price = $this->formatVnd($p->price_sale);
            $desc  = $this->ellipsis((string) $p->description, 90);
            return "- {$p->name} | {$price}" . ($desc ? "\n  Mo ta: {$desc}" : '');
        })->implode("\n");

        $articles = Article::query()
            ->when(!empty($terms), function ($q) use ($terms) {
                $q->where(function ($sub) use ($terms) {
                    foreach ($terms as $term) {
                        $like = $this->likeTerm($term);
                        $sub->orWhere('title', 'LIKE', $like)
                            ->orWhere('summary', 'LIKE', $like);
                    }
                });
            })
            ->orderByDesc('id')
            ->limit($limitArticles)
            ->get(['title', 'summary']);

        $relatedArticles = $articles->map(function ($a) {
            $sum = $this->ellipsis((string) $a->summary, 120);
            return "- {$a->title}" . ($sum ? "\n  Tom tat: {$sum}" : '');
        })->implode("\n");

        $reviews = Review::query()
            ->when(!empty($terms), function ($q) use ($terms) {
                $q->where(function ($sub) use ($terms) {
                    foreach ($terms as $term) {
                        $like = $this->likeTerm($term);
                        $sub->orWhere('comment', 'LIKE', $like);
                    }
                });
            })
            ->orderByDesc('id')
            ->limit($limitReviews)
            ->get(['rating', 'comment']);

        $relatedReviews = $reviews->map(function ($r) {
            $cmt = $this->ellipsis((string) $r->comment, 100);
            return "- ({$r->rating}/5) {$cmt}";
        })->implode("\n");

        if ($relatedProducts === '' && $relatedArticles === '' && $relatedReviews === '') {
            return '';
        }

        $lines = [];
        $lines[] = 'Du lieu noi bo vua tim thay, dung de tu van chinh xac:';
        if ($relatedProducts !== '') {
            $lines[] = '[San pham lien quan]';
            $lines[] = $relatedProducts;
        }
        if ($relatedArticles !== '') {
            $lines[] = '[Bai viet / tin tuc lien quan]';
            $lines[] = $relatedArticles;
        }
        if ($relatedReviews !== '') {
            $lines[] = '[Danh gia lien quan]';
            $lines[] = $relatedReviews;
        }

        return implode("\n", $lines);
    }

    public function extractIntent(string $userMessage): array
    {
        $msg = mb_strtolower($userMessage ?? '');

        $signals = ['budget' => null, 'keywords' => []];

        // Lấy số CUỐI CÙNG + nhân đơn vị
        if (preg_match_all('/(\d+(?:[\\.,]\d+)?)\s*(k|ngan|ngàn|nghìn|nghin|triệu|tr|m|đ|vnd)?/iu', $msg, $matches, PREG_SET_ORDER)) {
            $last = end($matches);
            $numRaw = $last[1] ?? null;
            $unit   = $last[2] ?? null;

            if ($numRaw !== null) {
                $normalized = str_replace(['.', ','], ['', '.'], $numRaw);
                $normalized = preg_replace('/[^0-9\\.]/', '', $normalized);
                $value = is_numeric($normalized) ? (float) $normalized : null;

                if ($value !== null) {
                    $budget = (int) round($value);
                    if ($unit) {
                        $u = trim(mb_strtolower($unit));
                        if (Str::contains($u, ['tri', 'tr', 'm'])) {
                            $budget *= 1_000_000;
                        } elseif (Str::contains($u, ['k', 'ngan', 'ngàn', 'nghìn', 'nghin'])) {
                            $budget *= 1_000;
                        }
                    }
                    $signals['budget'] = $budget;
                    // mặc định đặt khoảng +/-20%
                    $signals['budget_min'] = (int) max(0, round($budget * 0.8));
                    $signals['budget_max'] = (int) round($budget * 1.2);
                }
            }
        }

        // ------ parse comparative expressions: 'dưới X', 'trên X', 'từ X đến Y', 'X-Y' ------
        if (preg_match('/dưới\s*(\d+[\d\.,]*)\s*(k|tr|triệu|ngàn|nghìn|vnd|đ)?/iu', $msg, $m)) {
            $v = $this->normalizeNumber($m[1]);
            $unit = $m[2] ?? null;
            $v = $this->applyUnit($v, $unit);
            $signals['budget_min'] = 0;
            $signals['budget_max'] = (int) $v;
        } elseif (preg_match('/trên\s*(\d+[\d\.,]*)\s*(k|tr|triệu|ngàn|nghìn|vnd|đ)?/iu', $msg, $m)) {
            $v = $this->normalizeNumber($m[1]);
            $unit = $m[2] ?? null;
            $v = $this->applyUnit($v, $unit);
            $signals['budget_min'] = (int) $v;
            // leave budget_max null
        } elseif (preg_match('/từ\s*(\d+[\d\.,]*)\s*(k|tr|triệu|ngàn|nghìn|vnd|đ)?\s*(đến|\-|tới)\s*(\d+[\d\.,]*)\s*(k|tr|triệu|ngàn|nghìn|vnd|đ)?/iu', $msg, $m)) {
            $v1 = $this->applyUnit($this->normalizeNumber($m[1]), $m[2] ?? null);
            $v2 = $this->applyUnit($this->normalizeNumber($m[5]), $m[6] ?? null);
            if ($v1 > $v2) {
                $tmp = $v1;
                $v1 = $v2;
                $v2 = $tmp;
            }
            $signals['budget_min'] = (int) $v1;
            $signals['budget_max'] = (int) $v2;
        } elseif (preg_match('/(\d+[\d\.,]*)\s*[-–]\s*(\d+[\d\.,]*)/u', $msg, $m)) {
            $v1 = $this->normalizeNumber($m[1]);
            $v2 = $this->normalizeNumber($m[2]);
            if ($v1 > $v2) {
                $tmp = $v1;
                $v1 = $v2;
                $v2 = $tmp;
            }
            $signals['budget_min'] = (int) $v1;
            $signals['budget_max'] = (int) $v2;
        }

        // Keywords
        $clean = preg_replace('/[^\p{L}0-9\s]+/u', ' ', $msg);
        $parts = array_values(array_filter(array_map('trim', preg_split('/\s+/', $clean))));
        $stop  = ['cho', 'cái', 'là', 'và', 'cần', 'muốn', 'tôi', 'mình', 'giúp', 'với', 'có', 'theo', 'trong', 'gì', 'làm', 'không', 'thế', 'nào', 'bao', 'nhiêu', 'giá', 'hỏi', 'ở', 'đâu', 'đi', 'mua', 'được'];

        $keywords = [];
        foreach ($parts as $p) {
            if (mb_strlen($p) < 2) continue;
            if (in_array($p, $stop, true)) continue;
            $p = strtr($p, ['tshirt' => 'áo thun', 'tee' => 'áo thun', 'quan' => 'quần']);
            $keywords[] = $p;
            if (count($keywords) >= 8) break;
        }
        $signals['keywords'] = array_values(array_unique($keywords));

        // Thêm nhận dạng greeting/simple intents
        $greetings = ['xin chào', 'chào', 'hi', 'hello', 'hey', 'alo', 'chào bạn', 'chào ae'];
        $isGreeting = false;
        foreach ($greetings as $g) {
            if (mb_stripos($msg, $g) !== false) {
                $isGreeting = true;
                break;
            }
        }
        $signals['greeting'] = $isGreeting;

        return $signals;
    }

    /**
     * Search products with optional min/max price and text query.
     * Returns array of simple product objects suitable for JSON.
     */
    public function searchProducts(string $userMessage, ?int $minPrice = null, ?int $maxPrice = null, int $limit = 6): array
    {
        $q = Product::query();

        if ($minPrice !== null && $maxPrice !== null) {
            $q->whereBetween('price_sale', [(int)$minPrice, (int)$maxPrice]);
        } elseif ($minPrice !== null) {
            $q->where('price_sale', '>=', (int)$minPrice);
        } elseif ($maxPrice !== null) {
            $q->where('price_sale', '<=', (int)$maxPrice);
        }

        $terms = $this->buildSearchTerms($userMessage, []);
        if (!empty($terms)) {
            $q->where(function ($qr) use ($terms) {
                foreach ($terms as $term) {
                    $like = $this->likeTerm($term);
                    $qr->orWhere('name', 'LIKE', $like)
                        ->orWhere('description', 'LIKE', $like);
                }
            });
        }

        $items = $q->orderBy('price_sale')->limit($limit)->get(['id', 'name', 'slug', 'price_sale', 'thumbnail']);

        return $items->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug ?? null,
                'price' => (int)$p->price_sale,
                'thumbnail' => $p->thumbnail_url ?? null,
            ];
        })->toArray();
    }

    private function buildSearchTerms(string $userMessage, array $keywords, int $max = 6): array
    {
        $terms = [];
        foreach ($keywords as $kw) {
            $kw = trim((string) $kw);
            if ($kw !== '') {
                $terms[] = $kw;
            }
        }

        $msg = trim($userMessage);
        if ($msg !== '') {
            $terms[] = $msg;
        }

        $terms = array_values(array_unique($terms));
        if (count($terms) > $max) {
            $terms = array_slice($terms, 0, $max);
        }

        return $terms;
    }

    private function likeTerm(string $term): string
    {
        $term = trim($term);
        if ($term === '') {
            return '%';
        }

        $escaped = addcslashes($term, '%_');
        return '%' . $escaped . '%';
    }

    private function normalizeNumber(string $s): float
    {
        $s = str_replace(['.', ','], ['', '.'], $s);
        $s = preg_replace('/[^0-9\.]/', '', $s);
        return is_numeric($s) ? (float)$s : 0.0;
    }

    private function applyUnit(float $value, ?string $unit): int
    {
        $v = (int) round($value);
        if (!$unit) return $v;
        $u = mb_strtolower($unit);
        if (Str::contains($u, ['tri', 'tr', 'm'])) return $v * 1000000;
        if (Str::contains($u, ['k', 'ngan', 'ngàn', 'nghìn', 'nghin'])) return $v * 1000;
        return $v;
    }

    private function formatVnd($n): string
    {
        $n = (int) $n;
        return number_format($n, 0, ',', '.') . ' VND';
    }

    private function ellipsis(?string $text, int $max = 100): string
    {
        $text = trim((string) $text);
        if ($text === '') return '';
        return mb_strlen($text) > $max ? (mb_substr($text, 0, $max - 1) . '…') : $text;
    }
}
