import { useState } from 'react'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'

// Заглушка для желания
interface Wish {
  id: number
  title: string
  price?: number
  currency?: string
  image_url?: string
}

export function WishesPage() {
  const { user, webApp } = useTelegramWebApp()
  const [showDeveloperData, setShowDeveloperData] = useState(false)
  
  // Заглушки для списка желаний
  const [wishes] = useState<Wish[]>([
    {
      id: 1,
      title: 'iPhone 15 Pro',
      price: 99999,
      currency: '₽',
      image_url: 'https://via.placeholder.com/100x100?text=iPhone',
    },
    {
      id: 2,
      title: 'Наушники AirPods Pro',
      price: 24990,
      currency: '₽',
      image_url: 'https://via.placeholder.com/100x100?text=AirPods',
    },
    {
      id: 3,
      title: 'Книга "Искусство программирования"',
      price: 3500,
      currency: '₽',
    },
  ])

  const handleEdit = (wishId: number) => {
    console.log('Редактировать желание:', wishId)
    // TODO: Реализовать редактирование
  }

  const handleDelete = (wishId: number) => {
    console.log('Удалить желание:', wishId)
    // TODO: Реализовать удаление
  }

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'Цена не указана'
    return `${price.toLocaleString('ru-RU')} ${currency || '₽'}`
  }

  // Получаем фото пользователя из Telegram
  const userPhotoUrl = user?.photo_url || undefined

  return (
    <div className="page-container wishes-page">
      {/* Основная часть - личная страница */}
      <div className="wishes-main-content">
        {/* Блок с информацией о пользователе */}
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

        {/* Список желаний */}
        <section className="wishes-list-section">
          <h3 className="wishes-list-title">Мои желания</h3>
          {wishes.length === 0 ? (
            <div className="wishes-empty">
              <p>У вас пока нет желаний</p>
              <button className="btn-add-wish">Добавить желание</button>
            </div>
          ) : (
            <div className="wishes-list">
              {wishes.map((wish) => (
                <div key={wish.id} className="wish-item">
                  <div className="wish-image-container">
                    {wish.image_url ? (
                      <img 
                        src={wish.image_url} 
                        alt={wish.title}
                        className="wish-image"
                      />
                    ) : (
                      <div className="wish-image-placeholder">
                        <svg width="60px" height="60px" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" transform="matrix(-1, 0, 0, 1, 0, 0)rotate(0)">
                          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                          <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="0.048"></g>
                          <g id="SVGRepo_iconCarrier">
                            <path d="M11.2498 2C7.03145 2.00411 4.84888 2.07958 3.46423 3.46423C2.07958 4.84888 2.00411 7.03145 2 11.2498H6.91352C6.56255 10.8114 6.30031 10.2943 6.15731 9.72228C5.61906 7.56926 7.56926 5.61906 9.72228 6.15731C10.2943 6.30031 10.8114 6.56255 11.2498 6.91352V2Z" fill="currentColor"></path>
                            <path d="M2 12.7498C2.00411 16.9681 2.07958 19.1506 3.46423 20.5353C4.84888 21.9199 7.03145 21.9954 11.2498 21.9995V14.1234C10.4701 15.6807 8.8598 16.7498 6.99976 16.7498C6.58555 16.7498 6.24976 16.414 6.24976 15.9998C6.24976 15.5856 6.58555 15.2498 6.99976 15.2498C8.53655 15.2498 9.82422 14.1831 10.1628 12.7498H2Z" fill="currentColor"></path>
                            <path d="M12.7498 21.9995C16.9681 21.9954 19.1506 21.9199 20.5353 20.5353C21.9199 19.1506 21.9954 16.9681 21.9995 12.7498H13.8367C14.1753 14.1831 15.463 15.2498 16.9998 15.2498C17.414 15.2498 17.7498 15.5856 17.7498 15.9998C17.7498 16.414 17.414 16.7498 16.9998 16.7498C15.1397 16.7498 13.5294 15.6807 12.7498 14.1234V21.9995Z" fill="currentColor"></path>
                            <path d="M21.9995 11.2498C21.9954 7.03145 21.9199 4.84888 20.5353 3.46423C19.1506 2.07958 16.9681 2.00411 12.7498 2V6.91352C13.1882 6.56255 13.7053 6.30031 14.2772 6.15731C16.4303 5.61906 18.3805 7.56926 17.8422 9.72228C17.6992 10.2943 17.437 10.8114 17.086 11.2498H21.9995Z" fill="currentColor"></path>
                            <path d="M9.35847 7.61252C10.47 7.8904 11.2498 8.88911 11.2498 10.0348V11.2498H10.0348C8.88911 11.2498 7.8904 10.47 7.61252 9.35847C7.34891 8.30403 8.30403 7.34891 9.35847 7.61252Z" fill="currentColor"></path>
                            <path d="M12.7498 10.0348V11.2498H13.9647C15.1104 11.2498 16.1091 10.47 16.387 9.35847C16.6506 8.30403 15.6955 7.34891 14.6411 7.61252C13.5295 7.8904 12.7498 8.88911 12.7498 10.0348Z" fill="currentColor"></path>
                          </g>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="wish-content">
                    <h4 className="wish-title">{wish.title}</h4>
                    <p className="wish-price">{formatPrice(wish.price, wish.currency)}</p>
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
          )}
        </section>
      </div>

      {/* Секция для разработчика */}
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
                  initDataUnsafe: webApp.initDataUnsafe,
                  initData: webApp.initData,
                  version: webApp.version,
                  platform: webApp.platform,
                  colorScheme: webApp.colorScheme,
                  themeParams: webApp.themeParams,
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
