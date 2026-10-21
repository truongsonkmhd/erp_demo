import { escapeHtml as esc, jsCall } from "../workflow/html"
import { overallKpi, unitKpis } from "../workflow/kpi"
import { isClosed } from "../workflow/rules"
import { workflowStore } from "../workflow/repository"
import { localToday, vnDate } from "./dates"
import * as M from "./metrics"
import { vldcData } from "./registry"
import type { OrgStats, Project, Risk } from "./types"

/** Engine pages rebuilt on Firestore data: every tile is computed from the records shown below it. */

type Ctx = { role(): string }
const D = vldcData.get
const content = () => document.getElementById("content")
const today = () => localToday()

export const kpi = (label: string, value: string | number, sub: string) =>
  `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`
export const kpis = (...tiles: string[]) => `<div class="grid kpis">${tiles.join("")}</div>`
export const bar = (label: string, pct: number, right = `${pct}%`) =>
  `<div class="chart-row"><span>${esc(label)}</span><div class="chart-track"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div><b>${right}</b></div>`
export const metric = (label: string, value: string | number) => `<div class="metric"><span>${esc(label)}</span><b>${value}</b></div>`
export const ty = (billion: number) => `${billion.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`
export const tr = (million: number) => (million >= 1000 ? ty(million / 1000) : `${million.toLocaleString("vi-VN")} triệu`)
const riskBadge = (r: Risk) => {
  const level = M.riskLevel(r)
  return `<span class="badge ${level === "Cao" ? "b-danger" : level === "TB" ? "b-warn" : "b-ok"}">${level}</span>`
}
const delayBadge = (p: Project) =>
  p.delayDays > 14 ? `<span class="badge b-danger">+${p.delayDays} ngày</span>` : p.delayDays > 0 ? `<span class="badge b-warn">+${p.delayDays} ngày</span>` : '<span class="badge b-ok">Đúng hạn</span>'

function projects() {
  const ps = D("projects")
  const m = M.projectMetrics(ps, D("risks"))
  const rows = ps.map((p) => `<tr><td>${esc(p.id)}</td><td>${esc(p.name)}</td><td>${esc(p.unit)}</td><td>${p.technical}%</td><td>${p.costUsed}%${M.isOverrun(p) ? ' <span class="badge b-danger">lệch</span>' : ""}</td><td>${delayBadge(p)}</td><td><button class="btn btn-light" ${jsCall("projectDetail", p.id)}>Chi tiết</button></td></tr>`).join("")
  return `${kpis(
    kpi("Nhiệm vụ", m.count, `${m.late} có dự báo trễ`),
    kpi("Milestone sắp tới", m.milestones, "Trong 30 ngày"),
    kpi("Risk đang mở", m.openRisks, `${m.highRisks} mức cao`),
    kpi("Change Request", m.changeRequests, `${m.changeRequestsPending} chờ duyệt`),
  )}<div class="card" style="margin-top:14px"><div class="card-head"><h3>Danh mục nhiệm vụ / dự án</h3><button class="btn btn-light" onclick="show('finance')">Tài chính dự án</button></div><table><tr><th>Mã</th><th>Tên</th><th>Đơn vị</th><th>Kỹ thuật</th><th>Tài chính</th><th>Forecast</th><th></th></tr>${rows}</table></div>`
}

