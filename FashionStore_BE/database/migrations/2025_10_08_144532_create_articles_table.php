<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('articles')) {
            Schema::create('articles', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug')->unique();
                $table->string('source')->nullable();
                $table->string('author')->nullable();
                $table->string('url', 255)->nullable();
                $table->string('image_url', 255)->nullable();
                $table->string('summary')->nullable();
                $table->longText('content_html')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        } else {
            // Bảng đã có: chỉ thêm các cột còn thiếu (nếu cần)
            Schema::table('articles', function (Blueprint $table) {
                if (!Schema::hasColumn('articles', 'slug')) {
                    $table->string('slug')->nullable()->after('title');
                }
                if (!Schema::hasColumn('articles', 'source')) {
                    $table->string('source')->nullable()->after('slug');
                }
                if (!Schema::hasColumn('articles', 'author')) {
                    $table->string('author')->nullable()->after('source');
                }
                if (!Schema::hasColumn('articles', 'url')) {
                    $table->string('url', 255)->nullable()->after('author');
                }
                if (!Schema::hasColumn('articles', 'image_url')) {
                    $table->string('image_url', 255)->nullable()->after('url');
                }
                if (!Schema::hasColumn('articles', 'summary')) {
                    $table->string('summary')->nullable()->after('image_url');
                }
                if (!Schema::hasColumn('articles', 'content_html')) {
                    $table->longText('content_html')->nullable()->after('summary');
                }
                if (!Schema::hasColumn('articles', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('content_html');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
