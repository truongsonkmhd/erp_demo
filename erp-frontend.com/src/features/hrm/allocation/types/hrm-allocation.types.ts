export type AllocationStatus =
  | "fieldwork" // Hiện trường dã ngoại
  | "office_specialty" // Chuyên môn nội nghiệp / Lab
  | "management" // Quản lý / Điều hành
  | "on_leave" // Đang nghỉ phép (HRM-03)
  | "available" // Chưa bố trí nhiệm vụ (Bench)

export type WorkloadLevel = "underload" | "balanced" | "overload"

export interface EmployeeAssignmentRecord {
  id: string // ASN-001
  userId: string
  employeeCode: string
  fullName: string
  department: string
  position: string
  projectId: string
  projectName: string
  assignedRole: string // Chủ nhiệm đề án, Kỹ sư thực địa...
  allocationPercentage: number // 30%, 50%, 100%...
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  currentStatus: AllocationStatus
  location: string // Địa bàn công tác: Lai Châu, Hà Nội...
  notes?: string
}

export interface EmployeeWorkloadSummary {
  userId: string
  employeeCode: string
  fullName: string
  department: string
  position: string
  totalWorkloadPercentage: number // Tổng % tải
  status: WorkloadLevel
  activeAssignments: {
    projectId: string
    projectName: string
    percentage: number
    role: string
    status: AllocationStatus
    location: string
  }[]
}

export interface TaskTimesheetRecord {
  id: string // TS-2026-10-001
  month: number // 10
  year: number // 2026
  userId: string
  employeeCode: string
  fullName: string
  department: string
  projectId: string
  projectName: string
  fieldworkDays: number // Ngày công thực địa
  officeDays: number // Ngày công văn phòng
  totalDays: number // Tổng ngày
  dailyRate: number // Đơn giá ngày công định mức (vd: 550.000 ₫)
  fieldworkAllowanceRate: number // Phụ cấp lưu động ngày (vd: 180.000 ₫)
  totalLaborCost: number // Chi phí nhân công phân bổ vào đề án
  approvalStatus: "draft" | "submitted" | "approved"
  notes?: string
}

export interface DepartmentWorkloadStat {
  department: string
  totalEmployees: number
  fieldworkCount: number
  officeCount: number
  availableCount: number
  onLeaveCount: number
  averageWorkload: number
}
