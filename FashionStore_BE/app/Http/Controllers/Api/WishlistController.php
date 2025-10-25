<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    // GET /api/wishlist
    public function index(Request $request)
    {
        $user = $request->user();

        $items = Wishlist::with(['product.category', 'product.brand'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(function ($w) {
                $p = $w->product;
                $price = (float) ($p?->price_sale ?? $p?->price_root ?? 0);
                return [
                    'wishlist_id' => $w->id,
                    'id'          => $p->id,
                    'name'        => $p->name,
                    'price'       => $price,
                    'image'       => $p->image ?? $p->thumbnail_url ?? null,
                    'category_name' => optional($p->category)->name,
                    'brand_name'    => optional($p->brand)->name,
                    'is_liked'    => true, // trên trang wishlist luôn là true
                ];
            });

        return response()->json($items);
    }

    // POST /api/wishlist/toggle {product_id}
    public function toggle(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:nqtv_product,id']);
        $user = $request->user();
        $pid  = (int) $request->product_id;

        $existing = Wishlist::where('user_id', $user->id)
            ->where('product_id', $pid)
            ->first();

        // If exists -> remove from wishlist
        if ($existing) {
            $existing->delete();
            return response()->json([
                'message'    => 'Removed',
                'liked'      => false,
                'product_id' => $pid,
            ]);
        }

        // Else -> add to wishlist and return normalized item for FE
        Wishlist::create(['user_id' => $user->id, 'product_id' => $pid]);

        $p = Product::with(['category:id,name', 'brand:id,name'])->find($pid);
        $price = (float) ($p?->price_sale ?? $p?->price_root ?? 0);

        $item = [
            'wishlist_id'   => null, // ID của bản ghi có thể không cần thiết ngay thời điểm trả về
            'id'            => $p->id,
            'name'          => $p->name,
            'price'         => $price,
            'image'         => $p->image ?? $p->thumbnail_url ?? null,
            'category_name' => optional($p->category)->name,
            'brand_name'    => optional($p->brand)->name,
            'is_liked'      => true,
        ];

        return response()->json([
            'message' => 'Added',
            'liked'   => true,
            'item'    => $item,
        ]);
    }

    // DELETE /api/wishlist/{product}
    public function destroy(Request $request, Product $product)
    {
        $user = $request->user();
        Wishlist::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->delete();

        return response()->json([
            'message'    => 'Removed',
            'product_id' => $product->id,
        ]);
    }

    // (tuỳ chọn) GET /api/wishlist/count
    public function count(Request $request)
    {
        $c = Wishlist::where('user_id', $request->user()->id)->count();
        return response()->json(['count' => $c]);
    }
}
