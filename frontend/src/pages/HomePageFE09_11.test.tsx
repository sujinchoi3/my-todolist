/**
 * FE-09 (수정), FE-10 (완료 토글), FE-11 (삭제) 통합 테스트
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import HomePage from './HomePage'
import * as AuthContextModule from '../contexts/AuthContext'
import * as apiClient from '../api/client'
import type { Todo, TodoListResponse } from '../types/api'
import { I18nProvider } from '../contexts/I18nContext'

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

const pendingTodo: Todo = {
  todo_id: 'n1',
  user_id: 'u1',
  title: '논문 초안 작성',
  description: '서론 포함',
  due_date: '2026-03-01',
  status: 'pending',
  is_overdue: false,
  created_at: '2026-02-10T00:00:00Z',
  updated_at: '2026-02-10T00:00:00Z',
}

const completedTodo: Todo = {
  ...pendingTodo,
  todo_id: 'n2',
  title: '완료된 과제',
  status: 'completed',
}

const listResponse: TodoListResponse = {
  overdue: [],
  normal: [pendingTodo, completedTodo],
}

function mockApiGet(response: TodoListResponse = listResponse) {
  vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue(response)
}

function renderHomePage() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </I18nProvider>
  )
}

// ─── FE-09: 할일 수정 ───────────────────────────────────────────────────

describe('FE-09: 할일 수정', () => {
  beforeEach(() => {
    mockUseAuth()
    mockNavigate.mockClear()
    mockApiGet()
  })

  it('수정 버튼 클릭 시 GET /todos/:id를 호출하고 수정 모달이 열린다', async () => {
    const getSpy = vi.spyOn(apiClient.apiClient, 'get')
      .mockResolvedValueOnce(listResponse)   // 목록 로드
      .mockResolvedValueOnce(pendingTodo)    // 단건 조회

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    fireEvent.click(screen.getAllByRole('button', { name: '수정' })[0])

    await waitFor(() => {
      expect(screen.getByText('할일 수정')).toBeInTheDocument()
    })
    expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('/todos/n1'))
  })

  it('수정 모달에 기존값이 pre-fill된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get')
      .mockResolvedValueOnce(listResponse)
      .mockResolvedValueOnce(pendingTodo)

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))
    fireEvent.click(screen.getAllByRole('button', { name: '수정' })[0])

    await waitFor(() => {
      expect(screen.getByDisplayValue('논문 초안 작성')).toBeInTheDocument()
      expect(screen.getByDisplayValue('서론 포함')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument()
    })
  })

  it('수정 성공 시 PUT을 호출하고 모달이 닫히며 목록이 갱신된다 (AC-08)', async () => {
    vi.spyOn(apiClient.apiClient, 'get')
      .mockResolvedValueOnce(listResponse)
      .mockResolvedValueOnce(pendingTodo)
      .mockResolvedValueOnce(listResponse) // 갱신 후 목록 재조회
    const putSpy = vi.spyOn(apiClient.apiClient, 'put').mockResolvedValue({})

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))
    fireEvent.click(screen.getAllByRole('button', { name: '수정' })[0])

    await waitFor(() => screen.getByDisplayValue('논문 초안 작성'))

    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '수정된 제목' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith(
        expect.stringContaining('/todos/n1'),
        expect.objectContaining({ title: '수정된 제목' })
      )
      expect(screen.queryByText('할일 수정')).not.toBeInTheDocument()
    })
  })

  it('수정 취소 시 모달이 닫힌다', async () => {
    vi.spyOn(apiClient.apiClient, 'get')
      .mockResolvedValueOnce(listResponse)
      .mockResolvedValueOnce(pendingTodo)

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))
    fireEvent.click(screen.getAllByRole('button', { name: '수정' })[0])

    await waitFor(() => screen.getByText('할일 수정'))
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByText('할일 수정')).not.toBeInTheDocument()
  })
})

// ─── FE-10: 완료 토글 ───────────────────────────────────────────────────

describe('FE-10: 완료 토글', () => {
  beforeEach(() => {
    mockUseAuth()
    mockNavigate.mockClear()
    mockApiGet()
  })

  it('체크박스 클릭 시 PATCH /todos/:id/status를 호출한다 (AC-10)', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue(listResponse)
    const patchSpy = vi.spyOn(apiClient.apiClient, 'patch').mockResolvedValue({})

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // pendingTodo

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/todos/n1/status'),
        { status: 'completed' }
      )
    })
  })

  it('완료 → 미완료 토글 시 status: pending으로 PATCH를 호출한다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue(listResponse)
    const patchSpy = vi.spyOn(apiClient.apiClient, 'patch').mockResolvedValue({})

    renderHomePage()
    await waitFor(() => screen.getByText('완료된 과제'))

    const checkboxes = screen.getAllByRole('checkbox')
    const completedCheckbox = checkboxes[1] // completedTodo
    fireEvent.click(completedCheckbox)

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/todos/n2/status'),
        { status: 'pending' }
      )
    })
  })

  it('토글 직후 체크박스 상태가 즉시 변경된다 (옵티미스틱 업데이트)', async () => {
    let resolveToggle: () => void
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue(listResponse)
    vi.spyOn(apiClient.apiClient, 'patch').mockReturnValue(
      new Promise<void>((resolve) => { resolveToggle = resolve })
    )

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    const checkboxes = screen.getAllByRole('checkbox')
    const pendingCheckbox = checkboxes[0]
    expect(pendingCheckbox).not.toBeChecked()

    fireEvent.click(pendingCheckbox)

    // API 완료 전에 즉시 체크됨
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked()

    await waitFor(() => resolveToggle!())
  })

  it('토글 실패 시 원래 상태로 롤백된다', async () => {
    vi.spyOn(apiClient.apiClient, 'get').mockResolvedValue(listResponse)
    vi.spyOn(apiClient.apiClient, 'patch').mockRejectedValue(new Error('서버 오류'))

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    const checkboxBefore = screen.getAllByRole('checkbox')[0]
    expect(checkboxBefore).not.toBeChecked()

    await act(async () => {
      fireEvent.click(screen.getAllByRole('checkbox')[0])
    })

    // 실패 후 롤백
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked()
    })
  })
})

// ─── FE-11: 삭제 ─────────────────────────────────────────────────────────

describe('FE-11: 할일 삭제', () => {
  beforeEach(() => {
    mockUseAuth()
    mockNavigate.mockClear()
    mockApiGet()
  })

  it('삭제 버튼 클릭 시 삭제 확인 다이얼로그가 열린다', async () => {
    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0])

    expect(screen.getByText('할일을 삭제하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByText(/"논문 초안 작성"/)).toBeInTheDocument()
    expect(screen.getByText('삭제된 항목은 복구할 수 없습니다.')).toBeInTheDocument()
  })

  it('삭제 확인 시 DELETE /todos/:id를 호출하고 목록이 갱신된다 (AC-09)', async () => {
    vi.spyOn(apiClient.apiClient, 'get')
      .mockResolvedValueOnce(listResponse)
      .mockResolvedValueOnce({ overdue: [], normal: [completedTodo] }) // 삭제 후 갱신
    const deleteSpy = vi.spyOn(apiClient.apiClient, 'delete').mockResolvedValue(undefined)

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    // 카드의 삭제 버튼 클릭 (aria-label="삭제")
    fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0])
    await waitFor(() => screen.getByText('할일을 삭제하시겠습니까?'))

    // 다이얼로그의 삭제 버튼: 마지막 "삭제" 버튼이 다이얼로그 확인 버튼
    const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
    fireEvent.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(expect.stringContaining('/todos/n1'))
      expect(screen.queryByText('할일을 삭제하시겠습니까?')).not.toBeInTheDocument()
    })
  })

  it('삭제 취소 시 다이얼로그가 닫히고 목록이 변경되지 않는다', async () => {
    const deleteSpy = vi.spyOn(apiClient.apiClient, 'delete').mockResolvedValue(undefined)

    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    // 카드의 삭제 버튼 클릭
    fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0])
    await waitFor(() => screen.getByText('할일을 삭제하시겠습니까?'))

    // 다이얼로그의 취소 버튼 (유일한 "취소" 버튼)
    fireEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByText('할일을 삭제하시겠습니까?')).not.toBeInTheDocument()
    expect(deleteSpy).not.toHaveBeenCalled()
  })

  it('배경 클릭 시 다이얼로그가 닫힌다', async () => {
    renderHomePage()
    await waitFor(() => screen.getByText('논문 초안 작성'))

    fireEvent.click(screen.getAllByRole('button', { name: '삭제' })[0])
    await waitFor(() => screen.getByText('할일을 삭제하시겠습니까?'))

    fireEvent.click(screen.getByTestId('delete-dialog-backdrop'))

    expect(screen.queryByText('할일을 삭제하시겠습니까?')).not.toBeInTheDocument()
  })
})
