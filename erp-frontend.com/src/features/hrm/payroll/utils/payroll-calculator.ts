import type { PayrollConfig, PayrollItemRecord } from "../types/hrm-payroll.types"

export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  baseSalaryRate: 2340000, // Nghị định 73/2024/NĐ-CP (áp dụng từ 01/07/2024)
  bhxhRate: 0.08,
  bhytRate: 0.015,
  bhtnRate: 0.01,
  unionRate: 0.01,
  personalDeduction: 11000000,
  dependentDeduction: 4400000,
  fieldworkDayRate: 180000, // 180.000 đ/ngày thực địa dã ngoại
  standardWorkDays: 22,
}

/**
 * Tính thuế TNCN lũy tiến từng phần theo Luật thuế TNCN Việt Nam
 */
export function calculatePersonalIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  if (taxableIncome <= 5000000) {
    tax = taxableIncome * 0.05
  } else if (taxableIncome <= 10000000) {
    tax = taxableIncome * 0.1 - 250000
  } else if (taxableIncome <= 18000000) {
    tax = taxableIncome * 0.15 - 750000
  } else if (taxableIncome <= 32000000) {
    tax = taxableIncome * 0.2 - 1650000
  } else if (taxableIncome <= 52000000) {
    tax = taxableIncome * 0.25 - 3250000
  } else if (taxableIncome <= 80000000) {
    tax = taxableIncome * 0.3 - 5850000
  } else {
    tax = taxableIncome * 0.35 - 9850000
  }

  return Math.max(0, Math.round(tax))
}

/**
 * Tính toán trọn vẹn 1 dòng lương của cán bộ
 */
export function calculatePayrollItem(
  input: Partial<PayrollItemRecord> & {
    salaryCoefficient: number
    positionAllowanceCoeff?: number
    fieldworkDays?: number
    hazardAllowance?: number
    seniorityAllowance?: number
    otherAllowances?: number
    bonus?: number
    overtimePay?: number
    unpaidLeaveDays?: number
    dependentsCount?: number
  },
  config: PayrollConfig = DEFAULT_PAYROLL_CONFIG
): Omit<PayrollItemRecord, "id" | "periodId" | "userId" | "employeeCode" | "fullName" | "department" | "position" | "payGrade"> {
  const salaryCoeff = input.salaryCoefficient || 2.34
  const posCoeff = input.positionAllowanceCoeff || 0
  const fieldworkDays = input.fieldworkDays || 0
  const hazardAllowance = input.hazardAllowance || 0
  const seniorityAllowance = input.seniorityAllowance || 0
  const otherAllowances = input.otherAllowances || 0
  const bonus = input.bonus || 0
  const overtimePay = input.overtimePay || 0
  const unpaidLeaveDays = input.unpaidLeaveDays || 0
  const dependentsCount = input.dependentsCount || 0

  // 1. Lương ngạch bậc và các phụ cấp
  const baseSalary = Math.round(salaryCoeff * config.baseSalaryRate)
  const positionAllowance = Math.round(posCoeff * config.baseSalaryRate)
  const fieldworkAllowance = Math.round(fieldworkDays * config.fieldworkDayRate)

  // 2. Trừ nghỉ không lương
  const dailyBaseSalary = baseSalary / config.standardWorkDays
  const unpaidLeaveDeduction = Math.round(dailyBaseSalary * unpaidLeaveDays)

  // 3. Tổng thu nhập gộp (Gross)
  const grossIncome =
    baseSalary +
    positionAllowance +
    seniorityAllowance +
    fieldworkAllowance +
    hazardAllowance +
    otherAllowances +
    bonus +
    overtimePay

  // 4. Mức lương đóng bảo hiểm (Trần tối đa 20 lần mức lương cơ sở)
  const maxInsuranceSalary = 20 * config.baseSalaryRate
  const rawInsuranceSalary = baseSalary + positionAllowance
  const insuranceSalary = Math.min(rawInsuranceSalary, maxInsuranceSalary)

  // 5. Các khoản trích nộp theo lương
  const bhxhDeduction = Math.round(insuranceSalary * config.bhxhRate)
  const bhytDeduction = Math.round(insuranceSalary * config.bhytRate)
  const bhtnDeduction = Math.round(insuranceSalary * config.bhtnRate)
  const unionDeduction = Math.round(insuranceSalary * config.unionRate)
  const totalInsuranceDeduction =
    bhxhDeduction + bhytDeduction + bhtnDeduction + unionDeduction

  // 6. Thuế TNCN
  // Thu nhập chịu thuế = Gross - Khoản giảm trừ bảo hiểm - Giảm trừ bản thân & người phụ thuộc
  const totalFamilyDeduction =
    config.personalDeduction + dependentsCount * config.dependentDeduction
  const taxableIncome = Math.max(
    0,
    grossIncome - totalInsuranceDeduction - unpaidLeaveDeduction - totalFamilyDeduction
  )
  const personalIncomeTax = calculatePersonalIncomeTax(taxableIncome)

  // 7. Tổng giảm trừ & Thực lĩnh
  const totalDeductions =
    totalInsuranceDeduction + personalIncomeTax + unpaidLeaveDeduction
  const netSalary = Math.max(0, grossIncome - totalDeductions)

  return {
    salaryCoefficient: salaryCoeff,
    baseSalary,
    positionAllowanceCoeff: posCoeff,
    positionAllowance,
    seniorityAllowance,
    fieldworkDays,
    fieldworkAllowance,
    hazardAllowance,
    otherAllowances,
    bonus,
    overtimePay,
    unpaidLeaveDays,
    unpaidLeaveDeduction,
    grossIncome,
    insuranceSalary,
    bhxhDeduction,
    bhytDeduction,
    bhtnDeduction,
    unionDeduction,
    totalInsuranceDeduction,
    dependentsCount,
    taxableIncome,
    personalIncomeTax,
    totalDeductions,
    netSalary,
    bankAccountNumber: input.bankAccountNumber,
    bankName: input.bankName,
    notes: input.notes,
  }
}

