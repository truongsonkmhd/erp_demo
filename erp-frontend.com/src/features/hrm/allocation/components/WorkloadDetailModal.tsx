import React from "react"
import { AlertCircle, CheckCircle2, Gauge, Info, MapPin } from "lucide-react"

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
import { Progress } from "@/components/ui/progress"
import type { EmployeeWorkloadSummary } from "../types/hrm-allocation.types"
import {
  ALLOCATION_STATUS_LABELS,
  WORKLOAD_LEVEL_LABELS,
} from "../utils/allocation-calculator"
import { AllocationStatusBadge } from "./AllocationStatusBadge"

interface WorkloadDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  summary: EmployeeWorkloadSummary | null
}

export function WorkloadDetailModal({
  open,
  onOpenChange,
  summary,
}: WorkloadDetailModalProps) {
  if (!summary) return null

  const isOverload = summary.totalWorkloadPercentage > 100
  const isUnderload = summary.totalWorkloadPercentage < 70
  const isBalanced = !isOverload && !isUnderload

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Chi tiết phân bổ mức tải công việc
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {summary.fullName} ({summary.employeeCode}) • {summary.department}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* 1. Thanh đo mức tải công việc */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Tổng mức tải hiện tại:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-extrabold font-mono ${
                    isOverload
                      ? "text-rose-600 dark:text-rose-400"
                      : isBalanced
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {summary.totalWorkloadPercentage}%
                </span>
                <Badge
                  variant="outline"
                  className={
                    isOverload
                      ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40"
                      : isBalanced
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40"
                      : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40"
                  }
                >
                  {WORKLOAD_LEVEL_LABELS[summary.status]}
                </Badge>
              </div>
            </div>

            <Progress
              value={Math.min(100, summary.totalWorkloadPercentage)}
              className="h-2.5 bg-muted"
            />

            {/* Khuyến nghị lãnh đạo */}
            <div className="pt-1 flex items-start gap-2 text-[11px]">
              {isOverload && (
                <>
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-rose-700 dark:text-rose-400 font-medium">
                    Cảnh báo quá tải: Cán bộ đang kiêm nhiệm nhiều đề án vượt quá 100% định mức thời gian. Cần cân nhắc điều chuyển bớt nhiệm vụ.
                  </span>
                </>
              )}
              {isUnderload && (
                <>
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    Dưới định mức tải: Cán bộ đang có thời gian dôi dư, hoàn toàn sẵn sàng nhận thêm nhiệm vụ đề án mới.
                  </span>
                </>
              )}
              {isBalanced && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Mức tải tối ưu: Cán bộ được phân bổ công việc cân bằng, đạt hiệu suất tốt.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 2. Danh sách phân rã các đề án kiêm nhiệm */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground flex items-center justify-between pb-1 border-b border-border/60">
              <span>Các đề án / nhiệm vụ đang tham gia ({summary.activeAssignments.length})</span>
            </div>

            {summary.activeAssignments.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded-xl italic">
                Cán bộ hiện chưa được phân bổ vào đề án nào.
              </div>
            ) : (
              <div className="space-y-2">
                {summary.activeAssignments.map((a, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/70 bg-card space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                      <div className="font-bold text-foreground">{a.projectName}</div>
                      <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">
                        {a.percentage}% tải
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Vai trò: </span>
                        <strong className="text-foreground">{a.role}</strong>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{a.location}</span>
                      </div>
                    </div>

                    <div>
                      <AllocationStatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/50">
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
