import React from "react"
import {
  Briefcase,
  Compass,
  Laptop,
  Moon,
  UserCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { AllocationStatus } from "../types/hrm-allocation.types"
import { ALLOCATION_STATUS_LABELS } from "../utils/allocation-calculator"

interface AllocationStatusBadgeProps {
  status: AllocationStatus
  className?: string
}

export function AllocationStatusBadge({
  status,
  className,
}: AllocationStatusBadgeProps) {
  switch (status) {
    case "fieldwork":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <Compass className="h-3 w-3 text-emerald-600" />
          <span>{ALLOCATION_STATUS_LABELS.fieldwork}</span>
        </Badge>
      )
    case "office_specialty":
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <Laptop className="h-3 w-3 text-blue-600" />
          <span>{ALLOCATION_STATUS_LABELS.office_specialty}</span>
        </Badge>
      )
    case "management":
      return (
        <Badge
          variant="outline"
          className={`bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <Briefcase className="h-3 w-3 text-purple-600" />
          <span>{ALLOCATION_STATUS_LABELS.management}</span>
        </Badge>
      )
    case "on_leave":
      return (
        <Badge
          variant="outline"
          className={`bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <Moon className="h-3 w-3 text-slate-500" />
          <span>{ALLOCATION_STATUS_LABELS.on_leave}</span>
        </Badge>
      )
    case "available":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 gap-1 font-medium text-xs py-0.5 ${className}`}
        >
          <UserCheck className="h-3 w-3 text-amber-600" />
          <span>{ALLOCATION_STATUS_LABELS.available}</span>
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
