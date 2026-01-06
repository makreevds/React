import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'

/**
 * Страница для редактирования вишлиста
 */
export function EditWishlistPage() {
  const { user } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const wishlistId = searchParams.get('wishlistId')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Загружаем данные вишлиста при монтировании
  useEffect(() => {
    const loadWishlist = async () => {
      if (!wishlistId || !wishlistsRepo) {
        setIsLoading(false)
        return
      }

      try {
        const wishlistIdNum = parseInt(wishlistId, 10)
        if (isNaN(wishlistIdNum)) {
          navigate('/wishes')
          return
        }

        const wishlist = await wishlistsRepo.getWishlistById(wishlistIdNum)
        setName(wishlist.name || '')
        setDescription(wishlist.description || '')
      } catch (err) {
        console.error('Ошибка при загрузке вишлиста:', err)
        alert('Не удалось загрузить вишлист')
        navigate('/wishes')
      } finally {
        setIsLoading(false)
      }
    }

    loadWishlist()
  }, [wishlistId, wishlistsRepo, navigate])

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
    if (!name.trim() || !wishlistId || !wishlistsRepo) return

    setIsSubmitting(true)
    try {
      const wishlistIdNum = parseInt(wishlistId, 10)
      await wishlistsRepo.updateWishlist(wishlistIdNum, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      // Возвращаемся на страницу желаний после успешного обновления
      navigate('/wishes')
    } catch (err) {
      alert('Не удалось обновить вишлист')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/wishes')
  }

  const handleDelete = async () => {
    if (!wishlistId || !wishlistsRepo) return

    if (!confirm('Вы уверены, что хотите удалить этот вишлист? Все подарки в нём также будут удалены.')) {
      return
    }

    try {
      const wishlistIdNum = parseInt(wishlistId, 10)
      await wishlistsRepo.deleteWishlist(wishlistIdNum)
      navigate('/wishes')
    } catch (err) {
      alert('Не удалось удалить вишлист')
    }
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

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <div className="page-form-container">
          <div className="page-form-header">
            <h2>Редактировать вишлист</h2>
            <button className="modal-close" onClick={handleCancel}>×</button>
          </div>
          <form onSubmit={handleSubmit} className="page-form">
            <div className="form-group">
              <label htmlFor="wishlist-name">Название *</label>
              <div className="form-example">Пример: День Рождения</div>
              <input
                id="wishlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                required
                placeholder="(Обязательно)"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="wishlist-description">Описание</label>
              <div className="form-example">Пример: Самое необходимое для меня</div>
              <textarea
                id="wishlist-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="(Необязательно)"
                rows={3}
              />
            </div>
            <div className="page-form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Отмена
              </button>
              <button type="submit" className="btn-submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--theme-current-hint-light, var(--theme-hint-color-light))' }}>
              <button 
                type="button" 
                className="btn-delete-wishlist"
                onClick={handleDelete}
                style={{ width: '100%' }}
              >
                Удалить вишлист
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

