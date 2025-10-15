<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Nếu bảng chưa tồn tại thì mới tạo
        if (!Schema::hasTable('nqtv_reviews')) {
            Schema::create('nqtv_reviews', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('product_id');
                $table->tinyInteger('rating')->default(5); // điểm 1-5
                $table->text('comment')->nullable();
                $table->timestamps();

                // index cơ bản để join nhanh hơn
                $table->index('user_id');
                $table->index('product_id');
            });
        } else {
            // Nếu bảng đã tồn tại, kiểm tra và thêm cột nếu thiếu
            Schema::table('nqtv_reviews', function (Blueprint $table) {
                if (!Schema::hasColumn('nqtv_reviews', 'comment')) {
                    $table->text('comment')->nullable()->after('rating');
                }
                if (!Schema::hasColumn('nqtv_reviews', 'rating')) {
                    $table->tinyInteger('rating')->default(5)->after('product_id');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('nqtv_reviews');
    }
};
