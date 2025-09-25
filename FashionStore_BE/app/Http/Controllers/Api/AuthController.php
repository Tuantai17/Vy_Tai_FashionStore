<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    // ================= Đăng ký =================
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'                  => ['required', 'string', 'max:100'],
            'email'                 => ['required', 'email', 'max:255', Rule::unique('uttt_user', 'email')],
            'password'              => ['required', 'string', 'min:6', 'confirmed'],
            'phone'                 => ['required', 'string', 'max:20'],
            'address'               => ['nullable', 'string', 'max:1000'],
            'avatar'                => ['nullable', 'string', 'max:255'],
        ]);

        // Tạo username duy nhất
        $base = $this->makeBaseUsername($data['name'], $data['email']);
        $username = $this->uniqueUsername($base);

        // Tạo user mới
        $user = User::create([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => $data['password'], // Model User đã cast hashed
            'phone'      => $data['phone'],
            'username'   => $username,
            'address'    => $data['address'] ?? '',
            'avatar'     => $data['avatar'] ?? '',
            'roles'      => 'customer',
            'created_by' => 0,
            'status'     => 1,
        ]);

        return response()->json([
            'message' => 'Đăng ký thành công',
            'user'    => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'phone'    => $user->phone,
                'username' => $user->username,
                'roles'    => $user->roles,
                'status'   => $user->status,
            ],
        ], 201);
    }

    // ================= Đăng nhập =================
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($data)) {
            return response()->json(['message' => 'Sai email hoặc mật khẩu'], 401);
        }

        $user = Auth::user();

        // Tạo token (Laravel Sanctum)
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng nhập thành công',
            'token'   => $token,
            'user'    => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'phone'    => $user->phone,
                'username' => $user->username,
                'roles'    => $user->roles,
                'status'   => $user->status,
            ],
        ], 200);
    }

// ================= Đăng xuất =================
public function logout(Request $request)
{
    $request->user()->tokens()->delete(); // xoá tất cả token user
    return response()->json(['message' => 'Đăng xuất thành công']);
}

    // ================= Helper =================
    private function makeBaseUsername(string $name, string $email): string
    {
        $base = Str::slug($name, '');
        if ($base === '') {
            $base = Str::before($email, '@');
        }
        return strtolower($base);
    }

    private function uniqueUsername(string $base): string
    {
        $username = $base;
        $i = 0;
        while (User::where('username', $username)->exists()) {
            $i++;
            $username = $base . $i; // name, name1, name2...
        }
        return $username;
    }
}
