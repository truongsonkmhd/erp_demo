import type { CashEntry, Disbursement, StoredProject } from "./types.ts"

/**
 * Giải ngân of the current year from the records already kept: the plan spreads each project's budget over its
 * dates (projects without dates over the whole year), the actual adds up the phiếu chi of the Thu – Chi ledger.
 * Both are cumulative by month, in billion VND (unrounded, shown in full đồng), like the stored Disbursement rows they replace.
 */

const DAY = 86_400_000
const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
const monthEnd = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)

/** Budget (tỷ) of a project spent evenly over its days, counted from the year start up to `until` (inclusive). */
function plannedBy(p: Pick<StoredProject, "budget" | "start" | "end">, year: number, until: string): number {
  const yStart = `${year}-01-01`, yEnd = `${year}-12-31`
  const start = p.start && p.end ? p.start : yStart
  const end = p.start && p.end ? p.end : yEnd
  const days = (t(end) - t(start)) / DAY + 1
  const from = Math.max(t(start), t(yStart)), to = Math.min(t(end), t(until))
  if (days <= 0 || to < from) return 0
  return (p.budget || 0) * (((to - from) / DAY + 1) / days)
}

export function disbursementSeries(projects: Pick<StoredProject, "budget" | "start" | "end">[], entries: CashEntry[], today: string): Disbursement[] {
  const year = Number(today.slice(0, 4)), current = Number(today.slice(5, 7))
  const spent = entries.filter((e) => e.kind === "chi" && !e.deleted && e.date.startsWith(`${year}-`))
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1, end = monthEnd(year, month)
    const actual = spent.filter((e) => e.date <= end).reduce((s, e) => s + e.amount, 0) / 1e9
    return {
      id: `M${String(month).padStart(2, "0")}`, month,
      plan: projects.reduce((s, p) => s + plannedBy(p, year, end), 0),
      actual: month <= current ? actual : null,
    }
  })
}

/** Plain figures for the chart header, in VND: year plan, plan up to today, spent so far, and how far behind (gap > 0). */
export function disbursementSummary(projects: Pick<StoredProject, "budget" | "start" | "end">[], entries: CashEntry[], today: string) {
  const year = Number(today.slice(0, 4))
  const plan = (until: string) => projects.reduce((s, p) => s + plannedBy(p, year, until), 0) * 1e9
  const yearPlan = plan(`${year}-12-31`), planToDate = plan(today)
  const spent = entries.filter((e) => e.kind === "chi" && !e.deleted && e.date.startsWith(`${year}-`) && e.date <= today).reduce((s, e) => s + e.amount, 0)
  return {
    yearPlan, planToDate, spent,
    pctOfPlanToDate: planToDate ? Math.round((spent / planToDate) * 100) : 0,
    pctOfYear: yearPlan ? Math.round((spent / yearPlan) * 100) : 0,
    gap: planToDate - spent,
  }
}
