/**
 * Chức vụ, đơn vị và phạm vi quản lý of each VLDC role (đặc tả phân quyền mục 6.3). Permission says which function a
 * role may use; this module says over whom. The rule mirrors the backend AuthorizationService: a position that
 * manages a unit covers that unit and its sub-units, and only people of a lower rank (larger level).
 *
 * The backend (GET /api/org/directory) is the source; the defaults below are its seed and are used until it loads.
 * These checks only drive the UI: the backend re-checks scope on its own APIs (/api/org/assignees/...).
 */

export type Position = { code: string; name: string; level: number; managesUnit: boolean }
type RoleOrg = { unit: string; position: string }

const positions: Record<string, Position> = {
  LANH_DAO: { code: "LANH_DAO", name: "Lãnh đạo", level: 1, managesUnit: true },
  TRUONG_DON_VI: { code: "TRUONG_DON_VI", name: "Trưởng phòng / Đoàn trưởng", level: 2, managesUnit: true },
  NHAN_VIEN: { code: "NHAN_VIEN", name: "Nhân viên", level: 3, managesUnit: false },
}

/** Parent of each unit (tbl_department.parent_id); the root has none. */
const unitParent: Record<string, string | undefined> = {
  BLD: undefined, KT: "BLD", KHTC: "BLD", TCHC: "BLD", MD: "BLD", DB: "BLD", HK: "BLD", TT: "BLD",
}

const HEAD = "TRUONG_DON_VI"
const STAFF = "NHAN_VIEN"
const roleOrg: Record<string, RoleOrg> = {
  lanhdao: { unit: "BLD", position: "LANH_DAO" },
  truongdonvi: { unit: "MD", position: HEAD }, matdat: { unit: "MD", position: HEAD }, chunhiem: { unit: "MD", position: STAFF },
  bien: { unit: "DB", position: HEAD }, hientruong: { unit: "DB", position: STAFF },
  hangkhong: { unit: "HK", position: HEAD },
  trungtam: { unit: "TT", position: HEAD },
  kythuat: { unit: "KT", position: STAFF },
  ketoantruong: { unit: "KHTC", position: HEAD }, kehoach: { unit: "KHTC", position: STAFF }, ketoan: { unit: "KHTC", position: STAFF },
  tochuc: { unit: "TCHC", position: STAFF },
}

export type DirectoryUnit = { code: string; parentCode?: string | null }
export type DirectoryPerson = { roleCodes: string[]; positionCode?: string | null; orgUnitCode?: string | null }
export type DirectoryPosition = { code: string; name: string; level: number; managesUnit: boolean }

/** Applies GET /api/org/directory. A role keeps its default where the backend has no position or unit for it. */
export function applyDirectory(dir: { positions: DirectoryPosition[]; units: DirectoryUnit[]; people: DirectoryPerson[] }) {
  for (const p of dir.positions) positions[p.code] = { code: p.code, name: p.name, level: p.level, managesUnit: !!p.managesUnit }
  for (const u of dir.units) unitParent[u.code] = u.parentCode ?? undefined
  for (const person of dir.people) {
    for (const role of person.roleCodes) {
      const prev = roleOrg[role]
      const unit = person.orgUnitCode ?? prev?.unit
      const position = person.positionCode ?? prev?.position
      if (unit && position) roleOrg[role] = { unit, position }
    }
  }
}

/** Roles that have a place in the organisation. */
export const orgRoles = () => Object.keys(roleOrg)
export const roleUnit = (role: string): string | undefined => roleOrg[role]?.unit
export const rolePosition = (role: string): Position | undefined => positions[roleOrg[role]?.position ?? ""]

/** The unit and every unit below it. */
export function subtreeUnits(unit: string): Set<string> {
  const result = new Set([unit])
  let grew = true
  while (grew) {
    grew = false
    for (const [code, parent] of Object.entries(unitParent)) {
      if (parent && result.has(parent) && !result.has(code)) {
        result.add(code)
        grew = true
      }
    }
  }
  return result
}

/** Units whose work, KPI and statistics the role manages; empty for a position that does not manage a unit. */
export function managedUnits(role: string): Set<string> {
  const unit = roleUnit(role)
  return unit && rolePosition(role)?.managesUnit ? subtreeUnits(unit) : new Set()
}

/** Manages the whole organisation (the root unit): Liên đoàn-wide dashboards, KPI and statistics. */
export function managesAllUnits(role: string): boolean {
  const managed = managedUnits(role)
  return managed.size > 0 && Object.keys(unitParent).every((u) => managed.has(u))
}

/** The owner's work falls in the role's managed units. */
export function managesWorkOf(role: string, owner: string): boolean {
  const unit = roleUnit(owner)
  return !!unit && managedUnits(role).has(unit)
}

/** The actor may assign work/KPI to the target: the target is in a managed unit and ranks below the actor. */
export function canAssign(actor: string, target: string): boolean {
  if (actor === target || !managesWorkOf(actor, target)) return false
  const a = rolePosition(actor)?.level
  const t = rolePosition(target)?.level
  return a != null && t != null && a < t
}

/** Roles the actor may assign work to, in organisation order. */
export const assignableRoles = (actor: string, roles: string[] = orgRoles()) => roles.filter((r) => canAssign(actor, r))
