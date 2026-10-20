import type { EmployeeAccount } from "@/types/auth"
import type { EmployeeProfile, EmployeeRecord } from "../types/employee-profile.types.ts"

export function mergeToRecord(account: EmployeeAccount, profile: EmployeeProfile | null): EmployeeRecord {
  if (profile) {
    return {
      ...profile,
      id: account.id,
      userId: account.id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      accountActive: account.active,
      role: account.role,
      roleCodes: account.roleCodes,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      // Preserve workHistory
      workHistory: profile.workHistory || [],
    }
  }

  // Synthesize default profile for account without extension data
  return {
    id: account.id,
    userId: account.id,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    accountActive: account.active,
    role: account.role,
    roleCodes: account.roleCodes,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    employeeCode: `CB-${account.id.padStart(4, "0")}`,
    workStatus: account.active ? "active" : "terminated",
    dateOfBirth: undefined,
    gender: undefined,
    address: undefined,
    department: undefined,
    position: undefined,
    specialty: undefined,
    qualification: undefined,
    contractType: undefined,
    contractNumber: undefined,
    contractStartDate: undefined,
    contractEndDate: undefined,
    workHistory: [],
  }
}

export function mergeAllToRecords(accounts: EmployeeAccount[], profiles: EmployeeProfile[]): EmployeeRecord[] {
  const profileMap = new Map<string, EmployeeProfile>()
  for (const profile of profiles) {
    profileMap.set(profile.userId, profile)
  }

  return accounts.map((account) => mergeToRecord(account, profileMap.get(account.id) ?? null))
}
