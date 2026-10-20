export type PayrollPeriodStatus = "draft" | "pending_review" | "approved" | "paid"

export interface PayrollConfig {
  baseSalaryRate: number // Mức lương cơ sở nhà nước: 2.340.000đ (NĐ 73/2024)
  bhxhRate: number // Tỷ lệ BHXH NLĐ đóng: 8%
  bhytRate: number // Tỷ lệ BHYT NLĐ đóng: 1.5%
  bhtnRate: number // Tỷ lệ BHTN NLĐ đóng: 1%
  unionRate: number // Tỷ lệ Công đoàn NLĐ đóng: 1%
  personalDeduction: number // Giảm trừ gia cảnh bản thân: 11.000.000đ
  dependentDeduction: number // Giảm trừ mỗi người phụ thuộc: 4.400.000đ
  fieldworkDayRate: number // Mức phụ cấp lưu động/thực địa mỗi ngày công (mặc định 180.000đ/ngày)
  standardWorkDays: number // Ngày công chuẩn trong tháng: 22 ngày
}

export interface PayrollItemRecord {
  id: string
  periodId: string
  userId: string
  employeeCode: string
  fullName: string
  department: string
  position: string
  payGrade: string // Ngạch bậc viên chức, ví dụ: "Kỹ sư địa chất chính (V.05.02.06)"
  salaryCoefficient: number // Hệ số lương (HSL), ví dụ: 4.74

  // Lương ngạch bậc
  baseSalary: number // = HSL * baseSalaryRate

  // Phụ cấp chức vụ & thâm niên
  positionAllowanceCoeff: number // Hệ số PC chức vụ (0.2 - 0.7)
  positionAllowance: number // = positionAllowanceCoeff * baseSalaryRate
  seniorityAllowance: number // Phụ cấp thâm niên nghề địa chất

  // Phụ cấp đặc thù ngành địa chất
  fieldworkDays: number // Số ngày công khảo sát thực địa trong tháng
  fieldworkAllowance: number // Phụ cấp lưu động/thực địa dã ngoại
  hazardAllowance: number // Phụ cấp độc hại phóng xạ/từ trường/địa chấn

  // Các khoản bổ sung khác
  otherAllowances: number
  bonus: number // Thưởng thi đua, dự án
  overtimePay: number // Tiền làm thêm giờ

  // Nghỉ phép không lương
  unpaidLeaveDays: number
  unpaidLeaveDeduction: number // Trừ nghỉ không lương

  // Tổng thu nhập (Gross)
  grossIncome: number

  // Trích nộp bảo hiểm bắt buộc
  insuranceSalary: number // Tiền lương làm căn cứ đóng BHXH
  bhxhDeduction: number // 8%
  bhytDeduction: number // 1.5%
  bhtnDeduction: number // 1%
  unionDeduction: number // 1%
  totalInsuranceDeduction: number // Tổng các khoản bảo hiểm & đoàn phí

  // Thuế TNCN
  dependentsCount: number // Số người phụ thuộc
  taxableIncome: number // Thu nhập tính thuế
  personalIncomeTax: number // Thuế TNCN tạm tính

  // Tổng giảm trừ
  totalDeductions: number // = Bảo hiểm + Thuế + Giảm trừ khác

  // Thực lĩnh (Net Pay)
  netSalary: number // = grossIncome - totalDeductions

  // Tài khoản ngân hàng
  bankAccountNumber?: string
  bankName?: string
  notes?: string
}

export interface PayrollPeriodRecord {
  id: string // ví dụ: PAY-2026-10
  month: number // 10
  year: number // 2026
  title: string // "Bảng lương cán bộ Tháng 10/2026"
  status: PayrollPeriodStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
  totalEmployees: number
  totalGross: number
  totalInsurance: number
  totalTax: number
  totalNet: number
  items: PayrollItemRecord[]
  reviewNotes?: string
}

export interface PayrollFilterState {
  keyword: string
  department: string
  status: string
}
