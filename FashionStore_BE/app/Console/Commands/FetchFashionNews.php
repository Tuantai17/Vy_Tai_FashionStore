<?php
//tin tuc
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FetchFashionNewsService;

class FetchFashionNews extends Command
{
    /**
     * Tên command (sử dụng trong artisan)
     */
    protected $signature = 'news:fetch {--limit=20}';

    /**
     * Mô tả lệnh
     */
    protected $description = 'Tự động lấy tin tức thời trang từ các trang báo (RSS/Atom) và lưu vào database.';

    /**
     * Thực thi lệnh
     */
    public function handle(FetchFashionNewsService $service)
    {
        $limit = (int) $this->option('limit');
        $count = $service->run($limit);

        $this->info("✅ Đã lấy và lưu {$count} bài viết mới vào cơ sở dữ liệu!");
    }
}
