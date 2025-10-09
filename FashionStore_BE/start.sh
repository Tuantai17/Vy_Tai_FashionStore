#!/usr/bin/env bash
set -e

# Tạo database SQLite nếu chưa có
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# Sinh APP_KEY nếu chưa có
if [ -z "$APP_KEY" ]; then
  export APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
fi

# Dọn cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Chạy migrate — thêm lệnh fresh để chắc chắn DB sạch và tạo lại
php artisan migrate:fresh --force || true
php artisan db:seed --force || true

# Liên kết storage
php artisan storage:link || true

# Chạy server
php artisan serve --host 0.0.0.0 --port 10000
