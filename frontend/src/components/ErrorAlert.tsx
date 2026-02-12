import { useEffect } from 'react'
import { useI18n } from '../contexts/I18nContext'
import styles from './ErrorAlert.module.css'

interface Props {
  message?: string
  statusCode?: number
  onClose: () => void
  autoClose?: boolean
}

export default function ErrorAlert({ message, statusCode, onClose, autoClose }: Props) {
  const { t } = useI18n()

  function getStatusMessage(code: number): string | undefined {
    if (code === 400) return t('error400')
    if (code === 401) return t('error401')
    if (code === 403) return t('error403')
    if (code === 404) return t('error404')
    if (code === 500) return t('error500')
    return undefined
  }

  const displayMessage = message ?? (statusCode ? getStatusMessage(statusCode) : undefined)

  useEffect(() => {
    if (!autoClose || !displayMessage) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [autoClose, displayMessage, onClose])

  if (!displayMessage) return null

  return (
    <div role="alert" className={styles.alert}>
      <span>{displayMessage}</span>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label={t('errorClose')}
      >
        ✕
      </button>
    </div>
  )
}
