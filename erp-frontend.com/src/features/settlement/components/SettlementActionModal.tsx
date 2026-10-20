import React, { useState } from "react"
import { AlertCircle, CheckCircle2, CornerUpLeft, RotateCcw, XCircle } from "lucide-react"
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
import type { MaterialSettlement, MaterialSettlementStatus } from "../types/settlement.types"
import { SETTLEMENT_STATUS_CONFIG } from "../types/settlement.constants"
import { MaterialSettlementRepository } from "../repositories/settlement.storage"

export type SettlementWorkflowAction =
  | "unit_confirm"
  | "accounting_review"
  | "submit_approval"
  | "approve"
  | "request_revision"
  | "reject"
  | "reopen"

interface SettlementActionModalProps {
  open: boolean
  onClose: () => void
  settlement: MaterialSettlement | null
  action: SettlementWorkflowAction | null
  onSuccess: () => void
}

export function SettlementActionModal({
  open,
  onClose,
  settlement,
  action,
  onSuccess,
}: SettlementActionModalProps) {
  const [comment, setComment] = useState("")

  if (!settlement || !action) return null

  const getActionConfig = () => {
    switch (action) {
      case "unit_confirm":
        return {
          title: "Đơn vị xác nhận khối lượng quyết toán",
          description: "Xác nhận khối lượng vật tư đã xuất, đã sử dụng và thu hồi hoàn trả tại thực địa.",
          targetStatus: "unit_confirmed" as MaterialSettlementStatus,
          role: "Đơn vị chủ trì thi công",
          requireComment: false,
          btnText: "Xác nhận khối lượng",
          btnVariant: "default" as const,
          icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
        }
      case "accounting_review":
        return {
          title: "Kế toán kiểm tra & thẩm tra định mức",
          description: "Xác nhận số liệu đã đối chiếu khớp đúng với sổ kế toán và đơn giá xuất kho.",
          targetStatus: "accounting_reviewed" as MaterialSettlementStatus,
          role: "Kế toán vật tư",
          requireComment: false,
          btnText: "Xác nhận thẩm tra",
          btnVariant: "default" as const,
          icon: <CheckCircle2 className="h-5 w-5 text-indigo-600" />,
        }
      case "submit_approval":
        return {
          title: "Trình Lãnh đạo Liên đoàn phê duyệt",
          description: "Chuyển hồ sơ quyết toán lên cấp Lãnh đạo Liên đoàn phê duyệt chính thức.",
          targetStatus: "pending_approval" as MaterialSettlementStatus,
          role: "Phòng Kế hoạch - Tài chính",
          requireComment: false,
          btnText: "Trình Lãnh đạo",
          btnVariant: "default" as const,
          icon: <CheckCircle2 className="h-5 w-5 text-amber-600" />,
        }
      case "approve":
        return {
          title: "Phê duyệt quyết toán vật tư chính thức",
          description: "Hồ sơ sẽ hoàn tất quyết toán, khóa dữ liệu và lưu trữ vào sổ sách Liên đoàn.",
          targetStatus: "approved" as MaterialSettlementStatus,
          role: "Lãnh đạo Liên đoàn",
          requireComment: false,
          btnText: "Phê duyệt quyết toán",
          btnVariant: "default" as const,
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        }
      case "request_revision":
        return {
          title: "Yêu cầu chỉnh sửa / Bổ sung hồ sơ",
          description: "Trả hồ sơ về cho đơn vị lập để rà soát lại khối lượng hoặc bổ sung biên bản giải trình.",
          targetStatus: "revision_requested" as MaterialSettlementStatus,
          role: "Ban thẩm định",
          requireComment: true,
          btnText: "Gửi yêu cầu chỉnh sửa",
          btnVariant: "destructive" as const,
          icon: <CornerUpLeft className="h-5 w-5 text-orange-600" />,
        }
      case "reject":
        return {
          title: "Từ chối hồ sơ quyết toán",
          description: "Từ chối quyết toán do sai lệch khối lượng nghiêm trọng hoặc không hợp lệ.",
          targetStatus: "rejected" as MaterialSettlementStatus,
          role: "Ban thẩm định",
          requireComment: true,
          btnText: "Từ chối hồ sơ",
          btnVariant: "destructive" as const,
          icon: <XCircle className="h-5 w-5 text-rose-600" />,
        }
      case "reopen":
        return {
          title: "Mở lại hồ sơ đã quyết toán",
          description: "Chỉ người có thẩm quyền mới được mở lại hồ sơ để điều chỉnh sai sót phát hiện sau.",
          targetStatus: "draft" as MaterialSettlementStatus,
          role: "Quản trị viên / Lãnh đạo",
          requireComment: true,
          btnText: "Xác nhận mở lại",
          btnVariant: "default" as const,
          icon: <RotateCcw className="h-5 w-5 text-purple-600" />,
        }
    }
  }

  const config = getActionConfig()

  const handleSubmit = () => {
    if (config.requireComment && !comment.trim()) {
      toast.error("Hành động này bắt buộc phải nhập lý do / ý kiến giải trình!")
      return
    }

    const updated = MaterialSettlementRepository.updateStatus(
      settlement.id,
      config.targetStatus,
      "System Admin",
      config.role,
      comment.trim()
    )

    if (updated) {
      toast.success(`Đã cập nhật trạng thái hồ sơ "${settlement.code}" thành công!`)
      setComment("")
      onSuccess()
      onClose()
    } else {
      toast.error("Không thể cập nhật trạng thái hồ sơ")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/70 flex flex-row items-start gap-3 space-y-0">
          <div className="p-2 rounded-lg bg-muted shrink-0">{config.icon}</div>
          <div className="space-y-1">
            <DialogTitle className="text-base font-bold leading-snug">{config.title}</DialogTitle>
            <DialogDescription className="text-xs">{config.description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã hồ sơ:</span>
              <span className="font-mono font-bold text-primary">{settlement.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nhiệm vụ:</span>
              <span className="font-semibold text-foreground truncate max-w-[220px]" title={settlement.missionName}>
                {settlement.missionName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái hiện tại:</span>
              <span className="font-medium text-foreground">
                {SETTLEMENT_STATUS_CONFIG[settlement.status]?.label || settlement.status}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Ý kiến xử lý / Lý do {config.requireComment ? "*" : "(Tùy chọn)"}
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                config.requireComment
                  ? "Bắt buộc nhập lý do hoặc yêu cầu chỉnh sửa cụ thể..."
                  : "Nhập nhận xét hoặc lưu ý thẩm tra nếu có..."
              }
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-end gap-2 bg-muted/10">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Hủy
          </Button>
          <Button
            size="sm"
            variant={config.btnVariant}
            onClick={handleSubmit}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <span>{config.btnText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
