<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Order;


use App\Http\Controllers\Api\MomoController;
use App\Models\Payment;

use App\Http\Controllers\Api\{
    ProductController,
    CategoryController,
    BrandController,
    AuthController,
    OrderController,
    UserController,
    ReviewController
};


// //momo
// Route::post('/payments/momo/create', [MomoController::class, 'create']);  // tạo lệnh thanh toán
// Route::post('/payments/momo/ipn',    [MomoController::class, 'ipn']);     // MoMo gọi về (server-to-server)
// Route::get('/payments/momo/return',  [MomoController::class, 'return']);  // người dùng quay lại site
// // routes/api.php
// Route::get('/ping', fn() => response()->json(['ok' => true]));


// MoMo routes (bật lại)
Route::post('/momo/create', [MomoController::class, 'create']);
Route::match(['get', 'post'], '/momo/callback', [MomoController::class, 'callback']);
Route::match(['get', 'post'], '/momo/return',   [MomoController::class, 'return']);



// routes/api.php
Route::get('/momo/status', function (Request $req) {
    $orderId = $req->query('orderId');

    if (!$orderId) {
        return response()->json([
            'resultCode' => 9999,
            'message'    => 'Thiếu orderId'
        ], 400);
    }

    $payment = Payment::where('order_id', $orderId)
        ->latest('id')
        ->first();

    if (!$payment) {
        return response()->json([
            'resultCode' => 7002,
            'message'    => 'Chưa có thông tin thanh toán.'
        ]);
    }

    return response()->json([
        'orderId'    => $payment->order_id,
        'resultCode' => (int) $payment->result_code,
        'message'    => $payment->message ?? 'Đang xử lý',
        'amount'     => (int) $payment->amount,
        'transId'    => $payment->trans_id,
        'method'     => $payment->method,
        'updated_at' => $payment->updated_at,
    ]);
});




// ===== Auth =====
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ===== Reviews (⚠️ phải đặt trước /products/{id}) =====
Route::get('/products/{id}/reviews', [ReviewController::class, 'index']);
Route::get('/products/{id}/can-review', [ReviewController::class, 'canReview'])->middleware('auth:sanctum');
Route::post('/products/{id}/reviews', [ReviewController::class, 'store'])->middleware('auth:sanctum');
Route::put('/reviews/{id}', [ReviewController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/reviews/{id}', [ReviewController::class, 'destroy'])->middleware('auth:sanctum');

// ===== Products =====
Route::get('/products',      [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories/{id}/products', [ProductController::class, 'byCategory'])->whereNumber('id');

// ===== Categories (CRUD) =====
Route::get('/categories',          [CategoryController::class, 'index']);
Route::get('/categories/{id}',     [CategoryController::class, 'show']);
Route::post('/categories',         [CategoryController::class, 'store']);
Route::put('/categories/{id}',     [CategoryController::class, 'update']);
Route::delete('/categories/{id}',  [CategoryController::class, 'destroy']);

// ===== Brands =====
Route::get('/brands', [BrandController::class, 'index']);

// ===== Orders =====
// QUAN TRỌNG: đặt /track trước /{order}
Route::get('/orders',        [OrderController::class, 'index']);
Route::get('/orders/track',  [OrderController::class, 'track']);
Route::get('/orders/{order}', [OrderController::class, 'show'])->whereNumber('order');

Route::post('/orders/{order}/cancel', [OrderController::class, 'cancelById']);
Route::post('/orders/cancel',        [OrderController::class, 'cancel']);


// Cập nhật tiến trình (ghi status_step/step_code) — KHÔNG trùng lặp
Route::match(['put', 'patch'], '/orders/{order}',        [OrderController::class, 'updateStatusStep'])->whereNumber('order');
Route::match(['post', 'put'],  '/orders/{order}/status', [OrderController::class, 'updateStatusStep'])->whereNumber('order');
Route::post('/orders/update-status', [OrderController::class, 'updateStatusStepById']);

// ===== My Orders (cần Bearer) — TRẢ LUÔN total để FE hiển thị =====
Route::middleware('auth:sanctum')->get('/my-orders', function (Request $req) {
    return Order::withSum('details as total', 'amount')   // <- tính tổng
        ->where('email', $req->user()->email)
        ->latest('id')
        ->get();
});

// Checkout
Route::post('/checkout', [OrderController::class, 'checkout'])->middleware('auth:sanctum');

// ===== Admin (/api/admin/...) =====
Route::prefix('admin')->group(function () {
    Route::get('/products',          [ProductController::class, 'adminIndex']);
    Route::get('/products/{id}',     [ProductController::class, 'show']);
    Route::post('/products',         [ProductController::class, 'store']);
    Route::put('/products/{id}',     [ProductController::class, 'update']);
    Route::delete('/products/{id}',  [ProductController::class, 'destroy']);
});

// ===== Users (Admin quản lý user) — BẠN ĐANG THIẾU NHÓM NÀY =====
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/users',           [UserController::class, 'index']);
    Route::get('/users/{id}',      [UserController::class, 'show']);
    Route::post('/users',          [UserController::class, 'store']);
    Route::put('/users/{id}',      [UserController::class, 'update']);
    Route::delete('/users/{id}',   [UserController::class, 'destroy']);
    Route::post('/users/{id}/lock', [UserController::class, 'lock']);
    Route::post('/users/{id}/unlock', [UserController::class, 'unlock']);
});
