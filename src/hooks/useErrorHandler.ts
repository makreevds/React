import { useCallback } from 'react'
import { getErrorMessage, logError, handleError } from '../utils/errorHandler'
import type { TelegramWebApp } from '../types/telegram'

/**
 * Хук для обработки ошибок с интеграцией Telegram WebApp
 * 
 * @param webApp Экземпляр Telegram WebApp (опционально)
 * @returns Функции для обработки ошибок
 */
export function useErrorHandler(webApp?: TelegramWebApp | null) {
  /**
   * Обрабатывает ошибку и показывает уведомление пользователю
   */
  const handleErrorWithNotification = useCallback(
    (error: unknown, context?: string) => {
      const { message } = handleError(error, context)

      // Показываем алерт через Telegram WebApp, если доступен
      if (webApp) {
        webApp.showAlert(message)
      } else {
        // Fallback для браузера
        alert(message)
      }

      return message
    },
    [webApp]
  )

  /**
   * Обрабатывает ошибку без уведомления (только логирование)
   */
  const handleErrorSilent = useCallback((error: unknown, context?: string) => {
    return handleError(error, context)
  }, [])

  /**
   * Получает сообщение об ошибке
   */
  const getError = useCallback((error: unknown): string => {
    return getErrorMessage(error)
  }, [])

  /**
   * Логирует ошибку
   */
  const log = useCallback((error: unknown, context?: string) => {
    logError(error, context)
  }, [])

  return {
    handleError: handleErrorWithNotification,
    handleErrorSilent,
    getError,
    log,
  }
}

