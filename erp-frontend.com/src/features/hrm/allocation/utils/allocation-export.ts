import * as XLSX from "xlsx"
import type {
  EmployeeAssignmentRecord,
  TaskTimesheetRecord,
} from "../types/hrm-allocation.types"
import { ALLOCATION_STATUS_LABELS } from "./allocation-calculator"

/**
 * Xuất danh sách hiện trạng phân bổ nhân sự ra Excel
 */
export function exportAllocationToExcel(assignments: EmployeeAssignmentRecord[]) {
  const rows = assignments.map((a, idx) => ({
    "STT": idx + 1,
    "Mã cán bộ": a.employeeCode,
    "Họ và tên": a.fullName,
    "Đơn vị": a.department,
    "Vị trí công tác": a.position,
    "Trạng thái công tác": ALLOCATION_STATUS_LABELS[a.currentStatus] || a.currentStatus,
    "Đề án / Nhiệm vụ": a.projectName || "Chưa phân bổ",
    "Địa bàn công tác": a.location || "Trụ sở Liên đoàn",
    "Vai trò đề án": a.assignedRole || "—",
    "Tỷ lệ phân bổ (%)": `${a.allocationPercentage}%`,
    "Từ ngày": a.startDate || "—",
    "Đến ngày": a.endDate || "—",
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Hien_trang_phan_bo")

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 22 },
    { wch: 35 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
  ]

  XLSX.writeFile(workbook, "Hien_trang_phan_bo_nhan_luc_LDVLDC.xlsx")
}

/**
 * Xuất Bảng tổng hợp ngày công và chi phí nhân công đề án ra Excel
 */
export function exportTimesheetToExcel(timesheets: TaskTimesheetRecord[], month: number, year: number) {
  const rows = timesheets.map((t, idx) => ({
    "STT": idx + 1,
    "Mã cán bộ": t.employeeCode,
    "Họ và tên": t.fullName,
    "Đơn vị": t.department,
    "Đề án / Nhiệm vụ": t.projectName,
    "Ngày công thực địa": t.fieldworkDays,
    "Ngày công văn phòng": t.officeDays,
    "Tổng ngày công": t.totalDays,
    "Đơn giá ngày công (VNĐ)": t.dailyRate,
    "Phụ cấp lưu động/ngày (VNĐ)": t.fieldworkAllowanceRate,
    "Tổng chi phí nhân công (VNĐ)": t.totalLaborCost,
    "Trạng thái":
      t.approvalStatus === "approved"
        ? "Đã duyệt"
        : t.approvalStatus === "submitted"
        ? "Chờ duyệt"
        : "Dự thảo",
    "Ghi chú": t.notes || "",
  }))

  // Thêm dòng tổng cộng
  const totalFieldwork = timesheets.reduce((s, t) => s + t.fieldworkDays, 0)
  const totalOffice = timesheets.reduce((s, t) => s + t.officeDays, 0)
  const totalDays = timesheets.reduce((s, t) => s + t.totalDays, 0)
  const totalCost = timesheets.reduce((s, t) => s + t.totalLaborCost, 0)

  rows.push({
    "STT": "" as any,
    "Mã cán bộ": "TỔNG CỘNG" as any,
    "Họ và tên": `${timesheets.length} cán bộ`,
    "Đơn vị": "",
    "Đề án / Nhiệm vụ": "",
    "Ngày công thực địa": totalFieldwork,
    "Ngày công văn phòng": totalOffice,
    "Tổng ngày công": totalDays,
    "Đơn giá ngày công (VNĐ)": "" as any,
    "Phụ cấp lưu động/ngày (VNĐ)": "" as any,
    "Tổng chi phí nhân công (VNĐ)": totalCost,
    "Trạng thái": "",
    "Ghi chú": "",
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, `Chi_phi_nhan_cong_T${month}_${year}`)

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 35 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 24 },
    { wch: 14 },
    { wch: 20 },
  ]

  const fileName = `Bang_cham_cong_chi_phi_nhan_cong_T${month}_${year}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
