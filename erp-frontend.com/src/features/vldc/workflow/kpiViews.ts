import { escapeHtml as esc, formatDate, jsCall, statusBadge } from "./html.ts"
import { CRITERIA, RATING_LABELS, itemFlags, overallKpi, subUnitKpis, unitKpi, unitKpis, unitOfRole, kpiUnits, type UnitKpi } from "./kpi.ts"
import { ROLE_TITLES, isClosed, rolledUpProgress } from "./rules.ts"
import type { WorkItem } from "./types.ts"

/** KPI & Performance Center and the per-unit drill-down, rendered from unit KPIs computed off live work items. */

const RATING_BADGE: Record<UnitKpi["rating"], string> = { good: "b-ok", watch: "b-warn", bad: "b-danger", none: "b-info" }
const fmt = (v: number | null) => (v == null ? "–" : `${v}%`)
const scoreClass = (v: number | null) => (v == null ? "" : v >= 85 ? "good" : v >= 70 ? "watch" : "bad")

export const ratingBadge = (k: UnitKpi) => `<span class="badge ${RATING_BADGE[k.rating]}">${RATING_LABELS[k.rating]}</span>`

function unitRow(k: UnitKpi): string {
  const c = k.criteria
  return `<div class="kpi-unit-row" ${jsCall("wfUnitKpi", k.unit.id)} title="Xem công việc của ${esc(k.unit.name)}"><div class="kpi-gauge" style="--pct:${k.score ?? 0}%"><b>${k.score ?? "–"}</b></div><div><b>${esc(k.unit.name)}</b><div class="mini">Tiến độ ${fmt(c.progress.value)} • Chất lượng ${fmt(c.quality.value)} • Đúng hạn ${fmt(c.onTime.value)} • Minh chứng ${fmt(c.evidence.value)}</div><div class="progress" style="margin-top:7px"><i style="width:${k.score ?? 0}%"></i></div><div class="mini" style="margin-top:5px">${k.completed}/${k.assigned} việc Liên đoàn trưởng giao đã hoàn thành • ${k.open} việc đang làm</div></div><div class="kpi-unit-side">${ratingBadge(k)}<span class="mini">Xem chi tiết ›</span></div></div>`
}

function criteriaCard(): string {
  const rows = CRITERIA.filter((c) => c.key !== "cost").map((c) => `<div class="metric"><span>${c.label}<div class="mini">${c.rule}</div></span><b>tham khảo</b></div>`).join("")
  return `<div class="card"><h3>Cách tính KPI</h3><div class="alert"><span class="dot blue"></span><div><b>KPI = việc hoàn thành ÷ việc được giao</b><div class="mini">Tổng số việc Liên đoàn trưởng giao cho đơn vị là 100%; mỗi việc được duyệt hoàn thành cộng phần tương ứng. Việc con do đơn vị tự chia không tính riêng. Xếp loại: ≥ 85% Tốt • 70–84% Theo dõi • &lt; 70% Cần can thiệp.</div></div></div><h4 style="margin-top:12px">Chỉ số tham khảo (không tính vào KPI)</h4>${rows}</div>`
}

function heatmap(kpis: UnitKpi[]): string {
  const cell = (v: number | null) => `<div class="score ${scoreClass(v)}">${fmt(v)}</div>`
  return `<div class="card"><div class="card-head"><div><h3>Hiệu suất theo tiêu chí</h3><div class="mini">Bấm tên đơn vị để xem công việc</div></div></div><div class="heatmap kpi-heatmap"><div class="head">Đơn vị</div><div class="head">Tiến độ</div><div class="head">Chất lượng</div><div class="head">Đúng hạn</div><div class="head">Minh chứng</div><div class="head">Điểm</div>${kpis.map((k) => `<div><a href="javascript:void 0" ${jsCall("wfUnitKpi", k.unit.id)}><b>${esc(k.unit.name)}</b></a></div>${cell(k.criteria.progress.value)}${cell(k.criteria.quality.value)}${cell(k.criteria.onTime.value)}${cell(k.criteria.evidence.value)}<div class="score ${k.rating}">${k.score ?? "–"}</div>`).join("")}</div></div>`
}

export function performanceHtml(all: WorkItem[], role: string, today: string): string {
  const own = unitOfRole(role)
  const kpis = role === "lanhdao" || !own ? unitKpis(all, today) : [unitKpi(own, all, today)]
  const total = overallKpi(kpis, today)
  const kpi = (label: string, value: string, sub: string) => `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`
  const scope = kpis.length > 1 ? `${kpis.length} đơn vị` : esc(kpis[0]?.unit.name ?? "")
  return `<div class="grid kpis">${[
    kpi("KPI tổng hợp", fmt(total.score), `Trung bình ${scope}`),
    kpi("Đúng hạn", fmt(total.onTime), "Việc chưa quá hạn / duyệt trước hạn"),
    kpi("Chất lượng", fmt(total.quality), "Duyệt ngay lần đầu"),
    kpi("Việc quá hạn", String(total.overdue), "Đang mở, đã qua hạn"),
  ].join("")}</div>
<div class="grid twoeq" style="margin-top:14px"><div class="card"><div class="card-head"><div><h3>KPI tổng hợp</h3><div class="mini">Tính tự động từ chỉ đạo & công việc • bấm một dòng để xem chi tiết</div></div><span class="kpi-pill">Nguồn: Chỉ đạo + Việc được giao</span></div>${kpis.map(unitRow).join("")}</div>${criteriaCard()}</div>
<div style="margin-top:14px">${heatmap(kpis)}</div>`
}

