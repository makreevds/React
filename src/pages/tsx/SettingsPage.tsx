import '../css/SettingsPage.css'
import { useTheme } from '../../contexts/ThemeContext'

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="settings-page">
      <h1>Настройки</h1>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Темная тема</span>
            <span className="setting-description">
              {theme === 'dark' ? 'Включена' : 'Выключена'}
            </span>
          </div>
          <button 
            className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`}
            onClick={toggleTheme}
            aria-label="Переключить тему"
          >
            <span className="theme-toggle-slider"></span>
          </button>
        </div>
      </div>
    </div>
  );
}

