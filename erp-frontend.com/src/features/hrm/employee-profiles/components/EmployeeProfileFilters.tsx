import React from "react"
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Download,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EmployeeFilterState } from "../utils/employee-filter.ts"
import type { EmployeeRecord } from "../types/employee-profile.types.ts"
import { exportEmployeesToExcel } from "../utils/employee-export.ts"

interface EmployeeProfileFiltersProps {
  filters: EmployeeFilterState
  onFiltersChange: (nextFilters: EmployeeFilterState) => void
  departments: Array<{ id: number | string; name: string }>
  filteredRecords: EmployeeRecord[]
  totalCount?: number
}

export function EmployeeProfileFilters({
  filters,
  onFiltersChange,
  departments,
  filteredRecords,
  totalCount,
}: EmployeeProfileFiltersProps) {
  const isFiltered = Boolean(
    (filters.keyword && filters.keyword.trim()) ||
      (filters.department && filters.department !== "all") ||
      (filters.workStatus && filters.workStatus !== "all") ||
      (filters.contractType && filters.contractType !== "all"),
  )

  const handleReset = () => {
    onFiltersChange({
      keyword: "",
      department: "all",
      workStatus: "all",
      contractType: "all",
    })
  }

  const handleExport = () => {
    exportEmployeesToExcel(filteredRecords)
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Ô tìm kiếm từ khóa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filters.keyword || ""}
            onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
            placeholder="Tìm mã CB, họ tên, email, SĐT..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* 2. Lọc theo Phòng ban / Đơn vị */}
        <div>
          <Select
            value={filters.department || "all"}
            onValueChange={(val) => onFiltersChange({ ...filters, department: val })}
          >
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tất cả đơn vị" />
              </div>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả đơn vị</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Lọc theo Trạng thái công tác */}
        <div>
          <Select
            value={filters.workStatus || "all"}
            onValueChange={(val) =>
              onFiltersChange({
                ...filters,
                workStatus: val as EmployeeFilterState["workStatus"],
              })
            }
          >
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tất cả trạng thái" />
              </div>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang làm việc</SelectItem>
              <SelectItem value="probation">Thử việc</SelectItem>
              <SelectItem value="on_leave">Nghỉ phép</SelectItem>
              <SelectItem value="terminated">Đã nghỉ việc / Khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Lọc theo Loại hợp đồng */}
        <div>
          <Select
            value={filters.contractType || "all"}
            onValueChange={(val) => onFiltersChange({ ...filters, contractType: val })}
          >
            <SelectTrigger className="h-9 text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tất cả loại hợp đồng" />
              </div>
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Tất cả loại hợp đồng</SelectItem>
              <SelectItem value="Chính thức">HĐ không xác định thời hạn</SelectItem>
              <SelectItem value="Có thời hạn">HĐ xác định thời hạn</SelectItem>
              <SelectItem value="Thử việc">Hợp đồng thử việc</SelectItem>
              <SelectItem value="Thời vụ">Hợp đồng thời vụ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span>
            Đang hiển thị <strong className="text-foreground font-semibold">{filteredRecords.length}</strong>
            {typeof totalCount === "number" && (
              <> / tổng số <strong className="text-foreground font-semibold">{totalCount}</strong></>
            )}{" "}
            hồ sơ cán bộ
          </span>
          {isFiltered && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">
              Đang lọc
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 text-xs px-2.5 gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Đặt lại</span>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
            className="h-7 text-xs px-2.5 gap-1.5 font-medium"
            title="Xuất danh sách cán bộ ra định dạng Excel"
          >
            <Download className="h-3 w-3" />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
