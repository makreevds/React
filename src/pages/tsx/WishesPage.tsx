import { useState } from 'react'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { GiftIcon } from '../../utils/tsx/GiftIcon'

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
    },
    {
      id: 2,
      title: 'Наушники AirPods Pro',
      price: 24990,
      currency: '₽',
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
                        onError={(e) => {
                          // Если изображение не загрузилось, скрываем img и показываем placeholder
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
