import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, ApiRequestError, getAccessToken, setAccessToken } from './client'

function mockFetch(responses: Response[]) {
  let callCount = 0
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(responses[callCount++])))
}

function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeEmptyResponse(status = 204): Response {
  return new Response(null, { status })
}

beforeEach(() => {
  setAccessToken(null)
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiClient.get', () => {
  it('성공 시 JSON을 반환한다', async () => {
    mockFetch([makeJsonResponse({ id: 1 })])
    const result = await apiClient.get<{ id: number }>('/todos')
    expect(result).toEqual({ id: 1 })
  })

  it('Authorization 헤더에 Access Token을 포함한다', async () => {
    setAccessToken('test-token')
    const fetchSpy = vi.fn().mockResolvedValue(makeJsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.get('/todos')

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer test-token')
  })

  it('Access Token이 없으면 Authorization 헤더를 포함하지 않는다', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(makeJsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.get('/todos')

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('credentials: include가 설정된다', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(makeJsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.get('/todos')

    expect(fetchSpy.mock.calls[0][1].credentials).toBe('include')
  })
})

describe('apiClient.post', () => {
  it('body를 JSON으로 직렬화하여 전송한다', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(makeJsonResponse({ created: true }, 201))
    vi.stubGlobal('fetch', fetchSpy)

    await apiClient.post('/todos', { title: '테스트', due_date: '2026-02-14' })

    expect(fetchSpy.mock.calls[0][1].body).toBe(
      JSON.stringify({ title: '테스트', due_date: '2026-02-14' }),
    )
    expect(fetchSpy.mock.calls[0][1].method).toBe('POST')
  })
})

describe('apiClient.delete', () => {
  it('204 응답 시 undefined를 반환한다', async () => {
    mockFetch([makeEmptyResponse(204)])
    const result = await apiClient.delete('/todos/1')
    expect(result).toBeUndefined()
  })
})

describe('401 처리 - 토큰 갱신', () => {
  it('401 응답 시 refresh를 시도하고 원래 요청을 재시도한다', async () => {
    const fetchSpy = vi.fn()
      // 첫 번째 요청: 401
      .mockResolvedValueOnce(makeJsonResponse({ code: 'UNAUTHORIZED', message: '토큰 만료' }, 401))
      // refresh 요청: 성공
      .mockResolvedValueOnce(makeJsonResponse({ access_token: 'new-token' }))
      // 재시도 요청: 성공
      .mockResolvedValueOnce(makeJsonResponse({ id: 1 }))

    vi.stubGlobal('fetch', fetchSpy)

    const result = await apiClient.get<{ id: number }>('/todos')

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ id: 1 })
    expect(getAccessToken()).toBe('new-token')

    // 재시도 요청에 새 토큰이 포함되어 있는지 확인
    const retryHeaders = fetchSpy.mock.calls[2][1].headers as Record<string, string>
    expect(retryHeaders['Authorization']).toBe('Bearer new-token')
  })

  it('refresh도 실패하면 accessToken을 null로 설정하고 /login으로 이동한다', async () => {
    setAccessToken('expired-token')

    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as Location)

    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(makeJsonResponse({ code: 'UNAUTHORIZED', message: '만료' }, 401))
      .mockResolvedValueOnce(makeJsonResponse({ error: 'Refresh token expired' }, 401))

    vi.stubGlobal('fetch', fetchSpy)

    await expect(apiClient.get('/todos')).rejects.toThrow(ApiRequestError)
    expect(getAccessToken()).toBeNull()

    locationSpy.mockRestore()
  })
})

describe('HTTP 에러 처리', () => {
  it('400 에러 시 ApiRequestError를 던진다', async () => {
    mockFetch([makeJsonResponse({ status: 'error', code: 'VALIDATION_ERROR', message: '잘못된 입력' }, 400)])

    try {
      await apiClient.post('/todos', {})
      expect.fail('에러가 발생해야 합니다')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiRequestError)
      const e = err as ApiRequestError
      expect(e.statusCode).toBe(400)
      expect(e.code).toBe('VALIDATION_ERROR')
      expect(e.message).toBe('잘못된 입력')
    }
  })

  it('404 에러 시 ApiRequestError를 던진다', async () => {
    mockFetch([makeJsonResponse({ status: 'error', code: 'NOT_FOUND', message: '찾을 수 없습니다' }, 404)])

    await expect(apiClient.get('/todos/999')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    })
  })

  it('503 에러에서 JSON 파싱 실패 시 기본 메시지를 사용한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('서버 오류', { status: 503 })),
    )

    await expect(apiClient.get('/health')).rejects.toMatchObject({
      statusCode: 503,
      code: 'UNKNOWN_ERROR',
    })
  })
})

describe('setAccessToken / getAccessToken', () => {
  it('토큰을 설정하고 가져올 수 있다', () => {
    setAccessToken('my-token')
    expect(getAccessToken()).toBe('my-token')
  })

  it('null로 설정할 수 있다', () => {
    setAccessToken('some-token')
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })
})
