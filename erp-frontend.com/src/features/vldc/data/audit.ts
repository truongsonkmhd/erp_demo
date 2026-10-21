/** Automatic audit trail: every user save of a business record or workflow step becomes one event. */

export type AuditEvent = {
  id: string; at: string; role: string; actor: string; collection: string; ref: string; action: string; summary: string
}

type Actor = { role: string; name: string }
let actor: () => Actor = () => ({ role: "", name: "" })
let sink: (event: AuditEvent) => void = () => {}

export function setAuditActor(get: () => Actor) {
  actor = get
}

/** Where events are stored (the registry wires this to the vldc_audit_events collection). */
export function setAuditSink(fn: (event: AuditEvent) => void) {
  sink = fn
}

export const ACTION_LABELS: Record<string, string> = {
  update: "Cập nhật",
  create: "Khởi tạo",
  accept: "Nhận việc",
  progress: "Cập nhật tiến độ",
  submit: "Báo cáo hoàn thành",
  approve: "Duyệt",
  return: "Trả lại",
  comment: "Bình luận",
  delegate: "Giao việc con",
  advance: "Chuyển bước",
  resubmit: "Trình lại",
}

/** Best human label of a record for the timeline. */
export function summaryOf(row: Record<string, unknown>): string {
  for (const key of ["title", "name", "summary", "item", "text", "goal", "rule"]) {
    if (typeof row[key] === "string" && row[key]) return row[key] as string
  }
  return String(row.id ?? "")
}

let seq = 0

export function buildAuditEvent(collection: string, row: Record<string, unknown>, action = "update", now = new Date()): AuditEvent {
  const who = actor()
  seq = (seq + 1) % 1000
  return {
    id: `AU-${now.getTime()}-${String(seq).padStart(3, "0")}`,
    at: now.toISOString(),
    role: who.role,
    actor: who.name || who.role,
    collection,
    ref: String(row.id ?? ""),
    action,
    summary: summaryOf(row),
  }
}

export function auditEvent(collection: string, row: Record<string, unknown>, action = "update") {
  sink(buildAuditEvent(collection, row, action))
}
