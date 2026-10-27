import type { WorkItem, WorkNotice } from "./types.ts"
import { assignableRoles, canAssign, managesAllUnits, managesWorkOf } from "../data/access.ts"

/** The 13 business accounts seeded in tbl_user (admin acts through the "view as" role picker). */
export const BUSINESS_ROLES = [
  "lanhdao", "truongdonvi", "matdat", "bien", "hangkhong", "trungtam", "chunhiem",
  "kythuat", "kehoach", "tochuc", "hientruong", "ketoan", "ketoantruong",
]

export const ROLE_TITLES: Record<string, string> = {
  lanhdao: "Liên đoàn trưởng",
  truongdonvi: "Trưởng đơn vị",
  matdat: "Điều hành Đoàn ĐVL Mặt đất",
  bien: "Đoàn trưởng ĐVL Biển",
  hangkhong: "Đoàn trưởng ĐVL Hàng không",
  trungtam: "Giám đốc Trung tâm",
  chunhiem: "Chủ nhiệm dự án",
  kythuat: "Chuyên viên kỹ thuật",
  kehoach: "Chuyên viên KH-TC",
  tochuc: "Chuyên viên TC-HC",
  hientruong: "Cán bộ hiện trường",
  ketoan: "Kế toán viên",
  ketoantruong: "Kế toán trưởng",
}

/**
 * Who a role may hand work down to: not a fixed list per role but its scope (data/access.ts) – people of a lower
 * chức vụ in the unit it manages or a sub-unit. Giving work also needs the vldc-directives:create permission.
 */
export const delegatesOf = (role: string) => assignableRoles(role, BUSINESS_ROLES)

export const PAYMENT_STEPS: { owner: string; label: string }[] = [
  { owner: "chunhiem", label: "Lập đề nghị thanh toán" },
  { owner: "kehoach", label: "Xác nhận nguồn và dự toán" },
  { owner: "ketoan", label: "Kiểm tra chứng từ" },
  { owner: "ketoantruong", label: "Kiểm soát" },
  { owner: "lanhdao", label: "Phê duyệt" },
  { owner: "ketoan", label: "Chi tiền" },
]

export function isClosed(item: WorkItem): boolean {
  return item.status === "Hoàn thành" || item.status === "Đã chi"
}

function isDirectParty(item: WorkItem, role: string): boolean {
  return item.createdBy === role || item.owner === role || item.cc.includes(role)
}

/**
 * Whoever manages the whole organisation sees everything; a unit manager also sees work owned in the units it
 * manages; everyone sees items they are party to, plus the subtree under those.
 */
export function isVisible(item: WorkItem, role: string, all: WorkItem[]): boolean {
  if (managesAllUnits(role)) return true
  const byId = new Map(all.map((x) => [x.id, x]))
  const seen = new Set<string>()
  let cursor: WorkItem | undefined = item
  while (cursor && !seen.has(cursor.id)) {
    if (isDirectParty(cursor, role) || managesWorkOf(role, cursor.owner)) return true
    seen.add(cursor.id)
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }
  return false
}

export function childrenOf(id: string, all: WorkItem[]): WorkItem[] {
  return all.filter((x) => x.parentId === id && x.type !== "payment")
}

