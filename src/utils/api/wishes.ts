/**
 * API для работы с желаниями (wishes)
 * 
 * Пример использования паттерна Repository
 */

import { ApiClient } from './client'

export interface Wish {
  id: number
  wishlist: number
  wishlist_id: number
  wishlist_name?: string
  user: number
  user_id: number
  title: string
  comment?: string
  link?: string
  image_url?: string
  price?: number
  currency?: string
  status: 'active' | 'reserved' | 'fulfilled'
  is_fulfilled: boolean
  fulfilled_by?: number
  fulfilled_at?: string
  reserved_by?: number
  reserved_by_id?: number
  gifted_by?: number
  gifted_by_id?: number
  created_at: string
  updated_at: string
  reserved_at?: string
  gifted_at?: string
  order: number
}

export interface CreateWishRequest {
  wishlist: number
  title: string
  comment?: string
  link?: string
  image_url?: string
  price?: number
  currency?: string
  order?: number
}

export interface UpdateWishRequest {
  wishlist?: number
  title?: string
  comment?: string
  link?: string
  image_url?: string
  price?: number
  currency?: string
  status?: 'active' | 'reserved' | 'fulfilled'
  reserved_by?: number | null
  order?: number
}

/**
 * Репозиторий для работы с желаниями
 */
export class WishesRepository {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  /**
   * Получает список желаний пользователя по Telegram ID
   */
  async getWishesByTelegramId(telegramId: number): Promise<Wish[]> {
    return this.apiClient.get<Wish[]>(`/api/wishes/by_telegram_id/?telegram_id=${telegramId}`)
  }

  /**
   * Получает список желаний вишлиста
   */
  async getWishesByWishlistId(wishlistId: number): Promise<Wish[]> {
    const response = await this.apiClient.get<any>(`/api/wishes/?wishlist_id=${wishlistId}`)
    // Django REST Framework возвращает объект с пагинацией, нужно извлечь results
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as Wish[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as Wish[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[WishesRepository] Неожиданный формат ответа API:', response)
    return []
  }

  /**
   * Получает список желаний пользователя по user_id
   */
  async getUserWishes(userId: number): Promise<Wish[]> {
    const response = await this.apiClient.get<any>(`/api/wishes/?user_id=${userId}`)
    // Django REST Framework возвращает объект с пагинацией, нужно извлечь results
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as Wish[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as Wish[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[WishesRepository] Неожиданный формат ответа API:', response)
    return []
  }

  /**
   * Получает список всех желаний (для ленты)
   */
  async getAllWishes(params?: { limit?: number; offset?: number }): Promise<Wish[]> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    const response = await this.apiClient.get<any>(`/api/wishes${query ? `?${query}` : ''}`)
    // Django REST Framework возвращает объект с пагинацией, нужно извлечь results
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as Wish[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as Wish[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[WishesRepository] Неожиданный формат ответа API:', response)
    return []
  }

  /**
   * Получает одно желание по ID
   */
  async getWishById(wishId: number): Promise<Wish> {
    return this.apiClient.get<Wish>(`/api/wishes/${wishId}`)
  }

  /**
   * Создает новое желание
   */
  async createWish(data: CreateWishRequest): Promise<Wish> {
    return this.apiClient.post<Wish>('/api/wishes/', data)
  }

  /**
   * Обновляет желание
   */
  async updateWish(wishId: number, data: UpdateWishRequest): Promise<Wish> {
    return this.apiClient.patch<Wish>(`/api/wishes/${wishId}/`, data)
  }

  /**
   * Удаляет желание
   */
  async deleteWish(wishId: number): Promise<void> {
    return this.apiClient.delete<void>(`/api/wishes/${wishId}/`)
  }

  /**
   * Отмечает желание как исполненное
   */
  async fulfillWish(wishId: number, giftedById?: number): Promise<Wish> {
    const data = giftedById ? { gifted_by_id: giftedById } : {}
    return this.apiClient.post<Wish>(`/api/wishes/${wishId}/fulfill/`, data)
  }

  /**
   * Отменяет исполнение желания
   */
  async unfulfillWish(wishId: number): Promise<Wish> {
    return this.apiClient.delete<Wish>(`/api/wishes/${wishId}/fulfill/`)
  }

  /**
   * Перемещает желание в другой вишлист
   */
  async moveWish(wishId: number, wishlistId: number): Promise<Wish> {
    return this.apiClient.post<Wish>(`/api/wishes/${wishId}/move/`, { wishlist_id: wishlistId })
  }

  /**
   * Получает список забронированных подарков пользователя по user_id
   */
  async getReservedWishesByUserId(userId: number): Promise<Wish[]> {
    const response = await this.apiClient.get<any>(`/api/wishes/?reserved_by=${userId}`)
    // Django REST Framework возвращает объект с пагинацией, нужно извлечь results
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as Wish[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as Wish[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[WishesRepository] Неожиданный формат ответа API:', response)
    return []
  }
}

