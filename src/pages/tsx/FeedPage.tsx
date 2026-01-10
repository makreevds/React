import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import '../css/FeedPage.css'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'
import type { User } from '../../utils/api/users'
import type { Wish } from '../../utils/api/wishes'
import { GiftIcon } from '../../utils/tsx/GiftIcon'

interface FeedItem {
  wish: Wish
  user: User
  wishlistName?: string
}

// Компонент меню для желания (три точки)
interface WishMenuProps {
  status: 'active' | 'reserved' | 'fulfilled'
  reservedByCurrentUser?: boolean
  onReserve?: () => void
  onUnreserve?: () => void
  onCopyToMe?: () => void
}

function WishMenu({ status, reservedByCurrentUser, onReserve, onUnreserve, onCopyToMe }: WishMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  const updateDropdownPosition = useCallback(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdown = dropdownRef.current
      
      dropdown.style.top = `${buttonRect.bottom + 4}px`
      dropdown.style.right = `${window.innerWidth - buttonRect.right}px`
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return
      }
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [isOpen])

  useEffect(() => {
    updateDropdownPosition()
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      return
    }

    const handleScroll = () => {
      setIsClosing(true)
      
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
      
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false)
        setIsClosing(false)
      }, 150)
    }

    const handleResize = () => {
      updateDropdownPosition()
    }

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions)
      document.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', handleResize)
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [isOpen, updateDropdownPosition])

  return (
    <div className="wish-menu-container" ref={menuRef}>
      <button
        ref={buttonRef}
        className="wish-menu-btn"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        aria-label="Меню"
        title="Меню"
      >
        <span className="wish-menu-icon">⋯</span>
      </button>
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="wish-menu-dropdown wish-menu-dropdown-portal"
          onClick={(e) => {
            if (isClosing) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            e.stopPropagation()
          }}
          style={{
            pointerEvents: isClosing ? 'none' : 'auto',
            opacity: isClosing ? 0 : 1,
            transition: 'opacity 0.15s ease-out',
          }}
        >
          {status === 'active' && onReserve && (
            <button
              className="wish-menu-item"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onReserve()
              }}
            >
              Забронировать
            </button>
          )}
          {status === 'reserved' && reservedByCurrentUser && onUnreserve && (
            <button
              className="wish-menu-item"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onUnreserve()
              }}
            >
              Снять бронь
            </button>
          )}
          {onCopyToMe && (
            <button
              className="wish-menu-item"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onCopyToMe()
              }}
            >
              Скопировать себе
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export function FeedPage() {
  const { user: currentUser } = useTelegramWebApp()
  const apiContext = useApiContext()
  const usersRepo = apiContext?.users
  const wishesRepo = apiContext?.wishes
  const navigate = useNavigate()

  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDbUser, setCurrentDbUser] = useState<User | null>(null)

  // Загружаем подарки из подписок
  useEffect(() => {
    const loadFeed = async () => {
      if (!currentUser?.id || !usersRepo || !wishesRepo) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Получаем пользователя из БД по telegram_id
        const dbUser = await usersRepo.getUserByTelegramId(currentUser.id)
        setCurrentDbUser(dbUser)
        
        // Получаем список подписок
        const subscriptions = await usersRepo.getSubscriptions(dbUser.id)
        
        if (subscriptions.length === 0) {
          setFeedItems([])
          setIsLoading(false)
          return
        }

        // Для каждой подписки получаем все подарки
        const allFeedItems: FeedItem[] = []
        
        await Promise.all(
          subscriptions.map(async (subUser) => {
            try {
              const wishes = await wishesRepo.getWishesByTelegramId(subUser.telegram_id)
              
              // Для каждого подарка создаем FeedItem
              wishes.forEach((wish) => {
                allFeedItems.push({
                  wish,
                  user: subUser,
                  wishlistName: wish.wishlist_name,
                })
              })
            } catch (err) {
              console.error(`Ошибка при загрузке подарков для пользователя ${subUser.telegram_id}:`, err)
            }
          })
        )

        // Сортируем по дате создания (новые сначала)
        allFeedItems.sort((a, b) => {
          const dateA = new Date(a.wish.created_at).getTime()
          const dateB = new Date(b.wish.created_at).getTime()
          return dateB - dateA // Сортировка по убыванию (новые первые)
        })

        setFeedItems(allFeedItems)
      } catch (err: any) {
        console.error('Ошибка при загрузке ленты:', err)
        setError(err?.message || 'Не удалось загрузить ленту')
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadFeed()
  }, [currentUser?.id, usersRepo, wishesRepo])

  const formatPrice = (price?: number | string, currency?: string) => {
    if (!price) return null
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return null
    return `${numPrice.toLocaleString('ru-RU')} ${currency || '₽'}`
  }

  const getUserFullName = (user: User) => {
    const parts = [user.first_name]
    if (user.last_name) {
      parts.push(user.last_name)
    }
    return parts.join(' ')
  }

  // Форматируем дату на русском языке
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const dateToCheck = new Date(date)
    dateToCheck.setHours(0, 0, 0, 0)

    if (dateToCheck.getTime() === today.getTime()) {
      return 'Сегодня'
    } else if (dateToCheck.getTime() === yesterday.getTime()) {
      return 'Вчера'
    } else {
      const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
      const day = date.getDate()
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      const currentYear = today.getFullYear()
      
      if (year === currentYear) {
        return `${day} ${month}`
      } else {
        return `${day} ${month} ${year}`
      }
    }
  }

  // Группируем подарки по датам, пользователям и вишлистам
  const groupedFeedItems = feedItems.reduce((acc, item) => {
    // Получаем дату без времени для группировки
    const date = new Date(item.wish.created_at)
    date.setHours(0, 0, 0, 0)
    const dateKey = date.toISOString().split('T')[0] // Формат YYYY-MM-DD
    
    const userId = item.user.id
    const wishlistId = item.wish.wishlist_id || 0
    const wishlistName = item.wishlistName || 'Без названия'

    if (!acc[dateKey]) {
      acc[dateKey] = {}
    }
    if (!acc[dateKey][userId]) {
      acc[dateKey][userId] = {
        user: item.user,
        wishlists: {}
      }
    }
    if (!acc[dateKey][userId].wishlists[wishlistId]) {
      acc[dateKey][userId].wishlists[wishlistId] = {
        id: wishlistId,
        name: wishlistName,
        wishes: []
      }
    }
    acc[dateKey][userId].wishlists[wishlistId].wishes.push(item.wish)
    
    return acc
  }, {} as Record<string, Record<number, { user: User; wishlists: Record<number, { id: number; name: string; wishes: Wish[] }> }>>)

  const handleUserClick = (user: User) => {
    navigate(`/user/${user.telegram_id}`)
  }

  const handleWishlistClick = (wishlistId: number, user: User) => {
    if (wishlistId) {
      navigate(`/user/${user.telegram_id}/wishlist/${wishlistId}`)
    }
  }

  const handleWishClick = (wish: Wish, user: User) => {
    navigate(`/user/${user.telegram_id}/wish/${wish.id}`)
  }

  const handleReserve = async (wishId: number) => {
    if (!wishesRepo || !currentDbUser) return

    try {
      const updateData: any = {
        status: 'reserved',
        reserved_by: currentDbUser.id,
      }

      await wishesRepo.updateWish(wishId, updateData)
      
      setFeedItems(prev => prev.map(item => 
        item.wish.id === wishId 
          ? { ...item, wish: { ...item.wish, status: 'reserved' as const, reserved_by_id: currentDbUser.id } }
          : item
      ))
    } catch (err) {
      console.error('Ошибка при бронировании подарка:', err)
      alert('Не удалось забронировать подарок')
    }
  }

  const handleUnreserve = async (wishId: number) => {
    if (!wishesRepo || !currentDbUser) return

    try {
      const updateData: any = {
        status: 'active',
        reserved_by: null,
      }

      await wishesRepo.updateWish(wishId, updateData)
      
      setFeedItems(prev => prev.map(item => 
        item.wish.id === wishId 
          ? { ...item, wish: { ...item.wish, status: 'active' as const, reserved_by_id: undefined } }
          : item
      ))
    } catch (err) {
      console.error('Ошибка при снятии брони подарка:', err)
      alert('Не удалось снять бронь с подарка')
    }
  }

  const handleCopyToMe = (wish: Wish) => {
    if (!wish) return
    // Открываем страницу выбора вишлиста для копирования
    navigate(
      `/wishes/copy-wish?title=${encodeURIComponent(wish.title || '')}` +
        `&comment=${encodeURIComponent(wish.comment || '')}` +
        (wish.link ? `&link=${encodeURIComponent(wish.link)}` : '') +
        (wish.image_url ? `&image_url=${encodeURIComponent(wish.image_url)}` : '') +
        (wish.price ? `&price=${encodeURIComponent(String(wish.price))}` : '') +
        (wish.currency ? `&currency=${encodeURIComponent(wish.currency)}` : ''),
    )
  }

  if (!currentUser) {
    return (
      <div className="page-container feed-page">
        <div className="feed-main-content">
          <div className="feed-loading">
            <p>Ожидание загрузки данных пользователя...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container feed-page">
        <div className="feed-main-content">
          <div className="feed-loading">
            <p>Загрузка ленты...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container feed-page">
        <div className="feed-main-content">
          <div className="feed-error">
            <p>{error}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>
              Повторить
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (feedItems.length === 0) {
    return (
      <div className="page-container feed-page">
        <div className="feed-main-content">
          <div className="feed-empty">
            <p>В вашей ленте пока нет подарков</p>
            <p className="feed-empty-hint">Подпишитесь на пользователей, чтобы видеть их новые подарки</p>
          </div>
        </div>
      </div>
    )
  }

  // Получаем ключи дат в отсортированном порядке (новые сначала)
  const dateKeys = Object.keys(groupedFeedItems).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime()
  })

  return (
    <div className="page-container feed-page">
      <div className="feed-main-content">
        <div className="feed-list">
          {dateKeys.map((dateKey) => {
            const dateGroup = groupedFeedItems[dateKey]
            // Получаем первый подарок из первой группы для форматирования даты
            const firstUserGroup = Object.values(dateGroup)[0]
            const firstWishlist = firstUserGroup ? Object.values(firstUserGroup.wishlists)[0] : null
            const firstWish = firstWishlist && firstWishlist.wishes.length > 0 ? firstWishlist.wishes[0] : null
            const formattedDate = firstWish ? formatDate(firstWish.created_at) : dateKey

            return (
              <div key={dateKey} className="feed-date-group">
                <div className="feed-date-header">
                  <h3 className="feed-date-title">{formattedDate}</h3>
                </div>
                
                {Object.values(dateGroup).map((userGroup) => (
                  <div key={userGroup.user.id} className="feed-user-group">
                    <div 
                      className="feed-user-header"
                      onClick={() => handleUserClick(userGroup.user)}
                    >
                      <span className="feed-user-name">{getUserFullName(userGroup.user)}</span>
                    </div>
                    
                    {Object.values(userGroup.wishlists).map((wishlistGroup) => (
                      <div key={wishlistGroup.id} className="feed-wishlist-group">
                        <div 
                          className="feed-wishlist-header"
                          onClick={() => handleWishlistClick(wishlistGroup.id, userGroup.user)}
                        >
                          <span className="feed-wishlist-icon">📋</span>
                          <span className="feed-wishlist-name">{wishlistGroup.name}</span>
                        </div>
                        
                        <div className="feed-wishes-list">
                          {wishlistGroup.wishes.map((wish) => {
                            // Определяем, забронирован ли подарок текущим пользователем
                            const isReservedByMe = wish.status === 'reserved' && currentDbUser && wish.reserved_by_id === currentDbUser.id
                            
                            // Формируем классы для подарка в зависимости от статуса
                            let wishClasses = 'feed-item-wish'
                            if (wish.status === 'reserved') {
                              wishClasses += isReservedByMe ? ' feed-item-wish-reserved-by-me' : ' feed-item-wish-reserved'
                            } else if (wish.status === 'fulfilled') {
                              wishClasses += ' feed-item-wish-fulfilled'
                            }
                            
                            return (
                              <div key={wish.id} className={wishClasses}>
                                <div 
                                  className="feed-item-wish-content-wrapper"
                                  onClick={() => handleWishClick(wish, userGroup.user)}
                                >
                                  <div className="feed-item-wish-image-container">
                                    {wish.image_url ? (
                                      <img 
                                        src={wish.image_url} 
                                        alt={wish.title || 'Подарок'}
                                        className="feed-item-wish-image"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                          const container = e.currentTarget.parentElement
                                          if (container) {
                                            const placeholder = container.querySelector('.feed-item-wish-image-placeholder')
                                            if (placeholder) {
                                              placeholder.classList.add('show')
                                            }
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div className={`feed-item-wish-image-placeholder ${!wish.image_url ? 'show' : ''}`}>
                                      <GiftIcon className="gift-icon" />
                                    </div>
                                  </div>
                                  
                                  <div className="feed-item-wish-content">
                                    <h4 className="feed-item-wish-title">{wish.title || 'Без названия'}</h4>
                                    {wish.comment && (
                                      <p className="feed-item-wish-comment">{wish.comment}</p>
                                    )}
                                    {wish.price && (
                                      <p className="feed-item-wish-price">{formatPrice(wish.price, wish.currency)}</p>
                                    )}
                                    {wish.status === 'reserved' && (
                                      <span className={`feed-item-wish-status feed-item-wish-status-reserved ${isReservedByMe ? 'feed-item-wish-status-reserved-by-me' : ''}`}>
                                        {isReservedByMe ? 'Забронировано Вами' : 'Забронировано'}
                                      </span>
                                    )}
                                    {wish.status === 'fulfilled' && (
                                      <span className="feed-item-wish-status feed-item-wish-status-fulfilled">
                                        Подарено
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="feed-item-wish-actions" onClick={(e) => e.stopPropagation()}>
                                  <WishMenu
                                    status={wish.status}
                                    reservedByCurrentUser={isReservedByMe ? true : undefined}
                                    onReserve={wish.status === 'active' ? () => handleReserve(wish.id) : undefined}
                                    onUnreserve={wish.status === 'reserved' && isReservedByMe ? () => handleUnreserve(wish.id) : undefined}
                                    onCopyToMe={() => handleCopyToMe(wish)}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
