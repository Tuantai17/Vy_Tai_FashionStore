<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Nếu bảng đã tồn tại → không tạo lại, chỉ bổ sung cột thiếu (nếu cần)
        if (Schema::hasTable('nqtv_stock_move')) {
            Schema::table('nqtv_stock_move', function (Blueprint $table) {
                if (!Schema::hasColumn('nqtv_stock_move', 'product_id')) {
                    $table->unsignedBigInteger('product_id')->after('id');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'change')) {
                    $table->integer('change')->after('product_id');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'qty_before')) {
                    $table->integer('qty_before')->nullable()->after('change');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'qty_after')) {
                    $table->integer('qty_after')->nullable()->after('qty_before');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'type')) {
                    $table->string('type', 30)->nullable()->after('qty_after');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'order_id')) {
                    $table->unsignedBigInteger('order_id')->nullable()->after('type');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'note')) {
                    $table->text('note')->nullable()->after('order_id');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('note');
                }

                // Index giúp join nhanh hơn
                if (!Schema::hasColumn('nqtv_stock_move', 'product_id')) {
                    $table->index('product_id');
                }
                if (!Schema::hasColumn('nqtv_stock_move', 'order_id')) {
                    $table->index('order_id');
                }
            });

            return; // đã xử lý, thoát sớm
        }

        // Bảng chưa có → tạo mới
        Schema::create('nqtv_stock_move', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->integer('change');
            $table->integer('qty_before')->nullable();
            $table->integer('qty_after')->nullable();
            $table->string('type', 30)->nullable();     // import/export/adjust...
            $table->unsignedBigInteger('order_id')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nqtv_stock_move');
    }
};
