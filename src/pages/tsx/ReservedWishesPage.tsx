import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'
import { GiftIcon } from '../../utils/tsx/GiftIcon'
import type { Wish } from '../../utils/api/wishes'
import type { User } from '../../utils/api/users'

export function ReservedWishesPage() {
  const { user } = useTelegramWebApp()
  const { webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishesRepo = apiContext?.wishes
  const usersRepo = apiContext?.users
  const wishlistsRepo = apiContext?.wishlists
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
        console.error('Ошибка загрузки текущего пользователя для ReservedWishesPage:', e)
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

  // Загружаем забронированные подарки
  useEffect(() => {
    if (!currentUser?.id || !wishesRepo) {
      setIsLoading(false)
      return
    }

    const loadReservedWishes = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const reservedWishes = await wishesRepo.getReservedWishesByUserId(currentUser.id)
        
        // Обрабатываем подарки
        const processedWishes: WishWithOwner[] = reservedWishes
          .filter((w: any) => w.wishlist && w.user) // Фильтруем только валидные подарки
          .map((w: any) => ({
            id: Number(w.id) || 0,
            title: String(w.title || 'Без названия'),
            price: w.price !== null && w.price !== undefined 
              ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price))
              : undefined,
            currency: w.currency ? String(w.currency) : undefined,
            image_url: w.image_url ? String(w.image_url) : undefined,
            comment: w.comment ? String(w.comment) : undefined,
            link: w.link ? String(w.link) : undefined,
            status: (w.status === 'reserved' || w.status === 'fulfilled') ? w.status : 'active',
            reserved_by_id: w.reserved_by_id ? Number(w.reserved_by_id) : undefined,
            gifted_by_id: w.gifted_by_id ? Number(w.gifted_by_id) : undefined,
            wishlist_id: w.wishlist_id ? Number(w.wishlist_id) : (w.wishlist ? Number(w.wishlist) : 0),
            user_id: w.user_id ? Number(w.user_id) : (w.user ? Number(w.user) : 0),
            wishlist: Number(w.wishlist) || 0,
            user: Number(w.user) || 0,
            is_fulfilled: w.is_fulfilled || false,
            created_at: w.created_at || '',
            updated_at: w.updated_at || '',
            order: w.order || 0,
            owner_telegram_id: undefined, // Пока что не загружаем, используем fallback навигацию
          }))
        
        setWishes(processedWishes)
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Не удалось загрузить забронированные подарки'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadReservedWishes()
  }, [currentUser?.id, wishesRepo, usersRepo, wishlistsRepo])

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
            <h3 className="wishes-list-title">Забронированные подарки</h3>
            <p className="wishes-list-comment">Подарки, которые вы забронировали у друзей</p>
          </div>
          {wishes.length === 0 ? (
            <div className="wishes-empty">
              <p>У вас пока нет забронированных подарков</p>
            </div>
          ) : (
            <div className="wishes-list">
              {wishes.map((wish) => {
                if (!wish || !wish.id) return null
                
                const handleOpenWishlist = () => {
                  // Переходим на страницу вишлиста владельца подарка
                  if (wish.wishlist_id) {
                    // Пока что используем навигацию напрямую по wishlist_id
                    // Это сработает для вишлистов текущего пользователя
                    // Для чужих вишлистов можно будет доработать позже, добавив user_telegram_id в API
                    navigate(`/wishes/wishlist/${wish.wishlist_id}`)
                  }
                }

                return (
                  <div 
                    key={wish.id} 
                    className="wish-item wish-item-reserved-by-me"
                    role="button"
                    onClick={handleOpenWishlist}
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
                      {wish.status === 'reserved' && (
                        <span className="wish-status wish-status-reserved wish-status-reserved-by-me">
                          Забронировано Вами
                        </span>
                      )}
                      {wish.status === 'fulfilled' && (
                        <span className="wish-status wish-status-fulfilled">Подарено</span>
                      )}
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

