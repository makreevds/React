import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
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

const IconFeed = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M4 4h16"/>
    <path d="M4 10h16"/>
    <path d="M4 16h10"/>
  </svg>
)

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z"/>
  </svg>
)

export function BottomNavigation() {
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const indicatorRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: string; width: string }>({ left: '0%', width: '0%' })

  // Определяем активный путь
  const getActivePath = () => {
    const path = location.pathname
    if (path === '/' || path.startsWith('/wishes')) return '/wishes'
    if (path.startsWith('/friends') || path.startsWith('/user/')) return '/friends'
    if (path.startsWith('/feed')) return '/feed'
    if (path.startsWith('/settings')) return '/settings'
    return '/wishes' // По умолчанию
  }

  const activePath = getActivePath()

  // Обновляем позицию индикатора
  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = ['/wishes', '/friends', '/feed', '/settings'].indexOf(activePath)
      if (activeIndex === -1 || !navRef.current) return

      const activeItem = itemRefs.current[activeIndex]
      if (!activeItem || !indicatorRef.current) return

      const navRect = navRef.current.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      // Вычисляем центр иконки для позиционирования круга
      const itemCenterX = itemRect.left - navRect.left + itemRect.width / 2
      const indicatorSize = 48 // Размер круга

      setIndicatorStyle({
        left: `${itemCenterX - indicatorSize / 2}px`,
        width: `${indicatorSize}px`,
      })
    }

    // Обновляем сразу и после небольшой задержки (для корректного расчета после рендера)
    updateIndicator()
    const timeoutId = setTimeout(updateIndicator, 50)
    
    // Также обновляем при изменении размера окна
    window.addEventListener('resize', updateIndicator)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activePath, location.pathname])

  return (
    <nav className="bottom-navigation" ref={navRef}>
      <div 
        ref={indicatorRef}
        className="nav-indicator"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
      <NavLink 
        to="/wishes" 
        className="nav-item"
        ref={(el) => { itemRefs.current[0] = el }}
      >
        <span className="nav-icon"><IconWishes /></span>
        <span className="nav-label">Желания</span>
      </NavLink>

      <NavLink 
        to="/friends" 
        className="nav-item"
        ref={(el) => { itemRefs.current[1] = el }}
      >
        <span className="nav-icon"><IconFriends /></span>
        <span className="nav-label">Друзья</span>
      </NavLink>

      <NavLink 
        to="/feed" 
        className="nav-item"
        ref={(el) => { itemRefs.current[2] = el }}
      >
        <span className="nav-icon"><IconFeed /></span>
        <span className="nav-label">Лента</span>
      </NavLink>

      <NavLink 
        to="/settings" 
        className="nav-item"
        ref={(el) => { itemRefs.current[3] = el }}
      >
        <span className="nav-icon"><IconSettings /></span>
        <span className="nav-label">Настройки</span>
      </NavLink>
    </nav>
  )
}
