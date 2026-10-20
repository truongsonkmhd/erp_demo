import React, { useEffect, useState } from "react"
import {
  Briefcase,
  Building2,
  Calendar,
  FileCheck2,
  FileText,
  Loader2,
  Mail,
  Phone,
  Save,
  User,
  UserPlus,
  X,
} from "lucide-react"

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
import { defaultEmployeeProfileRepository } from "../repositories/employee-profile.storage.ts"
import { validateEmployeeProfileInput } from "../types/employee-profile.schema.ts"
import type {
  EmployeeProfile,
  EmployeeProfileFormData,
  EmployeeRecord,
} from "../types/employee-profile.types.ts"
import { addEmployee, updateEmployee } from "@/services/EmployeeService"

export interface EmployeeProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialRecord?: EmployeeRecord | null
  existingProfiles?: EmployeeProfile[]
  departments?: Array<{ id: number | string; name: string }>
  onSaved?: (savedRecord?: EmployeeRecord) => void
}

const EMPTY_FORM: EmployeeProfileFormData = {
  employeeCode: "",
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: undefined,
  address: "",
  department: "",
  position: "",
  specialty: "",
  qualification: "",
  contractType: "Chính thức",
  contractNumber: "",
  contractStartDate: "",
  contractEndDate: "",
  workStatus: "active",
}

