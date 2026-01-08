import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'
import { GiftIcon } from '../../utils/tsx/GiftIcon'


// Компонент меню для желания (три точки)
interface WishMenuProps {
  status: 'active' | 'reserved' | 'fulfilled'
  isOwnWishlist: boolean
  onEdit?: () => void
  onDelete: () => void
  onMarkAsReceived?: () => void
}

function WishMenu({ status, isOwnWishlist, onEdit, onDelete, onMarkAsReceived }: WishMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdown = dropdownRef.current
      
      dropdown.style.top = `${buttonRect.bottom + 4}px`
      dropdown.style.right = `${window.innerWidth - buttonRect.right}px`
    }
  }, [isOpen])

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
            e.stopPropagation()
          }}
        >
          {status === 'active' && isOwnWishlist && onEdit && (
            <button
              className="wish-menu-item"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onEdit()
              }}
            >
              Редактировать
            </button>
          )}
          {status === 'reserved' && isOwnWishlist && onMarkAsReceived && (
            <button
              className="wish-menu-item"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(false)
                onMarkAsReceived()
              }}
            >
              Подарок получен
            </button>
          )}
          <button
            className="wish-menu-item wish-menu-item-danger"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsOpen(false)
              onDelete()
            }}
          >
            Удалить
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

interface Wishlist {
  id: number
  name: string
  description?: string
}

interface Wish {
  id: number
  title: string
  price?: number
  currency?: string
  image_url?: string
  comment?: string
  status: 'active' | 'reserved' | 'fulfilled'
  reserved_by_id?: number
  gifted_by_id?: number
}