export function rolledUpProgress(item: WorkItem, all: WorkItem[], seen: Set<string> = new Set()): number {
  if (item.status === "Hoàn thành") return 100
  const kids = childrenOf(item.id, all).filter((kid) => !seen.has(kid.id))
  if (!kids.length) return Math.round(item.progress || 0)
  seen.add(item.id)
  const total = kids.reduce((sum, kid) => sum + rolledUpProgress(kid, all, seen), 0)
  return Math.round(total / kids.length)
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Open, due within 2 days (or overdue) and under 80% done; overdue counts regardless of progress. */
export function isAtRisk(item: WorkItem, all: WorkItem[], today: string): boolean {
  if (isClosed(item) || item.type === "payment") return false
  if (item.due < today) return true
  return item.due <= addDays(today, 2) && rolledUpProgress(item, all) < 80
}

export type WorkAction =
  | "accept" | "progress" | "submit" | "approve" | "return" | "comment" | "delegate" | "advance" | "resubmit"

export type ActionInput = {
  note?: string
  progress?: number
  evidence?: string
  child?: {
    id: string
    title: string
    owner: string
    cc?: string[]
    due: string
    priority?: WorkItem["priority"]
    description?: string
  }
}

export function hasPerm(perms: string[], code: string): boolean {
  return perms.includes("*") || perms.includes(code)
}

const DIRECTIVE_UPDATE = "vldc-directives:update"
const DIRECTIVE_CREATE = "vldc-directives:create"

function parties(item: WorkItem): string[] {
  return Array.from(new Set([item.createdBy, item.owner, ...item.cc]))
}

function hasOpenChildren(item: WorkItem, all: WorkItem[]): boolean {
  return childrenOf(item.id, all).some((kid) => kid.status !== "Hoàn thành")
}

function directiveActions(item: WorkItem, role: string, perms: string[], all: WorkItem[]): WorkAction[] {
  if (!hasPerm(perms, DIRECTIVE_UPDATE)) return []
  const actions: WorkAction[] = []
  const isOwner = item.owner === role
  if (isOwner && item.status === "Mới giao") actions.push("accept")
  if (isOwner && item.status === "Đang thực hiện") {
    actions.push("progress")
    if (!hasOpenChildren(item, all)) actions.push("submit")
    if (hasPerm(perms, DIRECTIVE_CREATE) && delegatesOf(role).length) actions.push("delegate")
  }
  if (item.createdBy === role && item.status === "Chờ duyệt") actions.push("approve", "return")
  if (parties(item).includes(role)) actions.push("comment")
  return actions
}

/** Actions the role may take on this item right now, given its permission codes. */
export function allowedActions(item: WorkItem, role: string, perms: string[], all: WorkItem[]): WorkAction[] {
  return item.type === "payment" ? paymentActions(item, role, perms) : directiveActions(item, role, perms, all)
}

function requireText(value: string | undefined, message: string): string {
  const text = (value || "").trim()
  if (!text) throw new Error(message)
  return text
}

/** A YYYY-MM-DD due date not before the day of now and, for sub-tasks, not after the parent's due date. */
function requireDue(value: string | undefined, message: string, now: string, latest?: string): string {
  const due = requireText(value, message)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error("Hạn không hợp lệ")
  if (due < now.slice(0, 10)) throw new Error("Hạn không được ở quá khứ")
  if (latest && due > latest) throw new Error(`Hạn việc con không được sau hạn việc cha (${latest.split("-").reverse().join("/")})`)
  return due
}

function withEntry(item: WorkItem, by: string, action: string, now: string, notify: string[], note?: string): WorkItem {
  const entry = { at: now, by, action, notify: notify.filter((role) => role !== by), ...(note ? { note } : {}) }
  return { ...item, updatedAt: now, history: [...item.history, entry] }
}

function newWorkItem(fields: Omit<WorkItem, "createdAt" | "updatedAt" | "history" | "progress"> & { progress?: number }, now: string, notify: string[]): WorkItem {
  const base: WorkItem = { progress: 0, ...fields, createdAt: now, updatedAt: now, history: [] }
  return withEntry(base, fields.createdBy, "create", now, notify)
}

function applyDirectiveAction(item: WorkItem, action: WorkAction, input: ActionInput, role: string, now: string): { item: WorkItem; created?: WorkItem } {
  switch (action) {
    case "accept":
      return { item: withEntry({ ...item, status: "Đang thực hiện" }, role, action, now, [item.createdBy], input.note) }
    case "progress": {
      const progress = Math.max(0, Math.min(100, Math.round(Number(input.progress ?? item.progress) || 0)))
      const evidence = input.evidence?.trim() || item.evidence
      return { item: withEntry({ ...item, progress, evidence }, role, action, now, [item.createdBy], input.note || `Tiến độ ${progress}%`) }
    }
    case "submit": {
      const submitted = withEntry({ ...item, status: "Chờ duyệt", progress: 100 }, role, action, now, [item.createdBy], input.note)
      submitted.history[submitted.history.length - 1].progressBefore = item.progress
      return { item: submitted }
    }
    case "approve":
      return { item: withEntry({ ...item, status: "Hoàn thành", progress: 100 }, role, action, now, [item.owner, ...item.cc], input.note) }
    case "return": {
      const note = requireText(input.note, "Vui lòng nhập lý do trả lại")
      // Returned work is not done: go back to the pre-submit progress, never above 90%.
      const lastSubmit = [...item.history].reverse().find((h) => h.action === "submit")
      const progress = Math.min(lastSubmit?.progressBefore ?? 90, 90)
      return { item: withEntry({ ...item, status: "Đang thực hiện", progress }, role, action, now, [item.owner], note) }
    }
    case "comment": {
      const note = requireText(input.note, "Vui lòng nhập nội dung bình luận")
      return { item: withEntry(item, role, action, now, parties(item), note) }
    }
    case "delegate": {
      const child = input.child
      if (!child) throw new Error("Thiếu thông tin việc con")
      if (!canAssign(role, child.owner)) throw new Error("Người nhận không thuộc phạm vi quản lý của bạn")
      const title = requireText(child.title, "Vui lòng nhập nội dung công việc")
      const due = requireDue(child.due, "Vui lòng chọn hạn hoàn thành", now, item.due)
      const cc = (child.cc || []).filter((r) => r !== child.owner)
      const created = newWorkItem({
        id: child.id, type: "task", title, description: child.description, createdBy: role, owner: child.owner,
        cc, parentId: item.id, status: "Mới giao", priority: child.priority || item.priority, due,
        // A sub-task works on the same project item and tổ as its parent.
        ...(item.project ? { project: item.project } : {}), ...(item.wbsItem ? { wbsItem: item.wbsItem } : {}),
        ...(item.subUnit ? { subUnit: item.subUnit } : {}),
      }, now, [child.owner, ...cc])
      const parent = withEntry(item, role, action, now, [item.createdBy], `Giao ${created.id} cho ${ROLE_TITLES[child.owner] || child.owner}`)
      return { item: parent, created }
    }
    default:
      throw new Error("Thao tác không hợp lệ")
  }
}

/**
 * Validates actor and state (permissions are checked by the caller through allowedActions)
 * and returns the updated copy plus any item it spawned.
 */
export function applyAction(item: WorkItem, action: WorkAction, input: ActionInput, role: string, now: string, all: WorkItem[]): { item: WorkItem; created?: WorkItem } {
  if (action === "submit" && item.owner === role && item.status === "Đang thực hiện" && hasOpenChildren(item, all)) {
    throw new Error("Còn việc con chưa hoàn thành, chưa thể báo cáo hoàn thành")
  }
  if (!allowedActions(item, role, ["*"], all).includes(action)) {
    throw new Error("Không thể thực hiện thao tác này ở trạng thái hiện tại")
  }
  return item.type === "payment"
    ? { item: applyPaymentAction(item, action, input, role, now) }
    : applyDirectiveAction(item, action, input, role, now)
}

export function createDirective(
  input: { id: string; title: string; owner: string; subUnit?: string; project?: string; wbsItem?: string; cc: string[]; due: string; priority: WorkItem["priority"]; description?: string },
  role: string,
  perms: string[],
  now: string,
): WorkItem {
  if (!hasPerm(perms, DIRECTIVE_CREATE)) throw new Error("Bạn không có quyền giao việc")
  if (!input.owner) throw new Error("Vui lòng chọn người chủ trì")
  if (!canAssign(role, input.owner)) throw new Error("Người chủ trì không thuộc phạm vi quản lý của bạn")
  const title = requireText(input.title, "Vui lòng nhập nội dung chỉ đạo")
  const due = requireDue(input.due, "Vui lòng chọn hạn hoàn thành", now)
  const cc = input.cc.filter((r) => r !== input.owner && r !== role)
  return newWorkItem({
    id: input.id, type: "directive", title, description: input.description, createdBy: role, owner: input.owner,
    ...(input.subUnit ? { subUnit: input.subUnit } : {}),
    ...(input.project ? { project: input.project } : {}),
    ...(input.project && input.wbsItem ? { wbsItem: input.wbsItem } : {}),
    cc, status: "Mới giao", priority: input.priority, due,
  }, now, [input.owner, ...cc])
}

const PAYMENT_CREATE = "vldc-payments:create"
const PAYMENT_UPDATE = "vldc-payments:update"

function paymentActions(item: WorkItem, role: string, perms: string[]): WorkAction[] {
  const actions: WorkAction[] = []
  const step = item.step ?? 0
  if (!isClosed(item) && item.owner === role) {
    if (step === 0 && hasPerm(perms, PAYMENT_CREATE)) actions.push("resubmit")
    if (step >= 1 && hasPerm(perms, PAYMENT_UPDATE)) actions.push("advance", "return")
  }
  if (parties(item).includes(role)) actions.push("comment")
  return actions
}

function atStep(item: WorkItem, step: number): WorkItem {
  return { ...item, step, owner: PAYMENT_STEPS[step].owner }
}

function applyPaymentAction(item: WorkItem, action: WorkAction, input: ActionInput, role: string, now: string): WorkItem {
  const step = item.step ?? 0
  switch (action) {
    case "resubmit":
      return withEntry({ ...atStep(item, 1), status: "Đang trình" }, role, action, now, [PAYMENT_STEPS[1].owner, item.createdBy], input.note)
    case "advance": {
      if (step === 5) return withEntry({ ...item, status: "Đã chi" }, role, action, now, [item.createdBy, ...item.cc], input.note || "Đã chi tiền")
      const next = atStep(item, step + 1)
      const status = step === 4 ? "Đã phê duyệt" : "Đang trình"
      return withEntry({ ...next, status }, role, action, now, [next.owner, item.createdBy], input.note || PAYMENT_STEPS[step].label)
    }
    case "return": {
      const note = requireText(input.note, "Vui lòng nhập lý do trả lại")
      const back = atStep(item, step - 1)
      return withEntry({ ...back, status: "Bị trả lại" }, role, action, now, [back.owner, item.createdBy], note)
    }
    case "comment": {
      const note = requireText(input.note, "Vui lòng nhập nội dung bình luận")
      return withEntry(item, role, action, now, parties(item), note)
    }
    default:
      throw new Error("Thao tác không hợp lệ")
  }
}

export function createPayment(
  input: { id: string; title: string; amount: number; due: string; parentId?: string; description?: string; project?: string },
  role: string,
  perms: string[],
  now: string,
): WorkItem {
  if (role !== PAYMENT_STEPS[0].owner || !hasPerm(perms, PAYMENT_CREATE)) throw new Error("Bạn không có quyền lập đề nghị thanh toán")
  const title = requireText(input.title, "Vui lòng nhập nội dung thanh toán")
  const due = requireDue(input.due, "Vui lòng chọn hạn thanh toán", now)
  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Số tiền phải lớn hơn 0")
  const owner = PAYMENT_STEPS[1].owner
  const cc = Array.from(new Set(PAYMENT_STEPS.map((s) => s.owner))).filter((r) => r !== owner && r !== role)
  return newWorkItem({
    id: input.id, type: "payment", title, description: input.description, createdBy: role, owner, cc,
    parentId: input.parentId, status: "Đang trình", step: 1, amount, priority: "Cao", due,
    ...(input.project ? { project: input.project } : {}),
  }, now, [owner])
}

const ACTION_VERBS: Record<string, string> = {
  create: "đã giao việc",
  accept: "đã nhận việc",
  progress: "đã cập nhật tiến độ",
  submit: "đã báo cáo hoàn thành",
  approve: "đã duyệt",
  return: "đã trả lại",
  comment: "đã bình luận",
  delegate: "đã giao việc con",
  advance: "đã chuyển bước",
  resubmit: "đã trình lại",
}

/** History entries addressed to the role (never its own), newest first. */
export function notificationsFor(role: string, all: WorkItem[]): WorkNotice[] {
  const notices: WorkNotice[] = []
  for (const item of all) {
    item.history.forEach((entry, index) => {
      if (entry.by === role || !entry.notify.includes(role)) return
      const who = ROLE_TITLES[entry.by] || entry.by
      const verb = item.type === "payment" && entry.action === "create" ? "đã trình hồ sơ" : ACTION_VERBS[entry.action] || entry.action
      notices.push({
        id: `${item.id}#${index}`,
        itemId: item.id,
        title: `${item.id} • ${item.title}`,
        body: `${who} ${verb}${entry.note ? `: ${entry.note}` : ""}`,
        at: entry.at,
        by: entry.by,
      })
    })
  }
  return notices.sort((a, b) => b.at.localeCompare(a.at))
}

/** Open items the role currently has to act on, earliest due first. */
export function ownerInbox(role: string, all: WorkItem[]): WorkItem[] {
  return all.filter((x) => x.owner === role && !isClosed(x)).sort((a, b) => a.due.localeCompare(b.due))
}

/** Engine pages that show shared workflow data and must re-render on realtime changes. */
export const WORKFLOW_PAGES = new Set(["directives", "action", "payments", "dashboard", "command", "performance", "projects", "crossflow", "accounting", "units", "audit", "alerts", "reports"])

/** Why the owner cannot report completion yet ("" when nothing blocks it). */
export function blockedReason(item: WorkItem, role: string, all: WorkItem[]): string {
  if (item.type === "payment" || item.owner !== role || item.status !== "Đang thực hiện") return ""
  const open = childrenOf(item.id, all).filter((kid) => kid.status !== "Hoàn thành").length
  return open ? `Còn ${open} việc con chưa hoàn thành, chưa thể báo cáo hoàn thành` : ""
}
