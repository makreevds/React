import { useEffect, useState, useCallback } from 'react'
import type { TelegramWebApp, TelegramUser, TelegramInitDataUnsafe } from '../types/telegram'

/**
 * Хук для работы с Telegram WebApp API
 * 
 * @returns Объект с методами и данными Telegram WebApp
 * @throws {Error} Если Telegram WebApp недоступен
 */
export function useTelegramWebApp() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [initData, setInitData] = useState<TelegramInitDataUnsafe | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp

      if (!tg) {
        const err = new Error('Telegram WebApp API недоступен. Убедитесь, что приложение запущено в Telegram.')
        setError(err)
        console.warn(err.message)
        return
      }

      setWebApp(tg)
      setUser(tg.initDataUnsafe?.user || null)
      setInitData(tg.initDataUnsafe || null)
      setIsReady(true)
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Неизвестная ошибка при инициализации Telegram WebApp')
      setError(error)
      console.error('Ошибка инициализации Telegram WebApp:', error)
    }
  }, [])

  /**
   * Инициализирует WebApp (вызывает tg.ready())
   */
  const ready = useCallback(() => {
    webApp?.ready()
  }, [webApp])

  /**
   * Разворачивает WebApp на весь экран
   */
  const expand = useCallback(() => {
    webApp?.expand()
  }, [webApp])

  /**
   * Закрывает WebApp
   */
  const close = useCallback(() => {
    webApp?.close()
  }, [webApp])

  /**
   * Отправляет данные боту
   */
  const sendData = useCallback((data: string) => {
    if (!webApp) {
      throw new Error('WebApp не инициализирован')
    }
    webApp.sendData(data)
  }, [webApp])

  /**
   * Открывает ссылку
   */
  const openLink = useCallback((url: string, options?: { try_instant_view?: boolean }) => {
    if (!webApp) {
      throw new Error('WebApp не инициализирован')
    }
    webApp.openLink(url, options)
  }, [webApp])

  /**
   * Открывает Telegram ссылку
   */
  const openTelegramLink = useCallback((url: string) => {
    if (!webApp) {
      throw new Error('WebApp не инициализирован')
    }
    webApp.openTelegramLink(url)
  }, [webApp])

  /**
   * Показывает алерт
   */
  const showAlert = useCallback((message: string, callback?: () => void) => {
    if (!webApp) {
      throw new Error('WebApp не инициализирован')
    }
    webApp.showAlert(message, callback)
  }, [webApp])

  /**
   * Показывает подтверждение
   */
  const showConfirm = useCallback((message: string, callback?: (confirmed: boolean) => void) => {
    if (!webApp) {
      throw new Error('WebApp не инициализирован')
    }
    webApp.showConfirm(message, callback)
  }, [webApp])

  /**
   * Получает ID пользователя
   */
  const getUserId = useCallback((): number | null => {
    return user?.id || null
  }, [user])

  /**
   * Получает стартовый параметр (ID пригласившего)
   */
  const getStartParam = useCallback((): string | null => {
    return initData?.start_param || null
  }, [initData])

  return {
    webApp,
    user,
    initData,
    isReady,
    error,
    ready,
    expand,
    close,
    sendData,
    openLink,
    openTelegramLink,
    showAlert,
    showConfirm,
    getUserId,
    getStartParam,
  }
}

