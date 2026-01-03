import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme | null // null означает системная тема
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'app-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Определяем начальную тему из localStorage или null (системная тема)
  const getInitialTheme = (): Theme | null => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
    // Если нет сохраненной темы, возвращаем null - будет использоваться системная
    return null
  }

  const [theme, setTheme] = useState<Theme | null>(getInitialTheme)

  // Применяем тему к документу
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    // Удаляем все классы темы
    root.classList.remove('theme-dark', 'theme-light')
    body.classList.remove('theme-dark', 'theme-light')
    
    if (theme === 'dark') {
      root.classList.add('theme-dark')
      body.classList.add('theme-dark')
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    } else if (theme === 'light') {
      root.classList.add('theme-light')
      body.classList.add('theme-light')
      localStorage.setItem(THEME_STORAGE_KEY, 'light')
    } else {
      // Если theme === null, удаляем из localStorage - будет использоваться системная тема
      localStorage.removeItem(THEME_STORAGE_KEY)
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
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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

