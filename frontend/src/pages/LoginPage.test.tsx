import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import * as AuthContextModule from '../contexts/AuthContext'
import { ApiRequestError } from '../api/client'

vi.mock('../contexts/AuthContext', async (importOriginal) => {
  const original = await importOriginal<typeof AuthContextModule>()
  return { ...original }
})

const mockLogin = vi.fn()

function makeAuthMock(overrides?: Partial<ReturnType<typeof AuthContextModule.useAuth>>) {
  return {
    user: null,
    isLoading: false,
    error: null,
    login: mockLogin,
    signup: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  }
}

function renderLoginPage(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>홈 페이지</div>} />
        <Route path="/signup" element={<div>회원가입 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(makeAuthMock())
})

describe('LoginPage 렌더링', () => {
  it('헤더, 제목, 이메일/비밀번호 필드, 로그인 버튼, 회원가입 링크가 표시된다', () => {
    renderLoginPage()

    expect(screen.getByText('my_todolist')).toBeInTheDocument()
    expect(screen.getByText('Team CalTalk | 학생 일정 관리')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '회원가입' })).toBeInTheDocument()
  })

  it('초기에는 에러 배너가 표시되지 않는다', () => {
    renderLoginPage()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('이메일 유효성 검사', () => {
  it('이메일 형식이 아니면 blur 시 인라인 에러가 표시된다', async () => {
    renderLoginPage()
    const emailInput = screen.getByLabelText('이메일')

    await userEvent.type(emailInput, 'invalid-email')
    await userEvent.tab()

    expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
  })

  it('이메일이 비어있으면 blur 시 필수 에러가 표시된다', async () => {
    renderLoginPage()
    const emailInput = screen.getByLabelText('이메일')

    await userEvent.click(emailInput)
    await userEvent.tab()

    expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
  })

  it('올바른 이메일 형식 입력 시 에러가 사라진다', async () => {
    renderLoginPage()
    const emailInput = screen.getByLabelText('이메일')

    await userEvent.type(emailInput, 'bad')
    await userEvent.tab()
    expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()

    await userEvent.clear(emailInput)
    await userEvent.type(emailInput, 'good@example.com')

    await waitFor(() => {
      expect(screen.queryByText('올바른 이메일 형식이 아닙니다.')).not.toBeInTheDocument()
    })
  })
})

describe('폼 제출 - 유효성 검사 실패', () => {
  it('이메일이 없으면 submit 시 에러 표시 후 API 미호출', async () => {
    renderLoginPage()

    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('이메일 형식이 잘못되면 submit 시 에러 표시 후 API 미호출', async () => {
    renderLoginPage()

    await userEvent.type(screen.getByLabelText('이메일'), 'notanemail')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })
})

describe('폼 제출 - 로그인 성공 (AC-03)', () => {
  it('성공 시 /로 리다이렉트한다', async () => {
    mockLogin.mockResolvedValueOnce(undefined)

    renderLoginPage()

    await userEvent.type(screen.getByLabelText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByText('홈 페이지')).toBeInTheDocument()
    })
    expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123')
  })
})

describe('폼 제출 - 로그인 실패 (AC-04)', () => {
  it('401 에러 시 에러 배너가 표시되고 비밀번호 필드가 초기화된다', async () => {
    mockLogin.mockRejectedValueOnce(
      new ApiRequestError(401, 'UNAUTHORIZED', '이메일 또는 비밀번호가 올바르지 않습니다.'),
    )

    renderLoginPage()

    await userEvent.type(screen.getByLabelText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    )
    expect(screen.getByLabelText('비밀번호')).toHaveValue('')
    expect(screen.getByLabelText('이메일')).toHaveValue('user@example.com')
  })

  it('재시도 시 에러 배너가 사라진다', async () => {
    mockLogin
      .mockRejectedValueOnce(new ApiRequestError(401, 'UNAUTHORIZED', '잘못된 자격증명'))
      .mockResolvedValueOnce(undefined)

    renderLoginPage()

    await userEvent.type(screen.getByLabelText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => screen.getByRole('alert'))

    await userEvent.type(screen.getByLabelText('비밀번호'), 'correct123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

describe('로딩 상태', () => {
  it('제출 중에는 버튼이 비활성화되고 텍스트가 "로그인 중..."으로 변경된다', async () => {
    let resolveLogin!: () => void
    mockLogin.mockReturnValueOnce(
      new Promise<void>((resolve) => { resolveLogin = resolve }),
    )

    renderLoginPage()

    await userEvent.type(screen.getByLabelText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByLabelText('비밀번호'), 'pass1234')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '로그인 중...' })).toBeDisabled()
    })

    await act(async () => { resolveLogin() })
  })
})

describe('회원가입 링크', () => {
  it('/signup으로 이동한다', async () => {
    renderLoginPage()

    await userEvent.click(screen.getByRole('link', { name: '회원가입' }))

    expect(screen.getByText('회원가입 페이지')).toBeInTheDocument()
  })
})
