import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  Check,
  Copy,
  Edit,
  Eye,
  Lock,
  MoreHorizontal,
  Unlock,
  UserPlus,
} from "lucide-react"

import { appToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { EmployeeStatusBadge } from "./EmployeeStatusBadge"
import type { EmployeeRecord } from "../types/employee-profile.types.ts"
import { formatDateVN } from "../utils/date-format.ts"

interface EmployeeProfileTableProps {
  records: EmployeeRecord[]
  totalUnfilteredCount: number
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  onResetFilters?: () => void
  onEdit?: (record: EmployeeRecord) => void
  onCreate?: () => void
  onToggleStatus?: (record: EmployeeRecord) => void
  canCreate?: boolean
  canUpdate?: boolean
}

export function EmployeeProfileTable({
  records,
  totalUnfilteredCount,
  loading = false,
  error,
  onRetry,
  onResetFilters,
  onEdit,
  onCreate,
  onToggleStatus,
  canCreate = false,
  canUpdate = false,
}: EmployeeProfileTableProps) {
  const navigate = useNavigate()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = async (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      appToast.success(`Đã sao chép mã cán bộ ${code}`)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      appToast.error("Không thể sao chép mã cán bộ")
    }
  }

  // 1. Trạng thái Lỗi có nút Thử lại
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Không thể tải danh sách hồ sơ cán bộ</h3>
        <p className="text-xs text-muted-foreground max-w-md mb-4">
          {error.message || "Đã xảy ra lỗi kết nối với máy chủ dữ liệu. Vui lòng kiểm tra lại đường truyền mạng."}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="h-8 text-xs">
            Thử lại
          </Button>
        )}
      </div>
    )
  }

  // 2. Trạng thái Chưa có bản ghi nào trong hệ thống
  if (!loading && totalUnfilteredCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-card text-center shadow-xs">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Chưa có hồ sơ cán bộ nào</h3>
        <p className="text-xs text-muted-foreground max-w-md mb-4">
          Hệ thống hiện tại chưa ghi nhận dữ liệu nhân sự. Bạn hãy thêm mới hồ sơ cán bộ đầu tiên vào hệ thống ERP.
        </p>
        {canCreate && onCreate && (
          <Button size="sm" onClick={onCreate} className="h-8 text-xs gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            <span>Thêm mới hồ sơ</span>
          </Button>
        )}
      </div>
    )
  }

  // 3. Trạng thái lọc không có kết quả phù hợp
  if (!loading && records.length === 0 && totalUnfilteredCount > 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-border bg-card text-center shadow-xs">
        <h3 className="text-base font-semibold text-foreground mb-1">Không tìm thấy cán bộ phù hợp</h3>
        <p className="text-xs text-muted-foreground max-w-md mb-4">
          Không có nhân sự nào khớp với điều kiện tìm kiếm và các tiêu chí lọc đang được chọn.
        </p>
        {onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="h-8 text-xs">
            Đặt lại bộ lọc
          </Button>
        )}
      </div>
    )
  }

  const columns: DataTableColumn<EmployeeRecord>[] = [
    {
      key: "employeeCode",
      header: "Mã cán bộ",
      headClassName: "w-32 bg-muted/40",
      cellClassName: "bg-background",
      render: (item) => (
        <div className="flex items-center gap-1.5 group">
          <button
            type="button"
            onClick={() => navigate(`/nhan-su-tien-luong/ho-so-nhan-su/${item.userId}`)}
            className="font-mono font-semibold text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
            title="Xem chi tiết hồ sơ cán bộ"
          >
            {item.employeeCode}
          </button>
          <button
            type="button"
            onClick={(e) => handleCopyCode(e, item.employeeCode)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Sao chép mã cán bộ"
            aria-label="Sao chép mã cán bộ"
          >
            {copiedCode === item.employeeCode ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      ),
    },
    {
      key: "fullName",
      header: "Họ và tên cán bộ",
      headClassName: "min-w-[170px]",
      render: (item) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => navigate(`/nhan-su-tien-luong/ho-so-nhan-su/${item.userId}`)}
            className="font-medium text-xs text-foreground hover:underline hover:text-primary transition-colors text-left"
          >
            {item.fullName}
          </button>
          <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{item.email}</span>
        </div>
      ),
    },
    {
      key: "department",
      header: "Đơn vị / Phòng ban",
      headClassName: "min-w-[160px]",
      render: (item) => (
        <span className={item.department ? "text-xs text-foreground font-normal" : "text-xs text-muted-foreground italic"}>
          {item.department || "Chưa cập nhật"}
        </span>
      ),
    },
    {
      key: "position",
      header: "Vị trí việc làm",
      headClassName: "min-w-[140px]",
      render: (item) => (
        <span className={item.position ? "text-xs text-foreground font-normal" : "text-xs text-muted-foreground italic"}>
          {item.position || "Chưa cập nhật"}
        </span>
      ),
    },
    {
      key: "specialty",
      header: "Chuyên môn đào tạo",
      headClassName: "min-w-[130px]",
      render: (item) => (
        <span className={item.specialty ? "text-xs text-foreground" : "text-xs text-muted-foreground"}>
          {item.specialty || "—"}
        </span>
      ),
    },
    {
      key: "contractType",
      header: "Loại hợp đồng",
      headClassName: "min-w-[130px]",
      render: (item) => (
        <span className={item.contractType ? "text-xs text-foreground font-normal" : "text-xs text-muted-foreground"}>
          {item.contractType || "—"}
        </span>
      ),
    },
    {
      key: "contractEndDate",
      header: "Hạn hợp đồng",
      headClassName: "min-w-[110px]",
      render: (item) => (
        <span className="text-xs text-foreground font-mono">
          {formatDateVN(item.contractEndDate, "Vô thời hạn")}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Số điện thoại",
      headClassName: "min-w-[110px]",
      render: (item) => (
        <span className="font-mono text-xs text-foreground">
          {item.phone || "—"}
        </span>
      ),
    },
    {
      key: "workStatus",
      header: "Trạng thái công tác",
      headClassName: "w-36 text-center",
      cellClassName: "text-center",
      render: (item) => <EmployeeStatusBadge status={item.workStatus} />,
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-20 text-right bg-muted/40",
      cellClassName: "text-right bg-background",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(item)}
              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Chỉnh sửa hồ sơ (Mở popup)"
              aria-label={`Chỉnh sửa hồ sơ ${item.fullName}`}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                aria-label="Tùy chọn thao tác"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem
                onClick={() => navigate(`/nhan-su-tien-luong/ho-so-nhan-su/${item.userId}`)}
                className="gap-2 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Xem chi tiết hồ sơ</span>
              </DropdownMenuItem>

              {canUpdate && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(item)} className="gap-2 cursor-pointer">
                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Chỉnh sửa (Popup)</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onToggleStatus?.(item)}
                    className={
                      item.accountActive
                        ? "gap-2 cursor-pointer text-destructive focus:text-destructive"
                        : "gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                    }
                  >
                    {item.accountActive ? (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Khóa tài khoản</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Mở khóa tài khoản</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <PaginatedDataTable
      data={records}
      columns={columns}
      rowKey={(row) => row.userId}
      loading={loading}
      defaultPageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
      bordered
      minTableWidth="1300px"
      stickyFirstColumn
      stickyLastColumn
      lastStickyColumnWidth="5rem"
    />
  )
}
