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

function validatePassword(password: string): string {
  if (!password) return '비밀번호를 입력해주세요.'
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password))
    return '비밀번호는 영문+숫자 혼용 8자 이상이어야 합니다.'
  return ''
}

export default function SignupPage() {
  const { signup, login } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordConfirmError, setPasswordConfirmError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nameErr = name.trim() ? '' : '이름을 입력해주세요.'
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    const confirmErr = password !== passwordConfirm ? '비밀번호가 일치하지 않습니다.' : ''

    setNameError(nameErr)
    setEmailError(emailErr)
    setPasswordError(passwordErr)
    setPasswordConfirmError(confirmErr)

    if (nameErr || emailErr || passwordErr || confirmErr) return

    setIsSubmitting(true)
    try {
      await signup(email, password, name.trim())
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiRequestError && err.statusCode === 400) {
        setEmailError(err.message)
      } else if (err instanceof ApiRequestError) {
        setEmailError(err.message)
      } else {
        setEmailError('회원가입에 실패했습니다.')
      }
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
          <h2 className={styles.cardTitle}>회원가입</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>이름</label>
                <input
                  id="name"
                  type="text"
                  className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (nameError && e.target.value.trim()) setNameError('')
                  }}
                  placeholder="홍길동"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
                {nameError && <span className={styles.fieldError}>{nameError}</span>}
              </div>

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
                  onBlur={() => setEmailError(validateEmail(email))}
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
                  className={`${styles.input}${passwordError ? ` ${styles.inputError}` : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(validatePassword(e.target.value))
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <span className={styles.fieldHint}>영문+숫자 혼용 8자 이상</span>
                {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="passwordConfirm" className={styles.label}>비밀번호 확인</label>
                <input
                  id="passwordConfirm"
                  type="password"
                  className={`${styles.input}${passwordConfirmError ? ` ${styles.inputError}` : ''}`}
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value)
                    if (passwordConfirmError && e.target.value === password)
                      setPasswordConfirmError('')
                  }}
                  onBlur={() => {
                    if (passwordConfirm && passwordConfirm !== password)
                      setPasswordConfirmError('비밀번호가 일치하지 않습니다.')
                  }}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                {passwordConfirmError && (
                  <span className={styles.fieldError}>{passwordConfirmError}</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '가입하기'}
            </button>
          </form>

          <p className={styles.footer}>
            이미 계정이 있으신가요?
            <Link to="/login">로그인</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
