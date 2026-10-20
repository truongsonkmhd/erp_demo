import React from "react"
import { Calendar, CheckCircle2, Clock, FileText, User, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"
import type { LeaveRequestRecord } from "../types/hrm-leave.types.ts"
import { formatLeaveTypeName } from "../utils/leave-export"
import { LeaveStatusBadge } from "./LeaveStatusBadge"

interface LeaveDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: LeaveRequestRecord | null
}

export function LeaveDetailModal({ open, onOpenChange, request }: LeaveDetailModalProps) {
  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] w-[95vw] p-0 flex flex-col bg-card border border-border shadow-2xl rounded-xl overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Chi tiết đơn nghỉ phép: {request.id}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Cán bộ {request.fullName} ({request.employeeCode}) • {request.department}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Thông tin đơn */}
          <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="font-semibold text-foreground">Thông tin chung đơn xin nghỉ</span>
              <LeaveStatusBadge status={request.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Loại nghỉ phép:</span>
                <p className="font-semibold text-primary">{formatLeaveTypeName(request.leaveType)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tổng số ngày nghỉ:</span>
                <p className="font-mono font-bold text-foreground">{request.totalDays} ngày làm việc</p>
              </div>
              <div>
                <span className="text-muted-foreground">Thời gian nghỉ:</span>
                <p className="font-mono font-medium text-foreground">
                  {formatDateVN(request.startDate)} → {formatDateVN(request.endDate)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Người nhận bàn giao:</span>
                <p className="font-medium text-foreground">{request.handoverUserName || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Số điện thoại liên lạc:</span>
                <p className="font-mono text-foreground">{request.contactPhone || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ngày tạo đơn:</span>
                <p className="font-mono text-foreground">{formatDateVN(request.createdAt)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <span className="text-muted-foreground">Lý do xin nghỉ phép:</span>
              <p className="font-medium text-foreground mt-0.5 whitespace-pre-wrap">{request.reason}</p>
            </div>
          </div>

          {/* Lịch sử tiến trình Workflow */}
          <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-3">
            <span className="font-semibold text-foreground flex items-center gap-1.5 pb-2 border-b border-border/50">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Tiến trình xử lý đơn qua Workflow ({request.workflow.length} bước)</span>
            </span>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {request.workflow.map((item, index) => {
                const isApprove = item.action === "approve"
                const isReject = item.action === "reject"
                const isCancel = item.action === "cancel"

                return (
                  <div key={item.id || index} className="relative group">
                    {/* Chấm tròn biểu tượng */}
                    <div
                      className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center border-2 border-background text-white ${
                        isApprove
                          ? "bg-emerald-500"
                          : isReject
                          ? "bg-rose-500"
                          : isCancel
                          ? "bg-muted-foreground"
                          : "bg-primary"
                      }`}
                    >
                      {isApprove ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : isReject ? (
                        <XCircle className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                    </div>

                    <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {item.actorName} ({item.actorRole})
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatDateVN(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-primary">
                        {isApprove
                          ? "Đã phê duyệt chấp thuận"
                          : isReject
                          ? "Đã từ chối đơn"
                          : isCancel
                          ? "Đã hủy đơn"
                          : "Đã nộp đơn xin nghỉ"}
                      </p>
                      {item.comment && (
                        <p className="text-[11px] text-muted-foreground italic bg-background/70 p-1.5 rounded mt-1 border border-border/40">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/40 shrink-0 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Đóng lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
