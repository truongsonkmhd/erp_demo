import React, { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Warehouse as WarehouseIcon,
  XCircle,
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
import type { GoodsReceipt, Warehouse } from "../types/inventory.types"
import { GOODS_RECEIPT_STATUS_CONFIG } from "../types/inventory.constants"

interface GoodsReceiptListTabProps {
  receipts: GoodsReceipt[]
  warehouses: Warehouse[]
  onOpenCreate: () => void
  onOpenEdit: (receipt: GoodsReceipt) => void
  onOpenDetail: (receipt: GoodsReceipt) => void
  onDelete: (receipt: GoodsReceipt) => void
  onConfirmPost: (receipt: GoodsReceipt) => void
  onReload: () => void
}

export function GoodsReceiptListTab({
  receipts,
  warehouses,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onConfirmPost,
  onReload,
}: GoodsReceiptListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "posted" | "pending_post" | "draft">("all")

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = receipts.length
    const posted = receipts.filter((r) => r.status === "posted").length
    const pendingPost = receipts.filter((r) => r.status === "pending_post").length
    const draft = receipts.filter((r) => r.status === "draft" || r.status === "rejected").length
    return { total, posted, pendingPost, draft }
  }, [receipts])

  const handleQuickFilter = (type: "all" | "posted" | "pending_post" | "draft") => {
    if (quickFilter === type) {
      setQuickFilter("all")
      setStatusFilter("all")
    } else {
      setQuickFilter(type)
      if (type === "all") setStatusFilter("all")
      else if (type === "posted") setStatusFilter("posted")
      else if (type === "pending_post") setStatusFilter("pending_post")
      else if (type === "draft") setStatusFilter("draft")
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

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchKw =
        !keyword.trim() ||
        r.code.toLowerCase().includes(keyword.toLowerCase()) ||
        r.delivererName.toLowerCase().includes(keyword.toLowerCase()) ||
        (r.contractNumber && r.contractNumber.toLowerCase().includes(keyword.toLowerCase())) ||
        (r.supplierName && r.supplierName.toLowerCase().includes(keyword.toLowerCase()))

      const matchWh =
        warehouseFilter === "all" || r.warehouseId === warehouseFilter

      const matchStatus = statusFilter === "all" || r.status === statusFilter

      return matchKw && matchWh && matchStatus
    })
  }, [receipts, keyword, warehouseFilter, statusFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredReceipts.length === 0) {
      toast.warning("Không có dữ liệu phiếu nhập kho để xuất Excel")
      return
    }

    const data = filteredReceipts.map((r, idx) => ({
      STT: idx + 1,
      "Mã phiếu nhập": r.code,
      "Ngày nhập": r.receiptDate,
      "Kho tiếp nhận": r.warehouseName,
      "Hợp đồng": r.contractNumber || "Mua trực tiếp",
      "Nhà cung cấp": r.supplierName || "—",
      "Người giao": r.delivererName,
      "Thủ kho nhận": r.receiverName,
      "Tổng số lượng": r.totalQuantity,
      "Tổng giá trị (VNĐ)": r.totalAmount,
      "Trạng thái": GOODS_RECEIPT_STATUS_CONFIG[r.status]?.label || r.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Phieu_nhap_kho")
    XLSX.writeFile(workbook, `Phieu_nhap_kho_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách phiếu nhập kho thành công!")
  }

  const columns: PaginatedDataTableColumn<GoodsReceipt>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "code",
      header: "Mã phiếu nhập",
      headClassName: "w-32 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (r) => (
        <button
          type="button"
          onClick={() => onOpenDetail(r)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết phiếu nhập"
        >
          {r.code}
        </button>
      ),
    },
    {
      key: "receiptDate",
      header: "Ngày nhập",
      headClassName: "w-28 font-semibold text-foreground",
      cellClassName: "text-muted-foreground text-xs",
      render: (r) => r.receiptDate,
    },
    {
      key: "warehouseName",
      header: "Kho tiếp nhận",
      headClassName: "w-44 font-semibold text-foreground",
      cellClassName: "font-medium text-foreground",
      render: (r) => r.warehouseName,
    },
    {
      key: "contractNumber",
      header: "Hợp đồng / NCC",
      headClassName: "min-w-[220px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground font-mono">
            {r.contractNumber || "Mua sắm trực tiếp"}
          </div>
          <div className="text-[11px] text-muted-foreground line-clamp-1">
            {r.supplierName || r.delivererName}
          </div>
        </div>
      ),
    },
    {
      key: "receiverName",
      header: "Thủ kho",
      headClassName: "w-36 font-semibold text-foreground",
      cellClassName: "text-foreground text-xs",
      render: (r) => r.receiverName,
    },
    {
      key: "totalQuantity",
      header: "Số lượng",
      headClassName: "w-24 text-right font-semibold text-foreground",
      cellClassName: "text-right font-mono font-bold text-foreground",
      render: (r) => r.totalQuantity,
    },
    {
      key: "totalAmount",
      header: "Tổng giá trị",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono text-xs font-bold text-foreground",
      render: (r) => formatVND(r.totalAmount),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (r) => {
        const config = GOODS_RECEIPT_STATUS_CONFIG[r.status]
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config?.badgeClass || ""}`}
          >
            {config?.label || r.status}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-28 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (r) => {
        const canEdit = r.status === "draft" || r.status === "pending_post"
        const canPost = r.status === "pending_post" || r.status === "draft"
        const canDelete = r.status === "draft"

        return (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenDetail(r)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
              title="Xem chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            {canPost && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onConfirmPost(r)}
                className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                title="Xác nhận ghi sổ nhập kho"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenEdit(r)}
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
                onClick={() => onDelete(r)}
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
          Quản lý quy trình nhập kho theo hợp đồng mua sắm, kiểm định số lô, hạn sử dụng và ghi sổ tăng tồn.
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
            disabled={filteredReceipts.length === 0}
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
            <span>Lập phiếu nhập kho</span>
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
            <span className="text-xs font-medium text-muted-foreground">Tổng phiếu nhập</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("posted")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${
            quickFilter === "posted" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đã nhập kho</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.posted}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("pending_post")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            quickFilter === "pending_post" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Chờ xác nhận</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.pendingPost}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("draft")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-blue-500/50 shadow-2xs ${
            quickFilter === "draft" ? "ring-2 ring-blue-500/30 border-blue-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Bản nháp / Khác</span>
            <div className="text-2xl font-bold text-blue-600 font-mono">{stats.draft}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
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
              placeholder="Tìm theo mã phiếu, người giao, hợp đồng, NCC..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Lọc theo kho */}
          <div>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <WarehouseIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả kho" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả kho tiếp nhận</SelectItem>
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
                <SelectItem value="pending_post">Chờ xác nhận nhập</SelectItem>
                <SelectItem value="posted">Đã nhập kho</SelectItem>
                <SelectItem value="rejected">Từ chối nhập</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredReceipts.length}</strong> / tổng số <strong className="text-foreground font-semibold">{receipts.length}</strong> phiếu nhập kho
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
              disabled={filteredReceipts.length === 0}
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
      <PaginatedDataTable<GoodsReceipt>
        data={filteredReceipts}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1350px"
        emptyMessage="Không tìm thấy phiếu nhập kho nào phù hợp."
      />
    </div>
  )
}
