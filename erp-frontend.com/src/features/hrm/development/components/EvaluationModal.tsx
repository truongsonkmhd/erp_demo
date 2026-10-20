import React, { useEffect, useState } from "react"
import { Award, Calendar, Loader2, Save } from "lucide-react"

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
  EvaluationClassification,
  EvaluationFormData,
  EvaluationPeriod,
  EvaluationRecord,
} from "../types/hrm-development.types.ts"

interface EvaluationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord?: EvaluationRecord | null
  employees: EmployeeAccount[]
  onSave: (data: EvaluationRecord) => void
}

const EMPTY_FORM: EvaluationFormData = {
  userId: "",
  employeeCode: "",
  fullName: "",
  year: new Date().getFullYear(),
  period: "year",
  classification: "tot",
  score: 85,
  achievements: "",
  limitations: "",
  evaluator: "Hội đồng Đánh giá Liên đoàn",
  approvalDate: new Date().toISOString().slice(0, 10),
}

export function EvaluationModal({
  open,
  onOpenChange,
  initialRecord,
  employees,
  onSave,
}: EvaluationModalProps) {
  const [formData, setFormData] = useState<EvaluationFormData>(EMPTY_FORM)
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
          year: initialRecord.year,
          period: initialRecord.period,
          classification: initialRecord.classification,
          score: initialRecord.score,
          achievements: initialRecord.achievements,
          limitations: initialRecord.limitations,
          evaluator: initialRecord.evaluator,
          approvalDate: initialRecord.approvalDate,
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
    if (!formData.achievements.trim()) newErrors.achievements = "Vui lòng nêu tóm tắt ưu điểm / thành tích"
    if (!formData.approvalDate) newErrors.approvalDate = "Vui lòng chọn ngày phê duyệt"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      appToast.warning("Vui lòng điền đầy đủ các thông tin bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const record: EvaluationRecord = {
        id: formData.id || `eva-${Date.now()}`,
        userId: formData.userId,
        employeeCode: formData.employeeCode,
        fullName: formData.fullName,
        year: Number(formData.year) || new Date().getFullYear(),
        period: formData.period,
        classification: formData.classification,
        score: formData.score !== undefined ? Number(formData.score) : undefined,
        achievements: formData.achievements.trim(),
        limitations: formData.limitations?.trim() || "Không có tồn tại đáng kể",
        evaluator: formData.evaluator.trim() || "Hội đồng Đánh giá Liên đoàn",
        approvalDate: formData.approvalDate,
        createdAt: initialRecord?.createdAt || new Date().toISOString(),
      }

      onSave(record)
      appToast.success(initialRecord ? "Cập nhật đánh giá xếp loại thành công" : "Thêm mới đánh giá xếp loại thành công")
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
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {initialRecord ? `Chỉnh sửa kết quả đánh giá: ${initialRecord.fullName}` : "Thêm mới đánh giá xếp loại cán bộ"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận kết quả phân loại thi đua, điểm số đánh giá và kết luận của Hội đồng thi đua.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="evaluation-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cán bộ */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Cán bộ được đánh giá <span className="text-destructive">*</span>
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

            {/* Năm đánh giá */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Năm đánh giá</Label>
              <Input
                type="number"
                min="2020"
                max="2030"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Kỳ đánh giá */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Kỳ đánh giá</Label>
              <Select
                value={formData.period}
                onValueChange={(val) => setFormData({ ...formData, period: val as EvaluationPeriod })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="year">Đánh giá cả năm</SelectItem>
                  <SelectItem value="q1">Quý 1</SelectItem>
                  <SelectItem value="q2">Quý 2</SelectItem>
                  <SelectItem value="q3">Quý 3</SelectItem>
                  <SelectItem value="q4">Quý 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mức xếp loại */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Kết quả xếp loại</Label>
              <Select
                value={formData.classification}
                onValueChange={(val) =>
                  setFormData({ ...formData, classification: val as EvaluationClassification })
                }
              >
                <SelectTrigger className="h-9 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="xuat_sac">Hoàn thành xuất sắc nhiệm vụ</SelectItem>
                  <SelectItem value="tot">Hoàn thành tốt nhiệm vụ</SelectItem>
                  <SelectItem value="hoan_thanh">Hoàn thành nhiệm vụ</SelectItem>
                  <SelectItem value="khong_hoan_thanh">Không hoàn thành nhiệm vụ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Điểm số */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Điểm số tự chấm / chấm điểm (thang 100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.score ?? ""}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                placeholder="Ví dụ: 95"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Người đánh giá */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Người / Hội đồng đánh giá</Label>
              <Input
                value={formData.evaluator}
                onChange={(e) => setFormData({ ...formData, evaluator: e.target.value })}
                placeholder="Hội đồng Đánh giá Liên đoàn..."
                className="h-9 text-xs"
              />
            </div>

            {/* Ngày phê duyệt */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày phê duyệt kết quả</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.approvalDate}
                onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                className={`h-9 text-xs ${errors.approvalDate ? "border-destructive" : ""}`}
              />
            </div>

            {/* Ưu điểm / Thành tích */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Ưu điểm / Thành tích nổi bật <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={3}
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                placeholder="Ghi nhận thành tích đạt được trong công tác chuyên môn, quản lý hoặc đề tài..."
                className={`text-xs ${errors.achievements ? "border-destructive" : ""}`}
              />
              {errors.achievements && <p className="text-xs text-destructive">{errors.achievements}</p>}
            </div>

            {/* Hạn chế / Tồn tại */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground">Hạn chế / Điểm cần khắc phục</Label>
              <Textarea
                rows={2}
                value={formData.limitations}
                onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                placeholder="Ghi nhận các mặt còn hạn chế để cán bộ có phương hướng rèn luyện..."
                className="text-xs"
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
              form="evaluation-form"
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
                  <span>{initialRecord ? "Lưu thay đổi" : "Lưu kết quả"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
