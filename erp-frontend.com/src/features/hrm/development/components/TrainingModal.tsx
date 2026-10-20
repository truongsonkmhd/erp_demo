import React, { useEffect, useState } from "react"
import { Calendar, GraduationCap, Loader2, Save } from "lucide-react"

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
import type { TrainingFormData, TrainingRecord, TrainingType, TrainingStatus } from "../types/hrm-development.types.ts"

interface TrainingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord?: TrainingRecord | null
  employees: EmployeeAccount[]
  onSave: (data: TrainingRecord) => void
}

const EMPTY_FORM: TrainingFormData = {
  userId: "",
  employeeCode: "",
  fullName: "",
  courseName: "",
  institution: "",
  trainingType: "tap_huan",
  startDate: "",
  endDate: "",
  cost: 0,
  result: "",
  status: "ongoing",
}

export function TrainingModal({
  open,
  onOpenChange,
  initialRecord,
  employees,
  onSave,
}: TrainingModalProps) {
  const [formData, setFormData] = useState<TrainingFormData>(EMPTY_FORM)
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
          courseName: initialRecord.courseName,
          institution: initialRecord.institution,
          trainingType: initialRecord.trainingType,
          startDate: initialRecord.startDate,
          endDate: initialRecord.endDate,
          cost: initialRecord.cost,
          result: initialRecord.result,
          status: initialRecord.status,
          certificateUrl: initialRecord.certificateUrl,
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
    if (!formData.courseName.trim()) newErrors.courseName = "Vui lòng nhập tên khóa học"
    if (!formData.institution.trim()) newErrors.institution = "Vui lòng nhập cơ sở đào tạo"
    if (!formData.startDate) newErrors.startDate = "Vui lòng chọn ngày bắt đầu"
    if (!formData.endDate) newErrors.endDate = "Vui lòng chọn ngày kết thúc"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      appToast.warning("Vui lòng điền đầy đủ các thông tin bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      const record: TrainingRecord = {
        id: formData.id || `trn-${Date.now()}`,
        userId: formData.userId,
        employeeCode: formData.employeeCode,
        fullName: formData.fullName,
        courseName: formData.courseName.trim(),
        institution: formData.institution.trim(),
        trainingType: formData.trainingType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        cost: Number(formData.cost) || 0,
        result: formData.result.trim() || "Chưa có kết quả",
        status: formData.status,
        createdAt: initialRecord?.createdAt || new Date().toISOString(),
      }

      onSave(record)
      appToast.success(initialRecord ? "Cập nhật hồ sơ đào tạo thành công" : "Thêm mới khóa đào tạo thành công")
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
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {initialRecord ? `Chỉnh sửa hồ sơ đào tạo: ${initialRecord.fullName}` : "Thêm mới hồ sơ đào tạo & bồi dưỡng"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Nhập thông tin khóa học, đơn vị đào tạo, thời gian và kinh phí bồi dưỡng cán bộ.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="training-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cán bộ */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Cán bộ tham gia <span className="text-destructive">*</span>
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

            {/* Tên khóa học */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Tên khóa đào tạo / bồi dưỡng <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                placeholder="Ví dụ: Tập huấn công nghệ đo vẽ từ phổ đa kênh 2026"
                className={`h-9 text-xs ${errors.courseName ? "border-destructive" : ""}`}
              />
              {errors.courseName && <p className="text-xs text-destructive">{errors.courseName}</p>}
            </div>

            {/* Cơ sở đào tạo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Cơ sở / Đơn vị tổ chức đào tạo <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Ví dụ: Trường Đại học Mỏ - Địa chất"
                className={`h-9 text-xs ${errors.institution ? "border-destructive" : ""}`}
              />
              {errors.institution && <p className="text-xs text-destructive">{errors.institution}</p>}
            </div>

            {/* Hình thức đào tạo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Hình thức đào tạo</Label>
              <Select
                value={formData.trainingType}
                onValueChange={(val) => setFormData({ ...formData, trainingType: val as TrainingType })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="tap_huan">Tập huấn chuyên môn</SelectItem>
                  <SelectItem value="chung_chi">Chứng chỉ nghiệp vụ / an toàn</SelectItem>
                  <SelectItem value="chinh_quy">Đào tạo chính quy (Đại học/Sau ĐH)</SelectItem>
                  <SelectItem value="tai_chuc">Đào tạo tại chức / Vừa làm vừa học</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày bắt đầu */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày bắt đầu</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`h-9 text-xs ${errors.startDate ? "border-destructive" : ""}`}
              />
            </div>

            {/* Ngày kết thúc */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Ngày kết thúc</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`h-9 text-xs ${errors.endDate ? "border-destructive" : ""}`}
              />
            </div>

            {/* Kinh phí đào tạo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Kinh phí đào tạo (VND)</Label>
              <Input
                type="number"
                min="0"
                step="500000"
                value={formData.cost || ""}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                placeholder="5000000"
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Trạng thái khóa học</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as TrainingStatus })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="ongoing">Đang theo học</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã tạm hoãn / Hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kết quả / Chứng chỉ */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground">Kết quả / Văn bằng chứng chỉ</Label>
              <Input
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                placeholder="Ví dụ: Đạt chứng chỉ loại Giỏi, Được cấp giấy chứng nhận..."
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
              form="training-form"
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
                  <span>{initialRecord ? "Lưu thay đổi" : "Tạo hồ sơ"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
