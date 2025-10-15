<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Chỉ tạo bảng nếu chưa có
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->string('order_id')->nullable();
                $table->string('request_id')->nullable();
                $table->bigInteger('amount')->default(0);
                $table->string('partner_code')->nullable();
                $table->string('trans_id')->nullable();
                $table->integer('result_code')->nullable();
                $table->string('message')->nullable();
                $table->string('method')->nullable();
                $table->json('raw')->nullable();
                $table->timestamps();
            });
        } else {
            // Nếu bảng tồn tại, đảm bảo các cột quan trọng có đủ
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'method')) {
                    $table->string('method')->nullable()->after('message');
                }
                if (!Schema::hasColumn('payments', 'raw')) {
                    $table->json('raw')->nullable()->after('method');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
