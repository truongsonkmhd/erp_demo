import type {
  AllocationStatus,
  WorkloadLevel,
} from "../types/hrm-allocation.types"

export const ALLOCATION_STATUS_LABELS: Record<AllocationStatus, string> = {
  fieldwork: "Hiện trường dã ngoại",
  office_specialty: "Chuyên môn nội nghiệp",
  management: "Quản lý / Điều hành",
  on_leave: "Đang nghỉ phép",
  available: "Chưa bố trí nhiệm vụ",
}

export const WORKLOAD_LEVEL_LABELS: Record<WorkloadLevel, string> = {
  underload: "Dưới tải (< 70%)",
  balanced: "Tải tối ưu (70 - 100%)",
  overload: "Quá tải (> 100%)",
}

export function getWorkloadLevel(percentage: number): WorkloadLevel {
  if (percentage > 100) return "overload"
  if (percentage < 70) return "underload"
  return "balanced"
}

export function calculateLaborCost(
  fieldworkDays: number,
  officeDays: number,
  dailyRate: number = 550000,
  fieldworkAllowanceRate: number = 180000
): number {
  const officeCost = officeDays * dailyRate
  const fieldworkCost = fieldworkDays * (dailyRate + fieldworkAllowanceRate)
  return officeCost + fieldworkCost
}

export function formatVND(amount: number | null | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "0 ₫"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}
