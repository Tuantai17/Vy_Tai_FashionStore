<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Order;


use App\Http\Controllers\Api\MomoController;
use App\Models\Payment;

use App\Http\Controllers\Api\ProductImportController;
use App\Http\Controllers\Api\InventoryController;

use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\PublicCouponController;

use App\Http\Controllers\Api\CouponController;


use App\Http\Controllers\Api\ChatController;


use App\Http\Controllers\Api\{
    ProductController,
    CategoryController,
    BrandController,
    AuthController,
    OrderController,
    UserController,
    ReviewController,
    AdminDashboardController
};
// import products from CSV




use App\Http\Controllers\Api\ChatbotGeminiController;

Route::post('/chat-gemini', [ChatbotGeminiController::class, 'chat']);
Route::post('/chat-gemini/stream', [ChatbotGeminiController::class, 'chatStream']);






// ===== Admin Dashboard =====

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::post('/products/import', [ProductImportController::class, 'import']);
    Route::get('/products/export', [ProductImportController::class, 'export']);

    // Inventory
    Route::get('/inventory',            [InventoryController::class, 'index']);
    Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);
    Route::get('/inventory/{product}/moves', [InventoryController::class, 'moves']);

    // Orders (admin analytics + management)
    Route::get('/orders', [OrderController::class, 'index']);

    // Coupon management (authenticated admin routes)
    Route::apiResource('coupons', CouponController::class); // index,store,show,update,destroy
});



Route::get('/coupons', [PublicCouponController::class, 'index']);
// public/apply (khï¿½ng c?n admin)
Route::post('/coupons/apply', [CouponController::class, 'apply']); // body: {code, subtotal}


//chat ai

Route::middleware('throttle:60,1')->group(function () {
    Route::get('/chat/stream', [ChatController::class, 'stream']);   // SSE (GET ?message=...)
    Route::post('/chat',       [ChatController::class, 'chat']);     // JSON fallback
    Route::post('/chat/save',  [ChatController::class, 'save']);     // Luu transcript (optional)
});

// (optional) tool routes
Route::get('/chat/tools/order-tracking/{code}', [\App\Http\Controllers\Api\OrderController::class, 'track']);
Route::get('/chat/tools/search-products', [\App\Http\Controllers\Api\ProductController::class, 'search']);



///--------------------------------------
// //momo
// Route::post('/payments/momo/create', [MomoController::class, 'create']);  // t?o l?nh thanh toï¿½n
// Route::post('/payments/momo/ipn',    [MomoController::class, 'ipn']);     // MoMo g?i v? (server-to-server)
// Route::get('/payments/momo/return',  [MomoController::class, 'return']);  // ngu?i dï¿½ng quay l?i site
// // routes/api.php
// Route::get('/ping', fn() => response()->json(['ok' => true]));


// MoMo routes (b?t l?i)
Route::post('/momo/create', [MomoController::class, 'create']);
Route::match(['get', 'post'], '/momo/callback', [MomoController::class, 'callback']);
Route::match(['get', 'post'], '/momo/return',   [MomoController::class, 'return']);