export function EmployeeProfileModal({
  open,
  onOpenChange,
  mode,
  initialRecord,
  existingProfiles = [],
  departments = [],
  onSaved,
}: EmployeeProfileModalProps) {
  const [formData, setFormData] = useState<EmployeeProfileFormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Đổ dữ liệu vào form khi mở popup hoặc đổi record
  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialRecord) {
        setFormData({
          userId: initialRecord.userId,
          employeeCode: initialRecord.employeeCode || "",
          fullName: initialRecord.fullName || "",
          email: initialRecord.email || "",
          phone: initialRecord.phone || "",
          dateOfBirth: initialRecord.dateOfBirth || "",
          gender: initialRecord.gender,
          address: initialRecord.address || "",
          department: initialRecord.department || "",
          position: initialRecord.position || "",
          specialty: initialRecord.specialty || "",
          qualification: initialRecord.qualification || "",
          contractType: initialRecord.contractType || "Chính thức",
          contractNumber: initialRecord.contractNumber || "",
          contractStartDate: initialRecord.contractStartDate || "",
          contractEndDate: initialRecord.contractEndDate || "",
          workStatus: initialRecord.workStatus || "active",
        })
      } else {
        // Tự sinh mã cán bộ gợi ý tiếp theo
        const nextNum = existingProfiles.length + 1
        const autoCode = `CB-${String(nextNum).padStart(4, "0")}`
        setFormData({
          ...EMPTY_FORM,
          employeeCode: autoCode,
        })
      }
      setErrors({})
      setIsDirty(false)
    }
  }, [open, mode, initialRecord, existingProfiles.length])

  const handleChange = (field: keyof EmployeeProfileFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleRequestClose = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      const confirmClose = window.confirm(
        "Bạn có các thay đổi chưa lưu trong biểu mẫu. Bạn có chắc chắn muốn đóng popup?",
      )
      if (!confirmClose) return
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Kiểm tra tính hợp lệ
    const validation = validateEmployeeProfileInput(
      formData,
      existingProfiles,
      mode === "edit" ? initialRecord?.userId : undefined,
    )

    if (!validation.isValid) {
      setErrors(validation.errors)
      appToast.warning("Vui lòng kiểm tra lại các trường thông tin bắt buộc")
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === "create") {
        // 1. Tạo tài khoản người dùng qua API backend
        const account = await addEmployee({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
          role: "staff",
          roleCodes: ["staff"],
          accountType: 2,
          levelId: "executive",
          active: formData.workStatus !== "terminated",
        })

        // 2. Lưu thông tin hồ sơ mở rộng vào kho dữ liệu
        const newProfile: EmployeeProfile = {
          userId: account.id,
          employeeCode: formData.employeeCode.trim(),
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender,
          address: formData.address?.trim() || undefined,
          department: formData.department.trim(),
          position: formData.position.trim(),
          specialty: formData.specialty?.trim() || undefined,
          qualification: formData.qualification?.trim() || undefined,
          contractType: formData.contractType || undefined,
          contractNumber: formData.contractNumber?.trim() || undefined,
          contractStartDate: formData.contractStartDate || undefined,
          contractEndDate: formData.contractEndDate || undefined,
          workStatus: formData.workStatus,
          workHistory: [],
        }

        try {
          defaultEmployeeProfileRepository.save(newProfile)
          appToast.success("Thêm mới hồ sơ cán bộ thành công")
        } catch {
          appToast.warning(
            "Tài khoản đã tạo thành công nhưng chưa thể lưu phần hồ sơ mở rộng cục bộ.",
          )
        }

        setIsDirty(false)
        onOpenChange(false)
        onSaved?.()
      } else if (mode === "edit" && initialRecord) {
        // Cập nhật API Backend
        await updateEmployee(initialRecord.userId, {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || undefined,
          active: formData.workStatus !== "terminated",
        })

        // Cập nhật thông tin mở rộng
        const updatedProfile: EmployeeProfile = {
          userId: initialRecord.userId,
          employeeCode: formData.employeeCode.trim(),
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender,
          address: formData.address?.trim() || undefined,
          department: formData.department.trim(),
          position: formData.position.trim(),
          specialty: formData.specialty?.trim() || undefined,
          qualification: formData.qualification?.trim() || undefined,
          contractType: formData.contractType || undefined,
          contractNumber: formData.contractNumber?.trim() || undefined,
          contractStartDate: formData.contractStartDate || undefined,
          contractEndDate: formData.contractEndDate || undefined,
          workStatus: formData.workStatus,
          workHistory: initialRecord.workHistory || [],
        }

        defaultEmployeeProfileRepository.save(updatedProfile)
        appToast.success("Cập nhật hồ sơ cán bộ thành công")

        setIsDirty(false)
        onOpenChange(false)
        onSaved?.()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra khi lưu thông tin"
      appToast.error("Không thể lưu hồ sơ", msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleRequestClose}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl max-h-[90vh] w-[95vw] p-0 flex flex-col bg-card border border-border shadow-2xl rounded-xl overflow-hidden gap-0">
        {/* Header Popup phong cách Web ERP */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
              {mode === "create" ? <UserPlus className="h-5 w-5" /> : <FileCheck2 className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {mode === "create" ? "Thêm mới hồ sơ cán bộ nhân sự" : `Chỉnh sửa hồ sơ cán bộ: ${initialRecord?.fullName}`}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {mode === "create"
                  ? "Nhập đầy đủ thông tin định danh, vị trí công tác và chế độ hợp đồng cho nhân sự mới."
                  : `Cập nhật thông tin lý lịch và vị trí việc làm của mã cán bộ ${initialRecord?.employeeCode}.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body cuộn mượt */}
        <form id="employee-profile-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nhóm 1: Thông tin cá nhân & Định danh */}
          <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>1. Thông tin cá nhân & Định danh</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã cán bộ */}
              <div className="space-y-1.5">
                <Label htmlFor="employeeCode" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Mã cán bộ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => handleChange("employeeCode", e.target.value.toUpperCase())}
                  placeholder="Ví dụ: CB-0001"
                  className={`h-9 font-mono text-sm ${errors.employeeCode ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.employeeCode ? (
                  <p className="text-xs text-destructive">{errors.employeeCode}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Mã định danh duy nhất của cán bộ trong hệ thống</p>
                )}
              </div>

              {/* Họ và tên */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className={`h-9 text-sm ${errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>

              {/* Ngày sinh */}
              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Ngày sinh</span>
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Giới tính */}
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-semibold text-foreground">
                  Giới tính
                </Label>
                <Select
                  value={formData.gender || "none"}
                  onValueChange={(val) => handleChange("gender", val === "none" ? undefined : val)}
                >
                  <SelectTrigger id="gender" className="h-9 text-sm">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa xác định</SelectItem>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email công vụ */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>Email công vụ</span> <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="canbo@lien-doan-vtdc.gov.vn"
                  className={`h-9 text-sm ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>Số điện thoại</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="0912 345 678"
                  className={`h-9 text-sm ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              {/* Địa chỉ / Quê quán */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="address" className="text-xs font-semibold text-foreground">
                  Địa chỉ thường trú / Nơi ở hiện nay
                </Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Số nhà, đường/phố, phường/xã, quận/huyện, tỉnh/thành phố"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Vị trí việc làm & Đơn vị công tác */}
          <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span>2. Vị trí việc làm & Đơn vị công tác</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Đơn vị / Phòng ban */}
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Đơn vị / Phòng ban <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => handleChange("department", val)}
                >
                  <SelectTrigger
                    id="department"
                    className={`h-9 text-sm ${errors.department ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Chọn phòng ban / đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Phòng Tổ chức - Cán bộ">Phòng Tổ chức - Cán bộ</SelectItem>
                        <SelectItem value="Phòng Kế hoạch - Tài chính">Phòng Kế hoạch - Tài chính</SelectItem>
                        <SelectItem value="Phòng Kỹ thuật Địa vật lý">Phòng Kỹ thuật Địa vật lý</SelectItem>
                        <SelectItem value="Đoàn Địa vật lý 1">Đoàn Địa vật lý 1</SelectItem>
                        <SelectItem value="Đoàn Địa vật lý 2">Đoàn Địa vật lý 2</SelectItem>
                        <SelectItem value="Trung tâm Phân tích Dữ liệu">Trung tâm Phân tích Dữ liệu</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
              </div>

              {/* Vị trí việc làm */}
              <div className="space-y-1.5">
                <Label htmlFor="position" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-muted-foreground" />
                  <span>Vị trí việc làm</span> <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Ví dụ: Kỹ sư địa chất, Chuyên viên..."
                  className={`h-9 text-sm ${errors.position ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.position && <p className="text-xs text-destructive">{errors.position}</p>}
              </div>

              {/* Chuyên môn */}
              <div className="space-y-1.5">
                <Label htmlFor="specialty" className="text-xs font-semibold text-foreground">
                  Chuyên môn đào tạo
                </Label>
                <Input
                  id="specialty"
                  value={formData.specialty || ""}
                  onChange={(e) => handleChange("specialty", e.target.value)}
                  placeholder="Ví dụ: Địa vật lý thăm dò, Trắc địa mỏ..."
                  className="h-9 text-sm"
                />
              </div>

              {/* Trình độ học vấn */}
              <div className="space-y-1.5">
                <Label htmlFor="qualification" className="text-xs font-semibold text-foreground">
                  Trình độ học vấn / Học vị
                </Label>
                <Input
                  id="qualification"
                  value={formData.qualification || ""}
                  onChange={(e) => handleChange("qualification", e.target.value)}
                  placeholder="Ví dụ: Kỹ sư, Cử nhân, Thạc sĩ, Tiến sĩ..."
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 3: Hợp đồng & Trạng thái làm việc */}
          <div className="rounded-lg border border-border/70 bg-background/50 p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50 text-sm font-semibold text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span>3. Hợp đồng lao động & Trạng thái công tác</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loại hợp đồng */}
              <div className="space-y-1.5">
                <Label htmlFor="contractType" className="text-xs font-semibold text-foreground">
                  Loại hợp đồng lao động
                </Label>
                <Select
                  value={formData.contractType || "Chính thức"}
                  onValueChange={(val) => handleChange("contractType", val)}
                >
                  <SelectTrigger id="contractType" className="h-9 text-sm">
                    <SelectValue placeholder="Chọn loại hợp đồng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chính thức">HĐ không xác định thời hạn (Biên chế/Chính thức)</SelectItem>
                    <SelectItem value="Có thời hạn">HĐ xác định thời hạn (1 - 3 năm)</SelectItem>
                    <SelectItem value="Thử việc">Hợp đồng thử việc</SelectItem>
                    <SelectItem value="Thời vụ">Hợp đồng khoán việc / Thời vụ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Số hợp đồng */}
              <div className="space-y-1.5">
                <Label htmlFor="contractNumber" className="text-xs font-semibold text-foreground">
                  Số hiệu hợp đồng
                </Label>
                <Input
                  id="contractNumber"
                  value={formData.contractNumber || ""}
                  onChange={(e) => handleChange("contractNumber", e.target.value)}
                  placeholder="Ví dụ: 12/2026/HĐLĐ-LĐVLĐC"
                  className="h-9 font-mono text-sm"
                />
              </div>

              {/* Ngày bắt đầu hiệu lực */}
              <div className="space-y-1.5">
                <Label htmlFor="contractStartDate" className="text-xs font-semibold text-foreground">
                  Ngày bắt đầu hiệu lực
                </Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  value={formData.contractStartDate || ""}
                  onChange={(e) => handleChange("contractStartDate", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Ngày hết hạn */}
              <div className="space-y-1.5">
                <Label htmlFor="contractEndDate" className="text-xs font-semibold text-foreground">
                  Ngày hết hạn hợp đồng
                </Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate || ""}
                  onChange={(e) => handleChange("contractEndDate", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Trạng thái công tác */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="workStatus" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Trạng thái công tác <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.workStatus}
                  onValueChange={(val) => handleChange("workStatus", val)}
                >
                  <SelectTrigger id="workStatus" className="h-9 text-sm">
                    <SelectValue placeholder="Chọn trạng thái công tác" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang làm việc (Chính thức)</SelectItem>
                    <SelectItem value="probation">Đang thử việc</SelectItem>
                    <SelectItem value="on_leave">Nghỉ phép / Tạm hoãn</SelectItem>
                    <SelectItem value="terminated">Đã nghỉ việc / Chấm dứt hợp đồng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer cố định của Popup */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-muted/40 shrink-0 flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-destructive font-bold">*</span> Thông tin bắt buộc nhập theo quy định
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleRequestClose(false)}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="employee-profile-form"
              size="sm"
              disabled={isSubmitting}
              className="h-9 px-4 text-xs gap-1.5 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{mode === "create" ? "Tạo hồ sơ" : "Lưu thay đổi"}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
