// Компонент страницы со счетчиком
import { useState } from 'react'

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
    <div className="counter-page" style={{ 
      padding: '20px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ marginBottom: '30px' }}>Счетчик</h1>
      
      {/* Отображение текущего значения счетчика */}
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: '40px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        color: 'white',
        minWidth: '120px'
      }}>
        {count}
      </div>

      {/* Кнопки управления счетчиком */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Кнопка уменьшения */}
        <button
          onClick={decrement}
          style={{
            background: '#ff6b6b',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: '120px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ➖ Уменьшить
        </button>

        {/* Кнопка увеличения */}
        <button
          onClick={increment}
          style={{
            background: '#51cf66',
            color: 'white',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            minWidth: '120px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ➕ Увеличить
        </button>
      </div>

      {/* Кнопка возврата на главную страницу */}
      <button
        onClick={onBack}
        style={{
          background: '#4dabf7',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ← Назад на главную
      </button>
    </div>
  );
}

