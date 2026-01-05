import { useMemo } from 'react'
import { createApiClient, createRepositories, type ApiClientConfig } from '../utils/api'

// Реэкспортируем тип для использования в других модулях
export type { ApiClientConfig }

/**
 * Хук для работы с API
 * 
 * Создает экземпляр API клиента и репозиториев
 * 
 * @param config Конфигурация API клиента
 * @returns Объект с репозиториями и клиентом
 */
export function useApi(config: ApiClientConfig) {
  const api = useMemo(() => {
    const client = createApiClient(config)
    return {
      client,
      ...createRepositories(client),
    }
  }, [config.baseUrl, config.timeout])

  return api
}

