import '../css/SettingsPage.css'
import { useTheme } from '../../contexts/ThemeContext'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useEffect, useState } from 'react'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { users } = useApiContext()
  const { user: telegramUser } = useTelegramWebApp()
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
        
        // Обновляем только если тема изменилась
        if (currentUser.theme_color !== theme) {
          setIsUpdating(true)
          await users.updateUser(currentUser.id, {
            theme_color: theme,
          })
          console.log('Тема обновлена в БД:', theme)
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
  }, [theme, telegramUser?.id, users, isUpdating])

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
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
              {theme === 'dark' ? 'Темная' : 'Светлая'}
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

