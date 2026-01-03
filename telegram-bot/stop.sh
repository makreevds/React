#!/bin/bash

# Скрипт для остановки Telegram бота

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Переходим в директорию скрипта
cd "$(dirname "$0")" || exit 1

PID_FILE="bot.pid"

if [ -f "$PID_FILE" ]; then
    BOT_PID=$(cat "$PID_FILE")
    
    if ps -p "$BOT_PID" > /dev/null 2>&1; then
        kill "$BOT_PID"
        rm "$PID_FILE"
        echo -e "${GREEN}✓ Бот остановлен${NC}"
    else
        echo -e "${YELLOW}⚠️  Процесс бота не найден${NC}"
        rm "$PID_FILE"
    fi
else
    # Пытаемся найти процесс по имени
    BOT_PID=$(pgrep -f "bot.py")
    
    if [ -n "$BOT_PID" ]; then
        kill "$BOT_PID"
        echo -e "${GREEN}✓ Бот остановлен (найден по имени процесса)${NC}"
    else
        echo -e "${YELLOW}⚠️  Бот не запущен${NC}"
    fi
fi

