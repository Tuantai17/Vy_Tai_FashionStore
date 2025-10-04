<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    /**
     * ✅ Danh sách review của 1 sản phẩm
     */
    public function index($productId)
    {
        $reviews = Review::with('user:id,name')
            ->where('product_id', $productId)
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    /**
     * ✅ Kiểm tra user có quyền review sản phẩm hay không
     * Điều kiện: user đã mua và đơn đã hoàn tất (step_code = 4 hoặc status_step = delivered/completed)
     */
   public function canReview($productId)
    {
        $userId = Auth::id();
        if (!$userId) {
            // không đăng nhập => không cho review
            return response()->json(['canReview' => false], 200);
        }

        // đã mua & đơn hoàn tất?
        $hasPurchased = OrderDetail::where('product_id', $productId)
            ->whereHas('order', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                ->where(function ($q2) {
                    $q2->where('step_code', 4)
                        ->orWhereIn('status_step', ['delivered', 'completed'])
                        ->orWhereIn('status', ['delivered', 'completed']);
                });
            })
            ->exists();

        // ĐÃ có review chưa?
        $alreadyReviewed = Review::where('user_id', $userId)
            ->where('product_id', (int) $productId)
            ->exists();

        return response()->json([
            'canReview' => $hasPurchased && !$alreadyReviewed
        ]);
    }


    /**
     * ✅ Tạo hoặc cập nhật review (mỗi user 1 review / 1 sản phẩm)
     */
    public function store(Request $request, $productId)
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['error' => 'Chưa đăng nhập'], 401);
        }

        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // Check đã mua và đơn giao thành công chưa
        $hasPurchased = OrderDetail::where('product_id', $productId)
            ->whereHas('order', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->where(function ($q2) {
                      $q2->where('step_code', 4)
                         ->orWhereIn('status_step', ['delivered', 'completed'])
                         ->orWhereIn('status', ['delivered', 'completed']);
                  });
            })
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'error' => 'Bạn chưa mua sản phẩm này hoặc đơn chưa hoàn tất'
            ], 403);
        }

        // ✅ Upsert: mỗi user chỉ có 1 review cho 1 sản phẩm
        $review = Review::updateOrCreate(
['user_id' => $userId, 'product_id' => (int)$productId],
            [
                'rating'      => $data['rating'],
                'comment'     => $data['comment'] ?? null,
                'is_verified' => true,
            ]
        );

        $review->load('user:id,name');

        return response()->json($review, 201);
    }

    /**
     * ✅ Cập nhật review (chỉ chủ sở hữu)
     */
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== Auth::id()) {
            return response()->json(['error' => 'Không có quyền chỉnh sửa'], 403);
        }

        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($data);
        $review->load('user:id,name');

        return response()->json($review);
    }

    /**
     * ✅ Xoá review (chỉ chủ sở hữu)
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        if ($review->user_id !== Auth::id()) {
            return response()->json(['error' => 'Không có quyền xóa'], 403);
        }

        $review->delete();

        return response()->json(['message' => 'Đã xóa review']);
    }
}