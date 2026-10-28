import { escapeHtml as esc, jsCall } from "../workflow/html"
import { projectsView } from "./projectView"
import { subTabsHtml } from "./menuPolicy"
import { ROLE_TITLES, isWork } from "../workflow/rules"
import { workflowStore } from "../workflow/repository"
import * as A from "./accountingMetrics"
import { ACTION_LABELS } from "./audit"
import { addDays, localToday, vnDate } from "./dates"
import * as K from "./knowledgeMetrics"
import { liveAlerts } from "./liveAlerts"
import { leaderSignature } from "./org"
import * as M from "./metrics"
import { kpi, kpis, bar, metric, tr } from "./pages"
import { vldcData } from "./registry"
import { searchAll, type SearchHit } from "./search"
import { ALL_SEARCH_GROUPS, searchSources, type SearchData } from "./searchSources"
import { dmsStore } from "./dmsStore"
import { ledgerStore } from "./ledgerStore"
import type { AlertRule, DocTemplate, ReportDef } from "./types"
import type { OutgoingDocument } from "../../../types/outgoingDocument"

/**
 * Knowledge & governance pages (DMS, archive, geo data, import, migration, data hub, reports, alerts, audit,
 * generator) and the record search behind the AI workspace — all on stored records.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }
const D = vldcData.get
const today = () => localToday()
const content = () => document.getElementById("content")
const inputValue = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? ""
const card = (title: string, body: string, head = "") => `<div class="card"><div class="card-head"><h3>${title}</h3>${head}</div>${body}</div>`
const grid = (cls: string, ...cards: string[]) => `<div class="grid ${cls}" style="margin-top:14px">${cards.join("")}</div>`
const btn = (label: string, fn: string, ...args: string[]) => `<button class="btn btn-light" ${jsCall(fn, ...args)}>${label}</button>`
const badge = (text: string, cls: string) => `<span class="badge ${cls}">${esc(text)}</span>`
const table = (head: string[], rows: string[], empty = "Không có dữ liệu.") =>
  `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.join("") || `<tr><td colspan="${head.length}" class="mini">${empty}</td></tr>`}</table>`
const statusCls = (s: string) => (/Approved|Đã số hóa|Hoàn thành|Đạt|Đã chuẩn hóa/.test(s) ? "b-ok" : /Draft|Chờ|lỗi|Đang xử lý/.test(s) ? "b-warn" : "b-info")
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`

// ---------- Search (AI workspace, data hub, DMS, research copilot) ----------

function searchData(): SearchData {
  return {
    dmsFiles: dmsStore.files(), incomingDocuments: D("incomingDocuments"), outgoingDocuments: D("outgoingDocuments"), staffSkills: D("staffSkills"),
    equipment: D("equipment"), fixedAssets: D("fixedAssets"), projects: projectsView(), risks: D("risks"), contracts: ledgerStore.legacyContracts(),
    vouchers: D("vouchers"), advances: D("advances"), archiveRecords: D("archiveRecords"), geoDatasets: D("geoDatasets"),
  }
}

export function search(query: string, groups: string[] = ALL_SEARCH_GROUPS, limit = 20): SearchHit[] {
  return searchAll(query, searchSources(searchData(), groups), limit)
}

function hitCards(hits: SearchHit[]): string {
  return hits.map((h) => `<div class="doc-card"><div><b>${esc(h.title)}</b><div class="doc-meta">${esc(h.sourceName)} • ${esc(h.snippet)}</div></div>${h.open ? btn("Mở", h.open[0], h.open[1]) : badge(h.sourceName, "b-info")}</div>`).join("")
}

/** Result block of the AI workspace: a short sourced summary plus result cards. */
export function aiSearchHtml(query: string, groups: string[]): string {
  if (!query.trim()) return '<div class="mini">Nhập câu hỏi hoặc mã hồ sơ để tìm.</div>'
  if (!groups.length) return '<div class="mini">Chọn ít nhất một nguồn dữ liệu.</div>'
  const hits = search(query, groups)
  if (!hits.length) return `<div class="ai-answer" style="margin-bottom:10px">Không tìm thấy bản ghi phù hợp với “${esc(query)}” trong các nguồn đã chọn.</div>`
  const bySource = [...new Set(hits.map((h) => h.sourceName))]
  return `<div class="ai-answer" style="margin-bottom:10px"><b>Tìm thấy ${hits.length} kết quả trong ${bySource.length} nguồn:</b> ${esc(bySource.join(", "))}. Kết quả xếp theo mức độ khớp; mọi thẻ đều mở được hồ sơ gốc.</div>${hitCards(hits)}`
}

