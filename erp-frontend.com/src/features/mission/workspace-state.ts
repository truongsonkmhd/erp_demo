export type WorkspaceTab = "missions" | "overview" | "wbs" | "responsibility" | "kanban" | "finance"

const tabs: WorkspaceTab[] = ["overview", "wbs", "responsibility", "kanban", "finance"]

export function readWorkspaceLocation(search: string, missions: readonly { id: string }[]): { missionId: string | null; tab: WorkspaceTab } {
  const params = new URLSearchParams(search)
  const requestedMission = params.get("mission")
  if (!requestedMission || !missions.some((mission) => mission.id === requestedMission)) {
    return { missionId: null, tab: "missions" }
  }
  const requestedTab = params.get("tab") as WorkspaceTab | null
  return { missionId: requestedMission, tab: requestedTab && tabs.includes(requestedTab) ? requestedTab : "overview" }
}

export function boardWorkItems<T extends { missionId: string; kind: string }>(nodes: readonly T[], missionId: string): T[] {
  return nodes.filter((node) => (missionId === "all" || node.missionId === missionId) && node.kind === "work")
}

export function ancestorIds(nodes: readonly { id: string; parentId: string | null }[], nodeId: string): string[] {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const result: string[] = []
  const visited = new Set<string>([nodeId])
  let parentId = byId.get(nodeId)?.parentId
  while (parentId && !visited.has(parentId)) {
    result.push(parentId)
    visited.add(parentId)
    parentId = byId.get(parentId)?.parentId
  }
  return result
}
