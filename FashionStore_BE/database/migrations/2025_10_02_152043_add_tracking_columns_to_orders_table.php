<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('nqtv_order', function (Blueprint $table) {
            // tiến trình hiển thị cho khách
            if (!Schema::hasColumn('nqtv_order', 'status_step')) {
                $table->string('status_step')->default('pending')->index();
            }
            if (!Schema::hasColumn('nqtv_order', 'step_code')) {
                $table->unsignedTinyInteger('step_code')->default(0);
            }

            if (!Schema::hasColumn('nqtv_order', 'confirmed_at')) {
                $table->timestamp('confirmed_at')->nullable();
            }
            if (!Schema::hasColumn('nqtv_order', 'ready_at')) {
                $table->timestamp('ready_at')->nullable();
            }
            if (!Schema::hasColumn('nqtv_order', 'shipped_at')) {
                $table->timestamp('shipped_at')->nullable();
            }
            if (!Schema::hasColumn('nqtv_order', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('nqtv_order', function (Blueprint $table) {
            // rollback: xoá các cột đã thêm
            if (Schema::hasColumn('nqtv_order', 'status_step')) {
                $table->dropColumn('status_step');
            }
            if (Schema::hasColumn('nqtv_order', 'step_code')) {
                $table->dropColumn('step_code');
            }
            if (Schema::hasColumn('nqtv_order', 'delivered_at')) {
                $table->dropColumn('delivered_at');
            }
            if (Schema::hasColumn('nqtv_order', 'shipped_at')) {
                $table->dropColumn('shipped_at');
            }
            if (Schema::hasColumn('nqtv_order', 'ready_at')) {
                $table->dropColumn('ready_at');
            }
            if (Schema::hasColumn('nqtv_order', 'confirmed_at')) {
                $table->dropColumn('confirmed_at');
            }
        });
    }
};
