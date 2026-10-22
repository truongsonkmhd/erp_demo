import { ROLE_TITLES } from "../workflow/rules.ts"
import { addDays } from "./dates.ts"
import { slaOf, type InboxRow } from "./inboxCore.ts"
import { roleUnitCode, unitCodeOf } from "./org.ts"
import type { ChangeRequest, ChangeRequestKind, Project, StoredProject, WbsItem } from "./types.ts"

/**
 * Projects created and followed on screen: technical progress from weighted WBS items, cost from finance lines and
 * paid payment dossiers, schedule figures from the project's dates.
 */

export const PROJECT_STATUSES = ["Chuẩn bị", "Đang thực hiện", "Tạm dừng", "Nghiệm thu", "Hoàn thành"] as const
export const CR_KINDS: ChangeRequestKind[] = ["Phạm vi", "Ngân sách", "Thời gian"]
/** Roles that create projects and edit their plan (dates, budget, WBS); the federation head only views (and decides CRs, gives work). */
export const PROJECT_CREATORS = ["kehoach"]
export const PROJECT_APPROVER = "lanhdao"
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

/** Reasons the project cannot be saved (empty when it can). isNew also checks the id is free. */
export function projectProblems(p: StoredProject, all: StoredProject[], isNew = false): string[] {
  const out: string[] = []
  if (!p.id.trim()) out.push("Vui lòng nhập mã dự án")
  if (isNew && all.some((x) => x.id === p.id)) out.push("Mã dự án đã tồn tại")
  if (!p.name.trim()) out.push("Vui lòng nhập tên dự án")
  if (!p.start || !p.end) out.push("Vui lòng nhập ngày bắt đầu và kết thúc")
  else if (p.end <= p.start) out.push("Ngày kết thúc phải sau ngày bắt đầu")
  if (!(p.budget > 0)) out.push("Ngân sách phải lớn hơn 0")
  if (p.wbs.some((w) => !w.name.trim())) out.push("Hạng mục WBS cần có tên")
  if (p.wbs.some((w) => w.start && w.end && w.end < w.start)) out.push("Hạng mục WBS có ngày kết thúc trước ngày bắt đầu")
  return out
}

/** WBS items dropped by an edit while work is still assigned to them (legacy items are keyed by their index). */
export function wbsRemovalProblems(prev: StoredProject, next: StoredProject, work: WorkLink[]): string[] {
  const kept = new Set(next.wbs.map((w, i) => w.id ?? String(i)))
  return prev.wbs.flatMap((w, i) => {
    const key = w.id ?? String(i)
    const n = work.filter((x) => x.project === prev.id && x.wbsItem === key).length
    return !kept.has(key) && n ? [`Không thể xóa hạng mục "${w.name}": đang có ${n} việc giao`] : []
  })
}

export const canCreateProject = (role: string) => PROJECT_CREATORS.includes(role)
/** Progress, milestones and change requests: the lead, the roles of the project's unit, and the creators. */
export const canUpdateProject = (p: StoredProject, role: string) => role !== PROJECT_APPROVER && (canCreateProject(role) || p.leadRole === role || (!!roleUnitCode(role) && roleUnitCode(role) === unitCodeOf(p.unit)))

export function updateWbs(p: StoredProject, progress: Record<string, number>, role: string, byName: string, note: string, now: string): StoredProject {
  if (!note.trim()) throw new Error("Vui lòng ghi nội dung công việc đã làm")
  const changes: { name: string; from: number; to: number }[] = []
  const wbs = p.wbs.map((w, i) => {
    const key = w.id ?? String(i)
    if (!(key in progress)) return w
    const to = clamp(progress[key])
    if (to !== w.progress) changes.push({ name: w.name, from: w.progress, to })
    return { ...w, progress: to, status: to >= 100 ? "Hoàn thành" : to > 0 ? "Đang thực hiện" : "Chưa bắt đầu" }
  })
  return { ...p, wbs, log: [...(p.log ?? []), { at: now, by: role, byName, note: note.trim(), changes }] }
}

export const toggleMilestone = (p: StoredProject, id: string, now: string): StoredProject => ({
  ...p,
  milestones: (p.milestones ?? []).map((m) => (m.id === id ? (m.doneAt ? { id: m.id, name: m.name, due: m.due } : { ...m, doneAt: now }) : m)),
})

export function addChangeRequest(
  p: StoredProject, input: { kind: ChangeRequestKind; content: string; newEnd?: string; newBudget?: number }, by: string, now: string,
): StoredProject {
  if (!input.content.trim()) throw new Error("Vui lòng nhập nội dung đề xuất")
  if (input.kind === "Thời gian" && !input.newEnd) throw new Error("Vui lòng chọn ngày kết thúc mới")
  if (input.kind === "Ngân sách" && !(Number(input.newBudget) > 0)) throw new Error("Vui lòng nhập ngân sách mới")
  const cr: ChangeRequest = {
    id: `CR-${(p.crs?.length ?? 0) + 1}-${Date.parse(now).toString(36).toUpperCase()}`, kind: input.kind, content: input.content.trim(), by, at: now,
    status: "Chờ duyệt", ...(input.kind === "Thời gian" ? { newEnd: input.newEnd } : {}), ...(input.kind === "Ngân sách" ? { newBudget: Number(input.newBudget) } : {}),
  }
  return { ...p, crs: [...(p.crs ?? []), cr] }
}

/** Approving a Thời gian / Ngân sách request moves the project's end date / budget. */
export function decideChangeRequest(p: StoredProject, id: string, decision: "Đã duyệt" | "Từ chối", note: string, now: string): StoredProject {
  const cr = (p.crs ?? []).find((c) => c.id === id)
  if (!cr || cr.status !== "Chờ duyệt") throw new Error("Yêu cầu không còn chờ duyệt")
  if (decision === "Từ chối" && !note.trim()) throw new Error("Vui lòng ghi lý do từ chối")
  const crs = (p.crs ?? []).map((c) => (c.id === id ? { ...c, status: decision, decidedAt: now, ...(note.trim() ? { note: note.trim() } : {}) } : c))
  if (decision !== "Đã duyệt") return { ...p, crs }
  return {
    ...p, crs,
    ...(cr.kind === "Thời gian" && cr.newEnd ? { end: cr.newEnd } : {}),
    ...(cr.kind === "Ngân sách" && cr.newBudget ? { budget: cr.newBudget } : {}),
  }
}

/** Pending change requests, one inbox row per project, for the approver. */
export function projectCrRows(projects: StoredProject[], role: string, today: string): InboxRow[] {
  if (role !== PROJECT_APPROVER) return []
  return projects.flatMap((p) => {
    const pending = (p.crs ?? []).filter((c) => c.status === "Chờ duyệt")
    if (!pending.length) return []
    const due = addDays(pending[0].at.slice(0, 10), 5)
    const sla = slaOf(due, today)
    return [{
      id: p.id, kind: "project" as const, type: "Yêu cầu thay đổi dự án", title: `${p.id}: ${pending.length} yêu cầu thay đổi chờ duyệt`,
      source: "Nhiệm vụ / Dự án", from: ROLE_TITLES[pending[0].by] || pending[0].by, owner: ROLE_TITLES[role] || role, status: "Chờ duyệt",
      priority: "Trung bình", due, slaText: sla.text, overdue: sla.overdue, mine: true, open: "projectOpen",
    }]
  })
}
