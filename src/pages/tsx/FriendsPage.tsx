import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/FriendsPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useErrorHandler } from '../../hooks/useErrorHandler'
import { useApiContext } from '../../contexts/ApiContext'
import type { User } from '../../utils/api/users'

export function FriendsPage() {
  const { webApp, getUserId, user: currentUser } = useTelegramWebApp()
  const { handleError } = useErrorHandler(webApp || undefined)
  const { users: usersRepository } = useApiContext()
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [unsubscribing, setUnsubscribing] = useState<number | null>(null)

  // Загружаем подписки пользователя
  useEffect(() => {
    const loadSubscriptions = async () => {
      // currentUser из Telegram содержит telegram_id, а не id из БД
      // Нужно получить пользователя из БД по telegram_id
      const telegramId = currentUser?.id
      if (!telegramId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Получаем пользователя из БД по telegram_id
        const dbUser = await usersRepository.getUserByTelegramId(telegramId)
        console.log('Загружаем подписки для пользователя с id:', dbUser.id)
        // Теперь используем id из БД
        const subs = await usersRepository.getSubscriptions(dbUser.id)
        console.log('Получены подписки:', subs)
        setSubscriptions(subs)
      } catch (error) {
        console.error('Ошибка при загрузке подписок:', error)
        handleError(error, 'FriendsPage.loadSubscriptions')
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptions()
  }, [currentUser?.id])

  // Тот самый метод для приглашения
  const handleInvite = () => {
    if (!webApp) {
      handleError(new Error('Telegram WebApp недоступен'), 'FriendsPage')
      return
    }

    try {
      // Получаем ID текущего пользователя
      const userId = getUserId()
      
      // Используем ?start= чтобы создать чат с ботом
      // Бот должен отправлять кнопку с WebApp после команды /start
      // Параметр передастся автоматически через start_param
      const botUsername = 'react_my_test_bot' // TODO: вынести в конфигурацию
      const inviteLink = userId 
        ? `https://t.me/${botUsername}?start=${userId}`
        : `https://t.me/${botUsername}`
      
      const message = "Зацени мой вишлист в Telegram! Добавляй свои желания тоже 🎁"
      
      // Открываем нативное окно шеринга
      webApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`
      )
    } catch (error) {
      handleError(error, 'FriendsPage.handleInvite')
    }
  }

  // Обработчик отписки
  const handleUnsubscribe = async (targetUserId: number) => {
    const telegramId = currentUser?.id
    if (!telegramId) {
      return
    }

    try {
      setUnsubscribing(targetUserId)
      // Получаем пользователя из БД по telegram_id
      const dbUser = await usersRepository.getUserByTelegramId(telegramId)
      await usersRepository.unsubscribe(dbUser.id, targetUserId)
      // Удаляем пользователя из списка
      setSubscriptions(prev => prev.filter(sub => sub.id !== targetUserId))
    } catch (error) {
      handleError(error, 'FriendsPage.handleUnsubscribe')
    } finally {
      setUnsubscribing(null)
    }
  }

  // Форматирование имени пользователя
  const getUserDisplayName = (user: User): string => {
    if (user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.first_name
  }

  // Форматирование username
  const getUserUsername = (user: User): string => {
    return user.username ? `@${user.username}` : ''
  }

  return (
    <div className="page-container">
      <h1>Друзья</h1>

      {/* Список подписок */}
      {loading ? (
        <div className="friends-loading">Загрузка...</div>
      ) : subscriptions.length === 0 ? (
        <div className="friends-empty">
          <p>У вас пока нет подписок</p>
        </div>
      ) : (
        <div className="friends-list">
          {subscriptions.map(subscription => (
            <div 
              key={subscription.id} 
              className="friend-row"
              onClick={() => navigate(`/user/${subscription.telegram_id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="friend-info">
                <div className="friend-name">{getUserDisplayName(subscription)}</div>
                {subscription.username && (
                  <div className="friend-username">{getUserUsername(subscription)}</div>
                )}
              </div>
              <button 
                className="unsubscribe-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUnsubscribe(subscription.id)
                }}
                disabled={unsubscribing === subscription.id}
              >
                {unsubscribing === subscription.id ? 'Отписка...' : 'Отписаться'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Секция приглашения */}
      <div className="invite-section">
        <button className="invite-main-btn" onClick={handleInvite}>
          Пригласить друзей
        </button>
      </div>
    </div>
  );
}