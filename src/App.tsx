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
    
    // === ЛОГИРОВАНИЕ ПРИГЛАШЕНИЯ ===
    // Получаем параметр start_param (ID пригласившего)
    const startParam = tg.initDataUnsafe?.start_param;
    const currentUserId = tg.initDataUnsafe?.user?.id;
    const currentUsername = tg.initDataUnsafe?.user?.username;
    const timestamp = new Date().toISOString();
    
    // URL PHP скрипта для логирования (замените на путь к вашему log.php на VPS)
    const LOG_URL = import.meta.env.VITE_LOG_URL || '/log.php';
    
    if (startParam) {
      console.log('🎁 Пользователь перешел по ссылке приглашения!');
      console.log('📋 ID пригласившего:', startParam);
      console.log('👤 ID текущего пользователя:', currentUserId);
      console.log('👤 Username текущего пользователя:', currentUsername);
      console.log('📅 Дата и время:', timestamp);
      
      // Отправляем данные на сервер для записи в txt файл
      fetch(LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviterId: startParam,
          userId: currentUserId,
          username: currentUsername,
          timestamp: timestamp,
        }),
      }).catch(error => {
        console.error('❌ Ошибка при отправке лога:', error);
      });
    } else {
      console.log('ℹ️ Пользователь открыл приложение напрямую (без приглашения)');
      console.log('👤 ID текущего пользователя:', currentUserId);
      console.log('👤 Username текущего пользователя:', currentUsername);
      
      // Логируем обычный вход
      fetch(LOG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          username: currentUsername,
          timestamp: timestamp,
        }),
      }).catch(error => {
        console.error('❌ Ошибка при отправке лога:', error);
      });
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