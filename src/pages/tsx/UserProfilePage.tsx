import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'
import { GiftIcon } from '../../utils/tsx/GiftIcon'
import type { User } from '../../utils/api/users'

// Упрощенные типы
interface Wishlist {
  id: number
  name: string
}

interface Wish {
  id: number
  title: string
  price?: number
  currency?: string
  image_url?: string
  comment?: string
  status: 'active' | 'reserved' | 'fulfilled'
}

// Компонент-обертка для плавной анимации сворачивания/разворачивания
interface WishlistContentWrapperProps {
  children: React.ReactNode
  isCollapsed: boolean
  wishlistId: number
}

function WishlistContentWrapper({ children, isCollapsed }: WishlistContentWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current && wrapperRef.current) {
      if (!isCollapsed) {
        const height = contentRef.current.scrollHeight
        wrapperRef.current.style.maxHeight = `${height}px`
      } else {
        wrapperRef.current.style.maxHeight = '0px'
      }
    }
  }, [isCollapsed])

  useEffect(() => {
    if (!contentRef.current || !wrapperRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      if (wrapperRef.current && !isCollapsed) {
        const height = contentRef.current?.scrollHeight || 0
        wrapperRef.current.style.maxHeight = `${height}px`
      }
    })

    resizeObserver.observe(contentRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isCollapsed])

  return (
    <div 
      ref={wrapperRef}
      className="wishes-list-wrapper"
      style={{
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: isCollapsed ? '0px' : 'none'
      }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  )
}

