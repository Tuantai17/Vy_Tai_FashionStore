<?php
// =============================
// app/Http/Controllers/Api/ChatbotGeminiController.php
// =============================

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ChatbotGroundingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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

        return [
            // Grounding + hướng dẫn
            [
                'parts' => [[
                    'text' =>
                    "Hãy dùng dữ liệu dưới đây làm nguồn sự thật chính. Nếu dữ liệu thiếu, hãy nói 'mình chưa chắc' và đề nghị thông tin bổ sung.\n\n"
                        . $grounding
                        . $intentLine
                ]]
            ],
            // Câu hỏi người dùng (cuối)
            [
                'parts' => [['text' => $lastUser]]
            ],
        ];
    }

    /* ===================== NON-STREAM ===================== */
    public function chat(Request $req)
    {
        $data = $req->validate(['messages' => 'required|array|min:1']);

        $apiKey = trim((string) env('GEMINI_API_KEY', ''));
        if ($apiKey === '') {
            \Log::error('Gemini: missing GEMINI_API_KEY');
            return response()->json(['error' => 'Server misconfigured: missing GEMINI_API_KEY'], 500);
        }

        $model = trim((string) env('GEMINI_MODEL', 'gemini-1.5-flash-latest'));
        $base  = rtrim(env('GEMINI_BASE', 'https://generativelanguage.googleapis.com/v1beta'), '/');
        $url   = "{$base}/models/{$model}:generateContent?key={$apiKey}";

        // -------- Grounding (có cache) --------
        $lastUser = $this->lastUserUtterance($data['messages']);
        $signals  = $this->grounding->extractIntent($lastUser);
        $cacheKey = 'grounding:' . md5($lastUser);
        $context  = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($lastUser) {
            return $this->grounding->buildContext($lastUser);
        });

        // Build generation config dynamically. Some provider setups reject certain responseMimeType values,
        // so only include it when explicitly configured via GEMINI_RESPONSE_MIME.
        $genConfig = [
            'temperature'     => (float) env('GEMINI_TEMPERATURE', 0.5),
            'maxOutputTokens' => (int)   env('GEMINI_MAX_TOKENS', 896),
        ];
        $mime = trim((string) env('GEMINI_RESPONSE_MIME', ''));
        if ($mime !== '') {
            $genConfig['responseMimeType'] = $mime;
        }

        $payload = [
            'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
            // contents tối giản, KHÔNG gửi role
            'contents'          => $this->buildContents($data['messages'], $context, $signals),
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
                \Log::warning('Gemini error (non-stream)', [
                    'status' => $res->status(),
                    'body'   => $body,
                    'url'    => $url,
                ]);

                // If provider indicates model not found (common misconfig), return a clear message
                if ($res->status() === 404) {
                    $msg = 'Gemini model not found. Check GEMINI_MODEL and GEMINI_BASE in your .env';
                    // Suggest fallback model if configured
                    $fallback = trim((string) env('GEMINI_FALLBACK_MODEL', ''));
                    if ($fallback !== '' && $fallback !== $model) {
                        // try a single retry with fallback model
                        \Log::info('Attempting fallback Gemini model', ['from' => $model, 'to' => $fallback]);
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
                            $reply = trim($reply) ?: "Mình chưa chắc thông tin này. Bạn mô tả rõ hơn giúp mình nhé?";
                            return response()->json(['reply' => $reply, 'signals' => $signals]);
                        }
                        \Log::warning('Fallback model also failed', ['status' => $res2->status(), 'body' => $res2->body()]);
                        $msg .= ". Fallback model also failed. See logs.";
                    }

                    // If local fallback is enabled, return a simulated reply instead of 502
                    if ($fallbackEnabled) {
                        $reply = $this->localFallbackReply($lastUser, $context, $signals);
                        return response()->json(['reply' => $reply, 'signals' => $signals]);
                    }

                    return response()->json([
                        'error'  => 'provider_model_not_found',
                        'detail' => $msg,
                        'provider' => $body,
                    ], 502);
                }

                // Default: return provider body and status mapped to 502 for frontend clarity
                // If configured, synthesize a safe local reply for dev so the frontend still works.
                if ($fallbackEnabled) {
                    $reply = $this->localFallbackReply($lastUser, $context, $signals);
                    return response()->json(['reply' => $reply, 'signals' => $signals]);
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
            $reply = trim($reply) ?: "Mình chưa chắc thông tin này. Bạn mô tả rõ hơn giúp mình nhé?";

            return response()->json([
                'reply'   => $reply,
                'signals' => $signals,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Gemini exception (non-stream)', ['message' => $e->getMessage(), 'url' => $url]);
            if ($fallbackEnabled) {
                $reply = $this->localFallbackReply($lastUser, $context, $signals);
                return response()->json(['reply' => $reply, 'signals' => $signals]);
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
        // dùng đúng endpoint stream
        $url   = "{$base}/models/{$model}:streamGenerateContent?key={$apiKey}";

        // Grounding + cache
        $lastUser = $this->lastUserUtterance($data['messages']);
        $signals  = $this->grounding->extractIntent($lastUser);
        $cacheKey = 'grounding:' . md5($lastUser);
        $context  = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($lastUser) {
            return $this->grounding->buildContext($lastUser);
        });

        // See note above: only include responseMimeType if explicitly configured to avoid 400s.
        $genConfig = [
            'temperature'     => (float) env('GEMINI_TEMPERATURE', 0.5),
            'maxOutputTokens' => (int)   env('GEMINI_MAX_TOKENS', 896),
        ];
        $mime = trim((string) env('GEMINI_RESPONSE_MIME', ''));
        if ($mime !== '') {
            $genConfig['responseMimeType'] = $mime;
        }

        $payload  = [
            'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
            'contents'          => $this->buildContents($data['messages'], $context, $signals),
            'generationConfig'  => $genConfig,
        ];

        $fallbackEnabled = filter_var(env('GEMINI_LOCAL_FALLBACK', false), FILTER_VALIDATE_BOOLEAN);

        @ini_set('output_buffering', 'off');
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');

        return response()->stream(function () use ($url, $payload) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Content-Type: application/json'],
                CURLOPT_POSTFIELDS     => json_encode($payload),
                CURLOPT_WRITEFUNCTION  => function ($ch, $data) {
                    // Google stream trả từng dòng JSON; bóc text và đẩy dưới dạng SSE
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
                \Log::error('Gemini stream curl error', ['error' => $err]);

                if ($fallbackEnabled) {
                    // Emit a short simulated SSE reply so the frontend can handle it like real stream.
                    $sim = $this->localFallbackReply($lastUser ?? '', $context ?? '', $signals ?? []);
                    // Break into one data event
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
     * Build a small deterministic fallback reply used when external Gemini is unavailable.
     * This is intentionally conservative and suitable for development/testing only.
     */
    private function localFallbackReply(string $lastUser, string $context, array $signals): string
    {
        $out = "[Mô phỏng trả lời - chế độ dev]\n";
        $out .= "Câu hỏi: " . trim($lastUser) . "\n";

        if (!empty($signals['budget'])) {
            $out .= "Ngân sách: " . number_format($signals['budget'], 0, ',', '.') . "đ\n";
        }
        if (!empty($signals['keywords'])) {
            $out .= "Từ khóa: " . implode(', ', array_slice($signals['keywords'], 0, 6)) . "\n";
        }

        // provide a safe, short suggestion based on the budget keyword
        if (!empty($signals['budget'])) {
            $b = (int) $signals['budget'];
            if ($b < 500000) {
                $out .= "Gợi ý: bạn có thể xem các sản phẩm giá rẻ, ví dụ áo phông hoặc phụ kiện.\n";
            } elseif ($b < 2000000) {
                $out .= "Gợi ý: các áo khoác nhẹ, váy or quần tây trong tầm giá này thường phù hợp.\n";
            } else {
                $out .= "Gợi ý: bạn có nhiều lựa chọn; cân nhắc chất liệu và thương hiệu.\n";
            }
        } else {
            $out .= "Gợi ý: bạn có thể mô tả thêm (màu, loại, ngân sách) để mình tư vấn chính xác hơn.\n";
        }

        $out .= "(Dữ liệu thực tế tóm tắt)\n";
        $summary = trim(substr($context, 0, 400));
        if ($summary !== '') $out .= $summary . (strlen($context) > 400 ? '...' : '') . "\n";

        $out .= "\nNếu bạn muốn dùng Gemini thật, kiểm tra GEMINI_MODEL/GEMINI_BASE trong .env";
        return $out;
    }
}
