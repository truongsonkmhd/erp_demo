import type { Plan } from "./types.ts"

/** Plan pace for the leader: actual progress against where the plan should be by today. */

const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)
const iso = (dmy: string, year: string) => {
  const [d, m, y] = dmy.trim().split("/")
  return `${y || year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/** "01/10 - 31/10/2026" or "21/10/2026 - 20/11/2026" → ISO start/end (start borrows the end's year). */
export function parsePeriod(period: string): { start: string; end: string } | null {
  const m = /^\s*(\d{1,2}\/\d{1,2}(?:\/\d{4})?)\s*-\s*(\d{1,2}\/\d{1,2}\/(\d{4}))\s*$/.exec(period || "")
  if (!m) return null
  const end = iso(m[2], m[3])
  let start = iso(m[1], m[3])
  // A start without a year after the end belongs to the previous year (e.g. "15/12 - 15/01/2027").
  if (!/\/\d{4}$/.test(m[1]) && start > end) start = iso(m[1], String(Number(m[3]) - 1))
  return { start, end }
}

export type PaceState = "ahead" | "on" | "late" | "critical" | "unknown"
export type Pace = { expected: number | null; gap: number | null; state: PaceState; daysLeft: number | null; dueSoon: boolean }

export const LATE_GAP = 10
export const CRITICAL_GAP = 25

export function planPace(plan: Plan, today: string): Pace {
  const p = parsePeriod(plan.period)
  if (!p) return { expected: null, gap: null, state: plan.status === "Có nguy cơ" ? "critical" : "unknown", daysLeft: null, dueSoon: false }
  const total = Math.max(1, daysBetween(p.start, p.end))
  const elapsed = Math.min(total, Math.max(0, daysBetween(p.start, today)))
  const expected = Math.round((elapsed / total) * 100)
  const gap = plan.progress - expected
  const state: PaceState = plan.status === "Có nguy cơ" || gap < -CRITICAL_GAP ? "critical" : gap < -LATE_GAP ? "late" : gap > LATE_GAP ? "ahead" : "on"
  const daysLeft = daysBetween(today, p.end)
  return { expected, gap, state, daysLeft, dueSoon: daysLeft >= 0 && daysLeft <= 7 && plan.progress < 80 }
}

export const isBehind = (pace: Pace) => pace.state === "late" || pace.state === "critical"

export type PlanNode = { plan: Plan; pace: Pace; children: PlanNode[] }

/** Parent → children tree; within each level the plan furthest behind comes first. */
export function planTree(plans: Plan[], today: string): PlanNode[] {
  const ids = new Set(plans.map((p) => p.id))
  const node = (plan: Plan): PlanNode => ({ plan, pace: planPace(plan, today), children: [] })
  const nodes = new Map(plans.map((p) => [p.id, node(p)]))
  const roots: PlanNode[] = []
  for (const p of plans) {
    const n = nodes.get(p.id)!
    if (p.parent && p.parent !== "-" && ids.has(p.parent) && p.parent !== p.id) nodes.get(p.parent)!.children.push(n)
    else roots.push(n)
  }
  const sort = (list: PlanNode[]) => {
    list.sort((a, b) => (a.pace.gap ?? 0) - (b.pace.gap ?? 0) || a.plan.id.localeCompare(b.plan.id))
    list.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

export function planSummary(plans: Plan[], today: string) {
  const paces = plans.map((p) => ({ plan: p, pace: planPace(p, today) }))
  const federation = plans.filter((p) => p.level === "Liên đoàn")
  const base = federation.length ? federation : plans
  return {
    overall: base.length ? Math.round(base.reduce((s, p) => s + p.progress, 0) / base.length) : 0,
    onTrack: paces.filter((x) => x.pace.state === "on" || x.pace.state === "ahead").length,
    behind: paces.filter((x) => isBehind(x.pace)).length,
    dueSoon: paces.filter((x) => x.pace.dueSoon).length,
  }
}

export type PlanFilter = "all" | "behind" | "dueSoon" | "onTrack"

export function matchesPlan(node: PlanNode, filter: PlanFilter, level: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  return (filter === "all" || (filter === "behind" && isBehind(node.pace)) || (filter === "dueSoon" && node.pace.dueSoon) || (filter === "onTrack" && (node.pace.state === "on" || node.pace.state === "ahead"))) &&
    (!level || node.plan.level === level) &&
    (!q || `${node.plan.id} ${node.plan.title} ${node.plan.owner}`.toLowerCase().includes(q))
}

/** Keeps a node when it or any descendant matches, so the matching plan stays under its parents. */
export function filterTree(nodes: PlanNode[], keep: (n: PlanNode) => boolean): PlanNode[] {
  return nodes.flatMap((n) => {
    const children = filterTree(n.children, keep)
    return keep(n) || children.length ? [{ ...n, children }] : []
  })
}

