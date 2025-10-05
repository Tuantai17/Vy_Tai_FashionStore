<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Chỉ thêm nếu cột chưa tồn tại
        if (!Schema::hasColumn('nqtv_order', 'confirmed_at')) {
            Schema::table('nqtv_order', function (Blueprint $table) {
                $table->timestamp('confirmed_at')->nullable();
            });
        }

        if (!Schema::hasColumn('nqtv_order', 'ready_at')) {
            Schema::table('nqtv_order', function (Blueprint $table) {
                $table->timestamp('ready_at')->nullable();
            });
        }

        if (!Schema::hasColumn('nqtv_order', 'shipped_at')) {
            Schema::table('nqtv_order', function (Blueprint $table) {
                $table->timestamp('shipped_at')->nullable();
            });
        }

        if (!Schema::hasColumn('nqtv_order', 'delivered_at')) {
            Schema::table('nqtv_order', function (Blueprint $table) {
                $table->timestamp('delivered_at')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('nqtv_order', 'delivered_at')) {
            Schema::table('nqtv_order', fn(Blueprint $table) => $table->dropColumn('delivered_at'));
        }
        if (Schema::hasColumn('nqtv_order', 'shipped_at')) {
            Schema::table('nqtv_order', fn(Blueprint $table) => $table->dropColumn('shipped_at'));
        }
        if (Schema::hasColumn('nqtv_order', 'ready_at')) {
            Schema::table('nqtv_order', fn(Blueprint $table) => $table->dropColumn('ready_at'));
        }
        if (Schema::hasColumn('nqtv_order', 'confirmed_at')) {
            Schema::table('nqtv_order', fn(Blueprint $table) => $table->dropColumn('confirmed_at'));
        }
    }
};
