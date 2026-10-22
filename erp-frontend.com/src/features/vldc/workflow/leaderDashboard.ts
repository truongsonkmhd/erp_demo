import { groupedBars, lineChart } from "./charts.ts"
import { KPI_GIVER, RATING_LABELS, itemFlags, unitKpis, type UnitKpi } from "./kpi.ts"
import { isClosed } from "./rules.ts"
import { escapeHtml as esc, formatBillion, formatMoney, jsCall } from "./html.ts"
import type { WorkItem } from "./types.ts"
import { isOverrun } from "../data/metrics.ts"
import type { Disbursement, Project, Risk } from "../data/types.ts"

/** Liên đoàn trưởng dashboard: 4 money KPI (Thu – Chi – Công nợ) and 3 charts. All figures come from stored records (workflow + business collections). */

// First three validated categorical slots (blue, orange, aqua).
const C = { blue: "#2a78d6", orange: "#eb6834", aqua: "#1baf7a" }

/**
 * Money figures (VND) from Kế toán › Thu, Chi, Công nợ. revenue = contract values + thu khác (already received), so
 * revenue − thu = remaining, the contract balance still owed.
 */
export type CashFigures = {
  revenue: number; contracts: number; thu: number; thuOther: number; thuMonth: number; chi: number; chiMonth: number; remaining: number; doneOwing: number
}
/** Giải ngân in plain VND figures (see data/disbursementCore.ts). */
export type SpendFigures = { yearPlan: number; planToDate: number; spent: number; pctOfPlanToDate: number; pctOfYear: number; gap: number }
/** Head counts from the staff profiles and the org units (Phòng ban): units = every card of the Phòng ban page. */
export type OrgFigures = { staff: number; units: number; support: number; direct: number; subUnits: number }
export type BusinessData = { projects: Project[]; disbursement: Disbursement[]; risks: Risk[]; cash: CashFigures; spend: SpendFigures; org: OrgFigures }

/** Full amount: 4.407.500.000 đ. */
const vnd = formatMoney
/** Exact share with up to 2 decimals: 27,87%. */
const pct = (part: number, whole: number) => `${(whole ? (part / whole) * 100 : 0).toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`

const RATING_BADGE: Record<UnitKpi["rating"], string> = { good: "b-ok", watch: "b-warn", bad: "b-danger", none: "b-info" }

/** Units ranked by KPI = completed ÷ work given by the head, with the counts behind it. */
function kpiScorecard(kpis: UnitKpi[], today: string): string {
  const ranked = [...kpis].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const given = (k: UnitKpi) => k.items.filter((x) => x.type === "directive" && x.createdBy === KPI_GIVER)
  const rows = ranked.map((k) => {
    const g = given(k)
    const open = g.filter((x) => !isClosed(x))
    const waiting = open.filter((x) => x.status === "Chờ duyệt").length
    const overdue = open.filter((x) => itemFlags(x, today).overdue).length
    const count = (n: number, cls = "") => (n ? `<b${cls ? ` style="color:var(--${cls})"` : ""}>${n}</b>` : '<span class="mini">0</span>')
    return `<tr class="ld-kpi-row" ${jsCall("wfUnitKpi", k.unit.id)}><td><b>${esc(k.unit.name)}</b></td>
<td><div class="ld-kpi-val ${k.rating}"><span class="ld-kpi-score ${k.rating}">${k.score == null ? "–" : `${k.score}%`}</span><span class="badge ${RATING_BADGE[k.rating]}">${RATING_LABELS[k.rating]}</span></div><div class="ld-kpi-bar ${k.rating}"><i style="width:${k.score ?? 0}%"></i></div></td>
<td><b>${k.completed} / ${k.assigned}</b> <span class="mini">việc</span></td><td>${count(waiting, "warning")}</td><td>${count(open.length - waiting)}</td><td>${count(overdue, "danger")}</td></tr>`
  }).join("")
  return `<div class="ld-kpi"><table><tr><th>Đơn vị</th><th>KPI (%)</th><th>Hoàn thành / được giao</th><th>Chờ duyệt</th><th>Đang làm</th><th>Quá hạn</th></tr>${rows}</table>
<div class="mini" style="margin-top:8px">KPI = số việc Liên đoàn trưởng giao đã hoàn thành (đã duyệt) ÷ tổng số việc Liên đoàn trưởng giao cho đơn vị × 100%. Việc con do đơn vị tự chia không tính riêng. Xếp loại: ≥ 85% Tốt • 70–84% Theo dõi • &lt; 70% Cần can thiệp.</div></div>`
}

const card = (title: string, sub: string, body: string, link?: [string, string]) =>
  `<div class="card"><div class="card-head"><div><h3>${title}</h3><div class="mini">${sub}</div></div>${link ? `<button class="btn btn-light" onclick="show('${link[0]}')">${link[1]}</button>` : ""}</div>${body}</div>`

const kpi = (label: string, value: string, sub: string, page: string, tone = "") =>
  `<div class="kpi" style="cursor:pointer" onclick="show('${page}')"><div class="label">${label}</div><div class="value${tone ? ` ${tone}` : ""}">${value}</div><div class="sub">${sub}</div></div>`

