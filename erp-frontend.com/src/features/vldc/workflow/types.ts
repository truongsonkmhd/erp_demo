export type WorkItemType = "directive" | "task" | "payment" | "proposal"

export type WorkStatus =
  | "Mới giao"
  | "Đang thực hiện"
  | "Chờ duyệt"
  | "Hoàn thành"
  | "Đang trình"
  | "Bị trả lại"
  | "Đã phê duyệt"
  | "Đã chi"
  | "Chờ duyệt đề xuất"
  | "Từ chối"

export type Priority = "Cao" | "Trung bình" | "Thấp"

/** Độ phức tạp of a project task (its weight in the project's progress is computed by the backend). */
export type Complexity = "Rất thấp" | "Thấp" | "Trung bình" | "Cao" | "Rất cao"
export const COMPLEXITIES: Complexity[] = ["Rất thấp", "Thấp", "Trung bình", "Cao", "Rất cao"]

export type HistoryEntry = {
  at: string
  by: string
  action: string
  note?: string
  notify: string[]
  /** Progress before a "submit", restored if the work is returned. */
  progressBefore?: number
  /** Notes record who wrote them and the unit they wrote for (the role's unit at that time). */
  byName?: string
  unit?: string
}

/** One shared work record (directive, sub-task, payment dossier or proposed task); identities are role codes. */
export type WorkItem = {
  id: string
  type: WorkItemType
  title: string
  description?: string
  createdBy: string
  owner: string
  /** Tổ/phòng (SubUnit id) inside the owner's unit the work is meant for. */
  subUnit?: string
  /** Project (id) the directive or payment belongs to. */
  project?: string
  /** WBS item (id) of that project the work delivers; its progress feeds the item. */
  wbsItem?: string
  cc: string[]
  /** Proposed task: the superior who approves the proposal and accepts the result. */
  approver?: string
  parentId?: string
  status: WorkStatus
  step?: number
  amount?: number
  progress: number
  evidence?: string
  priority: Priority
  complexity?: Complexity
  due: string
  createdAt: string
  updatedAt: string
  history: HistoryEntry[]
  /** Soft delete by its creator: hidden from every view, kept for the audit trail. */
  deletedAt?: string
  deletedBy?: string
}

export type WorkNotice = {
  id: string
  itemId: string
  title: string
  body: string
  at: string
  by: string
}
