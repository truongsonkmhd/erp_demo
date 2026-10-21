import { contractDebt } from "./accountingMetrics.ts"
import { addDays } from "./dates.ts"
import type { AlertRule, Contract, Equipment, InboxTask, Project } from "./types.ts"

/** Live alerts: each enabled rule is evaluated against stored records with its own threshold. */

export type AlertData = {
  projects: Project[]; equipment: Equipment[]; contracts: Contract[]; inboxTasks: InboxTask[]
  /** Open workflow items (directives / tasks) with their due date. */
  openWork: { id: string; title: string; due: string }[]
}

export type Alert = { ruleId: string; level: string; title: string; sub: string; page: string; count: number; refs: string[] }

const cut = (items: string[], n = 3) => items.slice(0, n).join(" • ") + (items.length > n ? ` • +${items.length - n}` : "")

export function evaluateRule(rule: AlertRule, data: AlertData, today: string): Alert | null {
  if (!rule.enabled) return null
  const make = (title: string, sub: string, page: string, refs: string[]): Alert | null =>
    refs.length ? { ruleId: rule.id, level: rule.level, title, sub, page, count: refs.length, refs } : null
  switch (rule.metric) {
    case "cost": {
      const hit = data.projects.filter((p) => p.costUsed - p.technical > rule.threshold)
      return make(`${hit.length} dự án chi vượt tiến độ > ${rule.threshold}%`, cut(hit.map((p) => `${p.id}: chi ${p.costUsed}% / KT ${p.technical}%`)), "finance", hit.map((p) => p.id))
    }
    case "deadline": {
      const late = addDays(today, -rule.threshold)
      const work = data.openWork.filter((w) => w.due < late)
      const inbox = data.inboxTasks.filter((t) => t.overdue)
      return make(`${work.length + inbox.length} việc quá hạn`, cut([...work.map((w) => w.title), ...inbox.map((t) => t.title)]), "directives", [...work.map((w) => w.id), ...inbox.map((t) => t.id)])
    }
    case "calibration": {
      const limit = addDays(today, rule.threshold)
      const hit = data.equipment.filter((e) => e.inspectionDue <= limit)
      return make(`${hit.length} thiết bị hết hạn kiểm định trong ${rule.threshold} ngày`, cut(hit.map((e) => e.name)), "equipment", hit.map((e) => e.id))
    }
    case "debt": {
      const hit = data.contracts.filter((c) => c.kind === "thu").map((c) => contractDebt(c, today)).filter((d) => d.agingDays > rule.threshold)
      return make(`${hit.length} khoản phải thu quá hạn > ${rule.threshold} ngày`, cut(hit.map((d) => `${d.contract.id} (${d.agingDays} ngày)`)), "receivables", hit.map((d) => d.contract.id))
    }
  }
}

export function evaluateAlerts(rules: AlertRule[], data: AlertData, today: string): Alert[] {
  return rules.map((r) => evaluateRule(r, data, today)).filter((a): a is Alert => !!a)
}
