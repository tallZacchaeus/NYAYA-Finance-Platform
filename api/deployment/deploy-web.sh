#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/nyaya-web"

echo "==> Deploying NYAYA Finance Web"
cd "$APP_DIR"

echo "==> Pulling latest code"
git pull origin main

echo "==> Installing dependencies"
npm ci --omit=dev

echo "==> Building"
npm run build

echo "==> Copying standalone server assets"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> Restarting PM2"
pm2 reload ecosystem.config.js --update-env

echo "==> Done."
