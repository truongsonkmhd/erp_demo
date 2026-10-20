import React, { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
import type { PurchaseContract } from "../types/procurement.types"
import { CONTRACT_STATUS_CONFIG } from "../types/procurement.constants"

interface PurchaseContractListTabProps {
  contracts: PurchaseContract[]
  onOpenCreate: () => void
  onOpenEdit: (contract: PurchaseContract) => void
  onOpenDetail: (contract: PurchaseContract) => void
  onDelete: (contract: PurchaseContract) => void
  onReload?: () => void
}

export function PurchaseContractListTab({
  contracts,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onReload,
}: PurchaseContractListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "active" | "completed" | "pending_sign">("all")

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = contracts.length
    const active = contracts.filter((c) => c.status === "active").length
    const completed = contracts.filter(
      (c) => c.status === "completed" || c.status === "liquidated"
    ).length
    const pendingSign = contracts.filter(
      (c) => c.status === "draft" || c.status === "pending_sign"
    ).length
    return { total, active, completed, pendingSign }
  }, [contracts])

  const handleQuickFilter = (type: "all" | "active" | "completed" | "pending_sign") => {
    if (quickFilter === type) {
      setQuickFilter("all")
      setStatusFilter("all")
    } else {
      setQuickFilter(type)
      if (type === "all") setStatusFilter("all")
      else if (type === "active") setStatusFilter("active")
      else if (type === "completed") setStatusFilter("completed")
      else if (type === "pending_sign") setStatusFilter("pending_sign")
    }
  }

  const isFiltered = Boolean(
    keyword.trim() || statusFilter !== "all" || quickFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setStatusFilter("all")
    setQuickFilter("all")
  }

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchKw =
        !keyword.trim() ||
        c.contractNumber.toLowerCase().includes(keyword.toLowerCase()) ||
        c.contractName.toLowerCase().includes(keyword.toLowerCase()) ||
        c.supplierName.toLowerCase().includes(keyword.toLowerCase()) ||
        c.requestCode.toLowerCase().includes(keyword.toLowerCase())

      const matchStatus = statusFilter === "all" || c.status === statusFilter

      return matchKw && matchStatus
    })
  }, [contracts, keyword, statusFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredContracts.length === 0) {
      toast.warning("Không có dữ liệu hợp đồng để xuất Excel")
      return
    }

    const dataToExport = filteredContracts.map((c, idx) => ({
      STT: idx + 1,
      "Số hợp đồng": c.contractNumber,
      "Tên hợp đồng": c.contractName,
      "Căn cứ đề xuất": c.requestCode,
      "Nhà cung cấp": c.supplierName,
      "Ngày ký": c.signedDate,
      "Ngày hiệu lực": c.effectiveDate,
      "Ngày hết hạn": c.expirationDate,
      "Giá trị hợp đồng (VNĐ)": c.totalAmount,
      "Tiến độ giao (%)": `${c.deliveryProgress}%`,
      "Điều khoản thanh toán": c.paymentTerms,
      "Trạng thái": CONTRACT_STATUS_CONFIG[c.status]?.label || c.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hop_dong_mua_sam")
    XLSX.writeFile(workbook, `Hop_dong_mua_sam_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách hợp đồng mua sắm thành công!")
  }

  const columns: PaginatedDataTableColumn<PurchaseContract>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "contractNumber",
      header: "Số hợp đồng",
      headClassName: "w-36 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (c) => (
        <button
          type="button"
          onClick={() => onOpenDetail(c)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết hợp đồng"
        >
          {c.contractNumber}
        </button>
      ),
    },
    {
      key: "contractName",
      header: "Tên hợp đồng & Căn cứ",
      headClassName: "min-w-[280px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (c) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground line-clamp-1">{c.contractName}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span>Căn cứ đề xuất: <strong className="font-mono text-primary">{c.requestCode}</strong></span>
          </div>
        </div>
      ),
    },
    {
      key: "supplierName",
      header: "Nhà cung cấp",
      headClassName: "w-48 font-semibold text-foreground",
      cellClassName: "font-medium text-foreground",
      render: (c) => c.supplierName,
    },
    {
      key: "signedDate",
      header: "Ngày ký / Hiệu lực",
      headClassName: "w-32 font-semibold text-foreground",
      cellClassName: "text-xs text-muted-foreground",
      render: (c) => (
        <div>
          <div>Ký: {c.signedDate}</div>
          <div className="text-[11px] text-muted-foreground">Hạn: {c.expirationDate}</div>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Giá trị hợp đồng",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-bold text-foreground",
      render: (c) => formatVND(c.totalAmount),
    },
    {
      key: "deliveryProgress",
      header: "Tiến độ giao hàng",
      headClassName: "w-36 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (c) => (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span>Tiến độ</span>
            <span className="font-bold text-primary">{c.deliveryProgress}%</span>
          </div>
          <Progress value={c.deliveryProgress} className="h-1.5" />
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-32 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (c) => {
        const config = CONTRACT_STATUS_CONFIG[c.status]
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config?.badgeClass || ""}`}
          >
            {config?.label || c.status}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-24 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenDetail(c)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
            title="Xem chi tiết"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenEdit(c)}
            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
            title="Chỉnh sửa hợp đồng"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(c)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
            title="Xóa hợp đồng"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 1. Toolbar chuẩn HRM */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Theo dõi hợp đồng mua sắm ký kết từ đề xuất đã duyệt, tiến độ giao hàng và điều khoản thanh toán.
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onReload && (
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
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredContracts.length === 0}
            className="h-8 text-xs gap-1.5"
            title="Xuất Excel"
          >
            <Download className="h-3 w-3" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            onClick={onOpenCreate}
            size="sm"
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ký lập hợp đồng mới</span>
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
            <span className="text-xs font-medium text-muted-foreground">Tổng hợp đồng</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("active")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-blue-500/50 shadow-2xs ${
            quickFilter === "active" ? "ring-2 ring-blue-500/30 border-blue-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đang thực hiện</span>
            <div className="text-2xl font-bold text-blue-600 font-mono">{stats.active}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
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
            <span className="text-xs font-medium text-muted-foreground">Hoàn thành / Thanh lý</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.completed}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("pending_sign")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            quickFilter === "pending_sign" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Dự thảo / Chờ ký</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.pendingSign}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
        </button>
      </div>

      {/* 3. Bộ lọc dữ liệu chuẩn EmployeeProfileFilters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo số HĐ, tên hợp đồng, nhà cung cấp, mã đề xuất..."
              className="pl-9 h-9 text-xs"
            />
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
                <SelectItem value="draft">Dự thảo</SelectItem>
                <SelectItem value="pending_sign">Chờ ký</SelectItem>
                <SelectItem value="active">Đang thực hiện</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="liquidated">Thanh lý</SelectItem>
                <SelectItem value="suspended">Tạm dừng</SelectItem>
                <SelectItem value="overdue">Quá hạn</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredContracts.length}</strong> / tổng số <strong className="text-foreground font-semibold">{contracts.length}</strong> hợp đồng
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
              disabled={filteredContracts.length === 0}
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
      <PaginatedDataTable<PurchaseContract>
        data={filteredContracts}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1350px"
        emptyMessage="Không tìm thấy hợp đồng mua sắm nào phù hợp."
      />
    </div>
  )
}
