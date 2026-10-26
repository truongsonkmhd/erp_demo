import { isClosed, rolledUpProgress } from "./rules.ts"
import type { WorkItem } from "./types.ts"
import { UNIT_DEFS, rolesOfUnit, unitName, type UnitCode } from "../data/org.ts"
import { managedUnits, managesAllUnits } from "../data/access.ts"

/** Unit KPIs computed from the shared work items, so every page shows the same, traceable numbers. */

/** match overrides the default "owned by one of the unit's roles" (used for tổ/phòng). */
export type Unit = { id: string; name: string; short: string; roles: string[]; match?: (item: WorkItem) => boolean }

/** KPI units: every department except the leadership, field units first (ids are tbl_department codes). */
const KPI_ORDER: UnitCode[] = ["MD", "DB", "HK", "TT", "KT", "KHTC", "TCHC"]

export function kpiUnits(): Unit[] {
  return KPI_ORDER.map((code) => {
    const def = UNIT_DEFS.find((u) => u.code === code)!
    return { id: code, name: unitName(code), short: def.short, roles: rolesOfUnit(code) }
  })
}

export const unitOfRole = (role: string): Unit | undefined => kpiUnits().find((u) => u.roles.includes(role))

/** Roles grouped by the unit their work counts for (KPI order, input order inside a unit); roles of no unit go last under "Khác". */
export function rolesByUnit(roles: string[]): { unit: string; name: string; roles: string[] }[] {
  const groups = kpiUnits().map((u) => ({ unit: u.id as string, name: u.name, roles: roles.filter((r) => u.roles.includes(r)) }))
  const other = roles.filter((r) => !unitOfRole(r))
  return [...groups, { unit: "", name: "Khác", roles: other }].filter((g) => g.roles.length)
}

export type CriterionKey = "progress" | "quality" | "onTime" | "evidence" | "cost"

/** Supporting indicators shown next to the KPI (not part of the score, which is the completion rate). */
export const CRITERIA: { key: CriterionKey; label: string; weight: number; rule: string }[] = [
  { key: "progress", label: "Tiến độ", weight: 30, rule: "Trung bình % hoàn thành các việc (việc đã duyệt = 100%)" },
  { key: "quality", label: "Chất lượng / Nghiệm thu", weight: 25, rule: "Tỷ lệ việc đã báo cáo hoàn thành mà không bị trả lại" },
  { key: "onTime", label: "SLA / Đúng hạn", weight: 20, rule: "Tỷ lệ việc chưa quá hạn hoặc được duyệt trước hạn" },
  { key: "cost", label: "Chi phí / Hiệu quả", weight: 15, rule: "Chưa kết nối dữ liệu tài chính – tạm loại khỏi điểm" },
  { key: "evidence", label: "Hồ sơ / Minh chứng", weight: 10, rule: "Tỷ lệ việc đã triển khai có minh chứng" },
]

/** A ratio criterion: null value when nothing qualifies yet. */
export type Criterion = { value: number | null; hit: number; of: number }

export type ItemFlags = { overdue: boolean; returned: boolean; noEvidence: boolean; late: boolean }

export type UnitKpi = {
  unit: Unit
  items: WorkItem[]
  /** Work the federation head gave the unit (its directives) and how many of them are completed (approved). */
  assigned: number
  completed: number
  done: number
  open: number
  criteria: Record<Exclude<CriterionKey, "cost">, Criterion>
  score: number | null
  rating: "good" | "watch" | "bad" | "none"
}

const pct = (hit: number, of: number): Criterion => ({ value: of ? Math.round((hit / of) * 100) : null, hit, of })
const approvedOn = (item: WorkItem) => [...item.history].reverse().find((h) => h.action === "approve")?.at.slice(0, 10)

export function itemFlags(item: WorkItem, today: string): ItemFlags {
  const closed = isClosed(item)
  const approved = approvedOn(item)
  return {
    overdue: !closed && item.due < today,
    late: closed && !!approved && approved > item.due,
    returned: item.history.some((h) => h.action === "return"),
    noEvidence: item.status !== "Mới giao" && !item.evidence?.trim(),
  }
}

export const RATING_LABELS: Record<UnitKpi["rating"], string> = { good: "Tốt", watch: "Theo dõi", bad: "Cần can thiệp", none: "Chưa có việc" }

export function ratingOf(score: number | null): UnitKpi["rating"] {
  return score == null ? "none" : score >= 85 ? "good" : score >= 70 ? "watch" : "bad"
}

/** Unit KPI is measured on the work given by whoever manages the whole organisation (chức vụ Lãnh đạo by default). */
export const isKpiGiver = (role: string) => managesAllUnits(role)

/** Units whose KPI the role may see: those it manages, else its own unit; nothing when it has no unit. */
export function visibleKpiUnits(role: string): Unit[] {
  const managed = managedUnits(role)
  if (managed.size) return kpiUnits().filter((u) => managed.has(u.id))
  const own = unitOfRole(role)
  return own ? [own] : []
}

/** KPI = completed ÷ all work the federation head gave the unit × 100 (approved = completed; sub-tasks are the unit's own split). */
export function unitKpi(unit: Unit, all: WorkItem[], today: string): UnitKpi {
  const owns = unit.match ?? ((x: WorkItem) => unit.roles.includes(x.owner))
  const items = all.filter((x) => x.type !== "payment" && owns(x)).sort((a, b) => a.due.localeCompare(b.due))
  const flags = items.map((x) => itemFlags(x, today))
  const submitted = items.filter((x) => x.history.some((h) => h.action === "submit"))
  const started = items.filter((x) => x.status !== "Mới giao")
  const progressSum = items.reduce((s, x) => s + rolledUpProgress(x, all), 0)
  const criteria = {
    progress: { value: items.length ? Math.round(progressSum / items.length) : null, hit: progressSum, of: items.length },
    quality: pct(submitted.filter((x) => !x.history.some((h) => h.action === "return")).length, submitted.length),
    onTime: pct(flags.filter((f) => !f.overdue && !f.late).length, items.length),
    evidence: pct(started.filter((x) => x.evidence?.trim()).length, started.length),
  }
  const given = items.filter((x) => x.type === "directive" && isKpiGiver(x.createdBy))
  const completed = given.filter(isClosed).length
  const score = given.length ? Math.round((completed / given.length) * 100) : null
  const done = items.filter(isClosed).length
  return { unit, items, assigned: given.length, completed, done, open: items.length - done, criteria, score, rating: ratingOf(score) }
}

export function unitKpis(all: WorkItem[], today: string): UnitKpi[] {
  return kpiUnits().map((u) => unitKpi(u, all, today))
}

/** KPI of each tổ/phòng: the work tagged with it, scored like a unit. */
export function subUnitKpis(subs: { id: string; name: string }[], all: WorkItem[], today: string): UnitKpi[] {
  return subs.map((s) => unitKpi({ id: s.id, name: s.name, short: s.name, roles: [], match: (x) => x.subUnit === s.id }, all, today))
}

/** Liên đoàn-wide figures: averages over units that have work, plus raw overdue count. */
export function overallKpi(kpis: UnitKpi[], today: string) {
  const avg = (pick: (k: UnitKpi) => number | null) => {
    const vals = kpis.map(pick).filter((v): v is number => v != null)
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
  }
  return {
    score: avg((k) => k.score),
    onTime: avg((k) => k.criteria.onTime.value),
    quality: avg((k) => k.criteria.quality.value),
    overdue: kpis.reduce((s, k) => s + k.items.filter((x) => itemFlags(x, today).overdue).length, 0),
  }
}
