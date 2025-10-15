<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('nqtv_reviews', 'is_verified')) {
            Schema::table('nqtv_reviews', function (Blueprint $table) {
                // boolean -> MySQL sẽ map thành tinyint(1)
                $table->boolean('is_verified')->default(false)->after('comment');
                // hoặc: $table->tinyInteger('is_verified')->default(0)->after('comment');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('nqtv_reviews', 'is_verified')) {
            Schema::table('nqtv_reviews', function (Blueprint $table) {
                $table->dropColumn('is_verified');
            });
        }
    }
};
