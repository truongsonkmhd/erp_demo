import { addDays } from "./dates.ts"
import { unitKey } from "./org.ts"
import type { Education, StaffProfile } from "./types.ts"

export const EDUCATION_LEVELS: Education[] = ["Tiến sĩ", "Thạc sĩ", "Kỹ sư/Cử nhân", "KTV/Công nhân"]
export type ExpBand = "under5" | "from5to15" | "over15"
export type AgeBand = "under30" | "30to45" | "over45"
export type StaffFilter = {
  query: string; unit: string; education: string; age: "" | AgeBand; exp: "" | ExpBand; cert: "" | "expiring"; onField: "" | "yes" | "no"
}
export type StaffSort = "name" | "age" | "education" | "experience" | "unit"
export const EMPTY_STAFF_FILTER: StaffFilter = { query: "", unit: "", education: "", age: "", exp: "", cert: "", onField: "" }
/** A certificate counts as "expiring" within this many days. */
export const CERT_WARN_DAYS = 60

export const ageOf = (p: StaffProfile, today: string) => Number(today.slice(0, 4)) - p.birthYear
export const expBand = (years: number): ExpBand => (years < 5 ? "under5" : years <= 15 ? "from5to15" : "over15")
export const ageBand = (age: number): AgeBand => (age < 30 ? "under30" : age <= 45 ? "30to45" : "over45")

export function certState(expiry: string, today: string): "expired" | "expiring" | "valid" {
  if (expiry < today) return "expired"
  return expiry <= addDays(today, CERT_WARN_DAYS) ? "expiring" : "valid"
}

export function capabilityStats(staff: StaffProfile[]) {
  const byEducation = Object.fromEntries(EDUCATION_LEVELS.map((e) => [e, 0])) as Record<Education, number>
  const byUnit: Record<string, number> = {}
  const exp: Record<ExpBand, number> = { under5: 0, from5to15: 0, over15: 0 }
  for (const p of staff) {
    byEducation[p.education] = (byEducation[p.education] ?? 0) + 1
    byUnit[p.unit] = (byUnit[p.unit] ?? 0) + 1
    exp[expBand(p.experience)]++
  }
  return { total: staff.length, byEducation, byUnit, ...exp }
}

export function filterStaff(staff: StaffProfile[], f: StaffFilter, today: string): StaffProfile[] {
  const q = unitKey(f.query.trim())
  return staff.filter((p) =>
    (!q || unitKey(`${p.name} ${p.major} ${p.title} ${p.id}`).includes(q))
    && (!f.unit || p.unit === f.unit)
    && (!f.education || p.education === f.education)
    && (!f.age || ageBand(ageOf(p, today)) === f.age)
    && (!f.exp || expBand(p.experience) === f.exp)
    && (!f.cert || p.certs.some((c) => certState(c.expiry, today) !== "valid"))
    && (!f.onField || p.onField === (f.onField === "yes")))
}

const givenName = (name: string) => name.trim().split(/\s+/).pop() ?? ""

export function sortStaff(staff: StaffProfile[], key: StaffSort, dir: 1 | -1, today: string): StaffProfile[] {
  const cmp = (a: StaffProfile, b: StaffProfile): number => {
    switch (key) {
      case "age": return ageOf(a, today) - ageOf(b, today)
      case "experience": return a.experience - b.experience
      case "education": return EDUCATION_LEVELS.indexOf(a.education) - EDUCATION_LEVELS.indexOf(b.education)
      case "unit": return a.unit.localeCompare(b.unit)
      default: return givenName(a.name).localeCompare(givenName(b.name), "vi") || a.name.localeCompare(b.name, "vi")
    }
  }
  return [...staff].sort((a, b) => dir * cmp(a, b) || a.id.localeCompare(b.id))
}

/** Staff from this age on are flagged for succession planning. */
export const RETIRE_AGE = 58

export type CertAlert = { person: StaffProfile; cert: StaffProfile["certs"][number]; state: "expired" | "expiring" }

/** HR overview: field share per unit (in first-seen order), certificates to renew (soonest first), age structure. */
export function hrSummary(staff: StaffProfile[], today: string) {
  const units = new Map<string, { unit: string; total: number; onField: number }>()
  const ageBands: Record<AgeBand, number> = { under30: 0, "30to45": 0, over45: 0 }
  const certAlerts: CertAlert[] = []
  for (const p of staff) {
    const u = units.get(p.unit) ?? { unit: p.unit, total: 0, onField: 0 }
    u.total++
    if (p.onField) u.onField++
    units.set(p.unit, u)
    ageBands[ageBand(ageOf(p, today))]++
    for (const cert of p.certs) {
      const state = certState(cert.expiry, today)
      if (state !== "valid") certAlerts.push({ person: p, cert, state })
    }
  }
  certAlerts.sort((a, b) => a.cert.expiry.localeCompare(b.cert.expiry))
  return {
    total: staff.length,
    onField: staff.filter((p) => p.onField).length,
    units: [...units.values()],
    certAlerts,
    certExpired: new Set(certAlerts.filter((a) => a.state === "expired").map((a) => a.person.id)).size,
    certExpiring: new Set(certAlerts.filter((a) => a.state === "expiring").map((a) => a.person.id)).size,
    ageBands,
    retiring: sortStaff(staff.filter((p) => ageOf(p, today) >= RETIRE_AGE), "age", -1, today),
  }
}
