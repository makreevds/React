#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Путь к проекту
PROJECT_DIR="/var/www/React"

echo -e "${YELLOW}🚀 Начинаю обновление проекта...${NC}"

# Переходим в директорию проекта
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Ошибка: Не удалось перейти в директорию $PROJECT_DIR${NC}"
    exit 1
}

echo -e "${GREEN}✓ Директория: $PROJECT_DIR${NC}"

# Сохраняем базу данных перед обновлением
DB_FILE="$PROJECT_DIR/backend/db.sqlite3"
DB_BACKUP="$PROJECT_DIR/backend/db.sqlite3.backup"
if [ -f "$DB_FILE" ]; then
    echo -e "${YELLOW}💾 Сохраняю резервную копию базы данных...${NC}"
    cp "$DB_FILE" "$DB_BACKUP"
    echo -e "${GREEN}✓ Резервная копия создана${NC}"
fi

# Обновляем код из Git принудительно
echo -e "${YELLOW}📥 Обновляю код из Git (Force)...${NC}"
git fetch origin main
if git reset --hard origin/main; then
    echo -e "${GREEN}✓ Код принудительно обновлен до origin/main${NC}"
    
    # Восстанавливаем базу данных, если она была удалена
    if [ -f "$DB_BACKUP" ] && [ ! -f "$DB_FILE" ]; then
        echo -e "${YELLOW}🔄 Восстанавливаю базу данных из резервной копии...${NC}"
        cp "$DB_BACKUP" "$DB_FILE"
        echo -e "${GREEN}✓ База данных восстановлена${NC}"
    fi
    
    # Удаляем резервную копию после успешного обновления
    if [ -f "$DB_BACKUP" ]; then
        rm "$DB_BACKUP"
    fi
else
    echo -e "${RED}❌ Ошибка при сбросе кода${NC}"
    
    # Восстанавливаем базу данных при ошибке
    if [ -f "$DB_BACKUP" ] && [ ! -f "$DB_FILE" ]; then
        echo -e "${YELLOW}🔄 Восстанавливаю базу данных из резервной копии...${NC}"
        cp "$DB_BACKUP" "$DB_FILE"
        echo -e "${GREEN}✓ База данных восстановлена${NC}"
    fi
    
    exit 1
fi

# Устанавливаем зависимости
echo -e "${YELLOW}📦 Устанавливаю зависимости...${NC}"
if npm install; then
    echo -e "${GREEN}✓ Зависимости установлены${NC}"
else
    echo -e "${RED}❌ Ошибка при установке зависимостей${NC}"
    exit 1
fi

# Собираем проект
echo -e "${YELLOW}🔨 Собираю проект...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Проект собран${NC}"
else
    echo -e "${RED}❌ Ошибка при сборке проекта${NC}"
    exit 1
fi



echo -e "${GREEN}✅ Сайт успешно обновлен!${NC}"

# Перезапускаем Gunicorn (Django)
echo -e "${YELLOW}🔄 Перезапускаю Django (Gunicorn)...${NC}"
if pkill -f "gunicorn.*8002" 2>/dev/null; then
    echo -e "${YELLOW}⏹️  Остановлен старый процесс Gunicorn${NC}"
    sleep 1
fi

# Запускаем Gunicorn в фоне
cd "$PROJECT_DIR/backend" || {
    echo -e "${RED}❌ Ошибка: Не удалось перейти в директорию backend${NC}"
} && {
    if [ -f "$PROJECT_DIR/.venv/bin/python" ]; then
        echo -e "${YELLOW}🚀 Запускаю Gunicorn в фоновом режиме...${NC}"
        nohup "$PROJECT_DIR/.venv/bin/gunicorn" config.wsgi:application --bind 127.0.0.1:8002 > gunicorn.log 2>&1 &
        GUNICORN_PID=$!
        sleep 1
        
        # Проверяем, запустился ли процесс
        if ps -p "$GUNICORN_PID" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Gunicorn запущен (PID: $GUNICORN_PID)${NC}"
            echo -e "${YELLOW}💡 Логи: tail -f $PROJECT_DIR/backend/gunicorn.log${NC}"
        else
            echo -e "${RED}❌ Ошибка при запуске Gunicorn${NC}"
            echo -e "${YELLOW}💡 Проверьте логи: tail -20 $PROJECT_DIR/backend/gunicorn.log${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Виртуальное окружение не найдено, пропускаю запуск Gunicorn${NC}"
    fi
}