// routes/api.php
Route::get('/momo/status', function (Request $req) {
    $orderId = $req->query('orderId');

    if (!$orderId) {
        return response()->json([
            'resultCode' => 9999,
            'message'    => 'Thi?u orderId'
        ], 400);
    }

    $payment = Payment::where('order_id', $orderId)
        ->latest('id')
        ->first();

    if (!$payment) {
        return response()->json([
            'resultCode' => 7002,
            'message'    => 'Chua cï¿½ thï¿½ng tin thanh toï¿½n.'
        ]);
    }

    return response()->json([
        'orderId'    => $payment->order_id,
        'resultCode' => (int) $payment->result_code,
        'message'    => $payment->message ?? 'ï¿½ang x? lï¿½',
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

// ===== Reviews (?? ph?i d?t tru?c /products/{id}) =====
Route::get('/products/{id}/reviews', [ReviewController::class, 'index']);
Route::get('/products/{id}/can-review', [ReviewController::class, 'canReview'])->middleware('auth:sanctum');
Route::post('/products/{id}/reviews', [ReviewController::class, 'store'])->middleware('auth:sanctum');
Route::put('/reviews/{id}', [ReviewController::class, 'update'])->middleware('auth:sanctum');
Route::delete('/reviews/{id}', [ReviewController::class, 'destroy'])->middleware('auth:sanctum');




Route::middleware('auth:sanctum')->group(function () {
    Route::get('wishlist', [WishlistController::class, 'index']);
    Route::get('wishlist/count', [WishlistController::class, 'count']); // tu? ch?n
    Route::post('wishlist/toggle', [WishlistController::class, 'toggle']);
    Route::delete('wishlist/{product}', [WishlistController::class, 'destroy']);

    // Orders owned by authenticated customer
    Route::get('orders/mine', [OrderController::class, 'mine']);
});




// ===== Products =====
Route::get('/products',      [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories/{id}/products', [ProductController::class, 'byCategory'])->whereNumber('id');
// ? Danh sï¿½ch s?n ph?m theo danh m?c (public)
Route::get('/categories/{id}/products', [ProductController::class, 'byCategory']);



Route::get('/admin/products/trash', [ProductController::class, 'trash']);
Route::post('/admin/products/{id}/restore', [ProductController::class, 'restore']);
Route::post('/admin/products/{id}/force-delete', [ProductController::class, 'forceDestroy']);

// ===== Categories (CRUD) =====
Route::get('/categories',          [CategoryController::class, 'index']);
Route::get('/categories/{id}',     [CategoryController::class, 'show']);
Route::put('/admin/categories/{id}', [CategoryController::class, 'update']);

Route::prefix('admin')->group(function () {
    // ? li?t kï¿½ dang ho?t d?ng (paginator)
    Route::get('/categories', [CategoryController::class, 'adminIndex']);

    // ? TRASH tru?c {id} d? khï¿½ng b? nu?t
    Route::get('/categories/trash', [CategoryController::class, 'trash']);

    // ? CRUD
    Route::post('/categories',        [CategoryController::class, 'store']);
    Route::put('/categories/{id}',    [CategoryController::class, 'update'])->whereNumber('id');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->whereNumber('id');

    // ? show (n?u c?n cho admin)
    Route::get('/categories/{id}',    [CategoryController::class, 'show'])->whereNumber('id');

    // ? restore/force-delete
    Route::post('/categories/{id}/restore',      [CategoryController::class, 'restore'])->whereNumber('id');
    Route::post('/categories/{id}/force-delete', [CategoryController::class, 'forceDestroy'])->whereNumber('id');
});

// ===== Brands =====
Route::get('/brands', [BrandController::class, 'index']);

// ===== Orders =====
// QUAN TR?NG: d?t /track tru?c /{order}
Route::get('/orders',        [OrderController::class, 'index']);
Route::get('/orders/track',  [OrderController::class, 'track']);
Route::get('/orders/{order}', [OrderController::class, 'show'])->whereNumber('order');

Route::post('/orders/{order}/cancel', [OrderController::class, 'cancelById']);
Route::post('/orders/cancel', [OrderController::class, 'cancel']);
// C?p nh?t ti?n trï¿½nh (ghi status_step/step_code) ï¿½ KHï¿½NG trï¿½ng l?p
Route::match(['put', 'patch'], '/orders/{order}',        [OrderController::class, 'updateStatusStep'])->whereNumber('order');
Route::match(['post', 'put'],  '/orders/{order}/status', [OrderController::class, 'updateStatusStep'])->whereNumber('order');
Route::post('/orders/update-status', [OrderController::class, 'updateStatusStepById']);

// ===== My Orders (c?n Bearer) ï¿½ TR? LUï¿½N total d? FE hi?n th? =====
Route::middleware('auth:sanctum')->get('/my-orders', [OrderController::class, 'mine']);

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

// Route::get('/admin/users', [UserController::class, 'index']);


// ===== Users (Admin qu?n lï¿½ user) ï¿½ B?N ï¿½ANG THI?U NHï¿½M Nï¿½Y =====
// ===== Admin: Users =====
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/users',           [UserController::class, 'index']);
    Route::get('/users/{id}',      [UserController::class, 'show']);
    Route::post('/users',          [UserController::class, 'store']);
    Route::put('/users/{id}',      [UserController::class, 'update']);
    Route::delete('/users/{id}',   [UserController::class, 'destroy']);
    Route::post('/users/{id}/lock',   [UserController::class, 'lock']);
    Route::post('/users/{id}/unlock', [UserController::class, 'unlock']);
});
