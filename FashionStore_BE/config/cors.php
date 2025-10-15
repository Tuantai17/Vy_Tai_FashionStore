<?php

return [

    // Chỉ cần cho API (và sanctum/csrf-cookie nếu bạn có dùng Sanctum ở đâu đó)
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // FE được phép gọi API
    // LƯU Ý: KHÔNG để domain của BE ở đây (vd: *.up.railway.app / onrender.com)
    // Có thể lấy từ ENV để khỏi hardcode
    'allowed_origins' => array_filter([
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        env('FRONTEND_URL', null), // ví dụ: https://vy-tai-fashion-store-ud16.vercel.app
    ]),

    'allowed_origins_patterns' => [],

    // Cho phép mọi header phổ biến (Authorization, Content-Type, v.v.)
    'allowed_headers' => ['*'],

    // Nếu cần đọc một số header response tùy biến thì liệt kê ở đây
    'exposed_headers' => [],

    'max_age' => 0,

    // DÙNG BEARER TOKEN => để false (không gửi/nhận cookie)
    // Nếu sau này chuyển qua cookie/Sanctum SPA thì đổi thành true và cấu hình SANCTUM_STATEFUL_DOMAINS + SESSION_DOMAIN.
    'supports_credentials' => false,
];
