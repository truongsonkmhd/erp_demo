import { toast } from "@/components/ui/use-toast"
import iconError from "@/assets/ic/icon_error.svg"
import iconSuccess from "@/assets/ic/ic_success.svg"
import iconWarning from "@/assets/ic/ic_warning.svg"
import iconInfo from "@/assets/ic/ic_info.svg"

const toastDuration = 4000

export const appToast = {
  success: (title: string, description?: string) => toast({
    title: (
      <span className="flex items-start gap-3 pr-6 text-toast-success-foreground">
        <img src={iconSuccess} alt="" className="h-8 w-8 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          {description ? (
            <span className="text-sm font-normal leading-snug">{description}</span>
          ) : null}
        </span>
      </span>
    ),
    className:
      "items-start border-toast-success-border bg-toast-success-background text-toast-success-foreground shadow-md [&_[toast-close]]:text-toast-success-foreground/70 [&_[toast-close]]:hover:text-toast-success-foreground",
    duration: toastDuration,
  }),
  warning: (title: string, description?: string) => toast({
    title: (
      <span className="flex items-start gap-3 pr-6 text-toast-warning-foreground">
        <img src={iconWarning} alt="" className="h-8 w-8 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          {description ? (
            <span className="text-sm font-normal leading-snug">{description}</span>
          ) : null}
        </span>
      </span>
    ),
    className:
      "items-start border-toast-warning-border bg-toast-warning-background text-toast-warning-foreground shadow-md [&_[toast-close]]:text-toast-warning-foreground/70 [&_[toast-close]]:hover:text-toast-warning-foreground",
    duration: toastDuration,
  }),
  info: (title: string, description?: string) => toast({
    title: (
      <span className="flex items-start gap-3 pr-6 text-toast-info-foreground">
        <img src={iconInfo} alt="" className="h-8 w-8 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          {description ? (
            <span className="text-sm font-normal leading-snug">{description}</span>
          ) : null}
        </span>
      </span>
    ),
    className:
      "items-start border-toast-info-border bg-toast-info-background text-toast-info-foreground shadow-md [&_[toast-close]]:text-toast-info-foreground/70 [&_[toast-close]]:hover:text-toast-info-foreground",
    duration: toastDuration,
  }),
  error: (title: string, description?: string) => toast({
    title: (
      <span className="flex items-start gap-3 pr-6 text-toast-error-foreground">
        <img src={iconError} alt="" className="h-8 w-8 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
          <span className="text-sm font-semibold leading-tight">{title}</span>
          {description ? (
            <span className="text-sm font-normal leading-snug">{description}</span>
          ) : null}
        </span>
      </span>
    ),
    className:
      "items-start border-toast-error-border bg-toast-error-background text-toast-error-foreground shadow-md [&_[toast-close]]:text-toast-error-foreground/70 [&_[toast-close]]:hover:text-toast-error-foreground",
    duration: toastDuration,
  }),
}
