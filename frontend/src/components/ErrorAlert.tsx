import { useEffect } from 'react'
import styles from './ErrorAlert.module.css'

const STATUS_MESSAGES: Record<number, string> = {
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '찾을 수 없습니다.',
  400: '입력이 유효하지 않습니다.',
  500: '서버 오류가 발생했습니다.',
}

interface Props {
  message?: string
  statusCode?: number
  onClose: () => void
  autoClose?: boolean
}

export default function ErrorAlert({ message, statusCode, onClose, autoClose }: Props) {
  const displayMessage = message ?? (statusCode ? STATUS_MESSAGES[statusCode] : undefined)

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
        aria-label="에러 닫기"
      >
        ✕
      </button>
    </div>
  )
}