/** Index size shown on the AI workspace header. */
export function aiStatsHtml(): string {
  const docs = dmsStore.files().length + D("incomingDocuments").length + D("outgoingDocuments").length + D("archiveRecords").length
  const stat = (n: number, label: string) => `<div class="ai-stat"><b>${n.toLocaleString("vi-VN")}</b><span>${label}</span></div>`
  return stat(docs, "Tài liệu & hồ sơ đã lập chỉ mục") + stat(D("staffSkills").length, "Hồ sơ năng lực nhân sự") + stat(D("equipment").length, "Thiết bị / tài sản")
}

// ---------- Archive, geo, import, migration, data hub ----------

function archive() {
  const recs = D("archiveRecords")
  const m = K.archiveMetrics(recs)
  const mig = K.migrationMetrics(D("migrationBatches"))
  return `${kpis(
    kpi("Hồ sơ lưu trữ trong ERP", m.records, `${m.docs.toLocaleString("vi-VN")} tài liệu`),
    kpi("Đã số hóa", m.digitised, `${m.records - m.digitised} đang / chờ số hóa`),
    kpi("Metadata đầy đủ", `${m.metadataPct}%`, "Trung bình hồ sơ"),
    kpi("Tiến độ chuyển đổi kho giấy", `${mig.stages[3].pct}%`, `${mig.stages[3].done.toLocaleString("vi-VN")}/${mig.total.toLocaleString("vi-VN")} hồ sơ`),
  )}<div style="margin-top:14px">${card("Kho dữ liệu lịch sử", table(["Mã", "Tên hồ sơ", "Năm", "Đơn vị", "Tài liệu", "Metadata", "Kho giấy", "Trạng thái", ""], recs.map((r) => `<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.name)}</td><td>${r.year}</td><td>${esc(r.unit)}</td><td>${r.docs}</td><td>${r.metadataPct}%</td><td>${esc(r.paperLocation)}</td><td>${badge(r.status, statusCls(r.status))}</td><td>${btn("Mở", "archiveDetail", r.id)}</td></tr>`)), '<button class="btn btn-primary" onclick="archiveRecordModal()">+ Hồ sơ lưu trữ</button>')}</div>`
}

function geodata() {
  const sets = D("geoDatasets")
  const m = K.geoMetrics(sets)
  return `${kpis(
    kpi("Bộ dữ liệu", m.sets, "Raw / processed"),
    kpi("Dung lượng", `${m.sizeTb.toLocaleString("vi-VN")} TB`, "Object storage"),
    kpi("Có backup", `${m.backupPct}%`, `${sets.filter((s) => !s.backup).length} bộ chưa backup`),
    kpi("Quyền hạn chế", m.restricted, "Cần phê duyệt khi truy cập"),
  )}<div style="margin-top:14px">${card("Danh mục dữ liệu địa vật lý", table(["Mã", "Tên", "Loại", "Dự án", "Dung lượng", "Storage", "Quyền", ""], sets.map((g) => `<tr><td><b>${esc(g.id)}</b></td><td>${esc(g.name)}</td><td>${esc(g.type)}</td><td>${esc(g.projectId)}</td><td>${g.sizeGb.toLocaleString("vi-VN")} GB</td><td class="mini">${esc(g.storageUri)}</td><td>${badge(g.access, g.access === "Hạn chế" ? "b-warn" : "b-info")}</td><td>${btn("Mở", "geoDetail", g.id)}</td></tr>`)), '<button class="btn btn-primary" onclick="geoDatasetModal()">+ Đăng ký dữ liệu</button>')}</div>`
}

function importdata() {
  const jobs = [...D("importJobs")].sort((a, b) => b.at.localeCompare(a.at))
  const m = K.importMetrics(jobs)
  return `${kpis(
    kpi("Lần import", m.jobs, `${m.rows.toLocaleString("vi-VN")} dòng`),
    kpi("Dòng hợp lệ", `${m.okPct}%`, "Qua kiểm tra chất lượng"),
    kpi("Dòng lỗi", m.errors, "Cần xử lý"),
    kpi("Job chờ xử lý lỗi", m.pending, "Hàng đợi validation"),
  )}<div style="margin-top:14px">${card("Lịch sử import", table(["Job", "Nguồn", "Loại", "Dòng", "Hợp lệ", "Lỗi", "Người chạy", "Thời điểm", "Trạng thái"], jobs.map((j) => `<tr><td><b>${esc(j.id)}</b></td><td>${esc(j.source)}</td><td>${esc(j.type)}</td><td>${j.rows}</td><td>${j.ok}</td><td>${j.errors}</td><td>${esc(j.runner)}</td><td>${esc(j.at)}</td><td>${badge(j.status, statusCls(j.status))}</td></tr>`)), '<button class="btn btn-primary" onclick="simulateImport()">Chạy import thử</button> <button class="btn btn-light" onclick="validationQueueModal()">Hàng đợi lỗi</button>')}</div>`
}

