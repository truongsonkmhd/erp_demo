export type WorkItemType = "directive" | "task" | "payment"

export type WorkStatus =
  | "Mới giao"
  | "Đang thực hiện"
  | "Chờ duyệt"
  | "Hoàn thành"
  | "Đang trình"
  | "Bị trả lại"
  | "Đã phê duyệt"
  | "Đã chi"

export type Priority = "Cao" | "Trung bình" | "Thấp"

export type HistoryEntry = {
  at: string
  by: string
  action: string
  note?: string
  notify: string[]
  /** Progress before a "submit", restored if the work is returned. */
  progressBefore?: number
}

/** One shared work record (directive, sub-task or payment dossier); identities are role codes. */
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
  parentId?: string
  status: WorkStatus
  step?: number
  amount?: number
  progress: number
  evidence?: string
  priority: Priority
  due: string
  createdAt: string
  updatedAt: string
  history: HistoryEntry[]
}

export type WorkNotice = {
  id: string
  itemId: string
  title: string
  body: string
  at: string
  by: string
}
