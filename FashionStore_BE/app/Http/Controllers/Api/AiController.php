<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    // POST /api/ai/summarize
    public function summarize(Request $req)
    {
        $title   = $req->string('title_raw')->toString();
        $content = $req->string('content_raw')->toString();
        $source  = $req->string('source_url')->toString();
        $image   = $req->string('image_raw')->toString();

        if (mb_strlen($content) < 40) {
            return response()->json(['error' => 'Content too short'], 422);
        }

        $apiKey = config('services.gemini.key');
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' . $apiKey;

        $prompt = <<<EOT
Bạn là biên tập viên của FashionStore. Từ nội dung nguồn sau, hãy viết một tin NGẮN bằng tiếng Việt (500–800 từ) với cấu trúc JSON THUẦN:

{
  "title": "...",
  "excerpt": "...",                  // ≤ 150 chữ
  "content_html": "<p>...</p>",      // HTML gọn, có <h2> nếu cần
  "tags": ["...", "..."],
  "seo_title": "...",                // ≤ 70 ký tự
  "seo_desc": "...",                 // ≤ 160 ký tự
  "slug": "...",                     // có thể bỏ trống, hệ thống sẽ tự sinh
  "cover_image": "..."               // nếu biết, dùng ảnh từ nguồn
}

YÊU CẦU: Trả ra JSON thuần, không kèm giải thích.

TIÊU ĐỀ NGUỒN: {$title}
LINK NGUỒN: {$source}
NỘI DUNG NGUỒN:
{$content}
EOT;

        $payload = [
            'contents' => [['parts' => [['text' => $prompt]]]],
        ];

        $res = Http::timeout(45)->post($url, $payload);

        if (!$res->successful()) {
            return response()->json(['error' => 'AI request failed', 'detail' => $res->body()], 502);
        }

        // Lấy text từ kết quả Gemini
        $data = $res->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

        // Thử parse JSON
        $json = json_decode($text, true);
        if (!is_array($json)) {
            // fallback: cố gắng cắt code block ```json ... ```
            if (preg_match('/```json(.*?)```/s', $text, $m)) {
                $json = json_decode(trim($m[1]), true);
            }
        }
        if (!is_array($json)) {
            return response()->json(['error' => 'AI returned non-JSON', 'raw' => $text], 502);
        }

        // Fallback ảnh
        if (empty($json['cover_image']) && $image) {
            $json['cover_image'] = $image;
        }

        return response()->json($json);
    }
}
