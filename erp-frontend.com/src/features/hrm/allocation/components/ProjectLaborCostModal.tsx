import React from "react"
import { DollarSign, Download, FileSpreadsheet, Printer } from "lucide-react"

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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TaskTimesheetRecord } from "../types/hrm-allocation.types"
import { formatVND } from "../utils/allocation-calculator"

interface ProjectLaborCostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timesheets: TaskTimesheetRecord[]
  month: number
  year: number
}

export function ProjectLaborCostModal({
  open,
  onOpenChange,
  timesheets,
  month,
  year,
}: ProjectLaborCostModalProps) {
  // Gom nhóm chi phí theo đề án
  const projectSummary = React.useMemo(() => {
    const map = new Map<
      string,
      {
        projectId: string
        projectName: string
        employeesCount: number
        fieldworkDays: number
        officeDays: number
        totalLaborCost: number
      }
    >()

    for (const t of timesheets) {
      let item = map.get(t.projectId)
      if (!item) {
        item = {
          projectId: t.projectId,
          projectName: t.projectName,
          employeesCount: 0,
          fieldworkDays: 0,
          officeDays: 0,
          totalLaborCost: 0,
        }
        map.set(t.projectId, item)
      }

      item.employeesCount++
      item.fieldworkDays += t.fieldworkDays
      item.officeDays += t.officeDays
      item.totalLaborCost += t.totalLaborCost
    }

    return Array.from(map.values())
  }, [timesheets])

  const totals = React.useMemo(() => {
    return projectSummary.reduce(
      (acc, p) => ({
        fieldwork: acc.fieldwork + p.fieldworkDays,
        office: acc.office + p.officeDays,
        cost: acc.cost + p.totalLaborCost,
      }),
      { fieldwork: 0, office: 0, cost: 0 }
    )
  }, [projectSummary])

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
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Báo cáo phân bổ chi phí nhân công theo đề án
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Tháng {month}/{year} • Tổng hợp ngày công thực địa và chi phí nhân lực
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
              <span>In báo cáo</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-muted-foreground">
            Báo cáo tổng hợp số liệu ngày công thực tế và chi phí tiền công (đã bao gồm phụ cấp lưu động dã ngoại) phân bổ vào từng nhiệm vụ chuyên môn của Liên đoàn Vật lý Địa chất.
          </div>

          <div className="border border-border/80 rounded-xl overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow className="h-9">
                  <TableHead className="w-12 text-center font-bold">STT</TableHead>
                  <TableHead className="min-w-[220px] font-bold">Tên đề án / Nhiệm vụ</TableHead>
                  <TableHead className="w-24 text-center font-semibold">Nhân lực</TableHead>
                  <TableHead className="w-28 text-right font-semibold">Công thực địa</TableHead>
                  <TableHead className="w-28 text-right font-semibold">Công văn phòng</TableHead>
                  <TableHead className="min-w-[140px] text-right font-bold text-primary">
                    Tổng chi phí (VNĐ)
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {projectSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Chưa có dữ liệu chấm công trong tháng này.
                    </TableCell>
                  </TableRow>
                ) : (
                  projectSummary.map((p, idx) => (
                    <TableRow key={p.projectId} className="h-10 hover:bg-muted/20">
                      <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {p.projectName}
                      </TableCell>
                      <TableCell className="text-center">{p.employeesCount} người</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {p.fieldworkDays} ngày
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {p.officeDays} ngày
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatVND(p.totalLaborCost)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

              <TableFooter className="bg-muted/60 font-bold border-t-2 border-border text-foreground">
                <TableRow className="h-10 hover:bg-transparent">
                  <TableCell className="text-center font-bold">∑</TableCell>
                  <TableCell className="font-bold">TỔNG CỘNG</TableCell>
                  <TableCell className="text-center">{timesheets.length} lượt</TableCell>
                  <TableCell className="text-right font-mono">{totals.fieldwork} ngày</TableCell>
                  <TableCell className="text-right font-mono">{totals.office} ngày</TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary font-extrabold">
                    {formatVND(totals.cost)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
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
