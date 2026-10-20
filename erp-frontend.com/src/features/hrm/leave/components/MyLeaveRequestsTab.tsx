import React, { useMemo, useState } from "react"
import { Calendar, Download, Eye, Plus, RotateCcw, Search, XCircle } from "lucide-react"

import { appToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import type { EmployeeAccount } from "@/services/EmployeeService"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"
import { CreateLeaveModal } from "./CreateLeaveModal"
import { LeaveDetailModal } from "./LeaveDetailModal"
import { LeaveStatusBadge } from "./LeaveStatusBadge"
import type { LeaveBalance, LeaveRequestRecord, LeaveStatus } from "../types/hrm-leave.types.ts"
import { exportLeaveRequestsToExcel, formatLeaveTypeName } from "../utils/leave-export"

interface MyLeaveRequestsTabProps {
  records: LeaveRequestRecord[]
  currentUserEmployee: EmployeeAccount | null
  employees: EmployeeAccount[]
  leaveBalance: LeaveBalance
  onSaveRequest: (record: LeaveRequestRecord) => void
  onCancelRequest: (id: string) => void
}

export function MyLeaveRequestsTab({
  records,
  currentUserEmployee,
  employees,
  leaveBalance,
  onSaveRequest,
  onCancelRequest,
}: MyLeaveRequestsTabProps) {
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<LeaveRequestRecord | null>(null)

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const match =
          item.id.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q) ||
          (item.handoverUserName && item.handoverUserName.toLowerCase().includes(q))
        if (!match) return false
      }
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      return true
    })
  }, [records, keyword, statusFilter])

  const handleCancel = (item: LeaveRequestRecord) => {
    const ok = window.confirm(`Bạn có chắc chắn muốn hủy đơn xin nghỉ phép mã ${item.id}?`)
    if (ok) {
      onCancelRequest(item.id)
      appToast.success("Đã hủy đơn xin nghỉ phép")
    }
  }

  const columns: DataTableColumn<LeaveRequestRecord>[] = [
    {
      key: "id",
      header: "Mã đơn",
      headClassName: "w-32 bg-muted/40",
      cellClassName: "bg-background",
      render: (item) => (
        <button
          type="button"
          onClick={() => {
            setSelectedRecord(item)
            setDetailModalOpen(true)
          }}
          className="font-mono text-xs font-semibold text-primary hover:underline"
        >
          {item.id}
        </button>
      ),
    },
    {
      key: "leaveType",
      header: "Loại nghỉ phép",
      headClassName: "min-w-[150px]",
      render: (item) => (
        <span className="font-semibold text-xs text-foreground">{formatLeaveTypeName(item.leaveType)}</span>
      ),
    },
    {
      key: "duration",
      header: "Thời gian nghỉ",
      headClassName: "min-w-[170px]",
      render: (item) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="text-foreground">
            {formatDateVN(item.startDate)} → {formatDateVN(item.endDate)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {item.startSession === "morning" ? "Từ sáng" : item.startSession === "afternoon" ? "Từ chiều" : "Cả ngày"}
          </span>
        </div>
      ),
    },
    {
      key: "totalDays",
      header: "Số ngày",
      headClassName: "w-24 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <span className="font-mono font-bold text-xs text-foreground">{item.totalDays} ngày</span>
      ),
    },
    {
      key: "reason",
      header: "Lý do xin nghỉ",
      headClassName: "min-w-[200px]",
      render: (item) => (
        <span className="text-xs text-foreground line-clamp-2" title={item.reason}>
          {item.reason}
        </span>
      ),
    },
    {
      key: "handover",
      header: "Bàn giao cho",
      headClassName: "min-w-[140px]",
      render: (item) => (
        <span className="text-xs text-muted-foreground">{item.handoverUserName || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center",
      cellClassName: "text-center",
      render: (item) => <LeaveStatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-24 text-right bg-muted/40",
      cellClassName: "text-right bg-background",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedRecord(item)
              setDetailModalOpen(true)
            }}
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Xem chi tiết & lịch sử workflow"
            aria-label="Xem chi tiết"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {item.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCancel(item)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Hủy đơn xin nghỉ phép"
              aria-label="Hủy đơn"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const isFiltered = Boolean(keyword || statusFilter !== "all")

  return (
    <div className="space-y-4">
      {/* Thẻ Quỹ ngày phép cá nhân */}
      <div className="p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Quỹ phép năm {leaveBalance.year} của bạn
          </span>
          <h3 className="text-base font-bold text-foreground">
            {currentUserEmployee?.fullName || "Cán bộ"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Chế độ tiêu chuẩn: 12 ngày phép năm + 2 ngày thâm niên công tác ngành địa chất.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center shrink-0">
          <div className="p-2.5 rounded-lg border border-border bg-card/80">
            <span className="text-[11px] text-muted-foreground block">Được cấp</span>
            <span className="text-base font-bold text-foreground font-mono">
              {leaveBalance.totalAnnualLeave}
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-border bg-card/80">
            <span className="text-[11px] text-muted-foreground block">Đã duyệt nghỉ</span>
            <span className="text-base font-bold text-foreground font-mono">
              {leaveBalance.usedDays}
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
            <span className="text-[11px] text-amber-600 block">Đang chờ duyệt</span>
            <span className="text-base font-bold text-amber-600 font-mono">
              {leaveBalance.pendingDays}
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-semibold">
              Còn lại
            </span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {leaveBalance.remainingDays}
            </span>
          </div>
        </div>
      </div>

      {/* Thanh lọc & Nút hành động */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã đơn, lý do, người nhận bàn giao..."
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Trạng thái đơn" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filteredRecords.length}</strong> / tổng số{" "}
            <strong className="text-foreground">{records.length}</strong> đơn xin nghỉ phép của bạn
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("")
                  setStatusFilter("all")
                }}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportLeaveRequestsToExcel(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="h-7 text-xs px-2.5 gap-1.5 font-medium"
            >
              <Download className="h-3 w-3" />
              <span>Xuất Excel</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="h-7 text-xs px-2.5 gap-1 font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo đơn nghỉ phép</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <PaginatedDataTable
        data={filteredRecords}
        columns={columns}
        rowKey={(row) => row.id}
        bordered
        minTableWidth="1100px"
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="5rem"
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Popup Modal Tạo đơn nghỉ phép */}
      <CreateLeaveModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        currentUserEmployee={currentUserEmployee}
        employees={employees}
        leaveBalance={leaveBalance}
        onSave={onSaveRequest}
      />

      {/* Popup Modal Xem chi tiết & Workflow */}
      <LeaveDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        request={selectedRecord}
      />
    </div>
  )
}
