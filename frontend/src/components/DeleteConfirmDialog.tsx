import { useState } from 'react'
import { useI18n } from '../contexts/I18nContext'
import styles from './TodoFormModal.module.css'
import dialogStyles from './DeleteConfirmDialog.module.css'

interface Props {
  isOpen: boolean
  todoTitle: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteConfirmDialog({ isOpen, todoTitle, onConfirm, onCancel }: Props) {
  const { t } = useI18n()
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
        <p className={dialogStyles.question}>{t('deleteQuestion')}</p>
        <p className={dialogStyles.todoTitle}>"{todoTitle}"</p>
        <p className={dialogStyles.warning}>{t('deleteWarning')}</p>
        <div className={dialogStyles.buttons}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isDeleting}
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            className={dialogStyles.deleteBtn}
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('deletingLabel') : t('delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
