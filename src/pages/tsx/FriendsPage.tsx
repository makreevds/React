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
  const [viewMode, setViewMode] = useState<'subscriptions' | 'subscribers'>('subscriptions')
  const [subscriptions, setSubscriptions] = useState<User[]>([])
  const [subscribers, setSubscribers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [unsubscribing, setUnsubscribing] = useState<number | null>(null)

  // Загружаем подписки и подписчиков пользователя
  useEffect(() => {
    const loadData = async () => {
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
        console.log('Загружаем данные для пользователя с id:', dbUser.id)
        
        // Загружаем подписки
        const subs = await usersRepository.getSubscriptions(dbUser.id)
        console.log('Получены подписки:', subs)
        setSubscriptions(subs)
        
        // Загружаем подписчиков
        const subbers = await usersRepository.getSubscribers(dbUser.id)
        console.log('Получены подписчики:', subbers)
        setSubscribers(subbers)
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error)
        handleError(error, 'FriendsPage.loadData')
      } finally {
        setTimeout(() => {
          setLoading(false)
        }, 100)
      }
    }

    loadData()
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

    // Находим пользователя в списке подписок для отображения имени
    const targetUser = subscriptions.find(sub => sub.id === targetUserId)
    const userName = targetUser ? getUserDisplayName(targetUser) : 'этого пользователя'
    
    // Показываем окно подтверждения
    if (!confirm(`Вы уверены, что хотите отписаться от ${userName}?`)) {
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

  // Получаем текущий список в зависимости от режима просмотра
  const currentList = viewMode === 'subscriptions' ? subscriptions : subscribers
  const isEmpty = currentList.length === 0
  const emptyMessage = viewMode === 'subscriptions' 
    ? 'У вас пока нет подписок' 
    : 'У вас пока нет подписчиков'

  return (
    <div className="page-container">
      {/* Переключатель между подписками и подписчиками */}
      <div className="friends-segmented-control">
        <button
          className={`friends-segment ${viewMode === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setViewMode('subscriptions')}
          aria-label="Подписки"
        >
          Подписки
        </button>
        <button
          className={`friends-segment ${viewMode === 'subscribers' ? 'active' : ''}`}
          onClick={() => setViewMode('subscribers')}
          aria-label="Подписчики"
        >
          Подписчики
        </button>
      </div>

      {/* Список подписок или подписчиков */}
      {loading ? (
        <div className="friends-loading">Загрузка...</div>
      ) : isEmpty ? (
        <div className="friends-empty">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="friends-list">
          {currentList.map(user => (
            <div 
              key={user.id} 
              className="friend-row"
              onClick={() => navigate(`/user/${user.telegram_id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="friend-info">
                <div className="friend-name">{getUserDisplayName(user)}</div>
                {user.username && (
                  <div className="friend-username">{getUserUsername(user)}</div>
                )}
              </div>
              {viewMode === 'subscriptions' && (
                <button 
                  className="unsubscribe-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnsubscribe(user.id)
                  }}
                  disabled={unsubscribing === user.id}
                >
                  {unsubscribing === user.id ? 'Отписка...' : 'Отписаться'}
                </button>
              )}
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