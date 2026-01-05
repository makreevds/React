/**
 * Компонент иконки подарка
 * Используется как placeholder когда нет изображения
 */
import giftIcon from '../../assets/gift-icon.png'

export function GiftIcon({ className }: { className?: string }) {
  return (
    <img 
      src={giftIcon}
      alt="Подарок"
      className={className}
    />
  )
}

