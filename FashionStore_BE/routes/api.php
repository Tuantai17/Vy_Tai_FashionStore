<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;


use App\Http\Controllers\Api\BrandController;

// ===== Order =====
Route::get('/orders', [OrderController::class, 'index']);   // danh sách đơn
Route::get('/orders/{order}', [OrderController::class, 'show']); // chi tiết 1 đơn

// ===== Auth =====
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
Route::post('/logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum');

// ===== Products =====
Route::get('/products',       [ProductController::class, 'index']);
Route::get('/products/{id}',  [ProductController::class, 'show']);

// ===== Categories =====
Route::get('/categories',               [CategoryController::class, 'index']);
Route::get('/categories/{id}',          [CategoryController::class, 'show']);
Route::get('/categories/{id}/products', [ProductController::class, 'byCategory']);

// ===== Brands =====
Route::get('/brands', [BrandController::class, 'index']);


// ===== Orders =====
// ✅ Bắt buộc user phải đăng nhập mới checkout
Route::post('/checkout', [OrderController::class, 'checkout'])->middleware('auth:sanctum');

// ===== Admin (/api/admin/...) =====
Route::prefix('admin')->group(function () {
    Route::get('/products', [ProductController::class, 'adminIndex']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);   // ✅ cần có
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
});
