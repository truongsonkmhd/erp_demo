import { defaultEmployeeProfileRepository } from "../../employee-profiles/repositories/employee-profile.storage"
import type {
  DepartmentWorkloadStat,
  EmployeeAssignmentRecord,
  EmployeeWorkloadSummary,
  TaskTimesheetRecord,
} from "../types/hrm-allocation.types"
import {
  calculateLaborCost,
  getWorkloadLevel,
} from "../utils/allocation-calculator"

const STORAGE_KEY_ASSIGNMENTS = "hrm_allocation_assignments_v1"
const STORAGE_KEY_TIMESHEETS = "hrm_allocation_timesheets_v1"

const INITIAL_ASSIGNMENTS: EmployeeAssignmentRecord[] = [
  {
    id: "ASN-001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    department: "Đoàn Địa vật lý 1",
    position: "Đoàn trưởng / Kỹ sư chính",
    projectId: "DA-TB-2023",
    projectName: "Đề án bay đo từ - phổ gamma vùng Tây Bắc Bộ",
    assignedRole: "Chủ nhiệm đề án",
    allocationPercentage: 100,
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    currentStatus: "fieldwork",
    location: "Lai Châu - Điện Biên",
    notes: "Chỉ huy thực địa các tuyến bay đo địa vật lý vùng núi cao",
  },
  {
    id: "ASN-002",
    userId: "user-4",
    employeeCode: "CB-0004",
    fullName: "Lê Hoàng Long",
    department: "Phòng Kỹ thuật & Công nghệ",
    position: "Trưởng phòng",
    projectId: "KS-HB-2026",
    projectName: "Khảo sát địa chấn nông phân giải cao lòng hồ Hòa Bình",
    assignedRole: "Chủ nhiệm đề án",
    allocationPercentage: 70,
    startDate: "2026-09-01",
    endDate: "2027-02-28",
    currentStatus: "office_specialty",
    location: "Hà Nội - Hòa Bình",
    notes: "Chỉ đạo phương pháp địa chấn và thẩm định báo cáo",
  },
  {
    id: "ASN-003",
    userId: "user-4",
    employeeCode: "CB-0004",
    fullName: "Lê Hoàng Long",
    department: "Phòng Kỹ thuật & Công nghệ",
    position: "Trưởng phòng",
    projectId: "DT-DC-SH",
    projectName: "Nghiên cứu cấu trúc sâu đới đứt gãy Sông Hồng",
    assignedRole: "Cố vấn khoa học & Phản biện",
    allocationPercentage: 50,
    startDate: "2026-07-01",
    endDate: "2026-11-30",
    currentStatus: "office_specialty",
    location: "Trụ sở Liên đoàn",
    notes: "Phân tích minh giải tài liệu chấn động sâu (Kiêm nhiệm)",
  },
  {
    id: "ASN-004",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    department: "Đoàn Địa vật lý 1",
    position: "Kỹ sư địa vật lý thực địa",
    projectId: "TD-BP-2022",
    projectName: "Thăm dò địa vật lý tìm kiếm quặng đồng - niken Bản Phúc, Sơn La",
    assignedRole: "Tổ trưởng đo vẽ thực địa",
    allocationPercentage: 100,
    startDate: "2026-09-15",
    endDate: "2026-12-15",
    currentStatus: "fieldwork",
    location: "Bản Phúc, Sơn La",
    notes: "Đo sâu điện phân cực kích thích IP và từ trường chi tiết",
  },
  {
    id: "ASN-005",
    userId: "user-3",
    employeeCode: "CB-0003",
    fullName: "Trần Thị Mai",
    department: "Phòng Tài chính - Kế toán",
    position: "Phó Trưởng phòng",
    projectId: "TĐ-QG-2024",
    projectName: "Thẩm định kinh tế - kỹ thuật đề án điều tra khoáng sản ẩn sâu quốc gia",
    assignedRole: "Phụ trách thẩm tra tài chính",
    allocationPercentage: 80,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    currentStatus: "management",
    location: "Trụ sở Liên đoàn",
    notes: "Thẩm định định mức kinh tế kỹ thuật và thanh quyết toán",
  },
  {
    id: "ASN-006",
    userId: "user-5",
    employeeCode: "CB-0005",
    fullName: "Phạm Hồng Quân",
    department: "Đoàn Địa vật lý 2",
    position: "Kỹ sư trắc địa địa vật lý",
    projectId: "UAV-DN-2024",
    projectName: "Bay chụp ảnh viễn thám và đo từ UAV mỏ bauxit Đắk Nông",
    assignedRole: "Kỹ sư trưởng đo vẽ UAV",
    allocationPercentage: 100,
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    currentStatus: "fieldwork",
    location: "Đắk Nông",
    notes: "Bay đo từ trường bằng thiết bị Drone UAV độ phân giải cao",
  },
  {
    id: "ASN-007",
    userId: "user-6",
    employeeCode: "CB-0006",
    fullName: "Hoàng Minh Đức",
    department: "Đoàn Địa vật lý 2",
    position: "Kỹ sư địa chất",
    projectId: "NONE",
    projectName: "Chưa phân bổ đề án",
    assignedRole: "Chờ điều động",
    allocationPercentage: 0,
    startDate: "2026-10-01",
    endDate: "2026-10-15",
    currentStatus: "on_leave",
    location: "Hà Nội",
    notes: "Nghỉ phép phục hồi sức khỏe sau đợt khảo sát thực địa",
  },
  {
    id: "ASN-008",
    userId: "user-7",
    employeeCode: "CB-0007",
    fullName: "Ngô Quốc Cường",
    department: "Đoàn Địa vật lý 1",
    position: "Kỹ sư địa vật lý trẻ",
    projectId: "NONE",
    projectName: "Chưa bố trí nhiệm vụ",
    assignedRole: "Sẵn sàng nhận việc",
    allocationPercentage: 0,
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    currentStatus: "available",
    location: "Trụ sở Liên đoàn",
    notes: "Kỹ sư mới hoàn thành khóa tập huấn, sẵn sàng đi hiện trường",
  },
]

