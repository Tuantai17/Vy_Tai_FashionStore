# PHP 8.2 + Composer
FROM php:8.2-cli

# Cài extension cần cho Laravel + SQLite
RUN apt-get update && apt-get install -y git unzip libzip-dev \
    && docker-php-ext-install pdo pdo_sqlite zip

# Composer (copy từ image composer chính thức)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Thư mục làm việc
WORKDIR /app

# Copy toàn bộ backend vào image
COPY . /app

# Cài package PHP
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Expose port cho Render
EXPOSE 10000

# Chạy script khởi động (generate key + migrate + serve)
CMD ["bash", "start.sh"]
