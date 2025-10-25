<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    // JSON (non-stream) reply â€“ fallback endpoint
    public function chat(ChatRequest $req)
    {
        $prompt = $req->input('message');
        try {
            $res = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type'  => 'application/json',
            ])->timeout(60)->post(rtrim(config('services.openai.base_url', 'https://api.openai.com/v1'), '/') . '/responses', [
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'input' => [
                    [
                        'role' => 'system',
                        'content' => "You are FashionStore's helpful shopping assistant. Reply concisely in Vietnamese.",
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

            if (!$res->ok()) {
                return response()->json(['message' => 'Upstream error', 'error' => $res->json()], $res->status());
            }
            $data = $res->json();
            $answer = data_get($data, 'output.0.content.0.text', '');
            return response()->json(['reply' => $answer]);
        } catch (ConnectionException $e) {
            return response()->json(['message' => 'Upstream timeout'], 504);
        }
    }
    // SSE stream: proxy token tá»« OpenAI vá» FE
    public function stream(ChatRequest $req)
    {
        $prompt  = $req->input('message', '');
        $history = []; // TODO: cÃ³ thá»ƒ náº¡p history theo conversation_id

        $serverSend = function () use ($prompt, $history) {

            // Chuáº©n bá»‹ headers â€” bá» qua cÃ¡c header rá»—ng
            $headers = array_filter([
                'Authorization'         => 'Bearer ' . config('services.openai.key'),
                'Accept'                => 'text/event-stream',
                'OpenAI-Organization'   => config('services.openai.org'), // optional
            ]);

            try {
                $response = Http::withHeaders($headers)
                    ->timeout(60)                   // timeout tá»•ng
                    ->connectTimeout(10)            // timeout káº¿t ná»‘i
                    ->withOptions(['stream' => true])
                    ->post(
                        rtrim(config('services.openai.base_url', 'https://api.openai.com/v1'), '/') . '/responses',
                        [
                            'model' => config('services.openai.model', 'gpt-4o-mini'),
                            'input' => [
                                [
                                    'role' => 'system',
                                    'content' =>
                                    "You are FashionStore's helpful shopping assistant.
- Reply in concise Vietnamese by default.
- Tráº£ lá»i lá»‹ch sá»±, kÃ¨m vÃ­ dá»¥ náº¿u cáº§n.
- Náº¿u cáº§n dá»¯ liá»‡u ná»™i bá»™ (Ä‘Æ¡n hÃ ng, tá»“n kho, mÃ£ giáº£m giÃ¡...), hÃ£y yÃªu cáº§u ngÆ°á»i dÃ¹ng cung cáº¥p mÃ£/Ä‘iá»u kiá»‡n tra cá»©u.",
                                ],
                                // TODO: Ä‘áº©y $history vÃ o Ä‘Ã¢y náº¿u cÃ³
                                ['role' => 'user', 'content' => $prompt],
                            ],
                            'stream' => true,
                        ]
                    );
            } catch (ConnectionException $e) {
                echo "event: error\n";
                echo 'data: ' . json_encode([
                    'status' => 'error',
                    'code'   => 0,
                    'error'  => 'Connection failed: ' . $e->getMessage(),
                ]) . "\n\n";
                @ob_flush();
                @flush();
                return;
            }

            if ($response->failed()) {
                echo "event: error\n";
                echo 'data: ' . json_encode([
                    'status' => 'error',
                    'code'   => $response->status(),
                    'error'  => 'Upstream error',
                ]) . "\n\n";
                @ob_flush();
                @flush();
                return;
            }

            // Stream tá»« OpenAI => client
            $body = $response->toPsrResponse()->getBody();
            while (!$body->eof()) {
                $chunk = $body->read(1024);
                if ($chunk === false) break;
                echo $chunk;        // giá»¯ nguyÃªn Ä‘á»‹nh dáº¡ng SSE tá»« OpenAI
                @ob_flush();
                @flush();
            }
        };

        $stream = new StreamedResponse($serverSend, 200);

        // SSE + CORS
        $origin = request()->headers->get('Origin', '*');
        $stream->headers->set('Content-Type', 'text/event-stream');
        $stream->headers->set('Cache-Control', 'no-cache');
        $stream->headers->set('Connection', 'keep-alive');
        $stream->headers->set('X-Accel-Buffering', 'no'); // trÃ¡nh Nginx buffer
        $stream->headers->set('Access-Control-Allow-Origin', config('app.frontend_origin', $origin));
        $stream->headers->set('Vary', 'Origin');

        return $stream;
    }

    // LÆ°u transcript sau khi stream káº¿t thÃºc (FE gá»­i text gá»™p)
    public function save(Request $req)
    {
        $data = $req->validate([
            'prompt'          => 'required|string',
            'answer'          => 'required|string',
            'conversation_id' => 'nullable|integer',
            'meta'            => 'array',
        ]);

        $row = \App\Models\AiConversation::create([
            'user_id' => optional($req->user())->id,
            'prompt'  => $data['prompt'],
            'answer'  => $data['answer'],
            'meta'    => $data['meta'] ?? null,
        ]);

        return response()->json(['id' => $row->id]);
    }
}
