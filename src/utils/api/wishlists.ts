/**
 * API для работы с вишлистами (wishlists)
 */

import { ApiClient } from './client'

export interface Wishlist {
  id: number
  user: number
  name: string
  description?: string
  is_public: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  order: number
  wishes_count: number
}

export interface CreateWishlistRequest {
  name: string
  description?: string
  is_public?: boolean
  is_default?: boolean
  order?: number
  telegram_id: number
}

export interface UpdateWishlistRequest {
  name?: string
  description?: string
  is_public?: boolean
  is_default?: boolean
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
    return this.apiClient.get<Wishlist[]>(`/api/wishlists/by_telegram_id/?telegram_id=${telegramId}`)
  }

  /**
   * Получает список вишлистов пользователя по user_id
   */
  async getWishlistsByUserId(userId: number): Promise<Wishlist[]> {
    return this.apiClient.get<Wishlist[]>(`/api/wishlists/?user_id=${userId}`)
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

  /**
   * Устанавливает вишлист как вишлист по умолчанию
   */
  async setDefault(wishlistId: number): Promise<Wishlist> {
    return this.apiClient.post<Wishlist>(`/api/wishlists/${wishlistId}/set_default/`)
  }
}

