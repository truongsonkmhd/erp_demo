import { addDays } from "./dates.ts"
import { managesAllUnits } from "./access.ts"
import { roleUnitCode, unitCodeOf } from "./org.ts"
import type { Project, ProjectApproval, StoredProject, WbsItem } from "./types.ts"

/**
 * Figures of the projects other menus show (Tài chính, Dashboard…): technical progress from weighted WBS items, cost
 * from finance lines and paid payment dossiers, schedule figures from the project's dates; and who sees a project.
 * The Nhiệm vụ / Dự án pages work on the project API instead (workApi.ts).
 */

/**
 * Phòng Kỹ thuật creates projects and their tasks; the other units only view them and note on tasks. The unit is read
 * from the role's place in the organisation, not its name.
 */
export const PROJECT_UNIT = "KT"
/** Cost ahead of technical progress by more than this many points is flagged. */
export const OVERRUN_GAP = 10

/** A work item as projects see it; root = a directive (its progress already rolls up its sub-tasks). */
export type WorkLink = { project?: string; wbsItem?: string; progress: number; closed: boolean; overdue: boolean; pending: boolean; root: boolean }

export type ProjectContext = {
  lines: { project: string; paid: number }[]
  payments: { project?: string; amount?: number; status: string }[]
  work?: WorkLink[]
  today: string
}

/**
 * Weight of a WBS item = its share of the project's tasks (assigned work and sub-tasks; an item without tasks counts as one).
 * Items with assigned root work take the average progress of that work; the others keep the entered %.
 */
function wbsWithWork(p: StoredProject, work: WorkLink[]): WbsItem[] {
  const keyOf = (w: WbsItem, i: number) => w.id ?? String(i)
  const tasksOf = (key: string) => work.filter((x) => x.project === p.id && x.wbsItem === key).length
  const total = p.wbs.reduce((s, w, i) => s + Math.max(1, tasksOf(keyOf(w, i))), 0)
  return p.wbs.map((w, i) => {
    const key = keyOf(w, i)
    const tasks = tasksOf(key)
    const weight = Math.round((Math.max(1, tasks) / total) * 100)
    const linked = work.filter((x) => x.root && x.project === p.id && x.wbsItem === key)
    if (!linked.length) return { ...w, weight, tasks, linkedWork: 0 }
    const progress = clamp(linked.reduce((s, x) => s + x.progress, 0) / linked.length)
    return { ...w, weight, tasks, progress, linkedWork: linked.length, status: progress >= 100 ? "Hoàn thành" : progress > 0 ? "Đang thực hiện" : "Chưa bắt đầu" }
  })
}

const DAY = 86_400_000
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY)
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

/** Weighted average of WBS progress; items without a weight share equally. */
export function weightedProgress(wbs: WbsItem[]): number {
  if (!wbs.length) return 0
  const weighted = wbs.some((w) => w.weight)
  const total = weighted ? wbs.reduce((s, w) => s + (w.weight ?? 0), 0) : wbs.length
  if (!total) return 0
  return clamp(wbs.reduce((s, w) => s + (weighted ? w.weight ?? 0 : 1) * w.progress, 0) / total)
}

export function computeProject(stored: StoredProject, ctx: ProjectContext): Project {
  const work = ctx.work ?? []
  const p = { ...stored, wbs: wbsWithWork(stored, work) }
  const mine = work.filter((x) => x.project === p.id)
  const dated = !!(p.start && p.end)
  const technical = dated ? weightedProgress(p.wbs) : p.technical ?? weightedProgress(p.wbs)
  const linePaid = ctx.lines.filter((l) => l.project === p.id).reduce((s, l) => s + l.paid, 0) / 1000
  const paymentPaid = ctx.payments.filter((x) => x.project === p.id && x.status === "Đã chi").reduce((s, x) => s + (x.amount ?? 0), 0) / 1e9
  const costUsed = dated
    ? (p.budget > 0 ? Math.round(((linePaid + paymentPaid) / p.budget) * 100) : 0)
    : p.costUsed ?? 0
  // Legacy records keep their stored %; the amount shown is derived from it so both agree.
  const spent = Math.round((dated ? linePaid + paymentPaid : (p.budget * costUsed) / 100) * 100) / 100
  const done = p.status === "Hoàn thành" || technical >= 100
  let plannedPct: number | null = null
  let delayDays = p.delayDays ?? 0
  if (dated) {
    const start = p.start as string, end = p.end as string
    const span = Math.max(1, days(start, end))
    const elapsed = Math.max(0, days(start, ctx.today))
    plannedPct = clamp((elapsed / span) * 100)
    const overdue = Math.max(0, days(end, ctx.today))
    // Linear forecast: at the pace so far, how long the whole project takes.
    const forecast = technical > 0 && elapsed > 0 ? Math.max(0, Math.round((elapsed * 100) / technical) - span) : 0
    delayDays = done ? 0 : Math.max(overdue, forecast)
  }
  const crs = p.crs
  return {
    ...p,
    technical,
    costUsed,
    spent,
    plannedPct,
    delayDays,
    upcomingMilestones: p.milestones
      ? p.milestones.filter((m) => !m.doneAt && m.due >= ctx.today && m.due <= addDays(ctx.today, 30)).length
      : p.upcomingMilestones ?? 0,
    changeRequests: crs ? crs.length : p.changeRequests ?? 0,
    changeRequestsPending: crs ? crs.filter((c) => c.status === "Chờ duyệt").length : p.changeRequestsPending ?? 0,
    overdueWbs: p.wbs.filter((w) => w.end && w.end < ctx.today && w.progress < 100).length,
    workOpen: mine.filter((x) => !x.closed).length,
    workOverdue: mine.filter((x) => x.overdue).length,
    workPending: mine.filter((x) => x.pending).length,
  }
}

export const isOverrun = (p: Pick<Project, "costUsed" | "technical">) => p.costUsed - p.technical > OVERRUN_GAP

export const canCreateProject = (role: string) => roleUnitCode(role) === PROJECT_UNIT
/** Approves or rejects projects and change requests: whoever manages the whole organisation. */
export const isProjectApprover = (role: string) => managesAllUnits(role)
/** Projects from before approvals existed count as approved. */
export const approvalOf = (p: StoredProject): ProjectApproval => p.approval ?? "Đã duyệt"
/** The main unit and the supporting units (codes). */
export const projectUnits = (p: StoredProject): string[] => [...new Set([unitCodeOf(p.unit), ...(p.coUnits ?? [])].filter((u): u is string => !!u))]
/** The role's unit takes part in the project. */
export const isProjectMember = (p: StoredProject, role: string) => !!roleUnitCode(role) && projectUnits(p).includes(roleUnitCode(role) as string)
/** Phòng Kỹ thuật and the approver see every project; the units taking part see it once it is approved. */
export const canSeeProject = (p: StoredProject, role: string) =>
  canCreateProject(role) || isProjectApprover(role) || (approvalOf(p) === "Đã duyệt" && isProjectMember(p, role))
