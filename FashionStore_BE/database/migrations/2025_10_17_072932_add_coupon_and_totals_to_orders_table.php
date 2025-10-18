<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {

    // Nếu bạn có nhiều connection, có thể ép về connection mặc định:
    // protected $connection = 'mysql';

    public function up(): void
    {
        // Lấy đúng tên bảng từ Model (phòng khi bạn đặt $table khác 'orders')
        $ordersTable = (new \App\Models\Order)->getTable();

        // Nếu bảng chưa có thì bỏ qua, tránh fail khi DB chưa dựng xong
        if (!Schema::hasTable($ordersTable)) {
            // có thể log hoặc cứ return để lần migrate sau, khi orders có rồi, nó sẽ chạy tiếp
            return;
        }

        Schema::table($ordersTable, function (Blueprint $t) use ($ordersTable) {
            if (!Schema::hasColumn($ordersTable, 'coupon_code')) {
                $t->string('coupon_code', 50)->nullable()->index();
            }
            if (!Schema::hasColumn($ordersTable, 'discount_amount')) {
                $t->decimal('discount_amount', 12, 2)->default(0);
            }
            if (!Schema::hasColumn($ordersTable, 'subtotal')) {
                $t->decimal('subtotal', 12, 2)->nullable();
            }
            if (!Schema::hasColumn($ordersTable, 'shipping')) {
                $t->decimal('shipping', 12, 2)->nullable();
            }
        });
    }

    public function down(): void
    {
        $ordersTable = (new \App\Models\Order)->getTable();

        if (!Schema::hasTable($ordersTable)) {
            return;
        }

        Schema::table($ordersTable, function (Blueprint $t) use ($ordersTable) {
            if (Schema::hasColumn($ordersTable, 'shipping'))        $t->dropColumn('shipping');
            if (Schema::hasColumn($ordersTable, 'subtotal'))        $t->dropColumn('subtotal');
            if (Schema::hasColumn($ordersTable, 'discount_amount')) $t->dropColumn('discount_amount');
            if (Schema::hasColumn($ordersTable, 'coupon_code'))     $t->dropColumn('coupon_code');
        });
    }
};
