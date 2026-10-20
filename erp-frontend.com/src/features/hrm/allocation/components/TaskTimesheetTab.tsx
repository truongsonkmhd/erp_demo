import React, { useMemo, useState } from "react"
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Edit3,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table"
import {
  PaginatedDataTable,
  type PaginatedDataTableColumn,
} from "@/components/ui/paginated-data-table"
import type { TaskTimesheetRecord } from "../types/hrm-allocation.types"
import { formatVND } from "../utils/allocation-calculator"
import { exportTimesheetToExcel } from "../utils/allocation-export"

interface TaskTimesheetTabProps {
  timesheets: TaskTimesheetRecord[]
  month: number
  year: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onOpenTimesheetModal: (record: TaskTimesheetRecord | null) => void
  onOpenProjectLaborCostModal: () => void
  onDelete: (id: string) => void
}

export function TaskTimesheetTab({
  timesheets,
  month,
  year,
  onMonthChange,
  onYearChange,
  onOpenTimesheetModal,
  onOpenProjectLaborCostModal,
  onDelete,
}: TaskTimesheetTabProps) {
  const [keyword, setKeyword] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")

  const projects = useMemo(() => {
    const set = new Set<string>()
    timesheets.forEach((t) => {
      if (t.projectName) set.add(t.projectName)
    })
    return Array.from(set)
  }, [timesheets])

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((t) => {
      const matchKw =
        !keyword.trim() ||
        t.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        t.employeeCode.toLowerCase().includes(keyword.toLowerCase()) ||
        t.department.toLowerCase().includes(keyword.toLowerCase()) ||
        t.projectName.toLowerCase().includes(keyword.toLowerCase())

      const matchProj =
        projectFilter === "all" || t.projectName === projectFilter

      return matchKw && matchProj
    })
  }, [timesheets, keyword, projectFilter])

  // Tổng hợp số liệu
  const totals = useMemo(() => {
    return filteredTimesheets.reduce(
      (acc, t) => ({
        fieldwork: acc.fieldwork + t.fieldworkDays,
        office: acc.office + t.officeDays,
        totalDays: acc.totalDays + t.totalDays,
        cost: acc.cost + t.totalLaborCost,
      }),
      { fieldwork: 0, office: 0, totalDays: 0, cost: 0 }
    )
  }, [filteredTimesheets])

  const handleExportExcel = () => {
    exportTimesheetToExcel(filteredTimesheets, month, year)
    toast.success("Đã xuất Excel bảng chấm công & chi phí nhân công đề án!")
  }

  return (
    <div className="space-y-4">
      {/* 1. Thanh chọn tháng / năm & Tóm tắt chi phí */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-semibold text-xs text-foreground">Kỳ chấm công:</span>
          </div>

          <div className="w-32">
            <Select
              value={month.toString()}
              onValueChange={(val) => onMonthChange(parseInt(val) || 10)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()} className="text-xs">
                    Tháng {m.toString().padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-28">
            <Select
              value={year.toString()}
              onValueChange={(val) => onYearChange(parseInt(val) || 2026)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2026, 2027].map((y) => (
                  <SelectItem key={y} value={y.toString()} className="text-xs">
                    Năm {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProjectLaborCostModal}
            className="h-8 text-xs gap-1.5"
            title="Báo cáo chi phí nhân công tổng hợp theo đề án"
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            <span>Báo cáo chi phí đề án</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 text-xs gap-1.5"
            title="Xuất bảng chấm công ra Excel"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      {/* 2. Banner tóm tắt kết quả chấm công */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2 rounded-lg bg-card border border-border/60">
          <div className="text-[11px] text-muted-foreground">Tổng ngày công thực địa:</div>
          <div className="font-mono font-bold text-emerald-600 text-sm">
            {totals.fieldwork} ngày
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Căn cứ tính phụ cấp lưu động
          </div>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border/60">
          <div className="text-[11px] text-muted-foreground">Tổng ngày công văn phòng:</div>
          <div className="font-mono font-bold text-blue-600 text-sm">
            {totals.office} ngày
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Xử lý nội nghiệp tại phòng
          </div>
        </div>

        <div className="p-2 rounded-lg bg-card border border-border/60">
          <div className="text-[11px] text-muted-foreground">Tổng ngày công trong kỳ:</div>
          <div className="font-mono font-bold text-foreground text-sm">
            {totals.totalDays} ngày công
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Đã ghi nhận trên hệ thống
          </div>
        </div>

        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <div className="text-[11px] text-primary font-medium">Tổng chi phí nhân công:</div>
          <div className="font-mono font-extrabold text-primary text-sm">
            {formatVND(totals.cost)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Phân bổ vào các đề án
          </div>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm và lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên cán bộ, mã, đề án..."
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <div className="w-64">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả đề án" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả đề án</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground shrink-0">
          Hiển thị <strong>{filteredTimesheets.length}</strong> /{" "}
          <strong>{timesheets.length}</strong> cán bộ
        </div>
      </div>

      {/* 4. Data Grid Bảng chấm công mật độ cao chuẩn hóa */}
      <PaginatedDataTable<TaskTimesheetRecord>
        data={filteredTimesheets}
        columns={[
          {
            key: "stt",
            header: "STT",
            headClassName: "w-12 text-center font-bold text-foreground",
            cellClassName: "text-center font-medium text-muted-foreground",
            render: (_item, rowIndex) => rowIndex + 1,
          },
          {
            key: "employeeCode",
            header: "Mã CB",
            headClassName: "w-28 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
            render: (t) => t.employeeCode,
          },
          {
            key: "fullName",
            header: "Họ và tên",
            headClassName: "min-w-[160px] font-bold text-foreground sticky left-28 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "sticky left-28 z-10 bg-card font-semibold text-foreground",
            render: (t) => t.fullName,
          },
          {
            key: "department",
            header: "Đơn vị công tác",
            headClassName: "min-w-[140px] font-semibold text-foreground",
            cellClassName: "text-muted-foreground truncate max-w-[140px]",
            render: (t) => t.department,
          },
          {
            key: "projectName",
            header: "Đề án ghi nhận",
            headClassName: "min-w-[220px] font-semibold text-foreground",
            cellClassName: "font-medium text-foreground",
            render: (t) => t.projectName,
          },
          {
            key: "fieldworkDays",
            header: "Công thực địa",
            headClassName: "w-28 text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono font-bold text-emerald-600",
            render: (t) => `${t.fieldworkDays} n`,
          },
          {
            key: "officeDays",
            header: "Công văn phòng",
            headClassName: "w-28 text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (t) => `${t.officeDays} n`,
          },
          {
            key: "totalDays",
            header: "Tổng ngày",
            headClassName: "w-24 text-right font-bold text-foreground",
            cellClassName: "text-right font-mono font-semibold text-foreground",
            render: (t) => `${t.totalDays} n`,
          },
          {
            key: "dailyRate",
            header: "Lương ngày",
            headClassName: "w-28 text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (t) => formatVND(t.dailyRate),
          },
          {
            key: "fieldworkAllowanceRate",
            header: "PC lưu động/n",
            headClassName: "w-28 text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (t) => formatVND(t.fieldworkAllowanceRate),
          },
          {
            key: "totalLaborCost",
            header: "Chi phí nhân công",
            headClassName: "min-w-[140px] text-right font-extrabold text-foreground bg-primary/5",
            cellClassName: "text-right font-mono font-extrabold text-primary bg-primary/5",
            render: (t) => formatVND(t.totalLaborCost),
          },
          {
            key: "approvalStatus",
            header: "Trạng thái",
            headClassName: "w-24 text-center font-semibold text-foreground",
            cellClassName: "text-center",
            render: (t) => (
              <Badge
                variant="outline"
                className={
                  t.approvalStatus === "approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]"
                    : t.approvalStatus === "submitted"
                    ? "bg-amber-50 text-amber-700 border-amber-300 text-[10px]"
                    : "bg-muted text-muted-foreground text-[10px]"
                }
              >
                {t.approvalStatus === "approved"
                  ? "Đã duyệt"
                  : t.approvalStatus === "submitted"
                  ? "Chờ duyệt"
                  : "Dự thảo"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Thao tác",
            headClassName: "w-20 text-center font-bold sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "text-center sticky right-0 z-10 bg-card",
            render: (t) => (
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenTimesheetModal(t)}
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                  title="Điều chỉnh ngày công"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(t.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  title="Xóa chấm công"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="5rem"
        minTableWidth="1300px"
        emptyMessage={`Không có dữ liệu chấm công nào trong tháng ${month}/${year}.`}
        renderFooter={() => (
          <TableFooter className="bg-muted/60 font-bold border-t-2 border-border text-foreground">
            <TableRow className="h-10 hover:bg-transparent">
              <TableCell className="text-center font-bold">∑</TableCell>
              <TableCell className="sticky left-0 z-10 bg-muted/60 font-mono font-bold text-primary">
                TỔNG CỘNG
              </TableCell>
              <TableCell className="sticky left-28 z-10 bg-muted/60 font-semibold">
                {filteredTimesheets.length} cán bộ
              </TableCell>
              <TableCell colSpan={2}></TableCell>
              <TableCell className="text-right font-mono font-bold text-emerald-600">
                {totals.fieldwork} ngày
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {totals.office} ngày
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {totals.totalDays} ngày
              </TableCell>
              <TableCell colSpan={2}></TableCell>
              <TableCell className="text-right font-mono text-sm font-extrabold text-primary bg-primary/10">
                {formatVND(totals.cost)}
              </TableCell>
              <TableCell colSpan={2} className="sticky right-0 z-10 bg-muted/60"></TableCell>
            </TableRow>
          </TableFooter>
        )}
      />
    </div>
  )
}
