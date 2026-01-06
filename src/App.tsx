import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { WishesPage } from './pages/tsx/WishesPage'
import { FriendsPage } from './pages/tsx/FriendsPage'
import { SettingsPage } from './pages/tsx/SettingsPage'
import { FeedPage } from './pages/tsx/FeedPage'
import { AddWishlistPage } from './pages/tsx/AddWishlistPage'
import { AddWishPage } from './pages/tsx/AddWishPage'
import { UserProfilePage } from './pages/tsx/UserProfilePage'
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
  onUserLoaded?: (theme: 'light' | 'dark' | 'ozon') => void
}

function UserRegistration({ onUserLoaded }: UserRegistrationProps) {
  const { users } = useApiContext()
  const { user, initData, webApp, isReady } = useTelegramWebApp()
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    // Ждём готовности Telegram WebApp и наличия данных пользователя
    // Вызываем при каждом монтировании компонента (при открытии приложения)
    if (!isReady || !user || isRegistering) {
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
        
        // Сначала проверяем, есть ли пользователь в БД
        let userData: User | null = null
        let isNewUser = false
        
        try {
          // Пытаемся получить существующего пользователя
          userData = await users.getUserByTelegramId(user.id)
          console.log('Пользователь найден в БД, используем его тему:', userData.theme_color)
        } catch (error) {
          // Пользователь не найден - будет новый пользователь
          isNewUser = true
          console.log('Новый пользователь, используем системную тему из Telegram:', systemThemeColor)
        }
        
        // Определяем тему для применения
        let themeToApply: 'light' | 'dark' | 'ozon'
        if (userData) {
          // Если пользователь найден - используем его сохранённую тему из БД
          if (userData.theme_color === 'dark') {
            themeToApply = 'dark'
          } else if (userData.theme_color === 'ozon') {
            themeToApply = 'ozon'
          } else {
            themeToApply = 'light'
          }
        } else {
          // Если пользователь новый - используем системную тему
          themeToApply = systemThemeColor
        }
        
        // Применяем тему сразу (чтобы не было мигания)
        if (onUserLoaded) {
          onUserLoaded(themeToApply)
        }
        
        // Сохраняем в localStorage
        try {
          localStorage.setItem('app-theme', themeToApply)
        } catch (e) {
          // Игнорируем ошибки
        }
        
        // Всегда вызываем registerOrGet, чтобы обновить last_visit
        // Это обновит время последнего посещения при каждом входе
        // Для нового пользователя передаём системную тему, для существующего - не передаём theme_color
        const registerData: {
          telegram_id: number
          first_name: string
          last_name?: string
          username?: string
          photo_url?: string
          language: string
          start_param?: string
          theme_color?: string
        } = {
          telegram_id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name,
          username: user.username,
          photo_url: user.photo_url,
          language: initData?.user?.language_code || 'ru',
          start_param: initData?.start_param,
        }
        
        // Только для нового пользователя передаём системную тему
        if (isNewUser) {
          registerData.theme_color = systemThemeColor
        }
        
        userData = await users.registerOrGet(registerData)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, user?.id]) // Вызываем только при изменении isReady или user.id

  return null
}

function AppContent() {
  const location = useLocation()
  
  // Пути, на которых навбар не должен отображаться
  const hideNavbarPaths = [
    '/wishes/add-wishlist',
    '/wishes/edit-wishlist',
    '/wishes/add-wish',
    '/wishes/edit-wish',
  ]
  
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname)

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={<WishesPage />} 
        />
        <Route 
          path="/wishes" 
          element={<WishesPage />} 
        />
        <Route 
          path="/wishes/add-wishlist" 
          element={<AddWishlistPage />} 
        />
        <Route 
          path="/wishes/edit-wishlist" 
          element={<AddWishlistPage />} 
        />
        <Route 
          path="/wishes/add-wish" 
          element={<AddWishPage />} 
        />
        <Route 
          path="/wishes/edit-wish" 
          element={<AddWishPage />} 
        />
        <Route 
          path="/friends" 
          element={<FriendsPage />} 
        />
        <Route 
          path="/user/:telegramId" 
          element={<UserProfilePage />} 
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
      {shouldShowNavbar && <BottomNavigation />}
    </>
  )
}

function App() {
  // Конфигурация API (в продакшене должен быть в переменных окружения)
  const apiConfig = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://makrei.ru',
    timeout: 30000,
  }

  const [initialTheme, setInitialTheme] = useState<'light' | 'dark' | 'ozon'>('light')

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ApiProvider config={apiConfig}>
        <TelegramInit />
        <UserRegistration onUserLoaded={setInitialTheme} />
        <Head />
        <AppContent />
      </ApiProvider>
    </ThemeProvider>
  )
}

export default App