function itemRows(items: WorkItem[], all: WorkItem[], today: string): string {
  if (!items.length) return '<tr><td colspan="8" class="mini">Không có.</td></tr>'
  return items.map((x) => {
    const f = itemFlags(x, today)
    const p = rolledUpProgress(x, all)
    const flags = [
      f.overdue ? '<span class="badge b-danger">Quá hạn</span>' : "",
      f.late ? '<span class="badge b-warn">Duyệt trễ hạn</span>' : "",
      f.returned ? '<span class="badge b-warn">Bị trả lại</span>' : "",
      f.noEvidence ? '<span class="badge b-info">Thiếu minh chứng</span>' : "",
    ].join(" ")
    return `<tr><td><b>${esc(x.id)}</b></td><td>${esc(x.title)}${x.parentId ? `<div class="mini">Việc con của ${esc(x.parentId)}</div>` : ""}</td><td>${esc(ROLE_TITLES[x.owner] || x.owner)}</td><td>${statusBadge(x)}</td><td style="min-width:120px"><div class="progress"><i style="width:${p}%"></i></div><span class="mini">${p}%</span></td><td>${formatDate(x.due)}</td><td>${flags || '<span class="mini">–</span>'}</td><td><button class="btn btn-light" ${jsCall("wfOpen", x.id)}>Mở</button></td></tr>`
  }).join("")
}

const itemTable = (items: WorkItem[], all: WorkItem[], today: string) =>
  `<table><tr><th>Mã</th><th>Nội dung</th><th>Chủ trì</th><th>Trạng thái</th><th>Tiến độ</th><th>Hạn</th><th>Lưu ý</th><th></th></tr>${itemRows(items, all, today)}</table>`

/** Drill-down: how the score was reached, then the unit's open and finished work. */
/** subs: the unit's tổ/phòng – each gets its own KPI row. */
export function unitDetailHtml(unitId: string, all: WorkItem[], today: string, subs: { id: string; name: string }[] = []): string {
  const unit = kpiUnits().find((u) => u.id === unitId)
  if (!unit) return '<div class="mini">Không tìm thấy đơn vị.</div>'
  const k = unitKpi(unit, all, today)
  const c = k.criteria
  const explain: Record<string, string> = {
    progress: c.progress.of ? `Trung bình ${c.progress.of} việc` : "Chưa có việc",
    quality: c.quality.of ? `${c.quality.hit}/${c.quality.of} việc duyệt không bị trả lại` : "Chưa có việc báo cáo hoàn thành",
    onTime: c.onTime.of ? `${c.onTime.hit}/${c.onTime.of} việc đúng hạn` : "Chưa có việc",
    evidence: c.evidence.of ? `${c.evidence.hit}/${c.evidence.of} việc đã triển khai có minh chứng` : "Chưa có việc triển khai",
    cost: "Chưa kết nối dữ liệu tài chính",
  }
  const rows = CRITERIA.filter((cr) => cr.key !== "cost").map((cr) => {
    const v = c[cr.key as Exclude<typeof cr.key, "cost">].value
    return `<tr><td><b>${cr.label}</b></td><td class="mini">${explain[cr.key]}</td><td><span class="score ${scoreClass(v)}" style="display:inline-block;min-width:52px;padding:3px 6px;border-radius:8px">${fmt(v)}</span></td></tr>`
  }).join("")
  const open = k.items.filter((x) => !isClosed(x))
  const done = k.items.filter(isClosed)
  const subK = subUnitKpis(subs, all, today)
  const untagged = k.items.filter((x) => !x.subUnit || !subs.some((s) => s.id === x.subUnit)).length
  const subRows = subK.length
    ? `<h4 style="margin-top:16px">Theo tổ / phòng</h4><table><tr><th>Tổ / phòng</th><th>Việc</th><th>Đang mở</th><th>Hoàn thành / được giao</th><th>KPI</th></tr>${subK.map((s) => `<tr><td><b>${esc(s.unit.name)}</b></td><td>${s.items.length}</td><td>${s.open}</td><td>${s.completed} / ${s.assigned}</td><td>${fmt(s.score)} ${ratingBadge(s)}</td></tr>`).join("")}</table>${untagged ? `<div class="mini">${untagged} việc giao chung cho đơn vị, chưa gắn tổ.</div>` : ""}`
    : ""
  return `<div class="kpi-detail-head"><div class="kpi-gauge" style="--pct:${k.score ?? 0}%"><b>${k.score ?? "–"}</b></div><div><div class="mini">${unit.roles.map((r) => esc(ROLE_TITLES[r] || r)).join(" • ")}</div><div style="margin:4px 0">${ratingBadge(k)}</div><div><b>KPI ${k.score == null ? "–" : `${k.score}%`}</b> = ${k.completed} việc hoàn thành ÷ ${k.assigned} việc Liên đoàn trưởng giao</div><div class="mini">${k.items.length} việc (gồm việc con) • ${k.done} hoàn thành • ${k.open} đang làm</div></div></div>
<h4 style="margin-top:12px">Chỉ số tham khảo (không tính vào KPI)</h4><table><tr><th>Chỉ số</th><th>Cách ra số</th><th>Kết quả</th></tr>${rows}</table>
${subRows}<h4 style="margin-top:16px">Đang làm (${open.length})</h4>${itemTable(open, all, today)}
<h4 style="margin-top:16px">Đã hoàn thành (${done.length})</h4>${itemTable(done, all, today)}`
}
