#!/bin/bash
cd /var/www/React
git pull
npm install
npm run build
echo "Сайт успешно обновлен!"