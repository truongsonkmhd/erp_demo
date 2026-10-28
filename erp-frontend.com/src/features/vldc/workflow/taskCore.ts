import type { Complexity, TaskStatus, TaskSummary } from "../data/workApi.ts"

/** Pure parts of the project task views (taskViews.ts): states, columns, what a drop means, the search. */

export const TASK_STATE: Record<TaskStatus, [string, string]> = {
  NEW: ["Mới giao", "new"], IN_PROGRESS: ["Đang thực hiện", "doing"], IN_REVIEW: ["Chờ nghiệm thu", "review"], DONE: ["Hoàn thành", "done"],
}
export const COLUMNS: TaskStatus[] = ["NEW", "IN_PROGRESS", "IN_REVIEW", "DONE"]
export const COMPLEXITY: Record<Complexity, string> = { VERY_LOW: "Rất thấp (1)", LOW: "Thấp (2)", MEDIUM: "Trung bình (3)", HIGH: "Cao (5)", VERY_HIGH: "Rất cao (8)" }

/** The action a drop from one column on another means (any other move is the assigner's free move). */
export function dropAction(from: TaskStatus, to: TaskStatus): "ACCEPT" | "SUBMIT" | "APPROVE" | "RETURN" | "MOVE" | null {
  if (from === to) return null
  if (from === "NEW" && to === "IN_PROGRESS") return "ACCEPT"
  if (from === "IN_PROGRESS" && to === "IN_REVIEW") return "SUBMIT"
  if (from === "IN_REVIEW" && to === "DONE") return "APPROVE"
  if (from === "IN_REVIEW" && to === "IN_PROGRESS") return "RETURN"
  return "MOVE"
}

/** Search (code, title, assignee, unit) and, on the list, the state. */
export function filterTasks(items: TaskSummary[], query: string, status: TaskStatus | ""): TaskSummary[] {
  const q = query.trim().toLowerCase()
  return items.filter((t) => (!status || t.status === status)
    && (!q || `${t.code} ${t.title} ${t.assignee?.fullName ?? ""} ${t.department?.name ?? ""}`.toLowerCase().includes(q)))
}

