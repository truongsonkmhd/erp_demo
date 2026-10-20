import React, { useMemo, useState } from "react"
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Edit3,
  Eye,
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
  PurchaseRequest,
  PurchaseRequestStatus,
} from "../types/procurement.types"
import {
  BUDGET_SOURCES,
  PROCUREMENT_DEPARTMENTS,
  PURCHASE_REQUEST_STATUS_CONFIG,
} from "../types/procurement.constants"

interface PurchaseRequestListTabProps {
  requests: PurchaseRequest[]
  onOpenCreate: () => void
  onOpenEdit: (request: PurchaseRequest) => void
  onOpenDetail: (request: PurchaseRequest) => void
  onRecall: (request: PurchaseRequest) => void
  onDelete: (request: PurchaseRequest) => void
  onReload?: () => void
}

export function PurchaseRequestListTab({
  requests,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onRecall,
  onDelete,
  onReload,
}: PurchaseRequestListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [budgetFilter, setBudgetFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<"all" | "approved" | "pending" | "draft_revision">("all")

  // Thống kê ERP Metric Cards
  const stats = useMemo(() => {
    const total = requests.length
    const approved = requests.filter((r) => r.status === "approved" || r.status === "ordered").length
    const pending = requests.filter(
      (r) =>
        r.status === "pending_dept" ||
        r.status === "pending_planning" ||
        r.status === "pending_leader"
    ).length
    const draftOrRevision = requests.filter(
      (r) => r.status === "draft" || r.status === "revision_required"
    ).length
    return { total, approved, pending, draftOrRevision }
  }, [requests])

  const handleQuickFilter = (type: "all" | "approved" | "pending" | "draft_revision") => {
    if (quickFilter === type) {
      setQuickFilter("all")
      setStatusFilter("all")
    } else {
      setQuickFilter(type)
      if (type === "all") setStatusFilter("all")
      else if (type === "approved") setStatusFilter("approved")
      else if (type === "pending") setStatusFilter("pending_dept")
      else if (type === "draft_revision") setStatusFilter("draft")
    }
  }

  const isFiltered = Boolean(
    keyword.trim() ||
      departmentFilter !== "all" ||
      statusFilter !== "all" ||
      budgetFilter !== "all" ||
      quickFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setDepartmentFilter("all")
    setStatusFilter("all")
    setBudgetFilter("all")
    setQuickFilter("all")
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchKw =
        !keyword.trim() ||
        r.code.toLowerCase().includes(keyword.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(keyword.toLowerCase()) ||
        r.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
        r.department.toLowerCase().includes(keyword.toLowerCase())

      const matchDept =
        departmentFilter === "all" || r.department === departmentFilter

      const matchStatus =
        statusFilter === "all" || r.status === statusFilter

      const matchBudget =
        budgetFilter === "all" || r.budgetSource === budgetFilter

      return matchKw && matchDept && matchStatus && matchBudget
    })
  }, [requests, keyword, departmentFilter, statusFilter, budgetFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      toast.warning("Không có dữ liệu để xuất Excel")
      return
    }

    const dataToExport = filteredRequests.map((r, idx) => ({
      STT: idx + 1,
      "Mã đề nghị": r.code,
      "Ngày đề nghị": r.requestDate,
      "Đơn vị đề xuất": r.department,
      "Người đề xuất": r.requesterName,
      "Nhiệm vụ / Đề án": r.projectName,
      "Hạng mục": r.projectItem || "",
      "Nguồn kinh phí": r.budgetSource,
      "Thời điểm cần": r.requiredDate,
      "Tổng kinh phí (VNĐ)": r.totalAmount,
      "Trạng thái": PURCHASE_REQUEST_STATUS_CONFIG[r.status]?.label || r.status,
      "Lý do": r.reason || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "De_nghi_mua_sam")
    XLSX.writeFile(workbook, `De_nghi_mua_sam_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách đề nghị mua sắm thành công!")
  }

  const columns: PaginatedDataTableColumn<PurchaseRequest>[] = [
    {
      key: "stt",
      header: "STT",
      headClassName: "w-12 text-center font-bold text-foreground",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_item, rowIndex) => rowIndex + 1,
    },
    {
      key: "code",
      header: "Mã đề xuất",
      headClassName: "w-32 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-primary",
      render: (r) => (
        <button
          type="button"
          onClick={() => onOpenDetail(r)}
          className="hover:underline font-mono text-primary font-bold text-left"
          title="Xem chi tiết đề xuất"
        >
          {r.code}
        </button>
      ),
    },
    {
      key: "requestDate",
      header: "Ngày đề nghị",
      headClassName: "w-28 font-semibold text-foreground",
      cellClassName: "text-muted-foreground text-xs",
      render: (r) => r.requestDate,
    },
    {
      key: "department",
      header: "Đơn vị đề xuất",
      headClassName: "w-44 font-semibold text-foreground",
      cellClassName: "font-medium text-foreground",
      render: (r) => r.department,
    },
    {
      key: "requesterName",
      header: "Người đề xuất",
      headClassName: "w-36 font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (r) => r.requesterName,
    },
    {
      key: "projectName",
      header: "Nhiệm vụ / Đề án",
      headClassName: "min-w-[240px] font-semibold text-foreground",
      cellClassName: "text-foreground",
      render: (r) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground line-clamp-1">{r.projectName}</div>
          {r.projectItem && (
            <div className="text-[11px] text-muted-foreground line-clamp-1">
              Hạng mục: {r.projectItem}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "requiredDate",
      header: "Thời điểm cần",
      headClassName: "w-28 font-semibold text-foreground",
      cellClassName: "text-xs text-muted-foreground",
      render: (r) => r.requiredDate,
    },
    {
      key: "totalAmount",
      header: "Tổng kinh phí",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-bold text-foreground",
      render: (r) => formatVND(r.totalAmount),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center font-semibold text-foreground",
      cellClassName: "text-center",
      render: (r) => {
        const config = PURCHASE_REQUEST_STATUS_CONFIG[r.status]
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
      headClassName: "w-24 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (r) => {
        const canEdit = r.status === "draft" || r.status === "revision_required"
        const canRecall =
          r.status === "pending_dept" ||
          r.status === "pending_planning" ||
          r.status === "pending_leader"
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

            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenEdit(r)}
                className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                title="Chỉnh sửa đề xuất"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            )}

            {canRecall && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRecall(r)}
                className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg"
                title="Thu hồi về bản nháp"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(r)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                title="Xóa bản nháp"
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
          Quản lý danh sách các đề xuất mua sắm vật tư, trang thiết bị và quá trình kiểm tra dự toán.
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
            disabled={filteredRequests.length === 0}
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
            <span>Tạo đề xuất mới</span>
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
            <span className="text-xs font-medium text-muted-foreground">Tổng đề xuất</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("approved")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${
            quickFilter === "approved" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Đã phê duyệt</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{stats.approved}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("pending")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            quickFilter === "pending" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Chờ phê duyệt</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.pending}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter("draft_revision")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-blue-500/50 shadow-2xs ${
            quickFilter === "draft_revision" ? "ring-2 ring-blue-500/30 border-blue-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Bản nháp / Cần sửa</span>
            <div className="text-2xl font-bold text-blue-600 font-mono">{stats.draftOrRevision}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </button>
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
              placeholder="Tìm theo mã, người đề xuất, đề án..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Lọc đơn vị */}
          <div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả đơn vị" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả đơn vị</SelectItem>
                {PROCUREMENT_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
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
                <SelectItem value="pending_dept">Chờ Trưởng đơn vị</SelectItem>
                <SelectItem value="pending_planning">Chờ Kế hoạch/Dự toán</SelectItem>
                <SelectItem value="pending_leader">Chờ Lãnh đạo duyệt</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="ordered">Đã chuyển mua sắm</SelectItem>
                <SelectItem value="revision_required">Yêu cầu bổ sung</SelectItem>
                <SelectItem value="rejected">Từ chối duyệt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc nguồn kinh phí */}
          <div>
            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả nguồn kinh phí" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả nguồn kinh phí</SelectItem>
                {BUDGET_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
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
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredRequests.length}</strong> / tổng số <strong className="text-foreground font-semibold">{requests.length}</strong> đề xuất
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
              disabled={filteredRequests.length === 0}
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
      <PaginatedDataTable<PurchaseRequest>
        data={filteredRequests}
        columns={columns}
        rowKey={(row) => row.id}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        minTableWidth="1350px"
        emptyMessage="Không tìm thấy hồ sơ đề xuất mua sắm nào phù hợp."
      />
    </div>
  )
}
