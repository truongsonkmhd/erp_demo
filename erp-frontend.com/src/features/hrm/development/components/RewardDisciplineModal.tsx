import React, { useEffect, useState } from "react"
import { Calendar, Loader2, Medal, Save, ShieldAlert } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import type { EmployeeAccount } from "@/services/EmployeeService"
import type {
  RewardDisciplineCategory,
  RewardDisciplineFormData,
  RewardDisciplineRecord,
} from "../types/hrm-development.types.ts"

interface RewardDisciplineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord?: RewardDisciplineRecord | null
  employees: EmployeeAccount[]
  onSave: (data: RewardDisciplineRecord) => void
}

const EMPTY_FORM: RewardDisciplineFormData = {
  userId: "",
  employeeCode: "",
  fullName: "",
  category: "reward",
  form: "Giấy khen Liên đoàn trưởng",
  decisionNumber: "",
  decisionDate: new Date().toISOString().slice(0, 10),
  effectiveDate: new Date().toISOString().slice(0, 10),
  issuer: "Liên đoàn Vật lý Địa chất",
  reason: "",
  notes: "",
}

export function RewardDisciplineModal({
  open,
  onOpenChange,
  initialRecord,
  employees,
  onSave,
}: RewardDisciplineModalProps) {
  const [formData, setFormData] = useState<RewardDisciplineFormData>(EMPTY_FORM)
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
          category: initialRecord.category,
          form: initialRecord.form,
          decisionNumber: initialRecord.decisionNumber,
          decisionDate: initialRecord.decisionDate,
          effectiveDate: initialRecord.effectiveDate,
          issuer: initialRecord.issuer,
          reason: initialRecord.reason,
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
    if (!formData.form.trim()) newErrors.form = "Vui lòng nhập hình thức khen thưởng / kỷ luật"
    if (!formData.reason.trim()) newErrors.reason = "Vui lòng nhập lý do / nội dung cụ thể"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      appToast.warning("Vui lòng điền đầy đủ các thông tin bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const record: RewardDisciplineRecord = {
        id: formData.id || `rd-${Date.now()}`,
        userId: formData.userId,
        employeeCode: formData.employeeCode,
        fullName: formData.fullName,
        category: formData.category,
        form: formData.form.trim(),
        decisionNumber: formData.decisionNumber.trim(),
        decisionDate: formData.decisionDate,
        effectiveDate: formData.effectiveDate,
        issuer: formData.issuer.trim() || "Liên đoàn Vật lý Địa chất",
        reason: formData.reason.trim(),
        notes: formData.notes?.trim(),
        createdAt: initialRecord?.createdAt || new Date().toISOString(),
      }

      onSave(record)
      appToast.success(
        initialRecord
          ? "Cập nhật hồ sơ thành công"
          : formData.category === "reward"
          ? "Thêm mới khen thưởng thành công"
          : "Ghi nhận kỷ luật thành công",
      )
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
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                formData.category === "reward"
                  ? "bg-purple-500/10 border border-purple-500/20 text-purple-600"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-600"
              }`}
            >
              {formData.category === "reward" ? <Medal className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {initialRecord
                  ? `Chỉnh sửa hồ sơ: ${initialRecord.fullName}`
                  : formData.category === "reward"
                  ? "Ghi nhận khen thưởng cán bộ"
                  : "Ghi nhận kỷ luật cán bộ"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Nhập số quyết định, cơ quan ban hành và lý do khen thưởng / xử lý vi phạm kỷ luật.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="rd-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phân loại Khen thưởng hay Kỷ luật */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground">Phân loại nghiệp vụ</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: "reward", form: "Giấy khen Liên đoàn trưởng" })}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    formData.category === "reward"
                      ? "bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-400 ring-2 ring-purple-500/20"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <Medal className="h-4 w-4" />
                  <span>Khen thưởng / Biểu dương</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: "discipline", form: "Khiển trách" })}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    formData.category === "discipline"
                      ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20"
                      : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Kỷ luật / Xử lý vi phạm</span>
                </button>
              </div>
            </div>

            {/* Cán bộ */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Cán bộ áp dụng <span className="text-destructive">*</span>
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

            {/* Hình thức khen thưởng / kỷ luật */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Hình thức {formData.category === "reward" ? "khen thưởng" : "kỷ luật"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.form}
                onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                placeholder={
                  formData.category === "reward"
                    ? "Ví dụ: Chiến sĩ thi đua cơ sở, Bằng khen Bộ TN&MT..."
                    : "Ví dụ: Khiển trách, Cảnh cáo, Hạ bậc lương..."
                }
                className={`h-9 text-xs ${errors.form ? "border-destructive" : ""}`}
              />
              {errors.form && <p className="text-xs text-destructive">{errors.form}</p>}
            </div>

            {/* Số quyết định */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Số quyết định <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.decisionNumber}
                onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                placeholder="Ví dụ: 128/QĐ-LĐVLĐC"
                className={`h-9 text-xs font-mono ${errors.decisionNumber ? "border-destructive" : ""}`}
              />
              {errors.decisionNumber && <p className="text-xs text-destructive">{errors.decisionNumber}</p>}
            </div>

            {/* Cơ quan ban hành */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Cấp / Cơ quan ban hành</Label>
              <Input
                value={formData.issuer}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                placeholder="Ví dụ: Liên đoàn Vật lý Địa chất, Cục Địa chất..."
                className="h-9 text-xs"
              />
            </div>

            {/* Ngày quyết định */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày ban hành</span>
              </Label>
              <Input
                type="date"
                value={formData.decisionDate}
                onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Ngày hiệu lực */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày có hiệu lực</span>
              </Label>
              <Input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {/* Lý do / Nội dung chi tiết */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Lý do khen thưởng / Hành vi vi phạm kỷ luật <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Ghi nhận thành tích đóng góp hoặc nội dung vi phạm..."
                className={`text-xs ${errors.reason ? "border-destructive" : ""}`}
              />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground">Ghi chú thêm</Label>
              <Input
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Thời hạn chấp hành kỷ luật hoặc thông tin phụ lục..."
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
              form="rd-form"
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
                  <span>{initialRecord ? "Lưu thay đổi" : "Lưu hồ sơ"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