function finance() {
  const lines = D("financeLines")
  const f = M.financeMetrics(lines, D("disbursement"))
  const overruns = D("projects").filter(M.isOverrun)
  const rows = lines.map((l) => `<tr><td>${esc(l.source)}</td><td>${esc(l.project)}</td><td>${esc(l.item)}</td><td>${esc(l.unit)}</td><td>${tr(l.budget)}</td><td>${tr(l.committed)}</td><td>${tr(l.paid)}</td></tr>`).join("")
  return `${kpis(
    kpi("Kế hoạch năm", ty(f.plan), `Kế hoạch lũy kế đến nay ${ty(f.planToDate)}`),
    kpi("Cam kết chi (cost center)", tr(f.committed), `${f.committedPct}% dự toán ${tr(f.budget)}`),
    kpi("Đã giải ngân", ty(f.paid), `${f.disbursedPct}% kế hoạch năm`),
    kpi("Dự án chi vượt tiến độ", overruns.length, "Chi phí cao hơn kỹ thuật > 10%"),
  )}<div class="grid twoeq" style="margin-top:14px"><div class="card"><h3>Cost Center</h3><table><tr><th>Nguồn</th><th>Dự án</th><th>Hạng mục</th><th>Đơn vị</th><th>Dự toán</th><th>Cam kết</th><th>Đã chi</th></tr>${rows}</table><button class="btn btn-primary" style="margin-top:10px" onclick="financeForm()">+ Đề nghị thanh toán</button></div><div class="card"><h3>Phân tích tài chính theo dự án</h3>${D("projects").map((p) => bar(`${p.id} • chi phí`, p.costUsed, `${p.costUsed}% / KT ${p.technical}%`)).join("")}${overruns.map((p) => `<div class="alert"><span class="dot red"></span><div><b>${esc(p.id)} chênh +${p.costUsed - p.technical}%</b><div class="mini">Chi phí ${p.costUsed}% • kỹ thuật ${p.technical}%</div></div></div>`).join("")}${metric("Giải ngân so kế hoạch lũy kế", `${ty(f.paid)} / ${ty(f.planToDate)}`)}</div></div>`
}

function equipment() {
  const rows = D("equipment")
  const m = M.equipmentMetrics(rows, today())
  const list = [...rows].sort((a, b) => a.inspectionDue.localeCompare(b.inspectionDue)).map((e) => {
    const soon = M.inspectionSoon(e, today())
    return `<tr><td>${esc(e.id)}</td><td>${esc(e.name)}</td><td>${esc(e.unit)}</td><td><span class="badge ${e.status === "Bảo dưỡng" ? "b-warn" : e.status === "Sẵn sàng" ? "b-info" : "b-ok"}">${esc(e.status)}</span></td><td>${e.utilization}%</td><td><span class="badge ${soon ? "b-warn" : "b-info"}">${vnDate(e.inspectionDue)}</span></td><td>${tr(e.repairCost)}</td><td><button class="btn btn-light" ${jsCall("equipmentDetail", e.id)}>Hồ sơ</button></td></tr>`
  }).join("")
  return `${kpis(
    kpi("Tổng thiết bị", m.total, `${m.inUse} đang sử dụng • ${m.models} mã máy`),
    kpi("Utilization TB", `${m.utilization}%`, "Trung bình các thiết bị"),
    kpi("Sắp kiểm định", m.dueSoon, "Trong 30 ngày"),
    kpi("Chi phí sửa chữa", tr(m.repairCost), "Lũy kế năm"),
  )}<div class="card" style="margin-top:14px"><h3>Vòng đời thiết bị</h3><table><tr><th>Mã</th><th>Thiết bị</th><th>Đơn vị</th><th>Trạng thái</th><th>Utilization</th><th>Kiểm định</th><th>Chi phí sửa</th><th></th></tr>${list}</table></div>`
}

