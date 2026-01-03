"""
Telegram бот для мини-приложения
Установите зависимости: pip install aiogram
"""

from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import Command
import asyncio
import config

# Получаем настройки из config.py
BOT_TOKEN = config.BOT_TOKEN
WEB_APP_URL = config.WEB_APP_URL

if BOT_TOKEN == "YOUR_BOT_TOKEN":
    print("⚠️  ВНИМАНИЕ: Установите BOT_TOKEN в файле config.py!")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    """Обработчик команды /start"""
    # Получаем параметр из команды /start PARAM
    start_param = message.text.split()[1] if len(message.text.split()) > 1 else None
    
    # Создаем кнопку с WebApp
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

