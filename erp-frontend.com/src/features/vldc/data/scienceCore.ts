import { ROLE_TITLES } from "../workflow/rules.ts"
import { managedUnits, roleUnit, rolePosition } from "./access.ts"
import { addDays } from "./dates.ts"
import { slaOf, type InboxRow } from "./inboxCore.ts"
import { unitKey } from "./org.ts"
import type { ScienceTopic, TopicReviewDecision } from "./types.ts"

/**
 * Đề tài khoa học & đổi mới: topics in progress are seen by leadership (every unit) and by the people of their unit
 * (heads and staff); the lead submits for acceptance and the head's approval makes the topic public ("Đã triển khai").
 */

export const TOPIC_FIELDS = ["Địa vật lý", "Địa chất", "GIS – Bản đồ", "Thiết bị – Công nghệ", "Chuyển đổi số", "Quản lý"]
export const REVIEWER = "lanhdao"
/** An active topic ending within this many days is flagged. */
export const SOON_DAYS = 14

export const isMember = (t: ScienceTopic, role: string) => t.leadRole === role || t.members.includes(role)
/**
 * Units whose topics in progress the role sees: leadership manages every unit, a unit head the unit (and its
 * sub-units), staff their own unit.
 */
export function topicUnits(role: string): Set<string> {
  const managed = managedUnits(role)
  if (managed.size) return managed
  const unit = roleUnit(role)
  return new Set(unit ? [unit] : [])
}
export const seesAllUnits = (role: string) => role === REVIEWER || rolePosition(role)?.code === "LANH_DAO"
/** Accepted topics are public; others are seen by leadership, by their unit, and by their own lead and members. */
export const canViewTopic = (t: ScienceTopic, role: string) =>
  t.status === "Đã triển khai" || seesAllUnits(role) || isMember(t, role) || topicUnits(role).has(t.unit)
export const visibleTopics = (topics: ScienceTopic[], role: string) => topics.filter((t) => canViewTopic(t, role))
/** Everyone who sees a topic may hand in documents until it is accepted (mirrors the backend's canWrite). */
export const canAttachFiles = (t: ScienceTopic, role: string) => t.status !== "Đã triển khai" && canViewTopic(t, role)
/** The federation head views and reviews topics only. */
export const canCreateTopic = (role: string) => role !== REVIEWER
export const canUpdateProgress = (t: ScienceTopic, role: string) => role !== REVIEWER && t.status === "Đang triển khai" && isMember(t, role)
export const canEditTopic = (t: ScienceTopic, role: string) => role !== REVIEWER && t.status === "Đang triển khai" && t.leadRole === role
export const canSubmit = canEditTopic
export const canReview = (t: ScienceTopic, role: string) => t.status === "Chờ duyệt" && role === REVIEWER

export function addProgress(t: ScienceTopic, role: string, byName: string, progress: number, note: string, now: string): ScienceTopic {
  if (!canUpdateProgress(t, role)) throw new Error("Bạn không được cập nhật tiến độ đề tài này")
  if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw new Error("Tiến độ phải từ 0 đến 100%")
  if (!note.trim()) throw new Error("Vui lòng ghi việc đã làm")
  const p = Math.round(progress)
  return { ...t, progress: p, log: [...t.log, { at: now, by: role, byName, progress: p, note: note.trim() }] }
}

export function submitTopic(t: ScienceTopic, role: string, outcome: { result: string; impact: string }, now: string): ScienceTopic {
  if (!canSubmit(t, role)) throw new Error("Chỉ chủ nhiệm được trình nghiệm thu")
  if (!outcome.result.trim() || !outcome.impact.trim()) throw new Error("Vui lòng nhập kết quả và hiệu quả áp dụng")
  return { ...t, status: "Chờ duyệt", progress: 100, result: outcome.result.trim(), impact: outcome.impact.trim(), submittedAt: now }
}

export function reviewTopic(t: ScienceTopic, role: string, decision: TopicReviewDecision, note: string, now: string): ScienceTopic {
  if (!canReview(t, role)) throw new Error("Chỉ Liên đoàn trưởng duyệt đề tài đang chờ duyệt")
  if (decision === "Trả lại" && !note.trim()) throw new Error("Vui lòng ghi ý kiến khi trả lại")
  const review = { by: role, at: now, decision, note: note.trim() }
  return decision === "Duyệt"
    ? { ...t, status: "Đã triển khai", approvedAt: now, review }
    : { ...t, status: "Đang triển khai", review }
}

export function deadlineState(t: ScienceTopic, today: string): "overdue" | "soon" | "ok" {
  if (t.status !== "Đang triển khai") return "ok"
  if (t.end < today) return "overdue"
  return t.end <= addDays(today, SOON_DAYS) ? "soon" : "ok"
}

export function topicStats(topics: ScienceTopic[], role: string, today: string) {
  const mine = visibleTopics(topics, role)
  const active = mine.filter((t) => t.status === "Đang triển khai")
  return {
    active: active.length,
    pending: mine.filter((t) => t.status === "Chờ duyệt").length,
    done: mine.filter((t) => t.status === "Đã triển khai").length,
    overdue: active.filter((t) => deadlineState(t, today) === "overdue").length,
  }
}

export function filterTopics(topics: ScienceTopic[], field: string, query: string): ScienceTopic[] {
  const q = unitKey(query.trim())
  return topics.filter((t) => (!field || t.field === field) && (!q || unitKey(`${t.title} ${t.objective} ${t.leadName} ${t.result ?? ""}`).includes(q)))
}

/** Topics waiting for acceptance, as inbox rows of the federation head. */
export function topicReviewRows(topics: ScienceTopic[], role: string, today: string): InboxRow[] {
  if (role !== REVIEWER) return []
  return topics.filter((t) => t.status === "Chờ duyệt").map((t): InboxRow => {
    const due = addDays((t.submittedAt ?? t.createdAt).slice(0, 10), 7)
    const sla = slaOf(due, today)
    return {
      id: t.id, kind: "topic", type: "Duyệt đề tài", title: t.title, source: "KH-CN & Đổi mới", from: ROLE_TITLES[t.leadRole] || t.leadRole,
      owner: ROLE_TITLES[REVIEWER], status: t.status, priority: "Trung bình", due, slaText: sla.text, overdue: sla.overdue, mine: true, open: "topicOpen",
    }
  })
}
