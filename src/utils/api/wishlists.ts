/**
 * API для работы с вишлистами (wishlists)
 */

import { ApiClient } from './client'

export interface Wishlist {
  id: number
  user: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  order: number
  wishes_count: number
}

export interface CreateWishlistRequest {
  name: string
  description?: string
  order?: number
  telegram_id: number
}

export interface UpdateWishlistRequest {
  name?: string
  description?: string
  order?: number
}

/**
 * Репозиторий для работы с вишлистами
 */
export class WishlistsRepository {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  /**
   * Получает список вишлистов пользователя по Telegram ID
   */
  async getWishlistsByTelegramId(telegramId: number): Promise<Wishlist[]> {
    const response = await this.apiClient.get<any>(`/api/wishlists/by_telegram_id/?telegram_id=${telegramId}`)
    // Django REST Framework может возвращать объект с пагинацией, нужно извлечь results
    // Но для кастомных action (by_telegram_id) обычно возвращается массив напрямую
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as Wishlist[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as Wishlist[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[WishlistsRepository] Неожиданный формат ответа API:', response)
    return []
  }

  /**
   * Получает список вишлистов пользователя по user_id
   */
  async getWishlistsByUserId(userId: number): Promise<Wishlist[]> {
    const response = await this.apiClient.get<any>(`/api/wishlists/?user_id=${userId}`)
    // Django REST Framework может возвращать объект с пагинацией, нужно извлечь results
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as Wishlist[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as Wishlist[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[WishlistsRepository] Неожиданный формат ответа API:', response)
    return []
  }

  /**
   * Получает один вишлист по ID
   */
  async getWishlistById(wishlistId: number): Promise<Wishlist> {
    return this.apiClient.get<Wishlist>(`/api/wishlists/${wishlistId}/`)
  }

  /**
   * Создает новый вишлист
   */
  async createWishlist(data: CreateWishlistRequest): Promise<Wishlist> {
    return this.apiClient.post<Wishlist>('/api/wishlists/', data)
  }

  /**
   * Обновляет вишлист
   */
  async updateWishlist(wishlistId: number, data: UpdateWishlistRequest): Promise<Wishlist> {
    return this.apiClient.patch<Wishlist>(`/api/wishlists/${wishlistId}/`, data)
  }

  /**
   * Удаляет вишлист
   */
  async deleteWishlist(wishlistId: number): Promise<void> {
    return this.apiClient.delete<void>(`/api/wishlists/${wishlistId}/`)
  }
}

