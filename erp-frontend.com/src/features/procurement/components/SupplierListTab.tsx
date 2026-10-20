import React, { useMemo, useState } from "react"
import {
  Building2,
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
  Star,
  Tags,
  Trash2,
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
import type { Supplier } from "../types/procurement.types"
import {
  SUPPLIER_STATUS_CONFIG,
  SUPPLY_CATEGORIES,
} from "../types/procurement.constants"
import { getSupplierCategories } from "../utils/supplier-data"

interface SupplierListTabProps {
  suppliers: Supplier[]
  onOpenCreate: () => void
  onOpenEdit: (supplier: Supplier) => void
  onOpenDetail: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  onReload?: () => void
}

export function SupplierListTab({
  suppliers,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onReload,
}: SupplierListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "active" | "restricted" | "inactive">("all")

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = suppliers.length
    const active = suppliers.filter((s) => s.status === "active").length
    const restricted = suppliers.filter(
      (s) => s.status === "suspended" || s.status === "restricted"
    ).length
    const inactive = suppliers.filter((s) => s.status === "inactive").length
    return { total, active, restricted, inactive }
  }, [suppliers])

  const handleQuickFilter = (type: "all" | "active" | "restricted" | "inactive") => {
    if (quickFilter === type) {
      setQuickFilter("all")
      setStatusFilter("all")
    } else {
      setQuickFilter(type)
      if (type === "all") setStatusFilter("all")
      else if (type === "active") setStatusFilter("active")
      else if (type === "restricted") setStatusFilter("suspended")
      else if (type === "inactive") setStatusFilter("inactive")
    }
  }

  const isFiltered = Boolean(
    keyword.trim() ||
      statusFilter !== "all" ||
      categoryFilter !== "all" ||
      quickFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setQuickFilter("all")
  }

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchKw =
        !keyword.trim() ||
        s.code.toLowerCase().includes(keyword.toLowerCase()) ||
        s.name.toLowerCase().includes(keyword.toLowerCase()) ||
        s.taxCode.toLowerCase().includes(keyword.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(keyword.toLowerCase()) ||
        s.phone.toLowerCase().includes(keyword.toLowerCase())

      const matchStatus = statusFilter === "all" || s.status === statusFilter
      const matchCategory =
        categoryFilter === "all" || getSupplierCategories(s).includes(categoryFilter)

      return matchKw && matchStatus && matchCategory
    })
  }, [suppliers, keyword, statusFilter, categoryFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredSuppliers.length === 0) {
      toast.warning("Không có dữ liệu nhà cung cấp để xuất Excel")
      return
    }

    const dataToExport = filteredSuppliers.map((s, idx) => ({
      STT: idx + 1,
      "Mã NCC": s.code,
      "Tên nhà cung cấp": s.name,
      "Mã số thuế": s.taxCode,
      "Người liên hệ": s.contactPerson,
      "Điện thoại": s.phone,
      "Email": s.email,
      "Địa chỉ": s.address,
      "Nhóm cung cấp": getSupplierCategories(s).join(", "),
      "Đánh giá (Sao)": s.rating,
      "Số hợp đồng": s.contractCount,
      "Tổng giá trị cung cấp (VNĐ)": s.totalContractValue,
      "Trạng thái": SUPPLIER_STATUS_CONFIG[s.status]?.label || s.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nha_cung_cap")
    XLSX.writeFile(workbook, `Nha_cung_cap_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách nhà cung cấp thành công!")
  }

  const columns: PaginatedDataTableColumn<Supplier>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "code",
      header: "Mã NCC",
      headClassName: "w-28 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (s) => (
        <button
          type="button"
          onClick={() => onOpenDetail(s)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết nhà cung cấp"
        >
          {s.code}
        </button>
      ),
    },
    {
      key: "name",
      header: "Tên nhà cung cấp",
      headClassName: "min-w-[260px] font-semibold text-foreground",
      cellClassName: "text-foreground font-medium",
      render: (s) => (
        <div>
          <div className="font-semibold text-foreground">{s.name}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>MST: <strong className="font-mono text-foreground">{s.taxCode}</strong></span>
            {s.email && <span>• {s.email}</span>}
          </div>
        </div>
      ),
    },
    {
      key: "categories",
      header: "Nhóm cung cấp",
      headClassName: "min-w-[200px] font-semibold text-foreground",
      cellClassName: "text-xs text-muted-foreground",
      render: (s) => {
        const categories = getSupplierCategories(s)
        return (
        <div className="flex flex-wrap gap-1">
          {categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] text-foreground font-medium truncate max-w-[180px]"
            >
              {cat}
            </span>
          ))}
          {categories.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{categories.length - 2}</span>
          )}
        </div>
        )
      },
    },
    {
      key: "contactPerson",
      header: "Người liên hệ",
      headClassName: "w-36 font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (s) => (
        <div className="text-xs">
          <div className="font-medium text-foreground">{s.contactPerson}</div>
          <div className="text-[11px] text-muted-foreground font-mono">{s.phone}</div>
        </div>
      ),
    },
    {
      key: "contractCount",
      header: "Hợp đồng",
      headClassName: "w-24 text-center font-semibold text-foreground",
      cellClassName: "text-center font-mono font-medium text-foreground",
      render: (s) => `${s.contractCount} HĐ`,
    },
    {
      key: "totalContractValue",
      header: "Tổng giá trị",
      headClassName: "w-32 text-right font-semibold text-foreground",
      cellClassName: "text-right font-mono text-xs text-muted-foreground",
      render: (s) => formatVND(s.totalContractValue),
    },
    {
      key: "rating",
      header: "Đánh giá",
      headClassName: "w-24 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (s) => (
        <div className="flex items-center justify-center gap-1 font-semibold text-xs text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{s.rating.toFixed(1)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-32 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (s) => {
        const config = SUPPLIER_STATUS_CONFIG[s.status]
        return (
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${config?.badgeClass || ""}`}
          >
            {config?.label || s.status}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-24 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (s) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenDetail(s)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
            title="Xem chi tiết"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenEdit(s)}
            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
            title="Chỉnh sửa nhà cung cấp"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(s)}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
            title="Xóa nhà cung cấp"
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
          Quản trị danh bạ nhà cung cấp, thông tin pháp lý, mã số thuế và đánh giá uy tín chất lượng.
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
            disabled={filteredSuppliers.length === 0}
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
            <span>Thêm nhà cung cấp</span>
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
            <span className="text-xs font-medium text-muted-foreground">Tổng nhà cung cấp</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("active")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${
            quickFilter === "active" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đang hợp tác</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.active}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("restricted")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            quickFilter === "restricted" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Hạn chế / Tạm dừng</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.restricted}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("inactive")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-rose-500/50 shadow-2xs ${
            quickFilter === "inactive" ? "ring-2 ring-rose-500/30 border-rose-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Ngừng hợp tác</span>
            <div className="text-2xl font-bold text-rose-600 font-mono">{stats.inactive}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5" />
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
              placeholder="Tìm theo mã, tên NCC, MST, người liên hệ..."
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
                <SelectItem value="active">Đang hợp tác</SelectItem>
                <SelectItem value="suspended">Tạm ngừng</SelectItem>
                <SelectItem value="restricted">Hạn chế lựa chọn</SelectItem>
                <SelectItem value="inactive">Ngừng hợp tác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc nhóm cung cấp */}
          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Tags className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả nhóm cung cấp" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả nhóm cung cấp</SelectItem>
                {SUPPLY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredSuppliers.length}</strong> / tổng số <strong className="text-foreground font-semibold">{suppliers.length}</strong> nhà cung cấp
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
              disabled={filteredSuppliers.length === 0}
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
      <PaginatedDataTable<Supplier>
        data={filteredSuppliers}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1350px"
        emptyMessage="Không tìm thấy nhà cung cấp nào phù hợp."
      />
    </div>
  )
}
