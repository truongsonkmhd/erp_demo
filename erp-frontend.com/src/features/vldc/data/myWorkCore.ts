import type { MyWorkRow } from "./workApi.ts"

/** Pure parts of Công việc on the my-work API (inboxPage.ts): why a row is there, its state, how late it is. */

export const REASON_LABELS: Record<string, string> = {
  APPROVE_PROJECT: "Duyệt dự án", CONFIRM_DELETE: "Xác nhận xoá dự án", ASSIGN_TASKS: "Giao việc cho đơn vị", DO_TASK: "Việc được giao",
  REVIEW_TASK: "Nghiệm thu", APPROVE_MISSION: "Duyệt nhiệm vụ", DO_MISSION: "Nhiệm vụ đang làm", FOLLOW: "Phối hợp",
}

const KIND_LABELS: Record<MyWorkRow["kind"], string> = {
  PROJECT_APPROVAL: "Dự án", PROJECT_DELETE: "Dự án", PROJECT_ASSIGN: "Dự án", PROJECT_TASK: "Việc", MISSION: "Nhiệm vụ",
}

const STATUS_LABELS: Record<string, string> = {
  // projects (approval or state)
  PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Từ chối", INITIATED: "Khởi tạo", PAUSED: "Tạm dừng", COMPLETED: "Hoàn thành",
  // tasks
  NEW: "Mới giao", IN_PROGRESS: "Đang thực hiện", IN_REVIEW: "Chờ nghiệm thu", DONE: "Hoàn thành",
}

/** "Việc" / "Nhiệm vụ" / "Dự án" and the reason, e.g. "Việc • Nghiệm thu". */
export function rowLabel(r: MyWorkRow): string {
  const reason = r.reason ? REASON_LABELS[r.reason] ?? r.reason : ""
  return [KIND_LABELS[r.kind], reason].filter(Boolean).join(" • ")
}

/** The row's state in words; a deletion request reads "Chờ xác nhận xoá". */
export function statusLabel(r: MyWorkRow): string {
  if (r.kind === "PROJECT_DELETE") return "Chờ xác nhận xoá"
  if (r.kind === "PROJECT_ASSIGN") return "Chưa giao việc"
  return STATUS_LABELS[r.status] ?? r.status
}

const days = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)

/** "Quá 2 ngày" / "Hôm nay" / "Còn 3 ngày" ("" without a due date). */
export function slaText(due: string | null, today: string): string {
  if (!due) return ""
  const d = days(today, due)
  return d < 0 ? `Quá ${-d} ngày` : d === 0 ? "Hôm nay" : `Còn ${d} ngày`
}
