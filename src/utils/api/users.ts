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
  registration_time: string
  last_visit: string
  language: string
  theme_color: string
  invited_by_telegram_id?: number
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
    return this.apiClient.post<User>('/api/users/register_or_get/', data)
  }

  /**
   * Получает пользователя по ID
   */
  async getUserById(userId: number): Promise<User> {
    return this.apiClient.get<User>(`/api/users/${userId}/`)
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
}

