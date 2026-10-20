import * as React from "react"

import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ActionButtonProps extends Omit<ButtonProps, "variant"> {
  appearance?: "primary" | "outline"
  icon?: React.ReactNode
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ appearance = "primary", icon, children, className, type = "button", ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      variant={appearance === "primary" ? "default" : "outline"}
      className={cn("h-10 gap-2 rounded-lg px-4 font-medium", className)}
      {...props}
    >
      {icon}
      {children}
    </Button>
  )
)

ActionButton.displayName = "ActionButton"
