import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  LOCALES,
  interpolate,
  resolveTranslationKey,
  translations,
  type AppLocale,
} from "@/i18n/translations"

const STORAGE_KEY = "hoangminh_locale"

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

interface LocaleContextValue {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: TranslateFn
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readLocale(): AppLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "vi" || saved === "en" || saved === "zh") return saved
  } catch {
    /* ignore */
  }
  return "vi"
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(readLocale)

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, params) => {
        const resolved = resolveTranslationKey(key)
        const template =
          translations[locale][resolved] ||
          translations.vi[resolved] ||
          translations[locale][key] ||
          translations.vi[key] ||
          key
        return interpolate(template, params)
      },
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error("useLocale must be used within LocaleProvider")
  return context
}

export { LOCALES }
export type { TranslateFn }
