# PHP CLI + Alpine
FROM php:8.3-cli-alpine

# ---------- OS deps cho gd + zip + pdo_mysql ----------
RUN apk add --no-cache \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    oniguruma-dev libzip-dev zip git bash tzdata

# ---------- Bật các PHP extensions cần thiết ----------
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" gd pdo pdo_mysql zip

# ---------- Composer ----------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1

# ---------- App ----------
WORKDIR /app
COPY . .

# Quyền ghi cho Laravel
RUN mkdir -p storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ---------- Cài deps PHP & tối ưu ----------
# --no-scripts để tránh script chạy khi APP_KEY/env chưa có
RUN composer install --no-dev --prefer-dist --optimize-autoloader \
    --no-interaction --no-progress --no-scripts \
    && php artisan package:discover --ansi || true \
    && php artisan key:generate --force || true \
    && php artisan optimize:clear \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

EXPOSE 8080
CMD php artisan serve --host 0.0.0.0 --port ${PORT:-8080}
