# PHP 8.2 + Composer
FROM php:8.2-cli

# Cài các package cần thiết
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libsqlite3-dev sqlite3 pkg-config curl \
    && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite \
    && docker-php-ext-install pdo pdo_sqlite zip

# Copy composer từ image chính thức để dùng
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Thư mục làm việc
WORKDIR /app

# 1️⃣ Copy composer.json & lock trước để cache vendor
COPY composer.json composer.lock /app/

# 2️⃣ Cài vendor lần đầu — KHÔNG chạy scripts vì chưa có artisan
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# 3️⃣ Copy toàn bộ source code vào container
COPY . /app

# 4️⃣ Chạy lại composer install để chạy scripts (package:discover)
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# 5️⃣ Cho phép script start.sh chạy
RUN chmod +x /app/start.sh

# Mở port cho Render (Render bắt buộc dùng cổng 10000)
EXPOSE 10000

# Kiểm tra service đang hoạt động
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD curl -fsS http://localhost:10000/ || exit 1

# Chạy script khởi động
CMD ["bash", "/app/start.sh"]
