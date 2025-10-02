<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('nqtv_order', function (Blueprint $table) {
            // tiến trình hiển thị cho khách
            $table->string('status_step')->default('pending')->index();
            $table->unsignedTinyInteger('step_code')->default(0);

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('nqtv_order', function (Blueprint $table) {
            // rollback: xoá các cột đã thêm
            $table->dropColumn([
                'status_step',
                'step_code',
                // 'confirmed_at', 'ready_at', 'shipped_at', 'delivered_at',
            ]);
        });
    }
};
