#!/usr/bin/env bash
set -e

# ==== Chuẩn bị thư mục ghi log/cache (đề phòng mount khác) ====
mkdir -p storage/logs storage/framework/{cache,sessions,views}

# ==== Tạo DB SQLite nếu chưa có ====
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# ==== APP_KEY: nếu thiếu thì sinh mới và export vào ENV (không ghi .env) ====
if [ -z "${APP_KEY:-}" ]; then
  export APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
fi

# ==== Clear tối đa để không dính cache cũ, rồi cache lại cho prod ====
php artisan optimize:clear
php artisan storage:link || true

php artisan config:cache   || true
php artisan route:cache    || true
php artisan view:cache     || true

# ==== Migrate an toàn (chạy nhiều lần không sao) ====
php artisan migrate --force || true

# ==== Serve Laravel (document root mặc định là ./public) ====
php artisan serve --host 0.0.0.0 --port 10000
