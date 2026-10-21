import { addDays, isoFromVn } from "./dates.ts"
import type { Disbursement, Equipment, FinanceLine, Meeting, OrgStats, Project, Risk, StaffSkill } from "./types.ts"

/** Headline figures computed from stored records, so tiles always agree with the tables under them. */

const sum = <T>(rows: T[], pick: (r: T) => number) => rows.reduce((s, r) => s + pick(r), 0)
const avg = <T>(rows: T[], pick: (r: T) => number) => (rows.length ? Math.round(sum(rows, pick) / rows.length) : 0)

export const riskScore = (r: Risk) => r.probability * r.impact
export const riskLevel = (r: Risk): "Cao" | "TB" | "Thấp" => (riskScore(r) >= 15 ? "Cao" : riskScore(r) >= 8 ? "TB" : "Thấp")
export const openRisks = (risks: Risk[]) => risks.filter((r) => r.open).sort((a, b) => riskScore(b) - riskScore(a))

/** Cost running ahead of technical progress by more than 10 points. */
export const isOverrun = (p: Project) => p.costUsed - p.technical > 10

export function projectMetrics(projects: Project[], risks: Risk[]) {
  const open = openRisks(risks)
  return {
    count: projects.length,
    late: projects.filter((p) => p.delayDays > 0).length,
    milestones: sum(projects, (p) => p.upcomingMilestones),
    openRisks: open.length,
    highRisks: open.filter((r) => riskLevel(r) === "Cao").length,
    changeRequests: sum(projects, (p) => p.changeRequests),
    changeRequestsPending: sum(projects, (p) => p.changeRequestsPending),
    overruns: projects.filter(isOverrun).length,
  }
}

/** Money: lines in million VND, disbursement in billion VND. */
export function financeMetrics(lines: FinanceLine[], months: Disbursement[]) {
  const sorted = [...months].sort((a, b) => a.month - b.month)
  const reached = sorted.filter((m) => m.actual != null)
  const plan = sorted.at(-1)?.plan ?? 0
  const paid = reached.at(-1)?.actual ?? 0
  const budget = sum(lines, (l) => l.budget)
  const committed = sum(lines, (l) => l.committed)
  return {
    plan,
    paid,
    disbursedPct: plan ? Math.round((paid / plan) * 100) : 0,
    planToDate: reached.at(-1)?.plan ?? 0,
    budget,
    committed,
    committedPct: budget ? Math.round((committed / budget) * 100) : 0,
    linePaid: sum(lines, (l) => l.paid),
  }
}

export const inspectionSoon = (e: Equipment, today: string, days = 30) => e.inspectionDue <= addDays(today, days)

export function equipmentMetrics(rows: Equipment[], today: string) {
  return {
    total: sum(rows, (e) => e.quantity),
    models: rows.length,
    inUse: sum(rows.filter((e) => e.status === "Đang sử dụng"), (e) => e.quantity),
    utilization: avg(rows, (e) => e.utilization),
    dueSoon: rows.filter((e) => inspectionSoon(e, today)).length,
    repairCost: sum(rows, (e) => e.repairCost),
    groups: new Set(rows.map((e) => e.group)).size,
  }
}

export function hrMetrics(stats: OrgStats | undefined, staff: StaffSkill[], today: string) {
  return {
    total: stats?.total ?? staff.length,
    onField: staff.filter((s) => s.onField).length,
    certSoon: staff.filter((s) => s.certExpiry <= addDays(today, 60)).length,
    gisExperts: staff.filter((s) => s.gis >= 4).length,
  }
}

export function meetingMetrics(meetings: Meeting[], today: string) {
  const upcoming = meetings.filter((m) => isoFromVn(m.date) >= today)
  return {
    upcoming: upcoming.length,
    openConclusions: sum(meetings, (m) => m.openConclusions),
    actions: sum(meetings, (m) => m.actions),
    docs: sum(meetings, (m) => m.docs),
  }
}

/** Upcoming meetings first (soonest first), then past ones (latest first). */
export function sortMeetings(meetings: Meeting[], today: string): Meeting[] {
  const key = (m: Meeting) => isoFromVn(m.date)
  const up = meetings.filter((m) => key(m) >= today).sort((a, b) => key(a).localeCompare(key(b)))
  const past = meetings.filter((m) => key(m) < today).sort((a, b) => key(b).localeCompare(key(a)))
  return [...up, ...past]
}
