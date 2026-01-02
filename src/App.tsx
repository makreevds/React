import { useEffect, useState } from 'react'
import './App.css'

// 1. ПОДГОТОВКА: Объясняем TypeScript, что объект 'window.Telegram' существует.
// Это нужно, чтобы при сборке (npm run build) не было ошибок.
declare global {
  interface Window {
    Telegram: any;
  }
}

function App() {
  // 2. СОСТОЯНИЕ (State): Это "память" твоего приложения.
  // userData — здесь будут лежать данные юзера (имя, id).
  // setUserData — это функция, которой мы записываем данные в эту "память".
  const [userData, setUserData] = useState<any>(null);

  // 3. ЭФФЕКТЫ (useEffect): Этот блок кода выполняется САМ один раз, 
  // как только приложение открылось в телефоне.
  useEffect(() => {
    // Создаем короткую переменную 'tg', чтобы не писать каждый раз window.Telegram.WebApp
    const tg = window.Telegram.WebApp;
  
    // Сообщаем Telegram, что приложение полностью загрузилось и его можно показывать
    tg.ready();
  
    // --- НАСТРОЙКИ ЭКРАНА ---
    
    // Включаем настоящий Fullscreen (если версия Telegram это поддерживает)
    if (tg.requestFullscreen) {
      tg.requestFullscreen();
    }
  
    // Принудительно разворачиваем "шторку" на максимум
    tg.expand();
  
    // Запрещаем закрывать приложение свайпом вниз (чтобы не вылететь случайно)
    if (tg.disableVerticalSwipes) {
      tg.disableVerticalSwipes();
    }
  
    // Включаем подтверждение при попытке закрыть приложение (вылезет окно "Вы уверены?")
    tg.enableClosingConfirmation();
  
    // --- ЦВЕТА И ТЕМЫ ---

    // Красим верхнюю панель (где часы и зарядка) в цвет фона приложения
    tg.setHeaderColor('secondary_bg_color');
    // Устанавливаем цвет фона самого приложения
    tg.setBackgroundColor('bg_color');
  
    // --- ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ---

    // Вытаскиваем данные из Telegram и сохраняем их в нашу "память" (state)
    // initDataUnsafe — это объект с информацией о текущем юзере
    if (tg.initDataUnsafe?.user) {
      setUserData(tg.initDataUnsafe.user);
    }
  }, []); // Пустые скобки в конце означают: "Запустить только 1 раз при старте"

  // 4. ФУНКЦИИ: Действия, которые срабатывают при нажатии на кнопки
  const onClose = () => {
    window.Telegram.WebApp.close(); // Команда Telegram закрыть мини-апп
  }

  // 5. ИНТЕРФЕЙС (Верстка): То, что увидит пользователь на экране
  return (
    <div className="App">
      {/* Здесь мы используем тернарный оператор (условие):
        Если userData есть — пишем имя. Если нет — пишем "Пользователь".
      */}
      <h1>Привет, {userData ? userData.first_name : 'Пользователь'}!</h1>
      
      <div className="card">
        {/* Проверка: если данные загрузились, рисуем список */}
        {userData ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><b>Твой ID:</b> {userData.id}</li>
            <li><b>Никнейм:</b> {userData.username || 'не указан'}</li>
            <li><b>Язык:</b> {userData.language_code}</li>
          </ul>
        ) : (
          // Если данных нет (например, зашли через обычный браузер)
          <p>Данные пользователя недоступны. Пожалуйста, откройте через Telegram Bot.</p>
        )}
      </div>

      {/* Кнопка закрытия */}
      <button 
        onClick={onClose} 
        style={{ 
          marginTop: '20px',
          background: 'red', 
          color: 'white', 
          padding: '12px 24px', 
          border: 'none', 
          borderRadius: '10px', 
          fontWeight: 'bold',
          cursor: 'pointer' 
        }}
      >
        Закрыть приложение
      </button>
    </div>
  )
}

export default App