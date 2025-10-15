# Runtime PHP
FROM php:8.3-cli-alpine

# Cài các lib cần cho gd + zip + pdo_mysql
RUN apk add --no-cache \
    libpng-dev libjpeg-turbo-dev freetype-dev \
    oniguruma-dev libzip-dev zip git

# Enable extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql zip

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Cài dependency & optimize
RUN composer install --no-dev --optimize-autoloader \
    && php artisan key:generate --force || true \
    && php artisan optimize:clear \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Expose và start
EXPOSE 8080
CMD php artisan serve --host 0.0.0.0 --port ${PORT:-8080}
