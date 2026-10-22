import { isClosed } from "../workflow/rules.ts"
import type { WorkItem } from "../workflow/types.ts"
import { UNIT_DEFS, unitCodeOf, unitKey, unitName, type UnitCode } from "./org.ts"
import type { StaffProfile, StoredProject, SubUnit, SubUnitKind } from "./types.ts"

/** Tổ/phòng inside a unit: the federation head views, staffs and restructures them; work can target them. */

export const SUB_UNIT_KINDS: SubUnitKind[] = ["Phòng", "Tổ", "Đội", "Xưởng", "Bộ phận"]

export const subUnitsOf = (unit: string, subs: SubUnit[]) =>
  subs.filter((s) => s.unit === unit && s.active).sort((a, b) => a.name.localeCompare(b.name, "vi"))

export type OrgTreeUnit = { unit: string; staff: number; unassigned: number; children: { sub: SubUnit; staff: number }[] }

/** Every unit (in UNIT_DEFS order) with its active sub units and how many people sit in each. */
export function orgTree(subs: SubUnit[], staff: StaffProfile[]): OrgTreeUnit[] {
  return UNIT_DEFS.map((u) => {
    const people = staff.filter((p) => p.unit === u.code)
    const children = subUnitsOf(u.code, subs).map((sub) => ({ sub, staff: people.filter((p) => p.subUnit === sub.id).length }))
    const known = new Set(children.map((c) => c.sub.id))
    return { unit: u.code, staff: people.length, unassigned: people.filter((p) => !p.subUnit || !known.has(p.subUnit)).length, children }
  })
}

/** "" when the sub unit can be saved, else the reason. */
export function saveSubUnitCheck(s: SubUnit, subs: SubUnit[]): string {
  if (!s.name.trim()) return "Vui lòng nhập tên tổ/phòng"
  if (!SUB_UNIT_KINDS.includes(s.kind)) return "Loại tổ/phòng không hợp lệ"
  const key = unitKey(s.name)
  if (subs.some((x) => x.id !== s.id && x.active && x.unit === s.unit && unitKey(x.name) === key)) return "Đơn vị đã có tổ/phòng cùng tên"
  return ""
}

/** The saved sub unit plus every other one that loses its head because that person now heads this one. */
export function withHead(next: SubUnit, subs: SubUnit[]): SubUnit[] {
  if (!next.headId) return [next]
  return [next, ...subs.filter((s) => s.id !== next.id && s.headId === next.headId).map((s) => ({ ...s, headId: undefined }))]
}

/** What still keeps a sub unit alive: its people and its open work. */
export function dissolveBlockers(s: SubUnit, staff: StaffProfile[], items: WorkItem[], projects: Pick<StoredProject, "status" | "wbs">[] = []): string[] {
  const people = staff.filter((p) => p.subUnit === s.id).length
  const open = items.filter((x) => x.subUnit === s.id && !isClosed(x)).length
  const wbs = projects.filter((p) => p.status !== "Hoàn thành").flatMap((p) => p.wbs).filter((w) => w.subUnit === s.id && w.progress < 100).length
  return [people ? `Còn ${people} nhân sự` : "", open ? `Còn ${open} việc đang mở` : "", wbs ? `Còn ${wbs} hạng mục dự án đang làm` : ""].filter(Boolean)
}

/** Kept with active=false so past work and history still resolve its name. */
export const dissolveSubUnit = (s: SubUnit, now: string): SubUnit => ({ ...s, active: false, dissolvedAt: now, headId: undefined })

/** Moves a person into another sub unit (and its unit); "" clears it explicitly (kept as "no tổ"). */
export function transferStaff(p: StaffProfile, subUnitId: string, subs: SubUnit[]): StaffProfile {
  if (!subUnitId) return { ...p, subUnit: "" }
  const target = subs.find((s) => s.id === subUnitId && s.active)
  if (!target) throw new Error("Tổ/phòng không tồn tại hoặc đã giải thể")
  return { ...p, unit: target.unit, subUnit: target.id }
}

/**
 * Profiles stored before tổ existed have no subUnit field: they take the seeded tổ when they are still in the
 * seeded unit. A stored value – including "" for "no tổ" – always wins.
 */
export function withSeedSubUnits(profiles: StaffProfile[], seed: StaffProfile[]): StaffProfile[] {
  const byId = new Map(seed.map((p) => [p.id, p]))
  return profiles.map((p) => {
    if (p.subUnit !== undefined) return p
    const s = byId.get(p.id)
    return s?.subUnit && s.unit === p.unit ? { ...p, subUnit: s.subUnit } : p
  })
}

export type UnitChoice = { unit: string; unitName: string; subUnit?: string; label: string }

/** Picker groups: every unit, offering the whole unit first and then its active tổ/phòng. */
export function unitChoiceGroups(subs: SubUnit[]) {
  return UNIT_DEFS.map((u) => ({
    unit: u.code,
    name: unitName(u.code),
    options: [{ value: u.code as string, label: `Cả ${unitName(u.code)}` }, ...subUnitsOf(u.code, subs).map((s) => ({ value: s.id, label: s.name }))],
  }))
}

/** A picked value (unit code, tổ id, or a unit name stored by older forms) → unit + optional tổ. */
export function resolveUnitChoice(value: string, subs: SubUnit[]): UnitChoice | null {
  if (!value) return null
  const sub = subs.find((s) => s.id === value)
  if (sub) {
    const name = unitName(sub.unit as UnitCode)
    return { unit: sub.unit, unitName: name, subUnit: sub.id, label: `${sub.name} – ${name}` }
  }
  const code = UNIT_DEFS.find((u) => u.code === value)?.code ?? unitCodeOf(value)
  return code ? { unit: code, unitName: unitName(code), label: unitName(code) } : null
}

/** "Tổ đo điện – Đoàn ĐVL Mặt đất" for a record scoped to a tổ, else its unit name. */
export function scopedUnitLabel(x: { unit?: string; subUnit?: string }, subs: SubUnit[]): string {
  const sub = x.subUnit ? subs.find((s) => s.id === x.subUnit) : undefined
  return sub ? `${sub.name} – ${x.unit ?? unitName(sub.unit as UnitCode)}` : x.unit ?? ""
}

/** Tổ a WBS item can be given to: those of the project's unit (picked as a unit code or one of its tổ); a tổ saved earlier stays. */
export function wbsSubUnitChoices(unitValue: string, subs: SubUnit[], selected = ""): SubUnit[] {
  const unit = resolveUnitChoice(unitValue, subs)?.unit
  const list = unit ? subUnitsOf(unit, subs) : []
  const kept = selected && !list.some((s) => s.id === selected) ? subs.filter((s) => s.id === selected) : []
  return [...list, ...kept]
}
