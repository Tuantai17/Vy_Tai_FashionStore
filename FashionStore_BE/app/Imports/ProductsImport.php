<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use GuzzleHttp\Client;

class ProductsImport implements ToModel, WithHeadingRow
{
    public int $inserted = 0;
    public int $updated  = 0;
    public int $skipped  = 0;
    public array $errors = [];

    private string $mode;              // upsert | create-only | update-only
    private Client $http;

    public function __construct(string $mode = 'upsert')
    {
        $this->mode = $mode;
        $this->http = new Client([
            'timeout' => 12,
            'verify'  => false,        // nếu môi trường dev có SSL self-signed
        ]);
    }

    // Nếu header không ở dòng 1 thì bật:
    // public function headingRow(): int { return 1; }

    public function model(array $row)
    {
        try {
            // 0) Bỏ dòng trống
            $name = trim((string)($row['name'] ?? ''));
            if ($name === '') { $this->skipped++; return null; }

            // Helper: chuẩn hoá số tiền "2.750.000" -> 2750000
            $num = function ($v) {
                if ($v === null || $v === '') return 0;
                $s = preg_replace('/[^\d]/', '', (string)$v);
                return (int)($s ?: 0);
            };

            // 1) Slug duy nhất
            $slugIn = trim((string)($row['slug'] ?? ''));
            $slug   = Str::slug($slugIn ?: $name) ?: Str::random(8);

            // 2) Map brand/category (giữ theo id – nếu muốn map theo tên, bật đoạn dưới)
            $brandId = is_numeric($row['brand_id'] ?? null) ? (int)$row['brand_id'] : null;
            $catId   = is_numeric($row['category_id'] ?? null) ? (int)$row['category_id'] : null;

            /*
            // Map theo tên:
            if (!is_numeric($row['brand_id'] ?? null) && !empty($row['brand_id'])) {
                $brandId = Brand::where('name', $row['brand_id'])->value('id');
            }
            if (!is_numeric($row['category_id'] ?? null) && !empty($row['category_id'])) {
                $catId = Category::where('name', $row['category_id'])->value('id');
            }
            */

            // 3) Tải ảnh (nếu có)
            $thumbnailInput = trim((string)($row['thumbnail'] ?? '')); // có thể là URL hoặc đường dẫn cục bộ
            $storedPath = null; // path tương đối dưới disk 'public' (vd: products/abc.jpg)

            if ($thumbnailInput !== '') {
                $storedPath = $this->resolveAndStoreImage($thumbnailInput, $slug);
            }

            // 4) Upsert theo mode
            $payload = [
                'name'        => $name,
                'slug'        => $slug,
                'brand_id'    => $brandId,
                'category_id' => $catId,
                'price_root'  => $num($row['price_root'] ?? 0),
                'price_sale'  => $num($row['price_sale'] ?? 0),
                'qty'         => (int)($row['qty'] ?? 0),
                'status'      => (int)($row['status'] ?? 1),
                'description' => $row['description'] ?? null,
                'detail'      => $row['detail'] ?? null,
            ];

            if ($storedPath) {
                // Lưu đường dẫn relative dưới disk 'public'
                $payload['thumbnail'] = $storedPath; // ví dụ: products/giay-ultra-1.jpg
            }

            $existing = Product::where('slug', $slug)->first();

            if ($existing) {
                if ($this->mode === 'create-only') { $this->skipped++; return null; }
                $existing->fill($payload);
                $existing->updated_by = Auth::id() ?? $existing->updated_by;
                $existing->save();
                $this->updated++;
                return null;
            } else {
                if ($this->mode === 'update-only') { $this->skipped++; return null; }
                $p = new Product($payload);
                $p->created_by = Auth::id() ?? $p->created_by;
                $p->updated_by = Auth::id() ?? $p->updated_by;
                $this->inserted++;
                return $p;
            }
        } catch (\Throwable $e) {
            $this->errors[] = $e->getMessage();
            $this->skipped++;
            return null;
        }
    }

    /**
     * Nhận input:
     *  - URL: https://.../foo.jpg  -> tải về storage/app/public/products/slug-xxx.jpg
     *  - Đường dẫn cục bộ:
     *      + 'assets/images/foo.jpg' (public/assets) -> copy vào public disk
     *      + 'storage/products/foo.jpg' (public/storage) -> convert thành path relative
     *  Trả về path relative dưới disk 'public' (vd: 'products/slug-abc.jpg')
     */
    private function resolveAndStoreImage(string $input, string $slug): ?string
    {
        // Nếu là đường dẫn public/storage/... thì chuẩn hoá về relative
        if (preg_match('#^/?storage/(.+)$#', $input, $m)) {
            // ĐÃ là file trong public/storage -> lưu DB bằng phần sau 'storage/'
            return $m[1]; // ví dụ: products/foo.jpg
        }

        // Nếu là đường dẫn public/assets/images/...
        if (preg_match('#^/?assets/images/(.+)$#', $input, $m)) {
            $abs = public_path('assets/images/' . $m[1]);
            if (is_file($abs)) {
                $ext  = pathinfo($abs, PATHINFO_EXTENSION) ?: 'jpg';
                $name = $slug . '-' . uniqid() . '.' . strtolower($ext);
                $dest = 'products/' . $name; // relative inside disk 'public'
                Storage::disk('public')->put($dest, file_get_contents($abs));
                return $dest;
            }
            return null;
        }

        // Nếu là đường dẫn file tuyệt đối trong máy (ít dùng) -> cố copy
        if (is_file($input)) {
            $ext  = pathinfo($input, PATHINFO_EXTENSION) ?: 'jpg';
            $name = $slug . '-' . uniqid() . '.' . strtolower($ext);
            $dest = 'products/' . $name;
            Storage::disk('public')->put($dest, file_get_contents($input));
            return $dest;
        }

        // Nếu là URL http/https -> tải về
        if (preg_match('#^https?://#i', $input)) {
            try {
                $res = $this->http->get($input, ['stream' => true]);
                if ($res->getStatusCode() >= 200 && $res->getStatusCode() < 300) {
                    // đoán extension
                    $ctype = strtolower($res->getHeaderLine('Content-Type')); // image/jpeg, image/png,...
                    $ext = match (true) {
                        str_contains($ctype, 'png')  => 'png',
                        str_contains($ctype, 'webp') => 'webp',
                        str_contains($ctype, 'gif')  => 'gif',
                        default                       => 'jpg',
                    };
                    $name = $slug . '-' . uniqid() . '.' . $ext;
                    $dest = 'products/' . $name;

                    $stream = $res->getBody();
                    Storage::disk('public')->put($dest, $stream->getContents());
                    return $dest;
                }
            } catch (\Throwable $e) {
                // bỏ qua ảnh nếu tải lỗi
                return null;
            }
        }

        // Không khớp quy tắc nào
        return null;
    }
}
