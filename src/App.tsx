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
    // Инициализируем Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово
    
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
          <ul>
            <li>ID: {userData.id}</li>
            <li>Username: {userData.username}</li>
          </ul>
        ) : (
          <p>Данные пользователя недоступны (откройте в Telegram)</p>
        )}
      </div>

      <button onClick={onClose} style={{ background: 'red', color: 'white' }}>
        Закрыть приложение
      </button>
    </div>
  )
}

export default App