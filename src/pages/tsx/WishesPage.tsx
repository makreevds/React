import { useState, useEffect } from 'react'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'
import { GiftIcon } from '../../utils/tsx/GiftIcon'

// Упрощенные типы для избежания проблем с импортом
interface Wishlist {
  id: number
  name: string
  is_default: boolean
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
          loadedWishlists = await wishlistsRepo.getWishlistsByTelegramId(user.id)
        } catch (err) {
          if (err instanceof Error && (err.message.includes('404') || err.message.includes('NOT_FOUND'))) {
            loadedWishlists = []
          } else {
            throw err
          }
        }
        setWishlists(loadedWishlists)

        // Загружаем желания для каждого вишлиста
        const wishesMap: Record<number, Wish[]> = {}
        for (const wishlist of loadedWishlists) {
          try {
            const wishes = await wishesRepo.getWishesByWishlistId(wishlist.id)
            wishesMap[wishlist.id] = wishes
          } catch (err) {
            wishesMap[wishlist.id] = []
          }
        }
        setWishesByWishlist(wishesMap)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(errorMessage)
      } finally {
        setIsLoading(false)
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
  const allWishes: Wish[] = Object.values(wishesByWishlist).flat()

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
        </section>

        <section className="wishes-list-section">
          <h3 className="wishes-list-title">Мои желания</h3>
          
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
                const wishes = wishesByWishlist[wishlist.id] || []
                if (wishes.length === 0) return null

                return (
                  <div key={wishlist.id} className="wishlist-group">
                    {wishlists.length > 1 && (
                      <h4 className="wishlist-name">
                        {wishlist.name}
                        {wishlist.is_default && <span className="wishlist-default-badge"> (по умолчанию)</span>}
                      </h4>
                    )}
                    <div className="wishes-list">
                      {wishes.map((wish) => (
                        <div key={wish.id} className="wish-item">
                          <div className="wish-image-container">
                            {wish.image_url ? (
                              <img 
                                src={wish.image_url} 
                                alt={wish.title}
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
                            <h4 className="wish-title">{wish.title}</h4>
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
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </section>
      </div>

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
              {JSON.stringify(
                {
                  user: user,
                  wishlists: wishlists,
                  wishesByWishlist: wishesByWishlist,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
