import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/FeedPage.css'
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

export function FeedPage() {
  const { user: currentUser } = useTelegramWebApp()
  const apiContext = useApiContext()
  const usersRepo = apiContext?.users
  const wishesRepo = apiContext?.wishes
  const navigate = useNavigate()

  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handleUserClick = (user: User) => {
    navigate(`/user/${user.telegram_id}`)
  }

  const handleWishlistClick = (wish: Wish, user: User) => {
    if (wish.wishlist_id) {
      navigate(`/user/${user.telegram_id}/wishlist/${wish.wishlist_id}`)
    }
  }

  const handleWishClick = (wish: Wish, user: User) => {
    navigate(`/user/${user.telegram_id}/wish/${wish.id}`)
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

  return (
    <div className="page-container feed-page">
      <div className="feed-main-content">
        <div className="feed-list">
          {feedItems.map((item) => (
            <div key={`${item.wish.id}-${item.user.id}`} className="feed-item">
              <div className="feed-item-header">
                <div 
                  className="feed-item-user"
                  onClick={() => handleUserClick(item.user)}
                >
                  <span className="feed-item-user-name">{getUserFullName(item.user)}</span>
                </div>
                {item.wishlistName && (
                  <div 
                    className="feed-item-wishlist"
                    onClick={() => handleWishlistClick(item.wish, item.user)}
                  >
                    <span className="feed-item-wishlist-icon">📋</span>
                    <span className="feed-item-wishlist-name">{item.wishlistName}</span>
                  </div>
                )}
              </div>
              
              <div 
                className="feed-item-wish"
                onClick={() => handleWishClick(item.wish, item.user)}
              >
                <div className="feed-item-wish-image-container">
                  {item.wish.image_url ? (
                    <img 
                      src={item.wish.image_url} 
                      alt={item.wish.title || 'Подарок'}
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
                  <div className={`feed-item-wish-image-placeholder ${!item.wish.image_url ? 'show' : ''}`}>
                    <GiftIcon className="gift-icon" />
                  </div>
                </div>
                
                <div className="feed-item-wish-content">
                  <h4 className="feed-item-wish-title">{item.wish.title || 'Без названия'}</h4>
                  {item.wish.comment && (
                    <p className="feed-item-wish-comment">{item.wish.comment}</p>
                  )}
                  {item.wish.price && (
                    <p className="feed-item-wish-price">{formatPrice(item.wish.price, item.wish.currency)}</p>
                  )}
                  {item.wish.status === 'reserved' && (
                    <span className="feed-item-wish-status feed-item-wish-status-reserved">
                      Забронировано
                    </span>
                  )}
                  {item.wish.status === 'fulfilled' && (
                    <span className="feed-item-wish-status feed-item-wish-status-fulfilled">
                      Подарено
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
