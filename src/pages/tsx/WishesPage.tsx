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

  // Загружаем данные пользователя и количество забронированных подарков
  useEffect(() => {
    if (!user?.id || !apiContext?.users || !apiContext?.wishes) {
      return
    }

    const loadUserData = async () => {
      try {
        const userDataResponse = await apiContext.users.getUserByTelegramId(user.id)
        
        // Загружаем забронированные подарки текущего пользователя
        let reservedCount = 0
        try {
          const reservedWishes = await apiContext.wishes.getReservedWishesByUserId(userDataResponse.id)
          reservedCount = reservedWishes.length
        } catch (err) {
          // Игнорируем ошибки загрузки забронированных подарков
          console.error('Ошибка загрузки забронированных подарков:', err)
        }
        
        setUserData({
          gifts_given: userDataResponse.gifts_given || 0,
          gifts_received: userDataResponse.gifts_received || 0,
          reserved_count: reservedCount,
        })
      } catch (err) {
        // Игнорируем ошибки загрузки данных пользователя
        setUserData({ gifts_given: 0, gifts_received: 0, reserved_count: 0 })
      }
    }

    loadUserData()
  }, [user?.id, apiContext?.users, apiContext?.wishes])


  // Загружаем вишлисты при монтировании компонента
  useEffect(() => {
    if (!user?.id || !wishlistsRepo) {
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
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Неизвестная ошибка'
        setError(errorMessage)
        // Устанавливаем пустые данные, чтобы компонент не упал
        setWishlists([])
      } finally {
        // Небольшая задержка для плавного появления контента
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadData()
  }, [user?.id, wishlistsRepo])

  // Перезагружаем данные при возврате на страницу (например, после добавления вишлиста)
  useEffect(() => {
    // Перезагружаем данные только если мы на странице /wishes (не на подстраницах)
    if (location.pathname === '/wishes' && user?.id && wishlistsRepo) {
      const loadData = async () => {
        try {
          // Загружаем вишлисты пользователя
          let loadedWishlists: Wishlist[] = []
          try {
            const response = await wishlistsRepo.getWishlistsByTelegramId(user.id)
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
        } catch (err) {
          // Игнорируем ошибки при перезагрузке
        }
      }
      loadData()
    }
  }, [location.pathname, user?.id, wishlistsRepo])


  const userPhotoUrl = user?.photo_url || undefined

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
