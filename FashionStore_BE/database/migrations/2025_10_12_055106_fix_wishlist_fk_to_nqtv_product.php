<?php

// use Illuminate\Database\Schema\Blueprint;
// use Illuminate\Support\Facades\Schema;

// return new class extends \Illuminate\Database\Migrations\Migration {
//     public function up(): void
//     {
//         Schema::table('wishlists', function (Blueprint $table) {
//             // tên cũ thường là 'wishlists_product_id_foreign'
//             $table->dropForeign(['product_id']);

//             // đảm bảo type khớp với nqtv_product.id (thường là unsignedBigInteger)
//             $table->unsignedBigInteger('product_id')->change();

//             $table->foreign('product_id')
//                   ->references('id')->on('nqtv_product')
//                   ->cascadeOnDelete();
//         });
//     }

//     public function down(): void
//     {
//         Schema::table('wishlists', function (Blueprint $table) {
//             $table->dropForeign(['product_id']);
//             $table->foreign('product_id')
//                   ->references('id')->on('products')
//                   ->cascadeOnDelete();
//         });
//     }
// };
