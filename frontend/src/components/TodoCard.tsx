import type { Todo } from '../types/api'
import styles from './TodoCard.module.css'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export default function TodoCard({ todo, onToggle, onEdit, onDelete }: Props) {
  const cardClass = [
    styles.card,
    todo.is_overdue ? styles.overdue : '',
    todo.status === 'completed' ? styles.completed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClass}>
      <div className={styles.main}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={todo.status === 'completed'}
          onChange={() => onToggle(todo.todo_id)}
          aria-label={todo.status === 'completed' ? '완료 취소' : '완료 처리'}
        />
        <div className={styles.body}>
          <span className={styles.title}>{todo.title}</span>
          {todo.description && (
            <span className={styles.description}>{todo.description}</span>
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.dueDate}>{todo.due_date}</span>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => onEdit(todo.todo_id)}
              aria-label="수정"
            >
              ✏
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => onDelete(todo.todo_id)}
              aria-label="삭제"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
