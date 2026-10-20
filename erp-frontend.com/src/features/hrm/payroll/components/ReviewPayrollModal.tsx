import React, { useState } from "react"
import { CheckCheck, Landmark, Loader2, RotateCcw, Send, ShieldAlert, ShieldCheck } from "lucide-react"
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
import { defaultHrmPayrollRepository } from "../repositories/hrm-payroll.storage"
import type { PayrollPeriodRecord, PayrollPeriodStatus } from "../types/hrm-payroll.types"
import { formatVND } from "../utils/payroll-calculator"
import { PayrollStatusBadge } from "./PayrollStatusBadge"

interface ReviewPayrollModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: PayrollPeriodRecord | null
  onStatusUpdated: (updated: PayrollPeriodRecord) => void
}

export function ReviewPayrollModal({
  open,
  onOpenChange,
  period,
  onStatusUpdated,
}: ReviewPayrollModalProps) {
  const [notes, setNotes] = useState(period?.reviewNotes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!period) return null

  const handleAction = (newStatus: PayrollPeriodStatus) => {
    setIsSubmitting(true)
    try {
      const updated = defaultHrmPayrollRepository.updatePeriodStatus(
        period.id,
        newStatus,
        newStatus === "approved" || newStatus === "paid" ? "Lãnh đạo Liên đoàn & Kế toán trưởng" : undefined,
        notes
      )
      setIsSubmitting(false)
      onOpenChange(false)
      if (updated) {
        onStatusUpdated(updated)
      }
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Thẩm định & Phê duyệt kỳ lương
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {period.title} • Mã: {period.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* 1. Tóm tắt số liệu kỳ lương */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="font-semibold text-foreground">Trạng thái hiện tại:</span>
              <PayrollStatusBadge status={period.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Tổng số cán bộ: </span>
                <strong className="text-foreground">{period.totalEmployees} người</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Tổng thu nhập gộp (Gross): </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatVND(period.totalGross)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Trích nộp BHXH & Đoàn phí: </span>
                <span className="font-mono text-destructive">
                  -{formatVND(period.totalInsurance)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Thuế TNCN tạm tính: </span>
                <span className="font-mono text-destructive">
                  -{formatVND(period.totalTax)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex justify-between items-center mt-2">
              <span className="font-bold text-foreground">TỔNG QUỸ LƯƠNG THỰC LĨNH (NET):</span>
              <span className="text-base font-extrabold text-primary font-mono">
                {formatVND(period.totalNet)}
              </span>
            </div>
          </div>

          {/* 2. Ý kiến thẩm định */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Ý kiến thẩm định / Căn cứ phê duyệt của Kế toán trưởng & Lãnh đạo
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú thẩm định, nguồn kinh phí đề án hoặc hướng dẫn thanh toán..."
              className="text-xs resize-none h-20"
            />
          </div>

          {/* 3. Phân nhánh hành động workflow */}
          <div className="p-3 bg-muted/20 rounded-xl border border-border/60 text-[11px] text-muted-foreground">
            {period.status === "draft" && (
              <p>
                • Kỳ lương đang ở trạng thái <strong>Dự thảo</strong>. Sau khi rà soát ngày công và phụ cấp, cán bộ Nhân sự gửi sang phòng Kế toán để thẩm định.
              </p>
            )}
            {period.status === "pending_review" && (
              <p>
                • Kỳ lương đang <strong>Chờ thẩm định</strong>. Kế toán trưởng có thể phê duyệt chấp thuận chi trả hoặc trả về dự thảo nếu cần điều chỉnh số liệu.
              </p>
            )}
            {period.status === "approved" && (
              <p>
                • Kỳ lương đã được <strong>Phê duyệt</strong>. Kế toán xác nhận chuyển khoản ngân hàng/kho bạc để hoàn tất chu kỳ lương.
              </p>
            )}
            {period.status === "paid" && (
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ Kỳ lương đã <strong>Chi trả hoàn tất</strong>. Dữ liệu đã được khóa an toàn.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
            disabled={isSubmitting}
          >
            Đóng
          </Button>

          {/* Nút theo trạng thái */}
          {period.status === "draft" && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleAction("pending_review")}
              className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Gửi thẩm định kỳ lương</span>
            </Button>
          )}

          {period.status === "pending_review" && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAction("draft")}
                className="text-xs h-8 gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                disabled={isSubmitting}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Trả về dự thảo</span>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAction("approved")}
                className="text-xs h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                <span>Phê duyệt bảng lương</span>
              </Button>
            </div>
          )}

          {period.status === "approved" && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleAction("paid")}
              className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Landmark className="h-3.5 w-3.5" />
              )}
              <span>Xác nhận đã chi trả lương</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
