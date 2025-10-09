# PHP 8.2 + Composer (CLI)
FROM php:8.2-cli

# Cho composer chạy với user root trong container
ENV COMPOSER_ALLOW_SUPERUSER=1
# Timezone (tùy chọn)
ENV TZ=Asia/Ho_Chi_Minh

# Cài OS packages + PHP extensions cần cho Laravel + SQLite
RUN apt-get update && apt-get install -y \
    git unzip curl tzdata \
    libzip-dev \
    libsqlite3-dev sqlite3 pkg-config \
  && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite \
  && docker-php-ext-install pdo pdo_sqlite zip bcmath \
  && rm -rf /var/lib/apt/lists/*

# Lấy Composer từ image chính thức
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Thư mục làm việc
WORKDIR /app

# Tối ưu cache layer: cài vendor trước dựa vào composer.json/lock
COPY composer.json composer.lock /app/
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Copy toàn bộ mã nguồn còn lại
COPY . /app

# Cho phép script start.sh thực thi
RUN chmod +x /app/start.sh

# Render sẽ map port này
EXPOSE 10000

# Healthcheck (tùy chọn) – nếu có endpoint / hoặc /api/health thì giữ
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD curl -fsS http://localhost:10000/ || exit 1

# Chạy script khởi động (tạo DB, APP_KEY, migrate, serve)
CMD ["bash", "/app/start.sh"]
