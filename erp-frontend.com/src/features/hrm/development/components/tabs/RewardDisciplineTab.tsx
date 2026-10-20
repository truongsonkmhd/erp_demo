import React, { useMemo, useState } from "react"
import { Check, Copy, Download, Edit, Medal, Plus, RotateCcw, Search, ShieldAlert, Trash2 } from "lucide-react"

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
import { RewardDisciplineModal } from "../RewardDisciplineModal"
import type { RewardDisciplineCategory, RewardDisciplineRecord } from "../../types/hrm-development.types.ts"
import { exportRewardsDisciplinesToExcel } from "../../utils/development-export"

interface RewardDisciplineTabProps {
  records: RewardDisciplineRecord[]
  employees: EmployeeAccount[]
  onSave: (record: RewardDisciplineRecord) => void
  onDelete: (id: string) => void
}

export function RewardDisciplineTab({
  records,
  employees,
  onSave,
  onDelete,
}: RewardDisciplineTabProps) {
  const [keyword, setKeyword] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RewardDisciplineRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const match =
          item.fullName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.decisionNumber.toLowerCase().includes(q) ||
          item.form.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q)
        if (!match) return false
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false
      return true
    })
  }, [records, keyword, categoryFilter])

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

  const handleDelete = (item: RewardDisciplineRecord) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ ${item.form} của ${item.fullName}?`)
    if (ok) {
      onDelete(item.id)
      appToast.success("Đã xóa hồ sơ")
    }
  }

  const columns: DataTableColumn<RewardDisciplineRecord>[] = [
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
      key: "category",
      header: "Phân loại",
      headClassName: "w-32 text-center",
      cellClassName: "text-center",
      render: (item) => {
        if (item.category === "reward") {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Medal className="h-3 w-3" />
              <span>Khen thưởng</span>
            </span>
          )
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <ShieldAlert className="h-3 w-3" />
            <span>Kỷ luật</span>
          </span>
        )
      },
    },
    {
      key: "form",
      header: "Hình thức",
      headClassName: "min-w-[180px]",
      render: (item) => <span className="font-semibold text-xs text-foreground">{item.form}</span>,
    },
    {
      key: "decision",
      header: "Số quyết định & Cơ quan",
      headClassName: "min-w-[190px]",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono font-medium text-xs text-foreground">{item.decisionNumber}</span>
          <span className="text-[11px] text-muted-foreground">{item.issuer}</span>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Ngày hiệu lực",
      headClassName: "min-w-[110px]",
      render: (item) => (
        <span className="text-xs font-mono text-foreground">{formatDateVN(item.effectiveDate)}</span>
      ),
    },
    {
      key: "reason",
      header: "Lý do / Nội dung chi tiết",
      headClassName: "min-w-[240px]",
      render: (item) => (
        <span className="text-xs text-foreground line-clamp-2" title={item.reason}>
          {item.reason}
        </span>
      ),
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
            title="Chỉnh sửa hồ sơ"
            aria-label="Chỉnh sửa hồ sơ"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(item)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Xóa hồ sơ"
            aria-label="Xóa hồ sơ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = Boolean(keyword || categoryFilter !== "all")

  return (
    <div className="space-y-4">
      {/* Thanh lọc & Nút hành động */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo cán bộ, hình thức, số quyết định, lý do..."
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Phân loại" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả phân loại</SelectItem>
                <SelectItem value="reward">Khen thưởng / Biểu dương</SelectItem>
                <SelectItem value="discipline">Kỷ luật / Xử lý vi phạm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filteredRecords.length}</strong> / tổng số{" "}
            <strong className="text-foreground">{records.length}</strong> hồ sơ khen thưởng & kỷ luật
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("")
                  setCategoryFilter("all")
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
              onClick={() => exportRewardsDisciplinesToExcel(filteredRecords)}
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
              <span>Thêm khen thưởng / kỷ luật</span>
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
      <RewardDisciplineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialRecord={editingRecord}
        employees={employees}
        onSave={onSave}
      />
    </div>
  )
}
