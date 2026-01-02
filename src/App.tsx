import { useEffect, useState } from 'react'
import './App.css'

// Объявляем тип для окна Telegram, чтобы TypeScript не ругался
declare global {
  interface Window {
    Telegram: any;
  }
}


function App() {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const tg = window.Telegram.WebApp;
  
    tg.ready();
  
    // 🔥 ПЫТАЕМСЯ ВКЛЮЧИТЬ FULLSCREEN
    if (tg.requestFullscreen) {
      tg.requestFullscreen();
    }
  
    tg.expand();
  
    // Запрещаем свайп вниз
    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
    }
  
    // Подтверждение закрытия
    tg.enableClosingConfirmation();
  
    // Цвета
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('bg_color');
  
    setUserData(tg.initDataUnsafe?.user);
  }, []);
  

  const onClose = () => {
    window.Telegram.WebApp.close(); // Функция закрытия приложения
  }

  return (
    <div className="App">
      <h1>Привет, {userData ? userData.first_name : 'Пользователь'}!</h1>
      
      <div className="card">
        {userData ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>ID: {userData.id}</li>
            <li>Username: {userData.username}</li>
          </ul>
        ) : (
          <p>Данные пользователя недоступны (откройте в Telegram)</p>
        )}
      </div>

      <button onClick={onClose} style={{ background: 'red', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Закрыть приложение
      </button>
    </div>
  )
}

export default App