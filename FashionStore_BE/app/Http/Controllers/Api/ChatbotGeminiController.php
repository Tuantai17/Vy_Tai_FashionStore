<?php
// =============================
// app/Http/Controllers/Api/ChatbotGeminiController.php
// =============================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChatbotGroundingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotGeminiController extends Controller
{
    public function __construct(private ChatbotGroundingService $grounding) {}

    private function systemPrompt(): string
    {
        return <<<SYS
Bạn là Trợ lý bán hàng của FashionStore.
Mục tiêu: tư vấn sản phẩm thời trang (áo/quần/đầm/phụ kiện), gợi ý size, phối đồ, thông tin vận chuyển/đổi trả, hỗ trợ theo ngân sách.
Quy tắc:
- Trả lời bằng tiếng Việt tự nhiên, gọn, có tiêu đề/bullet khi cần.
- Nếu người dùng nêu ngân sách, ưu tiên gợi ý trong khoảng đó.
- Khi không chắc dữ liệu, hãy nói "mình chưa chắc" và đề xuất cách hỏi thêm.
- Ưu tiên dùng DỮ LIỆU CUNG CẤP (chính sách/FAQ/sản phẩm) thay vì suy đoán.
- Có thể dùng cú pháp markdown trong nội dung, nhưng responseMimeType là text/plain.
- Nếu câu hỏi ngoài phạm vi shop, hãy trả lời ngắn gọn và lịch sự từ chối.
SYS;
    }

    /**
     * Tạo contents tối giản cho v1beta: chỉ parts[].text
     * - Nhét grounding + tín hiệu intent vào 1 message đầu.
     * - Chỉ gửi phát ngôn user cuối (tránh 400 do role/model).
     */
    private function buildContents(array $messages, string $grounding, array $signals): array
    {
        $intentInfo = [];
        if (!empty($signals['budget'])) {
            $intentInfo[] = 'Ngân sách ước tính: ' . number_format($signals['budget'], 0, ',', '.') . 'đ';
        }
        if (!empty($signals['keywords'])) {
            $intentInfo[] = 'Từ khóa: ' . implode(', ', $signals['keywords']);
        }
        $intentLine = $intentInfo ? ("\n\n[Nhận dạng ý định]\n• " . implode("\n• ", $intentInfo)) : '';

        $lastUser = $this->lastUserUtterance($messages);

        $contents = [];

        // Nếu có grounding thì nhét làm nguồn sự thật; nếu không, bỏ qua (tránh trả về chỉ header)
        if (trim($grounding) !== '') {
            $contents[] = [
                'parts' => [[
                    'text' =>
                    "Hãy dùng dữ liệu dưới đây làm nguồn sự thật chính. Nếu dữ liệu thiếu, hãy nói 'mình chưa chắc' và đề nghị thông tin bổ sung.\n\n"
                        . $grounding
                        . $intentLine
                ]]
            ];
        } else {
            // Khi không có grounding, nhắc model ưu tiên trung thực và dùng kiến thức chung
            $hint = "(Không tìm thấy dữ liệu nội bộ liên quan.) Hãy trả lời chính xác, ngắn gọn và nếu không chắc hãy hỏi thêm thông tin.";
            $contents[] = [
                'parts' => [['text' => $hint . ($intentLine ? "\n\n" . $intentLine : "")]]
            ];
        }

        // luôn gửi only last user utterance để tránh lỗi role
        $contents[] = ['parts' => [['text' => $lastUser]]];

        return $contents;
    }

    /* ===================== NON-STREAM ===================== */
    public function chat(Request $req)
    {
        $data = $req->validate(['messages' => 'required|array|min:1']);

        $apiKey = trim((string) env('GEMINI_API_KEY', ''));
        if ($apiKey === '') {
            Log::error('Gemini: missing GEMINI_API_KEY');
            return response()->json(['error' => 'Server misconfigured: missing GEMINI_API_KEY'], 500);
        }

        $model = trim((string) env('GEMINI_MODEL', 'gemini-1.5-flash-latest'));
        $base  = rtrim(env('GEMINI_BASE', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $url   = "{$base}/models/{$model}:generateContent?key={$apiKey}";

        // -------- Grounding (có cache) --------
        $lastUser = $this->lastUserUtterance($data['messages']);
        $signals  = $this->grounding->extractIntent($lastUser);
        $cacheKey = 'grounding:' . md5($lastUser);
        $context  = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($lastUser, $signals) {
            return $this->grounding->buildContext($lastUser, $signals['budget'] ?? null);
        });

        // Tìm sản phẩm phù hợp theo tín hiệu ngân sách/keywords (dùng cả để trả về cho FE)
        $products = $this->grounding->searchProducts($lastUser, $signals['budget_min'] ?? null, $signals['budget_max'] ?? null, 6);

        // Build generation config
        $genConfig = [
            'temperature'     => (float) env('GEMINI_TEMPERATURE', 0.5),
            'maxOutputTokens' => (int)   env('GEMINI_MAX_TOKENS', 896),
        ];
        $mime = trim((string) env('GEMINI_RESPONSE_MIME', ''));
        if ($mime !== '') {
            $genConfig['responseMimeType'] = $mime;
        }

        // Rút gọn grounding để tránh vượt token
        $shortContext = $this->shortenText($context, 900);
        $payload = [
            'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
            'contents'          => $this->buildContents($data['messages'], $shortContext, $signals),
            'generationConfig'  => $genConfig,
        ];

        $fallbackEnabled = filter_var(env('GEMINI_LOCAL_FALLBACK', false), FILTER_VALIDATE_BOOLEAN);

        try {
            $res = Http::timeout(25)
                ->retry(2, 300)
                ->asJson()->acceptJson()
                ->post($url, $payload);

            if (!$res->ok()) {
                $body = $res->json() ?: $res->body();
                Log::warning('Gemini error (non-stream)', [
                    'status' => $res->status(),
                    'body'   => $body,
                    'url'    => $url,
                ]);

                if ($res->status() === 404) {
                    $msg = 'Gemini model not found. Check GEMINI_MODEL and GEMINI_BASE in your .env';
                    $fallback = trim((string) env('GEMINI_FALLBACK_MODEL', ''));
                    if ($fallback !== '' && $fallback !== $model) {
                        Log::info('Attempting fallback Gemini model', ['from' => $model, 'to' => $fallback]);
                        $url2 = "{$base}/models/{$fallback}:generateContent?key={$apiKey}";
                        $res2 = Http::timeout(25)->retry(1, 300)->asJson()->acceptJson()->post($url2, $payload);
                        if ($res2->ok()) {
                            $json = $res2->json();
                            $reply = '';
                            if (!empty($json['candidates'][0]['content']['parts'])) {
                                foreach ($json['candidates'][0]['content']['parts'] as $p) {
                                    if (!empty($p['text'])) $reply .= $p['text'];
                                }
                            }
                            $reply = $this->sanitizeReply(trim($reply) ?: "Mình chưa chắc thông tin này. Bạn mô tả rõ hơn giúp mình nhé?");
                            $resp = ['reply' => $reply, 'signals' => $signals];
                            if (!empty($products)) $resp['products'] = $products;
                            return response()->json($resp);
                        }
                        Log::warning('Fallback model also failed', ['status' => $res2->status(), 'body' => $res2->body()]);
                        $msg .= ". Fallback model also failed. See logs.";
                    }

                    if ($fallbackEnabled) {
                        $reply = $this->localFallbackReply($context, $signals, $products);
                        $resp = ['reply' => $this->sanitizeReply($reply), 'signals' => $signals];
                        if (!empty($products)) $resp['products'] = $products;
                        return response()->json($resp);
                    }

                    return response()->json([
                        'error'    => 'provider_model_not_found',
                        'detail'   => $msg,
                        'provider' => $body,
                    ], 502);
                }

                if ($fallbackEnabled) {
                    $reply = $this->localFallbackReply($context, $signals, $products);
                    $resp = ['reply' => $this->sanitizeReply($reply), 'signals' => $signals];
                    if (!empty($products)) $resp['products'] = $products;
                    return response()->json($resp);
                }

                return response()->json([
                    'error'  => 'provider_error',
                    'status' => $res->status(),
                    'detail' => $body,
                ], 502);
            }

            $json = $res->json();
            $reply = '';
            if (!empty($json['candidates'][0]['content']['parts'])) {
                foreach ($json['candidates'][0]['content']['parts'] as $p) {
                    if (!empty($p['text'])) $reply .= $p['text'];
                }
            }

            $reply = $this->sanitizeReply(trim($reply) ?: "Mình chưa chắc thông tin này. Bạn mô tả rõ hơn giúp mình nhé?");
            $resp = ['reply' => $reply, 'signals' => $signals];
            if (!empty($products)) $resp['products'] = $products;
            return response()->json($resp);
        } catch (\Throwable $e) {
            Log::error('Gemini exception (non-stream)', ['message' => $e->getMessage(), 'url' => $url]);
            if ($fallbackEnabled) {
                $reply = $this->localFallbackReply($context, $signals, $products);
                $resp = ['reply' => $this->sanitizeReply($reply), 'signals' => $signals];
                if (!empty($products)) $resp['products'] = $products;
                return response()->json($resp);
            }
            return response()->json([
                'error'  => 'Upstream error',
                'detail' => $e->getMessage(),
            ], 502);
        }
    }

    /* ===================== STREAM (SSE) ===================== */
    public function chatStream(Request $req)
    {
        $data = $req->validate(['messages' => 'required|array|min:1']);

        $apiKey = trim((string) env('GEMINI_API_KEY', ''));
        if ($apiKey === '') {
            return response()->json(['error' => 'Server misconfigured: missing GEMINI_API_KEY'], 500);
        }

        $model = trim((string) env('GEMINI_MODEL', 'gemini-1.5-flash-latest'));
        $base  = rtrim(env('GEMINI_BASE', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $url   = "{$base}/models/{$model}:streamGenerateContent?key={$apiKey}";

        // Grounding + cache
        $lastUser = $this->lastUserUtterance($data['messages']);
        $signals  = $this->grounding->extractIntent($lastUser);
        $cacheKey = 'grounding:' . md5($lastUser);
        $context  = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($lastUser, $signals) {
            return $this->grounding->buildContext($lastUser, $signals['budget'] ?? null);
        });

        // Search products for this query (min/max budget from signals)
        $products = $this->grounding->searchProducts($lastUser, $signals['budget_min'] ?? null, $signals['budget_max'] ?? null, 6);

        $genConfig = [
            'temperature'     => (float) env('GEMINI_TEMPERATURE', 0.5),
            'maxOutputTokens' => (int)   env('GEMINI_MAX_TOKENS', 896),
        ];
        $mime = trim((string) env('GEMINI_RESPONSE_MIME', ''));
        if ($mime !== '') {
            $genConfig['responseMimeType'] = $mime;
        }

        // Có thể rút gọn context để stream gọn hơn
        $shortContext = $this->shortenText($context, 1100);
        $payload  = [
            'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
            'contents'          => $this->buildContents($data['messages'], $shortContext, $signals),
            'generationConfig'  => $genConfig,
        ];

        $fallbackEnabled = filter_var(env('GEMINI_LOCAL_FALLBACK', false), FILTER_VALIDATE_BOOLEAN);

        @ini_set('output_buffering', 'off');
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');

        $lastUserLocal = $lastUser;  // bring to closure
        $signalsLocal  = $signals;
        $contextLocal  = $context;
        $productsLocal = $products;

        return response()->stream(function () use ($url, $payload, $fallbackEnabled, $lastUserLocal, $signalsLocal, $contextLocal, $productsLocal) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Content-Type: application/json'],
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_WRITEFUNCTION  => function ($ch, $data) {
                    foreach (preg_split("/\r\n|\n|\r/", $data) as $line) {
                        $line = trim($line);
                        if ($line === '') continue;
                        $decoded = json_decode($line, true);
                        if (json_last_error() !== JSON_ERROR_NONE) continue;

                        $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
                        if ($text !== '') {
                            echo "data: " . str_replace(["\r", "\n"], ["\\r", "\\n"], $text) . "\n\n";
                            @ob_flush();
                            @flush();
                        }
                    }
                    return strlen($data);
                },
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_TIMEOUT        => 60,
            ]);

            $ok = curl_exec($ch);
            if ($ok === false) {
                $err = curl_error($ch);
                Log::error('Gemini stream curl error', ['error' => $err]);

                if ($fallbackEnabled) {
                    $sim = $this->localFallbackReply($contextLocal, $signalsLocal, $productsLocal);
                    $sim = $this->sanitizeReply($sim);
                    echo "data: " . str_replace(["\r", "\n"], ['\\r', '\\n'], $sim) . "\n\n";
                } else {
                    echo "data: (stream error)\n\n";
                }
            }
            curl_close($ch);

            echo "data: [DONE]\n\n";
            @ob_flush();
            @flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function lastUserUtterance(array $messages): string
    {
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            $m = $messages[$i];
            if (($m['role'] ?? 'user') === 'user') {
                return (string) ($m['content'] ?? '');
            }
        }
        return (string) ($messages[0]['content'] ?? '');
    }

    /**
     * Fallback khi không gọi được Gemini: TRẢ VỀ NGẮN GỌN, KHÔNG NHÃN DEBUG.
     * Mặc định: chỉ trả về phần context đã rút gọn để widget hiển thị sạch.
     * Nếu cần debug nội bộ, set GEMINI_DEV_VERBOSE=true để in thêm thông tin.
     */
    private function localFallbackReply(string $context, array $signals = [], array $products = []): string
    {
        $verbose = filter_var(env('GEMINI_DEV_VERBOSE', false), FILTER_VALIDATE_BOOLEAN);
        $summary = $this->shortenText($context, 600);

        if ($verbose) {
            return "⧉ DEBUG(dev)\n" . $summary;
        }
        // Nếu có tín hiệu greeting, trả lời thân thiện thay vì trả raw context
        if (!empty($signals['greeting'])) {
            return "Xin chào! Mình là trợ lý FashionStore — mình có thể giúp bạn tìm sản phẩm, gợi ý size, hoặc tư vấn theo ngân sách. Bạn muốn xem gì hôm nay?";
        }

        // Nếu không có context hữu dụng thì trả fallback hữu ích
        if (trim($summary) === '') {
            // Nếu có sản phẩm tìm được, liệt kê ngắn
            if (!empty($products)) {
                $lines = ["Mình tạm thời không truy vấn được dịch vụ AI chính. Dưới đây là một vài gợi ý phù hợp:"];
                foreach (array_slice($products, 0, 6) as $p) {
                    $lines[] = "- {$p['name']} — " . number_format($p['price'], 0, ',', '.') . "đ";
                }
                return implode("\n", $lines);
            }

            return "Mình tạm thời không truy vấn được dịch vụ AI chính. Bạn có thể hỏi về sản phẩm, ngân sách, hoặc mô tả sản phẩm bạn cần — mình sẽ cố gắng giúp.";
        }

        // Nếu có sản phẩm liên quan, thêm gợi ý ngắn xuống cuối summary
        if (!empty($products)) {
            $lines = [$summary, "\nGợi ý sản phẩm:"];
            foreach (array_slice($products, 0, 4) as $p) {
                $lines[] = "- {$p['name']} — " . number_format($p['price'], 0, ',', '.') . "đ";
            }
            return implode("\n", $lines);
        }

        // Chế độ bình thường: trả về tóm tắt dữ liệu nội bộ
        return $summary;
    }

    /** Sanitize provider reply */
    private function sanitizeReply(string $text): string
    {
        $decoded = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $stripped = strip_tags($decoded);
        $norm = preg_replace('/[\r\n\t]+/', "\n", $stripped);
        $norm = preg_replace('/[ \t]{2,}/', ' ', $norm);
        return trim($norm);
    }

    /** Rút gọn text giữ nguyên từ hoàn chỉnh */
    private function shortenText(string $text, int $maxChars = 800): string
    {
        $plain = trim(strip_tags(html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        if (mb_strlen($plain) <= $maxChars) return $plain;
        $cut = mb_substr($plain, 0, $maxChars);
        $last = mb_strrpos($cut, ".");
        if ($last === false) $last = mb_strrpos($cut, ' ');
        if ($last !== false) $cut = mb_substr($cut, 0, $last);
        return trim($cut) . '...';
    }
}
