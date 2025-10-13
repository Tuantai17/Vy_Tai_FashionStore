<?php

// namespace App\Http\Controllers\Api;

// use App\Http\Controllers\Controller;
// use Illuminate\Http\Request;
// use App\Models\Wishlist;
// use Illuminate\Support\Facades\Log;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Validation\Rule;

// class WishlistController extends Controller
// {
//     public function index(Request $r)
//     {
//         $user = $r->user(); // tương đương Auth::user() nhưng theo guard hiện tại
//         return Wishlist::with('product')
//             ->where('user_id', $user->id)
//             ->get();
//     }

//     public function toggle(Request $r)
//     {
//        Log::info('WL debug', [
//             'pid'    => $r->product_id,
//             'db'     => DB::connection()->getDatabaseName(),
//             'exists' => DB::table('nqtv_product')->where('id', $r->product_id)->exists(),
//             'last3'  => DB::table('nqtv_product')->select('id','name')->orderByDesc('id')->limit(3)->get(),
//         ]);

//         // 1) validate vào thẳng DB
//         $r->validate([
//             'product_id' => [
//                 'required',
//                 'integer',
//                 'min:1',
//                 // bỏ comment nếu có soft delete và muốn bỏ qua sp đã xoá mềm
//                 // Rule::exists('nqtv_product','id')->whereNull('deleted_at'),
//                 Rule::exists('nqtv_product', 'id'),
//             ],
//         ]);

//         // 2) bắt buộc phải có user (nếu null trả 401, khỏi dính lỗi 500)
//         $user = $r->user();
//         if (!$user) {
//             return response()->json(['message' => 'Unauthenticated'], 401);
//         }

//         try {
//             $row = Wishlist::where('user_id', $user->id)
//                 ->where('product_id', $r->product_id)
//                 ->first();

//             if ($row) {
//                 $row->delete();
//                 return response()->json(['liked' => false]);
//             }

//             Wishlist::create([
//                 'user_id'    => $user->id,
//                 'product_id' => $r->product_id,
//             ]);

//             return response()->json(['liked' => true]);
//         } catch (\Throwable $e) {
//             Log::error('wishlist.toggle: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
//             return response()->json(['message' => 'Server Error'], 500);
//         }
//     }
// }
