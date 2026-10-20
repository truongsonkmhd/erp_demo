import * as XLSX from "xlsx"
import type { PayrollPeriodRecord } from "../types/hrm-payroll.types"

export function exportPayrollPeriodToExcel(period: PayrollPeriodRecord) {
  const rows = period.items.map((item, index) => ({
    "STT": index + 1,
    "Mã cán bộ": item.employeeCode,
    "Họ và tên": item.fullName,
    "Phòng ban / Đơn vị": item.department,
    "Vị trí công tác": item.position,
    "Ngạch chức danh": item.payGrade,
    "Hệ số lương": item.salaryCoefficient,
    "Lương ngạch bậc (VNĐ)": item.baseSalary,
    "PC Chức vụ (VNĐ)": item.positionAllowance,
    "Số ngày thực địa": item.fieldworkDays,
    "PC Lưu động thực địa (VNĐ)": item.fieldworkAllowance,
    "PC Độc hại (VNĐ)": item.hazardAllowance,
    "PC Thâm niên (VNĐ)": item.seniorityAllowance,
    "Thưởng & Khoản khác (VNĐ)": item.bonus + item.otherAllowances + item.overtimePay,
    "Tổng thu nhập gộp (Gross)": item.grossIncome,
    "Trừ BHXH 8% (VNĐ)": item.bhxhDeduction,
    "Trừ BHYT 1.5% (VNĐ)": item.bhytDeduction,
    "Trừ BHTN 1% (VNĐ)": item.bhtnDeduction,
    "Đoàn phí 1% (VNĐ)": item.unionDeduction,
    "Trừ nghỉ không lương (VNĐ)": item.unpaidLeaveDeduction,
    "Thuế TNCN (VNĐ)": item.personalIncomeTax,
    "Tổng các khoản giảm trừ (VNĐ)": item.totalDeductions,
    "Thực lĩnh chuyển khoản (Net)": item.netSalary,
    "Số tài khoản": item.bankAccountNumber || "Chưa cập nhật",
    "Ngân hàng": item.bankName || "BIDV",
    "Ghi chú": item.notes || "",
  }))

  // Thêm dòng tổng cộng
  rows.push({
    "STT": "" as any,
    "Mã cán bộ": "TỔNG CỘNG" as any,
    "Họ và tên": `${period.totalEmployees} cán bộ`,
    "Phòng ban / Đơn vị": "",
    "Vị trí công tác": "",
    "Ngạch chức danh": "",
    "Hệ số lương": "" as any,
    "Lương ngạch bậc (VNĐ)": period.items.reduce((sum, i) => sum + i.baseSalary, 0),
    "PC Chức vụ (VNĐ)": period.items.reduce((sum, i) => sum + i.positionAllowance, 0),
    "Số ngày thực địa": period.items.reduce((sum, i) => sum + i.fieldworkDays, 0),
    "PC Lưu động thực địa (VNĐ)": period.items.reduce((sum, i) => sum + i.fieldworkAllowance, 0),
    "PC Độc hại (VNĐ)": period.items.reduce((sum, i) => sum + i.hazardAllowance, 0),
    "PC Thâm niên (VNĐ)": period.items.reduce((sum, i) => sum + i.seniorityAllowance, 0),
    "Thưởng & Khoản khác (VNĐ)": period.items.reduce((sum, i) => sum + i.bonus + i.otherAllowances + i.overtimePay, 0),
    "Tổng thu nhập gộp (Gross)": period.totalGross,
    "Trừ BHXH 8% (VNĐ)": period.items.reduce((sum, i) => sum + i.bhxhDeduction, 0),
    "Trừ BHYT 1.5% (VNĐ)": period.items.reduce((sum, i) => sum + i.bhytDeduction, 0),
    "Trừ BHTN 1% (VNĐ)": period.items.reduce((sum, i) => sum + i.bhtnDeduction, 0),
    "Đoàn phí 1% (VNĐ)": period.items.reduce((sum, i) => sum + i.unionDeduction, 0),
    "Trừ nghỉ không lương (VNĐ)": period.items.reduce((sum, i) => sum + i.unpaidLeaveDeduction, 0),
    "Thuế TNCN (VNĐ)": period.totalTax,
    "Tổng các khoản giảm trừ (VNĐ)": period.totalInsurance + period.totalTax,
    "Thực lĩnh chuyển khoản (Net)": period.totalNet,
    "Số tài khoản": "",
    "Ngân hàng": "",
    "Ghi chú": "",
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, `Luong_T${period.month}_${period.year}`)

  // Tự động căn chỉnh độ rộng cột
  const columnWidths = [
    { wch: 6 }, // STT
    { wch: 14 }, // Mã CB
    { wch: 22 }, // Họ tên
    { wch: 22 }, // Đơn vị
    { wch: 18 }, // Vị trí
    { wch: 26 }, // Ngạch
    { wch: 10 }, // HSL
    { wch: 16 }, // Lương ngạch bậc
    { wch: 14 }, // PC chức vụ
    { wch: 14 }, // Số ngày thực địa
    { wch: 18 }, // PC thực địa
    { wch: 14 }, // PC Độc hại
    { wch: 14 }, // PC Thâm niên
    { wch: 18 }, // Thưởng & khác
    { wch: 18 }, // Gross
    { wch: 14 }, // BHXH
    { wch: 14 }, // BHYT
    { wch: 14 }, // BHTN
    { wch: 12 }, // Đoàn phí
    { wch: 16 }, // Nghỉ không lương
    { wch: 14 }, // Thuế TNCN
    { wch: 18 }, // Tổng giảm trừ
    { wch: 20 }, // Net
    { wch: 18 }, // Số TK
    { wch: 14 }, // Ngân hàng
    { wch: 20 }, // Ghi chú
  ]
  worksheet["!cols"] = columnWidths

  const fileName = `Bang_luong_Lien_doan_VLDC_T${period.month}_${period.year}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