function migration() {
  const batches = D("migrationBatches")
  const m = K.migrationMetrics(batches)
  return `${kpis(...m.stages.map((s) => kpi(s.label, s.done.toLocaleString("vi-VN"), `${s.pct}% / ${m.total.toLocaleString("vi-VN")} hồ sơ`)))}${grid("two",
    card("Tiến độ theo đơn vị", table(["Đơn vị", "Tổng", "Scan", "Metadata", "Validation", "Chuyển đổi"], batches.map((b) => `<tr><td><b>${esc(b.unit)}</b></td><td>${b.total.toLocaleString("vi-VN")}</td>${K.MIGRATION_STAGES.map((s) => `<td>${Math.round((b[s.key] / b.total) * 100)}%</td>`).join("")}</tr>`)), '<button class="btn btn-light" onclick="migrationPlanModal()">Kế hoạch chuyển đổi</button>'),
    card("Vấn đề cần xử lý", m.issues.map((i) => `<div class="alert"><span class="dot yellow"></span><div><b>${esc(i.issue)}</b><div class="mini">${esc(i.unit)}</div></div></div>`).join("") || '<div class="mini">Không có.</div>'),
  )}`
}

function qualityRows() {
  const untagged = K.dmsMetrics(dmsStore.files(), today()).untagged
  const calib = D("equipment").filter((e) => !e.inspectionDue).length
  // Rules whose violations can be measured live use the live count.
  return D("dataQualityRules").map((r) => (r.scope === "DMS" ? { ...r, violations: untagged } : r.scope === "Thiết bị" ? { ...r, violations: calib } : r))
}

function datahub() {
  const cats = D("masterCatalogs")
  const cm = K.catalogMetrics(cats)
  const rules = qualityRows()
  const layers: [string, number, string][] = [
    ["Tài liệu DMS", dmsStore.files().length, "dms"], ["Văn bản đến / đi", D("incomingDocuments").length + D("outgoingDocuments").length, "documents"],
    ["Hồ sơ lưu trữ", D("archiveRecords").length, "archive"], ["Dữ liệu địa vật lý", D("geoDatasets").length, "geodata"],
    ["Dự án", projectsView().length, "projects"], ["Thiết bị", D("equipment").length, "equipment"], ["Hợp đồng", ledgerStore.legacyContracts().length, "contracts"],
  ]
  const violations = rules.reduce((s, r) => s + r.violations, 0)
  return `${kpis(
    kpi("Danh mục dùng chung", cm.catalogs, `${cm.entries} giá trị • ${cm.reviewing} đang rà soát`),
    kpi("Lớp dữ liệu", layers.length, `${layers.reduce((s, l) => s + l[1], 0)} bản ghi`),
    kpi("Quy tắc chất lượng", rules.length, `${rules.filter((r) => r.violations === 0).length} đạt`),
    kpi("Vi phạm chất lượng", violations, "Cần làm sạch"),
  )}<div class="card" style="margin-top:14px"><div class="card-head"><h3>Tìm kiếm dữ liệu toàn Liên đoàn</h3></div><input id="hubq" placeholder="Mã hồ sơ, dự án, thiết bị, từ khóa..."><button class="btn btn-primary" style="margin-top:8px" onclick="globalDataSearch(document.getElementById('hubq').value)">Tìm</button></div>${grid("two",
    card("Các lớp dữ liệu", table(["Lớp", "Bản ghi", ""], layers.map(([name, n, page]) => `<tr><td>${esc(name)}</td><td>${n}</td><td><button class="btn btn-light" onclick="show('${page}')">Mở</button></td></tr>`)), '<button class="btn btn-light" onclick="masterDataModal()">Danh mục</button>'),
    card("Chất lượng dữ liệu", rules.map((r) => `<div class="alert"><span class="dot ${r.violations ? "yellow" : "green"}"></span><div><b>${esc(r.rule)}</b><div class="mini">${esc(r.scope)} • ${r.violations} vi phạm • ${esc(r.owner)}</div></div></div>`).join(""), '<button class="btn btn-light" onclick="cleaningModal()">Làm sạch</button>'),
  )}`
}

// ---------- Reports, alerts, audit ----------

