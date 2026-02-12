import styles from './LoadingSpinner.module.css'

interface Props {
  text?: string
}

export default function LoadingSpinner({ text = '로딩중...' }: Props) {
  return (
    <div role="status" className={styles.wrapper}>
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.text}>{text}</span>
    </div>
  )
}
