import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TodoCard from './TodoCard'
import type { Todo } from '../types/api'

const baseTodo: Todo = {
  todo_id: '1',
  user_id: 'u1',
  title: '운영체제 과제',
  description: '3장 요약',
  due_date: '2026-03-01',
  status: 'pending',
  is_overdue: false,
  created_at: '2026-02-12T00:00:00Z',
  updated_at: '2026-02-12T00:00:00Z',
}

describe('TodoCard', () => {
  it('제목과 마감일이 렌더링된다', () => {
    render(
      <TodoCard
        todo={baseTodo}
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('운영체제 과제')).toBeInTheDocument()
    expect(screen.getByText('2026-03-01')).toBeInTheDocument()
  })

  it('설명이 있으면 표시된다', () => {
    render(
      <TodoCard todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(screen.getByText('3장 요약')).toBeInTheDocument()
  })

  it('기한 초과 시 overdue 클래스가 적용된다', () => {
    const overdueTodo = { ...baseTodo, is_overdue: true }
    const { container } = render(
      <TodoCard todo={overdueTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass(/overdue/i)
  })

  it('완료 상태 시 completed 클래스가 적용된다', () => {
    const completedTodo = { ...baseTodo, status: 'completed' as const }
    const { container } = render(
      <TodoCard todo={completedTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    expect(container.firstChild).toHaveClass(/completed/i)
  })

  it('체크박스 클릭 시 onToggle이 호출된다', () => {
    const onToggle = vi.fn()
    render(
      <TodoCard todo={baseTodo} onToggle={onToggle} onEdit={vi.fn()} onDelete={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('1')
  })

  it('수정 버튼 클릭 시 onEdit이 호출된다', () => {
    const onEdit = vi.fn()
    render(
      <TodoCard todo={baseTodo} onToggle={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: /수정/ }))
    expect(onEdit).toHaveBeenCalledWith('1')
  })

  it('삭제 버튼 클릭 시 onDelete가 호출된다', () => {
    const onDelete = vi.fn()
    render(
      <TodoCard todo={baseTodo} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />
    )
    fireEvent.click(screen.getByRole('button', { name: /삭제/ }))
    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
