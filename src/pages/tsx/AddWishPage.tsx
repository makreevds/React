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
  const wishlistId = wishlistIdParam ? parseInt(wishlistIdParam, 10) : null

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('₽')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!wishlistId || isNaN(wishlistId)) {
      setError('Не указан вишлист')
    }
  }, [wishlistId])

  // Скрываем нижний навбар, когда открыта клавиатура (фокус на поле ввода)
  useEffect(() => {
    const isFormElement = (el: Element | null) => {
      if (!el) return false
      const tag = el.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select'
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (isFormElement(event.target as Element)) {
        document.body.classList.add('keyboard-open')
      }
    }

    const handleFocusOut = () => {
      setTimeout(() => {
        if (!isFormElement(document.activeElement)) {
          document.body.classList.remove('keyboard-open')
        }
      }, 50)
    }

    window.addEventListener('focusin', handleFocusIn)
    window.addEventListener('focusout', handleFocusOut)

    return () => {
      document.body.classList.remove('keyboard-open')
      window.removeEventListener('focusin', handleFocusIn)
      window.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !wishesRepo || !wishlistId) return

    setIsSubmitting(true)
    setError(null)
    try {
      await wishesRepo.createWish({
        wishlist: wishlistId,
        title: title.trim(),
        description: description.trim() || undefined,
        link: link.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: currency || '₽',
      })
      // Возвращаемся на страницу желаний после успешного создания
      navigate('/wishes')
    } catch (err: any) {
      const errorMessage = err?.message || 'Не удалось добавить подарок'
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/wishes')
  }

  if (!wishlistId || isNaN(wishlistId)) {
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
            <h2>Добавить подарок</h2>
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
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="wish-currency">Валюта</label>
                <select
                  id="wish-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
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
                {isSubmitting ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

