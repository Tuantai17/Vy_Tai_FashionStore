<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;





use App\Http\Controllers\Api\MomoController;





use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

Route::get('/__artisan', function (Request $request) {
    // 1) Check key
    $key = $request->query('key');
    abort_unless(hash_equals(config('app.artisan_key'), (string) $key), 403, 'Forbidden');

    // 2) Whitelist lệnh cho phép
    $allowed = [
        'migrate',
        'migrate:fresh',
        'migrate:rollback',
        'config:cache',
        'config:clear',
        'route:cache',
        'route:clear',
        'view:cache',
        'view:clear',
        'cache:clear',
        'optimize',
        'optimize:clear',
        'storage:link',
    ];

    $cmd = (string) $request->query('cmd');
    abort_unless(in_array($cmd, $allowed, true), 400, 'Command not allowed');

    // 3) Nhận args: có thể truyền nhiều ?args[]=--force&args[]=--seed
    $argsList = (array) $request->query('args', []);
    // Cho phép cả args là chuỗi: ?args=--force --seed
    if (is_string($argsList)) {
        $argsList = preg_split('/\s+/', trim($argsList)) ?: [];
    }

    // Convert về mảng options cho Artisan::call
    $args = [];
    foreach ($argsList as $item) {
        if (str_starts_with($item, '--')) {
            // --force => ['--force' => true]
            $opt = ltrim($item, '-');
            $parts = explode('=', $opt, 2);
            $name = $parts[0];
            $value = $parts[1] ?? true;
            $args["--{$name}"] = $value;
        }
    }

    // 4) Chạy lệnh
    $exit = Artisan::call($cmd, $args);

    return response()->json([
        'ok'       => $exit === 0,
        'exitCode' => $exit,
        'cmd'      => $cmd,
        'args'     => $args,
        'output'   => Artisan::output(),
    ]);
})->middleware('throttle:2,1'); // Giới hạn 2 request / phút





Route::get('/momo/return', [MomoController::class, 'return'])->name('momo.return');

// ===== Auth =====


Route::view('/', 'welcome');

Route::post('/register', [AuthController::class, 'register']);


// ===== Products =====
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// ===== Categories =====
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/categories/{id}/products', [ProductController::class, 'byCategory']); // tránh trùng

// ===== Admin (/api/admin/...) =====
Route::prefix('admin')->group(function () {
    Route::get('/products', [ProductController::class, 'adminIndex']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
});
