<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Xóa dữ liệu trùng lặp: giữ lại bản mới nhất cho mỗi (user_id, product_id)
        DB::statement("
            DELETE FROM nqtv_reviews
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT MAX(id) as id
                    FROM nqtv_reviews
                    GROUP BY user_id, product_id
                ) t
            );
        ");

        // Thêm unique constraint để 1 user chỉ review 1 lần / 1 product
        Schema::table('nqtv_reviews', function (Blueprint $table) {
            $table->unique(['user_id','product_id'], 'nqtv_reviews_user_id_product_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('nqtv_reviews', function (Blueprint $table) {
            $table->dropUnique('nqtv_reviews_user_id_product_id_unique');
        });
    }
};