const INITIAL_TIMESHEETS: TaskTimesheetRecord[] = [
  {
    id: "TS-2026-10-001",
    month: 10,
    year: 2026,
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    department: "Đoàn Địa vật lý 1",
    projectId: "DA-TB-2023",
    projectName: "Đề án bay đo từ - phổ gamma vùng Tây Bắc Bộ",
    fieldworkDays: 14,
    officeDays: 6,
    totalDays: 20,
    dailyRate: 650000,
    fieldworkAllowanceRate: 180000,
    totalLaborCost: 6 * 650000 + 14 * (650000 + 180000), // 15.520.000 ₫
    approvalStatus: "submitted",
    notes: "Bay đo tuyến Tây Bắc",
  },
  {
    id: "TS-2026-10-002",
    month: 10,
    year: 2026,
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    department: "Đoàn Địa vật lý 1",
    projectId: "TD-BP-2022",
    projectName: "Thăm dò địa vật lý quặng đồng - niken Bản Phúc, Sơn La",
    fieldworkDays: 18,
    officeDays: 2,
    totalDays: 20,
    dailyRate: 500000,
    fieldworkAllowanceRate: 180000,
    totalLaborCost: 2 * 500000 + 18 * (500000 + 180000), // 13.240.000 ₫
    approvalStatus: "submitted",
    notes: "Cắm tuyến đo IP tại Bản Phúc",
  },
  {
    id: "TS-2026-10-003",
    month: 10,
    year: 2026,
    userId: "user-4",
    employeeCode: "CB-0004",
    fullName: "Lê Hoàng Long",
    department: "Phòng Kỹ thuật & Công nghệ",
    projectId: "KS-HB-2026",
    projectName: "Khảo sát địa chấn nông phân giải cao lòng hồ Hòa Bình",
    fieldworkDays: 6,
    officeDays: 14,
    totalDays: 20,
    dailyRate: 750000,
    fieldworkAllowanceRate: 180000,
    totalLaborCost: 14 * 750000 + 6 * (750000 + 180000), // 16.080.000 ₫
    approvalStatus: "approved",
    notes: "Chỉ đạo kỹ thuật hiện trường hồ Hòa Bình",
  },
  {
    id: "TS-2026-10-004",
    month: 10,
    year: 2026,
    userId: "user-5",
    employeeCode: "CB-0005",
    fullName: "Phạm Hồng Quân",
    department: "Đoàn Địa vật lý 2",
    projectId: "UAV-DN-2024",
    projectName: "Bay chụp ảnh viễn thám và đo từ UAV mỏ bauxit Đắk Nông",
    fieldworkDays: 16,
    officeDays: 4,
    totalDays: 20,
    dailyRate: 480000,
    fieldworkAllowanceRate: 180000,
    totalLaborCost: 4 * 480000 + 16 * (480000 + 180000), // 12.480.000 ₫
    approvalStatus: "submitted",
    notes: "Vận hành thiết bị bay UAV",
  },
]

