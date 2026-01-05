/**
 * Компонент SVG иконки подарка
 * Используется как placeholder когда нет изображения
 */
export function GiftIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 64 64" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="29" fill="currentColor" opacity="0.15"/>
      <path d="M61,32c0-.335-.014-.667-.025-1H3.025c-.011.333-.025.665-.025,1s.014.667.025,1h57.95C60.986,32.667,61,32.335,61,32Z" fill="currentColor"/>
      <path d="M31,3.025v57.95c.333.011.665.025,1,.025s.667-.014,1-.025V3.025C32.667,3.014,32.335,3,32,3S31.333,3.014,31,3.025Z" fill="currentColor"/>
      <polygon points="30 32 35 27 50 41.167 45 47 30 32" fill="currentColor" opacity="0.8"/>
      <polygon points="34 32 29 27 14 41.167 19 47 34 32" fill="currentColor" opacity="0.8"/>
      <rect height="6" width="6" x="29" y="27" fill="currentColor"/>
      <polygon points="19 29 29 33 29 27 22 23 19 29" fill="currentColor" opacity="0.6"/>
      <polygon points="45 29 35 33 35 27 42 23 45 29" fill="currentColor" opacity="0.6"/>
    </svg>
  )
}

