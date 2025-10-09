<?php
// tin tuc
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
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('source')->nullable();          // Vogue, Elle, …
            $table->string('author')->nullable();
            $table->string('url')->unique();               // link gốc
            $table->string('image_url')->nullable();
            $table->text('summary')->nullable();
            $table->longText('content_html')->nullable();  // giữ HTML đã parse
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['published_at']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
