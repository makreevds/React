import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WishesPage } from './pages/tsx/WishesPage'
import { FriendsPage } from './pages/tsx/FriendsPage'
import { SettingsPage } from './pages/tsx/SettingsPage'
import { FeedPage } from './pages/tsx/FeedPage'
import { BottomNavigation } from './utils/tsx/BottomNavigation'
import { Head } from './utils/tsx/Head'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider } from './contexts/ApiContext'
import { useTelegramWebApp } from './hooks/useTelegramWebApp'
import { useErrorHandler } from './hooks/useErrorHandler'

/**
 * Компонент инициализации Telegram WebApp
 */
function TelegramInit() {
  const { webApp, isReady, error } = useTelegramWebApp()
  const { handleError } = useErrorHandler(webApp || undefined)

  useEffect(() => {
    if (!isReady || !webApp) {
      if (error) {
        handleError(error, 'TelegramInit')
      }
      return
    }

    try {
      // Уведомляем Telegram о готовности приложения
      webApp.ready()

      // Настройка полноэкранного режима для мобильных устройств
      const platform = webApp.platform
      if ((platform === 'ios' || platform === 'android') && 'requestFullscreen' in webApp) {
        // @ts-expect-error - requestFullscreen может быть доступен, но не в типах
        webApp.requestFullscreen()
      }

      // Настройки интерфейса
      webApp.expand()
      if (webApp.disableVerticalSwipes) {
        webApp.disableVerticalSwipes()
      }
      webApp.enableClosingConfirmation()

      // Настройка цветовой схемы
      webApp.setHeaderColor('secondary_bg_color')
      webApp.setBackgroundColor('bg_color')
    } catch (err) {
      handleError(err, 'TelegramInit')
    }
  }, [webApp, isReady, error, handleError])

  return null
}

function App() {
  // Конфигурация API (в продакшене должен быть в переменных окружения)
  const apiConfig = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000,
  }

  return (
    <ThemeProvider>
      <ApiProvider config={apiConfig}>
        <TelegramInit />
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
      </ApiProvider>
    </ThemeProvider>
  )
}

export default App