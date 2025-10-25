<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    // ---- Table/PK ----
    protected $table = 'nqtv_order';     // ❗ bạn đang dùng bảng này
    protected $primaryKey = 'id';
    public $timestamps = true;

    // ---- Gán hàng loạt ----
    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'address',
        'note',

        // trạng thái
        'status',          // 0 pending, 1 confirmed, 2 canceled...
        'status_step',     // 'pending' | 'confirmed' | 'ready' | 'shipping' | 'delivered' | 'canceled'
        'step_code',       // 0..4 tương ứng status_step

        // thanh toán
        'payment_method',  // 'cod' | 'momo' | ...
        'payment_status',  // 'pending' | 'paid' | 'failed' | 'canceled'
        'momo_trans_id',
        'momo_request_id',

        // tổng tiền
        'subtotal',        // tổng hàng
        'shipping',        // phí ship
        'discount_amount', // số tiền giảm
        'total',           // tổng cuối

        // mã giảm giá
        'coupon_code',

        // audit
        'created_by',
        'updated_by',
    ];

    // ---- Kiểu dữ liệu/cast (rất quan trọng để FE nhận đúng số) ----
    protected $casts = [
        'subtotal'        => 'float',
        'shipping'        => 'float',
        'discount_amount' => 'float',
        'total'           => 'float',
        'step_code'       => 'integer',
        'status'          => 'integer',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
    ];

    // ---- Quan hệ ----
    public function details()
    {
        return $this->hasMany(OrderDetail::class, 'order_id');
    }

    // alias cho FE
    public function items()
    {
        return $this->hasMany(OrderDetail::class, 'order_id');
    }

    // ---- Accessors tiện dụng ----

    // Nếu có cột 'code' thì ưu tiên; không có thì trả id
    public function getCodeAttribute(): string
    {
        return $this->attributes['code'] ?? (string) $this->id;
    }

    // Tính tổng cuối nếu chưa set total (để phòng dữ liệu cũ)
    public function getFinalTotalAttribute(): float
    {
        // nếu đã lưu total thì trả total
        if (!is_null($this->attributes['total'] ?? null)) {
            return (float) $this->attributes['total'];
        }
        // fallback công thức subtotal + shipping - discount
        $sub  = (float) ($this->attributes['subtotal'] ?? 0);
        $ship = (float) ($this->attributes['shipping'] ?? 0);
        $disc = (float) ($this->attributes['discount_amount'] ?? 0);
        return max(0, $sub + $ship - $disc);
    }

    // ---- Scopes tham khảo (tuỳ dùng) ----
    public function scopeMine($q, $userId)
    {
        return $q->where('user_id', $userId);
    }

    public function scopeSearch($q, $keyword)
    {
        if (!$keyword) return $q;
        return $q->where(function ($qq) use ($keyword) {
            $qq->where('name', 'like', "%{$keyword}%")
                ->orWhere('phone', 'like', "%{$keyword}%")
                ->orWhere('email', 'like', "%{$keyword}%")
                ->orWhere('id', $keyword);
        });
    }
}