/** Live table for a report definition, built from its source collection. */
function reportTable(def: ReportDef): string {
  const t = today()
  switch (def.source) {
    case "projects": return table(["Dự án", "Đơn vị", "Kỹ thuật", "Chi phí", "Dự báo"], projectsView().map((p) => `<tr><td>${esc(p.id)}</td><td>${esc(p.unit)}</td><td>${p.technical}%</td><td>${p.costUsed}%</td><td>${p.delayDays ? `+${p.delayDays} ngày` : "Đúng hạn"}</td></tr>`))
    case "work_items": return table(["Mã", "Nội dung", "Chủ trì", "Hạn"], workflowStore.items().filter((x) => isWork(x) && x.status !== "Hoàn thành" && x.due < t).map((x) => `<tr><td>${esc(x.id)}</td><td>${esc(x.title)}</td><td>${esc(ROLE_TITLES[x.owner] || x.owner)}</td><td>${vnDate(x.due)}</td></tr>`), "Không có việc quá hạn.")
    case "finance_lines": return table(["Dự án", "Hạng mục", "Dự toán", "Đã chi"], D("financeLines").map((l) => `<tr><td>${esc(l.project)}</td><td>${esc(l.item)}</td><td>${tr(l.budget)}</td><td>${tr(l.paid)}</td></tr>`))
    case "contracts": return table(["Hợp đồng", "Khách hàng", "Còn lại", "Tuổi nợ"], A.debtSummary(ledgerStore.legacyContracts(), "thu", t).debts.map((d) => `<tr><td>${esc(d.contract.id)}</td><td>${esc(d.contract.party)}</td><td>${tr(d.outstanding)}</td><td>${d.agingDays} ngày</td></tr>`))
    case "advances": return table(["Mã", "Người", "Còn lại", "Hạn"], A.advanceSummary(D("advances"), t).open.map((a) => `<tr><td>${esc(a.id)}</td><td>${esc(a.person)}</td><td>${tr(A.advanceRemaining(a))}</td><td>${vnDate(a.due)}</td></tr>`))
    case "equipment": return table(["Thiết bị", "Đơn vị", "Kiểm định", "Utilization"], D("equipment").map((e) => `<tr><td>${esc(e.name)}</td><td>${esc(e.unit)}</td><td>${vnDate(e.inspectionDue)}</td><td>${e.utilization}%</td></tr>`))
    case "staff_skills": return table(["Nhân sự", "Đơn vị", "ĐVL", "GIS", "Dữ liệu", "QLDA"], D("staffSkills").map((s) => `<tr><td>${esc(s.name)}</td><td>${esc(s.unit)}</td><td>${s.geophysics}</td><td>${s.gis}</td><td>${s.data}</td><td>${s.pm}</td></tr>`))
    case "risks": return table(["Mã", "Rủi ro", "Mức", "Owner"], M.openRisks(D("risks")).map((r) => `<tr><td>${esc(r.id)}</td><td>${esc(r.title)}</td><td>${M.riskLevel(r)}</td><td>${esc(r.owner)}</td></tr>`))
    case "migration_batches": return table(["Đơn vị", "Tổng", "Đã chuyển đổi"], D("migrationBatches").map((b) => `<tr><td>${esc(b.unit)}</td><td>${b.total}</td><td>${b.migrated}</td></tr>`))
    default: return '<div class="mini">Chưa có nguồn dữ liệu cho báo cáo này.</div>'
  }
}

function reports() {
  const defs = D("reportCatalog")
  const groups = [...new Set(defs.map((d) => d.group))]
  return `${kpis(
    kpi("Báo cáo", defs.length, `${groups.length} nhóm`),
    kpi("Có lịch tự động", defs.filter((d) => d.schedule !== "Theo yêu cầu").length, "Gửi định kỳ"),
    kpi("Chạy trong 7 ngày", defs.filter((d) => d.lastRun >= addDays(today(), -7)).length, "Gần đây"),
    kpi("Nguồn dữ liệu", new Set(defs.map((d) => d.source)).size, "Collection ERP"),
  )}<div style="margin-top:14px">${card("Danh mục báo cáo", table(["Nhóm", "Báo cáo", "Lịch", "Người nhận", "Lần chạy gần nhất", ""], defs.map((d) => `<tr><td>${esc(d.group)}</td><td><b>${esc(d.name)}</b></td><td>${esc(d.schedule)}</td><td>${esc(d.recipients)}</td><td>${vnDate(d.lastRun)}</td><td>${btn("Xem", "buildReport", d.id)} ${btn("Lịch", "scheduleReport", d.id)}</td></tr>`)))}</div>`
}

