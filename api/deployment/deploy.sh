#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/nyaya-api"

echo "==> Deploying NYAYA Finance API"
cd "$APP_DIR"

echo "==> Pulling latest code"
git pull origin main

echo "==> Installing Composer dependencies (production)"
composer install --no-dev --optimize-autoloader

echo "==> Caching configuration"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> Running migrations"
php artisan migrate --force

echo "==> Linking storage"
php artisan storage:link

echo "==> Restarting services"
sudo systemctl restart php8.3-fpm
sudo systemctl reload nginx

echo "==> Done."
