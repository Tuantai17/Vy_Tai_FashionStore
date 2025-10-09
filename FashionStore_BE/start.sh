#!/usr/bin/env bash
set -e

# Tạo DB SQLite nếu chưa có
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# Nếu chưa có APP_KEY thì tự sinh
if [ -z "$APP_KEY" ]; then
  export APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
fi

# Dọn cache, liên kết storage, migrate DB
php artisan config:clear
php artisan storage:link || true
php artisan migrate --force || true

# Khởi động server
php artisan serve --host 0.0.0.0 --port 10000
