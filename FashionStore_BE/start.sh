#!/usr/bin/env bash
set -e

# Sinh APP_KEY nếu chưa có
php artisan key:generate --force || true

# Migrate DB (SQLite)
php artisan migrate --force || true

# Tạo symbolic link cho storage
php artisan storage:link || true

# Serve Laravel
php artisan serve --host 0.0.0.0 --port 10000
