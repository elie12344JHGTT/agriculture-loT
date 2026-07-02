FROM php:8.4-cli-alpine

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash \
    git \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    zip \
    $PHPIZE_DEPS \
    && docker-php-ext-install bcmath intl mbstring pdo_mysql zip \
    && apk del $PHPIZE_DEPS

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN composer dump-autoload --optimize --no-scripts \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 10000

CMD php artisan package:discover --ansi \
    && php artisan config:clear \
    && php artisan route:clear \
    && php artisan migrate --force \
    && exec php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
