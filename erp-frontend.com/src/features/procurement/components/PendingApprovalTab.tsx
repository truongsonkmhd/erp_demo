import React, { useMemo, useState } from "react"
import {
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
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
import type { PurchaseRequest } from "../types/procurement.types"
import {
  PROCUREMENT_DEPARTMENTS,
  PURCHASE_REQUEST_STATUS_CONFIG,
} from "../types/procurement.constants"

interface PendingApprovalTabProps {
  requests: PurchaseRequest[]
  onOpenDetail: (request: PurchaseRequest) => void
  onOpenApprovalModal: (
    request: PurchaseRequest,
    action: "approve" | "request_revision" | "reject"
  ) => void
  onReload?: () => void
}

export function PendingApprovalTab({
  requests,
  onOpenDetail,
  onOpenApprovalModal,
  onReload,
}: PendingApprovalTabProps) {
  const [keyword, setKeyword] = useState("")
  const [stepFilter, setStepFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  // Chỉ lấy các hồ sơ đang ở trạng thái chờ duyệt
  const pendingRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        r.status === "pending_dept" ||
        r.status === "pending_planning" ||
        r.status === "pending_leader"
    )
  }, [requests])

  // Thống kê phân loại theo bước
  const stats = useMemo(() => {
    const total = pendingRequests.length
    const dept = pendingRequests.filter((r) => r.status === "pending_dept").length
    const planning = pendingRequests.filter((r) => r.status === "pending_planning").length
    const leader = pendingRequests.filter((r) => r.status === "pending_leader").length
    return { total, dept, planning, leader }
  }, [pendingRequests])

  const handleQuickStep = (step: string) => {
    setStepFilter((prev) => (prev === step ? "all" : step))
  }

  const isFiltered = Boolean(
    keyword.trim() || stepFilter !== "all" || departmentFilter !== "all"
  )

  const handleResetFilters = () => {
    setKeyword("")
    setStepFilter("all")
    setDepartmentFilter("all")
  }

  const filteredRequests = useMemo(() => {
    return pendingRequests.filter((r) => {
      const matchKw =
        !keyword.trim() ||
        r.code.toLowerCase().includes(keyword.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(keyword.toLowerCase()) ||
        r.projectName.toLowerCase().includes(keyword.toLowerCase()) ||
        r.department.toLowerCase().includes(keyword.toLowerCase())

      const matchStep = stepFilter === "all" || r.status === stepFilter
      const matchDept =
        departmentFilter === "all" || r.department === departmentFilter

      return matchKw && matchStep && matchDept
    })
  }, [pendingRequests, keyword, stepFilter, departmentFilter])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExportExcel = () => {
    if (filteredRequests.length === 0) {
      toast.warning("Không có dữ liệu chờ duyệt để xuất Excel")
      return
    }

    const dataToExport = filteredRequests.map((r, idx) => ({
      STT: idx + 1,
      "Mã đề xuất": r.code,
      "Ngày đề nghị": r.requestDate,
      "Đơn vị đề xuất": r.department,
      "Người đề xuất": r.requesterName,
      "Nhiệm vụ / Đề án": r.projectName,
      "Hạng mục": r.projectItem || "",
      "Nguồn kinh phí": r.budgetSource,
      "Tổng kinh phí (VNĐ)": r.totalAmount,
      "Bước chờ duyệt": PURCHASE_REQUEST_STATUS_CONFIG[r.status]?.label || r.status,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ho_so_cho_duyet")
    XLSX.writeFile(workbook, `Ho_so_cho_duyet_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success("Đã xuất Excel danh sách hồ sơ chờ duyệt thành công!")
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
          title="Xem hồ sơ chi tiết"
        >
          {r.code}
        </button>
      ),
    },
    {
      key: "requestDate",
      header: "Ngày trình",
      headClassName: "w-28 font-semibold text-foreground",
      cellClassName: "text-muted-foreground text-xs",
      render: (r) => r.requestDate,
    },
    {
      key: "department",
      header: "Đơn vị trình",
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
      key: "totalAmount",
      header: "Tổng kinh phí",
      headClassName: "w-36 text-right font-bold text-foreground",
      cellClassName: "text-right font-mono font-bold text-foreground",
      render: (r) => formatVND(r.totalAmount),
    },
    {
      key: "status",
      header: "Bước phê duyệt",
      headClassName: "w-40 text-center font-semibold text-foreground",
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
      header: "Xử lý duyệt",
      headClassName: "w-48 text-center font-semibold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
      cellClassName: "text-center sticky right-0 z-10 bg-card",
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="sm"
            onClick={() => onOpenApprovalModal(r, "approve")}
            className="h-7 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-2xs"
            title="Phê duyệt chuyển bước tiếp theo"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Duyệt</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenApprovalModal(r, "request_revision")}
            className="h-7 text-xs px-2 gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
            title="Yêu cầu bổ sung thông tin"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Bổ sung</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenApprovalModal(r, "reject")}
            className="h-7 text-xs px-2 gap-1 border-rose-200 text-rose-600 hover:bg-rose-50"
            title="Từ chối phê duyệt"
          >
            <XCircle className="h-3 w-3" />
            <span>Từ chối</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenDetail(r)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
            title="Xem hồ sơ chi tiết"
          >
            <Eye className="h-3.5 w-3.5" />
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
          Danh sách các hồ sơ đề xuất đang chờ thẩm định, kiểm tra dự toán và phê duyệt theo thẩm quyền.
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
        </div>
      </div>

      {/* 2. 4 Thẻ ERP Metric Cards theo các bước duyệt */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => handleQuickStep("all")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-primary/50 shadow-2xs ${
            stepFilter === "all" ? "ring-2 ring-primary/30 border-primary" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Tổng cần duyệt</span>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickStep("pending_dept")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            stepFilter === "pending_dept" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Chờ Trưởng đơn vị</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{stats.dept}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickStep("pending_planning")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-blue-500/50 shadow-2xs ${
            stepFilter === "pending_planning" ? "ring-2 ring-blue-500/30 border-blue-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Chờ Kế hoạch/Dự toán</span>
            <div className="text-2xl font-bold text-blue-600 font-mono">{stats.planning}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleQuickStep("pending_leader")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-purple-500/50 shadow-2xs ${
            stepFilter === "pending_leader" ? "ring-2 ring-purple-500/30 border-purple-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Chờ Lãnh đạo duyệt</span>
            <div className="text-2xl font-bold text-purple-600 font-mono">{stats.leader}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
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
              placeholder="Tìm theo mã hồ sơ, người trình, đề án..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Lọc theo bước duyệt */}
          <div>
            <Select value={stepFilter} onValueChange={setStepFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả bước chờ duyệt" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả bước chờ duyệt</SelectItem>
                <SelectItem value="pending_dept">Chờ Trưởng đơn vị</SelectItem>
                <SelectItem value="pending_planning">Chờ Kế hoạch / Dự toán</SelectItem>
                <SelectItem value="pending_leader">Chờ Lãnh đạo Liên đoàn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lọc theo đơn vị trình */}
          <div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-9 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Tất cả đơn vị trình" />
                </div>
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả đơn vị trình</SelectItem>
                {PROCUREMENT_DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
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
              Đang hiển thị <strong className="text-foreground font-semibold">{filteredRequests.length}</strong> / tổng số <strong className="text-foreground font-semibold">{pendingRequests.length}</strong> hồ sơ cần duyệt
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
        lastStickyColumnWidth="14rem"
        minTableWidth="1380px"
        emptyMessage="Hiện không có hồ sơ nào đang chờ duyệt."
      />
    </div>
  )
}
