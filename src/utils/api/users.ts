/**
 * API для работы с пользователями
 */

import { ApiClient } from './client'

export interface User {
  id: number
  telegram_id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  registration_time: string
  last_visit: string
  language: string
  theme_color: string
  invited_by_telegram_id?: number
  gifts_given?: number
  gifts_received?: number
  subscriptions?: number[] // Массив ID пользователей, на которых подписан
}

export interface RegisterUserRequest {
  telegram_id: number
  first_name: string
  last_name?: string
  username?: string
  language?: string
  theme_color?: string
  start_param?: string
}

/**
 * Репозиторий для работы с пользователями
 */
export class UsersRepository {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  /**
   * Регистрирует пользователя или возвращает существующего
   */
  async registerOrGet(data: RegisterUserRequest): Promise<User> {
    return this.apiClient.post<User>('/api/users/register-or-get/', data)
  }

  /**
   * Получает пользователя по Telegram ID
   */
  async getUserByTelegramId(telegramId: number): Promise<User> {
    return this.apiClient.get<User>(`/api/users/by_telegram_id/?telegram_id=${telegramId}`)
  }

  /**
   * Обновляет пользователя
   */
  async updateUser(userId: number, data: Partial<RegisterUserRequest>): Promise<User> {
    return this.apiClient.patch<User>(`/api/users/${userId}/`, data)
  }

  /**
   * Получает список подписок пользователя
   */
  async getSubscriptions(userId: number): Promise<User[]> {
    return this.apiClient.get<User[]>(`/api/users/${userId}/subscriptions/`)
  }

  /**
   * Подписывает пользователя на другого пользователя
   */
  async subscribe(userId: number, targetUserId: number): Promise<{ success: boolean }> {
    return this.apiClient.post<{ success: boolean }>(`/api/users/${userId}/subscribe/`, {
      user_id: targetUserId
    })
  }

  /**
   * Отписывает пользователя от другого пользователя
   */
  async unsubscribe(userId: number, targetUserId: number): Promise<{ success: boolean }> {
    return this.apiClient.post<{ success: boolean }>(`/api/users/${userId}/unsubscribe/`, {
      user_id: targetUserId
    })
  }

  /**
   * Получает список подписчиков пользователя
   */
  async getSubscribers(userId: number): Promise<User[]> {
    return this.apiClient.get<User[]>(`/api/users/${userId}/subscribers/`)
  }

  /**
   * Получает список всех пользователей
   */
  async getAllUsers(): Promise<User[]> {
    const response = await this.apiClient.get<any>('/api/users/')
    // Django REST Framework может возвращать объект с пагинацией, нужно извлечь results
    if (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results)) {
      return response.results as User[]
    }
    // Если это уже массив, возвращаем как есть
    if (Array.isArray(response)) {
      return response as User[]
    }
    // Если это объект без results, возвращаем пустой массив
    console.warn('[UsersRepository] Неожиданный формат ответа API:', response)
    return []
  }
}

