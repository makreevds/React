/**
 * API клиент для взаимодействия с бэкендом
 * 
 * Использует паттерн Repository для разделения ответственности
 * и упрощения тестирования
 */

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: ApiError
}

/**
 * Базовый класс для API ошибок
 */
export class ApiClientError extends Error {
  code?: string
  status?: number

  constructor(
    message: string,
    code?: string,
    status?: number
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
  }
}

/**
 * Конфигурация API клиента
 */
export interface ApiClientConfig {
  baseUrl: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * Параметры запроса
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
}

/**
 * Базовый API клиент
 */
export class ApiClient {
  private baseUrl: string
  private timeout: number
  private defaultHeaders: Record<string, string>

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Убираем trailing slash
    this.timeout = config.timeout || 30000
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  /**
   * Выполняет HTTP запрос
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    const method = options.method || 'GET'
    
    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    const signal = options.signal || controller.signal

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response)
        throw new ApiClientError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code,
          response.status
        )
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return (await response.text()) as unknown as T
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiClientError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiClientError('Запрос превысил время ожидания', 'TIMEOUT', 408)
        }
        throw new ApiClientError(`Ошибка сети: ${error.message}`, 'NETWORK_ERROR')
      }

      throw new ApiClientError('Неизвестная ошибка', 'UNKNOWN_ERROR')
    }
  }

  /**
   * Парсит ответ с ошибкой
   */
  private async parseErrorResponse(response: Response): Promise<ApiError> {
    try {
      const data = await response.json()
      return {
        message: data.message || data.error || 'Неизвестная ошибка',
        code: data.code,
        status: response.status,
      }
    } catch {
      return {
        message: response.statusText || 'Неизвестная ошибка',
        status: response.status,
      }
    }
  }

  /**
   * GET запрос
   */
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST запрос
   */
  async post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT запрос
   */
  async put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * PATCH запрос
   */
  async patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  /**
   * DELETE запрос
   */
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Загрузка файла (FormData)
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    const formData = new FormData()
    formData.append(fieldName, file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // Не устанавливаем Content-Type для FormData - браузер сделает это автоматически
          ...Object.fromEntries(
            Object.entries(this.defaultHeaders).filter(([key]) => 
              key.toLowerCase() !== 'content-type'
            )
          ),
        },
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response)
        throw new ApiClientError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code,
          response.status
        )
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return (await response.text()) as unknown as T
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiClientError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiClientError('Запрос превысил время ожидания', 'TIMEOUT', 408)
        }
        throw new ApiClientError(`Ошибка сети: ${error.message}`, 'NETWORK_ERROR')
      }

      throw new ApiClientError('Неизвестная ошибка', 'UNKNOWN_ERROR')
    }
  }
}

/**
 * Создает экземпляр API клиента
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config)
}

