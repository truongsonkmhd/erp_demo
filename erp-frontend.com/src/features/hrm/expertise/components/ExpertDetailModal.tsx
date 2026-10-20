import React from "react"
import {
  Award,
  Briefcase,
  CheckCircle2,
  Compass,
  GraduationCap,
  Printer,
  Star,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ExpertProfileRecord } from "../types/hrm-expert.types"
import { DEGREE_LABELS, ROLE_LABELS } from "../utils/expert-search"

interface ExpertDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expert: ExpertProfileRecord | null
}

export function ExpertDetailModal({ open, onOpenChange, expert }: ExpertDetailModalProps) {
  if (!expert) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-2xl p-6 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Hồ sơ năng lực chuyên gia
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Mã cán bộ: {expert.employeeCode} • {expert.department}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 gap-1.5 print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In hồ sơ CV</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* 1. Header tóm tắt chuyên gia */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg font-mono border border-primary/20">
                {expert.fullName
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{expert.fullName}</h2>
                  <Badge variant="outline" className="text-[11px] font-medium bg-background">
                    {DEGREE_LABELS[expert.academicDegree] || expert.academicDegree}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {expert.position} • {expert.department}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[11px] text-muted-foreground">Kinh nghiệm:</div>
                <div className="text-sm font-bold text-foreground">
                  {expert.yearsOfExperience} năm
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Đánh giá:</div>
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  <span>{expert.ratingScore.toFixed(1)}/5.0</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">Thực địa:</div>
                <Badge
                  variant="outline"
                  className={
                    expert.fieldworkReadiness
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }
                >
                  {expert.fieldworkReadiness ? "Sẵn sàng" : "Không"}
                </Badge>
              </div>
            </div>
          </div>

          {/* 2. Tóm tắt năng lực cốt lõi */}
          <div className="space-y-1.5 p-3 rounded-xl bg-card border border-border/70">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-primary" />
              <span>Tóm tắt năng lực & Hướng nghiên cứu</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pl-5">
              {expert.bioSummary}
            </p>
            <div className="pt-2 pl-5 flex flex-wrap gap-1.5">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px]">
                {expert.primarySpecialty}
              </Badge>
              {expert.subSpecialties.map((sub) => (
                <Badge key={sub} variant="secondary" className="text-[11px]">
                  {sub}
                </Badge>
              ))}
            </div>
          </div>

          {/* 3. Danh mục Chứng chỉ chuyên môn & Hành nghề */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-600" />
                <span>Chứng chỉ hành nghề & An toàn chuyên ngành ({expert.certificates.length})</span>
              </div>
            </div>

            {expert.certificates.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground italic bg-muted/20 rounded-lg">
                Chưa có chứng chỉ hành nghề được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2">
                {expert.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 rounded-xl border border-border/70 bg-card flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{cert.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Cơ quan cấp: <strong>{cert.issuer}</strong> • Số hiệu:{" "}
                        <span className="font-mono">{cert.certificateNumber}</span>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground shrink-0">
                      <div>Ngày cấp: {cert.issueDate}</div>
                      {cert.expiryDate && (
                        <div className="text-primary font-medium">Hết hạn: {cert.expiryDate}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Lịch sử tham gia các đề án / dự án */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-blue-600" />
                <span>Lịch sử đề án & Công trình nghiên cứu ({expert.projects.length})</span>
              </div>
            </div>

            {expert.projects.length === 0 ? (
              <div className="p-3 text-center text-muted-foreground italic bg-muted/20 rounded-lg">
                Chưa có lịch sử đề án được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expert.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-card space-y-2 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border/40 pb-2">
                      <div className="font-bold text-foreground">{proj.projectName}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {proj.startYear} – {proj.endYear} • Mã: {proj.projectCode}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Vai trò trong đề án: </span>
                        <strong className="text-primary">
                          {ROLE_LABELS[proj.role] || proj.role}
                        </strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cơ quan giao / Chủ đầu tư: </span>
                        <span className="text-foreground">{proj.clientOrFunder}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap gap-1">
                        {proj.methodology.map((m) => (
                          <Badge
                            key={m}
                            variant="secondary"
                            className="text-[10px] bg-muted py-0"
                          >
                            {m}
                          </Badge>
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                      >
                        Nghiệm thu: {proj.resultClassification}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
