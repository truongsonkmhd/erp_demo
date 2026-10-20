import React, { useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  Info,
  Package,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  PaginatedDataTable,
  type PaginatedDataTableColumn,
} from "@/components/ui/paginated-data-table"
import type { AlertSeverity, StockAlert } from "../types/inventory.types"
import {
  ALERT_SEVERITY_CONFIG,
  STOCK_ALERT_TYPE_CONFIG,
} from "../types/inventory.constants"
import { PurchaseRequestRepository } from "@/features/procurement/repositories/procurement.storage"
import type { PurchaseRequest } from "@/features/procurement/types/procurement.types"
import { useAuth } from "@/services/auth/AuthContext"

interface StockAlertListTabProps {
  alerts: StockAlert[]
  onDismiss: (alertId: string, reason?: string) => void
  onReload: () => void
}

export function StockAlertListTab({
  alerts,
  onDismiss,
  onReload,
}: StockAlertListTabProps) {
  const { user } = useAuth()
  const [keyword, setKeyword] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [quickSeverity, setQuickSeverity] = useState<"all" | "critical" | "warning" | "info">("all")

  // Modal xác nhận bỏ qua cảnh báo nghiêm trọng
  const [dismissModalTarget, setDismissModalTarget] = useState<StockAlert | null>(null)
  const [dismissReason, setDismissReason] = useState("")

  // Lọc chỉ lấy cảnh báo chưa bị dismiss
  const activeAlerts = useMemo(() => {
    return alerts.filter((a) => !a.dismissed)
  }, [alerts])

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = activeAlerts.length
    const critical = activeAlerts.filter((a) => a.severity === "critical").length
    const warning = activeAlerts.filter((a) => a.severity === "warning").length
    const info = activeAlerts.filter((a) => a.severity === "info").length
    return { total, critical, warning, info }
  }, [activeAlerts])

  const handleQuickSeverity = (sev: "all" | "critical" | "warning" | "info") => {
    if (quickSeverity === sev) {
      setQuickSeverity("all")
      setSeverityFilter("all")
    } else {
      setQuickSeverity(sev)
      setSeverityFilter(sev)
    }
  }

  const isFiltered = Boolean(
    keyword.trim() || severityFilter !== "all" || typeFilter !== "all" || quickSeverity !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setSeverityFilter("all")
    setTypeFilter("all")
    setQuickSeverity("all")
  }

  const filteredAlerts = useMemo(() => {
    return activeAlerts.filter((a) => {
      const matchKw =
        !keyword.trim() ||
        a.materialCode.toLowerCase().includes(keyword.toLowerCase()) ||
        a.materialName.toLowerCase().includes(keyword.toLowerCase()) ||
        a.message.toLowerCase().includes(keyword.toLowerCase()) ||
        (a.warehouseName && a.warehouseName.toLowerCase().includes(keyword.toLowerCase()))

      const matchSev = severityFilter === "all" || a.severity === severityFilter
      const matchType = typeFilter === "all" || a.type === typeFilter

      return matchKw && matchSev && matchType
    })
  }, [activeAlerts, keyword, severityFilter, typeFilter])

  // Chức năng liên kết PRC-09 -> Tạo đề xuất mua sắm bù tồn kho
  const handleCreatePurchaseDraft = (alert: StockAlert) => {
    const needQuantity =
      alert.thresholdQuantity && alert.thresholdQuantity > alert.currentQuantity
        ? alert.thresholdQuantity - alert.currentQuantity
        : 5

    const newReqCode = `DXMS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    const now = new Date().toISOString()

    const draftRequest: PurchaseRequest = {
      id: `req-${Date.now()}`,
      code: newReqCode,
      requestDate: now.split("T")[0],
      department: alert.warehouseName?.includes("Máy bay")
        ? "Đoàn Địa vật lý Máy bay"
        : alert.warehouseName?.includes("Biển")
        ? "Đoàn Địa vật lý Biển"
        : alert.warehouseName?.includes("Mặt đất")
        ? "Đoàn Địa vật lý Mặt đất"
        : "Phòng Kế hoạch - Kỹ thuật",
      requesterName: user?.fullName || "Thủ kho Liên đoàn",
      requesterRole: user?.role || "Thủ kho",
      projectName: `Bổ sung dự phòng an toàn tồn kho theo cảnh báo ${alert.materialCode}`,
      projectItem: `Mua sắm bù định mức tối thiểu kho ${alert.warehouseName || "Liên đoàn"}`,
      budgetSource: "Quỹ phát triển hoạt động sự nghiệp",
      requiredDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      reason: `Cảnh báo hệ thống: ${alert.message}. Đề xuất mua sắm bù đắp lượng tồn thiếu hụt.`,
      status: "draft",
      totalAmount: needQuantity * 10000000, // Tạm tính ước tính
      lines: [
        {
          id: `line-${Date.now()}`,
          materialName: alert.materialName,
          specification: `Quy cách theo chuẩn mã ${alert.materialCode}`,
          unit: "Cái",
          currentStock: alert.currentQuantity,
          quantity: needQuantity,
          estimatedUnitPrice: 10000000,
          totalAmount: needQuantity * 10000000,
          purpose: `Bù định mức tồn kho (Thiếu ${needQuantity} đơn vị)`,
        },
      ],
      approvalHistory: [
        {
          id: `wf-${Date.now()}`,
          stepName: "Khởi tạo từ Cảnh báo Kho",
          actorName: user?.fullName || "Thủ kho",
          actorRole: "Thủ kho",
          action: "create",
          actionName: "Tạo dự thảo mua sắm tự động",
          comment: `Sinh tự động từ cảnh báo: ${alert.message}`,
          timestamp: now,
          newStatus: "draft",
        },
      ],
      createdAt: now,
      updatedAt: now,
    }

    try {
      PurchaseRequestRepository.save(draftRequest)
      toast.success(
        `Đã tạo thành công Bản nháp Đề xuất mua sắm (${newReqCode}) cho vật tư "${alert.materialName}"!`
      )
    } catch (err) {
      toast.error("Không thể tạo dự thảo mua sắm")
    }
  }

  const handleOpenDismiss = (alert: StockAlert) => {
    if (alert.severity === "critical") {
      setDismissModalTarget(alert)
      setDismissReason("")
    } else {
      onDismiss(alert.id)
      toast.success("Đã đánh dấu đã xem cảnh báo!")
    }
  }

  const handleConfirmDismissCritical = () => {
    if (!dismissModalTarget) return
    if (!dismissReason.trim()) {
      toast.error("Cảnh báo nghiêm trọng bắt buộc phải nhập lý do xử lý hoặc giải trình!")
      return
    }

    onDismiss(dismissModalTarget.id, dismissReason)
    toast.success("Đã ghi nhận lý do và bỏ qua cảnh báo thành công!")
    setDismissModalTarget(null)
  }

  const handleExportExcel = () => {
    if (filteredAlerts.length === 0) {
      toast.warning("Không có cảnh báo để xuất Excel")
      return
    }

    const data = filteredAlerts.map((a, idx) => ({
      STT: idx + 1,
      "Mức độ": ALERT_SEVERITY_CONFIG[a.severity]?.label || a.severity,
      "Loại cảnh báo": STOCK_ALERT_TYPE_CONFIG[a.type]?.label || a.type,
      "Mã vật tư": a.materialCode,
      "Tên vật tư": a.materialName,
      "Kho lưu trữ": a.warehouseName || "Toàn hệ thống",
      "Số lô": a.batchNumber || "—",
      "Số lượng hiện có": a.currentQuantity,
      "Ngưỡng định mức": a.thresholdQuantity ?? "—",
      "Nội dung cảnh báo": a.message,
      "Khuyến nghị xử lý": a.actionSuggestion,
      "Thời điểm sinh": new Date(a.createdAt).toLocaleString("vi-VN"),
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Canh_bao_ton_kho")
    XLSX.writeFile(workbook, `Canh_bao_ton_kho_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách cảnh báo tồn kho thành công!")
  }

  const columns: PaginatedDataTableColumn<StockAlert>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "severity",
      header: "Mức độ",
      headClassName: "w-28 text-center font-bold text-foreground",
      cellClassName: "text-center",
      render: (a) => {
        const config = ALERT_SEVERITY_CONFIG[a.severity]
        return (
          <Badge
            variant="outline"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config?.badgeClass || ""}`}
          >
            {config?.label || a.severity}
          </Badge>
        )
      },
    },
    {
      key: "type",
      header: "Loại cảnh báo",
      headClassName: "w-44 font-semibold text-foreground",
      cellClassName: "text-xs font-medium text-foreground",
      render: (a) => STOCK_ALERT_TYPE_CONFIG[a.type]?.label || a.type,
    },
    {
      key: "materialName",
      header: "Vật tư & Địa điểm",
      headClassName: "min-w-[240px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (a) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-foreground">
            <span className="font-mono text-primary font-bold mr-1.5">{a.materialCode}</span>
            {a.materialName}
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span>Kho: <strong>{a.warehouseName || "Toàn hệ thống"}</strong></span>
            {a.batchNumber && <span>• Lô: <strong className="font-mono">{a.batchNumber}</strong></span>}
          </div>
        </div>
      ),
    },
    {
      key: "message",
      header: "Chi tiết cảnh báo & Khuyến nghị",
      headClassName: "min-w-[320px] font-semibold text-foreground",
      cellClassName: "text-xs",
      render: (a) => (
        <div className="space-y-1">
          <div className="text-foreground font-medium">{a.message}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1 italic">
            <span>→ Gợi ý: {a.actionSuggestion}</span>
          </div>
        </div>
      ),
    },
    {
      key: "currentQuantity",
      header: "Số lượng / Ngưỡng",
      headClassName: "w-32 text-center font-semibold text-foreground",
      cellClassName: "text-center font-mono text-xs",
      render: (a) => (
        <div>
          <span className="font-bold text-foreground">{a.currentQuantity}</span>
          {typeof a.thresholdQuantity === "number" && (
            <span className="text-muted-foreground"> / {a.thresholdQuantity}</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Hành động xử lý",
      headClassName: "w-48 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (a) => {
        const canBuy = a.type === "out_of_stock" || a.type === "below_min" || a.type === "shortage"

        return (
          <div className="flex items-center justify-center gap-1.5">
            {canBuy && (
              <Button
                size="sm"
                onClick={() => handleCreatePurchaseDraft(a)}
                className="h-7 text-xs px-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs font-medium"
                title="Tạo dự thảo phiếu đề xuất mua sắm bù tồn"
              >
                <ShoppingCart className="h-3 w-3" />
                <span>Mua bù</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDismiss(a)}
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
              title="Đánh dấu đã xem / Bỏ qua"
            >
              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
              <span>Đã xem</span>
            </Button>
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
          Hệ thống giám sát định mức tồn kho, hạn sử dụng hóa chất/pin và cảnh báo sớm nguy cơ thiếu hụt vật tư.
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            className="h-8 text-xs gap-1.5"
            title="Quét lại cảnh báo tồn kho"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Quét lại</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={filteredAlerts.length === 0}
            className="h-8 text-xs gap-1.5"
            title="Xuất Excel"
          >
            <Download className="h-3 w-3" />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      {/* 2. 4 Thẻ ERP Metric Cards chuẩn HRM */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => handleQuickSeverity("all")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-primary/50 shadow-2xs ${
            quickSeverity === "all" ? "ring-2 ring-primary/30 border-primary" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng cảnh báo</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickSeverity("critical")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-rose-500/50 shadow-2xs ${
            quickSeverity === "critical" ? "ring-2 ring-rose-500/30 border-rose-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Nghiêm trọng</span>
            <div className="text-2xl font-bold text-rose-600 font-mono">{stats.critical}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickSeverity("warning")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            quickSeverity === "warning" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Cảnh báo vừa</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.warning}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickSeverity("info")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-blue-500/50 shadow-2xs ${
            quickSeverity === "info" ? "ring-2 ring-blue-500/30 border-blue-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Thông tin</span>
            <div className="text-2xl font-bold text-blue-600 font-mono">{stats.info}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Info className="h-5 w-5" />
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
              placeholder="Tìm theo mã vật tư, nội dung cảnh báo, kho..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Lọc theo mức độ */}
          <div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả mức độ" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả mức độ cảnh báo</SelectItem>
                <SelectItem value="critical">Nghiêm trọng (Hết hàng / Hết hạn)</SelectItem>
                <SelectItem value="warning">Cảnh báo (Dưới min / Sắp hết hạn)</SelectItem>
                <SelectItem value="info">Thông tin (Vượt mức trần max)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo loại cảnh báo */}
          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả loại cảnh báo" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả loại cảnh báo</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng tồn kho</SelectItem>
                <SelectItem value="below_min">Dưới định mức tối thiểu</SelectItem>
                <SelectItem value="above_max">Vượt định mức tối đa</SelectItem>
                <SelectItem value="expiring_soon">Sắp hết hạn (&lt;30 ngày)</SelectItem>
                <SelectItem value="expired">Đã quá hạn sử dụng</SelectItem>
                <SelectItem value="shortage">Nhu cầu vượt khả dụng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thanh công cụ và tổng kết phía dưới bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredAlerts.length}</strong> / tổng số <strong className="text-foreground font-semibold">{activeAlerts.length}</strong> cảnh báo đang mở
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
              disabled={filteredAlerts.length === 0}
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
      <PaginatedDataTable<StockAlert>
        data={filteredAlerts}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="12rem"
        minTableWidth="1350px"
        emptyMessage="Tuyệt vời! Hiện không có cảnh báo tồn kho nào cần xử lý."
      />

      {/* Modal giải trình khi bỏ qua cảnh báo nghiêm trọng */}
      <Dialog
        open={Boolean(dismissModalTarget)}
        onOpenChange={(val) => !val && setDismissModalTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Xác nhận bỏ qua cảnh báo nghiêm trọng</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cảnh báo "{dismissModalTarget?.message}" thuộc diện quan trọng ảnh hưởng đến thi công. Vui lòng ghi rõ lý do trước khi đóng cảnh báo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <Label className="text-xs font-semibold">Lý do xử lý / Giải trình *</Label>
            <Input
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="VD: Đã làm việc với nhà cung cấp, hàng đang về..."
              className="h-8.5 text-xs"
            />
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDismissModalTarget(null)}
              className="h-8 text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDismissCritical}
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Xác nhận bỏ qua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
