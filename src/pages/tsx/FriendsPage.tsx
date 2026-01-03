import '../css/FriendsPage.css'

export function FriendsPage() {
  const tg = window.Telegram.WebApp;

  // Тот самый метод для приглашения
  const handleInvite = () => {
    const inviteLink = `https://t.me/your_bot_username/app`; 
    const message = "Зацени мой вишлист в Telegram! Добавляй свои желания тоже 🎁";
    
    // Открываем нативное окно шеринга
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(message)}`);
  };

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
             <button className="view-btn">Отписаться</button>
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