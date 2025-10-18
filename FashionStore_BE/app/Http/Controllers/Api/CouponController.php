<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$this->currentUserIsAdmin()) {
                return response()->json(['message' => 'This action is unauthorized.'], 403);
            }
            return $next($request);
        })->except(['apply', 'publicIndex']);
    }

    public function index()
    {
        return response()->json(
            Coupon::orderByDesc('id')->paginate(20)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code'            => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'type'            => ['required', Rule::in(['fixed', 'percent'])],
            'value'           => ['required', 'numeric', 'min:0.01'],
            'min_order_total' => ['nullable', 'numeric', 'min:0'],
            'max_uses'        => ['nullable', 'integer', 'min:1'],
            'expires_at'      => ['nullable', 'date'],
            'is_active'       => ['boolean'],
        ]);

        $coupon = Coupon::create($this->sanitizePayload($data));

        return response()->json($coupon, 201);
    }

    public function show(Coupon $coupon)
    {
        return $coupon;
    }

    public function update(Request $request, Coupon $coupon)
    {
        $data = $request->validate([
            'code'            => ['sometimes', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($coupon->id)],
            'type'            => ['sometimes', Rule::in(['fixed', 'percent'])],
            'value'           => ['sometimes', 'numeric', 'min:0.01'],
            'min_order_total' => ['nullable', 'numeric', 'min:0'],
            'max_uses'        => ['nullable', 'integer', 'min:1'],
            'expires_at'      => ['nullable', 'date'],
            'is_active'       => ['boolean'],
        ]);

        $coupon->update($this->sanitizePayload($data, $coupon));

        return $coupon;
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return response()->noContent();
    }

    public function publicIndex(Request $request)
    {
        $now = Carbon::now();

        $coupons = Coupon::query()
            ->where('is_active', true)
            ->when($request->boolean('include_expired', false) === false, function ($q) use ($now) {
                $q->where(function ($qq) use ($now) {
                    $qq->whereNull('expires_at')
                        ->orWhere('expires_at', '>', $now);
                });
            })
            ->orderByDesc('value')
            ->orderBy('min_order_total')
            ->limit((int)$request->get('limit', 12))
            ->get()
            ->map(function (Coupon $coupon) {
                return [
                    'id'              => $coupon->id,
                    'code'            => $coupon->code,
                    'type'            => $coupon->type,
                    'value'           => (float)$coupon->value,
                    'min_order_total' => (float)$coupon->min_order_total,
                    'max_uses'        => $coupon->max_uses,
                    'used_count'      => $coupon->used_count,
                    'expires_at'      => $coupon->expires_at,
                    'is_active'       => (bool)$coupon->is_active,
                    'remaining_uses'  => $coupon->remainingUses(),
                ];
            });

        return response()->json($coupons);
    }

    public function apply(Request $request)
    {
        $request->validate([
            'code'     => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $coupon = Coupon::whereRaw('LOWER(code) = ?', [mb_strtolower($request->code)])
            ->first();

        if (!$coupon) {
            return response()->json(['ok' => false, 'message' => 'Mã giảm giá không tồn tại.'], 404);
        }
        if (!$coupon->canUse()) {
            return response()->json(['ok' => false, 'message' => 'Mã đã hết hạn hoặc vượt quá số lượt dùng.'], 422);
        }
        if ((float)$request->subtotal < (float)$coupon->min_order_total) {
            return response()->json(['ok' => false, 'message' => 'Đơn hàng chưa đạt giá trị tối thiểu.'], 422);
        }

        $discount = $coupon->calcDiscount((float)$request->subtotal);

        return response()->json([
            'ok'             => true,
            'coupon'         => $coupon->only([
                'id',
                'code',
                'type',
                'value',
                'min_order_total',
                'max_uses',
                'used_count',
                'expires_at',
                'is_active',
            ]),
            'discount'       => $discount,
            'label'          => $coupon->type === 'percent'
                ? "{$coupon->value}%"
                : number_format($coupon->value, 0, '.', '.') . 'đ',
            'new_total'      => max(0, (float)$request->subtotal - $discount),
            'remaining_uses' => $coupon->remainingUses(),
        ]);
    }

    private function sanitizePayload(array $data, ?Coupon $coupon = null): array
    {
        if (array_key_exists('code', $data)) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        if (array_key_exists('value', $data)) {
            $data['value'] = round(max((float)$data['value'], 0.01), 2);
        }

        if (array_key_exists('min_order_total', $data)) {
            $min = $data['min_order_total'];
            $data['min_order_total'] = $min === null || $min === '' ? 0 : max((float)$min, 0);
        }

        if (array_key_exists('max_uses', $data)) {
            $maxUses = $data['max_uses'];
            $data['max_uses'] = $maxUses === null || $maxUses === '' ? null : max((int)$maxUses, 1);
        }

        if (array_key_exists('expires_at', $data)) {
            $expires = $data['expires_at'];
            $data['expires_at'] = $expires ? Carbon::parse($expires) : null;
        }

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = (bool)$data['is_active'];
        }

        unset($data['used_count']); // never mass assign from request

        return $data;
    }

    private function currentUserIsAdmin(): bool
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        $role = strtolower((string)($user->roles ?? ''));

        return in_array($role, ['admin', 'administrator'], true);
    }
}
