import React, { useMemo, useState } from "react"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PaginatedDataTable,
  type PaginatedDataTableColumn,
} from "@/components/ui/paginated-data-table"
import type { MaterialSettlement } from "../types/settlement.types"
import { SETTLEMENT_STATUS_CONFIG, type SettlementTabId } from "../types/settlement.constants"
import type { SettlementWorkflowAction } from "./SettlementActionModal"

interface SettlementOverviewTabProps {
  settlements: MaterialSettlement[]
  currentTab: SettlementTabId
  onReload: () => void
  onOpenCreateModal: () => void
  onViewDetail: (stl: MaterialSettlement) => void
  onOpenReturnModal: (stl: MaterialSettlement) => void
  onOpenActionModal: (stl: MaterialSettlement, action: SettlementWorkflowAction) => void
}

export function SettlementOverviewTab({
  settlements,
  currentTab,
  onReload,
  onOpenCreateModal,
  onViewDetail,
  onOpenReturnModal,
  onOpenActionModal,
}: SettlementOverviewTabProps) {
  const [keyword, setKeyword] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  // Lọc theo Tab cha
  const tabFilteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      if (currentTab === "pending") {
        return s.status === "draft" || s.status === "unit_confirmed" || s.status === "revision_requested"
      }
      if (currentTab === "processing") {
        return s.status === "accounting_reviewed" || s.status === "pending_approval"
      }
      if (currentTab === "completed") {
        return s.status === "approved" || s.status === "rejected"
      }
      return true
    })
  }, [settlements, currentTab])

  // Lọc theo bộ lọc chi tiết
  const filteredData = useMemo(() => {
    return tabFilteredSettlements.filter((s) => {
      const matchKw =
        !keyword.trim() ||
        s.code.toLowerCase().includes(keyword.toLowerCase()) ||
        s.missionName.toLowerCase().includes(keyword.toLowerCase()) ||
        s.categoryName.toLowerCase().includes(keyword.toLowerCase()) ||
        s.personInCharge.toLowerCase().includes(keyword.toLowerCase())

      const matchDept = departmentFilter === "all" || s.departmentName === departmentFilter
      const matchStatus = statusFilter === "all" || s.status === statusFilter

      return matchKw && matchDept && matchStatus
    })
  }, [tabFilteredSettlements, keyword, departmentFilter, statusFilter])

  // Tính 4 ERP Metric Cards
  const stats = useMemo(() => {
    const totalCount = filteredData.length
    const totalIssued = filteredData.reduce((sum, item) => sum + (item.totalIssuedAmount || 0), 0)
    const totalReturned = filteredData.reduce((sum, item) => sum + (item.totalReturnedAmount || 0), 0)
    const totalUsed = filteredData.reduce((sum, item) => sum + (item.totalActualUsedAmount || 0), 0)

    return { totalCount, totalIssued, totalReturned, totalUsed }
  }, [filteredData])

  // Danh sách các đơn vị độc nhất
  const departments = useMemo(() => {
    return Array.from(new Set(settlements.map((s) => s.departmentName))).filter(Boolean)
  }, [settlements])

  const handleResetFilters = () => {
    setKeyword("")
    setDepartmentFilter("all")
    setStatusFilter("all")
  }

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.warning("Không có dữ liệu quyết toán để xuất Excel")
      return
    }

    const data = filteredData.map((s, idx) => ({
      STT: idx + 1,
      "Mã hồ sơ": s.code,
      "Nhiệm vụ / Đề án": s.missionName,
      "Hạng mục": s.categoryName,
      "Đơn vị chủ trì": s.departmentName,
      "Niên độ": s.period,
      "Ngày quyết toán": s.settlementDate,
      "Trạng thái": SETTLEMENT_STATUS_CONFIG[s.status]?.label || s.status,
      "Tổng giá trị xuất (VNĐ)": s.totalIssuedAmount,
      "Giá trị hoàn trả (VNĐ)": s.totalReturnedAmount,
      "Quyết toán thực tế (VNĐ)": s.totalActualUsedAmount,
      "Người phụ trách": s.personInCharge,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quyet_toan_vat_tu")
    XLSX.writeFile(workbook, `Quyet_toan_vat_tu_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel báo cáo quyết toán vật tư thành công!")
  }

  const isFiltered = Boolean(keyword.trim() || departmentFilter !== "all" || statusFilter !== "all")

  const columns: PaginatedDataTableColumn<MaterialSettlement>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "code",
      header: "Mã hồ sơ",
      headClassName: "w-32 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (s) => (
        <button
          type="button"
          onClick={() => onViewDetail(s)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết hồ sơ quyết toán"
        >
          {s.code}
        </button>
      ),
    },
    {
      key: "missionName",
      header: "Nhiệm vụ / Đề án & Hạng mục",
      headClassName: "min-w-[260px] font-bold text-foreground",
      cellClassName: "font-medium text-foreground",
      render: (s) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground line-clamp-1">{s.missionName}</div>
          <div className="text-[11px] text-muted-foreground line-clamp-1">
            Hạng mục: <span className="text-primary font-medium">{s.categoryName}</span>
          </div>
        </div>
      ),
    },
    {
      key: "departmentName",
      header: "Đơn vị thực hiện",
      headClassName: "w-44 font-bold text-foreground",
      cellClassName: "text-muted-foreground text-xs",
      render: (s) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{s.departmentName}</div>
          <div className="text-[10px] text-muted-foreground">{s.period}</div>
        </div>
      ),
    },
    {
      key: "totalIssuedAmount",
      header: "Giá trị xuất",
      headClassName: "w-32 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-medium text-muted-foreground",
      render: (s) => formatVND(s.totalIssuedAmount),
    },
    {
      key: "totalReturnedAmount",
      header: "Hoàn trả",
      headClassName: "w-32 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-medium text-emerald-600",
      render: (s) => formatVND(s.totalReturnedAmount),
    },
    {
      key: "totalActualUsedAmount",
      header: "Quyết toán thực tế",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-bold text-primary",
      render: (s) => formatVND(s.totalActualUsedAmount),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center font-bold text-foreground",
      cellClassName: "text-center",
      render: (s) => {
        const cfg = SETTLEMENT_STATUS_CONFIG[s.status] || {
          label: s.status,
          badgeClass: "bg-muted text-muted-foreground",
        }
        return (
          <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-medium ${cfg.badgeClass}`}>
            {cfg.label}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-28 text-center font-bold text-foreground",
      cellClassName: "text-center",
      render: (s) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewDetail(s)}
            className="h-7 w-7 text-primary hover:bg-primary/10"
            title="Xem chi tiết"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {s.status !== "approved" && s.status !== "rejected" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenReturnModal(s)}
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
              title="Lập phiếu hoàn trả"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 1. Toolbar bar chuẩn Menu 06 */}
      <div className="flex items-center justify-between pb-1">
        <div className="text-xs text-muted-foreground">
          Tổng hợp khối lượng vật tư đã xuất theo từng nhiệm vụ, ghi nhận hoàn trả và quyết toán chi phí thực tế.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            className="h-8 text-xs gap-1.5"
            title="Tải lại danh sách"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Tải lại</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 text-xs gap-1.5"
            title="Xuất Excel"
          >
            <Download className="h-3 w-3" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreateModal}
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Lập hồ sơ quyết toán</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 Thẻ ERP Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng số hồ sơ</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.totalCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng giá trị xuất</span>
            <div className="text-lg font-bold text-foreground font-mono truncate max-w-[170px]" title={formatVND(stats.totalIssued)}>
              {formatVND(stats.totalIssued)}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Giá trị thu hồi hoàn kho</span>
            <div className="text-lg font-bold text-emerald-600 font-mono truncate max-w-[170px]" title={formatVND(stats.totalReturned)}>
              {formatVND(stats.totalReturned)}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <RotateCcw className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Quyết toán thực tế</span>
            <div className="text-lg font-bold text-primary font-mono truncate max-w-[170px]" title={formatVND(stats.totalUsed)}>
              {formatVND(stats.totalUsed)}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Bộ lọc Filter Card */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã, nhiệm vụ, hạng mục, người phụ trách..."
              className="h-8.5 text-xs pl-8"
            />
          </div>

          <div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Tất cả đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả đơn vị</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
                {Object.entries(SETTLEMENT_STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
          <div className="text-muted-foreground">
            Đang hiển thị <strong>{filteredData.length}</strong> / <strong>{tabFilteredSettlements.length}</strong> hồ sơ quyết toán
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-2 text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bảng PaginatedDataTable */}
      <PaginatedDataTable<MaterialSettlement>
        data={filteredData}
        columns={columns}
        rowKey={(s) => s.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1200px"
        emptyMessage={
          isFiltered
            ? "Không tìm thấy hồ sơ nào khớp với bộ lọc."
            : "Chưa có hồ sơ quyết toán nào trong danh sách."
        }
      />
    </div>
  )
}
