import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import type { User } from '../../utils/api/users'

// Упрощенные типы
interface Wishlist {
  id: number
  name: string
  event_date?: string
}


export function UserProfilePage() {
  const { telegramId } = useParams<{ telegramId: string }>()
  const { webApp, user: currentUser } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const usersRepo = apiContext?.users
  const navigate = useNavigate()

  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [currentDbUser, setCurrentDbUser] = useState<User | null>(null)

  // Управление кнопкой "Назад" в Telegram
  useEffect(() => {
    if (!webApp?.BackButton) {
      return
    }

    const backButton = webApp.BackButton
    const handleBackClick = () => {
      navigate(-1)
    }

    // Показываем кнопку "Назад"
    backButton.show()
    // Устанавливаем обработчик клика
    backButton.onClick(handleBackClick)

    // При размонтировании скрываем кнопку и удаляем обработчик
    return () => {
      backButton.offClick(handleBackClick)
      backButton.hide()
    }
  }, [webApp, navigate])

  // Загружаем все данные последовательно (сначала пользователя, потом вишлисты)
  useEffect(() => {
    if (!telegramId || !usersRepo || !wishlistsRepo) {
      setIsLoading(false)
      return
    }

    const loadAllData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const telegramIdNum = parseInt(telegramId, 10)
        if (isNaN(telegramIdNum)) {
          setError('Некорректный ID пользователя')
          setIsLoading(false)
          return
        }

        // Сначала загружаем данные пользователя
        const userData = await usersRepo.getUserByTelegramId(telegramIdNum)
        console.log('Загружены данные пользователя:', userData)
        setViewedUser(userData)

        // Проверяем подписку текущего пользователя на просматриваемого
        if (currentUser?.id) {
          try {
            const dbCurrentUser = await usersRepo.getUserByTelegramId(currentUser.id)
            setCurrentDbUser(dbCurrentUser)
            
            // Получаем список подписок текущего пользователя
            const subscriptions = await usersRepo.getSubscriptions(dbCurrentUser.id)
            const isSubscribedToUser = subscriptions.some(sub => sub.id === userData.id)
            setIsSubscribed(isSubscribedToUser)
          } catch (err) {
            console.error('Ошибка при проверке подписки:', err)
            // Не критично, просто не показываем статус подписки
          }
        }

        // Затем загружаем вишлисты пользователя
        let loadedWishlists: Wishlist[] = []
        try {
          const response = await wishlistsRepo.getWishlistsByTelegramId(userData.telegram_id)
          if (Array.isArray(response)) {
            loadedWishlists = response.map((wl: any) => ({
              id: Number(wl.id) || 0,
              name: String(wl.name || ''),
              event_date: wl.event_date ? String(wl.event_date) : undefined,
            }))
          }
        } catch (err: any) {
          // Вишлисты могут быть пустыми - это нормально
          loadedWishlists = []
        }
        setWishlists(loadedWishlists)
      } catch (err) {
        console.error('Ошибка загрузки данных пользователя:', err)
        setError('Пользователь не найден')
        setViewedUser(null)
        setWishlists([])
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadAllData()
  }, [telegramId, usersRepo, wishlistsRepo, currentUser?.id])


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

  if (error || !viewedUser) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>{error || 'Пользователь не найден'}</p>
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

  // Используем photo_url из данных пользователя, если оно есть
  const userPhotoUrl = viewedUser.photo_url || undefined

  // Форматируем дату события
  const formatEventDate = (dateString?: string): string | null => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
      const day = date.getDate()
      const month = months[date.getMonth()]
      const year = date.getFullYear()
      const currentYear = new Date().getFullYear()
      
      if (year === currentYear) {
        return `${day} ${month}`
      } else {
        return `${day} ${month} ${year}`
      }
    } catch (err) {
      return null
    }
  }

  // Обработчик подписки/отписки
  const handleSubscribeToggle = async () => {
    if (!currentDbUser || !viewedUser || !usersRepo) return

    setIsSubscriptionLoading(true)
    try {
      if (isSubscribed) {
        // Отписываемся
        await usersRepo.unsubscribe(currentDbUser.id, viewedUser.id)
        setIsSubscribed(false)
      } else {
        // Подписываемся
        await usersRepo.subscribe(currentDbUser.id, viewedUser.id)
        setIsSubscribed(true)
      }
    } catch (err) {
      console.error('Ошибка при изменении подписки:', err)
      alert('Не удалось изменить подписку. Попробуйте позже.')
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

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

          {/* Кнопка подписки/отписки - показываем только если это не текущий пользователь */}
          {currentDbUser && viewedUser && currentDbUser.id !== viewedUser.id && (
            <div className="user-subscribe-section">
              <button
                className="btn-subscribe-toggle"
                onClick={handleSubscribeToggle}
                disabled={isSubscriptionLoading}
              >
                {isSubscriptionLoading 
                  ? 'Загрузка...' 
                  : isSubscribed 
                    ? 'Отписаться' 
                    : 'Подписаться'}
              </button>
            </div>
          )}
        </section>

        <section className="wishes-list-section">
          
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

                  return (
                    <div 
                      key={wishlist.id} 
                      className="wishlist-group wishlist-clickable"
                      onClick={() => navigate(`/user/${viewedUser.telegram_id}/wishlist/${wishlist.id}`)}
                    >
                      <h4 className="wishlist-name">
                        <span className="wishlist-name-text">{wishlist.name || 'Без названия'}</span>
                        <span className="wishlist-arrow-icon">→</span>
                      </h4>
                      {wishlist.event_date && (
                        <p className="wishlist-event-date">{formatEventDate(wishlist.event_date)}</p>
                      )}
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

