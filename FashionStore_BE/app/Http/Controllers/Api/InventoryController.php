<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\InventoryMove;
use Illuminate\Support\Facades\Auth;
use App\Models\StockMove;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use App\Models\User;

class InventoryController extends Controller
{
    // GET /api/admin/inventory  (danh sách sản phẩm + tồn)
    public function index(Request $r)
    {
        $q = $r->query('q');  // ← FE sẽ gửi ?q=

        $rows = Product::query()
            ->when($q, function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                        ->orWhere('slug', 'like', "%{$q}%")
                        ->orWhere('id', $q);
                });
            })
            // phải select 'thumbnail' để accessor hoạt động
            ->select('id', 'name', 'slug', 'qty', 'price_sale', 'thumbnail')
            ->orderByDesc('id')
            ->paginate(10);

        // ✅ dùng accessor của Product thay vì tự ghép url
        $rows->getCollection()->transform(function ($p) {
            return [
                'id'             => $p->id,
                'name'           => $p->name,
                'slug'           => $p->slug,
                'qty'            => (int) $p->qty,
                'price_sale'     => (float) ($p->price_sale ?? 0),
                'thumbnail'      => $p->thumbnail,       // raw (để tương thích)
                'thumbnail_url'  => $p->thumbnail_url,   // 👈 accessor từ Product
            ];
        });

        return response()->json($rows);
    }

    // GET /api/admin/inventory/moves?product_id=6
    // GET /api/admin/inventory/{product}/moves
    public function moves(Request $r, $product)
    {
        $pid = (int) $product;

        $moves = InventoryMove::with('user:id,name')
            ->where('product_id', $pid)
            ->orderByDesc('id')
            ->paginate(min(200, max(20, (int)$r->get('per_page', 50))));

        return response()->json($moves);
    }

    public function adjust(Request $r)
    {
        $data = $r->validate([
            'product_id' => 'required|integer|exists:nqtv_product,id', // hoặc products,id nếu dùng bảng products
            'change'     => 'required|integer|not_in:0',
            'note'       => 'nullable|string',
        ]);

        $userId = optional($r->user())->id;
        if ($userId && !User::whereKey($userId)->exists()) {
            $userId = null; // tránh vỡ FK nếu token lệch user
        }

        try {
            $move = DB::transaction(function () use ($data, $userId) {
                $p = Product::lockForUpdate()->findOrFail($data['product_id']);

                $before = (int) $p->qty;
                $after  = $before + (int) $data['change'];

                if ($after < 0) {
                    throw ValidationException::withMessages([
                        'change' => "Không đủ tồn kho. Hiện còn {$before} cái."
                    ]);
                }

                $p->qty = $after;
                $p->save();

                return InventoryMove::create([
                    'product_id' => $p->id,
                    'change'     => (int) $data['change'],
                    'qty_before' => $before,
                    'qty_after'  => $after,
                    'type'       => 'manual',
                    'note'       => $data['note'] ?? null,
                    'user_id' => ($userId ?: null),

                ]);
            });

            return response()->json([
                'message' => 'Đã cập nhật tồn kho',
                'move'    => $move
            ]);
        } catch (ValidationException $e) {
            throw $e; // để Laravel trả 422 hợp lệ
        } catch (QueryException $e) {
            return response()->json([
                'message'     => 'Không cập nhật được tồn kho (SQL lỗi thực tế):',
                'sql_state'   => $e->errorInfo[0] ?? null,
                'driver_code' => $e->errorInfo[1] ?? null,
                'driver_msg'  => $e->errorInfo[2] ?? $e->getMessage(),
            ], 500); // tạm trả 500 để bạn dễ thấy

        } catch (\Throwable $e) {
            // Fallback
            return response()->json([
                'message' => 'Lỗi máy chủ khi cập nhật tồn kho.',
            ], 500);
        }
    }
}
