import { useEffect, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function parseYearMonth(value?: string) {
  if (!value || value.length < 7) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  if (!year || month < 1 || month > 12) return null
  return { year, month }
}

function toYearMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`
}

function currentYearMonth() {
  const now = new Date()
  return toYearMonth(now.getFullYear(), now.getMonth() + 1)
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "MM/yyyy",
  emptyLabel,
  display = "short",
  className,
  minYear = 2000,
  maxYear = new Date().getFullYear() + 5,
}: {
  value?: string
  onChange: (yearMonth: string) => void
  placeholder?: string
  emptyLabel?: string
  display?: "short" | "long"
  className?: string
  minYear?: number
  maxYear?: number
}) {
  const now = new Date()
  const parsed = parseYearMonth(value)
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(parsed?.year || now.getFullYear())

  useEffect(() => {
    if (parsed) setViewYear(parsed.year)
  }, [parsed?.year])

  const formatted = parsed
    ? display === "long"
      ? `tháng ${parsed.month} năm ${parsed.year}`
      : `${String(parsed.month).padStart(2, "0")}/${parsed.year}`
    : ""
  const shown = formatted || (emptyLabel && !value ? emptyLabel : "")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between rounded-lg border border-input bg-background px-3 text-sm shadow-sm hover:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
            shown ? "text-foreground" : "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{shown || placeholder}</span>
          <Calendar className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[16.5rem] p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
            disabled={viewYear <= minYear}
            onClick={() => setViewYear((year) => year - 1)}
            aria-label="Năm trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold tabular-nums">{viewYear}</span>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
            disabled={viewYear >= maxYear}
            onClick={() => setViewYear((year) => year + 1)}
            aria-label="Năm sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 12 }, (_, index) => {
            const month = index + 1
            const selected = parsed?.year === viewYear && parsed.month === month
            return (
              <button
                key={month}
                type="button"
                onClick={() => {
                  onChange(toYearMonth(viewYear, month))
                  setOpen(false)
                }}
                className={cn(
                  "h-8 rounded-md text-xs font-medium transition",
                  selected
                    ? "bg-brand-blue font-semibold text-white"
                    : "text-foreground hover:bg-muted",
                )}
              >
                thg {month}
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <button
            type="button"
            className="text-xs font-semibold text-brand-blue hover:underline"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
          >
            Xóa
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-brand-blue hover:underline"
            onClick={() => {
              onChange(currentYearMonth())
              setOpen(false)
            }}
          >
            Tháng này
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
