import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { HomePage } from './HomePage'
import { WishesPage } from './WishesPage'
import { FriendsPage } from './FriendsPage'
import { SettingsPage } from './SettingsPage'
import { BottomNavigation } from './BottomNavigation'

// Объявляем глобальный тип для Telegram WebApp API
declare global {
  interface Window {
    Telegram: any;
  }
}


function App() {
  // === СОСТОЯНИЕ ===
  const [userData, setUserData] = useState<any>(null);

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
    
    // Загрузка данных пользователя
    if (tg.initDataUnsafe?.user) {
      setUserData(tg.initDataUnsafe.user);
    }
  }, []);

  // === ОБРАБОТЧИКИ СОБЫТИЙ ===
  const handleClose = () => {
    window.Telegram.WebApp.close();
  };

  // === РОУТИНГ ===
  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={<HomePage userData={userData} onClose={handleClose} />} 
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