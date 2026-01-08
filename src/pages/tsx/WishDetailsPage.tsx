import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { GiftIcon } from '../../utils/tsx/GiftIcon'
import type { Wish } from '../../utils/api/wishes'
import type { User } from '../../utils/api/users'

interface WishWithExtras extends Wish {
  wishlist_name?: string
}

export function WishDetailsPage() {
  const { telegramId, wishId } = useParams<{ telegramId: string; wishId: string }>()
  const navigate = useNavigate()
  const { webApp, user: currentTelegramUser } = useTelegramWebApp()
  const apiContext = useApiContext()
  const usersRepo = apiContext?.users
  const wishesRepo = apiContext?.wishes

  const [wish, setWish] = useState<WishWithExtras | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const wishIdNumber = useMemo(() => {
    if (!wishId) return null
    const num = Number(wishId)
    return Number.isFinite(num) ? num : null
  }, [wishId])

  const telegramIdNumber = useMemo(() => {
    if (!telegramId) return null
    const num = Number(telegramId)
    return Number.isFinite(num) ? num : null
  }, [telegramId])

  // Загружаем текущего пользователя (кто смотрит подарок)
  useEffect(() => {
    if (!currentTelegramUser?.id || !usersRepo) return

    const loadCurrentUser = async () => {
      try {
        const userData = await usersRepo.getUserByTelegramId(currentTelegramUser.id)
        setCurrentUser(userData)
      } catch (e) {
        console.error('Ошибка загрузки текущего пользователя для WishDetailsPage:', e)
      }
    }

    loadCurrentUser()
  }, [currentTelegramUser?.id, usersRepo])

  useEffect(() => {
    if (!webApp?.BackButton) return
    const backButton = webApp.BackButton
    const handleBack = () => {
      if (telegramIdNumber) {
        navigate(`/user/${telegramIdNumber}`)
      } else {
        navigate(-1)
      }
    }
    backButton.show()
    backButton.onClick(handleBack)
    return () => {
      backButton.offClick(handleBack)
      backButton.hide()
    }
  }, [webApp, navigate, telegramIdNumber])

  useEffect(() => {
    const loadData = async () => {
      if (!wishesRepo || !wishIdNumber) {
        setIsLoading(false)
        setError('Не удалось загрузить подарок')
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const wishData = await wishesRepo.getWishById(wishIdNumber)
        setWish(wishData)

        if (telegramIdNumber && usersRepo) {
          try {
            const userData = await usersRepo.getUserByTelegramId(telegramIdNumber)
            setOwner(userData)
          } catch (e) {
            // Если не нашли пользователя по telegramId — не блокируем просмотр
            setOwner(null)
          }
        }
      } catch (e: any) {
        const message = e?.message || 'Не удалось загрузить подарок'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [wishIdNumber, telegramIdNumber, wishesRepo, usersRepo])

  const formatPrice = (price?: number | string, currency?: string) => {
    if (price === undefined || price === null) return 'Цена не указана'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (!Number.isFinite(numPrice)) return 'Цена не указана'
    return `${numPrice.toLocaleString('ru-RU')} ${currency || '₽'}`
  }

  const handleCopyToMe = () => {
    if (!wish) return
    // В перспективе можно добавить создание подарка у себя,
    // пока просто открываем страницу добавления с подсказкой
    navigate(
      `/wishes/add-wish?title=${encodeURIComponent(wish.title || '')}` +
        `&comment=${encodeURIComponent(wish.comment || '')}` +
        (wish.link ? `&link=${encodeURIComponent(wish.link)}` : '') +
        (wish.image_url ? `&image_url=${encodeURIComponent(wish.image_url)}` : '') +
        (wish.price ? `&price=${encodeURIComponent(String(wish.price))}` : '') +
        (wish.currency ? `&currency=${encodeURIComponent(wish.currency)}` : ''),
    )
  }

  const handleOpenLink = () => {
    if (!wish?.link) return
    try {
      if (webApp?.openLink) {
        webApp.openLink(wish.link)
      } else {
        window.open(wish.link, '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.open(wish.link, '_blank', 'noopener,noreferrer')
    }
  }

  const handleToggleReserve = async () => {
    if (!wish || !wishesRepo || !currentUser) return

    // Снять бронь может только тот, кто её поставил
    if (wish.status === 'reserved' && wish.reserved_by_id && wish.reserved_by_id !== currentUser.id) {
      alert('Снять бронь может только тот, кто её поставил')
      return
    }

    try {
      const newStatus: 'active' | 'reserved' | 'fulfilled' =
        wish.status === 'reserved' ? 'active' : 'reserved'

      const updateData: any = { status: newStatus }
      if (newStatus === 'reserved') {
        updateData.reserved_by = currentUser.id
      } else {
        updateData.reserved_by = null
      }

      const updated = await wishesRepo.updateWish(wish.id, updateData)
      setWish({
        ...wish,
        status: updated.status,
        // Явно устанавливаем reserved_by_id в зависимости от нового статуса
        reserved_by_id: newStatus === 'reserved' ? currentUser.id : undefined,
      })
    } catch (e) {
      console.error('Ошибка при изменении статуса подарка:', e)
      alert('Не удалось изменить статус подарка')
    }
  }

  const reserveButtonLabel = () => {
    if (!wish || !currentUser) return 'Забронировать'
    if (wish.status === 'fulfilled') return 'Подарено'
    if (wish.status === 'reserved') {
      // Если забронировано мной - показываем "Снять бронь"
      if (wish.reserved_by_id && wish.reserved_by_id === currentUser.id) {
        return 'Снять бронь'
      }
      // Если забронировано не мной - показываем "Забронировано"
      return 'Забронировано'
    }
    return 'Забронировать'
  }

  const isReserveButtonDisabled = () => {
    if (!wish || !currentUser) return true
    if (wish.status === 'fulfilled') return true
    // Если забронировано не мной - кнопка отключена
    if (wish.status === 'reserved' && wish.reserved_by_id && wish.reserved_by_id !== currentUser.id) return true
    // Если забронировано мной - кнопка активна (можно снять бронь)
    return false
  }

  if (isLoading) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-loading">
            <p>Загрузка подарка...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !wish) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>{error || 'Подарок не найден'}</p>
            <button
              className="btn-retry"
              onClick={() => {
                if (telegramIdNumber) {
                  navigate(`/user/${telegramIdNumber}`)
                } else {
                  navigate(-1)
                }
              }}
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
        <section className="user-profile-section">
          <div className="user-profile-top">
            <div className="user-avatar-container">
              {owner?.photo_url ? (
                <img
                  src={owner.photo_url}
                  alt={`${owner.first_name} ${owner.last_name || ''}`.trim()}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {owner?.first_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="user-info">
              <h2 className="user-name">
                {owner ? `${owner.first_name} ${owner.last_name || ''}` : 'Пользователь'}
              </h2>
              {owner?.username && <p className="user-username">@{owner.username}</p>}
            </div>
          </div>
        </section>

        <section className="wishes-list-section">
          {wish.wishlist_name && (
            <div className="wish-details-wishlist-name">
              {wish.wishlist_name}
            </div>
          )}

          <div className="wish-details-card">
            <div className="wish-details-main-row">
              <div className="wish-details-image-block">
                <div className="wish-image-container">
                  {wish.image_url ? (
                    <img
                      src={wish.image_url}
                      alt={wish.title || 'Подарок'}
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
              </div>

              <div className="wish-details-side-block">
                <button
                  className="btn-secondary wish-details-side-btn"
                  type="button"
                  onClick={handleCopyToMe}
                >
                  Скопировать себе
                </button>
                <button
                  className="btn-secondary wish-details-side-btn"
                  type="button"
                  onClick={handleOpenLink}
                  disabled={!wish.link}
                >
                  Ссылка
                </button>
                <button
                  className="btn-reserve wish-details-side-btn"
                  type="button"
                  onClick={handleToggleReserve}
                  disabled={isReserveButtonDisabled()}
                >
                  {reserveButtonLabel()}
                </button>
              </div>
            </div>

            <div className="wish-details-text-block">
              <div className="wish-details-title-row">
                <h4 className="wish-title">{wish.title || 'Без названия'}</h4>
                <span className="wish-price">{formatPrice(wish.price, wish.currency)}</span>
              </div>
              {wish.comment && (
                <p className="wish-details-comment">
                  {wish.comment}
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="details-back-row">
          <button
            className="btn-secondary"
            onClick={() => {
              if (telegramIdNumber) {
                navigate(`/user/${telegramIdNumber}`)
              } else {
                navigate(-1)
              }
            }}
          >
            Назад к профилю
          </button>
        </div>
      </div>
    </div>
  )
}

