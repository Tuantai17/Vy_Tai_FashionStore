<?php

// namespace App\Http\Controllers\Api;

// use App\Http\Controllers\Controller;
// use App\Models\Product;

// class ProductController extends Controller
// {
//     // Lấy tất cả sản phẩm
//     public function index()
//     {
//         return Product::select([
//             'id',
//             'name',
//             'brand_id as brand',    // tạm trả brand_id, sau join bảng brand sẽ lấy tên
//             'price_sale as price',
//             'thumbnail',
//         ])->latest('id')->get();
//     }

//     // Lấy chi tiết sản phẩm theo id
//     public function show($id)
//     {
//         $product = Product::select([
//             'id',
//             'name',
//             'brand_id as brand',
//             'price_sale as price',
//             'thumbnail',
//             'detail',
//             'description',
//         ])->find($id);

//         if (!$product) {
//             return response()->json(['message' => 'Not found'], 404);
//         }

//         return $product;
//     }

//     //danh mục sản phẩm
// public function byCategory($id)
// {
//     return Product::where('category_id', $id)->get();
// }


// }



namespace App\Http\Controllers\Api;
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;

class ProductController extends Controller
{
    // Danh sách sản phẩm (có phân trang)
    public function index()
    {
        $products = Product::with('brand:id,name')
            ->select(['id','name','brand_id','price_sale as price','thumbnail'])
            ->latest('id')
            ->paginate(12); // ✅ mỗi trang 12 sp (có thể chỉnh)

        return $products->makeHidden(['brand','brand_id']);
    }

    // Chi tiết sản phẩm
    public function show($id)
    {
        $p = Product::with('brand:id,name')
            ->select([
                'id',
                'name',
                'brand_id',
                'price_sale as price',
                'thumbnail',
                'detail',
                'description',
                'category_id',
            ])
            ->find($id);

        if (!$p) return response()->json(['message' => 'Not found'], 404);

        return $p->makeHidden(['brand','brand_id']);
    }

    // Sản phẩm theo danh mục (có phân trang)
    public function byCategory($id)
    {
        $items = Product::with('brand:id,name')
            ->where('category_id', $id)
            ->select(['id','name','brand_id','price_sale as price','thumbnail'])
            ->latest('id')
            ->paginate(12); // ✅ phân trang 12 sp

        return $items->makeHidden(['brand','brand_id']);
    }

    // Admin - danh sách sản phẩm (có phân trang)
    public function adminIndex()
    {
        $products = Product::with('brand:id,name')
            ->select([
                'id',
                'name',
                'slug',
                'brand_id',
                'price_root',
                'price_sale',
                'qty',
                'thumbnail'
            ])
            ->latest('id')
            ->paginate(5); // ✅ mỗi trang 20 sp cho admin

        return $products->makeHidden(['brand','brand_id']);
    }
}

