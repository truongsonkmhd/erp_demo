import { ROLE_TITLES } from "../workflow/rules.ts"
import { addDays } from "./dates.ts"
import { slaOf, type InboxRow } from "./inboxCore.ts"
import { managesAllUnits } from "./access.ts"
import { roleUnitCode, unitCodeOf } from "./org.ts"
import type { ChangeRequest, ChangeRequestKind, Project, ProjectApproval, StoredProject, WbsItem } from "./types.ts"

/**
 * Projects created and followed on screen: technical progress from weighted WBS items, cost from finance lines and
 * paid payment dossiers, schedule figures from the project's dates.
 */

export const PROJECT_STATUSES = ["Chuẩn bị", "Đang thực hiện", "Tạm dừng", "Nghiệm thu", "Hoàn thành"] as const
export const CR_KINDS: ChangeRequestKind[] = ["Phạm vi", "Ngân sách", "Thời gian"]
/**
 * Phòng Kỹ thuật creates projects and their tasks; the other units only view them and note on tasks. The unit is read
 * from the role's place in the organisation, not its name.
 */
export const PROJECT_UNIT = "KT"
/** Role notified of projects and change requests to decide (the federation head). */
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
/** Tasks are created by Phòng Kỹ thuật, in approved projects only. */
export const canCreateTask = (p: StoredProject, role: string) => canCreateProject(role) && approvalOf(p) === "Đã duyệt"
/** Progress, milestones and change requests: Phòng Kỹ thuật and the project's lead (chủ nhiệm). */
export const canUpdateProject = (p: StoredProject, role: string) => !isProjectApprover(role) && (canCreateProject(role) || p.leadRole === role)
/**
 * Deleting a project takes two people: its creator asks (with a reason) and the federation head confirms. Its tasks are
 * not deleted with it: each belongs to whoever created it (Phòng Kỹ thuật, or the unit head for its sub-tasks), so the
 * project can only go once it has no task left.
 */
export const canRequestDelete = (p: StoredProject, role: string) => !!p.createdBy && p.createdBy === role && !p.deleteRequest

/** Why the project cannot go yet: it still has tasks, which only their creators delete ("" when it has none). */
export const deleteBlocker = (liveWork: number) =>
  liveWork ? `Dự án còn ${liveWork} việc. Người tạo từng việc (Phòng Kỹ thuật, trưởng các phòng/đoàn với việc con) cần xoá việc của mình trước.` : ""

export function requestDelete(p: StoredProject, role: string, reason: string, now: string, liveWork: number): StoredProject {
  if (!canRequestDelete(p, role)) throw new Error("Chỉ người tạo dự án được đề nghị xoá")
  if (deleteBlocker(liveWork)) throw new Error(deleteBlocker(liveWork))
  if (!reason.trim()) throw new Error("Vui lòng ghi lý do xoá dự án")
  const next: StoredProject = { ...p, deleteRequest: { by: role, at: now, reason: reason.trim() } }
  delete next.deleteRefusal
  return next
}

/** The creator withdraws the request. */
export function cancelDeleteRequest(p: StoredProject, role: string): StoredProject {
  if (p.deleteRequest?.by !== role) throw new Error("Chỉ người đề nghị được huỷ đề nghị xoá")
  const next = { ...p }
  delete next.deleteRequest
  return next
}

/** The federation head confirms (the project is deleted) or keeps the project (with a reason). */
export function decideDelete(p: StoredProject, confirm: boolean, note: string, role: string, now: string, liveWork: number): StoredProject {
  if (!p.deleteRequest) throw new Error("Dự án không có đề nghị xoá")
  if (!isProjectApprover(role)) throw new Error("Chỉ Liên đoàn trưởng xác nhận xoá dự án")
  if (confirm && deleteBlocker(liveWork)) throw new Error(deleteBlocker(liveWork))
  if (confirm) return { ...p, deletedAt: now, deletedBy: role }
  if (!note.trim()) throw new Error("Vui lòng ghi lý do không xoá")
  const next: StoredProject = { ...p, deleteRefusal: note.trim() }
  delete next.deleteRequest
  return next
}

/** Projects whose deletion waits for the federation head, one inbox row each. */
export function projectDeleteRows(projects: StoredProject[], role: string, today: string): InboxRow[] {
  if (!isProjectApprover(role)) return []
  return projects.filter((p) => p.deleteRequest).map((p) => {
    const req = p.deleteRequest as NonNullable<StoredProject["deleteRequest"]>
    const due = addDays(req.at.slice(0, 10), 3)
    const sla = slaOf(due, today)
    return {
      id: p.id, kind: "project" as const, type: "Xác nhận xoá dự án", title: `${p.id}: ${p.name} – ${req.reason}`, source: "Nhiệm vụ / Dự án",
      from: ROLE_TITLES[req.by] || req.by, owner: ROLE_TITLES[role] || role, status: "Chờ xác nhận",
      priority: "Cao", due, slaText: sla.text, overdue: sla.overdue, mine: true, open: "projectOpen",
    }
  })
}

/**
 * A project saved from the form: a new one is recorded with its creator and waits for approval; a rejected one goes
 * back to the approver; an approved or pending one keeps its state.
 */
export function submitProject(prev: StoredProject | undefined, next: StoredProject, role: string): StoredProject {
  if (!prev) return { ...next, createdBy: role, approval: "Chờ duyệt" }
  if (approvalOf(prev) !== "Từ chối") return next
  const resubmitted: StoredProject = { ...next, approval: "Chờ duyệt" }
  delete resubmitted.approvalNote
  delete resubmitted.decidedAt
  return resubmitted
}

/** The approver's decision on a pending project; rejecting needs a reason. */
export function decideProject(p: StoredProject, decision: "Đã duyệt" | "Từ chối", note: string, now: string): StoredProject {
  if (approvalOf(p) !== "Chờ duyệt") throw new Error("Dự án không còn chờ duyệt")
  if (decision === "Từ chối" && !note.trim()) throw new Error("Vui lòng ghi lý do từ chối")
  return { ...p, approval: decision, decidedAt: now, ...(note.trim() ? { approvalNote: note.trim() } : {}) }
}

/** Projects waiting for the approver, one inbox row each. */
export function projectApprovalRows(projects: StoredProject[], role: string, today: string): InboxRow[] {
  if (!isProjectApprover(role)) return []
  return projects.filter((p) => approvalOf(p) === "Chờ duyệt").map((p) => {
    const due = addDays(p.start ?? today, 5)
    const sla = slaOf(due, today)
    return {
      id: p.id, kind: "project" as const, type: "Phê duyệt dự án", title: `${p.id}: ${p.name}`, source: "Nhiệm vụ / Dự án",
      from: ROLE_TITLES[p.createdBy ?? ""] || p.createdBy || "Phòng Kỹ thuật", owner: ROLE_TITLES[role] || role, status: "Chờ duyệt",
      priority: "Cao", due, slaText: sla.text, overdue: sla.overdue, mine: true, open: "projectOpen",
    }
  })
}

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
  if (!isProjectApprover(role)) return []
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
