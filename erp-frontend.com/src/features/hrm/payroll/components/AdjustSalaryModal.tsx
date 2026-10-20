import React, { useEffect, useState } from "react"
import { Calculator, Check, DollarSign, FileEdit, Loader2, ShieldCheck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { defaultHrmPayrollRepository } from "../repositories/hrm-payroll.storage"
import type { PayrollItemRecord } from "../types/hrm-payroll.types"
import { calculatePayrollItem, formatVND } from "../utils/payroll-calculator"

interface AdjustSalaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PayrollItemRecord | null
  periodId: string
  onSaved: () => void
}

export function AdjustSalaryModal({
  open,
  onOpenChange,
  item,
  periodId,
  onSaved,
}: AdjustSalaryModalProps) {
  const [formData, setFormData] = useState({
    fieldworkDays: 0,
    hazardAllowance: 0,
    seniorityAllowance: 0,
    overtimePay: 0,
    bonus: 0,
    otherAllowances: 0,
    unpaidLeaveDays: 0,
    dependentsCount: 0,
    notes: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const config = defaultHrmPayrollRepository.getConfig()

  useEffect(() => {
    if (item) {
      setFormData({
        fieldworkDays: item.fieldworkDays || 0,
        hazardAllowance: item.hazardAllowance || 0,
        seniorityAllowance: item.seniorityAllowance || 0,
        overtimePay: item.overtimePay || 0,
        bonus: item.bonus || 0,
        otherAllowances: item.otherAllowances || 0,
        unpaidLeaveDays: item.unpaidLeaveDays || 0,
        dependentsCount: item.dependentsCount || 0,
        notes: item.notes || "",
      })
    }
  }, [item])

  if (!item) return null

  // Tính toán Live Preview tức thời khi người dùng thay đổi giá trị
  const livePreview = calculatePayrollItem(
    {
      ...item,
      fieldworkDays: Number(formData.fieldworkDays) || 0,
      hazardAllowance: Number(formData.hazardAllowance) || 0,
      seniorityAllowance: Number(formData.seniorityAllowance) || 0,
      overtimePay: Number(formData.overtimePay) || 0,
      bonus: Number(formData.bonus) || 0,
      otherAllowances: Number(formData.otherAllowances) || 0,
      unpaidLeaveDays: Number(formData.unpaidLeaveDays) || 0,
      dependentsCount: Number(formData.dependentsCount) || 0,
    },
    config
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      defaultHrmPayrollRepository.updatePayrollItem(periodId, item.id, {
        fieldworkDays: Number(formData.fieldworkDays) || 0,
        hazardAllowance: Number(formData.hazardAllowance) || 0,
        seniorityAllowance: Number(formData.seniorityAllowance) || 0,
        overtimePay: Number(formData.overtimePay) || 0,
        bonus: Number(formData.bonus) || 0,
        otherAllowances: Number(formData.otherAllowances) || 0,
        unpaidLeaveDays: Number(formData.unpaidLeaveDays) || 0,
        dependentsCount: Number(formData.dependentsCount) || 0,
        notes: formData.notes,
      })

      setIsSubmitting(false)
      onOpenChange(false)
      onSaved()
    } catch {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Điều chỉnh tiền lương & Phụ cấp cán bộ
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Cập nhật số ngày thực địa dã ngoại, phụ cấp độc hại và thưởng nhiệm vụ.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 1. Tóm tắt định danh cán bộ */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary font-mono">
              {item.employeeCode.slice(-2)}
            </div>
            <div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                <span>{item.fullName}</span>
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                  {item.employeeCode}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {item.department} • {item.position}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[11px] text-muted-foreground">Ngạch bậc / HSL:</div>
              <div className="font-mono font-semibold text-foreground">
                {item.salaryCoefficient} ({item.payGrade})
              </div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">Lương ngạch bậc:</div>
              <div className="font-mono font-bold text-primary">
                {formatVND(item.baseSalary)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cột 1: Thu nhập & Phụ cấp đặc thù */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border/50 pb-2">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>Phụ cấp địa chất & Các khoản tăng thêm</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Số ngày thực địa dã ngoại
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={31}
                    value={formData.fieldworkDays}
                    onChange={(e) =>
                      setFormData({ ...formData, fieldworkDays: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-xs font-mono"
                  />
                  <div className="text-[10px] text-muted-foreground">
                    (180.000 ₫/ngày công)
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    PC Độc hại phóng xạ/địa chấn
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={formData.hazardAllowance}
                    onChange={(e) =>
                      setFormData({ ...formData, hazardAllowance: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    PC Thâm niên nghề
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={10000}
                    value={formData.seniorityAllowance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seniorityAllowance: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Thưởng hoàn thành đề án
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={100000}
                    value={formData.bonus}
                    onChange={(e) =>
                      setFormData({ ...formData, bonus: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Làm thêm giờ (Overtime)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={50000}
                    value={formData.overtimePay}
                    onChange={(e) =>
                      setFormData({ ...formData, overtimePay: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Phụ cấp khác
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step={50000}
                    value={formData.otherAllowances}
                    onChange={(e) =>
                      setFormData({ ...formData, otherAllowances: parseInt(e.target.value) || 0 })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Cột 2: Giảm trừ & Thuế */}
            <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-card">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground border-b border-border/50 pb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Giảm trừ gia cảnh & Nghỉ phép</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Số ngày nghỉ không lương
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={22}
                    value={formData.unpaidLeaveDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unpaidLeaveDays: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Số người phụ thuộc (Thuế)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={formData.dependentsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dependentsCount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-[11px] font-medium text-muted-foreground">
                  Ghi chú điều chỉnh lương
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Lý do điều chỉnh (kèm số quyết định nếu có)..."
                  className="text-xs resize-none h-20"
                />
              </div>
            </div>
          </div>

          {/* 3. Live Preview Tóm tắt kết quả tính toán */}
          <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2">
            <div className="text-xs font-semibold text-foreground">
              Kết quả tính toán dự kiến:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2 rounded-lg bg-card border border-border/60">
                <div className="text-[11px] text-muted-foreground">Tổng thu nhập (Gross):</div>
                <div className="font-mono font-bold text-foreground">
                  {formatVND(livePreview.grossIncome)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-card border border-border/60">
                <div className="text-[11px] text-muted-foreground">Trừ BHXH + Đoàn phí:</div>
                <div className="font-mono font-semibold text-destructive">
                  -{formatVND(livePreview.totalInsuranceDeduction)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-card border border-border/60">
                <div className="text-[11px] text-muted-foreground">Thuế TNCN tạm tính:</div>
                <div className="font-mono font-semibold text-destructive">
                  -{formatVND(livePreview.personalIncomeTax)}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-[11px] text-primary font-medium">Thực lĩnh mới (Net):</div>
                <div className="font-mono font-bold text-primary text-sm">
                  {formatVND(livePreview.netSalary)}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-8 gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Lưu điều chỉnh</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
