import React, { useMemo, useState } from "react"
import { CheckCircle2, Download, Eye, FileCheck2, RotateCcw, Search } from "lucide-react"

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
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"
import { LeaveDetailModal } from "./LeaveDetailModal"
import { LeaveStatusBadge } from "./LeaveStatusBadge"
import { ReviewLeaveModal } from "./ReviewLeaveModal"
import type { LeaveRequestRecord, LeaveStatus, LeaveType } from "../types/hrm-leave.types.ts"
import { exportLeaveRequestsToExcel, formatLeaveTypeName } from "../utils/leave-export"

interface ApprovalLeaveTabProps {
  records: LeaveRequestRecord[]
  departments: Array<{ id: number | string; name: string }>
  onApprove: (id: string, comment?: string) => void
  onReject: (id: string, reason: string) => void
}

export function ApprovalLeaveTab({
  records,
  departments,
  onApprove,
  onReject,
}: ApprovalLeaveTabProps) {
  const [keyword, setKeyword] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<LeaveRequestRecord | null>(null)

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim()
        const match =
          item.fullName.toLowerCase().includes(q) ||
          item.employeeCode.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q)
        if (!match) return false
      }
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (deptFilter !== "all" && item.department !== deptFilter) return false
      if (typeFilter !== "all" && item.leaveType !== typeFilter) return false
      return true
    })
  }, [records, keyword, statusFilter, deptFilter, typeFilter])

  const pendingCount = useMemo(() => {
    return records.filter((r) => r.status === "pending").length
  }, [records])

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
      key: "fullName",
      header: "Cán bộ xin nghỉ",
      headClassName: "min-w-[170px]",
      render: (item) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground">{item.fullName}</span>
          <span className="text-[11px] font-mono text-muted-foreground">{item.employeeCode}</span>
        </div>
      ),
    },
    {
      key: "department",
      header: "Đơn vị / Phòng ban",
      headClassName: "min-w-[150px]",
      render: (item) => (
        <div className="flex flex-col text-xs">
          <span className="text-foreground">{item.department}</span>
          <span className="text-[11px] text-muted-foreground">{item.position}</span>
        </div>
      ),
    },
    {
      key: "leaveType",
      header: "Loại nghỉ phép",
      headClassName: "min-w-[140px]",
      render: (item) => (
        <span className="font-medium text-xs text-primary">{formatLeaveTypeName(item.leaveType)}</span>
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
            {item.totalDays} ngày ({item.startSession === "morning" ? "Buổi sáng" : "Cả ngày"})
          </span>
        </div>
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
      key: "status",
      header: "Trạng thái",
      headClassName: "w-36 text-center",
      cellClassName: "text-center",
      render: (item) => <LeaveStatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-32 text-right bg-muted/40",
      cellClassName: "text-right bg-background",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.status === "pending" ? (
            <Button
              size="sm"
              onClick={() => {
                setSelectedRecord(item)
                setReviewModalOpen(true)
              }}
              className="h-7 px-2.5 text-xs gap-1 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              title="Thẩm định và phê duyệt đơn"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Duyệt đơn</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRecord(item)
                setDetailModalOpen(true)
              }}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Xem lại</span>
            </Button>
          )}
        </div>
      ),
    },
  ]

  const isFiltered = Boolean(keyword || statusFilter !== "pending" || deptFilter !== "all" || typeFilter !== "all")

  return (
    <div className="space-y-4">
      {/* Thanh lọc & Nút hành động */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã đơn, cán bộ, lý do..."
              className="pl-9 h-8 text-xs"
            />
          </div>

          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">
                  Chờ duyệt ({pendingCount})
                </SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Đơn vị / Phòng ban" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả đơn vị</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Loại nghỉ phép" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="all">Tất cả loại phép</SelectItem>
                <SelectItem value="annual">Phép năm</SelectItem>
                <SelectItem value="sick">Nghỉ ốm đau (BHXH)</SelectItem>
                <SelectItem value="maternity">Thai sản</SelectItem>
                <SelectItem value="special_paid">Việc riêng có lương</SelectItem>
                <SelectItem value="unpaid">Không hưởng lương</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="text-muted-foreground">
            Hiển thị <strong className="text-foreground">{filteredRecords.length}</strong> / tổng số{" "}
            <strong className="text-foreground">{records.length}</strong> đơn gửi lên thẩm định
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {pendingCount} đơn cần duyệt gấp
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("")
                  setStatusFilter("all")
                  setDeptFilter("all")
                  setTypeFilter("all")
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
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <PaginatedDataTable
        data={filteredRecords}
        columns={columns}
        rowKey={(row) => row.id}
        bordered
        minTableWidth="1200px"
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="7rem"
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
      />

      {/* Popup Modal Thẩm định & Duyệt đơn */}
      <ReviewLeaveModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        request={selectedRecord}
        onApprove={onApprove}
        onReject={onReject}
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
