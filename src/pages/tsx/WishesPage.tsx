import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'

interface Wishlist {
  id: number
  name: string
}


export function WishesPage() {
  const { user } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const navigate = useNavigate()
  const location = useLocation()

  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{ gifts_given: number; gifts_received: number; reserved_count: number } | null>(null)

  // Загружаем все данные одновременно (вишлисты и статистику подарков)
  useEffect(() => {
    if (!user?.id || !wishlistsRepo || !apiContext?.users || !apiContext?.wishes) {
      setIsLoading(false)
      return
    }

    const loadAllData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Загружаем вишлисты и статистику параллельно
        const [wishlistsResult, userDataResult] = await Promise.allSettled([
          // Загружаем вишлисты пользователя
          (async () => {
            try {
              const response = await wishlistsRepo.getWishlistsByTelegramId(user.id)
              if (Array.isArray(response)) {
                return response.map((wl: any) => ({
                  id: Number(wl.id) || 0,
                  name: String(wl.name || ''),
                }))
              }
              return []
            } catch (err: any) {
              // Если вишлистов нет (404), это нормально
              return []
            }
          })(),
          // Загружаем статистику подарков
          (async () => {
            try {
              const userDataResponse = await apiContext.users.getUserByTelegramId(user.id)
              
              // Загружаем все данные о подарках параллельно
              const [reservedWishes, giftedWishes, receivedWishes] = await Promise.allSettled([
                apiContext.wishes.getReservedWishesByUserId(userDataResponse.id).catch(() => []),
                apiContext.wishes.getGiftedWishesByUserId(userDataResponse.id).catch(() => []),
                apiContext.wishes.getReceivedWishesByUserId(userDataResponse.id).catch(() => []),
              ])
              
              const reservedCount = reservedWishes.status === 'fulfilled' ? reservedWishes.value.length : 0
              
              const giftedCount = giftedWishes.status === 'fulfilled'
                ? giftedWishes.value.filter((w: any) => {
                    const giftedById = w.gifted_by_id ? Number(w.gifted_by_id) : undefined
                    return giftedById === userDataResponse.id && w.status === 'fulfilled'
                  }).length
                : 0
              
              const receivedCount = receivedWishes.status === 'fulfilled'
                ? receivedWishes.value.filter((w: any) => {
                    const userId = w.user_id ? Number(w.user_id) : undefined
                    return userId === userDataResponse.id && w.status === 'fulfilled'
                  }).length
                : 0
              
              return {
                gifts_given: giftedCount,
                gifts_received: receivedCount,
                reserved_count: reservedCount,
              }
            } catch (err) {
              console.error('Ошибка загрузки статистики подарков:', err)
              return { gifts_given: 0, gifts_received: 0, reserved_count: 0 }
            }
          })(),
        ])

        // Устанавливаем результаты загрузки
        if (wishlistsResult.status === 'fulfilled') {
          setWishlists(wishlistsResult.value)
        } else {
          setWishlists([])
        }

        if (userDataResult.status === 'fulfilled') {
          setUserData(userDataResult.value)
        } else {
          setUserData({ gifts_given: 0, gifts_received: 0, reserved_count: 0 })
        }
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Неизвестная ошибка'
        setError(errorMessage)
        setWishlists([])
        setUserData({ gifts_given: 0, gifts_received: 0, reserved_count: 0 })
      } finally {
        // Небольшая задержка для плавного появления контента
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadAllData()
  }, [user?.id, wishlistsRepo, apiContext?.users, apiContext?.wishes, location.pathname])


  const userPhotoUrl = user?.photo_url || undefined

  if (!user || isLoading) {
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
          
          {/* Блок статистики подарков - показываем только после загрузки всех данных */}
          {userData && (
            <div className="gifts-stats-section">
              <div 
                className="gifts-stat-item gifts-stat-item-clickable"
                onClick={() => navigate('/wishes/gifted')}
                role="button"
                tabIndex={0}
              >
                <div className="gifts-stat-value">{userData.gifts_given}</div>
                <div className="gifts-stat-label">Подарено</div>
              </div>
              <div className="gifts-stat-divider"></div>
              <div 
                className="gifts-stat-item gifts-stat-item-clickable"
                onClick={() => navigate('/wishes/received')}
                role="button"
                tabIndex={0}
              >
                <div className="gifts-stat-value">{userData.gifts_received}</div>
                <div className="gifts-stat-label">Получено</div>
              </div>
              <div className="gifts-stat-divider"></div>
              <div 
                className="gifts-stat-item gifts-stat-item-clickable"
                onClick={() => navigate('/wishes/reserved')}
                role="button"
                tabIndex={0}
              >
                <div className="gifts-stat-value">{userData.reserved_count}</div>
                <div className="gifts-stat-label">Забронировано</div>
              </div>
            </div>
          )}
        </section>

        <section className="wishes-list-section">
          
          {/* Кнопка добавления вишлиста */}
          <button 
            className="btn-add-wishlist"
            onClick={() => navigate('/wishes/add-wishlist')}
          >
            + Добавить вишлист
          </button>
          
          {error ? (
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
              <p>Создай список своих хотелок!</p>
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
                      onClick={() => navigate(`/wishes/wishlist/${wishlist.id}`)}
                    >
                      <h4 className="wishlist-name">
                        <span className="wishlist-name-text">{wishlist.name || 'Без названия'}</span>
                        <span className="wishlist-arrow-icon">→</span>
                      </h4>
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
