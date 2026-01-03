import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WishesPage } from './pages/tsx/WishesPage'
import { FriendsPage } from './pages/tsx/FriendsPage'
import { SettingsPage } from './pages/tsx/SettingsPage'
import { BottomNavigation } from './utils/tsx/BottomNavigation'

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
    <>
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
          path="/settings" 
          element={<SettingsPage />} 
        />
      </Routes>
      <BottomNavigation />
    </>
  );
}

export default App