import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const primaryButtonStates =
  "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-primary-dark disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100"

const outlineButtonStates =
  "border border-primary bg-background text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:border-primary-dark active:bg-primary/10 active:text-primary-dark disabled:border-button-disabled disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: primaryButtonStates,
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-destructive/80 disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100",
        outline: outlineButtonStates,
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-secondary/70 disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100",
        ghost:
          "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:text-button-disabled-foreground disabled:opacity-100",
        link: "text-primary underline-offset-4 hover:underline focus-visible:underline disabled:text-button-disabled-foreground disabled:opacity-100",
        success:
          "bg-success text-white hover:bg-success-hover focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-success-hover/90 disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-warning/80 disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100",
        construction:
          "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:from-primary/80 active:to-secondary/80 shadow-construction disabled:bg-button-disabled disabled:text-button-disabled-foreground disabled:opacity-100 disabled:from-button-disabled disabled:to-button-disabled",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
