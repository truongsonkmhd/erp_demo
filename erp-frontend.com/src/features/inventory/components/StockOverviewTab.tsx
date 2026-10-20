import React, { useMemo, useState } from "react"
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  History,
  Layers,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders,
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
import type {
  InventoryTransaction,
  Material,
  StockLevel,
  StockThreshold,
  Warehouse,
} from "../types/inventory.types"
import { MATERIAL_CATEGORIES } from "../types/inventory.constants"
import { MaterialManagementDrawer } from "./MaterialManagementDrawer"
import { WarehouseManagementDrawer } from "./WarehouseManagementDrawer"
import { StockThresholdDrawer } from "./StockThresholdDrawer"
import { StockCardModal } from "./StockCardModal"

interface StockOverviewTabProps {
  materials: Material[]
  warehouses: Warehouse[]
  stockLevels: StockLevel[]
  thresholds: StockThreshold[]
  transactions: InventoryTransaction[]
  onReload: () => void
}

type StockViewMode = "material" | "warehouse" | "batch"

export function StockOverviewTab({
  materials,
  warehouses,
  stockLevels,
  thresholds,
  transactions,
  onReload,
}: StockOverviewTabProps) {
  const [viewMode, setViewMode] = useState<StockViewMode>("material")
  const [keyword, setKeyword] = useState("")
  const [warehouseFilter, setWarehouseFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all") // all, safe, warning, oos

  // Drawers & Modals
  const [materialDrawerOpen, setMaterialDrawerOpen] = useState(false)
  const [warehouseDrawerOpen, setWarehouseDrawerOpen] = useState(false)
  const [thresholdDrawerOpen, setThresholdDrawerOpen] = useState(false)
  const [selectedStockCardMaterial, setSelectedStockCardMaterial] = useState<Material | null>(null)
  const [selectedStockCardLevel, setSelectedStockCardLevel] = useState<StockLevel | null>(null)

  // Tính toán số liệu Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const totalMaterials = materials.length
    const totalValue = stockLevels.reduce((sum, item) => sum + item.totalValue, 0)
    const oosCount = stockLevels.filter((s) => s.physicalQuantity <= 0).length
    const warningCount = stockLevels.filter(
      (s) =>
        (typeof s.minStock === "number" && s.minStock > 0 && s.physicalQuantity < s.minStock) ||
        (typeof s.maxStock === "number" && s.maxStock > 0 && s.physicalQuantity > s.maxStock)
    ).length
    const safeCount = Math.max(0, stockLevels.length - oosCount - warningCount)

    return { totalMaterials, totalValue, safeCount, warningCount, oosCount }
  }, [materials, stockLevels])

  // Lọc dữ liệu theo bộ lọc
  const filteredLevels = useMemo(() => {
    return stockLevels.filter((item) => {
      const matchKw =
        !keyword.trim() ||
        item.materialCode.toLowerCase().includes(keyword.toLowerCase()) ||
        item.materialName.toLowerCase().includes(keyword.toLowerCase()) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(keyword.toLowerCase()))

      const matchWh =
        warehouseFilter === "all" || item.warehouseId === warehouseFilter

      const matchCat =
        categoryFilter === "all" || item.category === categoryFilter

      let matchStatus = true
      if (statusFilter === "safe") {
        matchStatus =
          item.physicalQuantity > 0 &&
          (!item.minStock || item.physicalQuantity >= item.minStock) &&
          (!item.maxStock || item.physicalQuantity <= item.maxStock)
      } else if (statusFilter === "warning") {
        matchStatus = Boolean(
          (item.minStock && item.physicalQuantity < item.minStock) ||
            (item.maxStock && item.physicalQuantity > item.maxStock)
        )
      } else if (statusFilter === "oos") {
        matchStatus = item.physicalQuantity <= 0
      }

      return matchKw && matchWh && matchCat && matchStatus
    })
  }, [stockLevels, keyword, warehouseFilter, categoryFilter, statusFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleOpenStockCard = (level: StockLevel) => {
    const mat = materials.find((m) => m.id === level.materialId) || null
    setSelectedStockCardMaterial(mat)
    setSelectedStockCardLevel(level)
  }

  const handleExportExcel = () => {
    if (filteredLevels.length === 0) {
      toast.warning("Không có dữ liệu tồn kho để xuất Excel")
      return
    }

    const data = filteredLevels.map((s, idx) => ({
      STT: idx + 1,
      "Mã vật tư": s.materialCode,
      "Tên vật tư": s.materialName,
      "Nhóm vật tư": s.category,
      "Đơn vị tính": s.unit,
      "Kho lưu trữ": s.warehouseName,
      "Vị trí": s.locationCode || "—",
      "Số lô": s.batchNumber || "—",
      "Hạn sử dụng": s.expiryDate || "—",
      "Tồn thực tế": s.physicalQuantity,
      "Đang giữ chỗ": s.reservedQuantity,
      "Tồn khả dụng": s.availableQuantity,
      "Định mức Min": s.minStock ?? "—",
      "Định mức Max": s.maxStock ?? "—",
      "Đơn giá bình quân": s.unitPrice,
      "Tổng giá trị (VNĐ)": s.totalValue,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bao_cao_ton_kho")
    XLSX.writeFile(workbook, `Bao_cao_ton_kho_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel báo cáo tồn kho thành công!")
  }

  const isFiltered = Boolean(
    keyword.trim() ||
      warehouseFilter !== "all" ||
      categoryFilter !== "all" ||
      statusFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setWarehouseFilter("all")
    setCategoryFilter("all")
    setStatusFilter("all")
  }

  const columns: PaginatedDataTableColumn<StockLevel>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "materialCode",
      header: "Mã vật tư",
      headClassName: "w-32 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (s) => (
        <button
          type="button"
          onClick={() => handleOpenStockCard(s)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem Thẻ kho"
        >
          {s.materialCode}
        </button>
      ),
    },
    {
      key: "materialName",
      header: "Tên vật tư / Quy cách",
      headClassName: "min-w-[260px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (s) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground line-clamp-1">{s.materialName}</div>
          <div className="text-[11px] text-muted-foreground line-clamp-1">{s.category}</div>
        </div>
      ),
    },
    {
      key: "warehouseName",
      header: "Kho & Vị trí",
      headClassName: "w-44 font-semibold text-foreground",
      cellClassName: "text-xs",
      render: (s) => (
        <div>
          <div className="font-medium text-foreground">{s.warehouseName}</div>
          {s.locationCode && (
            <div className="text-[11px] text-muted-foreground font-mono">
              Vị trí: {s.locationCode}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "batchNumber",
      header: "Lô & Hạn dùng",
      headClassName: "w-32 font-semibold text-foreground",
      cellClassName: "text-xs",
      render: (s) => (
        <div>
          {s.batchNumber ? (
            <div className="font-mono text-primary font-medium">{s.batchNumber}</div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {s.expiryDate && (
            <div className="text-[10px] text-amber-600 font-medium">Hạn: {s.expiryDate}</div>
          )}
        </div>
      ),
    },
    {
      key: "physicalQuantity",
      header: "Tồn thực tế",
      headClassName: "w-28 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-bold text-foreground",
      render: (s) => `${s.physicalQuantity} ${s.unit}`,
    },
    {
      key: "reservedQuantity",
      header: "Giữ chỗ",
      headClassName: "w-24 text-right font-semibold text-foreground",
      cellClassName: "text-right font-mono text-amber-600",
      render: (s) => (s.reservedQuantity > 0 ? `${s.reservedQuantity} ${s.unit}` : "0"),
    },
    {
      key: "availableQuantity",
      header: "Tồn khả dụng",
      headClassName: "w-28 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-bold text-emerald-600",
      render: (s) => `${s.availableQuantity} ${s.unit}`,
    },
    {
      key: "thresholds",
      header: "Định mức (Min/Max)",
      headClassName: "w-32 text-center font-semibold text-foreground",
      cellClassName: "text-center font-mono text-xs text-muted-foreground",
      render: (s) => {
        if (!s.minStock && !s.maxStock) return <span className="text-muted-foreground">—</span>
        return (
          <span>
            {s.minStock ?? 0} / {s.maxStock ?? "∞"}
          </span>
        )
      },
    },
    {
      key: "totalValue",
      header: "Giá trị tồn kho",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono text-xs font-semibold text-foreground",
      render: (s) => formatVND(s.totalValue),
    },
    {
      key: "status",
      header: "Tình trạng",
      headClassName: "w-28 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (s) => {
        if (s.physicalQuantity <= 0) {
          return (
            <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-300">
              Hết hàng
            </Badge>
          )
        }
        if (s.minStock && s.physicalQuantity < s.minStock) {
          return (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
              Dưới định mức
            </Badge>
          )
        }
        if (s.maxStock && s.physicalQuantity > s.maxStock) {
          return (
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-300">
              Vượt định mức
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
            An toàn
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Thẻ kho",
      headClassName: "w-20 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (s) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenStockCard(s)}
          className="h-7 text-xs px-2 gap-1 text-primary hover:bg-primary/10"
          title="Xem lịch sử Thẻ kho"
        >
          <History className="h-3.5 w-3.5" />
          <span>Thẻ kho</span>
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 1. Toolbar chuẩn HRM */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          Quản lý số dư tồn kho thực tế, giữ chỗ và khả dụng tính toán từ Sổ cái giao dịch bất biến.
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            className="h-8 text-xs gap-1.5"
            title="Tải lại số dư tồn kho"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Tải lại</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredLevels.length === 0}
            className="h-8 text-xs gap-1.5"
            title="Xuất Excel"
          >
            <Download className="h-3 w-3" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setThresholdDrawerOpen(true)}
            className="h-8 text-xs gap-1.5 border-dashed"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Định mức Min/Max</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWarehouseDrawerOpen(true)}
            className="h-8 text-xs gap-1.5 border-dashed"
          >
            <WarehouseIcon className="h-3.5 w-3.5" />
            <span>Hệ thống kho</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setMaterialDrawerOpen(true)}
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm danh mục vật tư</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 Thẻ ERP Metric Cards chuẩn HRM */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng mặt hàng</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.totalMaterials}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng giá trị tồn</span>
            <div className="text-xl font-bold text-emerald-600 font-mono truncate max-w-[170px]">
              {formatVND(stats.totalValue)}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Cảnh báo định mức</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.warningCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Hết hàng tồn</span>
            <div className="text-2xl font-bold text-rose-600 font-mono">{stats.oosCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Bộ lọc dữ liệu chuẩn EmployeeProfileFilters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã, tên vật tư, số lô..."
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
                <SelectItem value="all">Tất cả kho lưu trữ</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo nhóm vật tư */}
          <div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả nhóm vật tư" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả nhóm vật tư</SelectItem>
                {MATERIAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lọc tình trạng tồn */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả tình trạng" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả tình trạng tồn</SelectItem>
                <SelectItem value="safe">Tồn an toàn</SelectItem>
                <SelectItem value="warning">Cảnh báo Min/Max</SelectItem>
                <SelectItem value="oos">Hết hàng (Tồn = 0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredLevels.length}</strong> / tổng số <strong className="text-foreground font-semibold">{stockLevels.length}</strong> dòng tồn kho
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
              disabled={filteredLevels.length === 0}
              className="h-7 text-xs px-2.5 gap-1.5 font-medium"
              title="Xuất bảng tồn kho ra Excel"
            >
              <Download className="h-3 w-3" />
              <span>Xuất Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Bảng số dư tồn kho chuẩn PaginatedDataTable */}
      <PaginatedDataTable<StockLevel>
        data={filteredLevels}
        columns={columns}
        rowKey={(row) => `${row.materialId}_${row.warehouseId}_${row.batchNumber || "main"}`}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="6rem"
        minTableWidth="1380px"
        emptyMessage="Không tìm thấy bản ghi tồn kho nào phù hợp."
      />

      {/* Các Drawer & Modal con */}
      <MaterialManagementDrawer
        open={materialDrawerOpen}
        onClose={() => setMaterialDrawerOpen(false)}
        onSuccess={() => {
          setMaterialDrawerOpen(false)
          onReload()
        }}
        materials={materials}
      />

      <WarehouseManagementDrawer
        open={warehouseDrawerOpen}
        onClose={() => setWarehouseDrawerOpen(false)}
        onSuccess={() => {
          setWarehouseDrawerOpen(false)
          onReload()
        }}
        warehouses={warehouses}
      />

      <StockThresholdDrawer
        open={thresholdDrawerOpen}
        onClose={() => setThresholdDrawerOpen(false)}
        onSuccess={() => {
          setThresholdDrawerOpen(false)
          onReload()
        }}
        materials={materials}
        warehouses={warehouses}
        thresholds={thresholds}
      />

      <StockCardModal
        open={Boolean(selectedStockCardMaterial)}
        onClose={() => {
          setSelectedStockCardMaterial(null)
          setSelectedStockCardLevel(null)
        }}
        material={selectedStockCardMaterial}
        stockLevel={selectedStockCardLevel}
        transactions={transactions}
        warehouses={warehouses}
      />
    </div>
  )
}
