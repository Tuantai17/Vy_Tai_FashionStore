<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PublicCouponController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();

        $includeExpired = $request->boolean('include_expired', false);
        $includeInactive = $request->boolean('include_inactive', false);
        $limit = max(1, min(200, (int) $request->get('limit', 12)));

        $query = Coupon::query();

        if (!$includeInactive) {
            $query->where('is_active', true);
        }

        if (!$includeExpired) {
            $query->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            });
        }

        $coupons = $query
            ->orderByDesc('value')
            ->orderBy('min_order_total')
            ->limit($limit)
            ->get()
            ->map(function (Coupon $coupon) {
                return [
                    'id'              => $coupon->id,
                    'code'            => $coupon->code,
                    'type'            => $coupon->type,
                    'value'           => (float) $coupon->value,
                    'min_order_total' => (float) $coupon->min_order_total,
                    'max_uses'        => $coupon->max_uses,
                    'used_count'      => $coupon->used_count,
                    'expires_at'      => $coupon->expires_at,
                    'is_active'       => (bool) $coupon->is_active,
                    'remaining_uses'  => $coupon->remainingUses(),
                ];
            });

        return response()->json($coupons);
    }
}
