import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { apiClient, setAccessToken } from '../api/client'
import type { LoginResponse, SignupResponse, User } from '../types/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  })

  // 페이지 새로고침 시 Refresh Token으로 세션 복구
  useEffect(() => {
    apiClient
      .post<{ access_token: string; user: User }>('/auth/refresh')
      .then(({ access_token, user }) => {
        setAccessToken(access_token)
        setState({ user, isLoading: false, error: null })
      })
      .catch(() => {
        setState({ user: null, isLoading: false, error: null })
      })
  }, [])

  async function login(email: string, password: string) {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const { access_token, user } = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      })
      setAccessToken(access_token)
      setState({ user, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      throw err
    }
  }

  async function signup(email: string, password: string, name: string) {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      await apiClient.post<SignupResponse>('/auth/signup', { email, password, name })
      setState((prev) => ({ ...prev, isLoading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다.'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      throw err
    }
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setState({ user: null, isLoading: false, error: null })
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
