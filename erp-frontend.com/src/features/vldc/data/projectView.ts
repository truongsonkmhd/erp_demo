import { workflowStore } from "../workflow/repository"
import { isClosed, rolledUpProgress } from "../workflow/rules"
import { localToday } from "./dates"
import { computeProject, type WorkLink } from "./projectCore"
import { vldcData } from "./registry"
import type { Project } from "./types"

/** Work items (payments aside) linked to a project, as projects see them. */
export function projectWork(items = workflowStore.items(), today = localToday()): WorkLink[] {
  return items.filter((x) => x.type !== "payment" && x.project).map((x) => ({
    project: x.project, wbsItem: x.wbsItem, progress: rolledUpProgress(x, items), closed: isClosed(x),
    overdue: !isClosed(x) && x.due < today, pending: x.status === "Chờ duyệt", root: x.type === "directive",
  }))
}

/** Stored projects with their figures computed from WBS, finance lines, paid payment dossiers and dates. */
export function projectsView(): Project[] {
  const items = workflowStore.items()
  const today = localToday()
  const ctx = {
    lines: vldcData.get("financeLines"),
    payments: items.filter((x) => x.type === "payment").map((x) => ({ project: x.project, amount: x.amount, status: x.status })),
    work: projectWork(items, today),
    today,
  }
  return vldcData.get("projects").map((p) => computeProject(p, ctx))
}
