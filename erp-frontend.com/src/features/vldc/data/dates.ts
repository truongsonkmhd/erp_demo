/** Seed dates are relative to "today" ("yyyy-mm-dd") so the demo never goes stale. */

export function addDays(today: string, days: number): string {
  const d = new Date(`${today}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "2026-10-08" → "08/10/2026". */
export const vnDate = (iso: string) => iso.split("-").reverse().join("/")

/** "dd/mm/yyyy" → "yyyy-mm-dd" (for comparisons). */
export const isoFromVn = (vn: string) => vn.split("/").reverse().join("-")

export const localToday = () => new Date().toLocaleDateString("sv-SE")
