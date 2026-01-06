import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'

/**
 * Страница для добавления нового вишлиста
 */
export function AddWishlistPage() {
  const { user } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // Небольшая задержка, чтобы дождаться перехода фокуса
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
    if (!name.trim() || !user || !wishlistsRepo) return

    setIsSubmitting(true)
    try {
      await wishlistsRepo.createWishlist({
        name: name.trim(),
        description: description.trim() || undefined,
        telegram_id: user.id,
      })
      // Возвращаемся на страницу желаний после успешного создания
      navigate('/wishes')
    } catch (err) {
      alert('Не удалось создать вишлист')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/wishes')
  }

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <div className="page-form-container">
          <div className="page-form-header">
            <h2>Добавить вишлист</h2>
            <button className="modal-close" onClick={handleCancel}>×</button>
          </div>
          <form onSubmit={handleSubmit} className="page-form">
            <div className="form-group">
              <label htmlFor="wishlist-name">Название *</label>
              <input
                id="wishlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Например: День рождения"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="wishlist-description">Описание</label>
              <textarea
                id="wishlist-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание вишлиста (необязательно)"
                rows={3}
              />
            </div>
            <div className="page-form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Отмена
              </button>
              <button type="submit" className="btn-submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

