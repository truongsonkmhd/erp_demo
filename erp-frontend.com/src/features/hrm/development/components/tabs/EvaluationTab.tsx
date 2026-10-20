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
import { EvaluationModal } from "../EvaluationModal"
import type { EvaluationClassification, EvaluationRecord } from "../../types/hrm-development.types.ts"
import { exportEvaluationsToExcel } from "../../utils/development-export"

interface EvaluationTabProps {
  records: EvaluationRecord[]
  employees: EmployeeAccount[]
  onSave: (record: EvaluationRecord) => void
  onDelete: (id: string) => void
}

export function EvaluationTab({ records, employees, onSave, onDelete }: EvaluationTabProps) {
  const [keyword, setKeyword] = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [classFilter, setClassFilter] = useState<string>("all")

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<EvaluationRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const match =
          item.fullName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.achievements.toLowerCase().includes(q)
        if (!match) return false
      }
      if (yearFilter !== "all" && item.year.toString() !== yearFilter) return false
      if (classFilter !== "all" && item.classification !== classFilter) return false
      return true
    })
  }, [records, keyword, yearFilter, classFilter])

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

  const handleDelete = (item: EvaluationRecord) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn xóa kết quả đánh giá năm ${item.year} của ${item.fullName}?`)
    if (ok) {
      onDelete(item.id)
      appToast.success("Đã xóa đánh giá cán bộ")
    }
  }

  const columns: DataTableColumn<EvaluationRecord>[] = [
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
      key: "period",
      header: "Kỳ đánh giá",
      headClassName: "min-w-[120px]",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-foreground">Năm {item.year}</span>
          <span className="text-[11px] text-muted-foreground">
            {item.period === "year" ? "Đánh giá cả năm" : `Quý ${item.period.slice(1)}`}
          </span>
        </div>
      ),
    },
    {
      key: "classification",
      header: "Kết quả xếp loại",
      headClassName: "min-w-[170px]",
      render: (item) => {
        if (item.classification === "xuat_sac") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Hoàn thành xuất sắc
            </span>
          )
        }
        if (item.classification === "tot") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-600 border border-sky-500/20">
              Hoàn thành tốt
            </span>
          )
        }
        if (item.classification === "hoan_thanh") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Hoàn thành nhiệm vụ
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            Không hoàn thành
          </span>
        )
      },
    },
    {
      key: "score",
      header: "Điểm số",
      headClassName: "w-24 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <span className="text-xs font-mono font-semibold text-foreground">
          {item.score !== undefined ? `${item.score}/100` : "—"}
        </span>
      ),
    },
    {
      key: "achievements",
      header: "Ưu điểm & Thành tích",
      headClassName: "min-w-[250px]",
      render: (item) => (
        <span className="text-xs text-foreground line-clamp-2" title={item.achievements}>
          {item.achievements}
        </span>
      ),
    },
    {
      key: "approval",
      header: "Phê duyệt",
      headClassName: "min-w-[160px]",
      render: (item) => (
        <div className="flex flex-col text-xs">
          <span className="text-foreground truncate max-w-[150px]">{item.evaluator}</span>
          <span className="text-[11px] text-muted-foreground font-mono">{formatDateVN(item.approvalDate)}</span>
        </div>
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
            title="Chỉnh sửa đánh giá"
            aria-label="Chỉnh sửa đánh giá"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(item)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Xóa đánh giá"
            aria-label="Xóa đánh giá"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const isFiltered = Boolean(keyword || yearFilter !== "all" || classFilter !== "all")

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
              placeholder="Tìm theo cán bộ, thành tích..."
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Năm đánh giá" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả các năm</SelectItem>
                <SelectItem value="2026">Năm 2026</SelectItem>
                <SelectItem value="2025">Năm 2025</SelectItem>
                <SelectItem value="2024">Năm 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Mức xếp loại" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả mức xếp loại</SelectItem>
                <SelectItem value="xuat_sac">Hoàn thành xuất sắc</SelectItem>
                <SelectItem value="tot">Hoàn thành tốt</SelectItem>
                <SelectItem value="hoan_thanh">Hoàn thành nhiệm vụ</SelectItem>
                <SelectItem value="khong_hoan_thanh">Không hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filteredRecords.length}</strong> / tổng số{" "}
            <strong className="text-foreground">{records.length}</strong> hồ sơ đánh giá
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("")
                  setYearFilter("all")
                  setClassFilter("all")
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
              onClick={() => exportEvaluationsToExcel(filteredRecords)}
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
              <span>Thêm đánh giá xếp loại</span>
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
      <EvaluationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialRecord={editingRecord}
        employees={employees}
        onSave={onSave}
      />
    </div>
  )
}
