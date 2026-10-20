import React, { useEffect, useState } from "react"
import { Calendar, FileText, Loader2, Send } from "lucide-react"

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
  LeaveBalance,
  LeaveRequestFormData,
  LeaveRequestRecord,
  LeaveSession,
  LeaveType,
} from "../types/hrm-leave.types.ts"

interface CreateLeaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserEmployee?: EmployeeAccount | null
  employees: EmployeeAccount[]
  leaveBalance?: LeaveBalance
  onSave: (record: LeaveRequestRecord) => void
}

export function CreateLeaveModal({
  open,
  onOpenChange,
  currentUserEmployee,
  employees,
  leaveBalance,
  onSave,
}: CreateLeaveModalProps) {
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    userId: "",
    employeeCode: "",
    fullName: "",
    department: "",
    position: "",
    leaveType: "annual",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    startSession: "full",
    endSession: "full",
    totalDays: 1,
    reason: "",
    handoverUserId: "",
    handoverUserName: "",
    contactPhone: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Khởi tạo thông tin người nộp đơn
  useEffect(() => {
    if (open) {
      const emp = currentUserEmployee || employees[0]
      if (emp) {
        setFormData({
          userId: emp.id,
          employeeCode: `CB-${String(emp.id).slice(-4)}`,
          fullName: emp.fullName,
          department: emp.department || "Phòng Kỹ thuật Địa vật lý",
          position: emp.position || "Kỹ sư địa chất",
          leaveType: "annual",
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          startSession: "full",
          endSession: "full",
          totalDays: 1,
          reason: "",
          handoverUserId: "",
          handoverUserName: "",
          contactPhone: emp.phone || "",
        })
      }
      setErrors({})
    }
  }, [open, currentUserEmployee, employees])

  // Tự động tính toán số ngày nghỉ khi đổi khoảng ngày
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setFormData((prev) => ({ ...prev, totalDays: diffDays }))
      } else {
        setFormData((prev) => ({ ...prev, totalDays: 0 }))
      }
    }
  }, [formData.startDate, formData.endDate])

  const handleSelectHandover = (val: string) => {
    const found = employees.find((x) => x.id === val)
    setFormData((prev) => ({
      ...prev,
      handoverUserId: val,
      handoverUserName: found ? found.fullName : "",
    }))
  }

  const handleSubmit = (actionType: "submit" | "draft") => {
    const newErrors: Record<string, string> = {}
    if (!formData.reason.trim()) newErrors.reason = "Vui lòng nhập lý do xin nghỉ phép"
    if (!formData.startDate) newErrors.startDate = "Vui lòng chọn ngày bắt đầu"
    if (!formData.endDate) newErrors.endDate = "Vui lòng chọn ngày kết thúc"
    if (formData.totalDays <= 0) newErrors.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu"

    if (formData.leaveType === "annual" && leaveBalance) {
      if (formData.totalDays > leaveBalance.remainingDays) {
        newErrors.totalDays = `Số ngày xin nghỉ (${formData.totalDays}) vượt quá số ngày phép năm còn lại (${leaveBalance.remainingDays} ngày)`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      appToast.warning("Vui lòng kiểm tra lại thông tin đơn nghỉ phép")
      return
    }

    setIsSubmitting(true)
    try {
      const isDraft = actionType === "draft"
      const now = new Date().toISOString()
      const record: LeaveRequestRecord = {
        id: `NP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        userId: formData.userId,
        employeeCode: formData.employeeCode,
        fullName: formData.fullName,
        department: formData.department,
        position: formData.position,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startSession: formData.startSession,
        endSession: formData.endSession,
        totalDays: formData.totalDays,
        reason: formData.reason.trim(),
        handoverUserId: formData.handoverUserId,
        handoverUserName: formData.handoverUserName,
        contactPhone: formData.contactPhone?.trim(),
        status: isDraft ? "draft" : "pending",
        workflow: [
          {
            id: `wf-${Date.now()}`,
            action: isDraft ? "submit" : "submit",
            actorId: formData.userId,
            actorName: formData.fullName,
            actorRole: "Cán bộ",
            timestamp: now,
            comment: isDraft ? "Lưu đơn nháp" : "Gửi đơn chờ Trưởng đơn vị phê duyệt",
          },
        ],
        createdAt: now,
        updatedAt: now,
      }

      onSave(record)
      appToast.success(isDraft ? "Đã lưu đơn nháp thành công" : "Đã gửi đơn nghỉ phép chờ phê duyệt")
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
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Đăng ký đơn xin nghỉ phép
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Điền thông tin thời gian nghỉ, lý do và cán bộ bàn giao công việc để gửi Trưởng đơn vị phê duyệt.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit("submit") }} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Hộp tóm tắt quỹ phép của cán bộ */}
          {leaveBalance && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Quỹ phép năm <strong>{leaveBalance.year}</strong> của bạn:
              </span>
              <div className="flex items-center gap-3 font-mono font-semibold">
                <span className="text-foreground">Tổng: {leaveBalance.totalAnnualLeave} ngày</span>
                <span className="text-muted-foreground">Đã nghỉ: {leaveBalance.usedDays} ngày</span>
                <span className="text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Còn lại: {leaveBalance.remainingDays} ngày
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loại nghỉ phép */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Loại nghỉ phép <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.leaveType}
                onValueChange={(val) => setFormData({ ...formData, leaveType: val as LeaveType })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="annual">Nghỉ phép năm (hưởng nguyên lương, trừ quỹ phép)</SelectItem>
                  <SelectItem value="sick">Nghỉ ốm đau / điều trị y tế (hưởng chế độ BHXH)</SelectItem>
                  <SelectItem value="maternity">Nghỉ chế độ thai sản / nam khi vợ sinh</SelectItem>
                  <SelectItem value="special_paid">Nghỉ việc riêng có hưởng lương (kết hôn, tang chế)</SelectItem>
                  <SelectItem value="unpaid">Nghỉ việc riêng không hưởng lương</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Từ ngày */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Nghỉ từ ngày</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`h-9 text-xs ${errors.startDate ? "border-destructive" : ""}`}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>

            {/* Đến ngày */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span>Đến hết ngày</span> <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`h-9 text-xs ${errors.endDate ? "border-destructive" : ""}`}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>

            {/* Buổi bắt đầu & kết thúc */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Buổi bắt đầu nghỉ</Label>
              <Select
                value={formData.startSession}
                onValueChange={(val) => setFormData({ ...formData, startSession: val as LeaveSession })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="full">Cả ngày</SelectItem>
                  <SelectItem value="morning">Buổi sáng</SelectItem>
                  <SelectItem value="afternoon">Buổi chiều</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Tổng số ngày nghỉ tính toán</Label>
              <div className="h-9 px-3 rounded-md border border-border bg-muted/30 flex items-center font-mono font-bold text-xs text-primary">
                {formData.totalDays} ngày làm việc
              </div>
              {errors.totalDays && <p className="text-xs text-destructive">{errors.totalDays}</p>}
            </div>

            {/* Người nhận bàn giao công việc */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Cán bộ nhận bàn giao công việc</Label>
              <Select value={formData.handoverUserId} onValueChange={handleSelectHandover}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn cán bộ bàn giao..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {employees
                    .filter((e) => e.id !== formData.userId)
                    .map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Số điện thoại liên hệ */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Số điện thoại liên hệ khi cần</Label>
              <Input
                type="tel"
                value={formData.contactPhone || ""}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="0912 345 678"
                className="h-9 text-xs"
              />
            </div>

            {/* Lý do xin nghỉ */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                Lý do xin nghỉ phép <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Nêu cụ thể lý do nghỉ phép, kế hoạch bàn giao công việc trước khi nghỉ..."
                className={`text-xs ${errors.reason ? "border-destructive" : ""}`}
              />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
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
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="h-8 text-xs gap-1"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Lưu nháp</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit("submit")}
              disabled={isSubmitting}
              className="h-8 text-xs gap-1.5 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Gửi đơn duyệt</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
