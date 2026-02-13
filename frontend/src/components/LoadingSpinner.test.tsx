import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'
import { I18nProvider } from '../contexts/I18nContext'

describe('LoadingSpinner', () => {
  it('기본 로딩 텍스트가 표시된다', () => {
    render(<I18nProvider><LoadingSpinner /></I18nProvider>)
    expect(screen.getByText('로딩중...')).toBeInTheDocument()
  })

  it('커스텀 텍스트를 표시할 수 있다', () => {
    render(<I18nProvider><LoadingSpinner text="데이터 불러오는 중..." /></I18nProvider>)
    expect(screen.getByText('데이터 불러오는 중...')).toBeInTheDocument()
  })

  it('스피너 요소가 렌더링된다', () => {
    const { container } = render(<I18nProvider><LoadingSpinner /></I18nProvider>)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('role="status"가 설정된다', () => {
    render(<I18nProvider><LoadingSpinner /></I18nProvider>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
