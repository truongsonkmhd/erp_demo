import { X } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ConfirmationDialogProps {
  open: boolean
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ConfirmationDialog({
  open,
  title = "Xác nhận",
  description,
  confirmLabel = "Đồng ý",
  cancelLabel = "Hủy",
  variant = "default",
  onConfirm,
  onOpenChange,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-xl overflow-hidden p-0">
        <AlertDialogHeader className="relative border-b border-border px-6 py-5 pr-14">
          <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          <AlertDialogCancel asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 mt-0"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </Button>
          </AlertDialogCancel>
        </AlertDialogHeader>
        <AlertDialogDescription className="px-6 py-5 text-base text-foreground/80">
          {description}
        </AlertDialogDescription>
        <AlertDialogFooter className="border-t border-border px-6 py-4">
          <AlertDialogCancel className="min-w-24">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "min-w-24",
              variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
