<?php

// database/migrations/2025_10_12_000001_fix_inventory_moves_fk.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Tên constraint cũ có thể khác; kiểm tra bằng SHOW CREATE TABLE nếu cần
        DB::statement('ALTER TABLE `inventory_moves` DROP FOREIGN KEY `inventory_moves_user_id_foreign`');

        // Cho phép NULL
        Schema::table('inventory_moves', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        // Tạo lại FK: ON DELETE SET NULL
        Schema::table('inventory_moves', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // không bắt buộc rollback
    }
};
