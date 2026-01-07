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
}


export function UserProfilePage() {
  const { telegramId } = useParams<{ telegramId: string }>()
  const { webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const usersRepo = apiContext?.users
  const navigate = useNavigate()

  const [viewedUser, setViewedUser] = useState<User | null>(null)
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Управление кнопкой "Назад" в Telegram
  useEffect(() => {
    if (!webApp?.BackButton) {
      return
    }

    const backButton = webApp.BackButton
    const handleBackClick = () => {
      navigate('/friends')
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


  // Загружаем вишлисты пользователя
  useEffect(() => {
    if (!telegramId || !viewedUser || !wishlistsRepo) {
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
      } catch (err: any) {
        const errorMessage = err?.message || err?.toString() || 'Неизвестная ошибка'
        setError(errorMessage)
        setWishlists([])
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadData()
  }, [telegramId, viewedUser, wishlistsRepo])


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

