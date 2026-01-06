import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
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
  reserved_by_id?: number
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
        // Разворачиваем: устанавливаем реальную высоту
        const height = contentRef.current.scrollHeight
        wrapperRef.current.style.maxHeight = `${height}px`
      } else {
        // Сворачиваем: устанавливаем 0
        wrapperRef.current.style.maxHeight = '0px'
      }
    }
  }, [isCollapsed])

  // Обновляем высоту при изменении содержимого
  useEffect(() => {
    if (contentRef.current && wrapperRef.current && !isCollapsed) {
      const updateHeight = () => {
        if (wrapperRef.current && contentRef.current) {
          const height = contentRef.current.scrollHeight
          wrapperRef.current.style.maxHeight = `${height}px`
        }
      }
      
      // Используем ResizeObserver для отслеживания изменений размера
      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(contentRef.current)
      
      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [isCollapsed, children])

  return (
    <div 
      ref={wrapperRef}
      className="wishes-list-wrapper"
      style={{
        maxHeight: isCollapsed ? '0' : 'auto',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
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
  const { user: currentTelegramUser } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const wishesRepo = apiContext?.wishes
  const usersRepo = apiContext?.users
  const navigate = useNavigate()

  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
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
        console.log('Загружены данные пользователя:', userData)
        console.log('gifts_given:', userData.gifts_given, 'gifts_received:', userData.gifts_received)
        setViewedUser(userData)
      } catch (err) {
        console.error('Ошибка загрузки данных пользователя:', err)
        setError('Пользователь не найден')
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [telegramId, usersRepo])

  // Загружаем данные текущего пользователя (кто смотрит профиль)
  useEffect(() => {
    if (!currentTelegramUser?.id || !usersRepo) {
      return
    }

    const loadCurrentUser = async () => {
      try {
        const userData = await usersRepo.getUserByTelegramId(currentTelegramUser.id)
        setCurrentUser(userData)
      } catch (err) {
        console.error('Ошибка загрузки данных текущего пользователя:', err)
      }
    }

    loadCurrentUser()
  }, [currentTelegramUser?.id, usersRepo])

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
                    reserved_by_id: w.reserved_by_id ? Number(w.reserved_by_id) : undefined,
                  }
                  console.log('Обработано желание:', processed.id, 'image_url:', processed.image_url)
                  processedWishes.push(processed)
                } catch (err) {
                  console.error('Ошибка обработки желания:', err, w)
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

  // Обработчик бронирования/снятия брони подарка
  const handleToggleReserve = async (wishId: number, currentStatus: string, reservedById?: number) => {
    if (!wishesRepo || !currentUser) return

    // Проверяем, что снять бронь может только тот, кто зарезервировал
    if (currentStatus === 'reserved' && reservedById !== currentUser.id) {
      alert('Вы можете снять бронь только с подарков, которые вы зарезервировали')
      return
    }

    try {
      const newStatus = currentStatus === 'reserved' ? 'active' : 'reserved'
      const updateData: any = { status: newStatus }
      
      if (newStatus === 'reserved') {
        // При бронировании устанавливаем reserved_by (ID пользователя)
        updateData.reserved_by = currentUser.id
      } else {
        // При снятии брони очищаем reserved_by
        updateData.reserved_by = null
      }
      
      await wishesRepo.updateWish(wishId, updateData)
      
      // Обновляем состояние локально
      setWishesByWishlist(prev => {
        const updated = { ...prev }
        for (const wishlistId in updated) {
          updated[Number(wishlistId)] = updated[Number(wishlistId)].map(w => 
            w.id === wishId ? { 
              ...w, 
              status: newStatus as 'active' | 'reserved' | 'fulfilled',
              reserved_by_id: newStatus === 'reserved' ? currentUser.id : undefined
            } : w
          )
        }
        return updated
      })
    } catch (err) {
      console.error('Ошибка при изменении статуса подарка:', err)
      alert('Не удалось изменить статус подарка')
    }
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

  // Используем photo_url из данных пользователя, если оно есть
  const userPhotoUrl = viewedUser.photo_url || undefined

  return (
    <div className="page-container wishes-page user-profile-page">
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
                                      {wish.status === 'reserved' && (
                                        <p className="wish-status wish-status-reserved">Зарезервировано</p>
                                      )}
                                      {wish.status === 'fulfilled' && (
                                        <p className="wish-status wish-status-fulfilled">Исполнено</p>
                                      )}
                                    </div>
                                    <div className="wish-actions">
                                      {wish.status === 'fulfilled' ? (
                                        // Если подарок исполнен - ничего не показываем
                                        null
                                      ) : wish.status === 'reserved' ? (
                                        // Если подарок зарезервирован
                                        currentUser && wish.reserved_by_id === currentUser.id ? (
                                          // И зарезервирован текущим пользователем - показываем кнопку "Снять бронь"
                                          <button
                                            className="btn-reserve btn-reserve-active"
                                            onClick={() => handleToggleReserve(wish.id, wish.status, wish.reserved_by_id)}
                                          >
                                            Снять бронь
                                          </button>
                                        ) : (
                                          // Иначе просто показываем статус
                                          <span className="wish-status wish-status-reserved">Зарезервировано</span>
                                        )
                                      ) : (
                                        // Если подарок не зарезервирован - показываем кнопку "Забронировать"
                                        <button
                                          className="btn-reserve"
                                          onClick={() => handleToggleReserve(wish.id, wish.status, wish.reserved_by_id)}
                                        >
                                          Забронировать
                                        </button>
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

