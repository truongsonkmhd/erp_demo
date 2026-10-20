import React from "react"
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { WorkStatus } from "../types/employee-profile.types.ts"

interface EmployeeStatusBadgeProps {
  status: WorkStatus
  className?: string
}

export function EmployeeStatusBadge({ status, className }: EmployeeStatusBadgeProps) {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium",
            className,
          )}
        >
          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Đang làm việc</span>
        </Badge>
      )
    case "probation":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium",
            className,
          )}
        >
          <Clock className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>Thử việc</span>
        </Badge>
      )
    case "on_leave":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-medium",
            className,
          )}
        >
          <AlertCircle className="h-3 w-3 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <span>Nghỉ phép</span>
        </Badge>
      )
    case "terminated":
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400 font-medium",
            className,
          )}
        >
          <XCircle className="h-3 w-3 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          <span>Đã nghỉ / Khóa</span>
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={cn("font-medium", className)}>
          {status}
        </Badge>
      )
  }
}
