import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WishesPage } from './pages/tsx/WishesPage'
import { FriendsPage } from './pages/tsx/FriendsPage'
import { SettingsPage } from './pages/tsx/SettingsPage'
import { FeedPage } from './pages/tsx/FeedPage'
import { BottomNavigation } from './utils/tsx/BottomNavigation'
import { Head } from './utils/tsx/Head'
import { ThemeProvider } from './contexts/ThemeContext'
import { ApiProvider, useApiContext } from './contexts/ApiContext'
import { useTelegramWebApp } from './hooks/useTelegramWebApp'
import { useErrorHandler } from './hooks/useErrorHandler'
import type { User } from './utils/api'

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

/**
 * Компонент для автоматической регистрации пользователя
 */
interface UserRegistrationProps {
  onUserLoaded?: (theme: 'light' | 'dark' | null) => void
}

function UserRegistration({ onUserLoaded }: UserRegistrationProps) {
  const { users } = useApiContext()
  const { user, initData, webApp, isReady } = useTelegramWebApp()
  const [registeredUser, setRegisteredUser] = useState<User | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    // Ждём готовности Telegram WebApp и наличия данных пользователя
    if (!isReady || !user || isRegistering || registeredUser) {
      return
    }

    const registerUser = async () => {
      setIsRegistering(true)

      try {
        console.log('Начинаю регистрацию пользователя:', {
          telegram_id: user.id,
          first_name: user.first_name,
          username: user.username,
        })

        // Получаем системную тему из Telegram WebApp
        const systemTheme = webApp?.colorScheme || 'light'
        const systemThemeColor = systemTheme === 'dark' ? 'dark' : 'light'
        
        // Сначала устанавливаем системную тему из Telegram (чтобы не было мигания)
        if (onUserLoaded) {
          onUserLoaded(systemThemeColor)
        }
        
        // Проверяем, есть ли уже пользователь в БД
        let userData: User
        try {
          // Пытаемся получить существующего пользователя
          userData = await users.getUserByTelegramId(user.id)
          // Если пользователь найден, используем его сохранённую тему из БД
          const themeFromDB = userData.theme_color === 'dark' ? 'dark' : 'light'
          console.log('Пользователь найден, применяем тему из БД:', themeFromDB)
          
          // Применяем тему из БД (перезаписываем системную)
          if (onUserLoaded) {
            onUserLoaded(themeFromDB)
          }
          
          // Сохраняем в localStorage
          try {
            localStorage.setItem('app-theme', themeFromDB)
          } catch (e) {
            // Игнорируем ошибки
          }
        } catch (error) {
          // Пользователь не найден, регистрируем с системной темой
          console.log('Новый пользователь, регистрируем с системной темой из Telegram:', systemThemeColor)
          userData = await users.registerOrGet({
            telegram_id: user.id,
            first_name: user.first_name || '',
            last_name: user.last_name,
            username: user.username,
            language: initData?.user?.language_code || 'ru',
            theme_color: systemThemeColor, // При первом создании используем системную тему
            start_param: initData?.start_param,
          })
          
          // Тема уже установлена выше (системная), просто сохраняем в localStorage
          try {
            localStorage.setItem('app-theme', systemThemeColor)
          } catch (e) {
            // Игнорируем ошибки
          }
        }

        setRegisteredUser(userData)
        console.log('✅ Пользователь зарегистрирован/получен:', userData)
      } catch (error) {
        console.error('❌ Ошибка при регистрации пользователя:', error)
        if (error instanceof Error) {
          console.error('Детали ошибки:', error.message)
        }
        // Не блокируем работу приложения при ошибке регистрации
      } finally {
        setIsRegistering(false)
      }
    }

    registerUser()
  }, [isReady, user, initData, users, isRegistering, registeredUser])

  return null
}

function App() {
  // Конфигурация API (в продакшене должен быть в переменных окружения)
  const apiConfig = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://makrei.ru',
    timeout: 30000,
  }

  const [initialTheme, setInitialTheme] = useState<'light' | 'dark' | null>(null)

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ApiProvider config={apiConfig}>
        <TelegramInit />
        <UserRegistration onUserLoaded={setInitialTheme} />
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