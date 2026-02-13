import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../contexts/I18nContext'
import { ApiRequestError } from '../api/client'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validateEmail(value: string): string {
    if (!value) return t('emailRequired')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('emailInvalid')
    return ''
  }

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
        setApiError(t('loginFailed'))
      }
      setPassword('')
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
          <h2 className={styles.cardTitle}>{t('loginTitle')}</h2>

          {apiError && (
            <div className={styles.errorBanner} role="alert">
              ✗ {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
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
                  onBlur={handleEmailBlur}
                  placeholder="example2@email.com"
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
              {isSubmitting ? t('loginLoading') : t('loginButton')}
            </button>
          </form>

          <p className={styles.footer}>
            {t('noAccount')}
            <Link to="/signup">{t('signupLink')}</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
