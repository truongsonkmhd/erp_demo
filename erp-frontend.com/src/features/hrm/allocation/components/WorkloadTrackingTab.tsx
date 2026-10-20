import React, { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Gauge,
  Info,
  Layers,
  Search,
  Sliders,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import type {
  DepartmentWorkloadStat,
  EmployeeWorkloadSummary,
  WorkloadLevel,
} from "../types/hrm-allocation.types"
import { WORKLOAD_LEVEL_LABELS } from "../utils/allocation-calculator"

interface WorkloadTrackingTabProps {
  workloadSummaries: EmployeeWorkloadSummary[]
  departmentStats: DepartmentWorkloadStat[]
  onOpenWorkloadDetail: (summary: EmployeeWorkloadSummary) => void
}

export function WorkloadTrackingTab({
  workloadSummaries,
  departmentStats,
  onOpenWorkloadDetail,
}: WorkloadTrackingTabProps) {
  const [keyword, setKeyword] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredSummaries = useMemo(() => {
    return workloadSummaries.filter((s) => {
      const matchKw =
        !keyword.trim() ||
        s.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        s.employeeCode.toLowerCase().includes(keyword.toLowerCase()) ||
        s.department.toLowerCase().includes(keyword.toLowerCase())

      const matchLevel =
        levelFilter === "all" || s.status === levelFilter

      const matchDept =
        departmentFilter === "all" || s.department === departmentFilter

      return matchKw && matchLevel && matchDept
    })
  }, [workloadSummaries, keyword, levelFilter, departmentFilter])

  const columns = useMemo<DataTableColumn<EmployeeWorkloadSummary>[]>(() => [
    {
      id: "stt",
      header: "STT",
      width: "50px",
      align: "center",
      render: (_, index) => (
        <span className="text-muted-foreground">
          {(currentPage - 1) * pageSize + (index ?? 0) + 1}
        </span>
      ),
    },
    {
      id: "employeeCode",
      header: "Mã CB",
      width: "110px",
      sticky: "left",
      render: (s) => (
        <span className="font-mono font-semibold text-primary">{s.employeeCode}</span>
      ),
    },
    {
      id: "fullName",
      header: "Họ và tên",
      width: "170px",
      sticky: "left",
      render: (s) => (
        <button
          type="button"
          onClick={() => onOpenWorkloadDetail(s)}
          className="hover:text-primary transition-colors text-left font-semibold text-foreground"
        >
          {s.fullName}
        </button>
      ),
    },
    {
      id: "department",
      header: "Đơn vị công tác",
      width: "150px",
      render: (s) => (
        <span className="text-muted-foreground truncate">{s.department}</span>
      ),
    },
    {
      id: "assignments",
      header: "Các đề án kiêm nhiệm",
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.activeAssignments.length === 0 ? (
            <span className="text-muted-foreground italic text-xs">Chưa giao đề án</span>
          ) : (
            s.activeAssignments.map((a, aIdx) => (
              <Badge
                key={aIdx}
                variant="secondary"
                className="text-[10px] bg-muted/60 truncate max-w-[180px]"
                title={`${a.projectName} (${a.percentage}%)`}
              >
                {a.projectName.slice(0, 22)}... ({a.percentage}%)
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      id: "progress",
      header: "Thước đo mức tải",
      width: "140px",
      render: (s) => (
        <div className="space-y-1">
          <Progress
            value={Math.min(100, s.totalWorkloadPercentage)}
            className="h-2 bg-muted"
          />
        </div>
      ),
    },
    {
      id: "percentage",
      header: "% Tải",
      width: "80px",
      align: "center",
      render: (s) => {
        const isOverload = s.totalWorkloadPercentage > 100
        const isUnderload = s.totalWorkloadPercentage < 70
        const isBalanced = !isOverload && !isUnderload

        return (
          <span
            className={`font-mono font-extrabold text-xs ${
              isOverload
                ? "text-rose-600 dark:text-rose-400"
                : isBalanced
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {s.totalWorkloadPercentage}%
          </span>
        )
      },
    },
    {
      id: "status",
      header: "Đánh giá tải",
      width: "120px",
      align: "center",
      render: (s) => {
        const isOverload = s.totalWorkloadPercentage > 100
        const isUnderload = s.totalWorkloadPercentage < 70
        const isBalanced = !isOverload && !isUnderload

        return (
          <Badge
            variant="outline"
            className={
              isOverload
                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 text-[10px]"
                : isBalanced
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 text-[10px]"
                : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 text-[10px]"
            }
          >
            {WORKLOAD_LEVEL_LABELS[s.status]}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Chi tiết",
      width: "70px",
      align: "center",
      sticky: "right",
      render: (s) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenWorkloadDetail(s)}
          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
          title="Xem chi tiết phân rã tải"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [currentPage, pageSize, onOpenWorkloadDetail])

  return (
    <div className="space-y-4">
      {/* 1. Thống kê mức tải trung bình theo từng Đơn vị / Đoàn */}
      <div className="space-y-2">
        <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-primary" />
          <span>Mức tải công việc bình quân theo đơn vị:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departmentStats.map((d) => {
            const isHigh = d.averageWorkload > 100
            const isLow = d.averageWorkload < 70
            return (
              <Card
                key={d.department}
                className="border border-border/80 bg-card shadow-xs rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-foreground truncate max-w-[180px]">
                    {d.department}
                  </div>
                  <div
                    className={`font-mono font-extrabold text-sm ${
                      isHigh
                        ? "text-rose-600 dark:text-rose-400"
                        : isLow
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {d.averageWorkload}%
                  </div>
                </div>

                <Progress
                  value={Math.min(100, d.averageWorkload)}
                  className="h-2 bg-muted"
                />

                <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                  <span>Quân số: <strong>{d.totalEmployees} người</strong></span>
                  <span>
                    Thực địa: <strong className="text-emerald-600">{d.fieldworkCount}</strong> •{" "}
                    Nội nghiệp: <strong className="text-blue-600">{d.officeCount}</strong>
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 2. Thanh lọc */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm theo tên cán bộ, mã, đơn vị..."
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <div className="w-52">
            <Select
              value={levelFilter}
              onValueChange={(val) => {
                setLevelFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả mức tải" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả mức tải</SelectItem>
                <SelectItem value="overload" className="text-xs">Quá tải (&gt; 100%)</SelectItem>
                <SelectItem value="balanced" className="text-xs">Tải tối ưu (70 - 100%)</SelectItem>
                <SelectItem value="underload" className="text-xs">Dưới tải (&lt; 70%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select
              value={departmentFilter}
              onValueChange={(val) => {
                setDepartmentFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                {departmentStats.map((d) => (
                  <SelectItem key={d.department} value={d.department} className="text-xs">
                    {d.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground shrink-0">
          Hiển thị <strong>{filteredSummaries.length}</strong> /{" "}
          <strong>{workloadSummaries.length}</strong> cán bộ
        </div>
      </div>

      {/* 3. Bảng Data Grid Mức tải công việc cá nhân */}
      <PaginatedDataTable<EmployeeWorkloadSummary>
        data={filteredSummaries}
        columns={columns}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setCurrentPage(1)
        }}
        emptyMessage="Không tìm thấy dữ liệu mức tải phù hợp."
      />
    </div>
  )
}
