<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // ====== Public list (giữ nguyên nếu đang dùng cho FE khách) ======
    public function index()
    {
        $cats = Category::select(['id', 'name', 'slug', 'image', 'parent_id', 'sort_order', 'description', 'status'])
            ->latest('id')
            ->get();

        // map image_url giống trước
        $cats->transform(function ($cat) {
            $cat->image_url = $cat->image ? url('assets/images/' . ltrim($cat->image, '/')) : null;
            return $cat;
        });

        return response()->json($cats);
    }

    // ====== ADMIN LIST (phân trang giống Product) ======
    public function adminIndex(Request $request)
    {
        $query = Category::select(['id', 'name', 'slug', 'image', 'parent_id', 'sort_order', 'description', 'status'])
            ->latest('id');

        $perPage = (int) $request->query('per_page', 10);

        if ($request->boolean('all') || $perPage === -1) {
            $items = $query->get();
            $items->transform(function ($c) {
                $c->image_url = $c->image ? url('assets/images/' . ltrim($c->image, '/')) : null;
                return $c;
            });
            return response()->json($items);
        }

        if ($perPage <= 0) $perPage = 10;

        $paginator = $query->paginate($perPage);
        $paginator->getCollection()->transform(function ($c) {
            $c->image_url = $c->image ? url('assets/images/' . ltrim($c->image, '/')) : null;
            return $c;
        });

        return response()->json($paginator);
    }

    // ====== CREATE / UPDATE (giữ nguyên của bạn) ======
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:1000',
            'slug'        => 'required|string|max:1000|unique:nqtv_category,slug',
            'parent_id'   => 'nullable|integer',
            'sort_order'  => 'nullable|integer',
            'description' => 'nullable|string',
            'status'      => 'nullable|integer',
            'image'       => 'nullable|image|max:4096', // 👈 file ảnh
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
            // ví dụ: categories/abc.png

        }

        $data['created_by'] = 1;
        $data['status'] = $data['status'] ?? 1;

        $cat = Category::create($data);
        return response()->json(['message' => 'Thêm danh mục thành công', 'category' => $cat], 201);
    }

    public function update(Request $request, $id)
    {
        $cat = Category::find($id);
        if (!$cat) return response()->json(['message' => 'Category not found'], 404);

        $data = $request->validate([
            'name'        => 'required|string|max:1000',
            'slug'        => 'required|string|max:1000|unique:nqtv_category,slug,' . $id,
            'parent_id'   => 'nullable|integer',
            'sort_order'  => 'nullable|integer',
            'description' => 'nullable|string',
            'status'      => 'nullable|integer',
            'image'       => 'nullable|image|max:4096', // 👈 file ảnh
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $data['updated_by'] = 1;
        $cat->update($data);

        return response()->json(['message' => 'Cập nhật danh mục thành công', 'category' => $cat]);
    }



    // app/Http/Controllers/Api/CategoryController.php
    public function show($id)
    {
        // chỉ lấy các field cần, model Category đã có accessor image_url
        $cat = Category::select('id', 'name', 'slug', 'image', 'parent_id', 'sort_order', 'description', 'status')
            ->find($id);

        if (!$cat) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $cat->product_count = \App\Models\Product::where('category_id', $cat->id)->count();

        // nếu muốn chắc chắn có image_url khi select thủ công:
        $cat->setAppends(['image_url']);



        return response()->json($cat);
    }



    // public function update(Request $request, $id)
    // {
    //     $cat = Category::find($id);
    //     if (!$cat) return response()->json(['message' => 'Category not found'], 404);

    //     $data = $request->validate([
    //         'name'        => 'required|string|max:1000',
    //         'slug'        => 'required|string|max:1000|unique:nqtv_category,slug,' . $id,
    //         'image'       => 'nullable|image|max:1000',
    //         'parent_id'   => 'nullable|integer',
    //         'sort_order'  => 'nullable|integer',
    //         'description' => 'nullable|string',
    //         'status'      => 'nullable|integer',
    //     ]);

    //     $data['updated_by'] = 1;

    //     $cat->update($data);
    //     $cat->image_url = $cat->image ? url('assets/images/' . ltrim($cat->image, '/')) : null;

    //     return response()->json([
    //         'message'  => 'Cập nhật danh mục thành công',
    //         'category' => $cat,
    //     ]);
    // }

    // ====== SOFT DELETE (xoá tạm) ======
    public function destroy($id)
    {
        $cat = Category::find($id);
        if (!$cat) return response()->json(['message' => 'Category not found'], 404);

        $cat->delete(); // SoftDeletes
        return response()->json(['message' => 'Soft deleted']);
    }

    // ====== LIST TRASH ======
    public function trash(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        if ($perPage <= 0) $perPage = 10;

        $q = trim((string) $request->query('q', ''));

        $query = Category::onlyTrashed()
            ->select(['id', 'name', 'slug', 'image', 'parent_id', 'sort_order', 'description', 'status'])
            ->latest('deleted_at');

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        $paginator = $query->paginate($perPage)->appends($request->query());
        $paginator->getCollection()->transform(function ($c) {
            $c->image_url = $c->image ? url('assets/images/' . ltrim($c->image, '/')) : null;
            return $c;
        });

        return response()->json($paginator);
    }

    // ====== RESTORE ======
    public function restore($id)
    {
        $cat = Category::onlyTrashed()->find($id);
        if (!$cat) return response()->json(['message' => 'Not found'], 404);

        $cat->restore();
        return response()->json(['message' => 'Restored']);
    }

    // ====== FORCE DELETE ======
    public function forceDestroy($id)
    {
        $cat = Category::onlyTrashed()->find($id);
        if (!$cat) return response()->json(['message' => 'Not found'], 404);

        // Ảnh đang để ở public/assets/images => KHÔNG xoá bằng Storage::disk('public')
        // Nếu sau này chuyển sang storage('public') thì bổ sung xoá file ở đây.

        $cat->forceDelete();
        return response()->json(['message' => 'Deleted forever']);
    }
}
