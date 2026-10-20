import React from "react"
import { CheckCircle2, Clock, FileEdit, XCircle } from "lucide-react"
import type { LeaveStatus } from "../types/hrm-leave.types.ts"

interface LeaveStatusBadgeProps {
  status: LeaveStatus
}

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          <span>Đã phê duyệt</span>
        </span>
      )
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          <span>Chờ phê duyệt</span>
        </span>
      )
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
          <XCircle className="h-3 w-3" />
          <span>Bị từ chối</span>
        </span>
      )
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
          <span>Đã hủy</span>
        </span>
      )
    case "draft":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/60">
          <FileEdit className="h-3 w-3" />
          <span>Bản nháp</span>
        </span>
      )
  }
}
