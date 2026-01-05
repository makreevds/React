/**
 * API для работы с друзьями
 */

import { ApiClient } from './client'

export interface Friend {
  id: number
  user_id: number
  friend_id: number
  friend_name: string
  friend_username?: string
  friend_photo_url?: string
  created_at: string
}

export interface FriendRequest {
  id: number
  from_user_id: number
  to_user_id: number
  from_user_name: string
  from_user_username?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

/**
 * Репозиторий для работы с друзьями
 */
export class FriendsRepository {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  /**
   * Получает список друзей пользователя
   */
  async getUserFriends(userId: number): Promise<Friend[]> {
    return this.apiClient.get<Friend[]>(`/api/users/${userId}/friends`)
  }

  /**
   * Получает список заявок в друзья
   */
  async getFriendRequests(userId: number): Promise<FriendRequest[]> {
    return this.apiClient.get<FriendRequest[]>(`/api/users/${userId}/friend-requests`)
  }

  /**
   * Отправляет заявку в друзья
   */
  async sendFriendRequest(_userId: number, friendId: number): Promise<FriendRequest> {
    return this.apiClient.post<FriendRequest>('/api/friend-requests', {
      to_user_id: friendId,
    })
  }

  /**
   * Принимает заявку в друзья
   */
  async acceptFriendRequest(requestId: number): Promise<Friend> {
    return this.apiClient.post<Friend>(`/api/friend-requests/${requestId}/accept`)
  }

  /**
   * Отклоняет заявку в друзья
   */
  async rejectFriendRequest(requestId: number): Promise<void> {
    return this.apiClient.delete<void>(`/api/friend-requests/${requestId}`)
  }

  /**
   * Удаляет друга
   */
  async removeFriend(userId: number, friendId: number): Promise<void> {
    return this.apiClient.delete<void>(`/api/users/${userId}/friends/${friendId}`)
  }
}

