import { useState } from 'react'
import styles from './TodoFormModal.module.css'
import dialogStyles from './DeleteConfirmDialog.module.css'

interface Props {
  isOpen: boolean
  todoTitle: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteConfirmDialog({ isOpen, todoTitle, onConfirm, onCancel }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !isDeleting) onCancel()
  }

  return (
    <div
      className={styles.backdrop}
      data-testid="delete-dialog-backdrop"
      onClick={handleBackdropClick}
    >
      <div className={dialogStyles.dialog} role="dialog" aria-modal="true">
        <p className={dialogStyles.question}>할일을 삭제하시겠습니까?</p>
        <p className={dialogStyles.todoTitle}>"{todoTitle}"</p>
        <p className={dialogStyles.warning}>삭제된 항목은 복구할 수 없습니다.</p>
        <div className={dialogStyles.buttons}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isDeleting}
          >
            취소
          </button>
          <button
            type="button"
            className={dialogStyles.deleteBtn}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}
