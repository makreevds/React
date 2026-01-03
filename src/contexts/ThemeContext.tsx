import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme | null // null означает системная тема
  toggleTheme: () => void
  setTheme: (theme: Theme | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'app-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Определяем начальную тему из localStorage или null (системная тема)
  const getInitialTheme = (): Theme | null => {
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
    // Если нет сохраненной темы или она невалидна, возвращаем null - будет использоваться системная
    return null
  }

  const [theme, setTheme] = useState<Theme | null>(getInitialTheme)

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
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e)
      }
    } else if (theme === 'light') {
      root.classList.add('theme-light')
      body.classList.add('theme-light')
      try {
        localStorage.setItem(THEME_STORAGE_KEY, 'light')
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e)
      }
    } else {
      // Если theme === null, удаляем из localStorage - будет использоваться системная тема
      // Классы темы уже удалены выше, так что ничего не нужно добавлять
      try {
        localStorage.removeItem(THEME_STORAGE_KEY)
      } catch (e) {
        console.warn('Failed to remove theme from localStorage:', e)
      }
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') {
        return 'dark'
      } else if (prev === 'dark') {
        return null // Переключаем на системную тему
      } else {
        // Если была системная тема, переключаем на светлую
        return 'light'
      }
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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

