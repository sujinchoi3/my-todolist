import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import * as clientModule from '../api/client'

vi.mock('../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof clientModule>()
  return {
    ...original,
    apiClient: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
    setAccessToken: vi.fn(),
    getAccessToken: vi.fn(),
  }
})

const mockApiPost = vi.mocked(clientModule.apiClient.post)
const mockSetAccessToken = vi.mocked(clientModule.setAccessToken)

// AuthContext 값을 렌더링하는 헬퍼 컴포넌트
function AuthDisplay() {
  const { user, isLoading, error } = useAuth()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="user">{user ? user.email : 'null'}</span>
      <span data-testid="error">{error ?? 'null'}</span>
    </div>
  )
}

function LoginButton() {
  const { login } = useAuth()
  return (
    <button onClick={() => { login('test@example.com', 'password123').catch(() => {}) }}>로그인</button>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  return <button onClick={() => { logout().catch(() => {}) }}>로그아웃</button>
}

function SignupButton() {
  const { signup } = useAuth()
  return (
    <button onClick={() => { signup('new@example.com', 'pass1234', '홍길동').catch(() => {}) }}>회원가입</button>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AuthProvider 초기화', () => {
  it('마운트 시 refresh를 시도하고, 성공하면 user를 설정한다', async () => {
    mockApiPost.mockResolvedValueOnce({
      access_token: 'token-abc',
      user: { user_id: '1', email: 'user@test.com', name: '사용자' },
    })

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>,
    )

    expect(screen.getByTestId('loading').textContent).toBe('loading')

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    })

    expect(screen.getByTestId('user').textContent).toBe('user@test.com')
    expect(mockSetAccessToken).toHaveBeenCalledWith('token-abc')
  })

  it('마운트 시 refresh 실패하면 user=null이고 isLoading=false가 된다', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('Refresh token expired'))

    render(
      <AuthProvider>
        <AuthDisplay />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    })

    expect(screen.getByTestId('user').textContent).toBe('null')
  })
})

describe('login()', () => {
  it('성공 시 user 상태가 설정되고 setAccessToken이 호출된다', async () => {
    // refresh 실패 (미인증 초기 상태)
    mockApiPost.mockRejectedValueOnce(new Error('no session'))
    // login 성공
    mockApiPost.mockResolvedValueOnce({
      access_token: 'new-access-token',
      user: { user_id: '2', email: 'test@example.com', name: '테스터' },
    })

    render(
      <AuthProvider>
        <AuthDisplay />
        <LoginButton />
      </AuthProvider>,
    )

    await waitFor(() => screen.getByTestId('loading').textContent === 'ready')

    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@example.com')
    })
    expect(mockSetAccessToken).toHaveBeenCalledWith('new-access-token')
  })

  it('실패 시 error 상태가 설정된다', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('no session'))
    mockApiPost.mockRejectedValueOnce(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'))

    render(
      <AuthProvider>
        <AuthDisplay />
        <LoginButton />
      </AuthProvider>,
    )

    await waitFor(() => screen.getByTestId('loading').textContent === 'ready')

    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      )
    })
  })
})

describe('logout()', () => {
  it('성공 시 user=null, accessToken=null이 된다', async () => {
    // refresh 성공 (로그인 상태)
    mockApiPost.mockResolvedValueOnce({
      access_token: 'token',
      user: { user_id: '1', email: 'user@test.com', name: '사용자' },
    })
    // logout 성공
    mockApiPost.mockResolvedValueOnce({ message: 'Logged out' })

    render(
      <AuthProvider>
        <AuthDisplay />
        <LogoutButton />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user@test.com')
    })

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null')
    })
    expect(mockSetAccessToken).toHaveBeenCalledWith(null)
  })

  it('logout API 실패해도 user가 null로 초기화된다 (finally 처리)', async () => {
    mockApiPost.mockResolvedValueOnce({
      access_token: 'token',
      user: { user_id: '1', email: 'user@test.com', name: '사용자' },
    })
    mockApiPost.mockRejectedValueOnce(new Error('Network error'))

    render(
      <AuthProvider>
        <AuthDisplay />
        <LogoutButton />
      </AuthProvider>,
    )

    await waitFor(() => screen.getByTestId('user').textContent === 'user@test.com')

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null')
    })
  })
})

describe('signup()', () => {
  it('성공 시 isLoading이 false가 된다', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('no session'))
    mockApiPost.mockResolvedValueOnce({
      user_id: '3',
      email: 'new@example.com',
      name: '홍길동',
    })

    render(
      <AuthProvider>
        <AuthDisplay />
        <SignupButton />
      </AuthProvider>,
    )

    await waitFor(() => screen.getByTestId('loading').textContent === 'ready')

    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready')
    })
  })

  it('실패 시 error 메시지가 설정된다', async () => {
    mockApiPost.mockRejectedValueOnce(new Error('no session'))
    mockApiPost.mockRejectedValueOnce(new Error('이미 사용 중인 이메일입니다.'))

    render(
      <AuthProvider>
        <AuthDisplay />
        <SignupButton />
      </AuthProvider>,
    )

    await waitFor(() => screen.getByTestId('loading').textContent === 'ready')

    await userEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('이미 사용 중인 이메일입니다.')
    })
  })
})

describe('useAuth hook', () => {
  it('AuthProvider 없이 사용하면 에러를 던진다', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    function BareComponent() {
      useAuth()
      return null
    }
    expect(() => render(<BareComponent />)).toThrow(
      'useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.',
    )
    consoleError.mockRestore()
  })
})
