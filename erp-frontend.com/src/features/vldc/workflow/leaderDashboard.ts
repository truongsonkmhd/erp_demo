import { groupedBars, lineChart } from "./charts.ts"
import { unitKpis } from "./kpi.ts"
import type { WorkItem } from "./types.ts"
import { isOverrun, openRisks, riskLevel } from "../data/metrics.ts"
import type { Alert } from "../data/alerts.ts"
import type { Disbursement, Project, Risk } from "../data/types.ts"
import { escapeHtml as esc } from "./html.ts"

/** Liên đoàn trưởng dashboard: 4 money KPI (Thu – Chi – Công nợ), 3 charts, alerts and inbox. All figures come from stored records (workflow + business collections). */

// First three validated categorical slots (blue, orange, aqua).
const C = { blue: "#2a78d6", orange: "#eb6834", aqua: "#1baf7a" }

/**
 * Money figures (VND) from Kế toán › Thu, Chi, Công nợ. revenue = contract values + thu khác (already received), so
 * revenue − thu = remaining, the contract balance still owed.
 */
export type CashFigures = {
  revenue: number; contracts: number; thu: number; thuOther: number; thuMonth: number; chi: number; chiMonth: number; remaining: number; doneOwing: number
}
export type BusinessData = { projects: Project[]; disbursement: Disbursement[]; risks: Risk[]; alerts: Alert[]; cash: CashFigures }

/** Exact amount, never rounded: 4.907.500.000 đ. */
const vnd = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`

/** Alerts derived from stored records: overrun/late projects, high open risks, inspections due, overdue work. */
/** Rule-based alerts (data/alerts.ts, same as the Alerts page) plus late projects and high risks. */
function alerts(biz: BusinessData) {
  const late = biz.projects.filter((p) => p.delayDays > 0).sort((a, b) => b.delayDays - a.delayDays)
  const lateWork = biz.projects.filter((p) => p.workOverdue > 0)
  const high = openRisks(biz.risks).filter((r) => riskLevel(r) === "Cao")
  return [
    ...biz.alerts.map((a) => ({ dot: a.level === "Cao" ? "red" : "yellow", title: a.title, sub: a.sub, page: a.page })),
    late.length ? { dot: "red", title: `${late.length} dự án dự báo trễ`, sub: `${late[0].id} chậm ${late[0].delayDays} ngày`, page: "projects" } : null,
    lateWork.length ? { dot: "red", title: `${lateWork.length} dự án có việc giao quá hạn`, sub: lateWork.map((p) => `${p.id}: ${p.workOverdue} việc`).join(" • "), page: "projects" } : null,
    high.length ? { dot: "red", title: `${high.length} rủi ro mức cao đang mở`, sub: high.map((r) => r.title).join(" • "), page: "risks" } : null,
  ].filter((a): a is { dot: string; title: string; sub: string; page: string } => !!a)
}

const card = (title: string, sub: string, body: string, link?: [string, string]) =>
  `<div class="card"><div class="card-head"><div><h3>${title}</h3><div class="mini">${sub}</div></div>${link ? `<button class="btn btn-light" onclick="show('${link[0]}')">${link[1]}</button>` : ""}</div>${body}</div>`

const kpi = (label: string, value: string, sub: string, page: string, tone = "") =>
  `<div class="kpi" style="cursor:pointer" onclick="show('${page}')"><div class="label">${label}</div><div class="value${tone ? ` ${tone}` : ""}">${value}</div><div class="sub">${sub}</div></div>`

export function leaderDashboardHtml(all: WorkItem[], biz: BusinessData, today: string, inboxHtml: string, banner = ""): string {
  const cash = biz.cash
  const months = [...biz.disbursement].sort((a, b) => a.month - b.month)
  const plan = months.at(-1)?.plan ?? 0
  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  const head = `<div class="ld-head"><div><div class="eyebrow">BAN LÃNH ĐẠO • ${dateLabel.toUpperCase()}</div><h2>Tổng quan điều hành Liên đoàn</h2></div></div>`

  const kpiTiles = `<div class="grid kpis">${[
    kpi("Doanh thu", vnd(cash.revenue), `${cash.contracts} hợp đồng ${vnd(cash.revenue - cash.thuOther)} • thu khác ${vnd(cash.thuOther)}`, "debts"),
    kpi("Tổng thu", vnd(cash.thu), `Đã thu ${cash.revenue ? Math.round((cash.thu / cash.revenue) * 100) : 0}% doanh thu • tháng này ${vnd(cash.thuMonth)}`, "cashin"),
    kpi("Tổng chi", vnd(cash.chi), `Tháng này ${vnd(cash.chiMonth)} • chênh lệch thu – chi ${vnd(cash.thu - cash.chi)}`, "cashout"),
    kpi("Còn phải thu", vnd(cash.remaining), `= Doanh thu − Tổng thu${cash.doneOwing ? ` • ${cash.doneOwing} dự án đã xong chưa thu đủ` : ""}`, "debts", cash.doneOwing ? "danger" : ""),
  ].join("")}</div>`

  const kpis = unitKpis(all, today)
  const unitChart = groupedBars(kpis.map((k) => k.unit.short), [
    { name: "Tiến độ", color: C.blue, values: kpis.map((k) => k.criteria.progress.value) },
    { name: "Đúng hạn", color: C.orange, values: kpis.map((k) => k.criteria.onTime.value) },
    { name: "Chất lượng", color: C.aqua, values: kpis.map((k) => k.criteria.quality.value) },
  ])
  const disbursement = lineChart(months.map((m) => `T${m.month}`), [
    { name: "Kế hoạch lũy kế", color: C.blue, values: months.map((m) => m.plan), dashed: true },
    { name: "Thực hiện lũy kế", color: C.orange, values: months.map((m) => m.actual) },
  ], { unit: " tỷ", max: plan || undefined })
  const projects = biz.projects
  const costProgress = groupedBars(projects.map((p) => p.id), [
    { name: "Tiến độ kỹ thuật", color: C.blue, values: projects.map((p) => p.technical) },
    { name: "Chi phí đã dùng", color: C.orange, values: projects.map((p) => p.costUsed) },
  ], { flag: (i) => (isOverrun(projects[i]) ? "⚠ lệch" : "") })

  const alertList = alerts(biz).map((a) => `<div class="alert" style="cursor:pointer" onclick="show('${a.page}')"><span class="dot ${a.dot}"></span><div><b>${esc(a.title)}</b><div class="mini">${esc(a.sub)}</div></div></div>`).join("") || '<div class="mini">Không có cảnh báo.</div>'


  return `${banner}<div class="leader-dash">${head}${kpiTiles}
<div class="ld-charts">
${card(`Giải ngân năm ${today.slice(0, 4)}`, "Lũy kế kế hoạch và thực hiện (tỷ đồng)", disbursement, ["finance", "Tài chính"])}
${card("Tiến độ và chi phí theo dự án", "Chi phí vượt tiến độ quá 10% được gắn cờ", costProgress, ["projects", "Dự án"])}
${card("KPI theo đơn vị", "Tính từ công việc thực tế • tiến độ, đúng hạn, chất lượng (%)", unitChart, ["performance", "Phân tích KPI"])}
${card("Cảnh báo cần chú ý", "Theo quy tắc cảnh báo + dự án trễ, rủi ro cao", alertList, ["alerts", "Quy tắc"])}
</div>
${inboxHtml}</div>`
}
