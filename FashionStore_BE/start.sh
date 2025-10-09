#!/usr/bin/env bash
set -e

# Tạo file DB SQLite nếu chưa có
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# Nếu APP_KEY chưa có, sinh và export vào env (không ghi .env)
if [ -z "$APP_KEY" ]; then
  export APP_KEY=$(php artisan key:generate --show)
fi

# Link storage, migrate, cache config
php artisan storage:link || true
php artisan config:clear
php artisan migrate --force || true

# Chạy server
php artisan serve --host 0.0.0.0 --port 10000
