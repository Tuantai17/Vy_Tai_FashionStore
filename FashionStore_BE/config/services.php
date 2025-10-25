<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],


    //chat ai
    'openai' => [
        'key'      => env('OPENAI_API_KEY'),
        'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'model'    => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'org'      => env('OPENAI_ORG'), // ✅ THÊM DÒNG NÀY
    ],



    // 'momo' => [
    //     'endpoint'      => env('MOMO_ENDPOINT'),
    //     'partner_code'  => env('MOMO_PARTNER_CODE'),
    //     'access_key'    => env('MOMO_ACCESS_KEY'),
    //     'secret_key'    => env('MOMO_SECRET_KEY'),
    //     'redirect_url'  => env('MOMO_REDIRECT_URL'),
    //     'ipn_url'       => env('MOMO_IPN_URL'),
    //     // ✅ NEW: cho phép đặt mặc định requestType qua .env
    //     'request_type'  => env('MOMO_REQUEST_TYPE', 'captureWallet'), // hoặc 'payWithATM'
    // ],



    // config/services.php
    'momo' => [
        'endpoint'      => 'https://test-payment.momo.vn/v2/gateway/api/create',
        'partner_code'  => 'MOMOBKUN20180529',
        'access_key'    => 'klm05TvNBzhg7h7j',
        'secret_key'    => 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa',
        'redirect_url'  => env('APP_URL') . '/momo/return',   // <-- KHÔNG /api
        'ipn_url'       => env('APP_URL') . '/api/momo/callback', // server-to-server
        'request_type'  => 'captureWallet',  // dùng ví MoMo cho nhanh
    ],



];
