<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;   // ✅ thêm dòng này
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;  // ✅ thêm HasApiTokens

    protected $table = 'nqtv_user';  // ✅ bảng của bạn

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'username',
        'address',
        'avatar',
        'roles',
        'status',
        'created_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Nếu bạn set password cast trong model (Laravel 10+)
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',   // ✅ để tự hash khi create/update
        ];
    }
}