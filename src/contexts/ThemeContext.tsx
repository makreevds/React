import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'app-theme'

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: Theme // Начальная тема из БД или Telegram
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // Определяем начальную тему: сначала из пропсов, потом из localStorage, потом 'light' по умолчанию
  const getInitialTheme = (): Theme => {
    // Если передана начальная тема извне (из БД или Telegram), используем её
    if (initialTheme !== undefined) {
      return initialTheme
    }
    
    // Иначе проверяем localStorage
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      // Строгая проверка: только 'light' или 'dark' считаются валидными
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme as Theme
      }
    } catch (e) {
      // Если ошибка доступа к localStorage, игнорируем
      console.warn('Failed to read theme from localStorage:', e)
    }
    // Если нет сохраненной темы, возвращаем 'light' по умолчанию
    return 'light'
  }

  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const hasUserChangedTheme = useRef(false)
  
  // Обновляем тему только один раз при первой загрузке initialTheme из БД
  // Не перезаписываем, если пользователь уже изменил тему вручную
  useEffect(() => {
    if (!hasUserChangedTheme.current && initialTheme !== undefined && initialTheme !== theme) {
      setTheme(initialTheme)
    }
  }, [initialTheme, theme])
  
  // Обёртка для setTheme, чтобы отслеживать изменения пользователя
  const setThemeWithTracking = (newTheme: Theme) => {
    hasUserChangedTheme.current = true
    setTheme(newTheme)
  }

  // Применяем тему к документу
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    // Всегда сначала удаляем все классы темы
    root.classList.remove('theme-dark', 'theme-light')
    body.classList.remove('theme-dark', 'theme-light')
    
    if (theme === 'dark') {
      root.classList.add('theme-dark')
      body.classList.add('theme-dark')
    } else {
      root.classList.add('theme-light')
      body.classList.add('theme-light')
    }
    
    // Сохраняем тему в localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e)
    }
  }, [theme])

  const toggleTheme = () => {
    hasUserChangedTheme.current = true
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeWithTracking }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

