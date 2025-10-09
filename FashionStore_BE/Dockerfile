# PHP 8.2 + Composer
FROM php:8.2-cli

# Cài package hệ thống cần cho Laravel, ZIP và SQLite
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev \
    libsqlite3-dev sqlite3 pkg-config \
    && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite \
    && docker-php-ext-install pdo pdo_sqlite zip

# Composer (copy từ image composer chính thức)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Thư mục làm việc
WORKDIR /app

# Copy code vào image
COPY . /app

# Cài vendor PHP
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Đảm bảo script khởi động chạy được
RUN chmod +x /app/start.sh

# Expose port cho Render
EXPOSE 10000

# Chạy script khởi động
CMD ["bash", "start.sh"]
