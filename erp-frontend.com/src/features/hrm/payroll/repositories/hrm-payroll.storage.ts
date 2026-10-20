import { defaultEmployeeProfileRepository } from "../../employee-profiles/repositories/employee-profile.storage"
import type {
  PayrollConfig,
  PayrollItemRecord,
  PayrollPeriodRecord,
  PayrollPeriodStatus,
} from "../types/hrm-payroll.types"
import {
  calculatePayrollItem,
  DEFAULT_PAYROLL_CONFIG,
} from "../utils/payroll-calculator"

const STORAGE_KEY_PERIODS = "hrm_payroll_periods_v1"
const STORAGE_KEY_CONFIG = "hrm_payroll_config_v1"

// Danh sách cán bộ khởi tạo mẫu với ngạch bậc và phụ cấp ngành địa chất
const INITIAL_PAYROLL_ITEMS_SEP_2026: PayrollItemRecord[] = [
  {
    id: "item-sep-001",
    periodId: "PAY-2026-09",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    department: "Đoàn Địa vật lý 1",
    position: "Đoàn trưởng / Kỹ sư chính",
    payGrade: "Kỹ sư địa chất chính (V.05.02.06)",
    salaryCoefficient: 5.08,
    baseSalary: 11887200,
    positionAllowanceCoeff: 0.5,
    positionAllowance: 1170000,
    seniorityAllowance: 1188720,
    fieldworkDays: 14,
    fieldworkAllowance: 2520000,
    hazardAllowance: 702000,
    otherAllowances: 500000,
    bonus: 1500000,
    overtimePay: 850000,
    unpaidLeaveDays: 0,
    unpaidLeaveDeduction: 0,
    grossIncome: 20317920,
    insuranceSalary: 13057200,
    bhxhDeduction: 1044576,
    bhytDeduction: 195858,
    bhtnDeduction: 130572,
    unionDeduction: 130572,
    totalInsuranceDeduction: 1501578,
    dependentsCount: 2,
    taxableIncome: 0,
    personalIncomeTax: 0,
    totalDeductions: 1501578,
    netSalary: 18816342,
    bankAccountNumber: "12410000892716",
    bankName: "BIDV - Chi nhánh Cầu Giấy",
    notes: "Chỉ đạo đề án đo từ - trọng lực vùng Tây Bắc",
  },
  {
    id: "item-sep-002",
    periodId: "PAY-2026-09",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    department: "Đoàn Địa vật lý 1",
    position: "Kỹ sư địa vật lý thực địa",
    payGrade: "Kỹ sư địa chất (V.05.02.07)",
    salaryCoefficient: 3.33,
    baseSalary: 7792200,
    positionAllowanceCoeff: 0,
    positionAllowance: 0,
    seniorityAllowance: 389610,
    fieldworkDays: 18,
    fieldworkAllowance: 3240000,
    hazardAllowance: 702000,
    otherAllowances: 300000,
    bonus: 1000000,
    overtimePay: 1200000,
    unpaidLeaveDays: 0,
    unpaidLeaveDeduction: 0,
    grossIncome: 14623810,
    insuranceSalary: 7792200,
    bhxhDeduction: 623376,
    bhytDeduction: 116883,
    bhtnDeduction: 77922,
    unionDeduction: 77922,
    totalInsuranceDeduction: 896103,
    dependentsCount: 1,
    taxableIncome: 0,
    personalIncomeTax: 0,
    totalDeductions: 896103,
    netSalary: 13727707,
    bankAccountNumber: "03410006789123",
    bankName: "Vietcombank - CN Thăng Long",
    notes: "Trực tiếp khảo sát dã ngoại tuyến đo địa chấn",
  },
  {
    id: "item-sep-003",
    periodId: "PAY-2026-09",
    userId: "user-3",
    employeeCode: "CB-0003",
    fullName: "Trần Thị Mai",
    department: "Phòng Tài chính - Kế toán",
    position: "Phó Trưởng phòng",
    payGrade: "Kế toán viên chính (06.030)",
    salaryCoefficient: 4.4,
    baseSalary: 10296000,
    positionAllowanceCoeff: 0.3,
    positionAllowance: 702000,
    seniorityAllowance: 823680,
    fieldworkDays: 0,
    fieldworkAllowance: 0,
    hazardAllowance: 0,
    otherAllowances: 400000,
    bonus: 1200000,
    overtimePay: 500000,
    unpaidLeaveDays: 0,
    unpaidLeaveDeduction: 0,
    grossIncome: 13921680,
    insuranceSalary: 10998000,
    bhxhDeduction: 879840,
    bhytDeduction: 164970,
    bhtnDeduction: 109980,
    unionDeduction: 109980,
    totalInsuranceDeduction: 1264770,
    dependentsCount: 1,
    taxableIncome: 0,
    personalIncomeTax: 0,
    totalDeductions: 1264770,
    netSalary: 12656910,
    bankAccountNumber: "21510001238944",
    bankName: "BIDV - Chi nhánh Hà Nội",
    notes: "Quyết toán kinh phí nhiệm vụ quý 3",
  },
  {
    id: "item-sep-004",
    periodId: "PAY-2026-09",
    userId: "user-4",
    employeeCode: "CB-0004",
    fullName: "Lê Hoàng Long",
    department: "Phòng Kỹ thuật & Công nghệ",
    position: "Trưởng phòng",
    payGrade: "Kỹ sư địa chất cao cấp (V.05.02.05)",
    salaryCoefficient: 6.2,
    baseSalary: 14508000,
    positionAllowanceCoeff: 0.6,
    positionAllowance: 1404000,
    seniorityAllowance: 2176200,
    fieldworkDays: 6,
    fieldworkAllowance: 1080000,
    hazardAllowance: 468000,
    otherAllowances: 600000,
    bonus: 2000000,
    overtimePay: 0,
    unpaidLeaveDays: 0,
    unpaidLeaveDeduction: 0,
    grossIncome: 22236200,
    insuranceSalary: 15912000,
    bhxhDeduction: 1272960,
    bhytDeduction: 238680,
    bhtnDeduction: 159120,
    unionDeduction: 159120,
    totalInsuranceDeduction: 1829880,
    dependentsCount: 1,
    taxableIncome: 5006320,
    personalIncomeTax: 250316,
    totalDeductions: 2080196,
    netSalary: 20156004,
    bankAccountNumber: "19033456789012",
    bankName: "Techcombank - Hội sở",
    notes: "Nghiệm thu báo cáo phương pháp từ phổ phóng xạ",
  },
  {
    id: "item-sep-005",
    periodId: "PAY-2026-09",
    userId: "user-5",
    employeeCode: "CB-0005",
    fullName: "Phạm Hồng Quân",
    department: "Đoàn Địa vật lý 2",
    position: "Kỹ sư trắc địa địa vật lý",
    payGrade: "Kỹ sư địa chất (V.05.02.07)",
    salaryCoefficient: 3.0,
    baseSalary: 7020000,
    positionAllowanceCoeff: 0,
    positionAllowance: 0,
    seniorityAllowance: 210600,
    fieldworkDays: 16,
    fieldworkAllowance: 2880000,
    hazardAllowance: 702000,
    otherAllowances: 250000,
    bonus: 800000,
    overtimePay: 600000,
    unpaidLeaveDays: 0,
    unpaidLeaveDeduction: 0,
    grossIncome: 12462600,
    insuranceSalary: 7020000,
    bhxhDeduction: 561600,
    bhytDeduction: 105300,
    bhtnDeduction: 70200,
    unionDeduction: 70200,
    totalInsuranceDeduction: 807300,
    dependentsCount: 0,
    taxableIncome: 655300,
    personalIncomeTax: 32765,
    totalDeductions: 840065,
    netSalary: 11622535,
    bankAccountNumber: "101889923456",
    bankName: "VietinBank - Chi nhánh Ba Đình",
    notes: "Đo lưới trọng lực chi tiết mỏ bauxit",
  },
]

