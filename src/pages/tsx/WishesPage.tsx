import { useEffect, useState } from 'react'
import '../css/WishesPage.css'

interface UserInfo {
  id?: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
  allows_write_to_pm?: boolean
  is_bot?: boolean
}

interface WebAppInfo {
  version?: string
  platform?: string
  colorScheme?: 'light' | 'dark'
  themeParams?: any
  isExpanded?: boolean
  viewportHeight?: number
  viewportStableHeight?: number
  headerColor?: string
  backgroundColor?: string
  isClosingConfirmationEnabled?: boolean
}

interface InitData {
  user?: UserInfo
  chat?: any
  chat_type?: string
  chat_instance?: string
  start_param?: string
  can_send_after?: number
  auth_date?: number
  hash?: string
}

export function WishesPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [webAppInfo, setWebAppInfo] = useState<WebAppInfo | null>(null)
  const [initData, setInitData] = useState<InitData | null>(null)
  const [allData, setAllData] = useState<any>(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    
    if (tg) {
      // Информация о пользователе
      const user = tg.initDataUnsafe?.user
      setUserInfo(user || null)

      // Информация о WebApp
      const webApp: WebAppInfo = {
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme,
        themeParams: tg.themeParams,
        isExpanded: tg.isExpanded,
        viewportHeight: tg.viewportHeight,
        viewportStableHeight: tg.viewportStableHeight,
        headerColor: tg.headerColor,
        backgroundColor: tg.backgroundColor,
        isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
      }
      setWebAppInfo(webApp)

      // InitData
      const data: InitData = {
        user: tg.initDataUnsafe?.user,
        chat: tg.initDataUnsafe?.chat,
        chat_type: tg.initDataUnsafe?.chat_type,
        chat_instance: tg.initDataUnsafe?.chat_instance,
        start_param: tg.initDataUnsafe?.start_param,
        can_send_after: tg.initDataUnsafe?.can_send_after,
        auth_date: tg.initDataUnsafe?.auth_date,
        hash: tg.initDataUnsafe?.hash,
      }
      setInitData(data)

      // Все данные для отладки
      setAllData({
        initDataUnsafe: tg.initDataUnsafe,
        initData: tg.initData,
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme,
        themeParams: tg.themeParams,
        isExpanded: tg.isExpanded,
        viewportHeight: tg.viewportHeight,
        viewportStableHeight: tg.viewportStableHeight,
        headerColor: tg.headerColor,
        backgroundColor: tg.backgroundColor,
        isClosingConfirmationEnabled: tg.isClosingConfirmationEnabled,
      })
    }
  }, [])

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'не указано'
    if (typeof value === 'boolean') return value ? 'да' : 'нет'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'не указано'
    return new Date(timestamp * 1000).toLocaleString('ru-RU')
  }

  return (
    <div className="page-container wishes-page">
      <h1>Информация о пользователе</h1>

      {/* Информация о пользователе */}
      {userInfo && (
        <section className="info-section">
          <h2>👤 Пользователь</h2>
          <div className="info-grid">
            {userInfo.id && (
              <div className="info-item">
                <span className="info-label">ID:</span>
                <span className="info-value">{userInfo.id}</span>
              </div>
            )}
            {userInfo.first_name && (
              <div className="info-item">
                <span className="info-label">Имя:</span>
                <span className="info-value">{userInfo.first_name}</span>
              </div>
            )}
            {userInfo.last_name && (
              <div className="info-item">
                <span className="info-label">Фамилия:</span>
                <span className="info-value">{userInfo.last_name}</span>
              </div>
            )}
            {userInfo.username && (
              <div className="info-item">
                <span className="info-label">Username:</span>
                <span className="info-value">@{userInfo.username}</span>
              </div>
            )}
            {userInfo.language_code && (
              <div className="info-item">
                <span className="info-label">Язык:</span>
                <span className="info-value">{userInfo.language_code}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Premium:</span>
              <span className="info-value">{formatValue(userInfo.is_premium)}</span>
            </div>
            {userInfo.photo_url && (
              <div className="info-item">
                <span className="info-label">Фото:</span>
                <a href={userInfo.photo_url} target="_blank" rel="noopener noreferrer" className="info-link">
                  Открыть фото
                </a>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Разрешена переписка:</span>
              <span className="info-value">{formatValue(userInfo.allows_write_to_pm)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Информация о WebApp */}
      {webAppInfo && (
        <section className="info-section">
          <h2>📱 WebApp</h2>
          <div className="info-grid">
            {webAppInfo.version && (
              <div className="info-item">
                <span className="info-label">Версия:</span>
                <span className="info-value">{webAppInfo.version}</span>
              </div>
            )}
            {webAppInfo.platform && (
              <div className="info-item">
                <span className="info-label">Платформа:</span>
                <span className="info-value">{webAppInfo.platform}</span>
              </div>
            )}
            {webAppInfo.colorScheme && (
              <div className="info-item">
                <span className="info-label">Цветовая схема:</span>
                <span className="info-value">{webAppInfo.colorScheme}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Развернуто:</span>
              <span className="info-value">{formatValue(webAppInfo.isExpanded)}</span>
            </div>
            {webAppInfo.viewportHeight && (
              <div className="info-item">
                <span className="info-label">Высота viewport:</span>
                <span className="info-value">{webAppInfo.viewportHeight}px</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">Подтверждение закрытия:</span>
              <span className="info-value">{formatValue(webAppInfo.isClosingConfirmationEnabled)}</span>
            </div>
          </div>
        </section>
      )}

      {/* InitData */}
      {initData && (
        <section className="info-section">
          <h2>🔐 InitData</h2>
          <div className="info-grid">
            {initData.start_param && (
              <div className="info-item">
                <span className="info-label">Стартовый параметр:</span>
                <span className="info-value">{initData.start_param}</span>
              </div>
            )}
            {initData.auth_date && (
              <div className="info-item">
                <span className="info-label">Дата авторизации:</span>
                <span className="info-value">{formatDate(initData.auth_date)}</span>
              </div>
            )}
            {initData.hash && (
              <div className="info-item full-width">
                <span className="info-label">Хеш:</span>
                <span className="info-value hash">{initData.hash}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Все данные в JSON */}
      {allData && (
        <section className="info-section">
          <h2>📋 Все данные (JSON)</h2>
          <pre className="json-output">{JSON.stringify(allData, null, 2)}</pre>
        </section>
      )}

      {!userInfo && !webAppInfo && (
        <p className="placeholder-text">Данные не доступны. Убедитесь, что приложение запущено в Telegram.</p>
      )}
    </div>
  )
}

