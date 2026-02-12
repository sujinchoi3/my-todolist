import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApiRequestError } from '../api/client'
import styles from './LoginPage.module.css'

function validateEmail(email: string): string {
  if (!email) return '이메일을 입력해주세요.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.'
  return ''
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleEmailBlur() {
    setEmailError(validateEmail(email))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const emailErr = validateEmail(email)
    if (emailErr) {
      setEmailError(emailErr)
      return
    }

    setApiError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setApiError(err.message)
      } else {
        setApiError('로그인에 실패했습니다.')
      }
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>my_todolist</h1>
        <p className={styles.headerSubtitle}>Team CalTalk | 학생 일정 관리</p>
      </header>

      <main className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>로그인</h2>

          {apiError && (
            <div className={styles.errorBanner} role="alert">
              ✗ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>이메일</label>
                <input
                  id="email"
                  type="email"
                  className={`${styles.input}${emailError ? ` ${styles.inputError}` : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(validateEmail(e.target.value))
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="example@email.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                />
                {emailError && <span className={styles.fieldError}>{emailError}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>비밀번호</label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className={styles.footer}>
            계정이 없으신가요?
            <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