const INITIAL_PAYROLL_PERIODS: PayrollPeriodRecord[] = [
  {
    id: "PAY-2026-10",
    month: 10,
    year: 2026,
    title: "Bảng lương cán bộ Tháng 10/2026",
    status: "draft",
    createdBy: "Trần Thị Mai (Kế toán)",
    createdAt: "2026-10-02T08:00:00Z",
    updatedAt: "2026-10-09T09:30:00Z",
    totalEmployees: 5,
    totalGross: 83562210,
    totalInsurance: 6299631,
    totalTax: 283081,
    totalNet: 76979498,
    items: INITIAL_PAYROLL_ITEMS_SEP_2026.map((item, idx) => ({
      ...item,
      id: `item-oct-00${idx + 1}`,
      periodId: "PAY-2026-10",
    })),
    reviewNotes: "Đang rà soát số ngày công dã ngoại thực địa quý 4 của các kỹ sư Đoàn 1 & Đoàn 2.",
  },
  {
    id: "PAY-2026-09",
    month: 9,
    year: 2026,
    title: "Bảng lương cán bộ Tháng 09/2026",
    status: "paid",
    createdBy: "Trần Thị Mai (Kế toán)",
    createdAt: "2026-09-02T08:00:00Z",
    updatedAt: "2026-09-25T16:00:00Z",
    approvedBy: "Lê Hoàng Long (Lãnh đạo phê duyệt)",
    approvedAt: "2026-09-22T10:15:00Z",
    totalEmployees: 5,
    totalGross: 83562210,
    totalInsurance: 6299631,
    totalTax: 283081,
    totalNet: 76979498,
    items: INITIAL_PAYROLL_ITEMS_SEP_2026,
    reviewNotes: "Đã chi trả qua tài khoản ngân hàng Kho bạc & BIDV thành công.",
  },
  {
    id: "PAY-2026-08",
    month: 8,
    year: 2026,
    title: "Bảng lương cán bộ Tháng 08/2026",
    status: "paid",
    createdBy: "Trần Thị Mai (Kế toán)",
    createdAt: "2026-08-02T08:00:00Z",
    updatedAt: "2026-08-25T15:30:00Z",
    approvedBy: "Lê Hoàng Long (Lãnh đạo phê duyệt)",
    approvedAt: "2026-08-23T09:00:00Z",
    totalEmployees: 5,
    totalGross: 81240000,
    totalInsurance: 6150000,
    totalTax: 250000,
    totalNet: 74840000,
    items: INITIAL_PAYROLL_ITEMS_SEP_2026.map((item, idx) => ({
      ...item,
      id: `item-aug-00${idx + 1}`,
      periodId: "PAY-2026-08",
      bonus: 500000,
    })),
    reviewNotes: "Lưu trữ kỳ lương tháng 8.",
  },
]

