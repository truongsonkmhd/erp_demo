import { workflowStore } from "../workflow/repository"
import { isClosed, isWork, rolledUpProgress, setProjectAccess } from "../workflow/rules"
import { localToday } from "./dates"
import { disbursementSeries, disbursementSummary } from "./disbursementCore"
import { canSeeProject, computeProject, type WorkLink } from "./projectCore"
import { vldcData } from "./registry"
import { ledgerStore } from "./ledgerStore"
import type { Project } from "./types"

// The units of a project (Phòng Kỹ thuật and the approver always; the others once it is approved) see its work and note on it.
setProjectAccess((projectId, role) => {
  const p = vldcData.get("projects").find((x) => x.id === projectId)
  return !!p && canSeeProject(p, role)
})

/** Work items linked to a project (payments and proposals not approved yet aside), as projects see them. */
export function projectWork(items = workflowStore.items(), today = localToday()): WorkLink[] {
  return items.filter((x) => isWork(x) && x.project).map((x) => ({
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

/** Giải ngân of the year from project budgets and the ledger's phiếu chi (replaces the static disbursement rows). */
export const disbursementView = () => disbursementSeries(vldcData.get("projects"), ledgerStore.legacyCashEntries(), localToday())
export const spendView = () => disbursementSummary(vldcData.get("projects"), ledgerStore.legacyCashEntries(), localToday())
