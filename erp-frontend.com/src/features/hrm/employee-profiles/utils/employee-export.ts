import * as XLSX from "xlsx"
import type { EmployeeRecord, WorkStatus } from "../types/employee-profile.types.ts"

function formatWorkStatus(status: WorkStatus): string {
  switch (status) {
    case "active":
      return "Đang làm việc"
    case "probation":
      return "Thử việc"
    case "on_leave":
      return "Nghỉ phép"
    case "terminated":
      return "Đã nghỉ việc / Khóa"
    default:
      return status
  }
}

export function exportEmployeesToExcel(employees: EmployeeRecord[], filename?: string): void {
  const rows = employees.map((emp, index) => ({
    "STT": index + 1,
    "Mã cán bộ": emp.employeeCode || "—",
    "Họ và tên": emp.fullName,
    "Đơn vị / Phòng ban": emp.department || "Chưa cập nhật",
    "Vị trí việc làm": emp.position || "Chưa cập nhật",
    "Chuyên môn": emp.specialty || "—",
    "Trình độ": emp.qualification || "—",
    "Loại hợp đồng": emp.contractType || "—",
    "Số hợp đồng": emp.contractNumber || "—",
    "Ngày bắt đầu": emp.contractStartDate || "—",
    "Ngày kết thúc": emp.contractEndDate || "—",
    "Số điện thoại": emp.phone || "—",
    "Email": emp.email,
    "Trạng thái làm việc": formatWorkStatus(emp.workStatus),
    "Trạng thái tài khoản": emp.accountActive ? "Đang hoạt động" : "Đã khóa",
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Hồ sơ nhân sự")

  const dateStr = new Date().toISOString().slice(0, 10)
  const targetFilename = filename || `danh_sach_ho_so_nhan_su_${dateStr}.xlsx`
  XLSX.writeFile(workbook, targetFilename)
}
