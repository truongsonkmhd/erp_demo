import React, { useMemo, useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Truck,
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
import type { StockTransfer, Warehouse } from "../types/inventory.types"
import { STOCK_TRANSFER_STATUS_CONFIG } from "../types/inventory.constants"

interface StockTransferListTabProps {
  transfers: StockTransfer[]
  warehouses: Warehouse[]
  onOpenCreate: () => void
  onOpenEdit: (transfer: StockTransfer) => void
  onOpenDetail: (transfer: StockTransfer) => void
  onDelete: (transfer: StockTransfer) => void
  onApprove: (transfer: StockTransfer) => void
  onDispatch: (transfer: StockTransfer) => void
  onReceive: (transfer: StockTransfer) => void
  onReload: () => void
}

export function StockTransferListTab({
  transfers,
  warehouses,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onApprove,
  onDispatch,
  onReceive,
  onReload,
}: StockTransferListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "completed" | "in_transit" | "pending_approval">("all")

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = transfers.length
    const completed = transfers.filter((t) => t.status === "completed").length
    const inTransit = transfers.filter((t) => t.status === "in_transit" || t.status === "pending_receive").length
    const pendingApproval = transfers.filter((t) => t.status === "pending_approval" || t.status === "draft").length
    return { total, completed, inTransit, pendingApproval }
  }, [transfers])

  const handleQuickFilter = (type: "all" | "completed" | "in_transit" | "pending_approval") => {
    if (quickFilter === type) {
      setQuickFilter("all")
      setStatusFilter("all")
    } else {
      setQuickFilter(type)
      if (type === "all") setStatusFilter("all")
      else if (type === "completed") setStatusFilter("completed")
      else if (type === "in_transit") setStatusFilter("in_transit")
      else if (type === "pending_approval") setStatusFilter("pending_approval")
    }
  }

  const isFiltered = Boolean(
    keyword.trim() || sourceFilter !== "all" || statusFilter !== "all" || quickFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setSourceFilter("all")
    setStatusFilter("all")
    setQuickFilter("all")
  }

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchKw =
        !keyword.trim() ||
        t.code.toLowerCase().includes(keyword.toLowerCase()) ||
        t.sourceWarehouseName.toLowerCase().includes(keyword.toLowerCase()) ||
        t.targetWarehouseName.toLowerCase().includes(keyword.toLowerCase()) ||
        t.dispatcherName.toLowerCase().includes(keyword.toLowerCase())

      const matchSource = sourceFilter === "all" || t.sourceWarehouseId === sourceFilter
      const matchStatus = statusFilter === "all" || t.status === statusFilter

      return matchKw && matchSource && matchStatus
    })
  }, [transfers, keyword, sourceFilter, statusFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredTransfers.length === 0) {
      toast.warning("Không có dữ liệu điều chuyển để xuất Excel")
      return
    }

    const data = filteredTransfers.map((t, idx) => ({
      STT: idx + 1,
      "Mã điều chuyển": t.code,
      "Ngày lập": t.transferDate,
      "Kho xuất": t.sourceWarehouseName,
      "Kho nhận": t.targetWarehouseName,
      "Người xuất": t.dispatcherName,
      "Người nhận": t.receiverName,
      "Số lượng xuất": t.totalDispatchedQuantity,
      "Số lượng nhận": t.totalReceivedQuantity || (t.status === "completed" ? t.totalDispatchedQuantity : 0),
      "Tổng giá trị (VNĐ)": t.totalAmount,
      "Phương tiện": t.transporterName || "—",
      "Lý do": t.reason,
      "Trạng thái": STOCK_TRANSFER_STATUS_CONFIG[t.status]?.label || t.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dieu_chuyen_kho")
    XLSX.writeFile(workbook, `Dieu_chuyen_kho_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách điều chuyển kho thành công!")
  }

  const columns: PaginatedDataTableColumn<StockTransfer>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "code",
      header: "Mã điều chuyển",
      headClassName: "w-32 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (t) => (
        <button
          type="button"
          onClick={() => onOpenDetail(t)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết lệnh điều chuyển"
        >
          {t.code}
        </button>
      ),
    },
    {
      key: "transferDate",
      header: "Ngày lập",
      headClassName: "w-28 font-semibold text-foreground",
      cellClassName: "text-muted-foreground text-xs",
      render: (t) => t.transferDate,
    },
    {
      key: "route",
      header: "Lộ trình điều chuyển (Kho nguồn → Đích)",
      headClassName: "min-w-[280px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (t) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-purple-700 truncate max-w-[140px]">
            {t.sourceWarehouseName}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-emerald-700 truncate max-w-[140px]">
            {t.targetWarehouseName}
          </span>
        </div>
      ),
    },
    {
      key: "totalDispatchedQuantity",
      header: "Số lượng xuất",
      headClassName: "w-28 text-right font-semibold text-foreground",
      cellClassName: "text-right font-mono font-bold text-purple-700",
      render: (t) => t.totalDispatchedQuantity,
    },
    {
      key: "totalReceivedQuantity",
      header: "Số lượng nhận",
      headClassName: "w-28 text-right font-semibold text-foreground",
      cellClassName: "text-right font-mono font-bold text-emerald-700",
      render: (t) =>
        t.totalReceivedQuantity || (t.status === "completed" ? t.totalDispatchedQuantity : 0),
    },
    {
      key: "totalAmount",
      header: "Tổng giá trị",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono text-xs font-bold text-foreground",
      render: (t) => formatVND(t.totalAmount),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (t) => {
        const config = STOCK_TRANSFER_STATUS_CONFIG[t.status]
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config?.badgeClass || ""}`}
          >
            {config?.label || t.status}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-28 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (t) => {
        const canApprove = t.status === "pending_approval" || t.status === "draft"
        const canDispatch = t.status === "approved"
        const canReceive = t.status === "in_transit" || t.status === "pending_receive"
        const canEdit = t.status === "draft"
        const canDelete = t.status === "draft"

        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenDetail(t)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Xem chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            {canApprove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onApprove(t)}
                className="h-7 w-7 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Duyệt điều chuyển"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canDispatch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDispatch(t)}
                className="h-7 w-7 text-purple-600 hover:bg-purple-50 rounded-lg"
                title="Xuất kho nguồn (Bắt đầu vận chuyển)"
              >
                <Truck className="h-3.5 w-3.5" />
              </Button>
            )}

            {canReceive && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReceive(t)}
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                title="Nhận nhập kho đích"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenEdit(t)}
                className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                title="Chỉnh sửa lệnh"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(t)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Xóa lệnh nháp"
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
          Quản lý quy trình điều chuyển thiết bị, vật tư 2 đầu kho, theo dõi hàng đang trên đường và xử lý chênh lệch.
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
            disabled={filteredTransfers.length === 0}
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
            <span>Lập lệnh điều chuyển</span>
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
            <span className="text-xs font-medium text-muted-foreground">Tổng điều chuyển</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Truck className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("completed")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${
            quickFilter === "completed" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đã hoàn thành</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.completed}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("in_transit")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-purple-500/50 shadow-2xs ${
            quickFilter === "in_transit" ? "ring-2 ring-purple-500/30 border-purple-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đang vận chuyển</span>
            <div className="text-2xl font-bold text-purple-600 font-mono">{stats.inTransit}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
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
            <span className="text-xs font-medium text-muted-foreground">Chờ phê duyệt</span>
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
              placeholder="Tìm theo mã lệnh, kho nguồn, kho đích, người xuất..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Lọc theo kho xuất */}
          <div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
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
                <SelectItem value="pending_approval">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="in_transit">Đang vận chuyển</SelectItem>
                <SelectItem value="pending_receive">Chờ nhận kho đích</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="discrepancy">Có chênh lệch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredTransfers.length}</strong> / tổng số <strong className="text-foreground font-semibold">{transfers.length}</strong> lệnh điều chuyển
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
              disabled={filteredTransfers.length === 0}
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
      <PaginatedDataTable<StockTransfer>
        data={filteredTransfers}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1350px"
        emptyMessage="Không tìm thấy lệnh điều chuyển kho nào phù hợp."
      />
    </div>
  )
}
