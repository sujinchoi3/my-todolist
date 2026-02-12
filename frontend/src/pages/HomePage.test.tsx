import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import HomePage from './HomePage'
import * as AuthContextModule from '../contexts/AuthContext'
import * as apiClient from '../api/client'
import type { TodoListResponse } from '../types/api'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockUser = { user_id: 'u1', email: 'test@example.com', name: '김지수' }

function mockUseAuth(overrides = {}) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: mockUser,
    isLoading: false,
    error: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

const sampleResponse: TodoListResponse = {
  overdue: [
    {
      todo_id: 'o1',
      user_id: 'u1',
      title: '데이터베이스 과제',
      description: 'ER 다이어그램 작성',
      due_date: '2026-02-08',
      status: 'pending',
      is_overdue: true,
      created_at: '2026-02-01T00:00:00Z',
      updated_at: '2026-02-01T00:00:00Z',
    },
  ],
  normal: [
    {
      todo_id: 'n1',
      user_id: 'u1',
      title: '논문 초안 작성',
      description: null,
      due_date: '2026-03-01',
      status: 'pending',
      is_overdue: false,
      created_at: '2026-02-10T00:00:00Z',
      updated_at: '2026-02-10T00:00:00Z',
    },
  ],
}

function mockApiGet(response: TodoListResponse = sampleResponse) {
  vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue(response)
}

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    mockUseAuth()
    mockNavigate.mockClear()
    mockApiGet()
  })

  it('사용자 이름과 로그아웃 버튼이 렌더링된다', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/안녕하세요, 김지수님/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('할일 목록이 렌더링된다', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText('데이터베이스 과제')).toBeInTheDocument()
      expect(screen.getByText('논문 초안 작성')).toBeInTheDocument()
    })
  })

  it('기한 초과 그룹이 별도로 표시된다', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/기한 초과/)).toBeInTheDocument()
    })
  })

  it('빈 목록 시 안내 메시지가 표시된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ overdue: [], normal: [] })
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText('할일이 없습니다.')).toBeInTheDocument()
    })
  })

  it('[로그아웃] 클릭 시 logout이 호출된다', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    mockUseAuth({ logout })
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    })
    expect(logout).toHaveBeenCalled()
  })

  it('[+ 할일 추가] 클릭 시 생성 모달이 열린다', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /할일 추가/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /할일 추가/ }))
    expect(screen.getByText('할일 추가')).toBeInTheDocument()
  })

  it('AC-11: 기한 초과 항목이 상단 그룹에 표시된다', async () => {
    renderHomePage()
    await waitFor(() => {
      const overdueSection = screen.getByText(/기한 초과/)
      const overdueTodo = screen.getByText('데이터베이스 과제')
      expect(overdueSection).toBeInTheDocument()
      expect(overdueTodo).toBeInTheDocument()
    })
  })

  it('검색어 입력 시 API가 q 파라미터와 함께 호출된다', async () => {
    const getSpy = vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ overdue: [], normal: [] })
    renderHomePage()
    await waitFor(() => screen.getByPlaceholderText(/검색/))

    fireEvent.change(screen.getByPlaceholderText(/검색/), { target: { value: '논문' } })

    await waitFor(() => {
      const calls = getSpy.mock.calls
      const lastCall = calls[calls.length - 1][0] as string
      expect(lastCall).toContain('q=%EB%85%BC%EB%AC%B8')
    })
  })

  it('상태 필터 탭 클릭 시 API가 status 파라미터와 함께 호출된다', async () => {
    const getSpy = vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ overdue: [], normal: [] })
    renderHomePage()
    await waitFor(() => screen.getByRole('button', { name: '미완료' }))

    fireEvent.click(screen.getByRole('button', { name: '미완료' }))

    await waitFor(() => {
      const calls = getSpy.mock.calls
      const lastCall = calls[calls.length - 1][0] as string
      expect(lastCall).toContain('status=pending')
    })
  })
})
