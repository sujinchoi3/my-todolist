import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import ErrorAlert from './ErrorAlert'

describe('ErrorAlert', () => {
  it('에러 메시지가 표시된다', () => {
    render(<ErrorAlert message="오류가 발생했습니다." onClose={vi.fn()} />)
    expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('닫기 버튼 클릭 시 onClose가 호출된다', () => {
    const onClose = vi.fn()
    render(<ErrorAlert message="에러" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '에러 닫기' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('statusCode 401 → "로그인이 필요합니다" 매핑', () => {
    render(<ErrorAlert statusCode={401} onClose={vi.fn()} />)
    expect(screen.getByText('로그인이 필요합니다.')).toBeInTheDocument()
  })

  it('statusCode 403 → "접근 권한이 없습니다" 매핑', () => {
    render(<ErrorAlert statusCode={403} onClose={vi.fn()} />)
    expect(screen.getByText('접근 권한이 없습니다.')).toBeInTheDocument()
  })

  it('statusCode 404 → "찾을 수 없습니다" 매핑', () => {
    render(<ErrorAlert statusCode={404} onClose={vi.fn()} />)
    expect(screen.getByText('찾을 수 없습니다.')).toBeInTheDocument()
  })

  it('statusCode 500 → "서버 오류가 발생했습니다" 매핑', () => {
    render(<ErrorAlert statusCode={500} onClose={vi.fn()} />)
    expect(screen.getByText('서버 오류가 발생했습니다.')).toBeInTheDocument()
  })

  it('autoClose=true 이면 3초 후 onClose가 자동 호출된다', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<ErrorAlert message="에러" onClose={onClose} autoClose />)
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('message와 statusCode 둘 다 없으면 렌더링되지 않는다', () => {
    const { container } = render(<ErrorAlert onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})
