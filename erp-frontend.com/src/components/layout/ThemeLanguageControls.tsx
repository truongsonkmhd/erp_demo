import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LOCALES, useLocale } from "@/i18n/LocaleContext"

export function ThemeLanguageControls() {
  const { t, locale, setLocale } = useLocale()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const current = LOCALES.find((item) => item.id === locale) || LOCALES[0]
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full border border-header-chip-border bg-header-chip text-header-text hover:bg-header-chip-hover hover:text-header-text focus-visible:ring-accent focus-visible:ring-offset-header-from"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? t("layout.lightMode") : t("layout.darkMode")}
        title={isDark ? t("layout.lightMode") : t("layout.darkMode")}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-1.5 rounded-full border border-header-chip-border bg-header-chip px-2.5 text-sm font-medium text-header-text transition-colors hover:bg-header-chip-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-header-from"
            aria-label={t("layout.language")}
          >
            <span aria-hidden="true">{current.flag}</span>
            <span className="hidden sm:inline">{current.native}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {LOCALES.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => setLocale(item.id)}
              className={locale === item.id ? "bg-accent/10 font-semibold" : ""}
            >
              <span className="mr-2" aria-hidden="true">{item.flag}</span>
              {item.native}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
