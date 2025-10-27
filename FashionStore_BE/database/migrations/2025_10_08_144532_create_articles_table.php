<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Nếu bảng chưa tồn tại thì tạo mới hoàn chỉnh
        if (!Schema::hasTable('articles')) {
            Schema::create('articles', function (Blueprint $table) {
                $table->id();

                // Nội dung chính
                $table->string('title', 200);
                $table->string('slug', 220)->unique();
                $table->string('excerpt', 500)->nullable(); // tóm tắt
                $table->longText('content_html')->nullable();
                $table->longText('content_md')->nullable();

                // Metadata & nguồn
                $table->string('cover_image')->nullable();  // ảnh đại diện
                $table->string('source_url')->nullable();   // link gốc
                $table->json('tags')->nullable();
                $table->string('seo_title', 70)->nullable();
                $table->string('seo_desc', 160)->nullable();

                // Tác giả, phân loại
                $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();

                // Trạng thái
                $table->boolean('is_published')->default(true);
                $table->timestamp('published_at')->nullable();

                $table->timestamps();
            });
        }
        // Nếu bảng đã tồn tại thì chỉ thêm cột còn thiếu
        else {
            Schema::table('articles', function (Blueprint $table) {
                if (!Schema::hasColumn('articles', 'excerpt')) {
                    $table->string('excerpt', 500)->nullable()->after('slug');
                }
                if (!Schema::hasColumn('articles', 'content_html')) {
                    $table->longText('content_html')->nullable()->after('excerpt');
                }
                if (!Schema::hasColumn('articles', 'content_md')) {
                    $table->longText('content_md')->nullable()->after('content_html');
                }
                if (!Schema::hasColumn('articles', 'cover_image')) {
                    $table->string('cover_image')->nullable()->after('content_md');
                }
                if (!Schema::hasColumn('articles', 'source_url')) {
                    $table->string('source_url')->nullable()->after('cover_image');
                }
                if (!Schema::hasColumn('articles', 'tags')) {
                    $table->json('tags')->nullable()->after('source_url');
                }
                if (!Schema::hasColumn('articles', 'seo_title')) {
                    $table->string('seo_title', 70)->nullable()->after('tags');
                }
                if (!Schema::hasColumn('articles', 'seo_desc')) {
                    $table->string('seo_desc', 160)->nullable()->after('seo_title');
                }
                if (!Schema::hasColumn('articles', 'category_id')) {
                    $table->foreignId('category_id')->nullable()->after('seo_desc');
                }
                if (!Schema::hasColumn('articles', 'author_id')) {
                    $table->foreignId('author_id')->nullable()->after('category_id');
                }
                if (!Schema::hasColumn('articles', 'is_published')) {
                    $table->boolean('is_published')->default(true)->after('author_id');
                }
                if (!Schema::hasColumn('articles', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('is_published');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
