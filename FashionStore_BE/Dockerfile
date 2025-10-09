# PHP 8.2 + Composer
FROM php:8.2-cli

# Giúp composer chạy với root trong container
ENV COMPOSER_ALLOW_SUPERUSER=1
# Timezone (tùy bạn, để VN)
ENV TZ=Asia/Ho_Chi_Minh

# Cài package hệ thống và extension PHP cần cho Laravel + SQLite
RUN apt-get update && apt-get install -y \
    git unzip curl tzdata \
    libzip-dev \
    libsqlite3-dev sqlite3 pkg-config \
  && docker-php-ext-configure pdo_sqlite --with-pdo-sqlite \
  && docker-php-ext-install pdo pdo_sqlite zip bcmath \
  && rm -rf /var/lib/apt/lists/*

# Lấy Composer từ image chính thức (nhỏ, nhanh)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Thư mục làm việc
WORKDIR /app

# Tối ưu cache layer: copy trước composer files để composer install có cache
COPY composer.json composer.lock /app/

# Cài vendor PHP (không dev) – tối ưu autoload cho prod
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Copy phần còn lại của project
COPY . /app

# Đảm bảo script khởi động chạy được
RUN chmod +x /app/start.sh

# Port Render sẽ map
EXPOSE 10000

# Healthcheck đơn giản (tùy chọn)
# Có curl ở trên nên check được; nếu bạn có /api/health thì đổi URL phù hợp
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD curl -fsS http://localhost:10000/ || exit 1

# Chạy script khởi động (tạo DB, APP_KEY, migrate, storage link, serve)
CMD ["bash", "start.sh"]