function risks() {
  const rs = D("risks")
  const open = M.openRisks(rs)
  const eq = M.equipmentMetrics(D("equipment"), today())
  const cell = (impact: number, prob: number) => {
    const here = open.filter((r) => r.impact === impact && r.probability === prob).map((r) => esc(r.id)).join(" ")
    const sum = impact + prob
    return `<div class="risk-cell ${sum >= 8 ? "risk-high" : sum >= 5 ? "risk-med" : "risk-low"}">${here || `${impact}×${prob}`}</div>`
  }
  const matrix = [5, 4, 3, 2, 1].flatMap((impact) => [1, 2, 3, 4, 5].map((prob) => cell(impact, prob))).join("")
  return `<div class="grid twoeq"><div class="card"><div class="card-head"><h3>Risk Register</h3><button class="btn btn-primary" onclick="createRisk()">+ Ghi nhận rủi ro</button></div><table><tr><th>Mã</th><th>Rủi ro</th><th>Owner</th><th>Mức</th><th>Biện pháp</th><th>Trạng thái</th></tr>${[...open, ...rs.filter((r) => !r.open)].map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.title)}</td><td>${esc(r.owner)}</td><td>${riskBadge(r)}</td><td>${esc(r.mitigation)}</td><td>${r.open ? "Đang mở" : '<span class="badge b-ok">Đã đóng</span>'}</td></tr>`).join("")}</table></div><div class="card"><h3>Ma trận rủi ro 5×5 (${open.length} đang mở)</h3><div class="risk-matrix">${matrix}</div><div class="mini" style="margin-top:8px">Trục dọc: Tác động • Trục ngang: Khả năng xảy ra</div></div></div><div class="card" style="margin-top:14px"><h3>Compliance / Kiểm soát</h3><table><tr><th>Kiểm soát</th><th>Đơn vị</th><th>Tần suất</th><th>Kết quả</th></tr><tr><td>Kiểm định thiết bị trước sử dụng</td><td>TT Kiểm định</td><td>Định kỳ</td><td><span class="badge ${eq.dueSoon ? "b-warn" : "b-ok"}">${eq.dueSoon ? `${eq.dueSoon} sắp hạn` : "Đạt"}</span></td></tr><tr><td>Rủi ro mức cao có biện pháp</td><td>Toàn Liên đoàn</td><td>Liên tục</td><td><span class="badge b-ok">${open.filter((r) => r.mitigation).length}/${open.length}</span></td></tr></table></div>`
}

function meetings(ctx: Ctx) {
  const ms = M.sortMeetings(D("meetings"), today())
  const m = M.meetingMetrics(ms, today())
  const conclusions = D("inboxTasks").filter((t) => t.type === "Kết luận họp")
  const canCreate = ["lanhdao", "truongdonvi"].includes(ctx.role())
  return `${kpis(
    kpi("Cuộc họp sắp tới", m.upcoming, `Trong ${ms.length} cuộc họp`),
    kpi("Kết luận mở", m.openConclusions, "Chưa hoàn thành"),
    kpi("Tác vụ sau họp", m.actions, "Đã giao từ kết luận"),
    kpi("Tài liệu họp", m.docs, "DMS liên kết"),
  )}<div class="grid two" style="margin-top:14px"><div class="card"><div class="card-head"><h3>Cuộc họp & phiên làm việc</h3>${canCreate ? '<button class="btn btn-primary" onclick="createMeeting()">+ Tạo cuộc họp</button>' : ""}</div>${ms.map((x) => `<div class="meeting-card"><div class="meeting-date"><b>${x.date.slice(0, 2)}</b><span>Th${x.date.slice(3, 5)}</span></div><div><h4>${esc(x.title)}</h4><p>${esc(x.time)} • ${esc(x.scope)} • ${x.docs} tài liệu</p><div style="margin-top:5px"><span class="badge ${x.status === "Đã kết thúc" ? "b-ok" : "b-info"}">${esc(x.status)}</span></div></div><div class="toolbar"><button class="btn btn-light" ${jsCall("meetingDetail", x.id)}>Hồ sơ họp</button></div></div>`).join("")}</div><div class="card"><h3>Kết luận cần theo dõi</h3>${conclusions.map((t) => `<div class="alert"><span class="dot ${t.overdue || t.status === "Nguy cơ trễ" ? "red" : "yellow"}"></span><div><b>${esc(t.id)} • ${esc(t.title)}</b><div class="mini">${esc(t.status)} • ${esc(t.sla)}</div></div></div>`).join("") || '<div class="mini">Không có kết luận đang mở.</div>'}<button class="btn btn-light" onclick="show('directives')">Xem toàn bộ chỉ đạo/kết luận</button></div></div>`
}

function strategy(ctx: Ctx) {
  const goals = D("strategicGoals")
  const weighted = Math.round(goals.reduce((s, g) => s + g.actual * g.weight, 0) / (goals.reduce((s, g) => s + g.weight, 0) || 1))
  return `<div class="command-hero"><div class="inner"><div class="eyebrow">STRATEGY → EXECUTION</div><h2>Kế hoạch chiến lược • thực hiện ${weighted}%</h2><p>Mỗi mục tiêu chiến lược được liên kết với sáng kiến, dự án/nhiệm vụ, KPI và đơn vị chịu trách nhiệm. Điểm thực hiện là trung bình có trọng số các mục tiêu.</p></div></div><div class="card" style="margin-top:14px"><div class="card-head"><h3>Mục tiêu & kết quả</h3>${ctx.role() === "lanhdao" ? '<button class="btn btn-primary" onclick="goalForm()">+ Mục tiêu</button>' : ""}</div>${goals.map((g) => `<div class="strategy-line"><div><b>${esc(g.goal)}</b><div class="mini">${esc(g.owner)} • Trọng số ${g.weight}%</div></div><div><div class="bar"><i style="width:${g.actual}%"></i></div></div><div><b>${g.actual}%</b><div class="mini">Thực hiện</div></div><div><span class="badge ${g.actual >= 85 ? "b-ok" : g.actual >= 70 ? "b-warn" : "b-danger"}">${esc(g.target)}</span></div></div>`).join("")}</div><div class="grid twoeq" style="margin-top:14px"><div class="card"><h3>Sáng kiến trọng điểm</h3>${D("initiatives").map((i) => metric(i.name, `${i.progress}%`)).join("")}</div><div class="card"><h3>Liên kết thực thi</h3><p class="mini">Mục tiêu → Sáng kiến → Dự án → Task → KPI → Báo cáo → Chỉ đạo điều hành.</p><button class="btn btn-light" onclick="show('command')">Mở Command Center</button></div></div>`
}

function command() {
  const decisions = D("decisions").filter((d) => d.open)
  const items = workflowStore.items()
  const openDirectives = items.filter((x) => x.type === "directive" && !isClosed(x))
  const meetingsAll = M.sortMeetings(D("meetings"), today())
  const kpiAll = overallKpi(unitKpis(items, today()), today())
  const top = M.openRisks(D("risks")).slice(0, 3)
  const sev = (s: string) => (s === "Cao" ? "b-danger" : s === "Trung bình" ? "b-warn" : "b-info")
  const box = (label: string, value: string | number, badge: string, cls: string) => `<div class="box"><span class="mini">${label}</span><b>${value}</b><span class="badge ${cls}">${badge}</span></div>`
  return `<div class="command-hero"><div class="inner"><div class="eyebrow">EXECUTIVE COMMAND CENTER • ${vnDate(today())}</div><h2>Điều hành theo dữ liệu và quyết định</h2><p>Tập hợp tín hiệu từ dự án, kỹ thuật, tài chính, thiết bị, nhân sự và hồ sơ để lãnh đạo xác định việc cần quyết định, giao chỉ đạo và theo dõi kết quả.</p></div></div>
