#!/usr/bin/env bash
set -e

# Tạo DB nếu chưa có
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# Nếu APP_KEY chưa có, sinh mới và export vào ENV (không ghi file .env)
if [ -z "$APP_KEY" ]; then
  export APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
fi

# Dọn cache config tránh lấy key cũ
php artisan config:clear
php artisan storage:link || true
php artisan migrate --force || true

# Chạy server
php artisan serve --host 0.0.0.0 --port 10000
