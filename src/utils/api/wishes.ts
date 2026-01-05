/**
 * API для работы с желаниями (wishes)
 * 
 * Пример использования паттерна Repository
 */

import { ApiClient } from './client'

export interface Wish {
  id: number
  title: string
  description?: string
  link?: string
  image_url?: string
  price?: number
  currency?: string
  is_fulfilled: boolean
  fulfilled_by?: number
  fulfilled_at?: string
  created_at: string
  updated_at: string
  user_id: number
}

export interface CreateWishRequest {
  title: string
  description?: string
  link?: string
  image_url?: string
  price?: number
  currency?: string
}

export interface UpdateWishRequest {
  title?: string
  description?: string
  link?: string
  image_url?: string
  price?: number
  currency?: string
}

/**
 * Репозиторий для работы с желаниями
 */
export class WishesRepository {
  constructor(private apiClient: ApiClient) {}

  /**
   * Получает список желаний пользователя
   */
  async getUserWishes(userId: number): Promise<Wish[]> {
    return this.apiClient.get<Wish[]>(`/api/users/${userId}/wishes`)
  }

  /**
   * Получает список всех желаний (для ленты)
   */
  async getAllWishes(params?: { limit?: number; offset?: number }): Promise<Wish[]> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const query = queryParams.toString()
    return this.apiClient.get<Wish[]>(`/api/wishes${query ? `?${query}` : ''}`)
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
    return this.apiClient.post<Wish>('/api/wishes', data)
  }

  /**
   * Обновляет желание
   */
  async updateWish(wishId: number, data: UpdateWishRequest): Promise<Wish> {
    return this.apiClient.patch<Wish>(`/api/wishes/${wishId}`, data)
  }

  /**
   * Удаляет желание
   */
  async deleteWish(wishId: number): Promise<void> {
    return this.apiClient.delete<void>(`/api/wishes/${wishId}`)
  }

  /**
   * Отмечает желание как исполненное
   */
  async fulfillWish(wishId: number): Promise<Wish> {
    return this.apiClient.post<Wish>(`/api/wishes/${wishId}/fulfill`)
  }

  /**
   * Отменяет исполнение желания
   */
  async unfulfillWish(wishId: number): Promise<Wish> {
    return this.apiClient.delete<Wish>(`/api/wishes/${wishId}/fulfill`)
  }
}