export class HrmAllocationRepository {
  private getStorage(): Storage | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage
      }
    } catch {
      // Ignored
    }
    return null
  }

  // --- QUẢN LÝ PHÂN BỔ NHÂN LỰC (HRM-08) ---
  getAllAssignments(): EmployeeAssignmentRecord[] {
    const storage = this.getStorage()
    if (!storage) return INITIAL_ASSIGNMENTS
    try {
      const raw = storage.getItem(STORAGE_KEY_ASSIGNMENTS)
      if (!raw) {
        this.saveAllAssignments(INITIAL_ASSIGNMENTS)
        return INITIAL_ASSIGNMENTS
      }
      return JSON.parse(raw) as EmployeeAssignmentRecord[]
    } catch {
      return INITIAL_ASSIGNMENTS
    }
  }

  private saveAllAssignments(assignments: EmployeeAssignmentRecord[]): void {
    const storage = this.getStorage()
    if (!storage) return
    try {
      storage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments))
    } catch {
      // Ignored
    }
  }

  saveAssignment(record: EmployeeAssignmentRecord): EmployeeAssignmentRecord {
    const assignments = this.getAllAssignments()
    const index = assignments.findIndex((a) => a.id === record.id)
    if (index >= 0) {
      assignments[index] = record
    } else {
      assignments.unshift(record)
    }
    this.saveAllAssignments(assignments)
    return record
  }

  deleteAssignment(id: string): boolean {
    const assignments = this.getAllAssignments()
    const filtered = assignments.filter((a) => a.id !== id)
    if (filtered.length !== assignments.length) {
      this.saveAllAssignments(filtered)
      return true
    }
    return false
  }

  // --- QUẢN LÝ MỨC TẢI CÔNG VIỆC (HRM-09) ---
  getWorkloadSummaries(): EmployeeWorkloadSummary[] {
    const assignments = this.getAllAssignments()
    const map = new Map<string, EmployeeWorkloadSummary>()

    for (const a of assignments) {
      let item = map.get(a.userId)
      if (!item) {
        item = {
          userId: a.userId,
          employeeCode: a.employeeCode,
          fullName: a.fullName,
          department: a.department,
          position: a.position,
          totalWorkloadPercentage: 0,
          status: "underload",
          activeAssignments: [],
        }
        map.set(a.userId, item)
      }

      if (a.projectId !== "NONE") {
        item.totalWorkloadPercentage += a.allocationPercentage
        item.activeAssignments.push({
          projectId: a.projectId,
          projectName: a.projectName,
          percentage: a.allocationPercentage,
          role: a.assignedRole,
          status: a.currentStatus,
          location: a.location,
        })
      }
    }

    const summaries = Array.from(map.values()).map((s) => ({
      ...s,
      status: getWorkloadLevel(s.totalWorkloadPercentage),
    }))

    // Sắp xếp người quá tải lên trước
    return summaries.sort((a, b) => b.totalWorkloadPercentage - a.totalWorkloadPercentage)
  }

  getDepartmentWorkloadStats(): DepartmentWorkloadStat[] {
    const assignments = this.getAllAssignments()
    const deptMap = new Map<string, DepartmentWorkloadStat>()

    for (const a of assignments) {
      let stat = deptMap.get(a.department)
      if (!stat) {
        stat = {
          department: a.department,
          totalEmployees: 0,
          fieldworkCount: 0,
          officeCount: 0,
          availableCount: 0,
          onLeaveCount: 0,
          averageWorkload: 0,
        }
        deptMap.set(a.department, stat)
      }

      stat.totalEmployees++
      if (a.currentStatus === "fieldwork") stat.fieldworkCount++
      else if (a.currentStatus === "office_specialty" || a.currentStatus === "management") stat.officeCount++
      else if (a.currentStatus === "available") stat.availableCount++
      else if (a.currentStatus === "on_leave") stat.onLeaveCount++
    }

    const workloadSummaries = this.getWorkloadSummaries()
    return Array.from(deptMap.values()).map((d) => {
      const empsInDept = workloadSummaries.filter((s) => s.department === d.department)
      const avg =
        empsInDept.length > 0
          ? Math.round(
              empsInDept.reduce((sum, e) => sum + e.totalWorkloadPercentage, 0) / empsInDept.length
            )
          : 0
      return {
        ...d,
        averageWorkload: avg,
      }
    })
  }

  // --- QUẢN LÝ NGÀY CÔNG VÀ CHI PHÍ (HRM-10) ---
  getAllTimesheets(month: number = 10, year: number = 2026): TaskTimesheetRecord[] {
    const storage = this.getStorage()
    if (!storage) return INITIAL_TIMESHEETS
    try {
      const raw = storage.getItem(STORAGE_KEY_TIMESHEETS)
      if (!raw) {
        this.saveAllTimesheets(INITIAL_TIMESHEETS)
        return INITIAL_TIMESHEETS.filter((t) => t.month === month && t.year === year)
      }
      const parsed = JSON.parse(raw) as TaskTimesheetRecord[]
      return parsed.filter((t) => t.month === month && t.year === year)
    } catch {
      return INITIAL_TIMESHEETS
    }
  }

  private saveAllTimesheets(timesheets: TaskTimesheetRecord[]): void {
    const storage = this.getStorage()
    if (!storage) return
    try {
      storage.setItem(STORAGE_KEY_TIMESHEETS, JSON.stringify(timesheets))
    } catch {
      // Ignored
    }
  }

  saveTimesheet(record: TaskTimesheetRecord): TaskTimesheetRecord {
    const storage = this.getStorage()
    let all: TaskTimesheetRecord[] = INITIAL_TIMESHEETS
    if (storage) {
      try {
        const raw = storage.getItem(STORAGE_KEY_TIMESHEETS)
        if (raw) all = JSON.parse(raw)
      } catch {}
    }

    const index = all.findIndex((t) => t.id === record.id)
    if (index >= 0) {
      all[index] = record
    } else {
      all.unshift(record)
    }

    this.saveAllTimesheets(all)
    return record
  }

  deleteTimesheet(id: string): boolean {
    const storage = this.getStorage()
    let all: TaskTimesheetRecord[] = INITIAL_TIMESHEETS
    if (storage) {
      try {
        const raw = storage.getItem(STORAGE_KEY_TIMESHEETS)
        if (raw) all = JSON.parse(raw)
      } catch {}
    }

    const filtered = all.filter((t) => t.id !== id)
    if (filtered.length !== all.length) {
      this.saveAllTimesheets(filtered)
      return true
    }
    return false
  }
}

export const defaultHrmAllocationRepository = new HrmAllocationRepository()