# Проверяем и создаём виртуальное окружение, если его нет
VENV_DIR="$PROJECT_DIR/.venv"
VENV_PYTHON="$VENV_DIR/bin/python"

if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${YELLOW}📦 Виртуальное окружение не найдено, создаю...${NC}"
    
    # Проверка наличия Python 3
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python 3 не найден. Установите Python 3.8 или выше.${NC}"
        exit 1
    fi
    
    # Создание виртуального окружения
    python3 -m venv "$VENV_DIR"
    
    if [ ! -f "$VENV_PYTHON" ]; then
        echo -e "${RED}❌ Ошибка при создании виртуального окружения${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Виртуальное окружение создано${NC}"
    
    # Активация и установка зависимостей
    echo -e "${YELLOW}📥 Устанавливаю зависимости Python...${NC}"
    source "$VENV_DIR/bin/activate"
    pip install --upgrade pip --quiet
    
    if [ -f "$PROJECT_DIR/requirements.txt" ]; then
        pip install -r "$PROJECT_DIR/requirements.txt" --quiet
        echo -e "${GREEN}✓ Зависимости установлены${NC}"
    else
        echo -e "${YELLOW}⚠️  Файл requirements.txt не найден${NC}"
    fi
    
    # Выполнение миграций Django
    if [ -d "$PROJECT_DIR/backend" ]; then
        echo -e "${YELLOW}🗄️  Выполняю миграции базы данных...${NC}"
        cd "$PROJECT_DIR/backend"
        python manage.py migrate --noinput > /dev/null 2>&1
        cd "$PROJECT_DIR"
        echo -e "${GREEN}✓ Миграции выполнены${NC}"
    fi
else
    echo -e "${GREEN}✓ Виртуальное окружение найдено${NC}"
fi

# Перезапускаем Telegram бота
echo -e "${YELLOW}🤖 Перезапускаю Telegram бота...${NC}"
BOT_DIR="$PROJECT_DIR/telegram-bot"

if [ -d "$BOT_DIR" ]; then
    cd "$BOT_DIR" || {
        echo -e "${RED}❌ Ошибка: Не удалось перейти в директорию $BOT_DIR${NC}"
        exit 1
    }
    
    PID_FILE="bot.pid"
    LOG_FILE="bot.log"
    
    # Останавливаем бота, если он запущен
    if [ -f "$PID_FILE" ]; then
        BOT_PID=$(cat "$PID_FILE")
        if ps -p "$BOT_PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⏹️  Останавливаю бота (PID: $BOT_PID)...${NC}"
            kill "$BOT_PID"
            rm "$PID_FILE"
            sleep 1
        else
            rm "$PID_FILE"
        fi
    fi
    
    # Проверяем наличие config.py файла
    if [ ! -f "config.py" ]; then
        echo -e "${YELLOW}⚠️  Файл config.py не найден, пропускаю запуск бота${NC}"
    else
        # Запускаем бота в фоне через виртуальное окружение
        echo -e "${YELLOW}🚀 Запускаю бота в фоновом режиме...${NC}"
        nohup "$VENV_PYTHON" bot.py > "$LOG_FILE" 2>&1 &
        BOT_PID=$!
        
        # Сохраняем PID
        echo $BOT_PID > "$PID_FILE"
        
        echo -e "${GREEN}✓ Бот запущен (PID: $BOT_PID)${NC}"
        echo -e "${YELLOW}💡 Логи: tail -f $BOT_DIR/$LOG_FILE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Директория $BOT_DIR не найдена, пропускаю запуск бота${NC}"
fi