<div class="decision-strip" style="margin-top:14px">${box("Quyết định cần xử lý", decisions.length, `${decisions.filter((d) => d.severity === "Cao").length} ưu tiên cao`, "b-danger")}${box("Chỉ đạo đang mở", openDirectives.length, "Từ luồng chỉ đạo", "b-warn")}${box("Kết luận họp chưa xong", M.meetingMetrics(meetingsAll, today()).openConclusions, `${meetingsAll.length} cuộc họp`, "b-info")}${box("KPI toàn Liên đoàn", kpiAll.score == null ? "–" : `${kpiAll.score}%`, "Tính từ công việc", "b-ok")}</div>
<div class="command-grid" style="margin-top:14px"><div class="card exec-only"><div class="card-head"><div><h3>Việc cần lãnh đạo quyết định</h3><div class="mini">Ưu tiên theo ảnh hưởng + SLA + mức độ rủi ro</div></div><button class="btn btn-primary" onclick="show('directives')">Giao chỉ đạo</button></div>${decisions.map((d, i) => `<div class="decision-card"><div class="decision-num">${i + 1}</div><div style="flex:1"><h4>${esc(d.title)}</h4><p>${esc(d.unit)} • Nguồn: ${esc(d.source)}</p></div><div style="text-align:right"><span class="badge ${sev(d.severity)}">${esc(d.severity)}</span><div class="mini" style="margin-top:5px">${esc(d.due)}</div></div></div>`).join("") || '<div class="mini">Không có quyết định chờ xử lý.</div>'}</div>
<div class="card"><h3>Strategic Pulse</h3>${D("strategicGoals").map((g) => metric(g.goal, `${g.actual}%`)).join("")}<button class="btn btn-light" style="margin-top:10px" onclick="show('strategy')">Xem mục tiêu chiến lược</button></div></div>
<div class="card" style="margin-top:14px"><div class="card-head"><div><h3>Bản đồ hiệu suất đơn vị</h3><div class="mini">Tính từ công việc thực tế • bấm tên đơn vị để xem chi tiết</div></div><button class="btn btn-light" onclick="show('performance')">Phân tích KPI</button></div><div class="heatmap"></div></div>
<div class="grid twoeq" style="margin-top:14px"><div class="card"><h3>Top rủi ro cần theo dõi</h3>${top.map((r) => `<div class="alert"><span class="dot ${M.riskLevel(r) === "Cao" ? "red" : "yellow"}"></span><div><b>${esc(r.title)}</b><div class="mini">${esc(r.id)} • Owner: ${esc(r.owner)} • ${esc(r.mitigation)}</div></div></div>`).join("")}<button class="btn btn-light" onclick="show('risks')">Risk Register</button></div><div class="card"><h3>Lịch quyết định / cuộc họp</h3>${meetingsAll.slice(0, 2).map((m) => `<div class="meeting-card"><div class="meeting-date"><b>${m.date.slice(0, 2)}</b><span>Th${m.date.slice(3, 5)}</span></div><div><h4>${esc(m.title)}</h4><p>${esc(m.time)} • ${esc(m.scope)}</p></div><button class="btn btn-light" ${jsCall("meetingDetail", m.id)}>Mở</button></div>`).join("")}</div></div>`
}

function organization() {
  const units = D("orgUnits")
  const staff = cap()
  const support = units.filter((u) => u.type === "Bộ máy giúp việc")
  const direct = units.filter((u) => u.type === "Đơn vị trực thuộc")
  return `${kpis(
    kpi("Bộ máy giúp việc", support.length, support.map((u) => esc(u.name.replace("Phòng ", ""))).join(" • ")),
    kpi("Đơn vị trực thuộc", direct.length, direct.map((u) => esc(u.name.replace(/^(Đoàn|Trung tâm) /, ""))).join(" • ")),
    kpi("Nguồn nhân lực công khai", staff.total, "Theo hồ sơ năng lực trên website"),
    kpi("Mô hình quản trị", `1→${support.length}→${direct.length}`, "Lãnh đạo → phòng → đơn vị"),
  )}<div class="card" style="margin-top:14px"><div class="card-head"><h3>Cơ cấu tổ chức & chức năng</h3><span class="official-badge">DỮ LIỆU CÔNG KHAI</span></div><div class="org-grid">${units.map((u) => `<div class="org-card"><span class="org-chip">${esc(u.type)}</span><h4>${esc(u.name)}</h4><div class="org-meta"><span><b>Lãnh đạo:</b> ${esc(u.leader)}</span>${u.deputy ? `<span><b>Phó:</b> ${esc(u.deputy)}</span>` : ""}<span><b>Nhân sự:</b> ${esc(u.staff)}</span></div><p>${esc(u.mission)}</p><button class="btn btn-light" ${jsCall("openUnit", u.id)}>Mở không gian đơn vị</button></div>`).join("")}</div></div>`
}

function equipmentCatalog() {
  const rows = D("equipment")
  const m = M.equipmentMetrics(rows, today())
  return `${kpis(
    kpi("Mã thiết bị", m.models, `${m.total} máy/bộ`),
    kpi("Nhóm công nghệ", m.groups, "Hàng không • biển • điện • từ • gamma..."),
    kpi("Sắp kiểm định", m.dueSoon, "Trong 30 ngày"),
    kpi("Nguồn", "VLDC", "Website chính thức + hồ sơ nội bộ"),
  )}<div class="card" style="margin-top:14px"><div class="card-head"><h3>Danh mục máy & thiết bị địa vật lý</h3><span class="official-badge">PUBLIC EQUIPMENT PROFILE</span></div><div class="equip-grid">${rows.map((e) => `<div class="equip-card"><div class="eqicon">⚙</div><h4>${esc(e.name)}</h4><div class="mini">${esc(e.id)} • ${esc(e.group)} • ${esc(e.unit)}</div>${metric("Số lượng", e.quantity)}${metric("Năm sử dụng", esc(e.year))}${metric("Kiểm định", vnDate(e.inspectionDue))}<span class="badge ${e.condition === "Mới" ? "b-ok" : "b-info"}">${esc(e.condition)}</span></div>`).join("")}</div></div>`
}

function units() {
  const items = workflowStore.items()
  const scores = unitKpis(items, today())
  return `<div class="card"><div class="card-head"><h3>Không gian quản trị theo đơn vị</h3><span class="mini">Tác vụ và KPI tính từ luồng công việc</span></div><div class="org-grid">${D("orgUnits").filter((x) => x.id !== "BLD").map((x) => {
    // orgUnits and KPI units share the tbl_department codes.
    const k = scores.find((s) => s.unit.id === x.id)
    return `<div class="org-card"><span class="org-chip">${esc(x.type)}</span><h4>${esc(x.name)}</h4><p>${esc(x.mission)}</p>${metric("Tác vụ mở", k ? k.open : "–")}${metric("KPI", k?.score == null ? "–" : `${k.score}%`)}<button class="btn btn-primary" ${jsCall("openUnit", x.id)}>Dashboard đơn vị</button></div>`
  }).join("")}</div></div>`
}

function digital() {
  const rows = D("digitalAdoption")
  const avg = (pick: (x: (typeof rows)[number]) => number) => (rows.length ? Math.round(rows.reduce((s, x) => s + pick(x), 0) / rows.length) : 0)
  const dims: [string, (x: (typeof rows)[number]) => number][] = [["Usage", (x) => x.usage], ["Interaction", (x) => x.interaction], ["Process", (x) => x.process], ["Data Quality", (x) => x.data], ["Adaptability", (x) => x.adapt], ["Effectiveness", (x) => x.effect]]
  return `<div class="grid two"><div class="card"><div class="card-head"><div><h3>Digital Adoption Score</h3><div class="mini">Không dùng để xếp hạng con người; dùng để tìm điểm nghẽn và ưu tiên cải tiến.</div></div><div class="digital-score">${avg((x) => x.score)}/100</div></div><div class="adoption-wheel">${dims.map(([label, pick]) => `<div class="adoption-metric"><b>${avg(pick)}%</b>${label}</div>`).join("")}</div></div><div class="card"><h3>Digital Maturity</h3><div class="maturity"><span class="on">L1 Số hóa</span><span class="on">L2 Workflow</span><span class="on">L3 Data-driven</span><span class="on">L4 Automation</span><span>L5 AI-assisted</span></div>${metric("AI adoption (trung bình đơn vị)", `${avg((x) => x.ai)}%`)}${metric("Đơn vị đạt ≥ 85 điểm", `${rows.filter((x) => x.score >= 85).length}/${rows.length}`)}</div></div>
