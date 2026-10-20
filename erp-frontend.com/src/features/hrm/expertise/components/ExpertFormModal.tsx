import React, { useEffect, useState } from "react"
import { Award, Briefcase, Check, Plus, Trash2, UserCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { defaultHrmExpertRepository } from "../repositories/hrm-expert.storage"
import type {
  AcademicDegree,
  ExpertCertificate,
  ExpertProfileRecord,
  ExpertProjectExperience,
  ProjectRole,
} from "../types/hrm-expert.types"

interface ExpertFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord: ExpertProfileRecord | null
  onSaved: () => void
}

export function ExpertFormModal({
  open,
  onOpenChange,
  initialRecord,
  onSaved,
}: ExpertFormModalProps) {
  const [employeeProfiles] = useState(() => defaultEmployeeProfileRepository.getAll())

  const [selectedUserId, setSelectedUserId] = useState("")
  const [fullName, setFullName] = useState("")
  const [employeeCode, setEmployeeCode] = useState("")
  const [department, setDepartment] = useState("")
  const [position, setPosition] = useState("")
  const [academicDegree, setAcademicDegree] = useState<AcademicDegree>("ky_su")
  const [primarySpecialty, setPrimarySpecialty] = useState("Địa vật lý thăm dò")
  const [subSpecialtiesText, setSubSpecialtiesText] = useState("")
  const [yearsOfExperience, setYearsOfExperience] = useState(10)
  const [fieldworkReadiness, setFieldworkReadiness] = useState(true)
  const [bioSummary, setBioSummary] = useState("")
  const [ratingScore, setRatingScore] = useState(5.0)

  // Danh sách chứng chỉ động
  const [certificates, setCertificates] = useState<ExpertCertificate[]>([])

  // Danh sách đề án động
  const [projects, setProjects] = useState<ExpertProjectExperience[]>([])

  useEffect(() => {
    if (initialRecord) {
      setSelectedUserId(initialRecord.userId)
      setFullName(initialRecord.fullName)
      setEmployeeCode(initialRecord.employeeCode)
      setDepartment(initialRecord.department)
      setPosition(initialRecord.position)
      setAcademicDegree(initialRecord.academicDegree)
      setPrimarySpecialty(initialRecord.primarySpecialty)
      setSubSpecialtiesText(initialRecord.subSpecialties.join(", "))
      setYearsOfExperience(initialRecord.yearsOfExperience)
      setFieldworkReadiness(initialRecord.fieldworkReadiness)
      setBioSummary(initialRecord.bioSummary)
      setRatingScore(initialRecord.ratingScore)
      setCertificates(initialRecord.certificates || [])
      setProjects(initialRecord.projects || [])
    } else {
      setSelectedUserId("")
      setFullName("")
      setEmployeeCode("")
      setDepartment("Đoàn Địa vật lý 1")
      setPosition("Kỹ sư địa chất")
      setAcademicDegree("ky_su")
      setPrimarySpecialty("Địa vật lý thăm dò")
      setSubSpecialtiesText("Đo từ hàng không, Trọng lực chi tiết")
      setYearsOfExperience(10)
      setFieldworkReadiness(true)
      setBioSummary("")
      setRatingScore(5.0)
      setCertificates([])
      setProjects([])
    }
  }, [initialRecord, open])

  const handleSelectEmployee = (userId: string) => {
    setSelectedUserId(userId)
    const emp = employeeProfiles.find((e) => e.userId === userId)
    if (emp) {
      setFullName((emp as any).fullName || `Cán bộ ${emp.employeeCode}`)
      setEmployeeCode(emp.employeeCode)
      setDepartment(emp.department || "Đoàn Địa vật lý")
      setPosition(emp.position || "Kỹ sư")
    }
  }

  // Quản lý Chứng chỉ
  const handleAddCertificate = () => {
    setCertificates([
      ...certificates,
      {
        id: `cert-${Date.now()}`,
        name: "Chứng chỉ Hành nghề Thăm dò Khoáng sản Hạng I",
        issuer: "Bộ Tài nguyên và Môi trường",
        certificateNumber: `HN-${Math.floor(1000 + Math.random() * 9000)}`,
        issueDate: "2024-01-01",
        verified: true,
      },
    ])
  }

  const handleRemoveCertificate = (id: string) => {
    setCertificates(certificates.filter((c) => c.id !== id))
  }

  // Quản lý Đề án
  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        id: `proj-${Date.now()}`,
        projectName: "Đề án khảo sát địa vật lý mới",
        projectCode: `DA-${new Date().getFullYear()}`,
        role: "lead",
        methodology: ["Đo từ hàng không", "Trọng lực"],
        startYear: 2023,
        endYear: 2025,
        clientOrFunder: "Cục Địa chất Việt Nam",
        resultClassification: "Xuất sắc",
      },
    ])
  }

  const handleRemoveProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const subSpecialties = subSpecialtiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const record: ExpertProfileRecord = {
      id: initialRecord?.id || `EXP-${Math.floor(100 + Math.random() * 900)}`,
      userId: selectedUserId || `user-${Date.now()}`,
      employeeCode: employeeCode || "CB-0001",
      fullName: fullName || "Kỹ sư Địa chất",
      department,
      position,
      academicDegree,
      primarySpecialty,
      subSpecialties,
      yearsOfExperience,
      fieldworkReadiness,
      bioSummary: bioSummary || `Chuyên gia ${primarySpecialty} của Liên đoàn Vật lý Địa chất.`,
      certificates,
      projects,
      publicationsCount: initialRecord?.publicationsCount || projects.length * 2,
      ratingScore,
      updatedAt: new Date().toISOString(),
    }

    defaultHrmExpertRepository.saveExpert(record)
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {initialRecord ? "Cập nhật hồ sơ năng lực chuyên gia" : "Thêm mới hồ sơ chuyên gia"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Quản lý chuyên môn sâu, thâm niên, chứng chỉ và lịch sử tham gia đề án.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* 1. Chọn cán bộ & Thông tin cơ bản */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-3">
            <div className="font-semibold text-foreground">Thông tin cán bộ & Học vị</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!initialRecord && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Chọn cán bộ từ danh sách</Label>
                  <Select value={selectedUserId} onValueChange={handleSelectEmployee}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Chọn cán bộ nhân sự" />
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
                <Label className="text-xs font-medium">Họ và tên chuyên gia</Label>
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

              <div className="space-y-1">
                <Label className="text-xs font-medium">Học vị / Học hàm</Label>
                <Select
                  value={academicDegree}
                  onValueChange={(val) => setAcademicDegree(val as AcademicDegree)}
                >
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue placeholder="Chọn học vị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tien_si" className="text-xs">Tiến sĩ</SelectItem>
                    <SelectItem value="thac_si" className="text-xs">Thạc sĩ</SelectItem>
                    <SelectItem value="ky_su" className="text-xs">Kỹ sư</SelectItem>
                    <SelectItem value="cu_nhan" className="text-xs">Cử nhân</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Số năm kinh nghiệm trong ngành</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Chuyên ngành & Năng lực */}
          <div className="space-y-3 p-3.5 rounded-xl bg-card border border-border/70">
            <div className="font-semibold text-foreground">Chuyên môn sâu & Kỹ thuật địa vật lý</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Chuyên ngành chính</Label>
                <Select value={primarySpecialty} onValueChange={setPrimarySpecialty}>
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue placeholder="Chọn chuyên ngành" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Địa vật lý thăm dò" className="text-xs">
                      Địa vật lý thăm dò
                    </SelectItem>
                    <SelectItem value="Đo từ hàng không" className="text-xs">
                      Đo từ hàng không & Viễn thám
                    </SelectItem>
                    <SelectItem value="Địa chấn & Tai biến địa chất" className="text-xs">
                      Địa chấn & Tai biến địa chất
                    </SelectItem>
                    <SelectItem value="Địa vật lý thực địa & Đo sâu điện" className="text-xs">
                      Địa vật lý thực địa & Đo sâu điện
                    </SelectItem>
                    <SelectItem value="Trắc địa địa vật lý & Viễn thám UAV" className="text-xs">
                      Trắc địa địa vật lý & Viễn thám UAV
                    </SelectItem>
                    <SelectItem value="Kinh tế địa chất & Quản lý đề án" className="text-xs">
                      Kinh tế địa chất & Quản lý đề án
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Kỹ năng phụ / Phương pháp (cách nhau dấu phẩy)</Label>
                <Input
                  value={subSpecialtiesText}
                  onChange={(e) => setSubSpecialtiesText(e.target.value)}
                  placeholder="Vd: Đo từ, Trọng lực chi tiết, Xử lý 3D..."
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="fieldwork"
                checked={fieldworkReadiness}
                onCheckedChange={(val) => setFieldworkReadiness(Boolean(val))}
              />
              <Label htmlFor="fieldwork" className="text-xs cursor-pointer font-medium">
                Sẵn sàng công tác thực địa dã ngoại dài ngày tại các đề án
              </Label>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-medium">Tóm tắt năng lực & Thành tựu nổi bật</Label>
              <Textarea
                value={bioSummary}
                onChange={(e) => setBioSummary(e.target.value)}
                placeholder="Mô tả các hướng nghiên cứu sâu, kinh nghiệm điều hành và thế mạnh kỹ thuật..."
                className="text-xs resize-none h-16"
              />
            </div>
          </div>

          {/* 3. Quản lý Chứng chỉ hành nghề */}
          <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border/70">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" />
                <span>Chứng chỉ hành nghề & An toàn ({certificates.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCertificate}
                className="h-7 text-[11px] gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Thêm chứng chỉ</span>
              </Button>
            </div>

            {certificates.map((cert, idx) => (
              <div
                key={cert.id}
                className="p-2.5 rounded-lg border border-border/60 bg-muted/20 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
              >
                <div className="sm:col-span-2">
                  <Input
                    value={cert.name}
                    onChange={(e) => {
                      const updated = [...certificates]
                      updated[idx].name = e.target.value
                      setCertificates(updated)
                    }}
                    placeholder="Tên chứng chỉ"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Input
                    value={cert.issuer}
                    onChange={(e) => {
                      const updated = [...certificates]
                      updated[idx].issuer = e.target.value
                      setCertificates(updated)
                    }}
                    placeholder="Đơn vị cấp"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <Input
                    value={cert.certificateNumber}
                    onChange={(e) => {
                      const updated = [...certificates]
                      updated[idx].certificateNumber = e.target.value
                      setCertificates(updated)
                    }}
                    placeholder="Số hiệu"
                    className="h-7 text-xs font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCertificate(cert.id)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 4. Quản lý Lịch sử Đề án */}
          <div className="space-y-2 p-3.5 rounded-xl bg-card border border-border/70">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span>Lịch sử đề án đã tham gia ({projects.length})</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProject}
                className="h-7 text-[11px] gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Thêm đề án</span>
              </Button>
            </div>

            {projects.map((proj, idx) => (
              <div
                key={proj.id}
                className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={proj.projectName}
                    onChange={(e) => {
                      const updated = [...projects]
                      updated[idx].projectName = e.target.value
                      setProjects(updated)
                    }}
                    placeholder="Tên đề án / dự án"
                    className="h-7 text-xs font-medium"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveProject(proj.id)}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Vai trò</Label>
                    <Select
                      value={proj.role}
                      onValueChange={(val) => {
                        const updated = [...projects]
                        updated[idx].role = val as ProjectRole
                        setProjects(updated)
                      }}
                    >
                      <SelectTrigger className="h-7 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead" className="text-xs">Chủ nhiệm</SelectItem>
                        <SelectItem value="deputy_lead" className="text-xs">Phó chủ nhiệm</SelectItem>
                        <SelectItem value="chief_engineer" className="text-xs">Kỹ sư trưởng</SelectItem>
                        <SelectItem value="field_leader" className="text-xs">Tổ trưởng thực địa</SelectItem>
                        <SelectItem value="analyst" className="text-xs">Kỹ sư xử lý</SelectItem>
                        <SelectItem value="member" className="text-xs">Thành viên</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] text-muted-foreground">Năm thực hiện</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={proj.startYear}
                        onChange={(e) => {
                          const updated = [...projects]
                          updated[idx].startYear = parseInt(e.target.value) || 2020
                          setProjects(updated)
                        }}
                        className="h-7 text-xs font-mono"
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        value={proj.endYear}
                        onChange={(e) => {
                          const updated = [...projects]
                          updated[idx].endYear = parseInt(e.target.value) || 2022
                          setProjects(updated)
                        }}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Chủ đầu tư / Giao nhiệm vụ</Label>
                    <Input
                      value={proj.clientOrFunder}
                      onChange={(e) => {
                        const updated = [...projects]
                        updated[idx].clientOrFunder = e.target.value
                        setProjects(updated)
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
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
              <span>Lưu hồ sơ chuyên gia</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
