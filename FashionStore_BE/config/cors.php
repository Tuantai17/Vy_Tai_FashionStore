<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // nếu deploy FE gọi BE online thì thêm origin FE của bạn;
        // nếu chính BE phục vụ cho domain này, vẫn chỉ để ORIGIN (không kèm /api/...):
        'https://fashionstore-be1.onrender.com',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    // Bearer token => để false. Nếu bạn dùng cookie/Sanctum SPA thì đổi thành true.
    'supports_credentials' => false,
];
