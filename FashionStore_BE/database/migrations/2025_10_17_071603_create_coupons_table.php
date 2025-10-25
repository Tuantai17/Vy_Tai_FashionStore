<?php

// database/migrations/2025_01_01_000000_create_coupons_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tạo bảng coupons nếu chưa có
        if (!Schema::hasTable('coupons')) {
            Schema::create('coupons', function (Blueprint $t) {
                $t->id();
                $t->string('code')->unique();
                $t->enum('type', ['fixed', 'percent']);
                $t->decimal('value', 12, 2);
                $t->decimal('min_order_total', 12, 2)->default(0);
                $t->unsignedInteger('max_uses')->nullable();
                $t->unsignedInteger('used_count')->default(0);
                $t->timestamp('expires_at')->nullable();
                $t->boolean('is_active')->default(true);
                $t->timestamps();
            });
        }

        // Chỉ thêm cột vào orders nếu bảng tồn tại
        $ordersTable = (new \App\Models\Order)->getTable(); // dùng đúng tên bảng của Model
        if (Schema::hasTable($ordersTable)) {
            Schema::table($ordersTable, function (Blueprint $t) use ($ordersTable) {
                if (!Schema::hasColumn($ordersTable, 'coupon_code')) {
                    $t->string('coupon_code', 50)->nullable()->index();
                }
                if (!Schema::hasColumn($ordersTable, 'discount_amount')) {
                    $t->decimal('discount_amount', 12, 2)->default(0);
                }
                // có thể thêm 2 cột dưới nếu muốn
                // if (!Schema::hasColumn($ordersTable, 'subtotal')) { $t->decimal('subtotal', 12,2)->nullable(); }
                // if (!Schema::hasColumn($ordersTable, 'shipping')) { $t->decimal('shipping', 12,2)->nullable(); }
            });
        }
    }

    public function down(): void
    {
        $ordersTable = (new \App\Models\Order)->getTable();

        if (Schema::hasTable($ordersTable)) {
            Schema::table($ordersTable, function (Blueprint $t) use ($ordersTable) {
                if (Schema::hasColumn($ordersTable, 'discount_amount')) $t->dropColumn('discount_amount');
                if (Schema::hasColumn($ordersTable, 'coupon_code'))     $t->dropColumn('coupon_code');
                // if (Schema::hasColumn($ordersTable, 'shipping'))        $t->dropColumn('shipping');
                // if (Schema::hasColumn($ordersTable, 'subtotal'))        $t->dropColumn('subtotal');
            });
        }

        if (Schema::hasTable('coupons')) {
            Schema::drop('coupons');
        }
    }
};
