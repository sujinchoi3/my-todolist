import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import ko from '../i18n/ko'
import en from '../i18n/en'
import type { TranslationKeys } from '../i18n/ko'

type Locale = 'ko' | 'en'

const translations = { ko, en }

function getInitialLocale(): Locale {
  const saved = localStorage.getItem('locale')
  return saved === 'en' ? 'en' : 'ko'
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKeys, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  function setLocale(next: Locale) {
    localStorage.setItem('locale', next)
    setLocaleState(next)
  }

  function t(key: TranslationKeys, vars?: Record<string, string | number>): string {
    let text: string = translations[locale][key]
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n는 I18nProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
