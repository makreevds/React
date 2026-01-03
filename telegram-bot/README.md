# Telegram Bot

Отдельный модуль для работы с Telegram ботом.

## Быстрый старт

### 1. Установка зависимостей

```bash
pip3 install -r requirements.txt
```

Или вручную:
```bash
pip3 install aiogram python-dotenv
```

### 2. Настройка

Отредактируйте файл `config.py` и укажите:
- `BOT_TOKEN` - токен бота (получите у [@BotFather](https://t.me/BotFather))
- `WEB_APP_URL` - URL вашего React мини-приложения

### 3. Запуск

**В обычном режиме (для тестирования):**
```bash
chmod +x start.sh
./start.sh
```

**В фоновом режиме (для продакшена):**
```bash
chmod +x start_background.sh stop.sh
./start_background.sh
```

**Остановка:**
```bash
./stop.sh
```

## Структура файлов

```
telegram-bot/
├── bot.py              # Основной файл бота
├── config.py           # Файл с настройками (токены, URL)
├── requirements.txt    # Зависимости Python
├── start.sh            # Запуск в обычном режиме
├── start_background.sh # Запуск в фоновом режиме
├── stop.sh             # Остановка бота
└── README.md           # Этот файл
```

## Как это работает

1. Пользователь переходит по ссылке `https://t.me/your_bot?start=123`
2. Бот получает команду `/start 123`
3. Бот отправляет сообщение с кнопкой "Открыть приложение" (WebApp)
4. Когда пользователь нажимает кнопку, параметр `123` автоматически передается в `initDataUnsafe.start_param` в React приложении

## Запуск через systemd (рекомендуется для продакшена)

Создайте файл `/etc/systemd/system/telegram-bot.service`:

```ini
[Unit]
Description=Telegram Bot Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/telegram-bot
ExecStart=/usr/bin/python3 /path/to/telegram-bot/bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активируйте:
```bash
sudo systemctl daemon-reload
sudo systemctl enable telegram-bot
sudo systemctl start telegram-bot
```

## Полезные команды

```bash
# Посмотреть логи (если запущен в фоне)
tail -f bot.log

# Проверить статус
ps aux | grep bot.py

# Перезапустить
./stop.sh && ./start_background.sh
```

## Важно!

- Бот должен работать постоянно, чтобы отвечать на команды
- Убедитесь, что `WEB_APP_URL` совпадает с URL вашего React приложения
- Токен бота храните в секрете, не коммитьте `config.py` с реальными токенами в Git
- Добавьте `config.py` в `.gitignore` или создайте `config.py.example` для примера

