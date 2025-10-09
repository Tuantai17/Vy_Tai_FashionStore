#!/usr/bin/env bash
set -e

# Tạo database SQLite nếu chưa có
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# Sinh APP_KEY nếu chưa có
if [ -z "$APP_KEY" ]; then
  export APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
fi

# ➤ Chạy migrate trước (để tạo bảng cache, users, v.v...)
php artisan migrate:fresh --force || true
php artisan db:seed --force || true

# ➤ Sau khi DB có sẵn, mới clear config/cache/route
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true

# Liên kết storage
php artisan storage:link || true

# Khởi động server
php artisan serve --host 0.0.0.0 --port 10000
