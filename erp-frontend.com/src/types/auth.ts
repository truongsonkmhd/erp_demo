export type RoleCode =
  | "admin"
  | "sale"
  | "marketing"
  | "cskh"
  | "warehouse"
  | "accounting"
  | string

export type Role = RoleCode | "manager" | "staff"

export const ROLES: Role[] = ["admin", "manager", "staff"]

export type SeatLimit = number | "n" | "1"

export interface RoleLevel {
  id: string
  name: string
  seat: SeatLimit
  description: string
  permissionIds?: string[]
}

export interface RolePermission {
  id: string
  code?: string
  label: string
  note?: string
  pageId?: number
  actionId?: number
  pageCode?: string
  actionCode?: string
}

export interface RoleDefinition {
  id: string
  code: string
  name: string
  summary: string
  departmentId?: number | null
  departmentName?: string | null
  levels: RoleLevel[]
  permissions: RolePermission[]
  needsClarification?: boolean
}

export type RoleDefinitionInput = Omit<RoleDefinition, "id">

export interface EmployeeAccount {
  id: string
  fullName: string
  email: string
  phone?: string
  role: string
  roleCodes: string[]
  accountType: 1 | 2 | 3
  levelId: string
  baseSalary?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type EmployeeAccountInput = Omit<EmployeeAccount, "id" | "createdAt" | "updatedAt">
