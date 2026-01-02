import { Link } from 'react-router-dom'
import { UserCard } from './UserCard'
import './HomePage.css'

interface HomePageProps {
  userData: any;
  onClose: () => void;
}

export function HomePage({ userData, onClose }: HomePageProps) {
  return (
    <div className="home-page">
      <h1>Привет, {userData ? userData.first_name : 'Пользователь'}!</h1>
      
      <div className="card">
        <UserCard user={userData} />
      </div>

      <div className="button-group">
        <Link 
          to="/counter" 
          className="btn btn-primary"
        >
          🔢 Открыть счетчик
        </Link>

        <button 
          onClick={onClose} 
          className="btn btn-danger"
        >
          Закрыть приложение
        </button>
      </div>
    </div>
  );
}

