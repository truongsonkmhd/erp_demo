import React, { useMemo, useState } from "react"
import { Check, Copy, Download, Edit, Plus, RotateCcw, Search, Trash2 } from "lucide-react"

import { appToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import type { EmployeeAccount } from "@/services/EmployeeService"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"
import { TrainingModal } from "../TrainingModal"
import type { TrainingRecord, TrainingType, TrainingStatus } from "../../types/hrm-development.types.ts"
import { exportTrainingsToExcel } from "../../utils/development-export"

interface TrainingTabProps {
  records: TrainingRecord[]
  employees: EmployeeAccount[]
  onSave: (record: TrainingRecord) => void
  onDelete: (id: string) => void
}

export function TrainingTab({ records, employees, onSave, onDelete }: TrainingTabProps) {
  const [keyword, setKeyword] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const match =
          item.fullName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.courseName.toLowerCase().includes(q) ||
          item.institution.toLowerCase().includes(q)
        if (!match) return false
      }
      if (typeFilter !== "all" && item.trainingType !== typeFilter) return false
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      return true
    })
  }, [records, keyword, typeFilter, statusFilter])

  const handleCopyCode = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      appToast.success(`Đã sao chép mã cán bộ ${code}`)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      appToast.error("Không thể sao chép")
    }
  }

  const handleDelete = (item: TrainingRecord) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ đào tạo "${item.courseName}" của ${item.fullName}?`)
    if (ok) {
      onDelete(item.id)
      appToast.success("Đã xóa hồ sơ đào tạo")
    }
  }

  const columns: DataTableColumn<TrainingRecord>[] = [
    {
      key: "employeeCode",
      header: "Mã cán bộ",
      headClassName: "w-28 bg-muted/40",
      cellClassName: "bg-background",
      render: (item) => (
        <div className="flex items-center gap-1.5 group">
          <span className="font-mono text-xs font-semibold text-primary">{item.employeeCode}</span>
          <button
            type="button"
            onClick={(e) => handleCopyCode(e, item.employeeCode)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Sao chép mã cán bộ"
            aria-label="Sao chép mã cán bộ"
          >
            {copiedCode === item.employeeCode ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "fullName",
      header: "Họ và tên cán bộ",
      headClassName: "min-w-[160px]",
      render: (item) => <span className="font-medium text-xs text-foreground">{item.fullName}</span>,
    },
    {
      key: "courseName",
      header: "Khóa đào tạo / Bồi dưỡng",
      headClassName: "min-w-[240px]",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">{item.courseName}</span>
          <span className="text-[11px] text-muted-foreground">{item.institution}</span>
        </div>
      ),
    },
    {
      key: "trainingType",
      header: "Hình thức",
      headClassName: "min-w-[130px]",
      render: (item) => {
        const label =
          item.trainingType === "chinh_quy"
            ? "Chính quy"
            : item.trainingType === "tai_chuc"
            ? "Tại chức"
            : item.trainingType === "tap_huan"
            ? "Tập huấn chuyên môn"
            : "Chứng chỉ"
        return <span className="text-xs text-foreground">{label}</span>
      },
    },
    {
      key: "duration",
      header: "Thời gian đào tạo",
      headClassName: "min-w-[170px]",
      render: (item) => (
        <span className="text-xs font-mono text-foreground">
          {formatDateVN(item.startDate)} - {formatDateVN(item.endDate)}
        </span>
      ),
    },
    {
      key: "cost",
      header: "Kinh phí",
      headClassName: "min-w-[110px] text-right",
      cellClassName: "text-right",
      render: (item) => (
        <span className="text-xs font-mono text-foreground">
          {item.cost ? `${item.cost.toLocaleString("vi-VN")} đ` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-32 text-center",
      cellClassName: "text-center",
      render: (item) => {
        if (item.status === "completed") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Hoàn thành
            </span>
          )
        }
        if (item.status === "ongoing") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-600 border border-sky-500/20">
              Đang học
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
            Đã hủy
          </span>
        )
      },
    },
    {
      key: "result",
      header: "Kết quả / Chứng chỉ",
      headClassName: "min-w-[150px]",
      render: (item) => <span className="text-xs text-foreground">{item.result || "—"}</span>,
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-20 text-right bg-muted/40",
      cellClassName: "text-right bg-background",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingRecord(item)
              setModalOpen(true)
            }}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Chỉnh sửa khóa học"
            aria-label="Chỉnh sửa khóa học"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(item)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Xóa hồ sơ đào tạo"
            aria-label="Xóa hồ sơ đào tạo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = Boolean(keyword || typeFilter !== "all" || statusFilter !== "all")

  return (
    <div className="space-y-4">
      {/* Thanh lọc & Nút hành động */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo cán bộ, khóa học, đơn vị..."
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Hình thức đào tạo" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả hình thức</SelectItem>
                <SelectItem value="tap_huan">Tập huấn chuyên môn</SelectItem>
                <SelectItem value="chung_chi">Chứng chỉ nghiệp vụ</SelectItem>
                <SelectItem value="chinh_quy">Chính quy</SelectItem>
                <SelectItem value="tai_chuc">Tại chức</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="completed">Đã hoàn thành</SelectItem>
                <SelectItem value="ongoing">Đang học</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filteredRecords.length}</strong> / tổng số{" "}
            <strong className="text-foreground">{records.length}</strong> lượt đào tạo
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("")
                  setTypeFilter("all")
                  setStatusFilter("all")
                }}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTrainingsToExcel(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="h-7 text-xs px-2.5 gap-1.5 font-medium"
            >
              <Download className="h-3 w-3" />
              <span>Xuất Excel</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setEditingRecord(null)
                setModalOpen(true)
              }}
              className="h-7 text-xs px-2.5 gap-1 font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm khóa đào tạo</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <PaginatedDataTable
        data={filteredRecords}
        columns={columns}
        rowKey={(row) => row.id}
        bordered
        minTableWidth="1250px"
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="5rem"
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Popup Modal Thêm / Chỉnh sửa */}
      <TrainingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialRecord={editingRecord}
        employees={employees}
        onSave={onSave}
      />
    </div>
  )
}
