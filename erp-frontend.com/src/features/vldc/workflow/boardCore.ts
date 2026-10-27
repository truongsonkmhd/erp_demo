import { ROLE_TITLES, TASK_STATUSES, allowedActions, blockedReason, isClosed, isFreelyMovable, isPendingProposal, reviewerOf, type WorkAction } from "./rules.ts"
import type { WorkItem, WorkStatus } from "./types.ts"

/**
 * Board (Jira style) of a project or of the proposals space: status columns, the action a drag from one column to
 * another stands for, quick filters and swimlanes. Pure: the rules stay in rules.ts, the HTML in boardViews.ts.
 */

/** `also`: older statuses shown in this column (records from before the flow was simplified). */
export type Column = { key: string; title: string; status: WorkStatus; also?: WorkStatus[]; collapsed?: boolean }

export const PROJECT_COLUMNS: Column[] = [
  { key: "new", title: "Mới giao", status: "Mới giao" },
  { key: "doing", title: "Đang thực hiện", status: "Đang thực hiện" },
  { key: "review", title: "Chờ duyệt", status: "Chờ duyệt" },
  { key: "done", title: "Hoàn thành", status: "Hoàn thành" },
]

/** Nhiệm vụ: Chờ duyệt, Đang thực hiện, Hoàn thành, Từ chối. */
export const PROPOSAL_COLUMNS: Column[] = [
  { key: "proposed", title: "Chờ duyệt", status: "Chờ duyệt đề xuất", also: ["Bị trả lại"] },
  { key: "doing", title: "Đang thực hiện", status: "Đang thực hiện", also: ["Chờ duyệt"] },
  { key: "done", title: "Hoàn thành", status: "Hoàn thành" },
  { key: "rejected", title: "Từ chối", status: "Từ chối" },
]

/** Closed work stays on the board this many days after its last step; older ones are in the list view. */
export const DONE_DAYS = 14

const DAY = 86_400_000
const lastStep = (x: WorkItem) => x.history.at(-1)?.at ?? x.updatedAt

export type BoardColumn = { column: Column; items: WorkItem[]; hidden: number }

/** Items per column by due date; closed columns keep only recent work and count the rest. */
export function boardColumns(items: WorkItem[], columns: Column[], today: string): BoardColumn[] {
  const since = Date.parse(`${today}T00:00:00Z`) - DONE_DAYS * DAY
  return columns.map((column) => {
    const all = items.filter((x) => x.status === column.status || !!column.also?.includes(x.status)).sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id))
    if (column.status !== "Hoàn thành" && column.status !== "Từ chối") return { column, items: all, hidden: 0 }
    const recent = all.filter((x) => Date.parse(lastStep(x)) >= since)
    return { column, items: recent, hidden: all.length - recent.length }
  })
}

/** What a drop means: the action to run, whether it needs a reason, or (a returned proposal) its edit page. */
export type Transition = { action: WorkAction; needsNote: boolean; edit: boolean }

const MOVES: Record<string, Transition> = {
  "Mới giao>Đang thực hiện": { action: "accept", needsNote: false, edit: false },
  "Đang thực hiện>Chờ duyệt": { action: "submit", needsNote: false, edit: false },
  "Chờ duyệt>Hoàn thành": { action: "approve", needsNote: false, edit: false },
  "Chờ duyệt>Đang thực hiện": { action: "return", needsNote: true, edit: false },
  "Chờ duyệt đề xuất>Đang thực hiện": { action: "endorse", needsNote: false, edit: false },
  "Chờ duyệt đề xuất>Từ chối": { action: "reject", needsNote: true, edit: false },
}

/** Nhiệm vụ moves that differ from project work: done straight from under way (no acceptance step). */
const PROPOSAL_MOVES: Record<string, Transition> = {
  "Đang thực hiện>Hoàn thành": { action: "submit", needsNote: false, edit: false },
}

/** The move a drop stands for, by the item's kind. */
const moveOf = (item: WorkItem, target: WorkStatus): Transition | undefined =>
  (item.type === "proposal" ? PROPOSAL_MOVES[`${item.status}>${target}`] : undefined) ?? MOVES[`${item.status}>${target}`]
const nextStatuses = (item: WorkItem) =>
  [...Object.keys(MOVES), ...(item.type === "proposal" ? Object.keys(PROPOSAL_MOVES) : [])].filter((k) => k.startsWith(`${item.status}>`)).map((k) => k.split(">")[1])

const FREE_MOVE: Transition = { action: "move", needsNote: false, edit: false }

/**
 * The move the role may make by dropping the item on the target status, or null. With `free` (Phòng Kỹ thuật on a
 * project board) any project task goes to any status; everyone else drags only work given to them, one step at a time
 * (approving or returning someone else's work is done in the task's panel).
 */
export function transitionFor(item: WorkItem, target: WorkStatus, role: string, perms: string[], all: WorkItem[], free = false): Transition | null {
  if (item.status === target) return null
  if (free && isFreelyMovable(item) && TASK_STATUSES.includes(target)) return FREE_MOVE
  const move = moveOf(item, target)
  return move && item.owner === role && allowedActions(item, role, perms, all).includes(move.action) ? move : null
}

