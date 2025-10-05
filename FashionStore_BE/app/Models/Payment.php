<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'order_id',
        'request_id',
        'amount',
        'partner_code',
        'trans_id',
        'result_code',
        'message',
        'method',     // momo_wallet | payWithATM
        'raw',
    ];

    protected $casts = [
        'raw' => 'array',
    ];
}
