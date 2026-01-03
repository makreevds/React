import { NavLink } from 'react-router-dom'
import '../css/BottomNavigation.css'

const IconWishes = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
  </svg>
)

const IconFriends = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-1a6 6 0 0 1 12 0v1"/>
    <circle cx="17" cy="9" r="3"/>
    <path d="M21 21v-1a5 5 0 0 0-4-4"/>
  </svg>
)

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z"/>
  </svg>
)

export function BottomNavigation() {
  return (
    <nav className="bottom-navigation">
      <NavLink to="/wishes" className="nav-item">
        <span className="nav-icon"><IconWishes /></span>
        <span className="nav-label">Желания</span>
      </NavLink>

      <NavLink to="/friends" className="nav-item">
        <span className="nav-icon"><IconFriends /></span>
        <span className="nav-label">Друзья</span>
      </NavLink>

      <NavLink to="/settings" className="nav-item">
        <span className="nav-icon"><IconSettings /></span>
        <span className="nav-label">Настройки</span>
      </NavLink>
    </nav>
  )
}
