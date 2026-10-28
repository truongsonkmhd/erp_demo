import type { MissionStatus, OrgUnit } from "../data/workApi.ts"

/** Pure parts of the Nhiệm vụ views (missionViews.ts): states, columns, what a drop means, the units to pick. */

export const MISSION_STATE: Record<MissionStatus, [string, string]> = {
  PENDING: ["Chờ duyệt", "proposed"], IN_PROGRESS: ["Đang thực hiện", "doing"], DONE: ["Hoàn thành", "done"], REJECTED: ["Từ chối", "rejected"],
}
export const MISSION_COLUMNS: MissionStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "REJECTED"]

/** The action a drop means: the approver approves or rejects a waiting mission, the proposer completes one under way. */
export function missionDropAction(from: MissionStatus, to: MissionStatus): "APPROVE" | "REJECT" | "COMPLETE" | null {
  if (from === "PENDING" && to === "IN_PROGRESS") return "APPROVE"
  if (from === "PENDING" && to === "REJECTED") return "REJECT"
  if (from === "IN_PROGRESS" && to === "DONE") return "COMPLETE"
  return null
}

/** Đơn vị / tổ đội of a mission: the proposer's unit and the units under it, the unit first. */
export function unitAndTeams(units: OrgUnit[], unitCode: string | null): OrgUnit[] {
  const own = units.find((u) => u.code === unitCode)
  if (!own) return []
  const result = [own]
  for (let i = 0; i < result.length; i++) result.push(...units.filter((u) => u.parentId === result[i].id))
  return result
}