/**
 * Format số tiền VND chuẩn vi-VN (ví dụ: 15.420.000 ₫)
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 ₫"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format số tiền gọn theo triệu đồng (ví dụ: 15.4 tr)
 */
export function formatCompactVND(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} tỷ`
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} tr`
  }
  return formatVND(amount)
}

/**
 * Chuyển số tiền thành chữ tiếng Việt (phục vụ Phiếu lương Payslip)
 */
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return "Không đồng"
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
  const scales = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ"]

  function readTriple(n: number, isLast: boolean): string {
    const h = Math.floor(n / 100)
    const t = Math.floor((n % 100) / 10)
    const u = n % 10
    let res = ""

    if (h > 0 || !isLast) {
      res += `${units[h]} trăm `
    }
    if (t > 1) {
      res += `${units[t]} mươi `
      if (u === 1) res += "mốt "
      else if (u === 5) res += "lăm "
      else if (u > 0) res += `${units[u]} `
    } else if (t === 1) {
      res += "mười "
      if (u === 5) res += "lăm "
      else if (u > 0) res += `${units[u]} `
    } else if (t === 0 && u > 0) {
      if (h > 0 || !isLast) res += "lẻ "
      res += `${units[u]} `
    }
    return res.trim()
  }

  let str = ""
  let temp = Math.abs(Math.round(num))
  let scaleIndex = 0

  while (temp > 0) {
    const chunk = temp % 1000
    if (chunk > 0) {
      const chunkStr = readTriple(chunk, temp < 1000)
      const scaleStr = scales[scaleIndex] ? ` ${scales[scaleIndex]}` : ""
      str = `${chunkStr}${scaleStr} ${str}`.trim()
    }
    temp = Math.floor(temp / 1000)
    scaleIndex++
  }

  const result = str.trim()
  return (result.charAt(0).toUpperCase() + result.slice(1) + " đồng").replace(/\s+/g, " ")
}
