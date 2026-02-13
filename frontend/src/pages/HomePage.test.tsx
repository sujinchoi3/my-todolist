import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { ReactElement } from 'react'
import HomePage from './HomePage'
import * as AuthContextModule from '../contexts/AuthContext'
import * as apiClient from '../api/client'
import { I18nProvider } from '../contexts/I18nContext'
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

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <I18nProvider>{ui}</I18nProvider>
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
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/안녕하세요, 김지수님/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
  })

  it('할일 목록이 렌더링된다', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText('데이터베이스 과제')).toBeInTheDocument()
      expect(screen.getByText('논문 초안 작성')).toBeInTheDocument()
    })
  })

  it('기한 초과 그룹이 별도로 표시된다', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText(/기한 초과/)).toBeInTheDocument()
    })
  })

  it('빈 목록 시 안내 메시지가 표시된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ overdue: [], normal: [] })
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      expect(screen.getByText('할일이 없습니다.')).toBeInTheDocument()
    })
  })

  it('[로그아웃] 클릭 시 logout이 호출된다', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    mockUseAuth({ logout })
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    })
    expect(logout).toHaveBeenCalled()
  })

  it('[+ 할일 추가] 클릭 시 생성 모달이 열린다', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /할일 추가/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /할일 추가/ }))
    expect(screen.getByText('할일 추가')).toBeInTheDocument()
  })

  it('AC-11: 기한 초과 항목이 상단 그룹에 표시된다', async () => {
    renderWithProviders(<HomePage />)
    await waitFor(() => {
      const overdueSection = screen.getByText(/기한 초과/)
      const overdueTodo = screen.getByText('데이터베이스 과제')
      expect(overdueSection).toBeInTheDocument()
      expect(overdueTodo).toBeInTheDocument()
    })
  })

  it('검색어 입력 시 API가 q 파라미터와 함께 호출된다', async () => {
    const getSpy = vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ overdue: [], normal: [] })
    renderWithProviders(<HomePage />)
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
    renderWithProviders(<HomePage />)
    await waitFor(() => screen.getByRole('button', { name: '미완료' }))

    fireEvent.click(screen.getByRole('button', { name: '미완료' }))

    await waitFor(() => {
      const calls = getSpy.mock.calls
      const lastCall = calls[calls.length - 1][0] as string
      expect(lastCall).toContain('status=pending')
    })
  })
})

// 이슈 #36: 완료 목록 추가
describe('HomePage - 완료 목록 섹션 (#36)', () => {
  beforeEach(() => {
    mockUseAuth()
    mockNavigate.mockClear()
  })

  it('완료된 아이템이 API로부터 오면 "완료됨" 섹션에 표시된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      overdue: [],
      normal: [
        {
          todo_id: 'c1',
          user_id: 'u1',
          title: '완료된 과제',
          description: null,
          due_date: '2026-03-01',
          status: 'completed',
          is_overdue: false,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-10T00:00:00Z',
        },
      ],
    })

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(/✓ 완료됨/)).toBeInTheDocument()
      expect(screen.getByText('완료된 과제')).toBeInTheDocument()
    })
  })

  it('완료된 아이템이 없으면 완료 섹션이 표시되지 않는다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      overdue: [],
      normal: [
        {
          todo_id: 'n1',
          user_id: 'u1',
          title: '진행중인 할일',
          description: null,
          due_date: '2026-03-01',
          status: 'pending',
          is_overdue: false,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-10T00:00:00Z',
        },
      ],
    })

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('진행중인 할일')).toBeInTheDocument()
    })

    expect(screen.queryByText(/✓ 완료됨/)).not.toBeInTheDocument()
  })

  it('pending 아이템은 "할일 목록" 섹션에, completed 아이템은 "완료됨" 섹션에 분리된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      overdue: [],
      normal: [
        {
          todo_id: 'n1',
          user_id: 'u1',
          title: '해야 할 일',
          description: null,
          due_date: '2026-03-01',
          status: 'pending',
          is_overdue: false,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-10T00:00:00Z',
        },
        {
          todo_id: 'c1',
          user_id: 'u1',
          title: '끝낸 일',
          description: null,
          due_date: '2026-03-01',
          status: 'completed',
          is_overdue: false,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-10T00:00:00Z',
        },
      ],
    })

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(/할일 목록 \(1건\)/)).toBeInTheDocument()
      expect(screen.getByText(/✓ 완료됨 \(1건\)/)).toBeInTheDocument()
      expect(screen.getByText('해야 할 일')).toBeInTheDocument()
      expect(screen.getByText('끝낸 일')).toBeInTheDocument()
    })
  })

  it('overdue 아이템은 "기한 초과" 섹션에 표시된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      overdue: [
        {
          todo_id: 'o1',
          user_id: 'u1',
          title: '기한 지난 과제',
          description: null,
          due_date: '2026-02-01',
          status: 'pending',
          is_overdue: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      normal: [],
    })

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(/⚠ 기한 초과 \(1건\)/)).toBeInTheDocument()
      expect(screen.getByText('기한 지난 과제')).toBeInTheDocument()
    })
  })

  it('filter="completed" 선택 시 API에 status=completed 파라미터가 전달되고 완료 섹션이 표시된다', async () => {
    const getSpy = vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      overdue: [],
      normal: [
        {
          todo_id: 'c1',
          user_id: 'u1',
          title: '필터된 완료 항목',
          description: null,
          due_date: '2026-03-01',
          status: 'completed',
          is_overdue: false,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-10T00:00:00Z',
        },
      ],
    })

    renderWithProviders(<HomePage />)

    await waitFor(() => screen.getByRole('button', { name: '완료' }))

    fireEvent.click(screen.getByRole('button', { name: '완료' }))

    await waitFor(() => {
      const calls = getSpy.mock.calls
      const lastCall = calls[calls.length - 1][0] as string
      expect(lastCall).toContain('status=completed')
    })

    await waitFor(() => {
      expect(screen.getByText(/✓ 완료됨/)).toBeInTheDocument()
      expect(screen.getByText('필터된 완료 항목')).toBeInTheDocument()
    })
  })

  it('모든 아이템이 없으면 빈 상태 메시지가 표시된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({ overdue: [], normal: [] })

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('할일이 없습니다.')).toBeInTheDocument()
      expect(screen.getByText('아래 버튼으로 첫 할일을 추가해보세요!')).toBeInTheDocument()
    })

    expect(screen.queryByText(/✓ 완료됨/)).not.toBeInTheDocument()
    expect(screen.queryByText(/할일 목록/)).not.toBeInTheDocument()
    expect(screen.queryByText(/기한 초과/)).not.toBeInTheDocument()
  })

  it('완료된 아이템 체크박스 클릭 시 PATCH /todos/:id/status가 호출된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue({
      overdue: [],
      normal: [
        {
          todo_id: 'c1',
          user_id: 'u1',
          title: '완료 상태 토글 테스트',
          description: null,
          due_date: '2026-03-01',
          status: 'completed',
          is_overdue: false,
          created_at: '2026-02-10T00:00:00Z',
          updated_at: '2026-02-10T00:00:00Z',
        },
      ],
    })
    const patchSpy = vi.spyOn(apiClient.apiClient, 'patch').mockResolvedValue(undefined)

    renderWithProviders(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('완료 상태 토글 테스트')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox', { name: '완료 취소' })
    await act(async () => {
      fireEvent.click(checkbox)
    })

    expect(patchSpy).toHaveBeenCalledWith('/todos/c1/status', { status: 'pending' })
  })
})