function alertsPage() {
  const rules = D("alertRules")
  const active = liveAlerts(rules)
  return `${kpis(
    kpi("Quy tắc đang bật", rules.filter((r) => r.enabled).length, `${rules.length} quy tắc`),
    kpi("Cảnh báo hiện tại", active.length, "Đánh giá từ dữ liệu"),
    kpi("Mức cao", active.filter((a) => a.level === "Cao").length, "Cần xử lý ngay"),
    kpi("Hồ sơ bị ảnh hưởng", active.reduce((s, a) => s + a.count, 0), "Dự án, thiết bị, hợp đồng, việc"),
  )}${grid("two",
    card("Quy tắc cảnh báo", table(["Quy tắc", "Ngưỡng", "Mức", "Trạng thái", ""], rules.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td>${thresholdLabel(r)}</td><td>${badge(r.level, r.level === "Cao" ? "b-danger" : "b-warn")}</td><td>${r.enabled ? badge("Bật", "b-ok") : badge("Tắt", "b-info")}</td><td>${btn(r.enabled ? "Tắt" : "Bật", "toggleRule", r.id)} ${btn("Sửa", "ruleForm", r.id)}</td></tr>`))),
    card("Cảnh báo đang hoạt động", active.map((a) => `<div class="alert" style="cursor:pointer" onclick="show('${a.page}')"><span class="dot ${a.level === "Cao" ? "red" : "yellow"}"></span><div><b>${esc(a.title)}</b><div class="mini">${esc(a.sub)}</div></div></div>`).join("") || '<div class="mini">Không có cảnh báo.</div>'),
  )}`
}

const thresholdLabel = (r: AlertRule) => (r.metric === "cost" ? `> ${r.threshold}%` : r.metric === "deadline" ? `quá hạn > ${r.threshold} ngày` : r.metric === "calibration" ? `trong ${r.threshold} ngày` : `> ${r.threshold} ngày`)

type TimelineRow = { at: string; who: string; action: string; ref: string; summary: string; source: string }

function timeline(): TimelineRow[] {
  const logged: TimelineRow[] = D("auditEvents").map((e) => ({ at: e.at, who: e.actor || ROLE_TITLES[e.role] || e.role, action: ACTION_LABELS[e.action] ?? e.action, ref: e.ref, summary: e.summary, source: e.collection }))
  const loggedKeys = new Set(logged.map((r) => `${r.ref}|${r.at.slice(0, 16)}`))
  // Earlier history already kept on the records themselves (before the audit trail existed).
  const work: TimelineRow[] = workflowStore.items().flatMap((x) => x.history.map((h) => ({ at: h.at, who: ROLE_TITLES[h.by] || h.by, action: ACTION_LABELS[h.action] ?? h.action, ref: x.id, summary: x.title, source: "vldc_work_items" })))
  const docs: TimelineRow[] = [...D("incomingDocuments"), ...D("outgoingDocuments")].flatMap((d) => d.processHistory.map((h) => ({ at: h.timestamp.replace(" ", "T"), who: h.actor, action: h.action, ref: d.documentNumber, summary: d.summary, source: "documents" })))
  return [...logged, ...[...work, ...docs].filter((r) => !loggedKeys.has(`${r.ref}|${r.at.slice(0, 16)}`))].sort((a, b) => b.at.localeCompare(a.at))
}

let auditFilter = ""
function audit() {
  const rows = timeline()
  const t = today()
  const shown = (auditFilter ? rows.filter((r) => `${r.ref} ${r.who} ${r.summary} ${r.source}`.toLowerCase().includes(auditFilter.toLowerCase())) : rows).slice(0, 100)
  const todays = rows.filter((r) => r.at.startsWith(t))
  return `${kpis(
    kpi("Sự kiện hôm nay", todays.length, `${rows.length} sự kiện được lưu`),
    kpi("Người thao tác hôm nay", new Set(todays.map((r) => r.who)).size, "Theo tài khoản"),
    kpi("Duyệt / trả lại", rows.filter((r) => /Duyệt|Trả lại|Chuyển bước/.test(r.action)).length, "Thao tác phê duyệt"),
    kpi("Thay đổi dữ liệu nghiệp vụ", D("auditEvents").filter((e) => e.collection !== "work_items").length, "Ghi log tự động"),
  )}<div class="card" style="margin-top:14px"><div class="card-head"><h3>Audit Timeline</h3><input id="auditq" value="${esc(auditFilter)}" placeholder="Lọc theo mã, người, nội dung" style="max-width:260px" onchange="auditSearch(this.value)"></div><div class="timeline">${shown.map((r) => `<div><b>${esc(r.at.slice(0, 16).replace("T", " "))} • ${esc(r.who)}</b> — ${esc(r.action)} <b>${esc(r.ref)}</b><br><span class="mini">${esc(r.summary)} • ${esc(r.source)}</span></div>`).join("") || '<div class="mini">Chưa có sự kiện.</div>'}</div></div>`
}

// ---------- Generator ----------

let genTemplate = ""
let genTarget = ""
function targetsOf(tpl: DocTemplate): { id: string; label: string; row: Record<string, unknown> }[] {
  if (tpl.target === "project") return projectsView().map((p) => ({ id: p.id, label: `${p.id} – ${p.name}`, row: p }))
  if (tpl.target === "contract") return ledgerStore.legacyContracts().map((c) => ({ id: c.id, label: `${c.id} – ${c.party}`, row: c }))
  return D("equipment").map((e) => ({ id: e.id, label: `${e.id} – ${e.name}`, row: { ...e, inspectionDue: vnDate(e.inspectionDue) } }))
}

export function fillTemplate(body: string, row: Record<string, unknown>, todayVn: string): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => (key === "today" ? todayVn : row[key] == null ? `{{${key}}}` : String(row[key])))
}

function currentTemplate() {
  const tpls = D("docTemplates")
  const tpl = tpls.find((t) => t.id === genTemplate) ?? tpls[0]
  const targets = tpl ? targetsOf(tpl) : []
  const target = targets.find((t) => t.id === genTarget) ?? targets[0]
  return { tpls, tpl, targets, target }
}

function generator() {
  const { tpls, tpl, targets, target } = currentTemplate()
  if (!tpl) return '<div class="mini">Chưa có mẫu văn bản.</div>'
  const tplOptions = tpls.map((t) => `<option value="${esc(t.id)}"${t.id === tpl.id ? " selected" : ""}>${esc(t.type)} – ${esc(t.title)}</option>`).join("")
  const targetOptions = targets.map((t) => `<option value="${esc(t.id)}"${t.id === target?.id ? " selected" : ""}>${esc(t.label)}</option>`).join("")
  return `${grid("two",
    card("Sinh văn bản từ dữ liệu ERP", `<div class="form-grid"><div class="full"><label>Mẫu văn bản</label><select onchange="genSelect(this.value,'')">${tplOptions}</select></div><div class="full"><label>Đối tượng dữ liệu</label><select onchange="genSelect('${esc(tpl.id)}',this.value)">${targetOptions}</select></div></div><button class="btn btn-primary" style="margin-top:10px" onclick="generateDoc()">Xem trước</button>`),
    card("Biến dữ liệu của mẫu", `<div class="mini">Các trường {{…}} được thay bằng giá trị thật của ${tpl.target === "project" ? "dự án" : tpl.target === "contract" ? "hợp đồng" : "thiết bị"} đã chọn.</div><div style="margin-top:8px">${[...new Set(tpl.body.match(/\{\{\w+\}\}/g) ?? [])].map((v) => badge(v, "b-info")).join(" ")}</div>`),
  )}`
}

// ---------- Modals & actions ----------

function actions(ctx: Ctx) {
  const open = ctx.openModal
  const rerender = (page: keyof typeof RENDERERS) => {
    const el = content()
    if (el) el.innerHTML = subTabsHtml(page) + RENDERERS[page]()
  }

  function archiveDetail(id: string) {
    const r = D("archiveRecords").find((x) => x.id === id)
    if (!r) return
    open(`Hồ sơ lưu trữ • ${r.id}`, `<h3 style="margin-top:0">${esc(r.name)}</h3><div class="grid twoeq"><div>${metric("Năm", r.year)}${metric("Đơn vị", esc(r.unit))}${metric("Loại", esc(r.type))}${metric("Số tài liệu", r.docs)}${metric("Metadata", `${r.metadataPct}%`)}${metric("Kho giấy", esc(r.paperLocation))}${metric("Quyền truy cập", esc(r.access))}${metric("Trạng thái", badge(r.status, statusCls(r.status)))}</div><div><h4>Cấu trúc hồ sơ</h4>${r.structure.map((s) => `<div class="folder">📁 ${esc(s)}</div>`).join("")}</div></div>`)
  }

  function archiveRecordModal() {
    open("Thêm hồ sơ lưu trữ", `<div class="form-grid"><div class="full"><label>Tên hồ sơ</label><input id="ar-name"></div><div><label>Năm</label><input id="ar-year" type="number" value="${new Date().getFullYear() - 5}"></div><div><label>Đơn vị</label><input id="ar-unit"></div><div><label>Số tài liệu</label><input id="ar-docs" type="number" value="0"></div><div><label>Vị trí kho giấy</label><input id="ar-loc"></div></div><button class="btn btn-primary" style="margin-top:10px" onclick="saveArchiveRecord()">Lưu</button>`)
  }

  function saveArchiveRecord() {
    const name = inputValue("ar-name").trim()
    if (!name) return alert("Vui lòng nhập tên hồ sơ")
    const year = Number(inputValue("ar-year")) || new Date().getFullYear()
    void vldcData.save("archiveRecords", { id: `HS-${year}-${Date.now().toString().slice(-5)}`, name, year, unit: inputValue("ar-unit"), type: "Hồ sơ dự án", docs: Number(inputValue("ar-docs")) || 0, metadataPct: 0, paperLocation: inputValue("ar-loc"), status: "Chờ scan", structure: [], access: "Nội bộ" })
    ctx.closeModal()
  }

  function geoDetail(id: string) {
    const g = D("geoDatasets").find((x) => x.id === id)
    if (!g) return
    open(`Geo dataset • ${g.id}`, `<h3 style="margin-top:0">${esc(g.name)}</h3><div class="grid twoeq"><div>${metric("Loại", esc(g.type))}${metric("Dự án", `<a href="javascript:void 0" ${jsCall("projectDetail", g.projectId)}>${esc(g.projectId)}</a>`)}${metric("Dung lượng", `${g.sizeGb.toLocaleString("vi-VN")} GB`)}${metric("Storage", esc(g.storageUri))}${metric("Checksum", esc(g.checksum))}${metric("Backup", g.backup ? "Có" : badge("Chưa backup", "b-warn"))}${metric("Quyền", esc(g.access))}</div><div><h4>Truy cập gần đây</h4><div class="timeline">${g.lastAccess.map((a) => `<div>${esc(a)}</div>`).join("")}</div></div></div>`)
  }

  function geoDatasetModal() {
    const projects = projectsView().map((p) => `<option>${esc(p.id)}</option>`).join("")
    open("Đăng ký bộ dữ liệu địa vật lý", `<div class="form-grid"><div class="full"><label>Tên bộ dữ liệu</label><input id="geo-name"></div><div><label>Loại</label><input id="geo-type" value="Từ mặt đất"></div><div><label>Dự án</label><select id="geo-project">${projects}</select></div><div><label>Dung lượng (GB)</label><input id="geo-size" type="number" value="1"></div><div><label>Storage URI</label><input id="geo-uri" value="s3://vldc-geo/"></div></div><button class="btn btn-primary" style="margin-top:10px" onclick="saveGeoDataset()">Lưu</button>`)
  }

  function saveGeoDataset() {
    const name = inputValue("geo-name").trim()
    if (!name) return alert("Vui lòng nhập tên bộ dữ liệu")
    void vldcData.save("geoDatasets", { id: newId("GEO"), name, type: inputValue("geo-type"), projectId: inputValue("geo-project"), sizeGb: Number(inputValue("geo-size")) || 0, storageUri: inputValue("geo-uri"), access: "Dự án", checksum: "chưa tính", backup: false, lastAccess: [] })
    ctx.closeModal()
  }


  function validationQueueModal() {
    const jobs = D("importJobs").filter((j) => j.errors > 0)
    open("Hàng đợi xử lý lỗi import", table(["Job", "Nguồn", "Dòng lỗi", "Trạng thái", ""], jobs.map((j) => `<tr><td>${esc(j.id)}</td><td>${esc(j.source)}</td><td>${j.errors}</td><td>${badge(j.status, statusCls(j.status))}</td><td>${j.status === "Hoàn thành" ? "" : btn("Đánh dấu đã xử lý", "resolveImport", j.id)}</td></tr>`)))
  }

  function resolveImport(id: string) {
    const j = D("importJobs").find((x) => x.id === id)
    if (j) void vldcData.save("importJobs", { ...j, ok: j.rows, errors: 0, status: "Hoàn thành" })
    validationQueueModal()
  }

  function migrationPlanModal() {
    open("Kế hoạch chuyển đổi kho giấy", table(["Đơn vị", "Còn lại", "Tốc độ (hồ sơ/tuần)", "Dự kiến hoàn thành"], D("migrationBatches").map((b) => {
      const left = b.total - b.migrated
      // Older stored batches have no rate yet; 150 dossiers/week is the demo default.
      const weekly = b.weeklyRate ?? 150
      return `<tr><td>${esc(b.unit)}</td><td>${left.toLocaleString("vi-VN")}</td><td>${weekly}</td><td>${vnDate(addDays(today(), Math.ceil(left / weekly) * 7))}</td></tr>`
    })))
  }

  function masterDataModal() {
    open("Danh mục dùng chung", table(["Danh mục", "Số giá trị", "Chủ quản", "Trạng thái", "Rà soát"], D("masterCatalogs").map((c) => `<tr><td>${esc(c.name)}</td><td>${c.count}</td><td>${esc(c.owner)}</td><td>${badge(c.status, statusCls(c.status))}</td><td>${vnDate(c.lastReview)}</td></tr>`)))
  }

  function cleaningModal() {
    open("Làm sạch dữ liệu", table(["Quy tắc", "Phạm vi", "Vi phạm", "Phụ trách", "Trạng thái"], qualityRows().map((r) => `<tr><td>${esc(r.rule)}</td><td>${esc(r.scope)}</td><td>${r.violations}</td><td>${esc(r.owner)}</td><td>${badge(r.violations ? r.status : "Đạt", r.violations ? "b-warn" : "b-ok")}</td></tr>`)))
  }

  function globalDataSearch(q: string) {
    const hits = search(q || "", ["docs", "archive", "geo", "projects", "equipment"])
    open(`Kết quả tìm kiếm “${esc(q || "")}”`, hitCards(hits) || '<div class="mini">Không tìm thấy dữ liệu phù hợp.</div>')
  }

  function researchSearch(groups: string) {
    const q = inputValue("researchAi")
    open("AI Research Copilot • kết quả có nguồn", aiSearchHtml(q, groups.split(",")))
  }

  function buildReport(id: string) {
    const def = D("reportCatalog").find((d) => d.id === id)
    if (!def) return
    void vldcData.save("reportCatalog", { ...def, lastRun: today() })
    open(`${def.name} • ${vnDate(today())}`, `<div class="mini" style="margin-bottom:8px">${esc(def.group)} • nguồn ${esc(def.source)} • gửi ${esc(def.recipients)}</div>${reportTable(def)}`)
  }

  function scheduleReport(id: string) {
    const def = D("reportCatalog").find((d) => d.id === id)
    if (!def) return
    const opts = ["Hàng ngày", "Hàng tuần – Thứ Hai", "Hàng tuần", "Hàng tháng", "Theo yêu cầu"].map((o) => `<option${o === def.schedule ? " selected" : ""}>${o}</option>`).join("")
    open(`Lịch gửi • ${def.name}`, `<div class="form-grid"><div><label>Tần suất</label><select id="rp-schedule">${opts}</select></div><div><label>Người nhận</label><input id="rp-recipients" value="${esc(def.recipients)}"></div></div><button class="btn btn-primary" style="margin-top:10px" ${jsCall("saveSchedule", def.id)}>Lưu lịch</button>`)
  }

  function saveSchedule(id: string) {
    const def = D("reportCatalog").find((d) => d.id === id)
    if (def) void vldcData.save("reportCatalog", { ...def, schedule: inputValue("rp-schedule"), recipients: inputValue("rp-recipients") })
    ctx.closeModal()
  }

  function toggleRule(id: string) {
    const r = D("alertRules").find((x) => x.id === id)
    if (r) void vldcData.save("alertRules", { ...r, enabled: !r.enabled })
  }

  function ruleForm(id?: string) {
    const r = D("alertRules").find((x) => x.id === id) ?? D("alertRules")[0]
    if (!r) return
    open(`Quy tắc • ${r.name}`, `<div class="form-grid"><div><label>Ngưỡng (${r.metric === "cost" ? "%" : "ngày"})</label><input id="rule-threshold" type="number" value="${r.threshold}"></div><div><label>Mức</label><select id="rule-level"><option${r.level === "Cao" ? " selected" : ""}>Cao</option><option${r.level === "Trung bình" ? " selected" : ""}>Trung bình</option></select></div></div><button class="btn btn-primary" style="margin-top:10px" ${jsCall("saveRule", r.id)}>Lưu</button>`)
  }

  function saveRule(id: string) {
    const r = D("alertRules").find((x) => x.id === id)
    if (r) void vldcData.save("alertRules", { ...r, threshold: Number(inputValue("rule-threshold")) || 0, level: inputValue("rule-level") })
    ctx.closeModal()
  }

  function auditSearch(q: string) {
    auditFilter = q
    rerender("audit")
  }

  function genSelect(tplId: string, targetId: string) {
    genTemplate = tplId
    genTarget = targetId
    rerender("generator")
  }

  function generateDoc() {
    const { tpl, target } = currentTemplate()
    if (!tpl || !target) return
    const text = fillTemplate(tpl.body, target.row, vnDate(today()))
    open(`${tpl.type} • ${target.id}`, `<div class="meeting-minutes" style="white-space:pre-wrap">${esc(text)}</div><div class="toolbar" style="margin-top:10px"><button class="btn btn-primary" onclick="saveGeneratedDraft()">Lưu thành dự thảo văn bản đi</button></div>`)
  }

  function saveGeneratedDraft() {
    const { tpl, target } = currentTemplate()
    if (!tpl || !target) return
    const now = new Date().toISOString()
    const who = ROLE_TITLES[ctx.role()] || ctx.role()
    const draft: OutgoingDocument = {
      id: newId("vldc-out"), documentNumber: `Dự thảo ${tpl.type}`, summary: `${tpl.title} – ${target.label}`, documentType: tpl.type === "Quyết định" ? "Quyết định" : tpl.type === "Tờ trình" ? "Tờ trình" : tpl.type === "Công văn" ? "Công văn" : "Khác",
      urgency: "Bình thường", status: "Dự thảo", draftingUnit: who, drafterName: who, approverName: leaderSignature(), recipients: "",
      attachments: [], processHistory: [{ id: newId("log"), action: "Tạo bản dự thảo từ mẫu", actor: who, role: who, timestamp: `${today()} ${now.slice(11, 16)}` }], createdAt: now, updatedAt: now,
    }
    void vldcData.save("outgoingDocuments", draft)
    ctx.closeModal()
  }

  return {
    archiveDetail, archiveRecordModal, saveArchiveRecord,
    geoDetail, geoDatasetModal, saveGeoDataset, validationQueueModal, resolveImport, migrationPlanModal, masterDataModal, cleaningModal,
    globalDataSearch, researchSearch, buildReport, scheduleReport, saveSchedule, toggleRule, ruleForm, saveRule, auditSearch, genSelect, generateDoc, saveGeneratedDraft,
  }
}

const RENDERERS: Record<string, () => string> = {
  archive, geodata, importdata, migration, datahub, reports, alerts: alertsPage, audit, generator,
}

/** Registers the pages and their modal/action handlers (inline handlers live on window). */
export function installKnowledgePages(render: Record<string, () => void>, ctx: Ctx) {
  for (const [page, html] of Object.entries(RENDERERS)) {
    render[page] = function () {
      const el = content()
      if (el) el.innerHTML = subTabsHtml(page) + html()
    }
  }
  Object.assign(window, actions(ctx))
}
