// Компонент страницы со счетчиком
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CounterPage.css'

export function CounterPage() {
  const navigate = useNavigate();
  // Состояние счетчика: начальное значение 0
  const [count, setCount] = useState<number>(0);

  // Функция для увеличения счетчика
  const increment = () => {
    setCount(count + 1);
  };

  // Функция для уменьшения счетчика
  const decrement = () => {
    setCount(count - 1);
  };

  return (
    <div className="counter-page">
      <h1>Счетчик</h1>
      
      {/* Отображение текущего значения счетчика */}
      <div className="counter-display">
        {count}
      </div>

      {/* Кнопки управления счетчиком */}
      <div className="counter-controls">
        {/* Кнопка уменьшения */}
        <button
          onClick={decrement}
          className="btn-counter btn-decrement"
        >
          ➖ Уменьшить
        </button>

        {/* Кнопка увеличения */}
        <button
          onClick={increment}
          className="btn-counter btn-increment"
        >
          ➕ Увеличить
        </button>
      </div>

      {/* Кнопка возврата на главную страницу */}
      <button
        onClick={() => navigate('/')}
        className="btn-back"
      >
        ← Назад на главную
      </button>
    </div>
  );
}

