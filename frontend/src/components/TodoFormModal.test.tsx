import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import TodoFormModal from './TodoFormModal'

describe('TodoFormModal', () => {
  it('isOpen=false이면 렌더링되지 않는다', () => {
    render(
      <TodoFormModal
        isOpen={false}
        mode="create"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('생성 모달: 제목이 "할일 추가"이다', () => {
    render(
      <TodoFormModal isOpen mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByText('할일 추가')).toBeInTheDocument()
  })

  it('수정 모달: 제목이 "할일 수정"이고 초기값이 pre-fill된다', () => {
    render(
      <TodoFormModal
        isOpen
        mode="edit"
        initialValues={{ title: '논문 초안', description: '서론 포함', due_date: '2026-03-01' }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('할일 수정')).toBeInTheDocument()
    expect(screen.getByDisplayValue('논문 초안')).toBeInTheDocument()
    expect(screen.getByDisplayValue('서론 포함')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-03-01')).toBeInTheDocument()
  })

  it('제목 미입력 시 에러가 표시된다', async () => {
    render(
      <TodoFormModal isOpen mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
    )
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() => {
      expect(screen.getByText('제목은 필수 입력 항목입니다.')).toBeInTheDocument()
    })
  })

  it('마감일 미입력 시 에러가 표시된다', async () => {
    render(
      <TodoFormModal isOpen mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '테스트' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() => {
      expect(screen.getByText('마감일은 필수 입력 항목입니다.')).toBeInTheDocument()
    })
  })

  it('유효한 값 제출 시 onSubmit이 호출된다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <TodoFormModal isOpen mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '새 할일' } })
    fireEvent.change(screen.getByLabelText(/마감일/), { target: { value: '2026-03-01' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: '새 할일',
        description: '',
        due_date: '2026-03-01',
      })
    })
  })

  it('[취소] 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(
      <TodoFormModal isOpen mode="create" onSubmit={vi.fn()} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('[X] 버튼 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(
      <TodoFormModal isOpen mode="create" onSubmit={vi.fn()} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('배경 클릭 시 onCancel이 호출된다', () => {
    const onCancel = vi.fn()
    render(
      <TodoFormModal isOpen mode="create" onSubmit={vi.fn()} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByTestId('modal-backdrop'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('제출 중에 저장 버튼이 비활성화되고 텍스트가 변경된다', async () => {
    let resolveSubmit: () => void
    const onSubmit = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveSubmit = resolve })
    )
    render(
      <TodoFormModal isOpen mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '새 할일' } })
    fireEvent.change(screen.getByLabelText(/마감일/), { target: { value: '2026-03-01' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: '저장 중...' })
      expect(btn).toBeDisabled()
    })

    await waitFor(() => resolveSubmit!())
  })
})
