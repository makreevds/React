import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../css/WishesPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useApiContext } from '../../contexts/ApiContext'

/**
 * Страница для добавления или редактирования вишлиста
 */
export function AddWishlistPage() {
  const { user, webApp } = useTelegramWebApp()
  const apiContext = useApiContext()
  const wishlistsRepo = apiContext?.wishlists
  const wishesRepo = apiContext?.wishes
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const wishlistId = searchParams.get('wishlistId')
  const isEditMode = !!wishlistId

  // Параметры подарка для копирования (если создаем вишлист с подарком)
  const wishTitle = searchParams.get('title') || ''
  const wishComment = searchParams.get('comment') || ''
  const wishLink = searchParams.get('link') || ''
  const wishImageUrl = searchParams.get('image_url') || ''
  const wishPrice = searchParams.get('price') || ''
  const wishCurrency = searchParams.get('currency') || '₽'
  const hasWishData = !!wishTitle


  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(isEditMode)

  // Загружаем данные вишлиста при редактировании
  useEffect(() => {
    const loadWishlist = async () => {
      if (!isEditMode || !wishlistId || !wishlistsRepo) {
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
        // Форматируем дату для input[type="date"]
        if (wishlist.event_date) {
          const date = new Date(wishlist.event_date)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          setEventDate(`${year}-${month}-${day}`)
        } else {
          setEventDate('')
        }
      } catch (err) {
        console.error('Ошибка при загрузке вишлиста:', err)
        alert('Не удалось загрузить вишлист')
        navigate('/wishes')
      } finally {
        setTimeout(() => {
          setIsLoading(false)
        }, 100)
      }
    }

    loadWishlist()
  }, [isEditMode, wishlistId, wishlistsRepo, navigate])

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

  // Управление кнопкой "Назад" в Telegram
  useEffect(() => {
    if (!webApp?.BackButton) {
      return
    }

    const backButton = webApp.BackButton
    const handleBackClick = () => {
      navigate(-1)
    }

    // Показываем кнопку "Назад"
    backButton.show()
    // Устанавливаем обработчик клика
    backButton.onClick(handleBackClick)

    // При размонтировании скрываем кнопку и удаляем обработчик
    return () => {
      backButton.offClick(handleBackClick)
      backButton.hide()
    }
  }, [webApp, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !wishlistsRepo) return

    if (isEditMode) {
      // Редактирование существующего вишлиста
      if (!wishlistId) return
      setIsSubmitting(true)
      try {
        const wishlistIdNum = parseInt(wishlistId, 10)
        await wishlistsRepo.updateWishlist(wishlistIdNum, {
          name: name.trim(),
          description: description.trim() || undefined,
          event_date: eventDate || undefined,
        })
        // Возвращаемся на страницу конкретного вишлиста
        navigate(`/wishes/wishlist/${wishlistIdNum}`)
      } catch (err) {
        alert('Не удалось обновить вишлист')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      // Создание нового вишлиста
      if (!user) return
      setIsSubmitting(true)
      try {
        const newWishlist = await wishlistsRepo.createWishlist({
          name: name.trim(),
          description: description.trim() || undefined,
          event_date: eventDate || undefined,
          telegram_id: user.id,
        })
        
        // Получаем ID созданного вишлиста
        const wishlistId = newWishlist.id
        
        // Если есть данные подарка - создаем подарок в новом вишлисте
        if (hasWishData && wishesRepo && wishlistId) {
          try {
            await wishesRepo.createWish({
              wishlist: wishlistId,
              title: wishTitle.trim(),
              comment: wishComment.trim() || undefined,
              link: wishLink || undefined,
              image_url: wishImageUrl || undefined,
              price: wishPrice ? parseFloat(wishPrice) : undefined,
              currency: wishCurrency || '₽',
            })
            // Переходим на страницу нового вишлиста после успешного создания подарка
            navigate(`/wishes/wishlist/${wishlistId}`)
          } catch (wishErr) {
            console.error('Ошибка при создании подарка:', wishErr)
            alert('Вишлист создан, но не удалось добавить подарок. Попробуйте добавить его вручную.')
            // Вишлист создан, но подарок не создан - все равно переходим на страницу вишлиста
            navigate(`/wishes/wishlist/${wishlistId}`)
          }
        } else {
          navigate('/wishes')
        }
      } catch (err) {
        alert('Не удалось создать вишлист')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDelete = async () => {
    if (!isEditMode || !wishlistId || !wishlistsRepo) return

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

  const handleCancel = () => {
    // Если редактируем вишлист - возвращаемся на страницу вишлиста, иначе на список вишлистов
    if (isEditMode && wishlistId) {
      const wishlistIdNum = parseInt(wishlistId, 10)
      if (!isNaN(wishlistIdNum)) {
        navigate(`/wishes/wishlist/${wishlistIdNum}`)
        return
      }
    }
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

  return (
    <div className="page-container wishes-page">
      <div className="wishes-main-content">
        <div className="page-form-container">
          <div className="page-form-header">
            <h2>{isEditMode ? 'Редактировать вишлист' : 'Добавить вишлист'}</h2>
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
            <div className="form-group">
              <label htmlFor="wishlist-event-date">Дата события (необязательно)</label>
              <div className="form-example">Пример: 15 января 2024</div>
              <input
                id="wishlist-event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
            <div className="page-form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Отмена
              </button>
              <button type="submit" className="btn-submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting 
                  ? (isEditMode ? 'Сохранение...' : 'Создание...') 
                  : (isEditMode ? 'Сохранить' : 'Создать')}
              </button>
            </div>
            {isEditMode && (
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
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

