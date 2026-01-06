import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useApiContext } from '../../contexts/ApiContext'

/**
 * Страница для добавления нового желания в вишлист
 */
export function AddWishPage() {
  const apiContext = useApiContext()
  const wishesRepo = apiContext?.wishes
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const wishlistIdParam = searchParams.get('wishlistId')
  const wishIdParam = searchParams.get('wishId')
  const [wishlistId, setWishlistId] = useState<number | null>(wishlistIdParam ? parseInt(wishlistIdParam, 10) : null)
  const wishId = wishIdParam ? parseInt(wishIdParam, 10) : null
  const isEditMode = !!wishId

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('₽')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружаем данные желания для редактирования
  useEffect(() => {
    if (isEditMode && wishId && wishesRepo) {
      setIsLoading(true)
      wishesRepo.getWishById(wishId)
        .then((wish) => {
          setTitle(wish.title || '')
          setDescription(wish.description || '')
          setLink(wish.link || '')
          setImageUrl(wish.image_url || '')
          setPrice(wish.price ? wish.price.toString() : '')
          setCurrency(wish.currency || '₽')
          // Если wishlistId не передан в URL, используем из данных желания
          if (!wishlistId && wish.wishlist_id) {
            setWishlistId(wish.wishlist_id)
          }
        })
        .catch((err: any) => {
          setError(err?.message || 'Не удалось загрузить данные желания')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isEditMode, wishId, wishesRepo, wishlistId])

  useEffect(() => {
    if (!wishlistId || isNaN(wishlistId)) {
      if (!isEditMode) {
        setError('Не указан вишлист')
      }
    }
  }, [wishlistId, isEditMode])

  // Обработчики для скрытия навбара при фокусе на поле ввода
  const handleInputFocus = () => {
    document.body.classList.add('keyboard-open')
  }

  const handleInputBlur = () => {
    // Небольшая задержка, чтобы дождаться перехода фокуса на другое поле
    setTimeout(() => {
      const activeElement = document.activeElement
      const isFormElement = activeElement && (
        activeElement.tagName.toLowerCase() === 'input' ||
        activeElement.tagName.toLowerCase() === 'textarea' ||
        activeElement.tagName.toLowerCase() === 'select'
      )
      if (!isFormElement) {
        document.body.classList.remove('keyboard-open')
      }
    }, 100)
  }

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      document.body.classList.remove('keyboard-open')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !wishesRepo) return

    // В режиме редактирования нужен wishId, в режиме создания - wishlistId
    if (isEditMode && !wishId) {
      setError('Не указано желание для редактирования')
      return
    }
    if (!isEditMode && (!wishlistId || isNaN(wishlistId))) {
      setError('Не указан вишлист')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      if (isEditMode && wishId) {
        // Режим редактирования
        await wishesRepo.updateWish(wishId, {
          title: title.trim(),
          description: description.trim() || undefined,
          link: link.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          currency: currency || '₽',
        })
      } else if (wishlistId) {
        // Режим создания
        await wishesRepo.createWish({
          wishlist: wishlistId,
          title: title.trim(),
          description: description.trim() || undefined,
          link: link.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          currency: currency || '₽',
        })
      }
      // Возвращаемся на страницу желаний после успешного сохранения
      navigate('/wishes')
    } catch (err: any) {
      const errorMessage = err?.message || (isEditMode ? 'Не удалось обновить подарок' : 'Не удалось добавить подарок')
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/wishes')
  }

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

  if (!isEditMode && (!wishlistId || isNaN(wishlistId))) {
    return (
      <div className="page-container wishes-page">
        <div className="wishes-main-content">
          <div className="wishes-error">
            <p>Ошибка: Не указан вишлист</p>
            <button className="btn-retry" onClick={handleCancel}>
              Вернуться назад
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <div className="page-form-container">
          <div className="page-form-header">
            <h2>{isEditMode ? 'Редактировать подарок' : 'Добавить подарок'}</h2>
            <button className="modal-close" onClick={handleCancel}>×</button>
          </div>
          {error && (
            <div className="wishes-error">
              <p>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="page-form">
            <div className="form-group">
              <label htmlFor="wish-title">Название *</label>
              <input
                id="wish-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="Название подарка"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="wish-description">Описание</label>
              <textarea
                id="wish-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Описание подарка (необязательно)"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="wish-link">Ссылка</label>
              <input
                id="wish-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="wish-image">URL изображения (не обязательно)</label>
              <input
                id="wish-image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="https://..."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="wish-price">Цена</label>
                <input
                  id="wish-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="wish-currency">Валюта</label>
                <select
                  id="wish-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                >
                  <option value="₽">₽</option>
                  <option value="$">$</option>
                  <option value="€">€</option>
                  <option value="¥">¥</option>
                </select>
              </div>
            </div>
            <div className="page-form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Отмена
              </button>
              <button type="submit" className="btn-submit" disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? (isEditMode ? 'Сохранение...' : 'Добавление...') : (isEditMode ? 'Сохранить' : 'Добавить')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

