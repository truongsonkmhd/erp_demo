/**
 * The row shape and lateness text shared by the inbox-style lists of other menus (giao văn bản, đề tài khoa học). The
 * Công việc menu itself reads the my-work API (inboxPage.ts).
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
}

export type InboxScope = "mine" | "all"

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)

/** "Quá 2 ngày" / "Hôm nay" / "Còn 3 ngày". */
export function slaOf(due: string, today: string): { text: string; overdue: boolean } {
  const d = daysBetween(today, due)
  return d < 0 ? { text: `Quá ${-d} ngày`, overdue: true } : d === 0 ? { text: "Hôm nay", overdue: false } : { text: `Còn ${d} ngày`, overdue: false }
}
