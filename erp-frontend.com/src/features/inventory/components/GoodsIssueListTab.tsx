import React, { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  PackageMinus,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Warehouse as WarehouseIcon,
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
import type { GoodsIssue, Warehouse } from "../types/inventory.types"
import { GOODS_ISSUE_STATUS_CONFIG } from "../types/inventory.constants"

interface GoodsIssueListTabProps {
  issues: GoodsIssue[]
  warehouses: Warehouse[]
  onOpenCreate: () => void
  onOpenEdit: (issue: GoodsIssue) => void
  onOpenDetail: (issue: GoodsIssue) => void
  onDelete: (issue: GoodsIssue) => void
  onApprove: (issue: GoodsIssue) => void
  onConfirmIssue: (issue: GoodsIssue) => void
  onReload: () => void
}

export function GoodsIssueListTab({
  issues,
  warehouses,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onApprove,
  onConfirmIssue,
  onReload,
}: GoodsIssueListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "issued" | "approved" | "pending_approval">("all")

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = issues.length
    const issued = issues.filter((i) => i.status === "issued").length
    const approved = issues.filter((i) => i.status === "approved" || i.status === "pending_issue").length
    const pendingApproval = issues.filter((i) => i.status === "pending_approval" || i.status === "draft").length
    return { total, issued, approved, pendingApproval }
  }, [issues])

  const handleQuickFilter = (type: "all" | "issued" | "approved" | "pending_approval") => {
    if (quickFilter === type) {
      setQuickFilter("all")
      setStatusFilter("all")
    } else {
      setQuickFilter(type)
      if (type === "all") setStatusFilter("all")
      else if (type === "issued") setStatusFilter("issued")
      else if (type === "approved") setStatusFilter("approved")
      else if (type === "pending_approval") setStatusFilter("pending_approval")
    }
  }

  const isFiltered = Boolean(
    keyword.trim() || warehouseFilter !== "all" || statusFilter !== "all" || quickFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setWarehouseFilter("all")
    setStatusFilter("all")
    setQuickFilter("all")
  }

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      const matchKw =
        !keyword.trim() ||
        i.code.toLowerCase().includes(keyword.toLowerCase()) ||
        i.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
        i.department.toLowerCase().includes(keyword.toLowerCase()) ||
        i.receiverName.toLowerCase().includes(keyword.toLowerCase())

      const matchWh =
        warehouseFilter === "all" || i.warehouseId === warehouseFilter

      const matchStatus = statusFilter === "all" || i.status === statusFilter

      return matchKw && matchWh && matchStatus
    })
  }, [issues, keyword, warehouseFilter, statusFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredIssues.length === 0) {
      toast.warning("Không có dữ liệu phiếu xuất kho để xuất Excel")
      return
    }

    const data = filteredIssues.map((i, idx) => ({
      STT: idx + 1,
      "Mã phiếu xuất": i.code,
      "Ngày xuất": i.issueDate,
      "Kho xuất": i.warehouseName,
      "Nhiệm vụ / Đề án": i.projectName,
      "Hạng mục": i.projectItem || "",
      "Đơn vị nhận": i.department,
      "Cán bộ nhận": i.receiverName,
      "Tổng số lượng": i.totalQuantity,
      "Tổng giá trị (VNĐ)": i.totalAmount,
      "Lý do xuất": i.reason,
      "Trạng thái": GOODS_ISSUE_STATUS_CONFIG[i.status]?.label || i.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Phieu_xuat_kho")
    XLSX.writeFile(workbook, `Phieu_xuat_kho_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách phiếu xuất kho thành công!")
  }

  const columns: PaginatedDataTableColumn<GoodsIssue>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "code",
      header: "Mã phiếu xuất",
      headClassName: "w-32 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (i) => (
        <button
          type="button"
          onClick={() => onOpenDetail(i)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết phiếu xuất"
        >
          {i.code}
        </button>
      ),
    },
    {
      key: "issueDate",
      header: "Ngày xuất",
      headClassName: "w-28 font-semibold text-foreground",
      cellClassName: "text-muted-foreground text-xs",
      render: (i) => i.issueDate,
    },
    {
      key: "warehouseName",
      header: "Kho xuất",
      headClassName: "w-44 font-semibold text-foreground",
      cellClassName: "font-medium text-foreground",
      render: (i) => i.warehouseName,
    },
    {
      key: "projectName",
      header: "Nhiệm vụ / Đơn vị nhận",
      headClassName: "min-w-[240px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (i) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground line-clamp-1">{i.projectName}</div>
          <div className="text-[11px] text-muted-foreground line-clamp-1">
            Đơn vị: {i.department} • Nhận: {i.receiverName}
          </div>
        </div>
      ),
    },
    {
      key: "totalQuantity",
      header: "Số lượng",
      headClassName: "w-24 text-right font-semibold text-foreground",
      cellClassName: "text-right font-mono font-bold text-foreground",
      render: (i) => i.totalQuantity,
    },
    {
      key: "totalAmount",
      header: "Tổng dự toán",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono text-xs font-bold text-foreground",
      render: (i) => formatVND(i.totalAmount),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (i) => {
        const config = GOODS_ISSUE_STATUS_CONFIG[i.status]
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config?.badgeClass || ""}`}
          >
            {config?.label || i.status}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-28 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (i) => {
        const canApprove = i.status === "pending_approval" || i.status === "draft"
        const canIssue = i.status === "approved" || i.status === "pending_issue"
        const canEdit = i.status === "draft" || i.status === "revision_required"
        const canDelete = i.status === "draft"

        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenDetail(i)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Xem chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            {canApprove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onApprove(i)}
                className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Duyệt xuất (Giữ chỗ)"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canIssue && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onConfirmIssue(i)}
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                title="Xác nhận thực xuất kho"
              >
                <PackageMinus className="h-3.5 w-3.5" />
              </Button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenEdit(i)}
                className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                title="Chỉnh sửa phiếu"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(i)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Xóa phiếu nháp"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* 1. Toolbar chuẩn HRM */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Quản lý quy trình xuất kho cấp phát vật tư theo nhiệm vụ/đề án, giữ chỗ tồn kho và ghi sổ giảm trừ.
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            disabled={filteredIssues.length === 0}
            className="h-8 text-xs gap-1.5"
            title="Xuất Excel"
          >
            <Download className="h-3 w-3" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Lập phiếu xuất kho</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 Thẻ ERP Metric Cards chuẩn HRM */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => handleQuickFilter("all")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-primary/50 shadow-2xs ${
            quickFilter === "all" ? "ring-2 ring-primary/30 border-primary" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng phiếu xuất</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <PackageMinus className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("issued")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${
            quickFilter === "issued" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đã xuất kho</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.issued}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("approved")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-blue-500/50 shadow-2xs ${
            quickFilter === "approved" ? "ring-2 ring-blue-500/30 border-blue-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đã duyệt (Giữ chỗ)</span>
            <div className="text-2xl font-bold text-blue-600 font-mono">{stats.approved}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("pending_approval")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            quickFilter === "pending_approval" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Chờ duyệt xuất</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.pendingApproval}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <RotateCcw className="h-5 w-5" />
          </div>
        </button>
      </div>

      {/* 3. Bộ lọc dữ liệu chuẩn EmployeeProfileFilters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã phiếu, nhiệm vụ, đơn vị nhận, cán bộ..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Lọc theo kho */}
          <div>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả kho xuất" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả kho xuất hàng</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lọc trạng thái */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="pending_approval">Chờ duyệt xuất</SelectItem>
                <SelectItem value="approved">Đã duyệt (Giữ chỗ)</SelectItem>
                <SelectItem value="issued">Đã xuất kho</SelectItem>
                <SelectItem value="rejected">Từ chối duyệt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredIssues.length}</strong> / tổng số <strong className="text-foreground font-semibold">{issues.length}</strong> phiếu xuất kho
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
                onClick={handleResetFilters}
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
              onClick={handleExportExcel}
              disabled={filteredIssues.length === 0}
              className="h-7 text-xs px-2.5 gap-1.5 font-medium"
              title="Xuất bảng danh sách ra Excel"
            >
              <Download className="h-3 w-3" />
              <span>Xuất Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Bảng danh sách chuẩn PaginatedDataTable */}
      <PaginatedDataTable<GoodsIssue>
        data={filteredIssues}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1350px"
        emptyMessage="Không tìm thấy phiếu xuất kho nào phù hợp."
      />
    </div>
  )
}
