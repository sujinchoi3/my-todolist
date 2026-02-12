import { useI18n } from '../contexts/I18nContext'
import styles from './LoadingSpinner.module.css'

interface Props {
  text?: string
}

export default function LoadingSpinner({ text }: Props) {
  const { t } = useI18n()
  return (
    <div role="status" className={styles.wrapper}>
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.text}>{text ?? t('loading')}</span>
    </div>
  )
}
