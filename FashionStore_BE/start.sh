#!/usr/bin/env bash
set -e

# Tạo file DB SQLite nếu chưa tồn tại
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# Sinh APP_KEY nếu chưa có
php artisan key:generate --force || true

# Link storage (nếu đã link rồi sẽ không lỗi)
php artisan storage:link || true

# Chạy migrate (an toàn khi chạy nhiều lần)
php artisan migrate --force || true

# Serve Laravel
php artisan serve --host 0.0.0.0 --port 10000
