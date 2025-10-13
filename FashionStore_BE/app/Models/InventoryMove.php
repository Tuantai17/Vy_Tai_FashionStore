<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMove extends Model
{
    use HasFactory;

    

    protected $table = 'inventory_moves';

    // Cho phép create() các cột này
    protected $fillable = [
        'product_id',
        'qty_before',
        'qty_after',
        'change',
        'type',
        'note',
        'user_id',
    ];

    protected $casts = [
        'qty_before' => 'integer',
        'qty_after'  => 'integer',
        'change'     => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
