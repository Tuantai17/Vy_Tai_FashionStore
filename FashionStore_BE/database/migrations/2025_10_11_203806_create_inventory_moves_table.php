<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('inventory_moves')) {
            return;
        }

        // 1) Gỡ FK cũ nếu còn (tự dò tên FK)
        $fk = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'inventory_moves'
              AND COLUMN_NAME = 'user_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
        ");
        if ($fk && isset($fk->CONSTRAINT_NAME)) {
            DB::statement("ALTER TABLE `inventory_moves` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
        }

        // 2) Đảm bảo cột user_id cho phép NULL (không dùng change() để khỏi cần doctrine/dbal)
        DB::statement("ALTER TABLE `inventory_moves` MODIFY `user_id` BIGINT UNSIGNED NULL");

        // 3) Làm sạch dữ liệu mồ côi: đặt NULL cho user_id không tồn tại ở users.id
        // (Cách 1 – LEFT JOIN UPDATE: MySQL OK)
        DB::statement("
            UPDATE `inventory_moves` im
            LEFT JOIN `users` u ON u.id = im.user_id
            SET im.user_id = NULL
            WHERE u.id IS NULL
        ");

        // (Tùy chọn) xoá nốt các giá trị 0/âm nếu có:
        DB::statement("UPDATE `inventory_moves` SET `user_id` = NULL WHERE `user_id` <= 0");

        // 4) Thêm FK mới, tên rõ ràng, ON DELETE SET NULL
        Schema::table('inventory_moves', function (Blueprint $table) {
            $table->foreign('user_id', 'inv_moves_user_fk')
                ->references('id')->on('users')
                ->nullOnDelete(); // ON DELETE SET NULL
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('inventory_moves')) {
            return;
        }

        // Drop FK mới nếu cần rollback
        $exists = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'inventory_moves'
              AND CONSTRAINT_NAME = 'inv_moves_user_fk'
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            LIMIT 1
        ");
        if ($exists) {
            DB::statement("ALTER TABLE `inventory_moves` DROP FOREIGN KEY `inv_moves_user_fk`");
        }

        // (tuỳ yêu cầu) có thể đặt lại NOT NULL
        // DB::statement("ALTER TABLE `inventory_moves` MODIFY `user_id` BIGINT UNSIGNED NOT NULL");
    }
};
