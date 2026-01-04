"""
Telegram бот для мини-приложения
Установите зависимости: pip install aiogram
"""

from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import CommandStart
import asyncio
import config

# Получаем настройки из config.py
BOT_TOKEN = config.BOT_TOKEN
WEB_APP_URL = config.WEB_APP_URL

if BOT_TOKEN == "YOUR_BOT_TOKEN":
    print("⚠️  ВНИМАНИЕ: Установите BOT_TOKEN в файле config.py!")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: types.Message, command: CommandStart):
    """Обработчик команды /start"""
    # Получаем параметр из команды /start PARAM
    # В aiogram 3.x параметр доступен через command.args
    # Также используем резервный способ парсинга текста на случай, если command.args не работает
    start_param = None
    if hasattr(command, 'args') and command.args:
        start_param = command.args
    else:
        # Резервный способ: парсим текст сообщения
        parts = message.text.split(maxsplit=1)
        if len(parts) > 1:
            start_param = parts[1]
    
    # Создаем кнопку с WebApp
    # Telegram автоматически передаст start_param в initDataUnsafe.start_param
    # при открытии WebApp через кнопку после команды /start PARAM
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🎁 Открыть приложение",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ])
    
    if start_param:
        message_text = f"Добро пожаловать! Вы были приглашены пользователем {start_param}"
    else:
        message_text = "Добро пожаловать! Откройте приложение:"
    
    await message.answer(message_text, reply_markup=keyboard)

async def main():
    """Главная функция запуска бота"""
    print("🤖 Бот запущен и готов к работе!")
    print(f"📱 WebApp URL: {WEB_APP_URL}")
    await dp.start_polling(bot)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Бот остановлен")

