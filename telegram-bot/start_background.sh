#!/bin/bash

# Скрипт для запуска Telegram бота в фоновом режиме

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Переходим в директорию скрипта
cd "$(dirname "$0")" || exit 1

PID_FILE="bot.pid"
LOG_FILE="bot.log"

# Проверяем, не запущен ли уже бот
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Бот уже запущен (PID: $OLD_PID)${NC}"
        exit 1
    fi
fi

# Проверяем наличие config.py файла
if [ ! -f "config.py" ]; then
    echo -e "${RED}❌ Файл config.py не найден${NC}"
    echo -e "${YELLOW}💡 Создайте файл config.py и укажите BOT_TOKEN и WEB_APP_URL${NC}"
    exit 1
fi

# Запускаем бота в фоне
echo -e "${YELLOW}🚀 Запускаю бота в фоновом режиме...${NC}"
nohup python3 bot.py > "$LOG_FILE" 2>&1 &
BOT_PID=$!

# Сохраняем PID
echo $BOT_PID > "$PID_FILE"

echo -e "${GREEN}✓ Бот запущен (PID: $BOT_PID)${NC}"
echo -e "${YELLOW}💡 Логи: tail -f $LOG_FILE${NC}"
echo -e "${YELLOW}💡 Остановить: ./stop.sh${NC}"

