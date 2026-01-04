import '../css/SettingsPage.css'
import { useTheme } from '../../contexts/ThemeContext'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="page-container">
      <h1>Настройки</h1>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Тема</span>
            {/* <span className="setting-description">
              {theme === 'dark' ? 'Темная' : theme === 'light' ? 'Светлая' : 'Системная'}
            </span> */}
          </div>
          <div className="theme-segmented-control">
            <button
              className={`theme-segment ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              aria-label="Светлая тема"
              title="Светлая тема"
            >
              ☀️
            </button>
            <button
              className={`theme-segment ${theme === null ? 'active' : ''}`}
              onClick={() => setTheme(null)}
              aria-label="Системная тема"
              title="Системная тема"
            >
              🔄
            </button>
            <button
              className={`theme-segment ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              aria-label="Темная тема"
              title="Темная тема"
            >
              🌙
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

