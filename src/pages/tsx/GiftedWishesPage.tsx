import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'
import { GiftIcon } from '../../utils/tsx/GiftIcon'
import type { Wish } from '../../utils/api/wishes'
import type { User } from '../../utils/api/users'

// Компонент меню для желания (три точки)
interface WishMenuProps {
  status: 'active' | 'reserved' | 'fulfilled'
  isOwnWishlist: boolean
  onCopyToMe?: () => void
}

function WishMenu({ isOwnWishlist, onCopyToMe }: WishMenuProps) {
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
        onClick={() => setIsOpen(!isOpen)}
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
          {!isOwnWishlist && onCopyToMe && (
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

export function GiftedWishesPage() {
  const { user } = useTelegramWebApp()
  const { webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishesRepo = apiContext?.wishes
  const usersRepo = apiContext?.users
  const navigate = useNavigate()

  interface WishWithOwner extends Wish {
    owner_telegram_id?: number
  }

  const [wishes, setWishes] = useState<WishWithOwner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Загружаем текущего пользователя
  useEffect(() => {
    if (!user?.id || !usersRepo) return

    const loadCurrentUser = async () => {
      try {
        const userData = await usersRepo.getUserByTelegramId(user.id)
        setCurrentUser(userData)
      } catch (e) {
        console.error('Ошибка загрузки текущего пользователя для GiftedWishesPage:', e)
      }
    }

    loadCurrentUser()
  }, [user?.id, usersRepo])

  // Telegram BackButton
  useEffect(() => {
    if (!webApp?.BackButton) return
    const backButton = webApp.BackButton
    const handleBack = () => {
      navigate(-1)
    }
    backButton.show()
    backButton.onClick(handleBack)
    return () => {
      backButton.offClick(handleBack)
      backButton.hide()
    }
  }, [webApp, navigate])

  // Загружаем подаренные подарки
  useEffect(() => {
    if (!currentUser?.id || !wishesRepo) {
      setIsLoading(false)
      return
    }

    const loadGiftedWishes = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const giftedWishes = await wishesRepo.getGiftedWishesByUserId(currentUser.id)
        
        // Фильтруем только исполненные подарки, которые были подарены именно этим пользователем
        const filteredWishes = giftedWishes.filter((w: any) => {
          const status = w.status === 'fulfilled'
          const giftedById = w.gifted_by_id ? Number(w.gifted_by_id) : undefined
          const giftedByMe = giftedById === currentUser.id
          const hasValidData = w.wishlist && w.user
          return status && giftedByMe && hasValidData
        })
        
        // Обрабатываем подарки
        const processedWishes: WishWithOwner[] = filteredWishes.map((w: any) => ({
          id: Number(w.id) || 0,
          title: String(w.title || 'Без названия'),
          price: w.price !== null && w.price !== undefined 
            ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price))
            : undefined,
          currency: w.currency ? String(w.currency) : undefined,
          image_url: w.image_url ? String(w.image_url) : undefined,
          comment: w.comment ? String(w.comment) : undefined,
          link: w.link ? String(w.link) : undefined,
          status: 'fulfilled' as const, // Всегда 'fulfilled' для этой страницы
          reserved_by_id: w.reserved_by_id ? Number(w.reserved_by_id) : undefined,
          gifted_by_id: w.gifted_by_id ? Number(w.gifted_by_id) : undefined,
          wishlist_id: w.wishlist_id ? Number(w.wishlist_id) : (w.wishlist ? Number(w.wishlist) : 0),
          user_id: w.user_id ? Number(w.user_id) : (w.user ? Number(w.user) : 0),
          wishlist: Number(w.wishlist) || 0,
          user: Number(w.user) || 0,
          is_fulfilled: true,
          created_at: w.created_at || '',
          updated_at: w.updated_at || '',
          order: w.order || 0,
          owner_telegram_id: w.user_telegram_id ? Number(w.user_telegram_id) : undefined,
        }))
        
        setWishes(processedWishes)
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Не удалось загрузить подаренные подарки'
        setError(errorMessage)
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadGiftedWishes()
  }, [currentUser?.id, wishesRepo])

  const handleCopyToMe = (wish: WishWithOwner) => {
    if (!wish) return
    navigate(
      `/wishes/copy-wish?title=${encodeURIComponent(wish.title || '')}` +
        `&comment=${encodeURIComponent(wish.comment || '')}` +
        (wish.link ? `&link=${encodeURIComponent(wish.link)}` : '') +
        (wish.image_url ? `&image_url=${encodeURIComponent(wish.image_url)}` : '') +
        (wish.price ? `&price=${encodeURIComponent(String(wish.price))}` : '') +
        (wish.currency ? `&currency=${encodeURIComponent(wish.currency)}` : ''),
    )
  }

  const formatPrice = (price?: number | string, currency?: string) => {
    if (!price) return 'Цена не указана'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Цена не указана'
    return `${numPrice.toLocaleString('ru-RU')} ${currency || '₽'}`
  }

  if (!user) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-empty">
            <p>Ожидание загрузки данных пользователя...</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-loading">
            <p>Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>{error}</p>
            <button 
              className="btn-retry" 
              onClick={() => navigate(-1)}
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <section className="wishes-list-section">
          <div className='wishes-container'>
            <h3 className="wishes-list-title">Подаренные подарки</h3>
            <p className="wishes-list-comment">Подарки, которые вы подарили друзьям</p>
          </div>
          {wishes.length === 0 ? (
            <div className="wishes-empty">
              <p>Вы еще не подарили ни одного подарка</p>
            </div>
          ) : (
            <div className="wishes-list">
              {wishes.map((wish) => {
                if (!wish || !wish.id) return null
                
                const handleOpenWish = () => {
                  if (wish.owner_telegram_id && wish.id) {
                    navigate(`/user/${wish.owner_telegram_id}/wish/${wish.id}`)
                  } else if (wish.id && wish.wishlist_id) {
                    navigate(`/wishes/wishlist/${wish.wishlist_id}`)
                  }
                }

                return (
                  <div 
                    key={wish.id} 
                    className="wish-item wish-item-fulfilled wish-item-clickable"
                    role="button"
                    onClick={handleOpenWish}
                  >
                    <div className="wish-image-container">
                      {wish.image_url ? (
                        <img 
                          src={wish.image_url} 
                          alt={wish.title || 'Желание'}
                          className="wish-image"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const container = e.currentTarget.parentElement
                            if (container) {
                              const placeholder = container.querySelector('.wish-image-placeholder')
                              if (placeholder) {
                                placeholder.classList.add('show')
                              }
                            }
                          }}
                        />
                      ) : null}
                      <div className={`wish-image-placeholder ${!wish.image_url ? 'show' : ''}`}>
                        <GiftIcon className="gift-icon" />
                      </div>
                    </div>
                    <div className="wish-content">
                      <h4 className="wish-title">{wish.title || 'Без названия'}</h4>
                      {wish.comment && (
                        <p className="wish-description">{wish.comment}</p>
                      )}
                      <p className="wish-price">{formatPrice(wish.price, wish.currency)}</p>
                      {wish.status === 'fulfilled' && (
                        <span className="wish-status wish-status-fulfilled">Подарено</span>
                      )}
                    </div>
                    <div className="wish-actions" onClick={(e) => e.stopPropagation()}>
                      <WishMenu
                        status={wish.status}
                        isOwnWishlist={false}
                        onCopyToMe={() => handleCopyToMe(wish)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

