import React, { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FilePlus2,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { defaultHrmExpertRepository } from "../repositories/hrm-expert.storage"
import type {
  ExpertProfileRecord,
  ExpertProposalRecord,
} from "../types/hrm-expert.types"
import { exportProposalTeamToExcel } from "../utils/expert-export"
import { DEGREE_LABELS } from "../utils/expert-search"

interface ExpertProposalTabProps {
  proposals: ExpertProposalRecord[]
  allExperts: ExpertProfileRecord[]
  selectedProposalId: string
  onSelectProposal: (id: string) => void
  onOpenCreateProposal: () => void
  onOpenExportProposal: (proposal: ExpertProposalRecord) => void
  onProposalUpdated: () => void
}

export function ExpertProposalTab({
  proposals,
  allExperts,
  selectedProposalId,
  onSelectProposal,
  onOpenCreateProposal,
  onOpenExportProposal,
  onProposalUpdated,
}: ExpertProposalTabProps) {
  const currentProposal = useMemo(() => {
    return (
      proposals.find((p) => p.id === selectedProposalId) || proposals[0] || null
    )
  }, [proposals, selectedProposalId])

  const expertMap = useMemo(() => {
    return new Map(allExperts.map((e) => [e.id, e]))
  }, [allExperts])

  // Danh sách chuyên gia chưa có trong đề án hiện tại
  const unassignedExperts = useMemo(() => {
    if (!currentProposal) return []
    const assignedIds = new Set(currentProposal.assignedExperts.map((a) => a.expertId))
    return allExperts.filter((e) => !assignedIds.has(e.id))
  }, [currentProposal, allExperts])

  // State thêm nhanh chuyên gia
  const [selectedExpertToAdd, setSelectedExpertToAdd] = useState("")
  const [assignedRoleToAdd, setAssignedRoleToAdd] = useState("Kỹ sư chuyên môn")
  const [assignedNotesToAdd, setAssignedNotesToAdd] = useState("")

  // Kiểm tra tiêu chuẩn tuân thủ hồ sơ thầu (RFP Compliance Check)
  const complianceCheck = useMemo(() => {
    if (!currentProposal) {
      return { hasLead: false, countOk: false, hasCerts: false }
    }
    const hasLead = currentProposal.assignedExperts.some((a) =>
      a.assignedRole.toLowerCase().includes("chủ nhiệm")
    )
    const countOk = currentProposal.assignedExperts.length >= 3
    const hasCerts = currentProposal.assignedExperts.some((a) => {
      const exp = expertMap.get(a.expertId)
      return (exp?.certificates.length || 0) > 0
    })
    return { hasLead, countOk, hasCerts }
  }, [currentProposal, expertMap])

  const handleAddExpertToProposal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProposal || !selectedExpertToAdd) return

    const updated = {
      ...currentProposal,
      assignedExperts: [
        ...currentProposal.assignedExperts,
        {
          expertId: selectedExpertToAdd,
          assignedRole: assignedRoleToAdd,
          notes: assignedNotesToAdd,
        },
      ],
    }

    defaultHrmExpertRepository.saveProposal(updated)
    setSelectedExpertToAdd("")
    setAssignedRoleToAdd("Kỹ sư chuyên môn")
    setAssignedNotesToAdd("")
    onProposalUpdated()
    toast.success("Đã thêm chuyên gia vào đội ngũ đề án!")
  }

  const handleRemoveExpert = (expertId: string) => {
    if (!currentProposal) return

    const updated = {
      ...currentProposal,
      assignedExperts: currentProposal.assignedExperts.filter(
        (a) => a.expertId !== expertId
      ),
    }

    defaultHrmExpertRepository.saveProposal(updated)
    onProposalUpdated()
    toast.info("Đã xóa chuyên gia khỏi đề án.")
  }

  const handleExportExcel = () => {
    if (!currentProposal) return
    exportProposalTeamToExcel(currentProposal, allExperts)
    toast.success("Đã xuất Excel hồ sơ năng lực nhân sự thầu!")
  }

  if (!currentProposal) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Chưa có đề án nào. Hãy bấm "Tạo đề án mới" để bắt đầu.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 1. Header chọn đề án & Hành động */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="w-72">
            <Label className="text-[11px] text-muted-foreground font-medium mb-1 block">
              Chọn hồ sơ đề án / gói thầu đang lập:
            </Label>
            <Select value={currentProposal.id} onValueChange={onSelectProposal}>
              <SelectTrigger className="h-8.5 text-xs font-semibold bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {proposals.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.id}: {p.proposalTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 text-xs text-muted-foreground">
            Chủ đầu tư: <strong className="text-foreground">{currentProposal.funder}</strong> •{" "}
            Số lượng: <strong className="text-primary">{currentProposal.assignedExperts.length}</strong> chuyên gia
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8.5 text-xs gap-1.5"
            title="Xuất bảng Excel hồ sơ thầu"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenExportProposal(currentProposal)}
            className="h-8.5 text-xs gap-1.5"
            title="Xem trước bản in hồ sơ thầu"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xem & In hồ sơ</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreateProposal}
            className="h-8.5 text-xs gap-1.5 font-medium shadow-xs"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            <span>Đề án mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Tiêu chuẩn tuân thủ hồ sơ thầu (RFP Compliance Check) */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">
            Đánh giá đáp ứng yêu cầu hồ sơ mời thầu:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            {complianceCheck.hasLead ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>Chủ nhiệm đề án: <strong>{complianceCheck.hasLead ? "Đã có" : "Chưa bố trí"}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            {complianceCheck.countOk ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>Quy mô đội ngũ: <strong>{currentProposal.assignedExperts.length}/3 chuyên gia</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            {complianceCheck.hasCerts ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>Chứng chỉ hành nghề: <strong>{complianceCheck.hasCerts ? "Đầy đủ" : "Cần bổ sung"}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Bảng danh sách Chuyên gia trong đề án sử dụng PaginatedDataTable chuẩn */}
      <PaginatedDataTable
        data={currentProposal.assignedExperts}
        columns={[
          {
            key: "stt",
            header: "STT",
            headClassName: "w-12 text-center font-bold text-foreground",
            cellClassName: "text-center font-medium text-muted-foreground",
            render: (_item, rowIndex) => rowIndex + 1,
          },
          {
            key: "assignedRole",
            header: "Vai trò trong đề án",
            headClassName: "min-w-[160px] font-bold text-primary",
            cellClassName: "font-semibold",
            render: (assigned) => (
              <Badge
                variant="outline"
                className="font-semibold text-primary bg-primary/5 border-primary/20 text-[11px]"
              >
                {assigned.assignedRole}
              </Badge>
            ),
          },
          {
            key: "expertInfo",
            header: "Chuyên gia",
            headClassName: "min-w-[180px] font-bold text-foreground",
            render: (assigned) => {
              const expert = expertMap.get(assigned.expertId)
              return expert ? (
                <div>
                  <div className="font-bold text-foreground">{expert.fullName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {expert.employeeCode} • {expert.department}
                  </div>
                </div>
              ) : (
                "Không tìm thấy"
              )
            },
          },
          {
            key: "primarySpecialty",
            header: "Chuyên ngành chính",
            headClassName: "min-w-[150px] font-semibold text-foreground",
            render: (assigned) => {
              const expert = expertMap.get(assigned.expertId)
              return expert?.primarySpecialty || "—"
            },
          },
          {
            key: "academicDegree",
            header: "Học vị",
            headClassName: "w-24 text-center font-semibold text-foreground",
            cellClassName: "text-center",
            render: (assigned) => {
              const expert = expertMap.get(assigned.expertId)
              return (
                <Badge variant="outline" className="text-[10px]">
                  {expert ? DEGREE_LABELS[expert.academicDegree] : "—"}
                </Badge>
              )
            },
          },
          {
            key: "yearsOfExperience",
            header: "Kinh nghiệm",
            headClassName: "w-24 text-center font-semibold text-foreground",
            cellClassName: "text-center font-mono font-medium",
            render: (assigned) => {
              const expert = expertMap.get(assigned.expertId)
              return expert ? `${expert.yearsOfExperience} năm` : "—"
            },
          },
          {
            key: "certificates",
            header: "Chứng chỉ phù hợp",
            headClassName: "min-w-[200px] font-semibold text-foreground",
            cellClassName: "text-[11px] text-muted-foreground",
            render: (assigned) => {
              const expert = expertMap.get(assigned.expertId)
              return expert?.certificates.length
                ? expert.certificates.map((c) => c.name).join(", ")
                : "Chưa cập nhật"
            },
          },
          {
            key: "notes",
            header: "Ghi chú phân công",
            headClassName: "min-w-[160px] font-semibold text-foreground",
            cellClassName: "text-[11px] text-muted-foreground italic",
            render: (assigned) => assigned.notes || "—",
          },
          {
            key: "actions",
            header: "Xóa",
            headClassName: "w-16 text-center font-bold text-foreground",
            cellClassName: "text-center",
            render: (assigned) => (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveExpert(assigned.expertId)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Xóa khỏi đề án"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ),
          },
        ]}
        rowKey={(row) => row.expertId}
        defaultPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        bordered
        minTableWidth="1100px"
        emptyMessage="Chưa có chuyên gia nào được gán vào đề án này. Sử dụng khung bên dưới để thêm nhân sự."
      />

      {/* 4. Khung Thêm nhanh chuyên gia vào đề án */}
      <Card className="border border-border/80 bg-card shadow-xs rounded-xl p-4">
        <form onSubmit={handleAddExpertToProposal} className="space-y-3 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1.5 pb-1 border-b border-border/50">
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span>Thêm chuyên gia vào đề án: {currentProposal.proposalTitle}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Chọn chuyên gia từ danh sách
              </Label>
              <Select
                value={selectedExpertToAdd}
                onValueChange={setSelectedExpertToAdd}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn chuyên gia" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedExperts.map((exp) => (
                    <SelectItem key={exp.id} value={exp.id} className="text-xs">
                      {exp.fullName} ({DEGREE_LABELS[exp.academicDegree]} • {exp.yearsOfExperience} năm KN • {exp.primarySpecialty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Vai trò dự kiến trong đề án mới
              </Label>
              <Select
                value={assignedRoleToAdd}
                onValueChange={setAssignedRoleToAdd}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chủ nhiệm đề án" className="text-xs">Chủ nhiệm đề án</SelectItem>
                  <SelectItem value="Phó chủ nhiệm kỹ thuật" className="text-xs">Phó chủ nhiệm kỹ thuật</SelectItem>
                  <SelectItem value="Kỹ sư trưởng phương pháp" className="text-xs">Kỹ sư trưởng phương pháp</SelectItem>
                  <SelectItem value="Tổ trưởng khảo sát thực địa" className="text-xs">Tổ trưởng khảo sát thực địa</SelectItem>
                  <SelectItem value="Kỹ sư xử lý & minh giải 3D" className="text-xs">Kỹ sư xử lý & minh giải 3D</SelectItem>
                  <SelectItem value="Kỹ sư an toàn phóng xạ" className="text-xs">Kỹ sư an toàn phóng xạ</SelectItem>
                  <SelectItem value="Kỹ sư định vị trắc địa UAV" className="text-xs">Kỹ sư định vị trắc địa UAV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Ghi chú phân công
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={assignedNotesToAdd}
                  onChange={(e) => setAssignedNotesToAdd(e.target.value)}
                  placeholder="Ghi chú nhiệm vụ cụ thể..."
                  className="h-8.5 text-xs bg-background"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedExpertToAdd}
                  className="h-8.5 text-xs gap-1 font-medium shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
