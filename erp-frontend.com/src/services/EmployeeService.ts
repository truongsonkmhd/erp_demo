import { isRoleWithoutLevels } from "@/constants/roles"
import { apiRequest } from "@/lib/api"
import { EmployeeAccount, EmployeeAccountInput, RegistrationStatus } from "@/types/auth"

type BackendUser = {
  id: number
  fullName: string
  username: string
  email: string
  phone?: string
  role: string
  roleCodes?: string[]
  accountType?: number
  levelId: string
  baseSalary?: number
  active: boolean
  registrationStatus?: RegistrationStatus | null
  requestedOrgUnitId?: number | null
  requestedOrgUnitName?: string | null
  positionCode?: string | null
  orgUnitId?: number | null
  createdAt: string
  updatedAt: string
}

type UserPage = {
  users: BackendUser[]
  pageNo: number
  pageSize: number
  totalElements: number
  totalPages: number
}

function mapUser(user: BackendUser): EmployeeAccount {
  return {
    id: String(user.id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleCodes: user.roleCodes || (user.role ? [user.role] : []),
    accountType: (user.accountType || 2) as 1 | 2 | 3,
    levelId: user.levelId,
    baseSalary: user.baseSalary == null ? undefined : Number(user.baseSalary),
    active: Boolean(user.active),
    registrationStatus: user.registrationStatus ?? null,
    requestedOrgUnitId: user.requestedOrgUnitId ?? null,
    requestedOrgUnitName: user.requestedOrgUnitName ?? null,
    positionCode: user.positionCode ?? null,
    orgUnitId: user.orgUnitId ?? null,
    createdAt: user.createdAt || "",
    updatedAt: user.updatedAt || "",
  }
}

export async function getEmployees(): Promise<EmployeeAccount[]> {
  const pageSize = 200
  const first = await apiRequest<UserPage>(`/api/users?pageNo=1&pageSize=${pageSize}`)
  const users = [...(first?.users || [])]
  const total = first?.totalElements ?? users.length
  const totalPages = Math.max(first?.totalPages ?? 1, Math.ceil(total / pageSize) || 1)
  for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
    const next = await apiRequest<UserPage>(`/api/users?pageNo=${pageNo}&pageSize=${pageSize}`)
    users.push(...(next?.users || []))
  }
  return users.map(mapUser)
}

export async function getEmployeeById(id: string): Promise<EmployeeAccount> {
  const user = await apiRequest<BackendUser>(`/api/users/${id}`)
  return mapUser(user)
}

export async function addEmployee(input: EmployeeAccountInput): Promise<EmployeeAccount> {
  const created = await apiRequest<BackendUser>("/api/users", {
    method: "POST",
    body: {
      fullName: input.fullName,
      email: input.email.trim(),
      phone: input.phone,
      password: DEFAULT_EMPLOYEE_PASSWORD,
      roleCode: input.role,
      roleCodes: input.roleCodes,
      accountType: input.accountType,
      levelId: isRoleWithoutLevels(input.role) ? undefined : input.levelId || "executive",
      baseSalary: input.baseSalary ?? 0,
      active: input.active ?? true,
    },
  })
  return mapUser(created)
}

/** Default password used when admin creates or resets an employee account */
export const DEFAULT_EMPLOYEE_PASSWORD = "123456"

export async function resetEmployeePassword(id: string): Promise<void> {
  await apiRequest(`/api/users/${id}/reset-password`, { method: "POST" })
}

export async function updateEmployee(id: string, input: Partial<EmployeeAccountInput>): Promise<EmployeeAccount> {
  const updated = await apiRequest<BackendUser>(`/api/users/${id}`, {
    method: "PUT",
    body: {
      fullName: input.fullName,
      email: input.email?.trim(),
      phone: input.phone,
      roleCode: input.role,
      roleCodes: input.roleCodes,
      accountType: input.accountType,
      levelId: isRoleWithoutLevels(input.role) ? null : input.levelId,
      baseSalary: input.baseSalary,
      active: input.active,
    },
  })
  return mapUser(updated)
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiRequest(`/api/users/${id}`, { method: "DELETE" })
}

export type ApproveRegistrationInput = {
  roleCodes: string[]
  levelId?: string
  positionCode?: string
  /** Undefined keeps the đơn vị the person requested. */
  orgUnitId?: number
}

/** Grants roles, chức vụ and đơn vị to a self-registered account and activates it. */
export async function approveRegistration(id: string, input: ApproveRegistrationInput): Promise<EmployeeAccount> {
  const approved = await apiRequest<BackendUser>(`/api/users/${id}/approve`, { method: "POST", body: input })
  return mapUser(approved)
}

export async function rejectRegistration(id: string): Promise<void> {
  await apiRequest(`/api/users/${id}/reject`, { method: "POST" })
}

export type Position = { id: number; code: string; name: string; level?: number; managesUnit?: boolean }

export function getPositions(): Promise<Position[]> {
  return apiRequest<Position[]>("/api/org/positions")
}
