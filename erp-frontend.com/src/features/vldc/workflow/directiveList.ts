import { isClosed, rolledUpProgress } from "./rules.ts"
import type { WorkItem } from "./types.ts"

/** Search, status filter and export rows of the Giao việc list. */

export const TYPE_LABELS: Record<WorkItem["type"], string> = { directive: "Chỉ đạo", task: "Việc được giao", payment: "Hồ sơ thanh toán", proposal: "Nhiệm vụ" }

/** Names shown for role codes, tổ ids and project ids. */
export type DirectiveLabels = { role(code: string): string; subUnit(id?: string): string; project(id?: string): string }
export type DirectiveStatusFilter = "" | "open" | "overdue" | "pending" | "done"

export const DIRECTIVE_STATUS_FILTERS: [DirectiveStatusFilter, string][] = [
  ["", "Tất cả trạng thái"], ["open", "Đang mở"], ["overdue", "Quá hạn"], ["pending", "Chờ duyệt"], ["done", "Hoàn thành"],
]

/** Lower case without Vietnamese accents, so "kiem dinh" finds "Kiểm định". */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()

function matchesStatus(x: WorkItem, status: DirectiveStatusFilter, today: string): boolean {
  if (status === "open") return !isClosed(x)
  if (status === "overdue") return !isClosed(x) && x.due < today
  if (status === "pending") return x.status === "Chờ duyệt"
  if (status === "done") return isClosed(x)
  return true
}

export function filterDirectives(items: WorkItem[], all: WorkItem[], query: string, status: DirectiveStatusFilter, today: string, labels: DirectiveLabels): WorkItem[] {
  const q = fold(query.trim())
  return items.filter((x) => matchesStatus(x, status, today) && (!q || fold([
    x.id, x.title, x.status, labels.role(x.createdBy), labels.role(x.owner), ...x.cc.map(labels.role), labels.subUnit(x.subUnit), labels.project(x.project),
  ].join(" | ")).includes(q)))
}

const vnDay = (iso: string) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "")

export function directiveExportRows(items: WorkItem[], all: WorkItem[], labels: DirectiveLabels): Record<string, string | number>[] {
  return items.map((x) => ({
    "Mã": x.id, "Loại": TYPE_LABELS[x.type], "Nội dung": x.title, "Việc cha": x.parentId ?? "", "Người giao": labels.role(x.createdBy), "Chủ trì": labels.role(x.owner),
    "Tổ / phòng": labels.subUnit(x.subUnit), "Phối hợp": x.cc.map(labels.role).join(", "), "Dự án": labels.project(x.project), "Ưu tiên": x.priority,
    "Trạng thái": x.status, "Tiến độ (%)": rolledUpProgress(x, all), "Ngày giao": vnDay(x.createdAt), "Hạn": vnDay(x.due),
  }))
}

/** Work a role gave out that its owner has not accepted yet (the head's first column), by due date. */
export const notYetAccepted = (role: string, items: WorkItem[]) =>
  items.filter((x) => x.type !== "payment" && x.createdBy === role && x.status === "Mới giao").sort((a, b) => a.due.localeCompare(b.due))
