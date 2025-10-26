<?php

/**
 * Chuẩn hoá string URL -> ORIGIN (scheme://host[:port])
 * Trả về null nếu không hợp lệ.
 */
$toOrigin = function (?string $url) {
    if (!$url) return null;
    $url = trim($url);
    $parts = @parse_url($url);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        return null;
    }
    $origin = $parts['scheme'] . '://' . $parts['host'];
    if (!empty($parts['port'])) {
        $origin .= ':' . $parts['port'];
    }
    return rtrim($origin, '/');
};

// Lấy danh sách origins từ ENV
$single = $toOrigin(env('APP_FRONTEND_ORIGIN'));
$frontUrl = $toOrigin(env('FRONTEND_URL'));  // nếu bạn dùng
$multi = array_filter(array_map($toOrigin, array_map('trim', explode(',', env('APP_FRONTEND_ORIGINS', '')))));

$origins = array_values(array_filter(array_unique(array_merge(
    $single ? [$single] : [],
    $multi,
    $frontUrl ? [$frontUrl] : [],
))));

return [

    // Áp dụng CORS cho API (và Sanctum nếu cần)
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Cho phép mọi method (bao gồm OPTIONS cho preflight)
    'allowed_methods' => ['*'],

    // Danh sách ORIGINS hợp lệ (CHỈ origin, không kèm path)
    'allowed_origins' => $origins,

    // Cho phép wildcard cho subdomain động (Vercel/Ngrok)
    'allowed_origins_patterns' => [
        '#^https?://[a-z0-9-]+\.vercel\.app$#i',
        '#^https?://[a-z0-9-]+\.ngrok-free\.app$#i',
    ],

    // Cho phép mọi header
    'allowed_headers' => ['*'],

    // Header FE có thể đọc (tiện debug SSE/Cache)
    'exposed_headers' => [
        'Content-Type',
        'Cache-Control',
        'X-Accel-Buffering',
        'Vary',
    ],

    'max_age' => 0,

    // Dùng Bearer token → KHÔNG dùng cookie
    'supports_credentials' => false,
];
