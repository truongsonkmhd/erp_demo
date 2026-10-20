import React, { useMemo } from "react"
import { Award, GraduationCap, Medal, ShieldAlert, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { defaultHrmDevelopmentRepository } from "@/features/hrm/development/repositories/hrm-development.storage"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"
import type { EmployeeRecord } from "../../types/employee-profile.types.ts"

interface EmployeeDevelopmentTabProps {
  record: EmployeeRecord
}

export function EmployeeDevelopmentTab({ record }: EmployeeDevelopmentTabProps) {
  const trainings = useMemo(() => {
    return defaultHrmDevelopmentRepository
      .getTrainings()
      .filter((x) => x.userId === record.userId || x.employeeCode === record.employeeCode)
  }, [record.userId, record.employeeCode])

  const salaries = useMemo(() => {
    return defaultHrmDevelopmentRepository
      .getSalaryIncreases()
      .filter((x) => x.userId === record.userId || x.employeeCode === record.employeeCode)
  }, [record.userId, record.employeeCode])

  const evaluations = useMemo(() => {
    return defaultHrmDevelopmentRepository
      .getEvaluations()
      .filter((x) => x.userId === record.userId || x.employeeCode === record.employeeCode)
  }, [record.userId, record.employeeCode])

  const rewards = useMemo(() => {
    return defaultHrmDevelopmentRepository
      .getRewardsDisciplines()
      .filter((x) => x.userId === record.userId || x.employeeCode === record.employeeCode)
  }, [record.userId, record.employeeCode])

  return (
    <div className="space-y-6">
      {/* 1. Lịch sử Đào tạo & Bồi dưỡng */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-5 bg-muted/30 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <GraduationCap className="h-4 w-4 text-sky-600" />
            <span>Khóa đào tạo & Bồi dưỡng chuyên môn ({trainings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {trainings.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có thông tin đào tạo bồi dưỡng.</p>
          ) : (
            <div className="space-y-3">
              {trainings.map((trn) => (
                <div
                  key={trn.id}
                  className="p-3 rounded-lg border border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground">{trn.courseName}</span>
                    <p className="text-[11px] text-muted-foreground">
                      {trn.institution} • {formatDateVN(trn.startDate)} - {formatDateVN(trn.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {trn.cost ? `${trn.cost.toLocaleString("vi-VN")} đ` : "Miễn phí"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {trn.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Quá trình Nâng bậc lương */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-5 bg-muted/30 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Lịch sử nâng bậc lương ({salaries.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {salaries.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có ghi nhận nâng bậc lương.</p>
          ) : (
            <div className="space-y-3">
              {salaries.map((sal) => (
                <div
                  key={sal.id}
                  className="p-3 rounded-lg border border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground font-mono">QĐ số: {sal.decisionNumber}</span>
                    <p className="text-[11px] text-muted-foreground">
                      {sal.payGrade} • Hiệu lực từ: {formatDateVN(sal.effectiveDate)}
                    </p>
                  </div>
                  <div className="font-mono text-xs font-semibold text-emerald-600 shrink-0">
                    Bậc {sal.oldStep} ({sal.oldCoefficient}) → Bậc {sal.newStep} ({sal.newCoefficient})
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 3. Đánh giá xếp loại */}
        <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="py-3 px-5 bg-muted/30 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Award className="h-4 w-4 text-amber-600" />
              <span>Đánh giá & Xếp loại thi đua ({evaluations.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {evaluations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Chưa có dữ liệu đánh giá xếp loại.</p>
            ) : (
              <div className="space-y-3">
                {evaluations.map((eva) => (
                  <div key={eva.id} className="p-3 rounded-lg border border-border/60 bg-background/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Năm {eva.year}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        {eva.classification === "xuat_sac"
                          ? "Xuất sắc"
                          : eva.classification === "tot"
                          ? "Tốt"
                          : "Hoàn thành"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{eva.achievements}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Khen thưởng / Kỷ luật */}
        <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="py-3 px-5 bg-muted/30 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Medal className="h-4 w-4 text-purple-600" />
              <span>Khen thưởng & Kỷ luật ({rewards.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {rewards.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Chưa có ghi nhận khen thưởng hoặc kỷ luật.</p>
            ) : (
              <div className="space-y-3">
                {rewards.map((rd) => (
                  <div key={rd.id} className="p-3 rounded-lg border border-border/60 bg-background/50 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{rd.form}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          rd.category === "reward"
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {rd.category === "reward" ? "Khen thưởng" : "Kỷ luật"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{rd.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