export class HrmPayrollRepository {
  private getStorage(): Storage | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage
      }
    } catch {
      // Bỏ qua nếu môi trường không có localStorage
    }
    return null
  }

  // --- CẤU HÌNH TIỀN LƯƠNG ---
  getConfig(): PayrollConfig {
    const storage = this.getStorage()
    if (!storage) return DEFAULT_PAYROLL_CONFIG
    try {
      const raw = storage.getItem(STORAGE_KEY_CONFIG)
      if (raw) return JSON.parse(raw) as PayrollConfig
    } catch {
      // Fallback
    }
    return DEFAULT_PAYROLL_CONFIG
  }

  saveConfig(config: PayrollConfig): void {
    const storage = this.getStorage()
    if (!storage) return
    try {
      storage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
    } catch {
      // Ignored
    }
  }

  // --- QUẢN LÝ KỲ LƯƠNG ---
  getAllPeriods(): PayrollPeriodRecord[] {
    const storage = this.getStorage()
    if (!storage) return INITIAL_PAYROLL_PERIODS
    try {
      const raw = storage.getItem(STORAGE_KEY_PERIODS)
      if (!raw) {
        this.saveAllPeriods(INITIAL_PAYROLL_PERIODS)
        return INITIAL_PAYROLL_PERIODS
      }
      return JSON.parse(raw) as PayrollPeriodRecord[]
    } catch {
      return INITIAL_PAYROLL_PERIODS
    }
  }

  getPeriodById(id: string): PayrollPeriodRecord | null {
    const periods = this.getAllPeriods()
    return periods.find((p) => p.id === id) || null
  }

  private saveAllPeriods(periods: PayrollPeriodRecord[]): void {
    const storage = this.getStorage()
    if (!storage) return
    try {
      storage.setItem(STORAGE_KEY_PERIODS, JSON.stringify(periods))
    } catch {
      // Ignored
    }
  }

  /**
   * Tạo một kỳ tính lương mới từ danh sách hồ sơ cán bộ hiện hành
   */
  createPeriod(month: number, year: number, title?: string): PayrollPeriodRecord {
    const periods = this.getAllPeriods()
    const config = this.getConfig()
    const periodId = `PAY-${year}-${month.toString().padStart(2, "0")}`

    // Kiểm tra trùng kỳ lương
    const existing = periods.find((p) => p.id === periodId)
    if (existing) {
      return existing
    }

    // Lấy danh sách hồ sơ cán bộ từ module HRM-01
    const profiles = defaultEmployeeProfileRepository.getAll()
    const activeProfiles = profiles.filter(
      (p) => p.workStatus === "active" || p.workStatus === "probation"
    )

    // Khởi tạo các dòng lương
    const items: PayrollItemRecord[] = (activeProfiles.length > 0 ? activeProfiles : INITIAL_PAYROLL_ITEMS_SEP_2026).map(
      (p, idx) => {
        const salaryCoeff = 3.0 + (idx % 4) * 0.7 // Hệ số mẫu 3.0, 3.7, 4.4, 5.1
        const posCoeff = idx === 0 ? 0.5 : idx === 3 ? 0.6 : 0
        const fieldworkDays = idx % 2 === 0 ? 12 : 5
        const hazardAllowance = idx % 2 === 0 ? 702000 : 0
        const seniorityAllowance = Math.round(salaryCoeff * config.baseSalaryRate * 0.05)

        const calc = calculatePayrollItem(
          {
            salaryCoefficient: salaryCoeff,
            positionAllowanceCoeff: posCoeff,
            fieldworkDays,
            hazardAllowance,
            seniorityAllowance,
            bonus: 500000,
            dependentsCount: idx % 2,
            bankAccountNumber: `1010${idx + 1}00089271`,
            bankName: "BIDV",
          },
          config
        )

        const fullName = (p as any).fullName || `Cán bộ ${p.employeeCode}`

        return {
          id: `item-${year}${month}-${idx + 1}`,
          periodId,
          userId: p.userId,
          employeeCode: p.employeeCode,
          fullName,
          department: p.department || "Đoàn Địa vật lý",
          position: p.position || "Kỹ sư",
          payGrade: (p as any).payGrade || "Kỹ sư địa chất (V.05.02.07)",
          ...calc,
        }
      }
    )

    const totalGross = items.reduce((sum, i) => sum + i.grossIncome, 0)
    const totalInsurance = items.reduce((sum, i) => sum + i.totalInsuranceDeduction, 0)
    const totalTax = items.reduce((sum, i) => sum + i.personalIncomeTax, 0)
    const totalNet = items.reduce((sum, i) => sum + i.netSalary, 0)

    const newPeriod: PayrollPeriodRecord = {
      id: periodId,
      month,
      year,
      title: title || `Bảng lương cán bộ Tháng ${month.toString().padStart(2, "0")}/${year}`,
      status: "draft",
      createdBy: "Bộ phận Nhân sự & Kế toán",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalEmployees: items.length,
      totalGross,
      totalInsurance,
      totalTax,
      totalNet,
      items,
      reviewNotes: "Kỳ lương mới khởi tạo, đang hoàn thiện số liệu.",
    }

    const updated = [newPeriod, ...periods]
    this.saveAllPeriods(updated)
    return newPeriod
  }

  /**
   * Cập nhật điều chỉnh một dòng lương của cán bộ
   */
  updatePayrollItem(
    periodId: string,
    itemId: string,
    updates: Partial<PayrollItemRecord>
  ): PayrollPeriodRecord | null {
    const periods = this.getAllPeriods()
    const periodIdx = periods.findIndex((p) => p.id === periodId)
    if (periodIdx === -1) return null

    const period = periods[periodIdx]
    const itemIdx = period.items.findIndex((i) => i.id === itemId)
    if (itemIdx === -1) return null

    const currentItem = period.items[itemIdx]
    const config = this.getConfig()

    // Tính toán lại toàn bộ dòng lương theo dữ liệu mới
    const merged = { ...currentItem, ...updates }
    const recalculated = calculatePayrollItem(merged, config)

    period.items[itemIdx] = {
      ...merged,
      ...recalculated,
    }

    // Tính toán lại tổng số tiền của kỳ lương
    period.totalGross = period.items.reduce((sum, i) => sum + i.grossIncome, 0)
    period.totalInsurance = period.items.reduce((sum, i) => sum + i.totalInsuranceDeduction, 0)
    period.totalTax = period.items.reduce((sum, i) => sum + i.personalIncomeTax, 0)
    period.totalNet = period.items.reduce((sum, i) => sum + i.netSalary, 0)
    period.updatedAt = new Date().toISOString()

    periods[periodIdx] = period
    this.saveAllPeriods(periods)
    return period
  }

  /**
   * Cập nhật trạng thái kỳ tính lương (Quy trình thẩm định và phê duyệt)
   */
  updatePeriodStatus(
    periodId: string,
    status: PayrollPeriodStatus,
    reviewerName?: string,
    notes?: string
  ): PayrollPeriodRecord | null {
    const periods = this.getAllPeriods()
    const periodIdx = periods.findIndex((p) => p.id === periodId)
    if (periodIdx === -1) return null

    const period = periods[periodIdx]
    period.status = status
    period.updatedAt = new Date().toISOString()
    if (notes) {
      period.reviewNotes = notes
    }

    if (status === "approved" || status === "paid") {
      period.approvedBy = reviewerName || "Kế toán trưởng / Lãnh đạo Liên đoàn"
      period.approvedAt = new Date().toISOString()
    }

    periods[periodIdx] = period
    this.saveAllPeriods(periods)
    return period
  }

  /**
   * Xóa một kỳ lương (chỉ xóa được kỳ ở trạng thái draft)
   */
  deletePeriod(periodId: string): boolean {
    const periods = this.getAllPeriods()
    const target = periods.find((p) => p.id === periodId)
    if (!target || target.status !== "draft") return false

    const filtered = periods.filter((p) => p.id !== periodId)
    this.saveAllPeriods(filtered)
    return true
  }
}

export const defaultHrmPayrollRepository = new HrmPayrollRepository()
