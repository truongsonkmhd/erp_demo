import type { SubUnit } from "../types.ts"
import { staffProfiles } from "./staff.ts"
import { SUB_UNIT_DEFS, UNIT_LEAD_TITLES } from "./subUnitDefs.ts"

/** The seeded tổ/phòng; each head is the most experienced member who does not already lead the whole unit. */
export function subUnits(today: string): SubUnit[] {
  const staff = staffProfiles(today)
  return SUB_UNIT_DEFS.map(([id, unit, name, kind, duty]) => {
    const head = staff
      .filter((p) => p.subUnit === id && !UNIT_LEAD_TITLES.test(p.title))
      .sort((a, b) => b.experience - a.experience || a.id.localeCompare(b.id))[0]
    return { id, unit, name, kind, duty, ...(head ? { headId: head.id } : {}), active: true, createdAt: `${today.slice(0, 4)}-01-01T08:00:00` }
  })
}
