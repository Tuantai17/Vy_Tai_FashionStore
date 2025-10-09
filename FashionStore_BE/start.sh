#!/usr/bin/env bash
set -e

# ====== Chuẩn bị DB SQLite ======
mkdir -p database
[ -f database/database.sqlite ] || touch database/database.sqlite

# ====== APP_KEY ======
# Nếu Render chưa có APP_KEY (Environment), tự sinh key sạch và export vào ENV (KHÔNG ghi .env)
if [ -z "$APP_KEY" ]; then
  export APP_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));")
fi

# ====== Laravel optimize & link storage ======
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link || true

# Nếu có file config rồi, cache lại cho prod (không bắt buộc)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# ====== Migrate an toàn (chạy nhiều lần không sao) ======
php artisan migrate --force || true

# ====== Serve app ======
# Artisan serve mặc định document root là ./public nên KHÔNG cần tham số --public
php artisan serve --host 0.0.0.0 --port 10000
