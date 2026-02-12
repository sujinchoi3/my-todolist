import type { ApiError, RefreshResponse } from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Access Token은 메모리에 저장 (XSS 방지)
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

// 토큰 갱신 중 중복 요청 방지를 위한 Promise 캐시
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (res) => {
      if (!res.ok) return null
      const data = (await res.json()) as RefreshResponse
      setAccessToken(data.access_token)
      return data.access_token
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export class ApiRequestError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.code = code
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options

  const buildHeaders = (token: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders as Record<string, string> | undefined),
  })

  const fetchConfig: RequestInit = {
    credentials: 'include',
    ...rest,
    headers: buildHeaders(accessToken),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }

  let response = await fetch(`${API_BASE_URL}${path}`, fetchConfig)

  // 401이면 토큰 갱신 후 재시도
  if (response.status === 401) {
    const newToken = await refreshAccessToken()

    if (!newToken) {
      // 갱신 실패 → 로그인 페이지로 리다이렉트
      setAccessToken(null)
      window.location.href = '/login'
      throw new ApiRequestError(401, 'UNAUTHORIZED', '로그인이 필요합니다.')
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchConfig,
      headers: buildHeaders(newToken),
    })
  }

  if (!response.ok) {
    let errorBody: Partial<ApiError> = {}
    try {
      errorBody = (await response.json()) as Partial<ApiError>
    } catch {
      // JSON 파싱 실패는 무시
    }
    throw new ApiRequestError(
      response.status,
      errorBody.code ?? 'UNKNOWN_ERROR',
      errorBody.message ?? '요청 처리 중 오류가 발생했습니다.',
    )
  }

  // 204 No Content는 빈 응답
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
