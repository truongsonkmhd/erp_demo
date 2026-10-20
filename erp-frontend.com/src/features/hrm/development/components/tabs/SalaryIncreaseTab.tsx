import React, { useMemo, useState } from "react"
import { ArrowRight, Check, Copy, Download, Edit, Plus, RotateCcw, Search, Trash2, TrendingUp } from "lucide-react"

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
import { SalaryIncreaseModal } from "../SalaryIncreaseModal"
import type { SalaryIncreaseRecord, SalaryIncreaseType } from "../../types/hrm-development.types.ts"
import { exportSalaryIncreasesToExcel } from "../../utils/development-export"

interface SalaryIncreaseTabProps {
  records: SalaryIncreaseRecord[]
  employees: EmployeeAccount[]
  onSave: (record: SalaryIncreaseRecord) => void
  onDelete: (id: string) => void
}

export function SalaryIncreaseTab({
  records,
  employees,
  onSave,
  onDelete,
}: SalaryIncreaseTabProps) {
  const [keyword, setKeyword] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SalaryIncreaseRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const match =
          item.fullName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.decisionNumber.toLowerCase().includes(q) ||
          item.payGrade.toLowerCase().includes(q)
        if (!match) return false
      }
      if (typeFilter !== "all" && item.type !== typeFilter) return false
      return true
    })
  }, [records, keyword, typeFilter])

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

  const handleDelete = (item: SalaryIncreaseRecord) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa quyết định nâng lương ${item.decisionNumber} của ${item.fullName}?`)
    if (ok) {
      onDelete(item.id)
      appToast.success("Đã xóa quyết định nâng lương")
    }
  }

  const columns: DataTableColumn<SalaryIncreaseRecord>[] = [
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
      key: "decisionNumber",
      header: "Số quyết định",
      headClassName: "min-w-[150px]",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono font-semibold text-xs text-foreground">{item.decisionNumber}</span>
          <span className="text-[11px] text-muted-foreground">Ký ngày: {formatDateVN(item.decisionDate)}</span>
        </div>
      ),
    },
    {
      key: "effectiveDate",
      header: "Ngày hiệu lực",
      headClassName: "min-w-[110px]",
      render: (item) => (
        <span className="text-xs font-mono text-foreground">{formatDateVN(item.effectiveDate)}</span>
      ),
    },
    {
      key: "payGrade",
      header: "Ngạch chức danh",
      headClassName: "min-w-[180px]",
      render: (item) => <span className="text-xs text-foreground">{item.payGrade}</span>,
    },
    {
      key: "stepTransition",
      header: "Bậc & Hệ số nâng",
      headClassName: "min-w-[180px]",
      render: (item) => (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-muted-foreground">
            Bậc {item.oldStep} ({item.oldCoefficient})
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-semibold text-emerald-600">
            Bậc {item.newStep} ({item.newCoefficient})
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Hình thức nâng",
      headClassName: "min-w-[140px]",
      render: (item) => {
        if (item.type === "early") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Trước thời hạn
            </span>
          )
        }
        if (item.type === "exceptional") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Vượt bậc đặc cách
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
            Thường xuyên
          </span>
        )
      },
    },
    {
      key: "signatory",
      header: "Người ký",
      headClassName: "min-w-[120px]",
      render: (item) => <span className="text-xs text-foreground">{item.signatory || "—"}</span>,
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
            title="Chỉnh sửa quyết định"
            aria-label="Chỉnh sửa quyết định"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(item)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Xóa quyết định"
            aria-label="Xóa quyết định"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = Boolean(keyword || typeFilter !== "all")

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
              placeholder="Tìm theo cán bộ, số quyết định, ngạch lương..."
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Hình thức nâng bậc" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả hình thức</SelectItem>
                <SelectItem value="regular">Nâng lương thường xuyên</SelectItem>
                <SelectItem value="early">Nâng trước thời hạn</SelectItem>
                <SelectItem value="exceptional">Vượt bậc đặc cách</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filteredRecords.length}</strong> / tổng số{" "}
            <strong className="text-foreground">{records.length}</strong> quyết định nâng lương
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("")
                  setTypeFilter("all")
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
              onClick={() => exportSalaryIncreasesToExcel(filteredRecords)}
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
              <span>Thêm quyết định nâng lương</span>
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
      <SalaryIncreaseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialRecord={editingRecord}
        employees={employees}
        onSave={onSave}
      />
    </div>
  )
}
