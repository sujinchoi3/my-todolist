import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../contexts/I18nContext'
import { ApiRequestError } from '../api/client'
import styles from './LoginPage.module.css'

export default function SignupPage() {
  const { signup, login } = useAuth()
  const { t, locale, setLocale } = useI18n()
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

  function validateEmail(value: string): string {
    if (!value) return t('emailRequired')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('emailInvalid')
    return ''
  }

  function validatePassword(value: string): string {
    if (!value) return t('passwordRequired')
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value)) return t('passwordInvalid')
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nameErr = name.trim() ? '' : t('nameRequired')
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    const confirmErr = password !== passwordConfirm ? t('passwordMismatch') : ''

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
        setEmailError(t('signupFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>{t('appTitle')}</h1>
        <p className={styles.headerSubtitle}>{t('appSubtitle')}</p>
        <div className={styles.langToggle}>
          <button
            type="button"
            className={`${styles.langToggleBtn}${locale === 'ko' ? ` ${styles.langToggleBtnActive}` : ''}`}
            onClick={() => setLocale('ko')}
          >
            KO
          </button>
          <button
            type="button"
            className={`${styles.langToggleBtn}${locale === 'en' ? ` ${styles.langToggleBtnActive}` : ''}`}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{t('signupTitle')}</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>{t('nameLabel')}</label>
                <input
                  id="name"
                  type="text"
                  className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (nameError && e.target.value.trim()) setNameError('')
                  }}
                  placeholder={t('namePlaceholder')}
                  autoComplete="name"
                  disabled={isSubmitting}
                />
                {nameError && <span className={styles.fieldError}>{nameError}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>{t('emailLabel')}</label>
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
                <label htmlFor="password" className={styles.label}>{t('passwordLabel')}</label>
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
                <span className={styles.fieldHint}>{t('passwordHint')}</span>
                {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="passwordConfirm" className={styles.label}>{t('passwordConfirmLabel')}</label>
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
                      setPasswordConfirmError(t('passwordMismatch'))
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
              {isSubmitting ? t('signupLoading') : t('signupButton')}
            </button>
          </form>

          <p className={styles.footer}>
            {t('hasAccount')}
            <Link to="/login">{t('loginLink')}</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
