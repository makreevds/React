#!/bin/bash

# Скрипт для принудительной очистки базы данных
# Использование: ./reset_db.sh

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Путь к проекту
PROJECT_DIR="/var/www/React"

echo -e "${YELLOW}⚠️  ВНИМАНИЕ: Это удалит всю базу данных!${NC}"
echo -e "${YELLOW}Нажмите Ctrl+C для отмены или подождите 5 секунд...${NC}"
sleep 5

# Переходим в директорию проекта
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Ошибка: Не удалось перейти в директорию $PROJECT_DIR${NC}"
    exit 1
}

echo -e "${GREEN}✓ Директория: $PROJECT_DIR${NC}"

# Останавливаем Gunicorn
echo -e "${YELLOW}⏹️  Останавливаю Gunicorn...${NC}"
if pkill -f "gunicorn.*8002" 2>/dev/null; then
    echo -e "${GREEN}✓ Gunicorn остановлен${NC}"
    sleep 1
else
    echo -e "${YELLOW}⚠️  Gunicorn не запущен${NC}"
fi

# Проверяем виртуальное окружение
VENV_PYTHON="$PROJECT_DIR/.venv/bin/python"
if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${RED}❌ Виртуальное окружение не найдено: $VENV_PYTHON${NC}"
    echo -e "${YELLOW}💡 Запустите: ./update.sh${NC}"
    exit 1
fi

# Удаляем базу данных
DB_FILE="$PROJECT_DIR/backend/db.sqlite3"
DB_JOURNAL="$PROJECT_DIR/backend/db.sqlite3-journal"

echo -e "${YELLOW}🗑️  Удаляю базу данных...${NC}"

if [ -f "$DB_FILE" ]; then
    rm "$DB_FILE"
    echo -e "${GREEN}✓ База данных удалена${NC}"
else
    echo -e "${YELLOW}⚠️  База данных не найдена${NC}"
fi

if [ -f "$DB_JOURNAL" ]; then
    rm "$DB_JOURNAL"
    echo -e "${GREEN}✓ Журнал базы данных удалён${NC}"
fi

# Выполняем миграции для создания новой БД
echo -e "${YELLOW}🗄️  Создаю новую базу данных...${NC}"
cd "$PROJECT_DIR/backend" || {
    echo -e "${RED}❌ Ошибка: Не удалось перейти в директорию backend${NC}"
    exit 1
}

"$VENV_PYTHON" manage.py migrate --noinput

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Новая база данных создана${NC}"
else
    echo -e "${RED}❌ Ошибка при создании базы данных${NC}"
    exit 1
fi

# Создание суперпользователя (опционально)
echo -e "${YELLOW}👤 Создать суперпользователя для админки? (y/n)${NC}"
read -t 10 -p "Ответ (по умолчанию n): " CREATE_SUPERUSER

if [ "$CREATE_SUPERUSER" = "y" ] || [ "$CREATE_SUPERUSER" = "Y" ]; then
    echo -e "${YELLOW}Создаю суперпользователя...${NC}"
    "$VENV_PYTHON" manage.py createsuperuser
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Суперпользователь создан${NC}"
    else
        echo -e "${YELLOW}⚠️  Ошибка при создании суперпользователя${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Пропускаю создание суперпользователя${NC}"
fi

# Перезапускаем Gunicorn
echo -e "${YELLOW}🔄 Перезапускаю Gunicorn...${NC}"
cd "$PROJECT_DIR/backend" || exit 1

nohup "$VENV_PYTHON" -m gunicorn config.wsgi:application --bind 127.0.0.1:8002 > gunicorn.log 2>&1 &
GUNICORN_PID=$!
sleep 1

if ps -p "$GUNICORN_PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Gunicorn запущен (PID: $GUNICORN_PID)${NC}"
else
    echo -e "${RED}❌ Ошибка при запуске Gunicorn${NC}"
    echo -e "${YELLOW}💡 Проверьте логи: tail -20 $PROJECT_DIR/backend/gunicorn.log${NC}"
fi

echo -e "${GREEN}✅ База данных успешно очищена и пересоздана!${NC}"
echo -e "${YELLOW}💡 Админка: https://makrei.ru/admin/${NC}"

