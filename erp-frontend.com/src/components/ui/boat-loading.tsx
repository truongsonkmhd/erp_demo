import * as React from "react"
import boatImage from "@/assets/img/icon_broad.jpg"
import { cn } from "@/lib/utils"

export interface BoatLoadingProps {
  label?: string
  className?: string
  compact?: boolean
  fullScreen?: boolean
}

export function BoatLoading({
  label = "Đang tải dữ liệu",
  className,
  compact = false,
  fullScreen = false,
}: BoatLoadingProps) {
  React.useEffect(() => {
    if (!fullScreen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [fullScreen])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        fullScreen && "fixed inset-0 z-[100] gap-4 bg-background/85 backdrop-blur-sm",
        className
      )}
    >
      <div className={cn(
        "boat-loading-track",
        fullScreen ? "h-32 w-56" : compact ? "h-14 w-24" : "h-20 w-36"
      )}>
        <div className="boat-loading-scene">
          <div className="boat-loading-bubbles" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
          </div>
          <img
            src={boatImage}
            alt=""
            aria-hidden="true"
            className="boat-loading-image"
          />
          <div className="boat-loading-foam" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
          </div>
        </div>
      </div>
      <span className={cn(
        "flex items-center gap-1 font-medium text-muted-foreground",
        fullScreen ? "text-base" : "text-sm"
      )}>
        {label}
        <span aria-hidden="true" className="boat-loading-dot">.</span>
        <span aria-hidden="true" className="boat-loading-dot [animation-delay:150ms]">.</span>
        <span aria-hidden="true" className="boat-loading-dot [animation-delay:300ms]">.</span>
      </span>
    </div>
  )
}
