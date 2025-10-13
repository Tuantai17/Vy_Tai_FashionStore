<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('nqtv_stock_move', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('product_id');
            $t->integer('change');                 // +n nhập kho, -n trừ kho
            $t->integer('qty_before')->nullable();
            $t->integer('qty_after')->nullable();
            $t->string('type', 30)->nullable();    // import|sale|cancel|return|manual
            $t->unsignedBigInteger('order_id')->nullable();
            $t->text('note')->nullable();
            $t->unsignedBigInteger('user_id')->nullable();
            $t->timestamps();

            $t->index('product_id');
            $t->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nqtv_stock_move');
    }
};
