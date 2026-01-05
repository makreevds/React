import '../css/SettingsPage.css'
import { useTheme } from '../../contexts/ThemeContext'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useEffect, useState } from 'react'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { users } = useApiContext()
  const { user: telegramUser, webApp } = useTelegramWebApp()
  const [isUpdating, setIsUpdating] = useState(false)

  // Обновляем тему в БД при изменении
  useEffect(() => {
    if (!telegramUser?.id || isUpdating) {
      return
    }

    const updateThemeInDB = async () => {
      try {
        // Получаем текущего пользователя
        const currentUser = await users.getUserByTelegramId(telegramUser.id)
        
        // Определяем значение темы для БД
        // Если тема null (системная), получаем реальную системную тему из Telegram
        let themeForDB: string
        if (theme === null) {
          // Системная тема - получаем реальное значение из Telegram WebApp
          const systemTheme = webApp?.colorScheme || 'light'
          themeForDB = systemTheme === 'dark' ? 'dark' : 'light'
        } else {
          // Явно выбранная тема
          themeForDB = theme
        }
        
        // Обновляем только если тема изменилась
        if (currentUser.theme_color !== themeForDB) {
          setIsUpdating(true)
          await users.updateUser(currentUser.id, {
            theme_color: themeForDB,
          })
          console.log('Тема обновлена в БД:', themeForDB, theme === null ? '(системная)' : '')
        }
      } catch (error) {
        console.error('Ошибка при обновлении темы в БД:', error)
      } finally {
        setIsUpdating(false)
      }
    }

    // Небольшая задержка, чтобы избежать множественных запросов
    const timeoutId = setTimeout(updateThemeInDB, 500)
    return () => clearTimeout(timeoutId)
  }, [theme, telegramUser?.id, users, isUpdating, webApp])

  const handleThemeChange = (newTheme: 'light' | 'dark' | null) => {
    setTheme(newTheme)
  }

  return (
    <div className="page-container">
      <h1>Настройки</h1>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Тема</span>
            <span className="setting-description">
              {theme === 'dark' ? 'Темная' : theme === 'light' ? 'Светлая' : 'Системная'}
            </span>
          </div>
          <div className="theme-segmented-control">
            <button
              className={`theme-segment ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
              aria-label="Светлая тема"
              title="Светлая тема"
              disabled={isUpdating}
            >
              ☀️
            </button>
            <button
              className={`theme-segment ${theme === null ? 'active' : ''}`}
              onClick={() => handleThemeChange(null)}
              aria-label="Системная тема"
              title="Системная тема"
              disabled={isUpdating}
            >
              🔄
            </button>
            <button
              className={`theme-segment ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              aria-label="Темная тема"
              title="Темная тема"
              disabled={isUpdating}
            >
              🌙
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

