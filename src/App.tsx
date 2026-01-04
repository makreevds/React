import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WishesPage } from './pages/tsx/WishesPage'
import { FriendsPage } from './pages/tsx/FriendsPage'
import { SettingsPage } from './pages/tsx/SettingsPage'
import { FeedPage } from './pages/tsx/FeedPage'
import { BottomNavigation } from './utils/tsx/BottomNavigation'
import { Head } from './utils/tsx/Head'
import { ThemeProvider } from './contexts/ThemeContext'

// Объявляем глобальный тип для Telegram WebApp API
declare global {
  interface Window {
    Telegram: any;
  }
}


function App() {
  // === ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ===
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    
    // Уведомляем Telegram о готовности приложения
    tg.ready();
    
    // === ОПРЕДЕЛЕНИЕ ПРИГЛАСИВШЕГО ===
    // Когда пользователь переходит по ссылке вида: https://t.me/bot?start=123456
    // Telegram передает параметр start в initDataUnsafe.start_param
    // Также проверяем URL параметр ref как резервный вариант
    const startParamFromTelegram = tg.initDataUnsafe?.start_param; // ID пригласившего из Telegram
    const urlParams = new URLSearchParams(window.location.search);
    const startParamFromUrl = urlParams.get('ref'); // ID пригласившего из URL (резервный вариант)
    const startParam = startParamFromTelegram || startParamFromUrl; // Используем любой доступный параметр
    const currentUserId = tg.initDataUnsafe?.user?.id; // ID текущего пользователя
    const currentUsername = tg.initDataUnsafe?.user?.username; // Username текущего пользователя
    
    if (startParam) {
      // Пользователь перешел по ссылке приглашения
      console.log('🎁 Пользователь приглашен!');
      console.log('📋 ID пригласившего:', startParam);
      console.log('📋 Источник параметра:', startParamFromTelegram ? 'Telegram initData' : 'URL параметр');
      console.log('👤 ID нового пользователя:', currentUserId);
      console.log('👤 Username нового пользователя:', currentUsername);
      
      // Здесь можно отправить данные на сервер для логирования
      // Например: fetch('/api/log-invite', { method: 'POST', body: JSON.stringify({ inviterId: startParam, userId: currentUserId }) })
    }
    
    // Настройка полноэкранного режима для мобильных устройств
    const platform = tg.platform;
    if ((platform === 'ios' || platform === 'android') && tg.requestFullscreen) {
      tg.requestFullscreen();
    }
    
    // Настройки интерфейса
    tg.expand();
    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
    }
    tg.enableClosingConfirmation();
    
    // Настройка цветовой схемы
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('bg_color');
  }, []);

  // === РОУТИНГ ===
  return (
    <ThemeProvider>
      <Head />
      <Routes>
        <Route 
          path="/" 
          element={<FriendsPage />} 
        />
        <Route 
          path="/wishes" 
          element={<WishesPage />} 
        />
        <Route 
          path="/friends" 
          element={<FriendsPage />} 
        />
        <Route 
          path="/feed" 
          element={<FeedPage />} 
        />
        <Route 
          path="/settings" 
          element={<SettingsPage />} 
        />
      </Routes>
      <BottomNavigation />
    </ThemeProvider>
  );
}

export default App