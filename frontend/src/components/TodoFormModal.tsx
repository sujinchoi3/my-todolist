import { useState, useEffect } from 'react'
import styles from './TodoFormModal.module.css'

interface FormValues {
  title: string
  description: string
  due_date: string
}

interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialValues?: FormValues | null
  onSubmit: (values: FormValues) => Promise<void>
  onCancel: () => void
}

export default function TodoFormModal({ isOpen, mode, initialValues, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [titleError, setTitleError] = useState('')
  const [dueDateError, setDueDateError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTitle(initialValues?.title ?? '')
      setDescription(initialValues?.description ?? '')
      setDueDate(initialValues?.due_date ?? '')
      setTitleError('')
      setDueDateError('')
    }
  }, [isOpen, initialValues])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const titleErr = title.trim() ? '' : '제목은 필수 입력 항목입니다.'
    const dueDateErr = dueDate ? '' : '마감일은 필수 입력 항목입니다.'

    setTitleError(titleErr)
    setDueDateError(dueDateErr)

    if (titleErr || dueDateErr) return

    setIsSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), description, due_date: dueDate })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div
      className={styles.backdrop}
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>{mode === 'create' ? '할일 추가' : '할일 수정'}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label htmlFor="todo-title" className={styles.label}>제목 *</label>
              <input
                id="todo-title"
                type="text"
                className={`${styles.input}${titleError ? ` ${styles.inputError}` : ''}`}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError && e.target.value.trim()) setTitleError('')
                }}
                disabled={isSubmitting}
                maxLength={255}
              />
              {titleError && <span className={styles.fieldError}>{titleError}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="todo-description" className={styles.label}>설명 (선택)</label>
              <textarea
                id="todo-description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="todo-due-date" className={styles.label}>마감일 *</label>
              <input
                id="todo-due-date"
                type="date"
                className={`${styles.input}${dueDateError ? ` ${styles.inputError}` : ''}`}
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  if (dueDateError && e.target.value) setDueDateError('')
                }}
                disabled={isSubmitting}
              />
              {dueDateError && <span className={styles.fieldError}>{dueDateError}</span>}
            </div>
          </div>

          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
