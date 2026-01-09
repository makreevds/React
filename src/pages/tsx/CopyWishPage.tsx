import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'

interface Wishlist {
  id: number
  name: string
}

/**
 * Страница для выбора вишлиста при копировании подарка
 */
export function CopyWishPage() {
  const { webApp, user } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const wishesRepo = apiContext?.wishes
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Получаем данные подарка из URL параметров
  const title = searchParams.get('title') || ''
  const comment = searchParams.get('comment') || ''
  const link = searchParams.get('link') || ''
  const imageUrl = searchParams.get('image_url') || ''
  const price = searchParams.get('price') || ''
  const currency = searchParams.get('currency') || '₽'

  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Управление кнопкой "Назад" в Telegram
  useEffect(() => {
    if (!webApp?.BackButton) return
    const backButton = webApp.BackButton
    const handleBackClick = () => {
      navigate(-1)
    }
    backButton.show()
    backButton.onClick(handleBackClick)
    return () => {
      backButton.offClick(handleBackClick)
      backButton.hide()
    }
  }, [webApp, navigate])

  // Загружаем вишлисты пользователя
  useEffect(() => {
    if (!user?.id || !wishlistsRepo) {
      setIsLoading(false)
      return
    }

    const loadWishlists = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await wishlistsRepo.getWishlistsByTelegramId(user.id)
        if (Array.isArray(response)) {
          setWishlists(response.map((wl: any) => ({
            id: Number(wl.id) || 0,
            name: String(wl.name || ''),
          })))
        } else {
          setWishlists([])
        }
      } catch (err: any) {
        setError('Не удалось загрузить вишлисты')
        setWishlists([])
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadWishlists()
  }, [user?.id, wishlistsRepo])

  const handleSelectWishlist = async (wishlistId: number) => {
    if (!wishesRepo || !title.trim()) return

    setIsSubmitting(true)
    try {
      await wishesRepo.createWish({
        wishlist: wishlistId,
        title: title.trim(),
        comment: comment.trim() || undefined,
        link: link || undefined,
        image_url: imageUrl || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency || '₽',
      })
      // Возвращаемся на страницу вишлиста
      navigate(`/wishes/wishlist/${wishlistId}`)
    } catch (err) {
      console.error('Ошибка при создании подарка:', err)
      alert('Не удалось скопировать подарок')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateNewWishlist = () => {
    // Переходим на страницу создания вишлиста с данными подарка
    navigate(
      `/wishes/add-wishlist?title=${encodeURIComponent(title)}` +
        `&comment=${encodeURIComponent(comment)}` +
        (link ? `&link=${encodeURIComponent(link)}` : '') +
        (imageUrl ? `&image_url=${encodeURIComponent(imageUrl)}` : '') +
        (price ? `&price=${encodeURIComponent(price)}` : '') +
        (currency ? `&currency=${encodeURIComponent(currency)}` : ''),
    )
  }

  if (isLoading) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-loading">
            <p>Загрузка вишлистов...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>{error}</p>
            <button 
              className="btn-retry" 
              onClick={() => navigate(-1)}
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
        <section className="wishes-list-section">
          <div className="wishes-container">
            <h3 className="wishes-list-title">Выберите вишлист</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--theme-current-hint)' }}>
              Выберите вишлист, в который хотите скопировать подарок, или создайте новый
            </p>
          </div>

          {wishlists.length === 0 ? (
            <div className="wishes-empty">
              <p>У вас пока нет вишлистов</p>
            </div>
          ) : (
            <div className="wishes-list">
              {wishlists.map((wishlist) => (
                <div
                  key={wishlist.id}
                  className="wishlist-group wishlist-clickable"
                  onClick={() => handleSelectWishlist(wishlist.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <h4 className="wishlist-name">
                    <span className="wishlist-name-text">{wishlist.name || 'Без названия'}</span>
                    <span className="wishlist-arrow-icon">→</span>
                  </h4>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-add-wishlist"
            onClick={handleCreateNewWishlist}
            disabled={isSubmitting}
          >
            + Создать новый вишлист
          </button>
        </section>
      </div>
    </div>
  )
}

