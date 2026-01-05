import '../css/FriendsPage.css'
import { useTelegramWebApp } from '../../hooks/useTelegramWebApp'
import { useErrorHandler } from '../../hooks/useErrorHandler'

export function FriendsPage() {
  const { webApp, getUserId } = useTelegramWebApp()
  const { handleError } = useErrorHandler(webApp || undefined)

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

  // Фейковые данные для теста верстки
  const friendsInApp = [
    { id: 1, name: 'Алексей', username: '@alex_dev' },
    { id: 2, name: 'Мария', username: '@mary_design' }
  ];

  return (
    <div className="page-container">
      <h1>Друзья</h1>

      {/* Список тех, кто уже в БД */}
      <div className="friends-list">
        {friendsInApp.map(friend => (
          <div key={friend.id} className="friend-row">
             <div className="friend-info">
                <div className="friend-name">{friend.name}</div>
                <div className="friend-username">{friend.username}</div>
             </div>
             <button className="unsubscribe-btn">Отписаться</button>
          </div>
        ))}
      </div>

      {/* Секция приглашения, если кого-то нет */}
      <div className="invite-section">
        {/* <p className="placeholder-text">
          Пригласи друзей!
        </p> */}
        <button className="invite-main-btn" onClick={handleInvite}>
          Пригласить друзей
        </button>
      </div>
    </div>
  );
}