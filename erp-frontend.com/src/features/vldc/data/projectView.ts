import { workflowStore } from "../workflow/repository"
import { localToday } from "./dates"
import { computeProject } from "./projectCore"
import { vldcData } from "./registry"
import type { Project } from "./types"

/** Stored projects with their figures computed from WBS, finance lines, paid payment dossiers and dates. */
export function projectsView(): Project[] {
  const ctx = {
    lines: vldcData.get("financeLines"),
    payments: workflowStore.items().filter((x) => x.type === "payment").map((x) => ({ project: x.project, amount: x.amount, status: x.status })),
    today: localToday(),
  }
  return vldcData.get("projects").map((p) => computeProject(p, ctx))
}
