import { ROLE_TITLES } from "../workflow/rules.ts"
import { managesAllUnits } from "./access.ts"
import { slaOf, type InboxRow, type InboxScope } from "./inboxCore.ts"
import type { AssignmentRecipient, AssignmentReply, DocAssignment, ReplyResult } from "./types.ts"

/** Giao xử lý văn bản đến: one phiếu giao per hand-off, each recipient role replies separately. */

export const REPLY_RESULTS: ReplyResult[] = ["Hoàn thành", "Cần thêm thời gian", "Không thuộc thẩm quyền"]
/** Leadership, TC-HC and unit heads hand documents out. */
export const ASSIGNER_ROLES = ["lanhdao", "tochuc", "truongdonvi", "matdat", "bien", "hangkhong", "trungtam"]

export const canAssign = (role: string) => ASSIGNER_ROLES.includes(role)
export const canManageAssignment = (a: DocAssignment, role: string) => a.assignedBy === role || managesAllUnits(role)
export const isOpenAssignment = (a: DocAssignment) => !a.closedAt

type NewAssignment = Omit<DocAssignment, "createdAt" | "recipients" | "closedAt"> & { recipients: string[]; now: string }

export function newAssignment({ recipients, now, ...rest }: NewAssignment): DocAssignment {
  return { ...rest, createdAt: now, recipients: [...new Set(recipients)].map((role) => ({ role })) }
}

export function recipientState(r: AssignmentRecipient, a: DocAssignment, today: string): { label: string; cls: string; overdue: boolean } {
  if (r.reply) return { label: "Đã trả lời", cls: "b-ok", overdue: false }
  const overdue = !a.closedAt && a.due < today
  return { label: r.seenAt ? "Đã xem" : "Chưa xem", cls: overdue ? "b-danger" : r.seenAt ? "b-info" : "b-warn", overdue }
}

const withRecipient = (a: DocAssignment, role: string, change: (r: AssignmentRecipient) => AssignmentRecipient): DocAssignment =>
  ({ ...a, recipients: a.recipients.map((r) => (r.role === role ? change(r) : r)) })

/** First view only; returns the same object when nothing changes (non-recipient or already seen). */
export function markSeen(a: DocAssignment, role: string, now: string): DocAssignment {
  const r = a.recipients.find((x) => x.role === role)
  return !r || r.seenAt ? a : withRecipient(a, role, (x) => ({ ...x, seenAt: now }))
}

export function replyTo(a: DocAssignment, role: string, reply: Omit<AssignmentReply, "at">, now: string): DocAssignment {
  if (a.closedAt) throw new Error("Phiếu giao đã kết thúc")
  if (!a.recipients.some((r) => r.role === role)) throw new Error("Bạn không thuộc danh sách được giao")
  if (!REPLY_RESULTS.includes(reply.result)) throw new Error("Kết quả không hợp lệ")
  if (!reply.text.trim()) throw new Error("Vui lòng nhập nội dung trả lời")
  return withRecipient(a, role, (r) => ({ ...r, seenAt: r.seenAt ?? now, reply: { ...reply, text: reply.text.trim(), at: now } }))
}

export const remindPending = (a: DocAssignment, now: string): DocAssignment =>
  ({ ...a, recipients: a.recipients.map((r) => (r.reply ? r : { ...r, remindedAt: now })) })

export const closeAssignment = (a: DocAssignment, now: string): DocAssignment => ({ ...a, closedAt: now })

export function docProgress(assignments: DocAssignment[], docId: string) {
  const mine = assignments.filter((a) => a.docId === docId)
  const all = mine.flatMap((a) => a.recipients)
  return { replied: all.filter((r) => r.reply).length, total: all.length, open: mine.filter(isOpenAssignment).length }
}

/** Unanswered recipients of open assignments: the role's own rows, or every one for a leader's "all" scope. */
export function assignmentInboxRows(assignments: DocAssignment[], role: string, scope: InboxScope, today: string): InboxRow[] {
  return assignments.filter(isOpenAssignment).flatMap((a) =>
    a.recipients
      .filter((r) => !r.reply && (scope === "all" || r.role === role))
      .map((r): InboxRow => {
        const sla = slaOf(a.due, today)
        return {
          id: a.id, kind: "doc", type: "Giao xử lý văn bản", title: `${a.docNumber}: ${a.docSummary}`, source: "Văn bản",
          from: ROLE_TITLES[a.assignedBy] || a.assignedBy, owner: ROLE_TITLES[r.role] || r.role, status: r.seenAt ? "Đã xem" : "Chưa xem",
          priority: "Cao", due: a.due, slaText: sla.text, overdue: sla.overdue, mine: r.role === role, open: "docAssignOpen",
        }
      }))
}
