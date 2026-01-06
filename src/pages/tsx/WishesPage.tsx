import { useState, useEffect, useRef } from 'react'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'
import { GiftIcon } from '../../utils/tsx/GiftIcon'
import type { WishlistsRepository } from '../../utils/api/wishlists'
import type { WishesRepository } from '../../utils/api/wishes'

// Упрощенные типы для избежания проблем с импортом
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
  description?: string
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

// Модальное окно для добавления вишлиста
interface AddWishlistModalProps {
  user: { id: number } | null
  wishlistsRepo: WishlistsRepository | undefined
  onClose: () => void
  onSuccess: () => void
}

function AddWishlistModal({ user, wishlistsRepo, onClose, onSuccess }: AddWishlistModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !user || !wishlistsRepo) return

    setIsSubmitting(true)
    try {
      await wishlistsRepo.createWishlist({
        name: name.trim(),
        description: description.trim() || undefined,
        telegram_id: user.id,
      })
      onSuccess()
    } catch (err) {
      alert('Не удалось создать вишлист')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Добавить вишлист</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="wishlist-name">Название *</label>
            <input
              id="wishlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Например: День рождения"
            />
          </div>
          <div className="form-group">
            <label htmlFor="wishlist-description">Описание</label>
            <textarea
              id="wishlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание вишлиста (необязательно)"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Модальное окно для добавления подарка
interface AddWishModalProps {
  wishlistId: number
  wishesRepo: WishesRepository | undefined
  onClose: () => void
  onSuccess: () => void
}

function AddWishModal({ wishlistId, wishesRepo, onClose, onSuccess }: AddWishModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('₽')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !wishesRepo) return

    setIsSubmitting(true)
    try {
      await wishesRepo.createWish({
        wishlist: wishlistId,
        title: title.trim(),
        description: description.trim() || undefined,
        link: link.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency || '₽',
      })
      onSuccess()
    } catch (err) {
      alert('Не удалось добавить подарок')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Добавить подарок</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="wish-title">Название *</label>
            <input
              id="wish-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Название подарка"
            />
          </div>
          <div className="form-group">
            <label htmlFor="wish-description">Описание</label>
            <textarea
              id="wish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание подарка (необязательно)"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label htmlFor="wish-link">Ссылка</label>
            <input
              id="wish-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="wish-image">URL изображения (не обязательно)</label>
            <input
              id="wish-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wish-price">Цена</label>
              <input
                id="wish-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="wish-currency">Валюта</label>
              <select
                id="wish-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="₽">₽</option>
                <option value="$">$</option>
                <option value="€">€</option>
                <option value="¥">¥</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function WishesPage() {
  const { user, webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const wishesRepo = apiContext?.wishes

  const [showDeveloperData, setShowDeveloperData] = useState(false)
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [wishesByWishlist, setWishesByWishlist] = useState<Record<number, Wish[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedWishlists, setCollapsedWishlists] = useState<Set<number>>(new Set())
  const [userData, setUserData] = useState<{ gifts_given: number; gifts_received: number } | null>(null)
  const [showAddWishlistModal, setShowAddWishlistModal] = useState(false)
  const [showAddWishModal, setShowAddWishModal] = useState(false)
  const [selectedWishlistId, setSelectedWishlistId] = useState<number | null>(null)

  // Загружаем данные пользователя
  useEffect(() => {
    if (!user?.id || !apiContext?.users) {
      return
    }

    const loadUserData = async () => {
      try {
        const userDataResponse = await apiContext.users.getUserByTelegramId(user.id)
        setUserData({
          gifts_given: userDataResponse.gifts_given || 0,
          gifts_received: userDataResponse.gifts_received || 0,
        })
      } catch (err) {
        // Игнорируем ошибки загрузки данных пользователя
        setUserData({ gifts_given: 0, gifts_received: 0 })
      }
    }

    loadUserData()
  }, [user?.id, apiContext?.users])

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

  // Загружаем вишлисты и желания при монтировании компонента
  useEffect(() => {
    if (!user?.id || !wishlistsRepo || !wishesRepo) {
      setIsLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Загружаем вишлисты пользователя
        let loadedWishlists: Wishlist[] = []
        try {
          const response = await wishlistsRepo.getWishlistsByTelegramId(user.id)
          // Проверяем, что ответ - массив
          if (Array.isArray(response)) {
            loadedWishlists = response.map((wl: any) => ({
              id: Number(wl.id) || 0,
              name: String(wl.name || ''),
            }))
          }
        } catch (err: any) {
          // Если вишлистов нет (404), это нормально
          if (err?.code === 'NOT_FOUND' || err?.status === 404 || 
              (err?.message && (err.message.includes('404') || err.message.includes('NOT_FOUND')))) {
            loadedWishlists = []
          } else {
            // Для других ошибок тоже устанавливаем пустой массив
            loadedWishlists = []
          }
        }
        setWishlists(loadedWishlists)
        // По умолчанию все вишлисты свернуты
        setCollapsedWishlists(new Set(loadedWishlists.map(wl => wl.id)))

        // Загружаем желания для каждого вишлиста
        const wishesMap: Record<number, Wish[]> = {}
        
        for (const wishlist of loadedWishlists) {
          try {
            const wishesResponse = await wishesRepo.getWishesByWishlistId(wishlist.id)
            
            // Проверяем, что ответ - массив и обрабатываем каждый элемент
            if (Array.isArray(wishesResponse)) {
              // Обрабатываем каждое желание
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
                    description: w.description ? String(w.description) : undefined,
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
        // Устанавливаем пустые данные, чтобы компонент не упал
        setWishlists([])
        setWishesByWishlist({})
      } finally {
        // Небольшая задержка для плавного появления контента
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadData()
  }, [user?.id, wishlistsRepo, wishesRepo])

  const handleEdit = (_wishId: number) => {
    // TODO: Реализовать редактирование
  }

  const handleDelete = async (wishId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это желание?')) {
      return
    }

    try {
      if (!wishesRepo) return
      await wishesRepo.deleteWish(wishId)
      const updatedWishesByWishlist = { ...wishesByWishlist }
      for (const wishlistId in updatedWishesByWishlist) {
        updatedWishesByWishlist[Number(wishlistId)] = updatedWishesByWishlist[Number(wishlistId)].filter(
          w => w.id !== wishId
        )
      }
      setWishesByWishlist(updatedWishesByWishlist)
    } catch (err) {
      alert('Не удалось удалить желание')
    }
  }

  const formatPrice = (price?: number | string, currency?: string) => {
    if (!price) return 'Цена не указана'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Цена не указана'
    return `${numPrice.toLocaleString('ru-RU')} ${currency || '₽'}`
  }

  const userPhotoUrl = user?.photo_url || undefined
  
  // Безопасное получение всех желаний
  let allWishes: Wish[] = []
  try {
    allWishes = Object.values(wishesByWishlist).flat().filter(w => w && w.id)
  } catch (err) {
    allWishes = []
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

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <section className="user-profile-section">
          <div className="user-profile-top">
            <div className="user-avatar-container">
              {userPhotoUrl ? (
                <img 
                  src={userPhotoUrl} 
                  alt={`${user?.first_name} ${user?.last_name || ''}`.trim()}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {user?.first_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">
                {user?.first_name || ''} {user?.last_name || ''}
              </h2>
              {user?.username && (
                <p className="user-username">@{user.username}</p>
              )}
            </div>
          </div>
          
          {/* Блок статистики подарков */}
          {userData && (
            <div className="gifts-stats-section">
              <div className="gifts-stat-item">
                <div className="gifts-stat-value">{userData.gifts_given}</div>
                <div className="gifts-stat-label">Подарено</div>
              </div>
              <div className="gifts-stat-divider"></div>
              <div className="gifts-stat-item">
                <div className="gifts-stat-value">{userData.gifts_received}</div>
                <div className="gifts-stat-label">Получено</div>
              </div>
            </div>
          )}
        </section>

        <section className="wishes-list-section">
          <h3 className="wishes-list-title">Мои вишлисты</h3>
          
          {/* Кнопка добавления вишлиста */}
          <button 
            className="btn-add-wishlist"
            onClick={() => setShowAddWishlistModal(true)}
          >
            + Добавить вишлист
          </button>
          
          {isLoading ? (
            <div className="wishes-loading">
              <p>Загрузка...</p>
            </div>
          ) : error ? (
            <div className="wishes-error">
              <p>Ошибка: {error}</p>
              <button 
                className="btn-retry" 
                onClick={() => window.location.reload()}
              >
                Повторить
              </button>
            </div>
          ) : wishlists.length === 0 ? (
            <div className="wishes-empty">
              <p>У вас пока нет вишлистов</p>
              <button className="btn-add-wish">Создать вишлист</button>
            </div>
          ) : allWishes.length === 0 ? (
            <div className="wishes-empty">
              <p>У вас пока нет желаний</p>
              <button className="btn-add-wish">Добавить желание</button>
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
                      {/* Всегда показываем название вишлиста */}
                      <h4 
                        className={`wishlist-name ${isCollapsed ? 'collapsed' : ''}`}
                        onClick={() => toggleWishlist(wishlist.id)}
                      >
                        <span className="wishlist-name-text">{wishlist.name || 'Без названия'}</span>
                        <span className="wishlist-toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
                      </h4>
                      <WishlistContentWrapper 
                        isCollapsed={isCollapsed}
                        wishlistId={wishlist.id}
                      >
                        {wishes.length === 0 ? (
                          <>
                            <div className="wishes-empty">
                              <p>В этом вишлисте пока нет желаний</p>
                            </div>
                            <button 
                              className="btn-add-wish"
                              onClick={() => {
                                setSelectedWishlistId(wishlist.id)
                                setShowAddWishModal(true)
                              }}
                            >
                              + Добавить подарок
                            </button>
                          </>
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
                                {wish.description && (
                                  <p className="wish-description">{wish.description}</p>
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
                                <button
                                  className="wish-action-btn wish-edit-btn"
                                  onClick={() => handleEdit(wish.id)}
                                  aria-label="Редактировать"
                                  title="Редактировать"
                                >
                                  ✏️
                                </button>
                                <button
                                  className="wish-action-btn wish-delete-btn"
                                  onClick={() => handleDelete(wish.id)}
                                  aria-label="Удалить"
                                  title="Удалить"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          )
                          })}
                            </div>
                            <button 
                              className="btn-add-wish"
                              onClick={() => {
                                setSelectedWishlistId(wishlist.id)
                                setShowAddWishModal(true)
                              }}
                            >
                              + Добавить подарок
                            </button>
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

      {/* Модальное окно для добавления вишлиста */}
      {showAddWishlistModal && (
        <AddWishlistModal
          user={user}
          wishlistsRepo={wishlistsRepo}
          onClose={() => setShowAddWishlistModal(false)}
          onSuccess={async () => {
            setShowAddWishlistModal(false)
            // Перезагружаем данные
            if (user?.id && wishlistsRepo && wishesRepo) {
              const response = await wishlistsRepo.getWishlistsByTelegramId(user.id)
              if (Array.isArray(response)) {
                const loadedWishlists = response.map((wl: any) => ({
                  id: Number(wl.id) || 0,
                  name: String(wl.name || ''),
                }))
                setWishlists(loadedWishlists)
                setCollapsedWishlists(new Set(loadedWishlists.map(wl => wl.id)))
                
                // Загружаем желания для новых вишлистов
                const wishesMap: Record<number, Wish[]> = {}
                for (const wishlist of loadedWishlists) {
                  try {
                    const wishesResponse = await wishesRepo.getWishesByWishlistId(wishlist.id)
                    if (Array.isArray(wishesResponse)) {
                      const processedWishes: Wish[] = wishesResponse.map((w: any) => ({
                        id: Number(w.id) || 0,
                        title: String(w.title || 'Без названия'),
                        price: w.price !== null && w.price !== undefined 
                          ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price))
                          : undefined,
                        currency: w.currency ? String(w.currency) : undefined,
                        image_url: w.image_url ? String(w.image_url) : undefined,
                        description: w.description ? String(w.description) : undefined,
                        status: (w.status === 'reserved' || w.status === 'fulfilled') ? w.status : 'active',
                      }))
                      wishesMap[wishlist.id] = processedWishes
                    }
                  } catch (err) {
                    wishesMap[wishlist.id] = []
                  }
                }
                setWishesByWishlist(wishesMap)
              }
            }
          }}
        />
      )}

      {/* Модальное окно для добавления подарка */}
      {showAddWishModal && selectedWishlistId && (
        <AddWishModal
          wishlistId={selectedWishlistId}
          wishesRepo={wishesRepo}
          onClose={() => {
            setShowAddWishModal(false)
            setSelectedWishlistId(null)
          }}
          onSuccess={async () => {
            setShowAddWishModal(false)
            setSelectedWishlistId(null)
            // Перезагружаем желания для вишлиста
            if (selectedWishlistId && wishesRepo) {
              try {
                const wishesResponse = await wishesRepo.getWishesByWishlistId(selectedWishlistId)
                if (Array.isArray(wishesResponse)) {
                  const processedWishes: Wish[] = wishesResponse.map((w: any) => ({
                    id: Number(w.id) || 0,
                    title: String(w.title || 'Без названия'),
                    price: w.price !== null && w.price !== undefined 
                      ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price))
                      : undefined,
                    currency: w.currency ? String(w.currency) : undefined,
                    image_url: w.image_url ? String(w.image_url) : undefined,
                    description: w.description ? String(w.description) : undefined,
                    status: (w.status === 'reserved' || w.status === 'fulfilled') ? w.status : 'active',
                  }))
                  setWishesByWishlist(prev => ({
                    ...prev,
                    [selectedWishlistId]: processedWishes,
                  }))
                }
              } catch (err) {
                // Игнорируем ошибки
              }
            }
          }}
        />
      )}

      <div className="developer-section">
        <button
          className="developer-toggle-btn"
          onClick={() => setShowDeveloperData(!showDeveloperData)}
        >
          {showDeveloperData ? '▼' : '▶'} Данные для разработчика
        </button>
        {showDeveloperData && webApp && (
          <div className="developer-data">
            <pre className="json-output">
              {(() => {
                try {
                  return JSON.stringify(
                    {
                      user: user,
                      wishlists: wishlists,
                      wishesByWishlist: wishesByWishlist,
                    },
                    null,
                    2
                  )
                } catch (err) {
                  return `Ошибка при сериализации данных: ${err}`
                }
              })()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
