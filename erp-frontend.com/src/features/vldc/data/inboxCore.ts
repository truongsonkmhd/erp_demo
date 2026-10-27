import { ROLE_TITLES, isClosed } from "../workflow/rules.ts"
import type { WorkItem } from "../workflow/types.ts"
import { addDays } from "./dates.ts"
import type { InboxTask } from "./types.ts"

/**
 * One inbox for the role: workflow items (directives, delegated tasks, payment dossiers) and the
 * department task inbox, normalised to the same row shape and grouped by urgency.
 */

export type InboxRow = {
  id: string
  kind: "work" | "task" | "doc" | "topic" | "project"
  type: string
  title: string
  source: string
  from: string
  owner: string
  status: string
  priority: string
  due?: string
  slaText: string
  overdue: boolean
  /** The role is the owner (must act) – otherwise it only follows (CC). */
  mine: boolean
  /** Inline handler that opens the right detail modal. */
  open: string
  /** Project (id) the row belongs to: it is listed inside that project. */
  project?: string
  /** A Nhiệm vụ: listed on its own, beside the projects. */
  standalone?: boolean
}

export type InboxScope = "mine" | "all"
export type UrgencyGroup = "overdue" | "today" | "week" | "later"
export const GROUP_LABELS: Record<UrgencyGroup, string> = { overdue: "Quá hạn", today: "Hôm nay", week: "Trong 7 ngày", later: "Sau / chưa có hạn" }

const WORK_TYPES: Record<WorkItem["type"], string> = { directive: "Chỉ đạo", task: "Việc được giao", payment: "Hồ sơ thanh toán", proposal: "Nhiệm vụ" }
const WORK_SOURCES: Record<WorkItem["type"], string> = { directive: "Giao việc", task: "Giao việc", payment: "Thanh toán liên phòng", proposal: "Nhiệm vụ / Dự án" }
/** Inbox task statuses that mean the role's step is finished. */
const TASK_DONE = new Set(["Hoàn thành bước", "Đã bàn giao", "Hoàn thành", "Đã duyệt"])

const roleTitle = (r: string) => ROLE_TITLES[r] || r
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)

/** "Quá 2 ngày" / "Hôm nay" / "Còn 3 ngày". */
export function slaOf(due: string, today: string): { text: string; overdue: boolean } {
  const d = daysBetween(today, due)
  return d < 0 ? { text: `Quá ${-d} ngày`, overdue: true } : d === 0 ? { text: "Hôm nay", overdue: false } : { text: `Còn ${d} ngày`, overdue: false }
}

export function inboxRows(work: WorkItem[], tasks: InboxTask[], role: string, scope: InboxScope, today: string): InboxRow[] {
  const all = scope === "all"
  const fromWork = work
    .filter((x) => !isClosed(x) && (all || x.owner === role || x.cc.includes(role)))
    .map((x): InboxRow => {
      const sla = slaOf(x.due, today)
      return {
        id: x.id, kind: "work", type: WORK_TYPES[x.type], title: x.title, source: WORK_SOURCES[x.type], from: roleTitle(x.createdBy),
        owner: roleTitle(x.owner), status: x.status, priority: x.priority, due: x.due, slaText: sla.text, overdue: sla.overdue,
        mine: x.owner === role, open: "wfOpen",
        ...(x.type === "proposal" ? { standalone: true } : x.project ? { project: x.project } : {}),
      }
    })
  const fromTasks = tasks
    .filter((t) => !TASK_DONE.has(t.status) && (all || t.owner === role || (t.cc ?? []).includes(role)))
    .map((t): InboxRow => {
      const sla = t.due ? slaOf(t.due, today) : { text: t.sla, overdue: t.overdue }
      return {
        id: t.id, kind: "task", type: t.type, title: t.title, source: t.source, from: t.from, owner: roleTitle(t.owner), status: t.status,
        priority: t.priority, due: t.due, slaText: sla.text, overdue: sla.overdue, mine: t.owner === role, open: "taskInboxDetail",
      }
    })
  return [...fromWork, ...fromTasks]
}

export function urgencyOf(row: InboxRow, today: string): UrgencyGroup {
  if (row.overdue) return "overdue"
  if (!row.due) return /Hôm nay|\d+\s*h\b/.test(row.slaText) ? "today" : "later"
  if (row.due <= today) return "today"
  return row.due <= addDays(today, 7) ? "week" : "later"
}

const PRIORITY_RANK: Record<string, number> = { Cao: 0, "Trung bình": 1, Thấp: 2 }
export type InboxSort = "due" | "priority"

export function sortRows(rows: InboxRow[], sort: InboxSort): InboxRow[] {
  const byDue = (a: InboxRow, b: InboxRow) => (a.due ?? "9999").localeCompare(b.due ?? "9999")
  const byPriority = (a: InboxRow, b: InboxRow) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3)
  return [...rows].sort((a, b) => (sort === "due" ? byDue(a, b) || byPriority(a, b) : byPriority(a, b) || byDue(a, b)) || a.id.localeCompare(b.id))
}

export function groupRows(rows: InboxRow[], today: string): Record<UrgencyGroup, InboxRow[]> {
  const groups: Record<UrgencyGroup, InboxRow[]> = { overdue: [], today: [], week: [], later: [] }
  for (const r of rows) groups[urgencyOf(r, today)].push(r)
  return groups
}

/**
 * The list as folders: each project holds its rows, a Nhiệm vụ stands beside the projects, and the rest (payments
 * outside projects, department tasks, documents…) is gathered under "Việc khác" at the end. Entries keep the order of
 * their first row, so sorting the rows first sorts the list.
 */
export type InboxEntry = { kind: "group"; key: string; rows: InboxRow[] } | { kind: "row"; row: InboxRow }
export const OTHER_GROUP = "__other"

export function inboxTree(rows: InboxRow[]): InboxEntry[] {
  const entries: InboxEntry[] = []
  const groups = new Map<string, InboxRow[]>()
  const other: InboxRow[] = []
  for (const r of rows) {
    if (r.standalone) entries.push({ kind: "row", row: r })
    else if (!r.project) other.push(r)
    else if (groups.has(r.project)) groups.get(r.project)?.push(r)
    else {
      const list = [r]
      groups.set(r.project, list)
      entries.push({ kind: "group", key: r.project, rows: list })
    }
  }
  return other.length ? [...entries, { kind: "group", key: OTHER_GROUP, rows: other }] : entries
}

export type InboxFilter = "mine" | "overdue" | "today" | "cc" | "all"

export function inboxCounts(rows: InboxRow[], today: string) {
  return {
    mine: rows.filter((r) => r.mine).length,
    overdue: rows.filter((r) => r.overdue).length,
    today: rows.filter((r) => urgencyOf(r, today) === "today").length,
    cc: rows.filter((r) => !r.mine).length,
  }
}

export function applyFilter(rows: InboxRow[], filter: InboxFilter, today: string, query = "", source = ""): InboxRow[] {
  const q = query.trim().toLowerCase()
  return rows.filter((r) =>
    (filter === "all" || (filter === "mine" && r.mine) || (filter === "cc" && !r.mine) || (filter === "overdue" && r.overdue) || (filter === "today" && urgencyOf(r, today) === "today")) &&
    (!source || r.source === source) &&
    (!q || `${r.id} ${r.title} ${r.type} ${r.source} ${r.from}`.toLowerCase().includes(q)))
}
