/**
 * Типизация для Telegram WebApp API
 * Основано на официальной документации: https://core.telegram.org/bots/webapps
 */

/**
 * Информация о пользователе Telegram
 */
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
  allows_write_to_pm?: boolean
  is_bot?: boolean
}

/**
 * Информация о чате
 */
export interface TelegramChat {
  id: number
  type: 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  photo_url?: string
}

/**
 * Параметры темы Telegram
 */
export interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

/**
 * InitData - данные, переданные при инициализации WebApp
 */
export interface TelegramInitData {
  query_id?: string
  user?: TelegramUser
  receiver?: TelegramUser
  chat?: TelegramChat
  chat_type?: string
  chat_instance?: string
  start_param?: string
  can_send_after?: number
  auth_date: number
  hash: string
}

/**
 * Небезопасные данные (не проверенные хешем)
 */
export interface TelegramInitDataUnsafe {
  query_id?: string
  user?: TelegramUser
  receiver?: TelegramUser
  chat?: TelegramChat
  chat_type?: string
  chat_instance?: string
  start_param?: string
  can_send_after?: number
  auth_date?: number
  hash?: string
}

/**
 * Основной интерфейс Telegram WebApp
 */
export interface TelegramWebApp {
  initData: string
  initDataUnsafe: TelegramInitDataUnsafe
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: TelegramThemeParams
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  isClosingConfirmationEnabled: boolean
  BackButton: TelegramBackButton
  MainButton: TelegramMainButton
  HapticFeedback: TelegramHapticFeedback
  CloudStorage: TelegramCloudStorage
  BiometricManager: TelegramBiometricManager
  ready(): void
  expand(): void
  close(): void
  sendData(data: string): void
  openLink(url: string, options?: { try_instant_view?: boolean }): void
  openTelegramLink(url: string): void
  openInvoice(url: string, callback?: (status: string) => void): void
  showPopup(params: TelegramPopupParams, callback?: (id: string) => void): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  showScanQrPopup(params: TelegramScanQrParams, callback?: (data: string) => void): void
  closeScanQrPopup(): void
  readTextFromClipboard(callback?: (text: string) => void): void
  requestWriteAccess(callback?: (granted: boolean) => void): void
  requestContact(callback?: (granted: boolean) => void): void
  enableClosingConfirmation(): void
  disableClosingConfirmation(): void
  enableVerticalSwipes(): void
  disableVerticalSwipes(): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  onEvent(eventType: string, eventHandler: () => void): void
  offEvent(eventType: string, eventHandler: () => void): void
}

/**
 * Кнопка "Назад"
 */
export interface TelegramBackButton {
  isVisible: boolean
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
}

/**
 * Главная кнопка
 */
export interface TelegramMainButton {
  text: string
  color: string
  textColor: string
  isVisible: boolean
  isActive: boolean
  isProgressVisible: boolean
  setText(text: string): void
  onClick(callback: () => void): void
  offClick(callback: () => void): void
  show(): void
  hide(): void
  enable(): void
  disable(): void
  showProgress(leaveActive?: boolean): void
  hideProgress(): void
  setParams(params: {
    text?: string
    color?: string
    text_color?: string
    is_active?: boolean
    is_visible?: boolean
  }): void
}

/**
 * Тактильная обратная связь
 */
export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
  notificationOccurred(type: 'error' | 'success' | 'warning'): void
  selectionChanged(): void
}

/**
 * Облачное хранилище
 */
export interface TelegramCloudStorage {
  setItem(key: string, value: string, callback?: (error: Error | null, success: boolean) => void): void
  getItem(key: string, callback: (error: Error | null, value: string | null) => void): void
  getItems(keys: string[], callback: (error: Error | null, values: Record<string, string>) => void): void
  removeItem(key: string, callback?: (error: Error | null, success: boolean) => void): void
  removeItems(keys: string[], callback?: (error: Error | null, success: boolean) => void): void
  getKeys(callback: (error: Error | null, keys: string[]) => void): void
}

/**
 * Биометрический менеджер
 */
export interface TelegramBiometricManager {
  isInited: boolean
  isBiometricAvailable: boolean
  biometricType: 'finger' | 'face' | 'unknown'
  isAccessRequested: boolean
  isAccessGranted: boolean
  isLocked: boolean
  init(callback?: (success: boolean) => void): void
  requestAccess(params: { reason?: string }, callback?: (granted: boolean) => void): void
  authenticate(params: { reason?: string }, callback?: (success: boolean, token?: string) => void): void
  openSettings(): void
  onBiometricAvailabilityChanged(callback: (available: boolean) => void): void
  onBiometricAuthRequested(callback: () => void): void
  onBiometricAuthSuccess(callback: () => void): void
  onBiometricAuthFailed(callback: () => void): void
  offBiometricAvailabilityChanged(callback: (available: boolean) => void): void
  offBiometricAuthRequested(callback: () => void): void
  offBiometricAuthSuccess(callback: () => void): void
  offBiometricAuthFailed(callback: () => void): void
}

/**
 * Параметры попапа
 */
export interface TelegramPopupParams {
  title?: string
  message: string
  buttons?: Array<{
    id?: string
    type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
    text?: string
  }>
}

/**
 * Параметры сканирования QR
 */
export interface TelegramScanQrParams {
  text?: string
}

/**
 * Глобальный объект Telegram в window
 */
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