export function UserProfilePage() {
  const { telegramId } = useParams<{ telegramId: string }>()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const wishesRepo = apiContext?.wishes
  const usersRepo = apiContext?.users
  const navigate = useNavigate()

  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [wishesByWishlist, setWishesByWishlist] = useState<Record<number, Wish[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedWishlists, setCollapsedWishlists] = useState<Set<number>>(new Set())

  // Загружаем данные пользователя по telegram_id
  useEffect(() => {
    if (!telegramId || !usersRepo) {
      setIsLoading(false)
      return
    }

    const loadUserData = async () => {
      try {
        const telegramIdNum = parseInt(telegramId, 10)
        if (isNaN(telegramIdNum)) {
          setError('Некорректный ID пользователя')
          setIsLoading(false)
          return
        }

        const userData = await usersRepo.getUserByTelegramId(telegramIdNum)
        setViewedUser(userData)
      } catch (err) {
        console.error('Ошибка загрузки данных пользователя:', err)
        setError('Пользователь не найден')
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [telegramId, usersRepo])

  // Загружаем вишлисты и желания пользователя
  useEffect(() => {
    if (!telegramId || !viewedUser || !wishlistsRepo || !wishesRepo) {
      if (viewedUser === null && !isLoading) {
        // Пользователь не найден, не загружаем данные
        return
      }
      if (!viewedUser) {
        return
      }
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!viewedUser) return

        // Загружаем вишлисты пользователя по telegram_id
        let loadedWishlists: Wishlist[] = []
        try {
          const response = await wishlistsRepo.getWishlistsByTelegramId(viewedUser.telegram_id)
          if (Array.isArray(response)) {
            loadedWishlists = response.map((wl: any) => ({
              id: Number(wl.id) || 0,
              name: String(wl.name || ''),
            }))
          }
        } catch (err: any) {
          loadedWishlists = []
        }
        setWishlists(loadedWishlists)
        setCollapsedWishlists(new Set(loadedWishlists.map(wl => wl.id)))

        // Загружаем желания для каждого вишлиста
        const wishesMap: Record<number, Wish[]> = {}
        
        for (const wishlist of loadedWishlists) {
          try {
            const wishesResponse = await wishesRepo.getWishesByWishlistId(wishlist.id)
            
            if (Array.isArray(wishesResponse)) {
              const processedWishes: Wish[] = []
              for (const w of wishesResponse) {
                try {
                  const processed: Wish = {
                    id: Number(w.id) || 0,
                    title: String(w.title || 'Без названия'),
                    price: w.price !== null && w.price !== undefined 
                      ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price))
                      : undefined,
                    currency: w.currency ? String(w.currency) : undefined,
                    image_url: w.image_url ? String(w.image_url) : undefined,
                    comment: w.comment ? String(w.comment) : undefined,
                    status: (w.status === 'reserved' || w.status === 'fulfilled') ? w.status : 'active',
                  }
                  processedWishes.push(processed)
                } catch (err) {
                  // Пропускаем некорректные желания
                }
              }
              
              wishesMap[wishlist.id] = processedWishes
            } else {
              wishesMap[wishlist.id] = []
            }
          } catch (err: any) {
            wishesMap[wishlist.id] = []
          }
        }
        setWishesByWishlist(wishesMap)
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Неизвестная ошибка'
        setError(errorMessage)
        setWishlists([])
        setWishesByWishlist({})
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadData()
  }, [telegramId, viewedUser, wishlistsRepo, wishesRepo])

  // Обработчик сворачивания/разворачивания вишлиста
  const toggleWishlist = (wishlistId: number) => {
    setCollapsedWishlists(prev => {
      const newSet = new Set(prev)
      if (newSet.has(wishlistId)) {
        newSet.delete(wishlistId)
      } else {
        newSet.add(wishlistId)
      }
      return newSet
    })
  }

  const formatPrice = (price?: number | string, currency?: string) => {
    if (!price) return 'Цена не указана'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Цена не указана'
    return `${numPrice.toLocaleString('ru-RU')} ${currency || '₽'}`
  }

  if (isLoading && !viewedUser) {
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

  if (error && !viewedUser) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>{error}</p>
            <button 
              className="btn-retry" 
              onClick={() => navigate('/friends')}
            >
              Вернуться к друзьям
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!viewedUser) {
    return null
  }

  const userPhotoUrl = undefined // TODO: добавить photo_url если будет нужно

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <section className="user-profile-section">
          <div className="user-profile-top">
            <div className="user-avatar-container">
              {userPhotoUrl ? (
                <img 
                  src={userPhotoUrl} 
                  alt={`${viewedUser.first_name} ${viewedUser.last_name || ''}`.trim()}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {viewedUser.first_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">
                {viewedUser.first_name} {viewedUser.last_name || ''}
              </h2>
              {viewedUser.username && (
                <p className="user-username">@{viewedUser.username}</p>
              )}
            </div>
          </div>
          
          {/* Блок статистики подарков */}
          {(viewedUser.gifts_given || viewedUser.gifts_received) && (
            <div className="gifts-stats-section">
              <div className="gifts-stat-item">
                <div className="gifts-stat-value">{viewedUser.gifts_given || 0}</div>
                <div className="gifts-stat-label">Подарено</div>
              </div>
              <div className="gifts-stat-divider"></div>
              <div className="gifts-stat-item">
                <div className="gifts-stat-value">{viewedUser.gifts_received || 0}</div>
                <div className="gifts-stat-label">Получено</div>
              </div>
            </div>
          )}
        </section>

        <section className="wishes-list-section">
          <h3 className="wishes-list-title">Вишлисты</h3>
          
          {isLoading ? (
            <div className="wishes-loading">
              <p>Загрузка...</p>
            </div>
          ) : error ? (
            <div className="wishes-error">
              <p>Ошибка: {error}</p>
            </div>
          ) : wishlists.length === 0 ? (
            <div className="wishes-empty">
              <p>У пользователя пока нет вишлистов</p>
            </div>
          ) : (
            <>
              {wishlists.map((wishlist) => {
                try {
                  if (!wishlist || !wishlist.id) return null
                  const wishes = wishesByWishlist[wishlist.id] || []
                  const isCollapsed = collapsedWishlists.has(wishlist.id)

                  return (
                    <div key={wishlist.id} className="wishlist-group">
                      <h4 
                        className={`wishlist-name ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={() => toggleWishlist(wishlist.id)}
                      >
                        <span className="wishlist-name-text">{wishlist.name || 'Без названия'}</span>
                        <span className={`wishlist-toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                      </h4>
                      <WishlistContentWrapper 
                        isCollapsed={isCollapsed}
                        wishlistId={wishlist.id}
                      >
                        {wishes.length === 0 ? (
                          <div className="wishes-empty">
                            <p>В этом вишлисте пока нет желаний</p>
                          </div>
                        ) : (
                          <>
                            <div className="wishes-list">
                              {wishes.map((wish) => {
                                if (!wish || !wish.id) return null
                                return (
                                  <div key={wish.id} className="wish-item">
                                    <div className="wish-image-container">
                                      {wish.image_url ? (
                                        <img 
                                          src={wish.image_url} 
                                          alt={wish.title}
                                          className="wish-image"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                          }}
                                        />
                                      ) : (
                                        <div className="wish-image-placeholder">
                                          <GiftIcon className="wish-image-placeholder-icon" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="wish-details">
                                      <h4 className="wish-title">{wish.title}</h4>
                                      {wish.comment && (
                                        <p className="wish-description">{wish.comment}</p>
                                      )}
                                      {wish.price && (
                                        <p className="wish-price">{formatPrice(wish.price, wish.currency)}</p>
                                      )}
                                      {wish.status === 'reserved' && (
                                        <p className="wish-status wish-status-reserved">Зарезервировано</p>
                                      )}
                                      {wish.status === 'fulfilled' && (
                                        <p className="wish-status wish-status-fulfilled">Исполнено</p>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </WishlistContentWrapper>
                    </div>
                  )
                } catch (err) {
                  console.error('Ошибка при рендеринге вишлиста:', err, wishlist)
                  return null
                }
              })}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

