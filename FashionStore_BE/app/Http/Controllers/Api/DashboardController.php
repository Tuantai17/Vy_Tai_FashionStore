<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardController extends Controller
{
    public function overview()
    {
        try {
            $productTable = (new Product)->getTable();
            $orderTable   = (new Order)->getTable();

            // 1) Tổng sản phẩm (bỏ soft-deleted nếu có)
            $productsQ = Product::query();
            if (Schema::hasColumn($productTable, 'deleted_at')) {
                $productsQ->whereNull('deleted_at');
            }
            $totalProducts = $productsQ->count();

            // 2) Tổng đơn hàng
            $totalOrders = Order::count();

            // 3) Xác định điều kiện "đã giao"
            $deliveredQ = Order::query();
            if (Schema::hasColumn($orderTable, 'status')) {
                $deliveredQ->where('status', 4);
            } elseif (Schema::hasColumn($orderTable, 'step_code')) {
                $deliveredQ->where('step_code', 4);
            } elseif (Schema::hasColumn($orderTable, 'status_step')) {
                $deliveredQ->where('status_step', 'delivered');
            } // nếu không có cột nào → không lọc (coi như 0 đơn đã giao)

            // 4) Xác định biểu thức cộng doanh thu
            if (Schema::hasColumn($orderTable, 'grand_total') || Schema::hasColumn($orderTable, 'total')) {
                $sumExpr = 'SUM(COALESCE(grand_total, total, 0)) as s';
            } else {
                $sumExpr = '0 as s';
            }
            $totalRevenue = (float) ($deliveredQ->clone()  // clone để không phá điều kiện
                ->select(DB::raw($sumExpr))
                ->value('s') ?? 0);

            // 5) Sản phẩm tồn kho thấp (≤10) – chỉ khi có cột qty
            $lowQ = Product::query();
            if (Schema::hasColumn($productTable, 'deleted_at')) {
                $lowQ->whereNull('deleted_at');
            }
            if (Schema::hasColumn($productTable, 'qty')) {
                $lowQ->where('qty', '<=', 10)->orderBy('qty');
                $lowStockProducts = $lowQ->limit(5)->get(['id', 'name', 'qty']);
            } else {
                $lowStockProducts = collect(); // không có cột qty → trả rỗng
            }

            return response()->json([
                'data' => [
                    'totalProducts'    => (int) $totalProducts,
                    'totalOrders'      => (int) $totalOrders,
                    'totalRevenue'     => (float) $totalRevenue,
                    'totalUsers'       => (int) User::count(),
                    'lowStockProducts' => $lowStockProducts,
                ]
            ]);
        } catch (\Throwable $e) {
            // Trả message rõ ràng để debug từ FE nếu cần
            return response()->json([
                'message' => 'overview_failed',
                'error'   => $e->getMessage(),
            ], 422);
        }
    }
}
