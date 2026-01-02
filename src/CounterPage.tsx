// Компонент страницы со счетчиком
import { useState } from 'react'
import './CounterPage.css'

interface CounterPageProps {
  onBack: () => void; // Функция для возврата на главную страницу
}

export function CounterPage({ onBack }: CounterPageProps) {
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
        onClick={onBack}
        className="btn-back"
      >
        ← Назад на главную
      </button>
    </div>
  );
}