export function WishlistPage() {
  const { wishlistId, telegramId } = useParams<{ wishlistId: string; telegramId?: string }>()
  const { user } = useTelegramWebApp()
  const { webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const wishesRepo = apiContext?.wishes
  const navigate = useNavigate()

  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [wishes, setWishes] = useState<Wish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwnWishlist, setIsOwnWishlist] = useState(true)

  const wishlistIdNumber = wishlistId ? Number(wishlistId) : null
  const telegramIdNumber = telegramId ? Number(telegramId) : null

  // Telegram BackButton
  useEffect(() => {
    if (!webApp?.BackButton) return
    const backButton = webApp.BackButton
    const handleBack = () => {
      if (telegramIdNumber) {
        navigate(`/user/${telegramIdNumber}`)
      } else {
        navigate('/wishes')
      }
    }
    backButton.show()
    backButton.onClick(handleBack)
    return () => {
      backButton.offClick(handleBack)
      backButton.hide()
    }
  }, [webApp, navigate, telegramIdNumber])

  // Загружаем данные вишлиста и подарков
  useEffect(() => {
    if (!wishlistIdNumber || !wishlistsRepo || !wishesRepo) {
      setIsLoading(false)
      setError('Не удалось загрузить вишлист')
      return
    }

    // Определяем, чей вишлист
    const targetTelegramId = telegramIdNumber || user?.id
    if (!targetTelegramId) {
      setIsLoading(false)
      setError('Не удалось загрузить вишлист')
      return
    }

    const isOwn = !telegramIdNumber || (user?.id === telegramIdNumber)
    setIsOwnWishlist(isOwn)

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Загружаем вишлист
        try {
          const wishlistsResponse = await wishlistsRepo.getWishlistsByTelegramId(targetTelegramId)
          if (Array.isArray(wishlistsResponse)) {
            const foundWishlist = wishlistsResponse.find((wl: any) => Number(wl.id) === wishlistIdNumber)
            if (foundWishlist) {
              setWishlist({
                id: Number(foundWishlist.id) || 0,
                name: String(foundWishlist.name || ''),
                description: foundWishlist.description ? String(foundWishlist.description) : undefined,
              })
            } else {
              setError('Вишлист не найден')
              return
            }
          } else {
            setError('Вишлист не найден')
            return
          }
        } catch (err: any) {
          setError('Не удалось загрузить вишлист')
          return
        }

        // Загружаем подарки
        try {
          const wishesResponse = await wishesRepo.getWishesByWishlistId(wishlistIdNumber)
          
          if (Array.isArray(wishesResponse)) {
            const processedWishes: Wish[] = wishesResponse.map((w: any) => ({
              id: Number(w.id) || 0,
              title: String(w.title || 'Без названия'),
              price: w.price !== null && w.price !== undefined 
                ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price))
                : undefined,
              currency: w.currency ? String(w.currency) : undefined,
              image_url: w.image_url ? String(w.image_url) : undefined,
              comment: w.comment ? String(w.comment) : undefined,
              status: (w.status === 'reserved' || w.status === 'fulfilled') ? w.status : 'active',
              reserved_by_id: w.reserved_by_id ? Number(w.reserved_by_id) : undefined,
              gifted_by_id: w.gifted_by_id ? Number(w.gifted_by_id) : undefined,
            }))
            setWishes(processedWishes)
          } else {
            setWishes([])
          }
        } catch (err: any) {
          setWishes([])
        }
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Неизвестная ошибка'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [wishlistIdNumber, telegramIdNumber, user?.id, wishlistsRepo, wishesRepo])

  const handleEdit = (wishId: number) => {
    navigate(`/wishes/edit-wish?wishId=${wishId}&wishlistId=${wishlistIdNumber}`)
  }

  const handleDelete = async (wishId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это желание?')) {
      return
    }

    try {
      if (!wishesRepo) {
        return
      }
      await wishesRepo.deleteWish(wishId)
      setWishes(prev => prev.filter(w => w.id !== wishId))
    } catch (err) {
      console.error('Ошибка при удалении желания:', err)
      alert('Не удалось удалить желание')
    }
  }

  const handleMarkAsReceived = async (wishId: number, reservedById?: number) => {
    if (!confirm('Вы уверены, что получили подарок?')) {
      return
    }

    try {
      if (!wishesRepo) {
        return
      }
      
      await wishesRepo.fulfillWish(wishId, reservedById)
      
      setWishes(prev => prev.map(w => 
        w.id === wishId 
          ? { ...w, status: 'fulfilled' as const, gifted_by_id: reservedById }
          : w
      ))
    } catch (err) {
      console.error('Ошибка при отметке подарка как полученного:', err)
      alert('Не удалось отметить подарок как полученный')
    }
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

  if (error || !wishlist) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>{error || 'Вишлист не найден'}</p>
            <button 
              className="btn-retry" 
              onClick={() => {
                if (telegramIdNumber) {
                  navigate(`/user/${telegramIdNumber}`)
                } else {
                  navigate('/wishes')
                }
              }}
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
            <h3 className="wishes-list-title">{wishlist.name || 'Без названия'}</h3>
            {wishlist.description && (
              <h4 className="wishes-list-comment">{wishlist.description}</h4>
            )}
          </div>
          {wishes.length === 0 ? (
            <>
              <div className="wishes-empty">
                <p>В этом вишлисте пока нет желаний</p>
              </div>
              {isOwnWishlist && (
                <>
                  <button 
                    className="btn-add-wish"
                    onClick={() => navigate(`/wishes/add-wish?wishlistId=${wishlistIdNumber}`)}
                  >
                    + Добавить подарок
                  </button>
                  <button 
                    className="btn-edit-wishlist"
                    onClick={() => navigate(`/wishes/edit-wishlist?wishlistId=${wishlistIdNumber}`)}
                  >
                    Редактировать вишлист
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="wishes-list">
                {wishes.map((wish) => {
                  if (!wish || !wish.id) return null
                  return (
                    <div 
                      key={wish.id} 
                      className={`wish-item wish-item-${wish.status}`}
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
                        {wish.status === 'active' && (
                          <span className="wish-status wish-status-active">Активен</span>
                        )}
                        {wish.status === 'reserved' && (
                          <span className="wish-status wish-status-reserved">Забронирован</span>
                        )}
                        {wish.status === 'fulfilled' && (
                          <span className="wish-status wish-status-fulfilled">Исполнен</span>
                        )}
                      </div>
                      <div className="wish-actions">
                        {isOwnWishlist ? (
                          <WishMenu
                            status={wish.status}
                            isOwnWishlist={isOwnWishlist}
                            onEdit={wish.status === 'active' ? () => handleEdit(wish.id) : undefined}
                            onDelete={() => handleDelete(wish.id)}
                            onMarkAsReceived={wish.status === 'reserved' ? () => handleMarkAsReceived(wish.id, wish.reserved_by_id) : undefined}
                          />
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
              {isOwnWishlist && (
                <>
                  <button 
                    className="btn-add-wish"
                    onClick={() => navigate(`/wishes/add-wish?wishlistId=${wishlistIdNumber}`)}
                  >
                    + Добавить подарок
                  </button>
                  <button 
                    className="btn-edit-wishlist"
                    onClick={() => navigate(`/wishes/edit-wishlist?wishlistId=${wishlistIdNumber}`)}
                  >
                    Редактировать вишлист
                  </button>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

