import { NavLink } from 'react-router-dom'
import '../css/BottomNavigation.css'

export function BottomNavigation() {
  return (
    <nav className="bottom-navigation">
      <NavLink 
        to="/wishes" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="nav-icon">🎁</span>
        <span className="nav-label">Желания</span>
      </NavLink>
      
      <NavLink 
        to="/friends" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="nav-icon">👥</span>
        <span className="nav-label">Друзья</span>
      </NavLink>
      
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <span className="nav-icon">⚙️</span>
        <span className="nav-label">Настройки</span>
      </NavLink>
    </nav>
  );
}

