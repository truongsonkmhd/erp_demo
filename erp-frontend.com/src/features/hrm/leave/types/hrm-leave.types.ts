/**
 * HRM-03: Kiểu dữ liệu Quản lý nghỉ phép qua Workflow
 */

export type LeaveType = "annual" | "sick" | "maternity" | "special_paid" | "unpaid"
export type LeaveStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled"
export type LeaveSession = "morning" | "afternoon" | "full"

export interface LeaveWorkflowHistory {
  id: string
  action: "submit" | "approve" | "reject" | "cancel"
  actorId: string
  actorName: string
  actorRole: string
  timestamp: string
  comment?: string
}

export interface LeaveRequestRecord {
  id: string
  userId: string
  employeeCode: string
  fullName: string
  department: string
  position: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  startSession: LeaveSession
  endSession: LeaveSession
  totalDays: number
  reason: string
  handoverUserId?: string
  handoverUserName?: string
  contactPhone?: string
  status: LeaveStatus
  workflow: LeaveWorkflowHistory[]
  createdAt: string
  updatedAt: string
}

export interface LeaveBalance {
  userId: string
  employeeCode: string
  fullName: string
  year: number
  totalAnnualLeave: number
  usedDays: number
  pendingDays: number
  remainingDays: number
}

export type LeaveRequestFormData = Omit<
  LeaveRequestRecord,
  "id" | "status" | "workflow" | "createdAt" | "updatedAt"
> & {
  id?: string
  status?: LeaveStatus
}
