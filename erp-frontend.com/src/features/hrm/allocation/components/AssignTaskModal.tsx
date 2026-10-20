import React, { useEffect, useState } from "react"
import { Check, Compass, MapPin, Sparkles, UserPlus } from "lucide-react"

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
import { defaultEmployeeProfileRepository } from "../../employee-profiles/repositories/employee-profile.storage"
import { defaultHrmAllocationRepository } from "../repositories/hrm-allocation.storage"
import type {
  AllocationStatus,
  EmployeeAssignmentRecord,
} from "../types/hrm-allocation.types"

interface AssignTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord: EmployeeAssignmentRecord | null
  onSaved: () => void
}

export function AssignTaskModal({
  open,
  onOpenChange,
  initialRecord,
  onSaved,
}: AssignTaskModalProps) {
  const [employeeProfiles] = useState(() => defaultEmployeeProfileRepository.getAll())

  const [userId, setUserId] = useState("")
  const [employeeCode, setEmployeeCode] = useState("")
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")
  const [position, setPosition] = useState("")
  const [projectId, setProjectId] = useState("")
  const [projectName, setProjectName] = useState("")
  const [assignedRole, setAssignedRole] = useState("Kỹ sư thực địa")
  const [allocationPercentage, setAllocationPercentage] = useState(100)
  const [startDate, setStartDate] = useState("2026-10-01")
  const [endDate, setEndDate] = useState("2026-12-31")
  const [currentStatus, setCurrentStatus] = useState<AllocationStatus>("fieldwork")
  const [location, setLocation] = useState("Tây Bắc Bộ")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (initialRecord) {
      setUserId(initialRecord.userId)
      setEmployeeCode(initialRecord.employeeCode)
      setFullName(initialRecord.fullName)
      setDepartment(initialRecord.department)
      setPosition(initialRecord.position)
      setProjectId(initialRecord.projectId)
      setProjectName(initialRecord.projectName)
      setAssignedRole(initialRecord.assignedRole)
      setAllocationPercentage(initialRecord.allocationPercentage)
      setStartDate(initialRecord.startDate)
      setEndDate(initialRecord.endDate)
      setCurrentStatus(initialRecord.currentStatus)
      setLocation(initialRecord.location)
      setNotes(initialRecord.notes || "")
    } else {
      setUserId("")
      setEmployeeCode("")
      setFullName("")
      setDepartment("Đoàn Địa vật lý 1")
      setPosition("Kỹ sư")
      setProjectId("DA-2026-01")
      setProjectName("Đề án khảo sát địa vật lý mới")
      setAssignedRole("Kỹ sư thực địa")
      setAllocationPercentage(100)
      setStartDate("2026-10-01")
      setEndDate("2026-12-31")
      setCurrentStatus("fieldwork")
      setLocation("Lai Châu")
      setNotes("")
    }
  }, [initialRecord, open])

  const handleSelectEmployee = (id: string) => {
    setUserId(id)
    const emp = employeeProfiles.find((e) => e.userId === id)
    if (emp) {
      setEmployeeCode(emp.employeeCode)
      setFullName((emp as any).fullName || `Cán bộ ${emp.employeeCode}`)
      setDepartment(emp.department || "Đoàn Địa vật lý")
      setPosition(emp.position || "Kỹ sư")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const record: EmployeeAssignmentRecord = {
      id: initialRecord?.id || `ASN-${Date.now().toString().slice(-4)}`,
      userId: userId || `user-${Date.now()}`,
      employeeCode: employeeCode || "CB-0001",
      fullName: fullName || "Cán bộ Liên đoàn",
      department,
      position,
      projectId: projectId || "DA-NEW",
      projectName,
      assignedRole,
      allocationPercentage: Number(allocationPercentage) || 0,
      startDate,
      endDate,
      currentStatus,
      location,
      notes,
    }

    defaultHrmAllocationRepository.saveAssignment(record)
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {initialRecord ? "Điều chuyển / Cập nhật phân bổ đề án" : "Phân bổ cán bộ vào đề án / nhiệm vụ"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Thiết lập địa bàn, trạng thái công tác thực địa hoặc nội nghiệp và mức tải phân bổ.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* 1. Chọn cán bộ */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-3">
            <div className="font-semibold text-foreground">Thông tin cán bộ được điều động</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!initialRecord && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Chọn cán bộ</Label>
                  <Select value={userId} onValueChange={handleSelectEmployee}>
                    <SelectTrigger className="h-8.5 text-xs bg-background">
                      <SelectValue placeholder="Chọn cán bộ từ hồ sơ" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeProfiles.map((emp) => (
                        <SelectItem key={emp.userId} value={emp.userId} className="text-xs">
                          {emp.employeeCode} - {(emp as any).fullName || emp.userId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-medium">Họ và tên</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-8.5 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Mã cán bộ</Label>
                <Input
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="h-8.5 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Đơn vị / Phòng ban</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-8.5 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Đề án & Tỷ lệ phân bổ */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-3">
            <div className="font-semibold text-foreground">Nhiệm vụ & Địa bàn công tác</div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Tên đề án / Nhiệm vụ địa chất</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Vd: Đề án bay đo từ - phổ gamma Tây Bắc Bộ..."
                className="h-8.5 text-xs font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Vai trò trong đề án</Label>
                <Select value={assignedRole} onValueChange={setAssignedRole}>
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chủ nhiệm đề án" className="text-xs">Chủ nhiệm đề án</SelectItem>
                    <SelectItem value="Phó chủ nhiệm đề án" className="text-xs">Phó chủ nhiệm đề án</SelectItem>
                    <SelectItem value="Kỹ sư trưởng phương pháp" className="text-xs">Kỹ sư trưởng phương pháp</SelectItem>
                    <SelectItem value="Tổ trưởng thực địa" className="text-xs">Tổ trưởng thực địa</SelectItem>
                    <SelectItem value="Kỹ sư thực địa" className="text-xs">Kỹ sư thực địa</SelectItem>
                    <SelectItem value="Kỹ sư xử lý nội nghiệp" className="text-xs">Kỹ sư xử lý nội nghiệp</SelectItem>
                    <SelectItem value="Chuyên gia phản biện" className="text-xs">Chuyên gia phản biện</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Trạng thái công tác</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(val) => setCurrentStatus(val as AllocationStatus)}
                >
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fieldwork" className="text-xs">Hiện trường dã ngoại</SelectItem>
                    <SelectItem value="office_specialty" className="text-xs">Chuyên môn nội nghiệp</SelectItem>
                    <SelectItem value="management" className="text-xs">Quản lý / Điều hành</SelectItem>
                    <SelectItem value="on_leave" className="text-xs">Đang nghỉ phép</SelectItem>
                    <SelectItem value="available" className="text-xs">Chưa bố trí nhiệm vụ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Tỷ lệ phân bổ thời gian (%)</Label>
                <Select
                  value={allocationPercentage.toString()}
                  onValueChange={(val) => setAllocationPercentage(parseInt(val) || 0)}
                >
                  <SelectTrigger className="h-8.5 text-xs font-mono font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30" className="text-xs">30% (Bán thời gian nhẹ)</SelectItem>
                    <SelectItem value="50" className="text-xs">50% (Nửa thời gian)</SelectItem>
                    <SelectItem value="70" className="text-xs">70% (Trọng tâm)</SelectItem>
                    <SelectItem value="100" className="text-xs">100% (Toàn thời gian)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Địa bàn công tác cụ thể</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Vd: Lai Châu, Đắk Nông..."
                  className="h-8.5 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Ngày bắt đầu</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8.5 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Ngày kết thúc dự kiến</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8.5 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-medium">Ghi chú điều động / Quyết định giao nhiệm vụ</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú kế hoạch khảo sát hoặc số quyết định điều động..."
                className="text-xs resize-none h-16"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Hủy bỏ
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>Xác nhận phân bổ</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
