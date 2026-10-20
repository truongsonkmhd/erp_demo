import React from "react"
import { Download, FileText, Printer, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  ExpertProfileRecord,
  ExpertProposalRecord,
} from "../types/hrm-expert.types"
import { exportProposalTeamToExcel } from "../utils/expert-export"
import { DEGREE_LABELS } from "../utils/expert-search"

interface ProposalExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: ExpertProposalRecord | null
  allExperts: ExpertProfileRecord[]
}

export function ProposalExportModal({
  open,
  onOpenChange,
  proposal,
  allExperts,
}: ProposalExportModalProps) {
  if (!proposal) return null

  const expertMap = new Map(allExperts.map((e) => [e.id, e]))

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    exportProposalTeamToExcel(proposal, allExperts)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-2xl p-6 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Hồ sơ năng lực nhân sự đề án / Gói thầu
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Mã đề án: {proposal.id} • {proposal.funder}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs h-8 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In tài liệu</span>
              </Button>
              <Button
                size="sm"
                onClick={handleExportExcel}
                className="text-xs h-8 gap-1.5 font-medium"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất Excel hồ sơ</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Header Thông tin đề án */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase">
              BỘ TÀI NGUYÊN VÀ MÔI TRƯỜNG • LIÊN ĐOÀN VẬT LÝ ĐỊA CHẤT
            </div>
            <h2 className="text-base font-bold text-foreground uppercase">
              {proposal.proposalTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-muted-foreground">Chủ đầu tư / Cơ quan giao: </span>
                <strong className="text-foreground">{proposal.funder}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Thời gian dự kiến: </span>
                <span className="font-mono text-foreground font-semibold">
                  {proposal.expectedDuration || "Theo tiến độ phê duyệt"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Phương pháp kỹ thuật áp dụng: </span>
                <span className="text-foreground font-medium">
                  {proposal.targetMethodology.join(" • ")}
                </span>
              </div>
            </div>
          </div>

          {/* Bảng Danh sách Chuyên gia chủ chốt */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span>BẢNG KÊ DANH SÁCH NHÂN SỰ CHỦ CHỐT ĐỀ XUẤT ({proposal.assignedExperts.length} chuyên gia)</span>
              </div>
            </div>

            <div className="border border-border/80 rounded-xl overflow-hidden">
              <Table className="text-xs">
                <TableHeader className="bg-muted/40">
                  <TableRow className="h-9">
                    <TableHead className="w-10 text-center font-bold">STT</TableHead>
                    <TableHead className="min-w-[140px] font-bold">Vai trò đề xuất</TableHead>
                    <TableHead className="min-w-[160px] font-bold">Họ và tên</TableHead>
                    <TableHead className="min-w-[100px] font-semibold">Học vị</TableHead>
                    <TableHead className="min-w-[140px] font-semibold">Chuyên ngành</TableHead>
                    <TableHead className="w-20 text-center font-semibold">Thâm niên</TableHead>
                    <TableHead className="min-w-[180px] font-semibold">Chứng chỉ hành nghề</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {proposal.assignedExperts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Chưa có chuyên gia nào được gán vào đề án này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    proposal.assignedExperts.map((assigned, idx) => {
                      const expert = expertMap.get(assigned.expertId)
                      return (
                        <TableRow key={assigned.expertId} className="h-10 hover:bg-muted/20">
                          <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            {assigned.assignedRole}
                          </TableCell>
                          <TableCell>
                            {expert ? (
                              <div>
                                <div className="font-bold text-foreground">{expert.fullName}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {expert.employeeCode} • {expert.department}
                                </div>
                              </div>
                            ) : (
                              "Chưa rõ chuyên gia"
                            )}
                          </TableCell>
                          <TableCell>
                            {expert ? DEGREE_LABELS[expert.academicDegree] : "—"}
                          </TableCell>
                          <TableCell>{expert?.primarySpecialty || "—"}</TableCell>
                          <TableCell className="text-center font-mono font-medium">
                            {expert ? `${expert.yearsOfExperience} năm` : "—"}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {expert?.certificates.length
                              ? expert.certificates.map((c) => c.name).join(", ")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/50 print:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
