export type WorkStatus = "active" | "probation" | "on_leave" | "terminated"

export interface WorkHistoryItem {
  id: string
  unit: string
  position: string
  startDate: string
  endDate?: string
  notes?: string
}

export interface EmployeeProfile {
  userId: string
  employeeCode: string
  dateOfBirth?: string
  gender?: "male" | "female" | "other"
  address?: string
  department?: string
  position?: string
  specialty?: string
  qualification?: string
  contractType?: string
  contractNumber?: string
  contractStartDate?: string
  contractEndDate?: string
  workStatus: WorkStatus
  workHistory: WorkHistoryItem[]
}

export interface EmployeeRecord extends EmployeeProfile {
  id: string
  fullName: string
  email: string
  phone?: string
  accountActive: boolean
  role: string
  roleCodes: string[]
  createdAt: string
  updatedAt: string
}

export interface EmployeeProfileFormData {
  userId?: string
  employeeCode: string
  fullName: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: "male" | "female" | "other"
  address?: string
  department: string
  position: string
  specialty?: string
  qualification?: string
  contractType?: string
  contractNumber?: string
  contractStartDate?: string
  contractEndDate?: string
  workStatus: WorkStatus
}
