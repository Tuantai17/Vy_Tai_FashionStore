<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMove extends Model
{
    protected $table = 'nqtv_stock_move';
    protected $fillable = [
        'product_id','change','qty_before','qty_after',
        'type','order_id','note','user_id'
    ];

    public function product()  { return $this->belongsTo(Product::class,'product_id'); }
    public function order()    { return $this->belongsTo(Order::class,'order_id'); }
    public function user()     { return $this->belongsTo(User::class,'user_id'); }
}
