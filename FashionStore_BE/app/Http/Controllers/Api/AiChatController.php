<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Arr;

class AiChatController extends Controller
{
    /** POST /api/ai/chat */
    public function chat(Request $req)
    {
        $data = $req->validate([
            'messages' => 'required|array|min:1',
            'system'   => 'nullable|string',
            'jsonMode' => 'nullable|boolean',
        ]);

        $apiKey = (string) config('services.gemini.key');
        $model  = (string) config('services.gemini.model', 'gemini-1.5-flash');
        $base   = rtrim((string) config('services.gemini.base', 'https://generativelanguage.googleapis.com/v1beta'), '/');

        if ($apiKey === '') {
            return response()->json([
                'ok' => false,
                'message' => 'Thiếu GEMINI_API_KEY trong .env',
            ], 500);
        }

        // --- Chuẩn hoá base theo model ---
        // Nếu model có '-latest' nhưng base là v1beta -> chuyển base sang v1 để tránh 404.
        if (str_contains($model, '-latest') && str_ends_with($base, '/v1beta')) {
            $base = preg_replace('#/v1beta$#', '/v1', $base);
        }

        $contents = [];
        if (!empty($data['system'])) {
            $contents[] = [
                'role'  => 'user',
                'parts' => [['text' => "[SYSTEM]\n" . $data['system']]],
            ];
        }
        foreach ($data['messages'] as $m) {
            $role = (($m['role'] ?? 'user') === 'assistant') ? 'model' : 'user';
            $contents[] = [
                'role'  => $role,
                'parts' => [['text' => (string)($m['content'] ?? '')]],
            ];
        }

        $generationConfig = [
            'temperature'      => 0.7,
            'topP'             => 0.95,
            'topK'             => 40,
            'maxOutputTokens'  => 2048,
        ];
        if (!empty($data['jsonMode'])) {
            $generationConfig['responseMimeType'] = 'application/json';
        }

        $client = new Client([
            'base_uri' => $base . '/',   // ví dụ: https://generativelanguage.googleapis.com/v1beta/
            'timeout'  => 30,
        ]);

        try {
            $resp = $client->post("models/{$model}:generateContent", [
                'query' => ['key' => $apiKey],
                'json'  => [
                    'contents'         => $contents,
                    'generationConfig' => $generationConfig,
                ],
            ]);

            $json = json_decode((string) $resp->getBody(), true);
            $text = Arr::get($json, 'candidates.0.content.parts.0.text', '');

            return response()->json(['ok' => true, 'message' => $text]);
        } catch (RequestException $e) {
            $status  = $e->getResponse()?->getStatusCode();
            $bodyStr = (string) ($e->getResponse()?->getBody() ?? '');

            $hint = '';
            if ($status === 404) {
                $hint = ' (Model/Base không khớp. Với v1beta dùng "gemini-1.5-flash"; nếu muốn "-latest" thì đổi base sang v1.)';
            }

            return response()->json([
                'ok'      => false,
                'message' => 'Lỗi gọi Gemini' . ($status ? " ($status)" : '') . $hint,
                'detail'  => $bodyStr,
            ], 500);
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
