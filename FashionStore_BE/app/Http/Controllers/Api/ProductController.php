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

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Product;

class ProductController extends Controller
{
    // ====================== PUBLIC LIST ======================
    public function index()
    {
        $products = Product::with('brand:id,name')
            ->select(['id', 'name', 'brand_id', 'price_sale as price', 'thumbnail'])
            ->latest('id')
            ->paginate(12);

        // Ẩn brand_id nếu không muốn lộ schema nội bộ
        return $products->makeHidden(['brand', 'brand_id']);
    }

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

        if (!$p) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return $p->makeHidden(['brand', 'brand_id']);
    }

    public function byCategory($id)
    {
        $items = Product::with('brand:id,name')
            ->where('category_id', $id)
            ->select(['id', 'name', 'brand_id', 'price_sale as price', 'thumbnail'])
            ->latest('id')
            ->paginate(12);

        return $items->makeHidden(['brand', 'brand_id']);
    }

    // ====================== ADMIN LIST ======================
    public function adminIndex(Request $request)
    {
        $query = Product::with('brand:id,name')
            ->select(['id', 'name', 'slug', 'brand_id', 'price_root', 'price_sale', 'qty', 'thumbnail', 'status'])
            ->latest('id');

        $perPage = (int) $request->query('per_page', 10);

        if ($request->boolean('all') || $perPage === -1) {
            return $query->get()->makeHidden(['brand', 'brand_id']);
        }

        if ($perPage <= 0) {
            $perPage = 10;
        }

        return $query->paginate($perPage)->makeHidden(['brand', 'brand_id']);
    }

    // ====================== CREATE ======================
    public function store(Request $req)
    {
        // Hỗ trợ gửi JSON hoặc FormData (multipart)
        $data = $req->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255|unique:nqtv_product,slug',
            'price_root'  => 'nullable|numeric|min:0',
            'price_sale'  => 'nullable|numeric|min:0',
            'qty'         => 'nullable|integer|min:0',
            'category_id' => 'nullable|integer|exists:nqtv_category,id',
            'brand_id'    => 'required|integer|exists:nqtv_brand,id',
            'status'      => 'nullable|in:0,1',
            'description' => 'nullable|string',
            'detail'      => 'nullable|string',
            'thumbnail'   => 'nullable|image|max:4096',  // nếu gửi FormData
        ]);

        // Tự sinh slug nếu không truyền
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        // Upload ảnh nếu có (FormData)
        $thumbPath = null;
        if ($req->hasFile('thumbnail')) {
            $thumbPath = $req->file('thumbnail')->store('products', 'public'); // storage/app/public/products
        }

        // Giá trị mặc định an toàn
        $payload = [
            'name'        => $data['name'],
            'slug'        => $data['slug'],
            'price_root'  => $data['price_root']  ?? 0,
            'price_sale'  => $data['price_sale']  ?? 0,
            'qty'         => $data['qty']         ?? 0,
            'category_id' => $data['category_id'] ?? null,
            'brand_id'    => $data['brand_id'],
            'status'      => $data['status']      ?? 1,
            'thumbnail'   => $thumbPath,
            'description' => $data['description'] ?? null,
            'detail'      => $data['detail']      ?? null,
        ];

        // Nếu DB có cột created_by/updated_by KHÔNG default -> gán vào (không lỗi nếu DB không có cột)
        $userId = Auth::id() ?? 1; // tuỳ hệ thống auth của bạn
        if (schema_has_column('nqtv_product', 'created_by')) $payload['created_by'] = $userId;
        if (schema_has_column('nqtv_product', 'updated_by')) $payload['updated_by'] = $userId;

        $product = Product::create($payload);

        return response()->json([
            'message' => 'Tạo sản phẩm thành công',
            'data'    => $product,
        ], 201);
    }

    // ====================== UPDATE ======================
    public function update(Request $request, $id)
    {
        $p = Product::find($id);
        if (!$p) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'slug'        => 'nullable|string|max:255',
            'price_root'  => 'nullable|numeric|min:0',
            'price_sale'  => 'nullable|numeric|min:0',
            'qty'         => 'nullable|integer|min:0',
            'category_id' => 'nullable|exists:nqtv_category,id',
            'brand_id'    => 'required|exists:nqtv_brand,id',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:0,1',
            'thumbnail'   => 'nullable|image|max:4096',
        ]);

        // Cập nhật các trường
        $p->fill([
            'name'        => $validated['name'],
            'slug'        => $validated['slug'] ?? Str::slug($validated['name']),
            'price_root'  => $validated['price_root'] ?? 0,
            'price_sale'  => $validated['price_sale'] ?? 0,
            'qty'         => $validated['qty'] ?? 0,
            'category_id' => $validated['category_id'] ?? null,
            'brand_id'    => $validated['brand_id'],
            'description' => $validated['description'] ?? null,
            'status'      => $validated['status'] ?? 1,
            'updated_by'  => \Illuminate\Support\Facades\Auth::id(),
            // 'updated_by'  => auth()->id(),

        ]);

        // Nếu upload ảnh mới
        if ($request->hasFile('thumbnail')) {
            if ($p->thumbnail && Storage::disk('public')->exists($p->thumbnail)) {
                Storage::disk('public')->delete($p->thumbnail);
            }
            $path = $request->file('thumbnail')->store('products', 'public');
            $p->thumbnail = $path;
        }

        $p->save();

        return response()->json([
            'message' => 'updated',
            'data'    => $p->load('brand')->append(['thumbnail_url', 'brand_name']),
        ]);
    }

    // ====================== DELETE ======================
    public function destroy($id)
    {
        $p = Product::find($id);
        if (!$p) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Nếu bạn muốn xoá file ảnh khỏi storage
        if ($p->thumbnail && Storage::disk('public')->exists($p->thumbnail)) {
            Storage::disk('public')->delete($p->thumbnail);
        }

        $p->delete(); 
        return response()->json(['message' => 'Deleted']);
    }
}


if (!function_exists('schema_has_column')) {
    function schema_has_column(string $table, string $column): bool
    {
        try {
            return \Illuminate\Support\Facades\Schema::hasColumn($table, $column);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
