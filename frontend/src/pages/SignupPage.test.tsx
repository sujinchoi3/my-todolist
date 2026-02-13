import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import SignupPage from './SignupPage'
import * as AuthContextModule from '../contexts/AuthContext'
import { I18nProvider } from '../contexts/I18nContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function mockUseAuth(overrides = {}) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

function renderSignupPage() {
  return render(
    <I18nProvider>
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    </I18nProvider>
  )
}

describe('SignupPage', () => {
  beforeEach(() => {
    mockUseAuth()
    mockNavigate.mockClear()
  })

  it('회원가입 폼이 렌더링된다', () => {
    renderSignupPage()
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument()
    expect(screen.getByLabelText('이름')).toBeInTheDocument()
    expect(screen.getByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '가입하기' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인' })).toBeInTheDocument()
  })

  it('비밀번호 힌트가 항상 표시된다', () => {
    renderSignupPage()
    expect(screen.getByText('영문+숫자 혼용 8자 이상')).toBeInTheDocument()
  })

  it('이메일 형식이 잘못되면 인라인 에러가 표시된다', () => {
    renderSignupPage()
    const emailInput = screen.getByLabelText('이메일')
    fireEvent.change(emailInput, { target: { value: 'invalid' } })
    fireEvent.blur(emailInput)
    expect(screen.getByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument()
  })

  it('비밀번호가 규칙에 맞지 않으면 블러 시 에러가 표시된다', () => {
    renderSignupPage()
    const passwordInput = screen.getByLabelText('비밀번호')
    fireEvent.change(passwordInput, { target: { value: 'short' } })
    fireEvent.blur(passwordInput)
    expect(screen.getByText(/비밀번호는 영문\+숫자 혼용 8자 이상이어야 합니다/)).toBeInTheDocument()
  })

  it('비밀번호 확인이 일치하지 않으면 블러 시 에러가 표시된다', () => {
    renderSignupPage()
    const passwordInput = screen.getByLabelText('비밀번호')
    const confirmInput = screen.getByLabelText('비밀번호 확인')
    fireEvent.change(passwordInput, { target: { value: 'Pass1234!' } })
    fireEvent.change(confirmInput, { target: { value: 'Different1!' } })
    fireEvent.blur(confirmInput)
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
  })

  it('필드가 비어있으면 제출 시 에러가 표시된다', async () => {
    renderSignupPage()
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument()
    })
  })

  it('회원가입 성공 시 자동 로그인 후 /로 이동한다', async () => {
    const signup = vi.fn().mockResolvedValue(undefined)
    const login = vi.fn().mockResolvedValue(undefined)
    mockUseAuth({ signup, login })
    renderSignupPage()

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'Pass1234' } })
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form')!)

    await waitFor(() => {
      expect(signup).toHaveBeenCalledWith('test@example.com', 'Pass1234', '홍길동')
      expect(login).toHaveBeenCalledWith('test@example.com', 'Pass1234')
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('중복 이메일 에러 시 이메일 필드 아래 인라인 에러가 표시된다', async () => {
    const { ApiRequestError } = await import('../api/client')
    const signup = vi.fn().mockRejectedValue(
      new ApiRequestError(400, 'EMAIL_ALREADY_EXISTS', '이미 사용 중인 이메일입니다.')
    )
    mockUseAuth({ signup })
    renderSignupPage()

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'Pass1234' } })
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument()
    })
  })

  it('제출 중에 버튼이 비활성화되고 텍스트가 변경된다', async () => {
    let resolveSignup: () => void
    const signup = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveSignup = resolve })
    )
    mockUseAuth({ signup })
    renderSignupPage()

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '홍길동' } })
    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByLabelText('비밀번호 확인'), { target: { value: 'Pass1234' } })
    fireEvent.submit(screen.getByRole('button', { name: '가입하기' }).closest('form')!)

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: '처리 중...' })
      expect(btn).toBeDisabled()
    })

    await waitFor(() => resolveSignup!())
  })
})
