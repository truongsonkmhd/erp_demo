import React, { useEffect, useState } from "react"
import { Calendar, Loader2, Save, TrendingUp } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EmployeeAccount } from "@/services/EmployeeService"
import type {
  SalaryIncreaseFormData,
  SalaryIncreaseRecord,
  SalaryIncreaseType,
} from "../types/hrm-development.types.ts"

interface SalaryIncreaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord?: SalaryIncreaseRecord | null
  employees: EmployeeAccount[]
  onSave: (data: SalaryIncreaseRecord) => void
}

const EMPTY_FORM: SalaryIncreaseFormData = {
  userId: "",
  employeeCode: "",
  fullName: "",
  decisionNumber: "",
  decisionDate: "",
  effectiveDate: "",
  payGrade: "Kỹ sư địa chất (V.05.02.07)",
  oldStep: 1,
  oldCoefficient: 2.34,
  newStep: 2,
  newCoefficient: 2.67,
  type: "regular",
  signatory: "Liên đoàn trưởng",
  notes: "",
}

export function SalaryIncreaseModal({
  open,
  onOpenChange,
  initialRecord,
  employees,
  onSave,
}: SalaryIncreaseModalProps) {
  const [formData, setFormData] = useState<SalaryIncreaseFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (initialRecord) {
        setFormData({
          id: initialRecord.id,
          userId: initialRecord.userId,
          employeeCode: initialRecord.employeeCode,
          fullName: initialRecord.fullName,
          decisionNumber: initialRecord.decisionNumber,
          decisionDate: initialRecord.decisionDate,
          effectiveDate: initialRecord.effectiveDate,
          payGrade: initialRecord.payGrade,
          oldStep: initialRecord.oldStep,
          oldCoefficient: initialRecord.oldCoefficient,
          newStep: initialRecord.newStep,
          newCoefficient: initialRecord.newCoefficient,
          type: initialRecord.type,
          signatory: initialRecord.signatory,
          notes: initialRecord.notes || "",
        })
      } else {
        const first = employees[0]
        setFormData({
          ...EMPTY_FORM,
          userId: first ? first.id : "",
          employeeCode: first ? `CB-${String(first.id).slice(-4)}` : "CB-0001",
          fullName: first ? first.fullName : "",
        })
      }
      setErrors({})
    }
  }, [open, initialRecord, employees])

  const handleSelectEmployee = (userId: string) => {
    const emp = employees.find((e) => e.id === userId)
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        userId: emp.id,
        employeeCode: `CB-${String(emp.id).slice(-4)}`,
        fullName: emp.fullName,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!formData.userId) newErrors.userId = "Vui lòng chọn cán bộ"
    if (!formData.decisionNumber.trim()) newErrors.decisionNumber = "Vui lòng nhập số quyết định"
    if (!formData.decisionDate) newErrors.decisionDate = "Vui lòng chọn ngày quyết định"
    if (!formData.effectiveDate) newErrors.effectiveDate = "Vui lòng chọn ngày hiệu lực"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      appToast.warning("Vui lòng điền đầy đủ các thông tin bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const record: SalaryIncreaseRecord = {
        id: formData.id || `sal-${Date.now()}`,
        userId: formData.userId,
        employeeCode: formData.employeeCode,
        fullName: formData.fullName,
        decisionNumber: formData.decisionNumber.trim(),
        decisionDate: formData.decisionDate,
        effectiveDate: formData.effectiveDate,
        payGrade: formData.payGrade.trim(),
        oldStep: Number(formData.oldStep),
        oldCoefficient: Number(formData.oldCoefficient),
        newStep: Number(formData.newStep),
        newCoefficient: Number(formData.newCoefficient),
        type: formData.type,
        signatory: formData.signatory.trim() || "Liên đoàn trưởng",
        notes: formData.notes?.trim(),
        createdAt: initialRecord?.createdAt || new Date().toISOString(),
      }

      onSave(record)
      appToast.success(initialRecord ? "Cập nhật quyết định nâng lương thành công" : "Thêm mới quyết định nâng lương thành công")
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
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {initialRecord ? `Chỉnh sửa quyết định nâng lương: ${initialRecord.fullName}` : "Thêm mới quyết định nâng bậc lương"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận số quyết định, ngạch bậc, hệ số lương cũ và hệ số lương mới được áp dụng.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="salary-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cán bộ */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Cán bộ được nâng lương <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.userId} onValueChange={handleSelectEmployee}>
                <SelectTrigger className={`h-9 text-xs ${errors.userId ? "border-destructive" : ""}`}>
                  <SelectValue placeholder="Chọn cán bộ..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && <p className="text-xs text-destructive">{errors.userId}</p>}
            </div>

            {/* Số quyết định */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Số quyết định nâng lương <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.decisionNumber}
                onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                placeholder="Ví dụ: 125/QĐ-LĐVLĐC"
                className={`h-9 text-xs font-mono ${errors.decisionNumber ? "border-destructive" : ""}`}
              />
              {errors.decisionNumber && <p className="text-xs text-destructive">{errors.decisionNumber}</p>}
            </div>

            {/* Hình thức nâng lương */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Hình thức nâng lương</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val as SalaryIncreaseType })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="regular">Nâng lương thường xuyên (theo niên hạn)</SelectItem>
                  <SelectItem value="early">Nâng lương trước thời hạn (thành tích xuất sắc)</SelectItem>
                  <SelectItem value="exceptional">Nâng lương vượt bậc đặc cách</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày quyết định */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày ban hành QĐ</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.decisionDate}
                onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                className={`h-9 text-xs ${errors.decisionDate ? "border-destructive" : ""}`}
              />
            </div>

            {/* Ngày hiệu lực */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày hưởng lương mới</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className={`h-9 text-xs ${errors.effectiveDate ? "border-destructive" : ""}`}
              />
            </div>

            {/* Ngạch lương */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground">Ngạch công chức / chức danh nghề nghiệp</Label>
              <Input
                value={formData.payGrade}
                onChange={(e) => setFormData({ ...formData, payGrade: e.target.value })}
                placeholder="Ví dụ: Kỹ sư địa chất chính (V.05.02.06)"
                className="h-9 text-xs"
              />
            </div>

            {/* Bậc & Hệ số cũ */}
            <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground">Mức lương cũ trước khi nâng:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Bậc cũ</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.oldStep}
                    onChange={(e) => setFormData({ ...formData, oldStep: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Hệ số cũ</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.oldCoefficient}
                    onChange={(e) => setFormData({ ...formData, oldCoefficient: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bậc & Hệ số mới */}
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Mức lương mới được hưởng:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-emerald-700 dark:text-emerald-400">Bậc mới</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.newStep}
                    onChange={(e) => setFormData({ ...formData, newStep: Number(e.target.value) })}
                    className="h-8 text-xs font-mono border-emerald-500/40"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-emerald-700 dark:text-emerald-400">Hệ số mới</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.newCoefficient}
                    onChange={(e) => setFormData({ ...formData, newCoefficient: Number(e.target.value) })}
                    className="h-8 text-xs font-mono border-emerald-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Người ký */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Người ký quyết định</Label>
              <Input
                value={formData.signatory}
                onChange={(e) => setFormData({ ...formData, signatory: e.target.value })}
                placeholder="Liên đoàn trưởng..."
                className="h-9 text-xs"
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Ghi chú thêm</Label>
              <Input
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ví dụ: Nâng bậc định kỳ 3 năm..."
                className="h-9 text-xs"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/40 shrink-0 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="text-destructive font-bold">*</span> Thông tin bắt buộc nhập
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="salary-form"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs gap-1.5 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{initialRecord ? "Lưu thay đổi" : "Lưu quyết định"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
