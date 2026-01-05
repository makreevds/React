/**
 * Экспорт всех API репозиториев и клиента
 */

export { ApiClient, ApiClientError, createApiClient } from './client'
export type { ApiError, ApiResponse, ApiClientConfig, RequestOptions } from './client'

export { WishesRepository } from './wishes'
export type { Wish, CreateWishRequest, UpdateWishRequest } from './wishes'

export { FriendsRepository } from './friends'
export type { Friend, FriendRequest } from './friends'

/**
 * Создает все репозитории с общим API клиентом
 */
export function createRepositories(apiClient: ApiClient) {
  return {
    wishes: new WishesRepository(apiClient),
    friends: new FriendsRepository(apiClient),
  }
}

