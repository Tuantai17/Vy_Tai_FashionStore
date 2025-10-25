<?php

// Helper: parse danh sách origins từ ENV (phân tách bởi dấu phẩy)
$envOrigins = array_filter(array_map('trim', explode(',', env('APP_FRONTEND_ORIGINS', ''))));

return [

    // Áp dụng cho API (và Sanctum nếu dùng cookie)
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Cho phép mọi method (bao gồm OPTIONS cho preflight)
    'allowed_methods' => ['*'],

    // Danh sách origin cụ thể (không đưa domain BE vào đây)
    // - APP_FRONTEND_ORIGIN: 1 origin chính (ví dụ localhost)
    // - APP_FRONTEND_ORIGINS: nhiều origin, ngăn cách bởi dấu phẩy (VD: vercel, staging…)
    'allowed_origins' => array_values(array_filter([
        env('APP_FRONTEND_ORIGIN', null), // ví dụ: http://localhost:5173
        ...$envOrigins,                   // ví dụ: https://yourapp.vercel.app, https://staging.example.com
    ])),

    // Regex cho các domain động (subdomain)
    // - Vercel: https://*.vercel.app
    // - Ngrok:  https://*.ngrok-free.app (tuỳ bạn có dùng hay không)
    'allowed_origins_patterns' => [
        '#^https://[a-z0-9-]+\.vercel\.app$#i',
        '#^https://[a-z0-9-]+\.ngrok-free\.app$#i',
    ],

    // Header được phép gửi lên
    'allowed_headers' => ['*'],

    // Header response mà FE có thể đọc (hữu ích khi debug SSE/Cache)
    'exposed_headers' => [
        'Content-Type',
        'Cache-Control',
        'X-Accel-Buffering',
        'Vary',
    ],

    'max_age' => 0,

    // Dùng Bearer token (không cookie) -> để false.
    // Nếu chuyển qua cookie/Sanctum SPA: chỉnh true và set SANCTUM_STATEFUL_DOMAINS + SESSION_DOMAIN.
    'supports_credentials' => false,
];