export function leaderDashboardHtml(all: WorkItem[], biz: BusinessData, today: string, banner = ""): string {
  const cash = biz.cash
  const months = [...biz.disbursement].sort((a, b) => a.month - b.month)
  const plan = months.at(-1)?.plan ?? 0
  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
  const dateShort = today.split("-").reverse().join("/")

  const head = `<div class="ld-head"><div><div class="eyebrow">BAN LÃNH ĐẠO • ${dateLabel.toUpperCase()}</div><h2>Tổng quan điều hành Liên đoàn</h2></div></div>`

  const kpiTiles = `<div class="grid kpis ld-tiles">${[
    kpi("Doanh thu", vnd(cash.revenue), `${cash.contracts} hợp đồng ${vnd(cash.revenue - cash.thuOther)} • thu khác ${vnd(cash.thuOther)}`, "debts"),
    kpi("Tổng thu", vnd(cash.thu), `Đã thu ${pct(cash.thu, cash.revenue)} doanh thu • tháng này ${vnd(cash.thuMonth)}`, "cashin"),
    kpi("Tổng chi", vnd(cash.chi), `Tháng này ${vnd(cash.chiMonth)} • chênh lệch thu – chi ${vnd(cash.thu - cash.chi)}`, "cashout"),
    kpi("Còn phải thu", vnd(cash.remaining), `= Doanh thu − Tổng thu${cash.doneOwing ? ` • ${cash.doneOwing} dự án đã xong chưa thu đủ` : ""}`, "debts", cash.doneOwing ? "danger" : ""),
    kpi("Tổng số nhân sự", String(biz.org.staff), `Hồ sơ nhân sự đang quản lý • ${biz.org.units} phòng ban`, "hr"),
    kpi("Tổng số phòng ban", String(biz.org.units), `${biz.org.support} phòng chức năng • ${biz.org.direct} đơn vị trực thuộc • ${biz.org.subUnits} tổ/phòng`, "organization"),
  ].join("")}</div>`

  const kpis = unitKpis(all, today)
  const unitCard = kpiScorecard(kpis, today)
  const disbursement = lineChart(months.map((m) => `T${m.month}`), [
    { name: "Kế hoạch (theo ngân sách dự án)", color: C.blue, values: months.map((m) => m.plan), dashed: true },
    { name: "Đã chi thực tế (phiếu chi)", color: C.orange, values: months.map((m) => m.actual) },
  ], { max: plan || undefined, format: formatBillion, width: 960, height: 200 })
  const sp = biz.spend
  const behind = sp.gap > 0
  const spendHead = `<div class="ld-spend">
<div><span>Kế hoạch cả năm</span><b>${vnd(sp.yearPlan)}</b><small>Tổng ngân sách dự án rơi vào năm ${today.slice(0, 4)}</small></div>
<div><span>Kế hoạch đến hôm nay</span><b>${vnd(sp.planToDate)}</b><small>Số tiền lẽ ra đã chi đến ${esc(dateShort)}</small></div>
<div><span>Đã chi đến hôm nay</span><b>${vnd(sp.spent)}</b><small>Đạt ${pct(sp.spent, sp.planToDate)} kế hoạch đến nay • ${pct(sp.spent, sp.yearPlan)} kế hoạch cả năm</small></div>
<div class="${behind ? "bad" : "good"}"><span>${behind ? "Chậm so với kế hoạch" : "Vượt kế hoạch"}</span><b>${vnd(Math.abs(sp.gap))}</b><small>${behind ? "Số tiền còn chưa chi so với dự kiến" : "Đã chi nhiều hơn dự kiến"}</small></div>
</div>`
  const spendNote = `<div class="mini ld-note">Nét đứt: tiền dự kiến chi (ngân sách dự án chia theo ngày thực hiện) • Nét liền: tiền đã chi theo phiếu chi • Cả hai cộng dồn từ đầu năm</div>`
  const projects = biz.projects
  const costProgress = groupedBars(projects.map((p) => p.id), [
    { name: "Tiến độ kỹ thuật", color: C.blue, values: projects.map((p) => p.technical) },
    { name: "Chi phí đã dùng", color: C.orange, values: projects.map((p) => p.costUsed) },
  ], { flag: (i) => (isOverrun(projects[i]) ? "⚠ lệch" : ""), width: 960 })



  return `${banner}<div class="leader-dash">${head}${kpiTiles}
<div class="ld-charts">
<div class="ld-wide ld-spend-card">${card(`Giải ngân năm ${today.slice(0, 4)}`, "So sánh số tiền dự kiến chi với số tiền đã chi thật", `${spendHead}${disbursement}${spendNote}`)}</div>
<div class="ld-wide">${card("Tiến độ và chi phí theo dự án", "Chi phí vượt tiến độ quá 10% được gắn cờ", costProgress, ["projects", "Dự án"])}</div>
<div class="ld-wide">${card("KPI theo đơn vị", "Tỷ lệ việc Liên đoàn trưởng giao đã hoàn thành • bấm một dòng để xem các việc", unitCard)}</div>
</div></div>`
}
