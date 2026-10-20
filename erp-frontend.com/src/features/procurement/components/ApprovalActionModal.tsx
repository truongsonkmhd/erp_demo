import React, { useState } from "react"
import { AlertCircle, CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { toast } from "sonner"

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
import type {
  ApprovalHistoryEntry,
  PurchaseRequest,
  PurchaseRequestStatus,
} from "../types/procurement.types"
import { PURCHASE_REQUEST_STATUS_CONFIG } from "../types/procurement.constants"
import { PurchaseRequestRepository } from "../repositories/procurement.storage"

interface ApprovalActionModalProps {
  request: PurchaseRequest | null
  actionType: "approve" | "request_revision" | "reject" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser?: { fullName?: string; role?: string }
  onActionComplete: (updatedRequest: PurchaseRequest) => void
}

export function ApprovalActionModal({
  request,
  actionType,
  open,
  onOpenChange,
  currentUser,
  onActionComplete,
}: ApprovalActionModalProps) {
  const [comment, setComment] = useState("")

  if (!request || !actionType) return null

  const getNextStatus = (
    currentStatus: PurchaseRequestStatus,
    action: "approve" | "request_revision" | "reject"
  ): PurchaseRequestStatus => {
    if (action === "reject") return "rejected"
    if (action === "request_revision") return "revision_required"

    switch (currentStatus) {
      case "pending_dept":
        return "pending_planning"
      case "pending_planning":
        return "pending_leader"
      case "pending_leader":
        return "approved"
      default:
        return "approved"
    }
  }

  const getStepName = (status: PurchaseRequestStatus) => {
    switch (status) {
      case "pending_dept":
        return "Trưởng đơn vị phê duyệt"
      case "pending_planning":
        return "Kiểm tra Kế hoạch & Dự toán"
      case "pending_leader":
        return "Lãnh đạo Liên đoàn phê duyệt"
      default:
        return "Xử lý phê duyệt"
    }
  }

  const handleConfirm = () => {
    // Validation
    if ((actionType === "request_revision" || actionType === "reject") && !comment.trim()) {
      toast.error(
        actionType === "reject"
          ? "Bắt buộc nhập lý do từ chối phê duyệt hồ sơ"
          : "Bắt buộc nêu rõ các nội dung yêu cầu đơn vị bổ sung"
      )
      return
    }

    const nextStatus = getNextStatus(request.status, actionType)
    const now = new Date().toISOString()
    const actorName = currentUser?.fullName || "Lãnh đạo thẩm định"
    const actorRole = currentUser?.role || "Người phê duyệt"

    const historyEntry: ApprovalHistoryEntry = {
      id: `wf-${Date.now()}`,
      stepName: getStepName(request.status),
      actorName,
      actorRole,
      action: actionType,
      actionName:
        actionType === "approve"
          ? "Phê duyệt thông qua"
          : actionType === "request_revision"
          ? "Yêu cầu bổ sung hồ sơ"
          : "Từ chối phê duyệt",
      comment: comment.trim() || "Đồng ý phê duyệt nội dung đề xuất",
      timestamp: now,
      previousStatus: request.status,
      newStatus: nextStatus,
    }

    const updatedRequest: PurchaseRequest = {
      ...request,
      status: nextStatus,
      approvalHistory: [...(request.approvalHistory || []), historyEntry],
      updatedAt: now,
    }

    const saved = PurchaseRequestRepository.save(updatedRequest)
    toast.success(
      actionType === "approve"
        ? `Đã phê duyệt đề xuất ${request.code} sang bước tiếp theo!`
        : actionType === "request_revision"
        ? `Đã gửi yêu cầu bổ sung cho đề xuất ${request.code}`
        : `Đã từ chối đề xuất ${request.code}`
    )

    onActionComplete(saved)
    onOpenChange(false)
    setComment("")
  }

  const isReject = actionType === "reject"
  const isRevision = actionType === "request_revision"
  const isApprove = actionType === "approve"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            {isApprove && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {isRevision && <RotateCcw className="h-5 w-5 text-amber-600" />}
            {isReject && <XCircle className="h-5 w-5 text-rose-600" />}
            <span>
              {isApprove && "Phê duyệt đề xuất mua sắm"}
              {isRevision && "Yêu cầu bổ sung hồ sơ"}
              {isReject && "Từ chối đề xuất mua sắm"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hồ sơ: <strong className="font-mono text-primary">{request.code}</strong> • {request.department}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-1">
            <div>
              Đề án: <strong>{request.projectName}</strong>
            </div>
            <div>
              Tổng kinh phí:{" "}
              <strong className="text-primary font-mono text-sm">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
                  request.totalAmount
                )}
              </strong>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Bước hiện tại: {PURCHASE_REQUEST_STATUS_CONFIG[request.status]?.label}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>
                Ý kiến xử lý {isReject || isRevision ? <span className="text-destructive">*</span> : "(Tùy chọn)"}
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                Ghi nhận vào nhật ký kiểm toán
              </span>
            </Label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isApprove
                  ? "Nhập nhận xét hoặc ý kiến chỉ đạo (không bắt buộc)..."
                  : isRevision
                  ? "Nêu rõ các chứng từ, bảng giá hoặc nội dung cần đơn vị giải trình bổ sung..."
                  : "Nêu rõ căn cứ từ chối đề xuất mua sắm này..."
              }
              className="text-xs resize-none bg-background"
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Hủy
          </Button>

          <Button
            size="sm"
            onClick={handleConfirm}
            className={`text-xs gap-1.5 ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : isRevision
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isApprove && <CheckCircle2 className="h-3.5 w-3.5" />}
            {isRevision && <RotateCcw className="h-3.5 w-3.5" />}
            {isReject && <XCircle className="h-3.5 w-3.5" />}
            <span>Xác nhận thực hiện</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