<div class="card" style="margin-top:14px"><h3>Đánh giá theo đơn vị</h3><div class="table-wrap"><table><tr><th>Đơn vị</th><th>Usage</th><th>Interaction</th><th>Process</th><th>Data</th><th>Adapt</th><th>Effect</th><th>AI</th><th>Score</th></tr>${rows.map((x) => `<tr><td><b>${esc(x.unit)}</b></td><td>${x.usage}</td><td>${x.interaction}</td><td>${x.process}</td><td>${x.data}</td><td>${x.adapt}</td><td>${x.effect}</td><td>${x.ai}</td><td><span class="badge ${x.score >= 85 ? "b-ok" : x.score >= 80 ? "b-info" : "b-warn"}">${x.score}</span></td></tr>`).join("")}</table></div></div>`
}

/** Research KPI tiles and funnel, computed from the portfolio (the page body stays in the engine). */

const NO_STATS: OrgStats = { id: "capability", total: 0, doctor: 0, master: 0, engineerBachelor: 0, technicianWorker: 0, under5: 0, from5to15: 0, over15: 0 }
const cap = (): OrgStats => D("orgStats")[0] ?? NO_STATS

const RENDERERS: Record<string, (ctx: Ctx) => string> = {
  projects, finance, equipment, risks, meetings, strategy, command, organization,
  equipmentcatalog: equipmentCatalog, units, digital,
}

/** Replaces the engine's hard-coded pages with data-driven ones. */
export function installDataPages(render: Record<string, () => void>, ctx: Ctx) {
  for (const [page, html] of Object.entries(RENDERERS)) {
    render[page] = function () {
      // Command Center is leadership-only; other roles land on their own dashboard as before.
      if (page === "command" && ctx.role() !== "lanhdao") return render.dashboard()
      const el = content()
      if (el) el.innerHTML = html(ctx)
    }
  }
}
