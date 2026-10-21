import { isClosed } from "../workflow/rules"
import { workflowStore } from "../workflow/repository"
import { evaluateAlerts, type Alert } from "./alerts"
import { localToday } from "./dates"
import { vldcData } from "./registry"
import type { AlertRule } from "./types"

/** Evaluates the given rules against the live collections and workflow (Alerts page + leader dashboard). */
export function liveAlerts(rules: AlertRule[]): Alert[] {
  const openWork = workflowStore.items().filter((x) => x.type !== "payment" && !isClosed(x)).map((x) => ({ id: x.id, title: x.title, due: x.due }))
  return evaluateAlerts(rules, {
    projects: vldcData.get("projects"),
    equipment: vldcData.get("equipment"),
    contracts: vldcData.get("contracts"),
    inboxTasks: vldcData.get("inboxTasks"),
    openWork,
  }, localToday())
}
