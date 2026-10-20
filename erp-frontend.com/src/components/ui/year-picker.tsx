import { useEffect, useMemo, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const WINDOW_SIZE = 12

function windowStartFor(year: number) {
  return year - ((year - 2019) % WINDOW_SIZE + WINDOW_SIZE) % WINDOW_SIZE
}

export function YearPicker({
  value,
  onChange,
  minYear = 2000,
  maxYear = new Date().getFullYear() + 10,
  placeholder = "yyyy",
  className,
}: {
  value?: number
  onChange: (year: number) => void
  minYear?: number
  maxYear?: number
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [windowStart, setWindowStart] = useState(() => windowStartFor(value || new Date().getFullYear()))

  useEffect(() => {
    if (value) setWindowStart(windowStartFor(value))
  }, [value])

  const years = useMemo(
    () => Array.from({ length: WINDOW_SIZE }, (_, index) => windowStart + index),
    [windowStart],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-[8.5rem] items-center justify-between rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm hover:border-brand-blue/40 focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
            className,
          )}
        >
          <span className={value ? "tabular-nums" : "text-muted-foreground"}>{value || placeholder}</span>
          <Calendar className="h-4 w-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[17.5rem] p-3">
        <div className="mb-2 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={windowStart <= minYear}
            onClick={() => setWindowStart((start) => start - WINDOW_SIZE)}
            aria-label="Kỳ năm trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold tabular-nums">{value || new Date().getFullYear()}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={windowStart + WINDOW_SIZE - 1 >= maxYear}
            onClick={() => setWindowStart((start) => start + WINDOW_SIZE)}
            aria-label="Kỳ năm sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {years.map((year) => {
            const selected = year === value
            const disabled = year < minYear || year > maxYear
            return (
              <button
                key={year}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(year)
                  setOpen(false)
                }}
                className={cn(
                  "h-9 rounded-md text-sm tabular-nums transition",
                  disabled && "cursor-not-allowed text-muted-foreground/40",
                  !disabled && !selected && "text-foreground hover:bg-muted",
                  selected && "border border-brand-blue bg-brand-blue/10 font-bold text-brand-blue",
                )}
              >
                {year}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
