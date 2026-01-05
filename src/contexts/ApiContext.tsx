import { createContext, useContext, type ReactNode } from 'react'
import { useApi, type ApiClientConfig } from '../hooks/useApi'
import type { WishesRepository, WishlistsRepository, FriendsRepository, UsersRepository, ApiClient } from '../utils/api'

interface ApiContextValue {
  wishes: WishesRepository
  wishlists: WishlistsRepository
  friends: FriendsRepository
  users: UsersRepository
  client: ApiClient
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined)

interface ApiProviderProps {
  children: ReactNode
  config: ApiClientConfig
}

/**
 * Провайдер для API контекста
 * 
 * Предоставляет доступ к API репозиториям через контекст
 */
export function ApiProvider({ children, config }: ApiProviderProps) {
  const api = useApi(config)

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  )
}

/**
 * Хук для использования API в компонентах
 * 
 * @throws {Error} Если используется вне ApiProvider
 */
export function useApiContext() {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApiContext должен использоваться внутри ApiProvider')
  }
  return context
}

