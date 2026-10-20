import * as XLSX from "xlsx"
import type { LeaveRequestRecord, LeaveType, LeaveStatus } from "../types/hrm-leave.types.ts"
import { formatDateVN } from "@/features/hrm/employee-profiles/utils/date-format"

export function formatLeaveTypeName(type: LeaveType): string {
  switch (type) {
    case "annual":
      return "Phép năm"
    case "sick":
      return "Nghỉ ốm đau (BHXH)"
    case "maternity":
      return "Thai sản / Chế độ cha"
    case "special_paid":
      return "Việc riêng hưởng lương"
    case "unpaid":
      return "Nghỉ không hưởng lương"
    default:
      return type
  }
}

export function formatLeaveStatusName(status: LeaveStatus): string {
  switch (status) {
    case "approved":
      return "Đã phê duyệt"
    case "pending":
      return "Chờ phê duyệt"
    case "rejected":
      return "Bị từ chối"
    case "cancelled":
      return "Đã hủy"
    case "draft":
      return "Bản nháp"
    default:
      return status
  }
}

export function exportLeaveRequestsToExcel(data: LeaveRequestRecord[]): void {
  const rows = data.map((item, idx) => ({
    STT: idx + 1,
    "Mã đơn": item.id,
    "Mã cán bộ": item.employeeCode,
    "Họ và tên": item.fullName,
    "Phòng ban / Đơn vị": item.department,
    "Vị trí việc làm": item.position,
    "Loại nghỉ phép": formatLeaveTypeName(item.leaveType),
    "Từ ngày": formatDateVN(item.startDate),
    "Đến ngày": formatDateVN(item.endDate),
    "Số ngày nghỉ": item.totalDays,
    "Lý do xin nghỉ": item.reason,
    "Cán bộ nhận bàn giao": item.handoverUserName || "—",
    "Số điện thoại liên hệ": item.contactPhone || "—",
    "Trạng thái đơn": formatLeaveStatusName(item.status),
    "Ngày tạo đơn": formatDateVN(item.createdAt),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Danh_Sach_Nghi_Phep")
  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `danh_sach_nghi_phep_${dateStr}.xlsx`)
}
