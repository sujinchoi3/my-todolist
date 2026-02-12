import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'
import * as AuthContextModule from '../contexts/AuthContext'
import { I18nProvider } from '../contexts/I18nContext'

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const original = await importOriginal<typeof AuthContextModule>()
  return { ...original }
})

function renderWithRouter(ui: React.ReactElement, initialPath = '/') {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/" element={ui} />
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route path="/signup" element={<div>회원가입 페이지</div>} />
          <Route path="/home" element={ui} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  )
}

function renderPublicRoute(ui: React.ReactElement, path = '/login') {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<div>홈 페이지</div>} />
          <Route path="/login" element={ui} />
          <Route path="/signup" element={ui} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ProtectedRoute', () => {
  it('isLoading=true이면 아무것도 렌더링하지 않는다', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderWithRouter(
      <ProtectedRoute>
        <div>보호된 콘텐츠</div>
      </ProtectedRoute>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('user=null이면 /login으로 리다이렉트한다', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>보호된 콘텐츠</div>
      </ProtectedRoute>,
    )

    await waitFor(() => {
      expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
    })
    expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument()
  })

  it('user가 있으면 children을 렌더링한다', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { user_id: '1', email: 'user@test.com', name: '테스터' },
      isLoading: false,
      error: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>보호된 콘텐츠</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  it('isLoading=true이면 아무것도 렌더링하지 않는다', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    })

    const { container } = renderPublicRoute(
      <PublicOnlyRoute>
        <div>공개 콘텐츠</div>
      </PublicOnlyRoute>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('user=null이면 children을 렌더링한다', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    })

    renderPublicRoute(
      <PublicOnlyRoute>
        <div>공개 콘텐츠</div>
      </PublicOnlyRoute>,
    )

    expect(screen.getByText('공개 콘텐츠')).toBeInTheDocument()
  })

  it('user가 있으면 /로 리다이렉트한다', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { user_id: '1', email: 'user@test.com', name: '테스터' },
      isLoading: false,
      error: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    })

    renderPublicRoute(
      <PublicOnlyRoute>
        <div>공개 콘텐츠</div>
      </PublicOnlyRoute>,
    )

    await waitFor(() => {
      expect(screen.getByText('홈 페이지')).toBeInTheDocument()
    })
    expect(screen.queryByText('공개 콘텐츠')).not.toBeInTheDocument()
  })
})
