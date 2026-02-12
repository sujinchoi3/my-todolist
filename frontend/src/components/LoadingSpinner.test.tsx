import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('기본 로딩 텍스트가 표시된다', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('로딩중...')).toBeInTheDocument()
  })

  it('커스텀 텍스트를 표시할 수 있다', () => {
    render(<LoadingSpinner text="데이터 불러오는 중..." />)
    expect(screen.getByText('데이터 불러오는 중...')).toBeInTheDocument()
  })

  it('스피너 요소가 렌더링된다', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('role="status"가 설정된다', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
