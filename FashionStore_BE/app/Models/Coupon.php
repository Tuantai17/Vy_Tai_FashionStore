<?php

// app/Models/Coupon.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_total',
        'max_uses',
        'used_count',
        'expires_at',
        'is_active'
    ];
    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function remainingUses(): ?int
    {
        return is_null($this->max_uses) ? null : max(0, $this->max_uses - $this->used_count);
    }

    public function canUse(): bool
    {
        if (!$this->is_active) return false;
        if ($this->isExpired()) return false;
        if (!is_null($this->max_uses) && $this->used_count >= $this->max_uses) return false;
        return true;
    }

    public function calcDiscount(float $subtotal): float
    {
        if ($subtotal < (float)$this->min_order_total) {
            return 0;
        }

        $maxDiscount = $subtotal;
        if ($this->type === 'percent') {
            $percent = max(0, (float)$this->value);
            $discount = round($subtotal * $percent / 100, 2);
            return min($maxDiscount, $discount);
        }

        return min((float)$this->value, $maxDiscount);
    }
}