const VERBS: Partial<Record<WorkAction, string>> = {
  accept: "nhận việc", submit: "báo cáo hoàn thành", approve: "duyệt hoàn thành", return: "trả lại",
  endorse: "duyệt đề xuất", reject: "từ chối đề xuất", resubmit: "sửa và gửi lại đề xuất",
}

/** Who takes this step on the item, and how that person is called. */
function stepOwner(item: WorkItem, action: WorkAction): [string, string] {
  if (action === "accept" || action === "submit") return [item.owner, "người chủ trì"]
  if (action === "resubmit") return [item.createdBy, "người đề xuất"]
  if (isPendingProposal(item)) return [item.approver ?? item.owner, "người duyệt đề xuất"]
  return [reviewerOf(item), item.type === "proposal" ? "người duyệt đề xuất" : "người giao việc"]
}

/**
 * Why dropping the item on the target status does nothing, in words for the role ("" when the move is allowed):
 * a step that does not exist from here, someone else's step, a missing permission, or open sub-tasks.
 */
export function moveHint(item: WorkItem, target: WorkStatus, role: string, perms: string[], all: WorkItem[], free = false): string {
  if (item.status === target || transitionFor(item, target, role, perms, all, free)) return ""
  if (free && isFreelyMovable(item)) return `Việc không chuyển được sang "${target}".`
  const move = moveOf(item, target)
  // The giver's step on someone else's work: allowed, but from the task's panel, not by dragging.
  if (move && item.owner !== role && allowedActions(item, role, perms, all).includes(move.action)) {
    return `Bạn chỉ kéo thả việc được giao cho mình. ${move.action === "approve" ? "Duyệt" : "Trả lại"} việc này trong chi tiết việc (bấm vào thẻ).`
  }
  if (!move) {
    const next = nextStatuses(item).map((k) => `"${k}"`)
    return next.length
      ? `Không chuyển thẳng từ "${item.status}" sang "${target}". Bước tiếp theo: ${next.join(" hoặc ")}.`
      : `Việc ở trạng thái "${item.status}" không chuyển tiếp được.`
  }
  if (allowedActions(item, role, perms, all).includes(move.action)) return ""
  const blocked = move.action === "submit" ? blockedReason(item, role, all) : ""
  if (blocked) return blocked
  const [who, label] = stepOwner(item, move.action)
  const verb = VERBS[move.action] ?? move.action
  return who === role ? `Bạn chưa có quyền ${verb} (thiếu quyền cập nhật công việc).` : `Chỉ ${label} (${ROLE_TITLES[who] || who}) được ${verb} việc này.`
}

/** Statuses the item can be dropped on by the role right now (columns to light up while dragging). */
export const dropTargets = (item: WorkItem, columns: Column[], role: string, perms: string[], all: WorkItem[], free = false) =>
  columns.map((c) => c.status).filter((s) => transitionFor(item, s, role, perms, all, free))

export type QuickFilter = "" | "mine" | "review" | "overdue" | "proposed"

/** Waits on the role's decision: a result to accept, or a proposal to approve. */
const awaitsRole = (x: WorkItem, role: string) =>
  (x.status === "Chờ duyệt" && reviewerOf(x) === role) || (x.status === "Chờ duyệt đề xuất" && x.approver === role)

export function quickFilter(items: WorkItem[], filter: QuickFilter, role: string, today: string): WorkItem[] {
  if (filter === "mine") return items.filter((x) => x.owner === role && !isClosed(x))
  if (filter === "review") return items.filter((x) => awaitsRole(x, role))
  if (filter === "overdue") return items.filter((x) => !isClosed(x) && x.due < today)
  if (filter === "proposed") return items.filter((x) => x.createdBy === role)
  return items
}

export type Swimlane = "none" | "wbs" | "owner"
export type Lane = { key: string; title: string; items: WorkItem[] }

/** Rows of the board: one lane, one per WBS item (in the given order, then "Chưa gắn hạng mục"), or one per owner. */
export function swimlanes(items: WorkItem[], by: Swimlane, labels: { wbs: [string, string][]; owner(role: string): string }): Lane[] {
  if (by === "none") return [{ key: "", title: "", items }]
  if (by === "owner") {
    const owners = [...new Set(items.map((x) => x.owner))]
    return owners.map((o) => ({ key: o, title: labels.owner(o), items: items.filter((x) => x.owner === o) })).sort((a, b) => a.title.localeCompare(b.title))
  }
  const keys = new Set(labels.wbs.map(([k]) => k))
  const lanes = labels.wbs.map(([key, title]) => ({ key, title, items: items.filter((x) => x.wbsItem === key) }))
  const loose = items.filter((x) => !x.wbsItem || !keys.has(x.wbsItem))
  return [...lanes, ...(loose.length ? [{ key: "", title: "Chưa gắn hạng mục", items: loose }] : [])].filter((l) => l.items.length)
}

/** "Lê Hoàng Nam" → "HN" (avatar letters, like Jira). */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((p) => p[0]).join("").toUpperCase() || "?"
