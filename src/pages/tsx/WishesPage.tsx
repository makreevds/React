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
          console.log('=== ЗАГРУЗКА ВИШЛИСТОВ ===')
          console.log('telegram_id пользователя:', user.id)
          console.log('URL запроса будет: /api/wishlists/by_telegram_id/?telegram_id=' + user.id)
          const response = await wishlistsRepo.getWishlistsByTelegramId(user.id)
          console.log('Ответ от API (вишлисты):', response)
          console.log('Тип ответа:', typeof response, 'Является массивом:', Array.isArray(response))
          // Проверяем, что ответ - массив
          if (Array.isArray(response)) {
            loadedWishlists = response.map((wl: any) => ({
              id: Number(wl.id) || 0,
              name: String(wl.name || ''),
              is_default: Boolean(wl.is_default),
            }))
            console.log('Обработанные вишлисты:', loadedWishlists)
          } else {
            console.warn('Ответ не является массивом:', typeof response, response)
          }
        } catch (err: any) {
          console.error('Ошибка при загрузке вишлистов:', err)
          console.error('Детали ошибки:', {
            message: err?.message,
            code: err?.code,
            status: err?.status,
            stack: err?.stack
          })
          
          // Если вишлистов нет (404), это нормально
          if (err?.code === 'NOT_FOUND' || err?.status === 404 || 
              (err?.message && (err.message.includes('404') || err.message.includes('NOT_FOUND')))) {
            console.log('Вишлисты не найдены (404) - это нормально для нового пользователя')
            loadedWishlists = []
          } else {
            // Для других ошибок тоже устанавливаем пустой массив, но логируем
            console.warn('Неожиданная ошибка при загрузке вишлистов, устанавливаем пустой массив')
            loadedWishlists = []
            // Не пробрасываем ошибку дальше, чтобы страница не упала
          }
        }
        setWishlists(loadedWishlists)

        // Загружаем желания для каждого вишлиста
        const wishesMap: Record<number, Wish[]> = {}
        console.log('=== ЗАГРУЗКА ЖЕЛАНИЙ ===')
        console.log('Количество вишлистов для загрузки желаний:', loadedWishlists.length)
        
        for (const wishlist of loadedWishlists) {
          try {
            console.log(`\nЗагружаем желания для вишлиста ID=${wishlist.id}, name="${wishlist.name}"`)
            console.log(`URL запроса будет: /api/wishes/?wishlist_id=${wishlist.id}`)
            
            const wishesResponse = await wishesRepo.getWishesByWishlistId(wishlist.id)
            
            console.log(`Ответ от API (желания для вишлиста ${wishlist.id}):`, wishesResponse)
            console.log(`Тип ответа:`, typeof wishesResponse, 'Является массивом:', Array.isArray(wishesResponse))
            
            // Проверяем, что ответ - массив и обрабатываем каждый элемент
            if (Array.isArray(wishesResponse)) {
              console.log(`Количество желаний в ответе:`, wishesResponse.length)
              if (wishesResponse.length > 0) {
                console.log('Первое желание (сырые данные):', wishesResponse[0])
              }
              
              wishesMap[wishlist.id] = wishesResponse.map((w: any) => {
                const processed = {
                  id: Number(w.id) || 0,
                  title: String(w.title || ''),
                  price: w.price ? (typeof w.price === 'string' ? parseFloat(w.price) : Number(w.price)) : undefined,
                  currency: w.currency ? String(w.currency) : undefined,
                  image_url: w.image_url ? String(w.image_url) : undefined,
                  description: w.description ? String(w.description) : undefined,
                  status: (w.status === 'reserved' || w.status === 'fulfilled') ? w.status : 'active',
                }
                console.log(`Обработано желание:`, processed)
                return processed
              })
              
              console.log(`Итого обработано желаний для вишлиста ${wishlist.id}:`, wishesMap[wishlist.id].length)
            } else {
              console.warn(`⚠️ Ответ для вишлиста ${wishlist.id} не является массивом:`, typeof wishesResponse, wishesResponse)
              wishesMap[wishlist.id] = []
            }
          } catch (err: any) {
            console.error(`❌ Ошибка при загрузке желаний для вишлиста ${wishlist.id}:`, err)
            console.error('Детали ошибки:', {
              message: err?.message,
              code: err?.code,
              status: err?.status,
            })
            wishesMap[wishlist.id] = []
          }
        }
        console.log('Итоговая карта желаний:', wishesMap)
        setWishesByWishlist(wishesMap)
      } catch (err: any) {
        console.error('Критическая ошибка при загрузке данных:', err)
        const errorMessage = err?.message || err?.toString() || 'Неизвестная ошибка'
        setError(errorMessage)
        // Устанавливаем пустые данные, чтобы компонент не упал
        setWishlists([])
        setWishesByWishlist({})
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
  
  // Безопасное получение всех желаний
  let allWishes: Wish[] = []
  try {
    allWishes = Object.values(wishesByWishlist).flat().filter(w => w && w.id)
    console.log('Все желания для отображения:', allWishes)
    console.log('Количество вишлистов:', wishlists.length)
    console.log('Количество желаний:', allWishes.length)
  } catch (err) {
    console.error('Ошибка при обработке желаний:', err)
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
          
          {/* Отладочная информация - всегда показываем для отладки */}
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
            <div><strong>Отладочная информация:</strong></div>
            <div>user?.id (telegram_id): {user?.id || 'не определен'}</div>
            <div>isLoading: {String(isLoading)}</div>
            <div>error: {error || 'нет'}</div>
            <div>wishlists.length: {wishlists.length}</div>
            <div>allWishes.length: {allWishes.length}</div>
            <div>wishlists: {JSON.stringify(wishlists.map(w => ({ id: w.id, name: w.name })))}</div>
            <div>wishesByWishlist keys: {Object.keys(wishesByWishlist).join(', ') || 'нет'}</div>
            <div>wishesByWishlist[2]: {wishesByWishlist[2] ? JSON.stringify(wishesByWishlist[2].map(w => ({ id: w.id, title: w.title }))) : 'нет данных'}</div>
            <div style={{ marginTop: '10px', padding: '5px', background: '#fff', borderRadius: '3px' }}>
              <strong>Проверьте в админке Django:</strong>
              <div>1. У вишлиста поле "user" должно указывать на пользователя с telegram_id = {user?.id || '?'}</div>
              <div>2. В таблице users найдите пользователя с telegram_id = {user?.id || '?'}</div>
              <div>3. Убедитесь, что вишлист привязан к этому пользователю</div>
            </div>
          </div>
          
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
                  if (wishes.length === 0) return null

                  return (
                    <div key={wishlist.id} className="wishlist-group">
                      {wishlists.length > 1 && (
                        <h4 className="wishlist-name">
                          {wishlist.name || 'Без названия'}
                          {wishlist.is_default && <span className="wishlist-default-badge"> (по умолчанию)</span>}
                        </h4>
                      )}
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
