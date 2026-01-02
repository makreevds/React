// src/UserCard.tsx

// Мы описываем, что этот компонент ожидает получить данные 'user'
export function UserCard({ user }: { user: any }) {
    // Если данных нет, показываем заглушку
    if (!user) {
      return <div className="card">Загрузка данных пользователя...</div>;
    }
  
    // Если данные есть, рисуем красивый список
    return (
      <div className="card">
        <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
          <li><b>👤 Имя:</b> {user.first_name}</li>
          <li><b>🆔 ID:</b> {user.id}</li>
          <li><b>🌐 Ник:</b> @{user.username || 'скрыт'}</li>
        </ul>
      </div>
    );
  }