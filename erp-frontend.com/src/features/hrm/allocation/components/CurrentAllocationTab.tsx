import React, { useMemo, useState } from "react"
import {
  Briefcase,
  Compass,
  Copy,
  Edit3,
  FileSpreadsheet,
  Laptop,
  MapPin,
  Moon,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import type {
  AllocationStatus,
  EmployeeAssignmentRecord,
} from "../types/hrm-allocation.types"
import { exportAllocationToExcel } from "../utils/allocation-export"
import { AllocationStatusBadge } from "./AllocationStatusBadge"

interface CurrentAllocationTabProps {
  assignments: EmployeeAssignmentRecord[]
  onOpenCreate: () => void
  onOpenEdit: (record: EmployeeAssignmentRecord) => void
  onDelete: (id: string) => void
}

export function CurrentAllocationTab({
  assignments,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}: CurrentAllocationTabProps) {
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // Thống kê 4 ERP Metric Cards
  const stats = useMemo(() => {
    const total = assignments.length
    const fieldwork = assignments.filter((a) => a.currentStatus === "fieldwork").length
    const office = assignments.filter((a) => a.currentStatus === "office_specialty").length
    const available = assignments.filter((a) => a.currentStatus === "available").length
    const onLeave = assignments.filter((a) => a.currentStatus === "on_leave").length
    return { total, fieldwork, office, available, onLeave }
  }, [assignments])

  const departments = useMemo(() => {
    const set = new Set<string>()
    assignments.forEach((a) => {
      if (a.department) set.add(a.department)
    })
    return Array.from(set)
  }, [assignments])

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchKw =
        !keyword.trim() ||
        a.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        a.employeeCode.toLowerCase().includes(keyword.toLowerCase()) ||
        a.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
        a.location.toLowerCase().includes(keyword.toLowerCase())

      const matchStatus =
        statusFilter === "all" || a.currentStatus === statusFilter

      const matchDept =
        departmentFilter === "all" || a.department === departmentFilter

      return matchKw && matchStatus && matchDept
    })
  }, [assignments, keyword, statusFilter, departmentFilter])

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã cán bộ: ${code}`)
  }

  return (
    <div className="space-y-4">
      {/* 1. Bốn thẻ chỉ số ERP Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Hiện trường dã ngoại
              </span>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.fieldwork} cán bộ
              </div>
              <div className="text-[11px] text-muted-foreground">
                Đo vẽ thực địa vùng núi, dã ngoại
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Chuyên môn nội nghiệp
              </span>
              <div className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
                {stats.office} cán bộ
              </div>
              <div className="text-[11px] text-muted-foreground">
                Xử lý số liệu, minh giải 3D
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Chưa bố trí nhiệm vụ
              </span>
              <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {stats.available} cán bộ
              </div>
              <div className="text-[11px] text-muted-foreground">
                Sẵn sàng điều động đề án mới
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Đang nghỉ phép / chế độ
              </span>
              <div className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-300 font-mono">
                {stats.onLeave} cán bộ
              </div>
              <div className="text-[11px] text-muted-foreground">
                Phục hồi sức khỏe sau tuyến đo
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
              <Moon className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Thanh lọc và hành động */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, mã cán bộ, đề án, địa bàn..."
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <div className="w-52">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
                <SelectItem value="fieldwork" className="text-xs">Hiện trường dã ngoại</SelectItem>
                <SelectItem value="office_specialty" className="text-xs">Chuyên môn nội nghiệp</SelectItem>
                <SelectItem value="management" className="text-xs">Quản lý / Điều hành</SelectItem>
                <SelectItem value="on_leave" className="text-xs">Đang nghỉ phép</SelectItem>
                <SelectItem value="available" className="text-xs">Chưa bố trí nhiệm vụ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAllocationToExcel(filteredAssignments)}
            className="h-8.5 text-xs gap-1.5"
            title="Xuất bảng Excel hiện trạng phân bổ"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8.5 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Phân bổ cán bộ</span>
          </Button>
        </div>
      </div>

      {/* 3. Data Grid Mật độ cao sử dụng PaginatedDataTable chuẩn */}
      <PaginatedDataTable
        data={filteredAssignments}
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
            cellClassName: "sticky left-0 z-10 bg-card group-hover:bg-muted/30 transition-colors font-mono font-semibold text-foreground",
            render: (a) => (
              <div className="flex items-center gap-1 group">
                <span className="font-mono font-semibold text-foreground">
                  {a.employeeCode}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(a.employeeCode, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                  title="Sao chép mã"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ),
          },
          {
            key: "fullName",
            header: "Họ và tên",
            headClassName: "min-w-[160px] font-bold text-foreground sticky left-28 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "sticky left-28 z-10 bg-card group-hover:bg-muted/30 transition-colors font-semibold text-foreground",
            render: (a) => a.fullName,
          },
          {
            key: "department",
            header: "Đơn vị công tác",
            headClassName: "min-w-[140px] font-semibold text-foreground",
            cellClassName: "text-muted-foreground truncate max-w-[140px]",
            render: (a) => a.department,
          },
          {
            key: "currentStatus",
            header: "Trạng thái công tác",
            headClassName: "w-40 font-semibold text-center text-foreground",
            cellClassName: "text-center",
            render: (a) => <AllocationStatusBadge status={a.currentStatus} />,
          },
          {
            key: "projectName",
            header: "Đề án / Nhiệm vụ",
            headClassName: "min-w-[220px] font-semibold text-foreground",
            cellClassName: "font-medium text-foreground",
            render: (a) => a.projectName,
          },
          {
            key: "location",
            header: "Địa bàn công tác",
            headClassName: "min-w-[130px] font-semibold text-foreground",
            render: (a) => (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px]">{a.location}</span>
              </div>
            ),
          },
          {
            key: "assignedRole",
            header: "Vai trò đề án",
            headClassName: "min-w-[140px] font-semibold text-foreground",
            cellClassName: "text-muted-foreground",
            render: (a) => a.assignedRole,
          },
          {
            key: "allocationPercentage",
            header: "% Tải",
            headClassName: "w-20 text-center font-semibold text-foreground",
            cellClassName: "text-center font-mono font-bold text-primary",
            render: (a) => `${a.allocationPercentage}%`,
          },
          {
            key: "duration",
            header: "Thời gian",
            headClassName: "w-28 text-center font-semibold text-foreground",
            cellClassName: "text-center text-[11px] font-mono text-muted-foreground",
            render: (a) => (a.startDate ? `${a.startDate.slice(5)} ~ ${a.endDate.slice(5)}` : "—"),
          },
          {
            key: "actions",
            header: "Thao tác",
            headClassName: "w-24 text-center font-bold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "text-center sticky right-0 z-10 bg-card group-hover:bg-muted/30 transition-colors",
            render: (a) => (
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenEdit(a)}
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                  title="Điều chuyển / Cập nhật"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(a.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  title="Xóa phân bổ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
        rowKey={(row) => row.id}
        defaultPageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        minTableWidth="1300px"
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="6rem"
      />
    </div>
  )
}
