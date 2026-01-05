# Django Backend API

Backend API для Telegram Mini App приложения.

## Установка на VPS сервере

### 1. Подготовка

Убедитесь, что на сервере установлены:
- Python 3.8 или выше
- pip3

### 2. Установка зависимостей

Перейдите в директорию `backend` и выполните:

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

Скрипт автоматически:
- Создаст виртуальное окружение `venv/`
- Установит все зависимости из `requirements.txt`
- Выполнит миграции базы данных

### 3. Ручная установка (альтернатива)

Если скрипт не работает, выполните вручную:

```bash
# Создание виртуального окружения
python3 -m venv venv

# Активация виртуального окружения
source venv/bin/activate

# Обновление pip
pip install --upgrade pip

# Установка зависимостей
pip install -r requirements.txt

# Выполнение миграций
python manage.py migrate

# Создание суперпользователя (опционально)
python manage.py createsuperuser
```

### 4. Запуск

#### Режим разработки:
```bash
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

#### Продакшен (через Gunicorn):
```bash
source venv/bin/activate
gunicorn config.wsgi:application --bind 127.0.0.1:8000
```

## Структура проекта

```
backend/
├── config/          # Настройки Django проекта
├── users/           # Приложение пользователей
├── manage.py        # Управление Django
├── requirements.txt # Зависимости Python
├── setup.sh         # Скрипт установки
└── venv/            # Виртуальное окружение (не в Git)
```

## API эндпоинты

Все API эндпоинты доступны по префиксу `/api/`:

- `GET /api/users/` - список пользователей
- `POST /api/users/` - создание пользователя
- `GET /api/users/{id}/` - получение пользователя
- `PATCH /api/users/{id}/` - обновление пользователя
- `DELETE /api/users/{id}/` - удаление пользователя
- `GET /api/users/by_telegram_id/?telegram_id={id}` - получение по Telegram ID

## Настройка для продакшена

Перед запуском в продакшене обновите `config/settings.py`:

```python
DEBUG = False
ALLOWED_HOSTS = ['makrei.ru', 'www.makrei.ru']
```

## Переменные окружения

Для продакшена рекомендуется использовать переменные окружения:

```bash
export SECRET_KEY='ваш-секретный-ключ'
export DEBUG=False
```

