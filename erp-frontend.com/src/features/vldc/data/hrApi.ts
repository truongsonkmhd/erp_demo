import { apiRequest } from "@/lib/api"
import { refreshApiCollection } from "./apiRepo"
import type { OrgUnit, StaffProfile, StaffSkill, SubUnit } from "./types"

/**
 * Writes to the HR data the backend owns (nhân sự, tổ/phòng, đơn vị, skill matrix, tài khoản). Unlike vldcData.save
 * they never fall back to the browser: the backend checks permission and scope, and its refusal is shown to the user.
 * After a write the collections involved are re-fetched (the WebSocket feed would do it too).
 */

const put = <T>(collection: string, id: string, body: unknown) =>
  apiRequest<T>(`/api/vldc/${collection}/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.parse(JSON.stringify(body)) })

async function then<T>(result: Promise<T>, ...collections: string[]): Promise<T> {
  const value = await result
  await Promise.all(collections.map((c) => refreshApiCollection(c)))
  return value
}

/** A move between đơn vị/tổ or a status change also changes heads and counts: re-fetch the unit lists too. */
export const saveStaff = (p: StaffProfile) => then(put<StaffProfile>("staff_profiles", p.id, p), "staff_profiles", "staff_skills", "sub_units", "org_units")
export const saveSubUnit = (s: SubUnit) => then(put<SubUnit>("sub_units", s.id, s), "sub_units", "org_units")
export const saveOrgUnit = (u: OrgUnit) => then(put<OrgUnit>("org_units", u.id, u), "org_units")
export const saveSkills = (s: StaffSkill) => then(put<StaffSkill>("staff_skills", s.id, s), "staff_skills")

export type Transfer = { date: string; from: string; to: string; note?: string; by?: string }
export const fetchTransfers = (id: string) => apiRequest<Transfer[]>(`/api/vldc/staff_profiles/${encodeURIComponent(id)}/transfers`)

export type SkillDef = { code: string; name: string }
export const fetchSkillCatalog = () => apiRequest<SkillDef[]>("/api/vldc/staff_skills/catalog")

export type Account = {
  id: number; username: string; email: string; fullName: string; active: boolean; roleCodes: string[]; roleNames: string[]
  positionCode?: string; positionName?: string; unitCode?: string; unitName?: string
  employeeCode?: string; employeeStatus?: string; updatedAt?: string
}
export type AccountOptions = {
  roles: { code: string; name: string }[]
  positions: { code: string; name: string }[]
  employees: { code: string; name: string; unit: string; title: string; email?: string }[]
}
/** temporaryPassword is shown once; the backend keeps only its hash. */
export type AccountSecret = { account: Account; temporaryPassword: string }

export const fetchAccounts = () => apiRequest<Account[]>("/api/hr/accounts")
export const fetchAccountOptions = () => apiRequest<AccountOptions>("/api/hr/accounts/options")
export const createAccount = (input: { employeeCode: string; username?: string; email?: string; roleCodes: string[]; positionCode?: string }) =>
  then(apiRequest<AccountSecret>("/api/hr/accounts", { method: "POST", body: input }), "staff_profiles")
export const updateAccount = (id: number, input: { roleCodes?: string[]; positionCode?: string; active?: boolean }) =>
  then(apiRequest<Account>(`/api/hr/accounts/${id}`, { method: "PUT", body: input }), "staff_profiles")
export const resetAccountPassword = (id: number) => apiRequest<AccountSecret>(`/api/hr/accounts/${id}/reset-password`, { method: "POST" })

/** The backend's message ("Ngoài phạm vi quản lý", "Đơn vị đã có tổ/phòng cùng tên"...) or a generic one. */
export function errorText(e: unknown): string {
  const status = (e as { status?: number } | null)?.status
  const message = e instanceof Error ? e.message : String(e ?? "")
  if (status === 403 || /^forbidden$/i.test(message)) return "Bạn không có quyền thực hiện thao tác này (hoặc ngoài phạm vi đơn vị quản lý)."
  if (status === 409) return "Dữ liệu vừa được người khác thay đổi, vui lòng thử lại."
  return message || "Không lưu được, vui lòng thử lại."
}
