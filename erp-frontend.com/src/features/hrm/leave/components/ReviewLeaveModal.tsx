import React, { useState } from "react"
import { CheckCircle2, FileCheck2, Loader2, XCircle } from "lucide-react"

import { appToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"
import type { LeaveRequestRecord } from "../types/hrm-leave.types.ts"
import { formatLeaveTypeName } from "../utils/leave-export"
import { LeaveStatusBadge } from "./LeaveStatusBadge"

interface ReviewLeaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: LeaveRequestRecord | null
  onApprove: (id: string, comment?: string) => void
  onReject: (id: string, reason: string) => void
}

export function ReviewLeaveModal({
  open,
  onOpenChange,
  request,
  onApprove,
  onReject,
}: ReviewLeaveModalProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorComment, setErrorComment] = useState<string | null>(null)

  if (!request) return null

  const handleApprove = () => {
    setIsSubmitting(true)
    try {
      onApprove(request.id, comment.trim() || "Đồng ý phê duyệt cho cán bộ nghỉ phép.")
      appToast.success(`Đã phê duyệt đơn nghỉ phép của ${request.fullName}`)
      setComment("")
      setErrorComment(null)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = () => {
    if (!comment.trim()) {
      setErrorComment("Bắt buộc phải nhập lý do khi từ chối đơn nghỉ phép của cán bộ")
      appToast.warning("Vui lòng nhập lý do từ chối đơn")
      return
    }

    setIsSubmitting(true)
    try {
      onReject(request.id, comment.trim())
      appToast.success(`Đã từ chối đơn nghỉ phép của ${request.fullName}`)
      setComment("")
      setErrorComment(null)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] w-[95vw] p-0 flex flex-col bg-card border border-border shadow-2xl rounded-xl overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Thẩm định & Phê duyệt đơn nghỉ phép
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Xem xét đơn nghỉ phép mã {request.id} của cán bộ {request.fullName} ({request.department}).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Thông tin cán bộ & Đơn */}
          <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">{request.fullName}</span>
                <span className="font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {request.employeeCode}
                </span>
              </div>
              <LeaveStatusBadge status={request.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Đơn vị / Phòng ban:</span>
                <p className="font-medium text-foreground">{request.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vị trí việc làm:</span>
                <p className="font-medium text-foreground">{request.position}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Loại nghỉ phép:</span>
                <p className="font-semibold text-primary">{formatLeaveTypeName(request.leaveType)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tổng số ngày xin nghỉ:</span>
                <p className="font-mono font-bold text-foreground text-sm">{request.totalDays} ngày làm việc</p>
              </div>
              <div>
                <span className="text-muted-foreground">Thời gian nghỉ:</span>
                <p className="font-mono font-medium text-foreground">
                  {formatDateVN(request.startDate)} → {formatDateVN(request.endDate)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Cán bộ nhận bàn giao:</span>
                <p className="font-medium text-foreground">{request.handoverUserName || "Chưa phân công"}</p>
              </div>
            </div>

            {request.contactPhone && (
              <div className="pt-2 border-t border-border/40 text-muted-foreground">
                Số điện thoại liên lạc khi cần: <strong className="font-mono text-foreground">{request.contactPhone}</strong>
              </div>
            )}
          </div>

          {/* Lý do xin nghỉ */}
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1">
            <span className="font-semibold text-foreground">Lý do xin nghỉ phép:</span>
            <p className="text-muted-foreground whitespace-pre-wrap">{request.reason}</p>
          </div>

          {/* Ô nhập ý kiến phê duyệt / lý do từ chối */}
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="review-comment" className="font-semibold text-foreground flex items-center justify-between">
              <span>Ý kiến phê duyệt / Lý do từ chối đơn:</span>
              <span className="text-muted-foreground font-normal text-[11px]">(Bắt buộc nhập nếu từ chối)</span>
            </Label>
            <Textarea
              id="review-comment"
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                if (errorComment) setErrorComment(null)
              }}
              placeholder="Nhập ý kiến lãnh đạo đơn vị, phân công chỉ đạo hoặc lý do không chấp thuận..."
              className={`text-xs ${errorComment ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {errorComment && <p className="text-xs text-destructive">{errorComment}</p>}
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/40 shrink-0 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-8 text-xs"
          >
            Đóng lại
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting || request.status !== "pending"}
              className="h-8 text-xs gap-1.5"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              <span>Từ chối đơn</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleApprove}
              disabled={isSubmitting || request.status !== "pending"}
              className="h-8 text-xs gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Phê duyệt đơn</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
