<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        $cats = Category::all()->map(function ($cat) {
            $cat->image_url = $cat->image
                ? url('assets/images/' . $cat->image)
                : null;
            return $cat;
        });

        return response()->json($cats);
    }

    public function show($id)
    {
        $cat = Category::find($id);
        if (!$cat) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $cat->image_url = $cat->image
            ? url('assets/images/' . $cat->image)
            : null;

        return response()->json($cat);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|min:2|max:100|unique:categories,name',
            'slug'        => 'nullable|string|max:150|unique:categories,slug',
            'status'      => 'nullable|in:active,inactive',
            'description' => 'nullable|string|max:500',
        ]);

        $data['slug']   = $data['slug'] ?? Str::slug($data['name']);
        $data['status'] = $data['status'] ?? 'active';

        $category = Category::create($data);

        return response()->json([
            'message'  => 'Tạo danh mục thành công',
            'data'     => $category
        ], 201);
    }
}





// namespace App\Http\Controllers\Api;

// use App\Http\Controllers\Controller;
// use App\Models\Category;
// use Illuminate\Http\Request;
// use Illuminate\Support\Str;
// use Illuminate\Validation\Rule;
// use Illuminate\Support\Facades\Auth;

// class CategoryController extends Controller
// {
//     /**
//      * GET /api/categories
//      * - Mặc định trả danh sách nhẹ cho dropdown (id, name, parent_id)
//      * - Nếu ?full=1 thì trả đầy đủ + image_url (giữ nguyên behavior bạn đã dùng)
//      */
//     public function index(Request $request)
//     {
//         if ($request->boolean('full')) {
//             $cats = Category::orderBy('name')->get()->map(function ($cat) {
//                 $cat->image_url = $this->makeImageUrl($cat->image);
//                 return $cat;
//             });
//             return response()->json($cats);
//         }

//         // Danh sách nhẹ cho select cha
//         $items = Category::orderBy('name')->get(['id', 'name', 'parent_id']);
//         return response()->json(['data' => $items]);
//     }

//     /**
//      * GET /api/categories/{id}
//      * Chi tiết danh mục + image_url (giữ nguyên behavior bạn đã có)
//      */
//     public function show($id)
//     {
//         $cat = Category::find($id);
//         if (!$cat) {
//             return response()->json(['message' => 'Category not found'], 404);
//         }

//         $cat->image_url = $this->makeImageUrl($cat->image);
//         return response()->json($cat);
//     }

//     /**
//      * POST /api/categories
//      * Tạo mới danh mục + upload ảnh vào storage/public/categories
//      */
//     public function store(Request $request)
//     {
//         $data = $request->validate([
//             'name'        => ['required', 'string', 'max:1000'],
//             'slug'        => ['nullable', 'string', 'max:1000'],
//             'parent_id'   => ['nullable', 'integer', 'exists:nqtv_category,id'],
//             'sort_order'  => ['nullable', 'integer'],
//             'description' => ['nullable', 'string'],
//             'status'      => ['required', Rule::in([0, 1])],
//             'image'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
//         ]);

//         $data['slug'] = Str::slug($data['slug'] ?? $data['name']);
//         $data['created_by'] = Auth::id() ?? 0;

//         if ($request->hasFile('image')) {
//             // Lưu: storage/app/public/categories/xxxx.jpg
//             $path = $request->file('image')->store('categories', 'public');
//             $data['image'] = $path; // lưu đường dẫn tương đối
//         }

//         $category = Category::create($data);

//         // Đính kèm image_url để FE dùng ngay nếu muốn
//         $category->image_url = $this->makeImageUrl($category->image);

//         return response()->json([
//             'message' => 'Tạo danh mục thành công',
//             'data'    => $category,
//         ], 201);
//     }

//     /**
//      * Chuẩn hoá URL ảnh cho cả hai cách lưu:
//      * - URL tuyệt đối (http/https) -> giữ nguyên
//      * - storage/public/categories/... -> asset('storage/...')
//      * - hoặc ảnh cũ để trong public/assets/images -> url('assets/images/...')
//      */
//     private function makeImageUrl(?string $image): ?string
//     {
//         if (!$image) {
//             return null;
//         }

//         // Nếu đã là URL tuyệt đối hoặc bắt đầu bằng "/" thì trả nguyên
//         if (Str::startsWith($image, ['http://', 'https://', '/'])) {
//             return $image;
//         }

//         // Nếu là đường dẫn lưu trên disk public (ví dụ "categories/abc.jpg")
//         // thì ưu tiên trả về qua /storage
//         if (!Str::startsWith($image, 'assets/images/')) {
//             return asset('storage/' . ltrim($image, '/'));
//         }

//         // Trường hợp bạn vẫn lưu vào public/assets/images
//         return url($image);
//     }
// }
