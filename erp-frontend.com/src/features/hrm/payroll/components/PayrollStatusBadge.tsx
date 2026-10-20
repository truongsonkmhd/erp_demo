import React from "react"
import { CheckCircle2, Clock, FileEdit, Landmark } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { PayrollPeriodStatus } from "../types/hrm-payroll.types"

interface PayrollStatusBadgeProps {
  status: PayrollPeriodStatus
  className?: string
}

export function PayrollStatusBadge({ status, className }: PayrollStatusBadgeProps) {
  switch (status) {
    case "draft":
      return (
        <Badge
          variant="outline"
          className={`bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <FileEdit className="h-3 w-3 text-slate-500" />
          <span>Dự thảo</span>
        </Badge>
      )
    case "pending_review":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <Clock className="h-3 w-3 text-amber-500" />
          <span>Chờ thẩm định</span>
        </Badge>
      )
    case "approved":
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <CheckCircle2 className="h-3 w-3 text-blue-500" />
          <span>Đã phê duyệt</span>
        </Badge>
      )
    case "paid":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <Landmark className="h-3 w-3 text-emerald-600" />
          <span>Đã chi trả</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      )
  }
}
