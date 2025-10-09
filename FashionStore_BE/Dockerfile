# PHP 8.2 + Composer (giữ phần đầu như bạn đã có)

WORKDIR /app

# 1) Copy composer files trước để cache vendor
COPY composer.json composer.lock /app/

# 2) Cài vendor nhưng TẮT scripts vì chưa có artisan
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# 3) Copy toàn bộ source (lúc này mới có artisan)
COPY . /app

# 4) Chạy lại composer install (bật scripts) để package:discover chạy đúng
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# 5) Cho phép start.sh chạy
RUN chmod +x /app/start.sh

EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD curl -fsS http://localhost:10000/ || exit 1

CMD ["bash", "/app/start.sh"]
