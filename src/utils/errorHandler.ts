/**
 * Утилиты для обработки ошибок
 */

import { ApiClientError } from './api/client'

/**
 * Получает понятное сообщение об ошибке для пользователя
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Проблема с подключением к интернету. Проверьте соединение.'
      case 'TIMEOUT':
        return 'Запрос занял слишком много времени. Попробуйте еще раз.'
      case 'UNAUTHORIZED':
        return 'Необходима авторизация. Пожалуйста, войдите в систему.'
      case 'FORBIDDEN':
        return 'У вас нет доступа к этому ресурсу.'
      case 'NOT_FOUND':
        return 'Запрашиваемый ресурс не найден.'
      case 'SERVER_ERROR':
        return 'Ошибка на сервере. Попробуйте позже.'
      default:
        return error.message || 'Произошла ошибка. Попробуйте еще раз.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Произошла неизвестная ошибка. Попробуйте еще раз.'
}

/**
 * Логирует ошибку в консоль (только в development)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    const prefix = context ? `[${context}]` : '[Error]'
    console.error(prefix, error)
    
    if (error instanceof ApiClientError) {
      console.error('API Error Details:', {
        message: error.message,
        code: error.code,
        status: error.status,
      })
    }
  }
}

/**
 * Обрабатывает ошибку и возвращает объект с сообщением
 */
export function handleError(error: unknown, context?: string): {
  message: string
  error: unknown
} {
  logError(error, context)
  return {
    message: getErrorMessage(error),
    error,
  }
}

