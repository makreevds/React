import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { GiftIcon } from '../../utils/tsx/GiftIcon'
import type { Wish } from '../../utils/api/wishes'
import type { User } from '../../utils/api/users'
import doneIcon from '../../assets/done.png'
import lockIcon from '../../assets/lock.png'

interface WishWithExtras extends Wish {
  wishlist_name?: string
}

export function WishDetailsPage() {
  const { telegramId, wishId } = useParams<{ telegramId: string; wishId: string }>()
  const navigate = useNavigate()
  const { webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const usersRepo = apiContext?.users
  const wishesRepo = apiContext?.wishes

  const [wish, setWish] = useState<WishWithExtras | null>(null)
  const [owner, setOwner] = useState<User | null>(null)
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
          <h3 className="wishes-list-title">Подарок</h3>

          <div className="wish-item wish-item-details">
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

            <div className="wish-content">
              <h4 className="wish-title">{wish.title || 'Без названия'}</h4>
              {wish.comment && <p className="wish-description">{wish.comment}</p>}
              {wish.link && (
                <p className="wish-link">
                  <a href={wish.link} target="_blank" rel="noopener noreferrer">
                    {wish.link}
                  </a>
                </p>
              )}
              <p className="wish-price">{formatPrice(wish.price, wish.currency)}</p>
              {wish.wishlist_name && (
                <p className="wish-meta">
                  Вишлист: <span className="wishlist-name-text">{wish.wishlist_name}</span>
                </p>
              )}
            </div>

            <div className="wish-actions">
              {wish.status === 'fulfilled' ? (
                <div className="wish-status-icon" title="Подарено">
                  <img src={doneIcon} alt="Исполнено" className="gift-icon-small" />
                </div>
              ) : wish.status === 'reserved' ? (
                <div className="wish-status-icon" title="Забронировано">
                  <img src={lockIcon} alt="Забронировано" className="gift-icon-small" />
                </div>
              ) : (
                <div className="wish-status-text">Активно</div>
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

