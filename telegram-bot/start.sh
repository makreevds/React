#!/bin/bash

# Скрипт для запуска Telegram бота

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Переходим в директорию скрипта
cd "$(dirname "$0")" || exit 1

echo -e "${YELLOW}🤖 Запускаю Telegram бота...${NC}"

# Проверяем наличие config.py файла
if [ ! -f "config.py" ]; then
    echo -e "${RED}❌ Файл config.py не найден${NC}"
    echo -e "${YELLOW}💡 Создайте файл config.py и укажите BOT_TOKEN и WEB_APP_URL${NC}"
    exit 1
fi

# Проверяем, установлен ли Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 не установлен${NC}"
    exit 1
fi

# Проверяем и устанавливаем зависимости
if ! python3 -c "import aiogram" 2>/dev/null; then
    echo -e "${YELLOW}📦 Устанавливаю зависимости...${NC}"
    if [ -f "requirements.txt" ]; then
        pip3 install -r requirements.txt
    else
        pip3 install aiogram python-dotenv
    fi
fi

# Запускаем бота
echo -e "${GREEN}✓ Запускаю бота...${NC}"
python3 bot.py

