import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, X } from "lucide-react"

export interface InputFieldProps extends React.ComponentProps<typeof Input> {
  label?: React.ReactNode
  required?: boolean
  error?: string
  description?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      required,
      error,
      description,
      containerClassName,
      labelClassName,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <Label htmlFor={inputId} className={cn("text-sm font-medium text-foreground", labelClassName)}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={cn(
            className,
            error && "!border-red-500 focus:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/30"
          )}
          {...props}
        />
        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-xs font-normal text-red-500 mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)
InputField.displayName = "InputField"

export type SelectOption = string | { label: React.ReactNode; value: string; disabled?: boolean }

export interface SelectFieldProps {
  label?: React.ReactNode
  required?: boolean
  error?: string
  description?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
  triggerClassName?: string
  contentClassName?: string
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  options?: SelectOption[]
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  id?: string
  children?: React.ReactNode
}

export const SelectField = React.forwardRef<HTMLButtonElement, SelectFieldProps>(
  (
    {
      label,
      required,
      error,
      description,
      containerClassName,
      labelClassName,
      triggerClassName,
      contentClassName,
      placeholder = "Chọn...",
      value,
      onValueChange,
      options,
      disabled,
      searchable = false,
      clearable = false,
      searchPlaceholder = "Tìm kiếm",
      emptyMessage = "Không tìm thấy kết quả",
      id,
      children,
    },
    ref
  ) => {
    const generatedId = React.useId()
    const selectId = id || generatedId
    const [open, setOpen] = React.useState(false)
    const selectedOption = options?.find((option) =>
      (typeof option === "string" ? option : option.value) === value
    )
    const selectedLabel = typeof selectedOption === "string"
      ? selectedOption
      : selectedOption?.label
    const useSearchableDropdown = Boolean(options && (searchable || clearable))

    const field = useSearchableDropdown ? (
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={selectId}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              disabled={disabled}
              className={cn(
                "h-11 w-full justify-between rounded-md border border-slate-300 bg-background px-3 font-normal text-foreground hover:bg-background hover:border-slate-400 hover:text-foreground focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-colors",
                clearable && value && "pr-16",
                !selectedLabel && "text-muted-foreground",
                triggerClassName,
                error && "!border-red-500 focus:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/30"
              )}
            >
              <span className={cn("min-w-0 flex-1 truncate text-left", value?.includes("L4") && "text-red-600 font-bold")}>
                {selectedLabel || placeholder}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "w-[var(--radix-popover-trigger-width)] overflow-hidden p-0",
            contentClassName
          )}
        >
          <Command>
            {searchable && <CommandInput placeholder={searchPlaceholder} />}
            <CommandList
              className="max-h-52 overscroll-contain touch-pan-y"
              onWheel={(event) => {
                event.stopPropagation()
                event.preventDefault()
                event.currentTarget.scrollTop += event.deltaY
              }}
              onTouchMove={(event) => event.stopPropagation()}
            >
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options?.map((option) => {
                  const optionValue = typeof option === "string" ? option : option.value
                  const optionLabel = typeof option === "string" ? option : option.label
                  const optionDisabled = typeof option === "string" ? false : option.disabled

                  return (
                    <CommandItem
                      key={optionValue}
                      value={typeof optionLabel === "string" ? optionLabel : optionValue}
                      disabled={optionDisabled}
                      onSelect={() => {
                        if (optionDisabled) return
                        onValueChange?.(optionValue)
                        setOpen(false)
                      }}
                      className={cn(
                        "rounded-none px-3 py-2 text-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
                        value === optionValue && "bg-primary/10 text-primary",
                        optionValue.includes("L4") && "text-red-600 font-bold",
                        optionDisabled && "opacity-50 cursor-not-allowed pointer-events-none bg-slate-50 text-muted-foreground"
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-primary",
                          value === optionValue ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{optionLabel}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          </PopoverContent>
        </Popover>
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Xóa lựa chọn"
            className="absolute right-9 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => onValueChange?.("")}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    ) : (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger ref={ref} id={selectId} aria-invalid={Boolean(error)} className={cn("h-11", triggerClassName, error && "!border-red-500 focus:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/30")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn("max-h-80", contentClassName)}>
          {options
            ? options.map((opt) => {
                const optValue = typeof opt === "string" ? opt : opt.value
                const optLabel = typeof opt === "string" ? opt : opt.label
                const optDisabled = typeof opt === "string" ? false : opt.disabled
                return (
                  <SelectItem key={optValue} value={optValue} disabled={optDisabled}>
                    {optLabel}
                  </SelectItem>
                )
              })
            : children}
        </SelectContent>
      </Select>
    )

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <Label htmlFor={selectId} className={cn("text-sm font-medium text-foreground", labelClassName)}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        {field}
        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-xs font-normal text-red-500 mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)
SelectField.displayName = "SelectField"

export interface TextareaFieldProps extends React.ComponentProps<typeof Textarea> {
  label?: React.ReactNode
  required?: boolean
  error?: string
  description?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
}

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      label,
      required,
      error,
      description,
      containerClassName,
      labelClassName,
      id,
      className,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const textareaId = id || generatedId

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <Label htmlFor={textareaId} className={cn("text-sm font-medium text-foreground", labelClassName)}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        <Textarea
          id={textareaId}
          ref={ref}
          className={cn(
            error && "!border-red-500 focus:!border-red-500 focus-visible:!border-red-500 focus-visible:!ring-2 focus-visible:!ring-red-500/30",
            className
          )}
          {...props}
        />
        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-xs font-normal text-red-500 mt-0.5">{error}</p>
        )}
      </div>
    )
  }
)
TextareaField.displayName = "TextareaField"
