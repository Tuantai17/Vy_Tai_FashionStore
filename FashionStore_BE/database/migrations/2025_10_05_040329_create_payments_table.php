<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // Mã đơn hàng nội bộ hệ thống của bạn
            $table->string('order_id')->index();

            // Mã request do bạn gửi lên MoMo (duy nhất cho mỗi lần request)
            $table->string('request_id')->nullable();

            // Số tiền thanh toán (đơn vị: VND)
            $table->bigInteger('amount')->default(0);

            // Mã đối tác MoMo (partnerCode)
            $table->string('partner_code')->nullable();

            // Mã giao dịch MoMo trả về (transId)
            $table->string('trans_id')->nullable();

            // resultCode: 0 = Thành công, khác 0 = Lỗi
            $table->integer('result_code')->nullable();

            // Thông báo / message từ MoMo (ví dụ: "Successful.")
            $table->string('message')->nullable();

            // Phương thức thanh toán: momo_wallet, payWithATM, v.v.
            $table->string('method')->nullable();

            // Dữ liệu gốc (raw JSON trả về từ MoMo)
            $table->json('raw')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
