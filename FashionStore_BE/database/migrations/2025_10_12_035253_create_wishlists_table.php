<?php

// database/migrations/xxxx_xx_xx_xxxxxx_create_wishlists_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('nqtv_wishlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('nqtv_user')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('nqtv_product')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'product_id']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('nqtv_wishlist');
    }
};
