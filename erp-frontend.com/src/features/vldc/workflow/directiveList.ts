import type { WorkItem } from "./types.ts"

/** Labels of the older work items still shown in modals (payment dossiers, earlier directives). */

export const TYPE_LABELS: Record<WorkItem["type"], string> = { directive: "Chỉ đạo", task: "Việc được giao", payment: "Hồ sơ thanh toán", proposal: "Nhiệm vụ" }

/** Names shown for role codes, tổ ids and project ids. */
export type DirectiveLabels = { role(code: string): string; subUnit(id?: string): string; project(id?: string): string }
