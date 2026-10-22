import { groupedBars, lineChart } from "./charts.ts"
import { unitKpis } from "./kpi.ts"
import { isAtRisk, isClosed } from "./rules.ts"
import type { WorkItem } from "./types.ts"
import { isOverrun, openRisks, riskLevel } from "../data/metrics.ts"
import type { Alert } from "../data/alerts.ts"
import type { Disbursement, Project, Risk } from "../data/types.ts"
import { escapeHtml as esc } from "./html.ts"

/** Liên đoàn trưởng dashboard: 4 KPI, 3 charts, alerts and inbox. All figures come from stored records (workflow + business collections). */

// First three validated categorical slots (blue, orange, aqua).
const C = { blue: "#2a78d6", orange: "#eb6834", aqua: "#1baf7a" }

export type BusinessData = { projects: Project[]; disbursement: Disbursement[]; risks: Risk[]; alerts: Alert[] }

/** Alerts derived from stored records: overrun/late projects, high open risks, inspections due, overdue work. */
/** Rule-based alerts (data/alerts.ts, same as the Alerts page) plus late projects and high risks. */
function alerts(biz: BusinessData) {
  const late = biz.projects.filter((p) => p.delayDays > 0).sort((a, b) => b.delayDays - a.delayDays)
  const high = openRisks(biz.risks).filter((r) => riskLevel(r) === "Cao")
  return [
    ...biz.alerts.map((a) => ({ dot: a.level === "Cao" ? "red" : "yellow", title: a.title, sub: a.sub, page: a.page })),
    late.length ? { dot: "red", title: `${late.length} dự án dự báo trễ`, sub: `${late[0].id} chậm ${late[0].delayDays} ngày`, page: "projects" } : null,
    high.length ? { dot: "red", title: `${high.length} rủi ro mức cao đang mở`, sub: high.map((r) => r.title).join(" • "), page: "risks" } : null,
  ].filter((a): a is { dot: string; title: string; sub: string; page: string } => !!a)
}

const card = (title: string, sub: string, body: string, link?: [string, string]) =>
  `<div class="card"><div class="card-head"><div><h3>${title}</h3><div class="mini">${sub}</div></div>${link ? `<button class="btn btn-light" onclick="show('${link[0]}')">${link[1]}</button>` : ""}</div>${body}</div>`

const kpi = (label: string, value: string, sub: string, page: string, tone = "") =>
  `<div class="kpi" style="cursor:pointer" onclick="show('${page}')"><div class="label">${label}</div><div class="value${tone ? ` ${tone}` : ""}">${value}</div><div class="sub">${sub}</div></div>`

export function leaderDashboardHtml(all: WorkItem[], biz: BusinessData, today: string, inboxHtml: string, banner = ""): string {
  const open = all.filter((x) => x.type !== "payment" && !isClosed(x))
  const risky = open.filter((x) => isAtRisk(x, all, today))
  const waiting = all.filter((x) => x.createdBy === "lanhdao" && x.status === "Chờ duyệt").length
  const payments = all.filter((x) => x.type === "payment" && x.owner === "lanhdao" && !isClosed(x)).length
  const months = [...biz.disbursement].sort((a, b) => a.month - b.month)
  const lastActual = months.filter((m) => m.actual != null).at(-1)?.actual ?? 0
  const plan = months.at(-1)?.plan ?? 0
  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  const head = `<div class="ld-head"><div><div class="eyebrow">BAN LÃNH ĐẠO • ${dateLabel.toUpperCase()}</div><h2>Tổng quan điều hành Liên đoàn</h2></div></div>`

  const kpiTiles = `<div class="grid kpis">${[
    kpi("Chỉ đạo đang mở", String(open.length), "Toàn Liên đoàn", "directives"),
    kpi("Nguy cơ trễ", String(risky.length), risky.length ? "Cần đôn đốc" : "Không có việc trễ", "directives", risky.length ? "danger" : ""),
    kpi("Chờ tôi duyệt", String(waiting + payments), `${waiting} chỉ đạo • ${payments} hồ sơ thanh toán`, waiting ? "directives" : "payments"),
    kpi("Giải ngân", `${plan ? Math.round((lastActual / plan) * 100) : 0}%`, `${lastActual} / ${plan} tỷ kế hoạch năm`, "finance"),
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
