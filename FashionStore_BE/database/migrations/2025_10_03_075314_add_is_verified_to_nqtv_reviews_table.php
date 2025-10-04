<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_is_verified_to_nqtv_reviews_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('nqtv_reviews', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->after('comment');
        });
    }
    public function down(): void
    {
        Schema::table('nqtv_reviews', function (Blueprint $table) {
            $table->dropColumn('is_verified');
        });
    }
};
