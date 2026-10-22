import { escapeHtml as esc, formatDate, jsCall, statusBadge } from "../workflow/html"
import { disbursementView, projectsView } from "./projectView"
import { kpiUnits, unitKpi } from "../workflow/kpi"
import { roleUnitCode, unitCodeOf, unitName } from "./org"
import { PAYMENT_STEPS, ROLE_TITLES, isClosed } from "../workflow/rules"
import { workflowStore } from "../workflow/repository"
import type { WorkItem } from "../workflow/types"
import * as A from "./accountingMetrics"
import { assignmentProgressHtml, assignmentSectionHtml } from "./docAssignPage"
import { subTabsHtml } from "./menuPolicy"
import { localToday, vnDate } from "./dates"
import * as M from "./metrics"
import { bar, kpi, kpis, metric, tr, ty } from "./pages"
import { vldcData } from "./registry"
import { UNC_TYPE, uncButton } from "./uncPage"
import type { Contract, Project } from "./types"

/**
 * Accounting, contracts, documents, cross-department flows and unit dashboards on stored records,
 * plus the detail modals that open the record behind each row (by id).
 */

type Ctx = { role(): string; openModal(title: string, html: string): void }
const D = vldcData.get
const today = () => localToday()
const content = () => document.getElementById("content")
const card = (title: string, body: string, head = "") => `<div class="card"><div class="card-head"><h3>${title}</h3>${head}</div>${body}</div>`
const grid = (cls: string, ...cards: string[]) => `<div class="grid ${cls}" style="margin-top:14px">${cards.join("")}</div>`
const btn = (label: string, fn: string, ...args: string[]) => `<button class="btn btn-light" ${jsCall(fn, ...args)}>${label}</button>`
const goto = (label: string, page: string, primary = false) => `<button class="btn ${primary ? "btn-primary" : "btn-light"}" onclick="show('${page}')">${label}</button>`
const badge = (text: string, cls: string) => `<span class="badge ${cls}">${esc(text)}</span>`
const table = (head: string[], rows: string[], empty = "Không có dữ liệu.") =>
  `<table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.join("") || `<tr><td colspan="${head.length}" class="mini">${empty}</td></tr>`}</table>`
const voucherStatus = (s: string) => badge(s, s === A.POSTED ? "b-ok" : s === "Cần bổ sung" ? "b-danger" : "b-warn")
const riskCls = (r: string) => (r === "Cao" ? "b-danger" : r === "Trung bình" ? "b-warn" : "b-ok")
const payments = (): WorkItem[] => workflowStore.items().filter((x) => x.type === "payment")
const roleTitle = (r: string) => ROLE_TITLES[r] || r

// ---------- Accounting ----------

/** Doanh thu & công nợ for the federation head: revenue of receivable contracts, what is still owed, by customer. */
function revenueSection(): string {
  const r = A.revenueSummary(D("contracts"), today())
  const ar = A.debtSummary(D("contracts"), "thu", today())
  const thu = D("contracts").filter((c) => c.kind === "thu").length
  const rows = r.customers.map((c) => `<tr><td><b>${esc(c.party)}</b><div class="mini">${c.contracts} hợp đồng</div></td><td>${tr(c.value)}</td><td>${tr(c.invoiced)}</td><td>${tr(c.collected)}</td><td><b>${tr(c.outstanding)}</b></td><td>${c.agingDays ? badge(`${c.agingDays} ngày`, c.agingDays > 60 ? "b-danger" : "b-warn") : c.outstanding ? badge("Trong hạn", "b-ok") : "–"}</td></tr>`)
  const total = `<tr><td><b>Tổng</b></td><td><b>${tr(r.contractValue)}</b></td><td><b>${tr(r.invoiced)}</b></td><td><b>${tr(r.collected)}</b></td><td><b>${tr(r.receivable)}</b></td><td></td></tr>`
  return `<h3 style="margin:0 0 10px">Doanh thu & công nợ</h3>${kpis(
    kpi("Tổng doanh thu hợp đồng", tr(r.contractValue), `${thu} hợp đồng thu • đã xuất hóa đơn ${tr(r.invoiced)}`),
    kpi("Đã thu", tr(r.collected), `${r.collectedPct}% số đã xuất hóa đơn`),
    kpi("Còn phải thu", tr(r.receivable), `${tr(ar.overdue)} quá hạn • ${tr(ar.over60)} > 60 ngày`),
    kpi("Công nợ phải trả", tr(r.payable), `${tr(r.payableOverdue)} quá hạn`),
  )}${grid("two",
    card("Doanh thu – công nợ theo khách hàng", table(["Khách hàng", "Giá trị HĐ", "Đã xuất HĐ", "Đã thu", "Còn phải thu", "Tuổi nợ"], rows.length ? [...rows, total] : [])),
    card("Tuổi nợ phải thu", `${ar.buckets.map((b) => bar(b.label, ar.total ? Math.round((b.amount / ar.total) * 100) : 0, tr(b.amount))).join("")}${metric("Chưa xuất hóa đơn", tr(r.notInvoiced))}`),
  )}<h3 style="margin:18px 0 10px">Hoạt động kế toán</h3>`
}

function accounting(ctx: Ctx, chief = ctx.role() === "ketoantruong") {
  const leader = ctx.role() === "lanhdao"
  const v = A.voucherSummary(D("vouchers"))
  const pays = payments().filter((p) => !isClosed(p))
  const adv = A.advanceSummary(D("advances"), today())
  const ar = A.debtSummary(D("contracts"), "thu", today())
  const close = A.closingSummary(D("closingTasks"))
  const cash = A.cashSummary(D("bankAccounts"), D("bankLines"))
  const mine = pays.filter((p) => p.owner === ctx.role())
  const todo = [
    ...mine.map((p) => `<div class="alert"><span class="dot red"></span><div><b>${esc(p.id)} • ${esc(p.title)}</b><div class="mini">Bước: ${esc(PAYMENT_STEPS[p.step ?? 0]?.label ?? "")} • ${tr((p.amount ?? 0) / 1e6)}</div></div>${btn("Mở", "wfOpen", p.id)}</div>`),
    ...adv.open.filter((a) => a.missingInvoice).map((a) => `<div class="alert"><span class="dot yellow"></span><div><b>${esc(a.id)} • Hoàn ứng ${esc(a.person)}</b><div class="mini">Thiếu hóa đơn • còn ${tr(A.advanceRemaining(a))}</div></div>${btn("Mở", "advanceDetail", a.id)}</div>`),
    ...ar.debts.filter((d) => d.agingDays > 60).map((d) => `<div class="alert"><span class="dot blue"></span><div><b>${esc(d.contract.id)} • Công nợ ${esc(d.contract.party)}</b><div class="mini">${tr(d.outstanding)} • quá hạn ${d.agingDays} ngày</div></div>${btn("Mở", "debtDetail", d.contract.id)}</div>`),
  ].join("") || '<div class="mini">Không có việc tồn.</div>'
  const flow = D("cashflow").map((c) => `<tr><td>${esc(c.month)}</td><td>${ty(c.inflow)}</td><td>${ty(c.outflow)}</td><td>${badge(ty(c.inflow - c.outflow), c.inflow >= c.outflow ? "b-ok" : "b-danger")}</td></tr>`)
  return `${leader ? revenueSection() : ""}${kpis(
    kpi("Chứng từ chờ xử lý", v.pending, `${v.needSupplement} cần bổ sung`),
    kpi("Hồ sơ thanh toán đang mở", pays.length, `${mine.length} đang ở bước của bạn`),
    kpi("Tạm ứng chưa hoàn", tr(adv.outstanding), `${adv.overdueCount} khoản quá hạn`),
    kpi("Công nợ phải thu", tr(ar.total), `${tr(ar.over60)} > 60 ngày`),
  )}${grid("two",
    card(leader ? "Việc kế toán đang tồn" : `Việc ${chief ? "Kế toán trưởng" : "Kế toán viên"} cần xử lý`, todo, goto("Luồng liên phòng", "crossflow", true)),
    card(`Kiểm soát kỳ ${esc(close.period)}`, `${bar("Khóa sổ", close.pct)}${bar("Ghép sao kê ngân hàng", cash.matchRate)}${metric("Chênh lệch ERP – sao kê", tr(cash.diff))}${metric("Hạng mục khóa sổ còn mở", close.open)}`, goto("Checklist", "closing")),
  )}${grid("twoeq",
    card("Dự báo dòng tiền", table(["Tháng", "Thu", "Chi", "Ròng"], flow)),
    card("Chi phí so với tiến độ", table(["Dự án", "Kỹ thuật", "Chi phí", ""], projectsView().map((p) => `<tr><td>${esc(p.id)}</td><td>${p.technical}%</td><td>${p.costUsed}%</td><td>${M.isOverrun(p) ? badge("Lệch", "b-danger") : badge("Ổn", "b-ok")}</td></tr>`))),
  )}`
}

function vouchers() {
  const vs = [...D("vouchers")].sort((a, b) => b.date.localeCompare(a.date))
  const v = A.voucherSummary(vs)
  return `${kpis(
    kpi("Chứng từ", v.count, "Trong kỳ"),
    kpi("Chờ xử lý", v.pending, tr(v.pendingAmount)),
    kpi("Cần bổ sung", v.needSupplement, "Thiếu hồ sơ gốc"),
    kpi("Chờ duyệt / kiểm soát", v.awaitingApproval, "Kế toán trưởng, lãnh đạo"),
  )}<div style="margin-top:14px">${card("Danh sách chứng từ", table(["Số", "Ngày", "Loại", "Đối tượng", "Dự án", "Số tiền", "Trạng thái", ""], vs.map((x) => `<tr><td><b>${esc(x.id)}</b></td><td>${vnDate(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.counterparty)}</td><td>${esc(x.projectId)}</td><td>${tr(x.amount)}</td><td>${voucherStatus(x.status)}</td><td>${btn("Mở", "voucherDetail", x.id)}${x.type === UNC_TYPE ? ` ${uncButton(x.id)}` : ""}</td></tr>`)), '<button class="btn btn-primary" onclick="voucherModal()">+ Lập chứng từ</button>')}</div>`
}

function stepper(p: WorkItem) {
  const step = p.step ?? 0
  const at = (i: number) => {
    // history: create (step 0), then one "advance" per later step.
    const entries = p.history.filter((h) => h.action === "create" || h.action === "advance")
    return entries[i]?.at
  }
  return `<div class="timeline">${PAYMENT_STEPS.map((s, i) => {
    const done = i < step || p.status === "Đã chi"
    const mark = done ? "✓" : i === step ? "▶" : "○"
    const time = done && at(i) ? ` • ${formatDate(at(i)!.slice(0, 10))} ${at(i)!.slice(11, 16)}` : ""
    return `<div>${mark} <b>${esc(s.label)}</b> – ${esc(roleTitle(s.owner))}${time}</div>`
  }).join("")}</div>`
}

function paymentsPage() {
  const ps = payments()
  const open = ps.filter((p) => !isClosed(p))
  const sumM = (rows: WorkItem[]) => rows.reduce((s, p) => s + (p.amount ?? 0), 0) / 1e6
  const linked = (id: string) => D("vouchers").filter((v) => v.workItemId === id)
  return `${kpis(
    kpi("Hồ sơ đang xử lý", open.length, tr(sumM(open))),
    kpi("Chờ kế toán", open.filter((p) => ["ketoan", "ketoantruong"].includes(p.owner)).length, "Kiểm tra / kiểm soát"),
    kpi("Chờ lãnh đạo duyệt", open.filter((p) => p.owner === "lanhdao").length, "Phê duyệt chi"),
    kpi("Đã chi", ps.filter((p) => p.status === "Đã chi").length, tr(sumM(ps.filter((p) => p.status === "Đã chi")))),
  )}<div class="grid twoeq" style="margin-top:14px">${open.map((p) => card(`${esc(p.id)} • ${esc(p.title)}`, `${metric("Số tiền", tr((p.amount ?? 0) / 1e6))}${metric("Đang ở", esc(roleTitle(p.owner)))}${stepper(p)}${linked(p.id).map((v) => `<div class="mini" style="margin-top:6px">Chứng từ: <a href="javascript:void 0" ${jsCall("voucherDetail", v.id)}>${esc(v.id)}</a> • ${voucherStatus(v.status)}</div>`).join("")}`, btn("Mở hồ sơ", "wfOpen", p.id))).join("") || '<div class="mini">Không có hồ sơ đang xử lý.</div>'}</div>`
}

function advances() {
  const rows = [...D("advances")].sort((a, b) => a.due.localeCompare(b.due))
  const s = A.advanceSummary(rows, today())
  return `${kpis(
    kpi("Tạm ứng chưa hoàn", tr(s.outstanding), `${s.open.length} khoản`),
    kpi("Quá hạn hoàn ứng", s.overdueCount, tr(s.overdueAmount)),
    kpi("Thiếu hóa đơn", s.missingInvoice, "Cần bổ sung chứng từ"),
    kpi("Đã hoàn ứng xong", s.settled, "Trong kỳ"),
  )}<div style="margin-top:14px">${card("Theo dõi tạm ứng", table(["Mã", "Người tạm ứng", "Dự án", "Số tiền", "Đã hoàn", "Còn lại", "Hạn", "Trạng thái", ""], rows.map((a) => {
    const left = A.advanceRemaining(a)
    const st = left <= 0 ? badge("Đã hoàn", "b-ok") : a.due < today() ? badge("Quá hạn", "b-danger") : a.missingInvoice ? badge("Thiếu hóa đơn", "b-warn") : badge("Trong hạn", "b-info")
    return `<tr><td><b>${esc(a.id)}</b></td><td>${esc(a.person)}</td><td>${esc(a.projectId)}</td><td>${tr(a.amount)}</td><td>${tr(a.returned)}</td><td>${tr(left)}</td><td>${vnDate(a.due)}</td><td>${st}</td><td>${btn("Mở", "advanceDetail", a.id)}</td></tr>`
  })))}</div>`
}

function debtPage(kind: Contract["kind"]) {
  const s = A.debtSummary(D("contracts"), kind, today())
  const rec = kind === "thu"
  const tiles = rec
    ? [kpi("Phải thu", tr(s.total), `${s.debts.length} hợp đồng`), kpi("Quá hạn", tr(s.overdue), "Đã qua hạn thanh toán"), kpi("> 60 ngày", tr(s.over60), `${s.over60Count} hợp đồng`), kpi("Đã thu lũy kế", tr(s.collected), "Theo milestone")]
    : [kpi("Phải trả", tr(s.total), `${s.debts.length} hợp đồng`), kpi("Quá hạn", tr(s.overdue), "Cần thanh toán ngay"), kpi("Đến hạn 7 ngày", tr(s.debts.filter((d) => d.nextDue && d.nextDue <= addDaysIso(7)).reduce((x, d) => x + d.outstanding - d.overdue, 0)), "Lập kế hoạch chi"), kpi("Đã trả lũy kế", tr(s.collected), "Theo milestone")]
  const aging = rec ? card("Tuổi nợ", s.buckets.map((b) => bar(b.label, s.total ? Math.round((b.amount / s.total) * 100) : 0, tr(b.amount))).join("")) : ""
  const rows = s.debts.map((d) => `<tr><td><b>${esc(d.contract.party)}</b><div class="mini">${esc(d.contract.name)}</div></td><td>${esc(d.contract.id)}</td><td>${tr(d.outstanding)}</td><td>${d.agingDays ? badge(`${d.agingDays} ngày`, d.agingDays > 60 ? "b-danger" : "b-warn") : badge("Trong hạn", "b-ok")}</td><td>${d.nextDue ? vnDate(d.nextDue) : "–"}</td><td>${btn("Chi tiết", "debtDetail", d.contract.id)}${rec && d.agingDays > 30 ? ` ${btn("Công văn đôn đốc", "debtLetter", d.contract.id)}` : ""}</td></tr>`)
  const list = card(rec ? "Công nợ phải thu theo hợp đồng" : "Công nợ phải trả theo hợp đồng", table([rec ? "Khách hàng" : "Nhà cung cấp", "Hợp đồng", "Còn lại", "Quá hạn", "Hạn kế tiếp", ""], rows))
  return `${kpis(...tiles)}${rec ? grid("two", list, aging) : `<div style="margin-top:14px">${list}</div>`}`
}

const addDaysIso = (n: number) => {
  const d = new Date(`${today()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function cashbank() {
  const accounts = D("bankAccounts")
  const c = A.cashSummary(accounts, D("bankLines"))
  return `${kpis(
    kpi("Số dư theo ERP", tr(c.erp), `${accounts.length} tài khoản / quỹ`),
    kpi("Số dư theo sao kê", tr(c.statement), "Ngân hàng xác nhận"),
    kpi("Chênh lệch", tr(c.diff), `${c.mismatchedAccounts} tài khoản lệch`),
    kpi("Dòng sao kê chưa ghép", c.unmatched, `Tỷ lệ ghép ${c.matchRate}%`),
  )}<div style="margin-top:14px">${card("Tài khoản ngân hàng & quỹ", table(["Tài khoản", "Số dư ERP", "Số dư sao kê", "Chênh lệch", "Trạng thái"], accounts.map((a) => `<tr><td><b>${esc(a.name)}</b></td><td>${tr(a.erpBalance)}</td><td>${tr(a.statementBalance)}</td><td>${tr(a.erpBalance - a.statementBalance)}</td><td>${a.erpBalance === a.statementBalance ? badge("Khớp", "b-ok") : badge("Cần đối chiếu", "b-warn")}</td></tr>`)), '<button class="btn btn-primary" onclick="bankReconcile()">Đối chiếu sao kê</button>')}</div>`
}

function acctassets() {
  const assets = D("fixedAssets")
  const s = A.assetSummary(assets)
  const eq = (id?: string) => D("equipment").find((e) => e.id === id)
  return `${kpis(
    kpi("Nguyên giá TSCĐ", tr(s.cost), `${s.count} tài sản`),
    kpi("Giá trị còn lại", tr(s.nbv), `${s.fullyDepreciated} hết khấu hao`),
    kpi("Liên kết hồ sơ kỹ thuật", `${s.linked}/${s.count}`, "Gắn mã thiết bị"),
    kpi("Lệch dữ liệu", s.mismatched, "Kế toán ↔ thiết bị"),
  )}<div style="margin-top:14px">${card("Sổ tài sản cố định", table(["Mã TS", "Tài sản", "Thiết bị", "Nguyên giá", "Còn lại", "Đơn vị", "Đối chiếu", ""], assets.map((a) => `<tr><td><b>${esc(a.id)}</b></td><td>${esc(a.name)}</td><td>${a.equipmentId ? `${esc(a.equipmentId)}<div class="mini">${esc(eq(a.equipmentId)?.unit ?? "")}</div>` : "–"}</td><td>${tr(a.cost)}</td><td>${tr(a.nbv)}</td><td>${esc(a.unit)}</td><td>${badge(a.status, a.status.startsWith("Lệch") ? "b-danger" : a.nbv === 0 ? "b-info" : "b-ok")}</td><td>${btn("Mở", "assetAccountingDetail", a.id)}</td></tr>`)))}</div>`
}

let selectedProject = ""
function projectacct() {
  const projects = projectsView()
  const pid = projects.some((p) => p.id === selectedProject) ? selectedProject : projects[0]?.id ?? ""
  const lines = D("financeLines").filter((l) => l.project === pid)
  const sum = (pick: (l: (typeof lines)[number]) => number) => lines.reduce((s, l) => s + pick(l), 0)
  const p = projects.find((x) => x.id === pid)
  const options = projects.map((x) => `<option value="${esc(x.id)}"${x.id === pid ? " selected" : ""}>${esc(x.id)} – ${esc(x.name)}</option>`).join("")
  return `<div class="card" style="margin-bottom:14px"><label class="mini">Dự án</label><select onchange="selectAcctProject(this.value)">${options}</select></div>${kpis(
    kpi("Dự toán", tr(sum((l) => l.budget)), `${lines.length} hạng mục`),
    kpi("Cam kết chi", tr(sum((l) => l.committed)), "Hợp đồng / đơn hàng"),
    kpi("Đã thanh toán", tr(sum((l) => l.paid)), p ? `Tiến độ kỹ thuật ${p.technical}%` : ""),
    kpi("Đã hạch toán", tr(sum((l) => l.posted)), "Theo sổ chi tiết 154"),
  )}<div style="margin-top:14px">${card("Chi phí theo hạng mục", table(["Hạng mục", "Đơn vị", "Dự toán", "Cam kết", "Đã chi", "Hạch toán", "KL nghiệm thu", "Cảnh báo"], lines.map((l) => {
    const paidPct = l.budget ? Math.round((l.paid / l.budget) * 100) : 0
    return `<tr><td>${esc(l.item)}</td><td>${esc(l.unit)}</td><td>${tr(l.budget)}</td><td>${tr(l.committed)}</td><td>${tr(l.paid)}</td><td>${tr(l.posted)}</td><td>${l.acceptedPct}%</td><td>${paidPct - l.acceptedPct > 10 ? badge(`Chi ${paidPct}% > NT ${l.acceptedPct}%`, "b-danger") : badge("Ổn", "b-ok")}</td></tr>`
  })))}</div>`
}

function reconcile() {
  const cash = A.cashSummary(D("bankAccounts"), D("bankLines"))
  const assets = A.assetSummary(D("fixedAssets"))
  const vouchers = D("vouchers")
  const linkedPayments = vouchers.filter((v) => v.workItemId).length
  const contractsLinked = vouchers.filter((v) => v.contractId).length
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 100)
  return `${kpis(
    kpi("Ngân hàng ↔ chứng từ", `${cash.matchRate}%`, `${cash.unmatched} dòng chưa ghép`),
    kpi("TSCĐ ↔ hồ sơ thiết bị", `${pct(assets.linked - assets.mismatched, assets.count)}%`, `${assets.mismatched} lệch`),
    kpi("Chứng từ ↔ hợp đồng", `${pct(contractsLinked, vouchers.length)}%`, `${contractsLinked}/${vouchers.length} chứng từ`),
    kpi("Chứng từ ↔ hồ sơ thanh toán", linkedPayments, "Liên kết luồng workflow"),
  )}<div style="margin-top:14px">${card("Chênh lệch cần xử lý", table(["Đối tượng", "Nguồn A", "Nguồn B", "Chênh lệch", ""], [
    ...D("bankAccounts").filter((a) => a.erpBalance !== a.statementBalance).map((a) => `<tr><td>${esc(a.name)}</td><td>ERP ${tr(a.erpBalance)}</td><td>Sao kê ${tr(a.statementBalance)}</td><td>${tr(a.erpBalance - a.statementBalance)}</td><td><button class="btn btn-light" onclick="bankReconcile()">Đối chiếu</button></td></tr>`),
    ...D("fixedAssets").filter((a) => a.status.startsWith("Lệch")).map((a) => `<tr><td>${esc(a.id)} • ${esc(a.name)}</td><td>Kế toán: ${esc(a.unit)}</td><td>Thiết bị: ${esc(D("equipment").find((e) => e.id === a.equipmentId)?.unit ?? "–")}</td><td>${esc(a.status)}</td><td>${btn("Mở", "assetAccountingDetail", a.id)}</td></tr>`),
  ], "Không có chênh lệch."))}</div>`
}

function closing() {
  const tasks = D("closingTasks")
  const s = A.closingSummary(tasks)
  return `${kpis(
    kpi("Kỳ khóa sổ", esc(s.period), "Tháng trước"),
    kpi("Hoàn thành", `${s.pct}%`, `${s.done}/${tasks.length} hạng mục`),
    kpi("Còn mở", s.open, "Cần xử lý trước khi khóa"),
    kpi("Tạm ứng quá hạn", A.advanceSummary(D("advances"), today()).overdueCount, "Ảnh hưởng khóa sổ"),
  )}<div style="margin-top:14px">${card(`Checklist khóa sổ ${esc(s.period)}`, table(["Hạng mục", "Phụ trách", "Ghi chú", "Trạng thái", ""], tasks.map((t) => `<tr><td>${esc(t.item)}</td><td>${esc(t.owner)}</td><td class="mini">${esc(t.note)}</td><td>${t.done ? badge("Hoàn thành", "b-ok") : badge("Đang mở", "b-warn")}</td><td><button class="btn btn-light" ${jsCall("toggleClosing", t.id)}>${t.done ? "Mở lại" : "Đánh dấu xong"}</button></td></tr>`)))}</div>`
}

function ledgers() {
  const vs = D("vouchers")
  return `<div class="card"><div class="card-head"><h3>Sổ kế toán</h3><span class="mini">Bút toán sinh tự động từ ${vs.length} chứng từ</span></div><div class="toolbar">${A.LEDGERS.map((l) => `<button class="btn btn-light" ${jsCall("ledgerDetail", l.name)}>${esc(l.name)} (${A.ledgerFor(l.name, vs).length})</button>`).join("")}</div></div>`
}

function acctreports() {
  const ar = A.debtSummary(D("contracts"), "thu", today())
  const ap = A.debtSummary(D("contracts"), "chi", today())
  const rev = A.revenueSummary(D("contracts"), today())
  const adv = A.advanceSummary(D("advances"), today())
  const cash = A.cashSummary(D("bankAccounts"), D("bankLines"))
  const f = M.financeMetrics(D("financeLines"), disbursementView())
  const next = D("cashflow")[0]
  return `<div class="card"><div class="card-head"><h3>Báo cáo tài chính phục vụ lãnh đạo</h3><span class="mini">Tính từ dữ liệu kế toán hiện hành</span></div>${table(["Chỉ tiêu", "Giá trị", "Ghi chú"], [
    `<tr><td>Giải ngân so kế hoạch năm</td><td>${ty(f.paid)} / ${ty(f.plan)}</td><td>${f.disbursedPct}%</td></tr>`,
    `<tr><td>Tiền & tương đương (ERP)</td><td>${tr(cash.erp)}</td><td>Chênh sao kê ${tr(cash.diff)}</td></tr>`,
    `<tr><td>Doanh thu hợp đồng</td><td>${tr(rev.contractValue)}</td><td>Đã xuất hóa đơn ${tr(rev.invoiced)} • đã thu ${tr(rev.collected)} (${rev.collectedPct}%)</td></tr>`,
    `<tr><td>Công nợ phải thu</td><td>${tr(ar.total)}</td><td>${tr(ar.over60)} trên 60 ngày</td></tr>`,
    `<tr><td>Công nợ phải trả</td><td>${tr(ap.total)}</td><td>${tr(ap.overdue)} quá hạn</td></tr>`,
    `<tr><td>Tạm ứng chưa hoàn</td><td>${tr(adv.outstanding)}</td><td>${adv.overdueCount} khoản quá hạn</td></tr>`,
    next ? `<tr><td>Dòng tiền ${esc(next.month)}</td><td>${ty(next.inflow - next.outflow)}</td><td>Thu ${ty(next.inflow)} • Chi ${ty(next.outflow)}</td></tr>` : "",
  ])}</div>`
}

// ---------- Contracts & documents ----------

function contractsPage(ctx: Ctx) {
  const role = ctx.role()
  const cs = D("contracts")
  const ar = A.debtSummary(cs, "thu", today())
  const paidOf = (c: Contract) => c.milestones.reduce((s, m) => s + m.paid, 0)
  return `${kpis(
    kpi("Hợp đồng đang quản lý", cs.length, tr(cs.reduce((s, c) => s + c.value, 0))),
    kpi("Khách hàng / nhà cung cấp", `${cs.filter((c) => c.kind === "thu").length} / ${cs.filter((c) => c.kind === "chi").length}`, "Số hợp đồng theo loại"),
    kpi("Phải thu còn lại", tr(ar.total), `${tr(ar.over60)} > 60 ngày`),
    kpi("Rủi ro cao", cs.filter((c) => c.risk === "Cao").length, "Cần theo dõi"),
  )}<div style="margin-top:14px">${card("Danh mục hợp đồng", table(["Mã", "Đối tác / nội dung", "Loại", "Giá trị", "Đã thanh toán", "Còn phải thanh toán", "Giai đoạn", "Nghĩa vụ tiếp theo", "Rủi ro", ""], cs.map((c) => `<tr><td><b>${esc(c.id)}</b></td><td>${esc(c.party)}<div class="mini">${esc(c.name)}</div></td><td>${c.kind === "thu" ? "Khách hàng" : "Nhà cung cấp"}</td><td>${tr(c.value)}</td><td>${tr(paidOf(c))}</td><td><b>${tr(c.value - paidOf(c))}</b></td><td>${esc(c.stage)}</td><td>${esc(c.nextObligation)}</td><td>${badge(c.risk, riskCls(c.risk))}</td><td>${btn("Mở", "contractDetail", c.id)}</td></tr>`)), A.canCreateContract(role) ? '<button class="btn btn-primary" onclick="contractForm()">+ Hợp đồng</button>' : "")}</div>`
}

const isDone = (status: string) => status === "Hoàn thành" || status === "Đã phát hành"

function documents() {
  const ins = [...D("incomingDocuments")].sort((a, b) => b.receivedDate.localeCompare(a.receivedDate))
  const outs = [...D("outgoingDocuments")].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const withDue = ins.filter((d) => d.dueDate)
  const onTime = withDue.filter((d) => isDone(d.status) || (d.dueDate as string) >= today()).length
  const urg = (u: string) => badge(u, u === "Bình thường" ? "b-info" : "b-danger")
  return `${kpis(
    kpi("Văn bản đến hôm nay", ins.filter((d) => d.receivedDate.startsWith(today())).length, `${ins.length} văn bản đến`),
    kpi("Đang xử lý", ins.filter((d) => !isDone(d.status)).length, `${withDue.filter((d) => !isDone(d.status) && (d.dueDate as string) < today()).length} quá hạn`),
    kpi("Trình ký", outs.filter((d) => d.status === "Chờ ký").length, `${outs.length} văn bản đi`),
    kpi("Đúng hạn", `${withDue.length ? Math.round((onTime / withDue.length) * 100) : 100}%`, "Văn bản đến có hạn xử lý"),
  )}${grid("two",
    card("Văn bản đến", table(["Số/ký hiệu", "Trích yếu", "Người giữ", "Hạn", "Trạng thái", "Trả lời", ""], ins.map((d) => `<tr><td><b>${esc(d.documentNumber)}</b><div class="mini">${urg(d.urgency)}</div></td><td>${esc(d.summary)}</td><td>${esc(d.assignedToUser ?? "–")}</td><td>${d.dueDate ? vnDate(d.dueDate) : "–"}</td><td>${badge(d.status, isDone(d.status) ? "b-ok" : "b-warn")}</td><td>${assignmentProgressHtml(d.id)}</td><td>${btn("Mở", "documentDetail", d.id)}</td></tr>`)), '<button class="btn btn-primary" onclick="documentForm()">+ Văn bản</button>'),
    card("Văn bản đi", table(["Số", "Trích yếu", "Người ký", "Trạng thái", ""], outs.map((d) => `<tr><td><b>${esc(d.officialNumber || d.documentNumber)}</b></td><td>${esc(d.summary)}</td><td>${esc(d.approverName)}</td><td>${badge(d.status, d.status === "Chờ ký" ? "b-warn" : isDone(d.status) ? "b-ok" : "b-info")}</td><td>${btn("Mở", "documentDetail", d.id)}</td></tr>`))),
  )}`
}

// ---------- Cross-department flows ----------

function crossflow() {
  const ps = payments()
  const open = ps.filter((p) => !isClosed(p))
  const hos = D("handoffs")
  const avgSteps = open.length ? (open.reduce((s, p) => s + (p.step ?? 0), 0) / open.length).toFixed(1) : "0"
  return `${kpis(
    kpi("Luồng thanh toán đang chạy", open.length, `${ps.length} hồ sơ`),
    kpi("Bước trung bình", `${avgSteps}/${PAYMENT_STEPS.length - 1}`, "Tiến độ trong quy trình"),
    kpi("Bàn giao đang chờ", hos.filter((h) => h.status === "Đang chờ").length, "Giữa các phòng"),
    kpi("Bàn giao quá hạn", hos.filter((h) => h.status === "Quá hạn").length, "Vượt SLA"),
  )}<div class="grid twoeq" style="margin-top:14px">${open.map((p) => card(`${esc(p.id)} • ${esc(p.title)}`, stepper(p), btn("Mở", "wfOpen", p.id))).join("")}</div>`
}

function handoff() {
  const hos = D("handoffs")
  const st = (s: string) => badge(s, s === "Đã bàn giao" ? "b-ok" : s === "Quá hạn" ? "b-danger" : "b-warn")
  return `<div class="card"><div class="card-head"><h3>Điểm bàn giao nghiệp vụ</h3><span class="mini">${hos.length} bàn giao • ${hos.filter((h) => h.status !== "Đã bàn giao").length} chưa hoàn tất</span></div>${table(["Hồ sơ", "Từ", "Đến", "Điều kiện bàn giao", "SLA", "Trạng thái", ""], hos.map((h) => `<tr><td><b>${esc(h.ref)}</b></td><td>${esc(h.from)}</td><td>${esc(h.to)}</td><td>${esc(h.condition)}</td><td>${h.slaHours} giờ</td><td>${st(h.status)}</td><td>${h.workItemId ? btn("Mở hồ sơ", "wfOpen", h.workItemId) : ""}</td></tr>`))}</div>`
}

// ---------- Dashboards ----------

/** Heads of the operating units get their unit's dashboard; the unit comes from the role's department. */
const UNIT_HEADS = ["hangkhong", "matdat", "bien", "trungtam"]

export function hasUnitDashboard(role: string) {
  return UNIT_HEADS.includes(role) && !!roleUnitCode(role)
}

function projectRows(ps: Project[]) {
  return table(["Dự án", "Kỹ thuật", "Chi phí", "Dự báo"], ps.map((p) => `<tr><td><a href="javascript:void 0" ${jsCall("projectDetail", p.id)}>${esc(p.id)}</a><div class="mini">${esc(p.name)}</div></td><td>${p.technical}%</td><td>${p.costUsed}%${M.isOverrun(p) ? ` ${badge("lệch", "b-danger")}` : ""}</td><td>${p.delayDays ? badge(`+${p.delayDays} ngày`, p.delayDays > 14 ? "b-danger" : "b-warn") : badge("Đúng hạn", "b-ok")}</td></tr>`), "Đơn vị chưa có dự án.")
}

/** Dashboard of one operating unit (Đoàn / Trung tâm): its projects, equipment, work and calendar. */
export function unitDashboardHtml(role: string): string {
  const code = roleUnitCode(role)!
  const u = { name: unitName(code) }
  const org = D("orgUnits").find((o) => o.id === code)
  const ps = projectsView().filter((p) => unitCodeOf(p.unit) === code)
  const eqs = D("equipment").filter((e) => unitCodeOf(e.unit) === code)
  const em = M.equipmentMetrics(eqs, today())
  const kpiUnit = kpiUnits().find((x) => x.id === code)
  const k = kpiUnit ? unitKpi(kpiUnit, workflowStore.items(), today()) : undefined
  const open = (k?.items ?? []).filter((x) => !isClosed(x))
  const events = D("calendarEvents").filter((e) => unitCodeOf(e.unit) === code).slice(0, 4)
  return `<div class="module-hero ${role === "bien" ? "project-visual" : role === "trungtam" ? "equipment-visual" : "field-visual"}"><div><div class="hero-tag">ĐƠN VỊ TRỰC THUỘC</div><h2>${esc(org?.name ?? u.name)}</h2><p>${esc(org?.mission ?? "")}</p></div><div class="hero-tag">${org?.staffCount ?? 0} nhân sự công khai</div></div>${kpis(
    kpi("Nhiệm vụ đang thực hiện", ps.length, `${ps.filter((p) => p.delayDays > 0).length} có dự báo trễ`),
    kpi("Việc của đơn vị", open.length, `${open.filter((x) => x.due < today()).length} quá hạn`),
    kpi("Thiết bị quản lý", em.total, `${em.dueSoon} sắp kiểm định`),
    kpi("KPI đơn vị", k?.score == null ? "–" : `${k.score}%`, "Tính từ công việc"),
  )}${grid("twoeq",
    card("Nhiệm vụ trọng tâm", projectRows(ps), goto("Mở nhiệm vụ", "projects", true)),
    card("Việc cần xử lý", open.slice(0, 5).map((x) => `<div class="alert"><span class="dot ${x.due < today() ? "red" : "yellow"}"></span><div><b>${esc(x.id)} • ${esc(x.title)}</b><div class="mini">${statusBadge(x)} Hạn ${formatDate(x.due)}</div></div>${btn("Mở", "wfOpen", x.id)}</div>`).join("") + events.map((e) => `<div class="alert"><span class="dot blue"></span><div><b>${esc(e.date)} ${esc(e.time)} • ${esc(e.title)}</b><div class="mini">${esc(e.note)}</div></div></div>`).join("") || '<div class="mini">Không có việc tồn.</div>', goto("Mở Công việc", "action")),
  )}`
}

/** Dashboard of the remaining roles (heads, specialists): federation-wide picture computed from records. */
export function baseDashboardHtml(): string {
  const ps = projectsView()
  const f = M.financeMetrics(D("financeLines"), disbursementView())
  const ins = D("incomingDocuments")
  const ar = A.debtSummary(D("contracts"), "thu", today())
  const eq = D("equipment")
  const ready = eq.length ? Math.round((eq.filter((e) => e.status !== "Bảo dưỡng").length / eq.length) * 100) : 0
  const avgTech = ps.length ? Math.round(ps.reduce((s, p) => s + p.technical, 0) / ps.length) : 0
  const pendingDocs = ins.filter((d) => !isDone(d.status))
  const withDue = ins.filter((d) => d.dueDate)
  const onTime = withDue.length ? Math.round((withDue.filter((d) => isDone(d.status) || (d.dueDate as string) >= today()).length / withDue.length) * 100) : 100
  const k = kpiUnits().filter((x) => ["MD", "DB", "HK", "TT"].includes(x.id)).map((x) => unitKpi(x, workflowStore.items(), today()))
  return `<div class="module-hero executive-visual"><div><div class="hero-tag">TỔNG QUAN LIÊN ĐOÀN</div><h2>Trung tâm điều hành Liên đoàn</h2><p>Nhiệm vụ, tài chính, văn bản, công nợ và nguồn lực tính từ dữ liệu ERP.</p></div><div class="hero-tag">Cập nhật realtime</div></div>${kpis(
    kpi("Nhiệm vụ đang thực hiện", ps.length, `${ps.filter((p) => p.delayDays > 0).length} có dự báo trễ`),
    kpi("Kế hoạch năm", ty(f.plan), `Giải ngân ${f.disbursedPct}%`),
    kpi("Văn bản đang xử lý", pendingDocs.length, `${withDue.filter((d) => !isDone(d.status) && (d.dueDate as string) < today()).length} quá hạn`),
    kpi("Công nợ phải thu", tr(ar.total), `${tr(ar.over60)} > 60 ngày`),
  )}${grid("two",
    card("Tóm tắt điều hành", `${bar("Tiến độ kỹ thuật TB", avgTech)}${bar("Giải ngân", f.disbursedPct)}${bar("Văn bản đúng hạn", onTime)}${bar("Thiết bị sẵn sàng", ready)}${table(["Đơn vị", "Việc mở", "Đúng hạn", "KPI"], k.map((x) => `<tr><td>${esc(x.unit.name)}</td><td>${x.open}</td><td>${x.criteria.onTime.value ?? "–"}%</td><td>${x.score ?? "–"}</td></tr>`))}`, goto("Xem báo cáo", "reports")),
    card("Chi phí so với tiến độ", projectRows(ps)),
  )}`
}

// ---------- Detail modals ----------

function modals(ctx: Ctx) {
  const open = ctx.openModal
  const notFound = (what: string, id: string) => open(what, `<div class="mini">Không tìm thấy ${esc(id)}.</div>`)

  function equipmentDetail(id?: string) {
    const e = D("equipment").find((x) => x.id === id) ?? D("equipment")[0]
    if (!e) return notFound("Thiết bị", id ?? "")
    const asset = D("fixedAssets").find((a) => a.equipmentId === e.id)
    open(`Hồ sơ thiết bị • ${e.id}`, `<h3 style="margin-top:0">${esc(e.name)}</h3><div class="grid twoeq"><div>${metric("Nhóm", esc(e.group))}${metric("Đơn vị quản lý", esc(e.unit))}${metric("Trạng thái", esc(e.status))}${metric("Số lượng", e.quantity)}${metric("Năm sử dụng", esc(e.year))}${metric("Tình trạng", esc(e.condition))}</div><div>${bar("Utilization", e.utilization)}${metric("Hạn kiểm định", `${vnDate(e.inspectionDue)}${M.inspectionSoon(e, today()) ? " • sắp đến hạn" : ""}`)}${metric("Chi phí sửa chữa", tr(e.repairCost))}${asset ? `${metric("Tài sản kế toán", `<a href="javascript:void 0" ${jsCall("assetAccountingDetail", asset.id)}>${esc(asset.id)}</a>`)}${metric("Giá trị còn lại", tr(asset.nbv))}` : metric("Tài sản kế toán", "Chưa liên kết")}</div></div>`)
  }

  function contractDetail(id: string) {
    const c = D("contracts").find((x) => x.id === id)
    if (!c) return notFound("Hợp đồng", id)
    const d = A.contractDebt(c, today())
    const vs = D("vouchers").filter((v) => v.contractId === c.id)
    open(`Hợp đồng • ${c.id}`, `<h3 style="margin-top:0">${esc(c.name)}</h3><div class="grid twoeq"><div>${metric(c.kind === "thu" ? "Khách hàng" : "Nhà cung cấp", esc(c.party))}${metric("Giá trị", tr(c.value))}${metric("Dự án", `<a href="javascript:void 0" ${jsCall("projectDetail", c.projectId)}>${esc(c.projectId)}</a>`)}${metric("Giai đoạn", esc(c.stage))}${metric("Còn phải " + (c.kind === "thu" ? "thu" : "trả"), tr(d.outstanding))}${metric("Rủi ro", badge(c.risk, riskCls(c.risk)))}</div><div><h4>Nghĩa vụ</h4>${c.obligations.map((o) => `<div class="folder">✓ ${esc(o)}</div>`).join("")}</div></div><h4 style="margin-top:12px">Mốc thanh toán</h4>${table(["Mốc", "Giá trị", "Đã xuất HĐ", "Đã thanh toán", "Hạn"], c.milestones.map((m) => `<tr><td>${esc(m.name)}</td><td>${tr(m.value)}</td><td>${tr(m.invoiced)}</td><td>${tr(m.paid)}</td><td>${vnDate(m.due)}${m.invoiced > m.paid && m.due < today() ? ` ${badge("Quá hạn", "b-danger")}` : ""}</td></tr>`))}<h4 style="margin-top:12px">Chứng từ liên quan</h4>${vs.map((v) => `<div class="mini"><a href="javascript:void 0" ${jsCall("voucherDetail", v.id)}>${esc(v.id)}</a> • ${vnDate(v.date)} • ${tr(v.amount)} • ${esc(v.status)}</div>`).join("") || '<div class="mini">Chưa có.</div>'}`)
  }

  function debtDetail(id: string) {
    contractDetail(id)
  }

  function debtLetter(id: string) {
    const c = D("contracts").find((x) => x.id === id)
    if (!c) return notFound("Công văn đôn đốc", id)
    const d = A.contractDebt(c, today())
    open(`Dự thảo công văn đôn đốc • ${c.id}`, `<div class="meeting-minutes"><p>Kính gửi: <b>${esc(c.party)}</b></p><p>Căn cứ hợp đồng số <b>${esc(c.id)}</b> (${esc(c.name)}), đến ngày ${vnDate(today())} Quý đơn vị còn nợ <b>${tr(d.outstanding)}</b>, trong đó <b>${tr(d.overdue)}</b> đã quá hạn ${d.agingDays} ngày.</p><p>Đề nghị Quý đơn vị thanh toán số tiền trên trong vòng 10 ngày làm việc kể từ ngày nhận công văn này.</p></div><div class="toolbar" style="margin-top:10px"><button class="btn btn-primary" onclick="closeModal();show('documents')">Chuyển trình ký</button></div>`)
  }

  function voucherDetail(id: string) {
    const v = D("vouchers").find((x) => x.id === id)
    if (!v) return notFound("Chứng từ", id)
    const wi = v.workItemId ? workflowStore.items().find((x) => x.id === v.workItemId) : undefined
    const entry = A.ledgerEntries([v])[0]
    open(`Chứng từ • ${v.id}`, `<div class="grid twoeq"><div>${metric("Loại", esc(v.type))}${metric("Ngày", vnDate(v.date))}${metric("Đối tượng", esc(v.counterparty))}${metric("Dự án", `<a href="javascript:void 0" ${jsCall("projectDetail", v.projectId)}>${esc(v.projectId)}</a>`)}${metric("Số tiền", tr(v.amount))}${metric("Nguồn kinh phí", esc(v.fundSource))}${metric("Trạng thái", voucherStatus(v.status))}</div><div><h4>Hạch toán</h4>${metric("Nợ", `TK ${entry.debit}`)}${metric("Có", `TK ${entry.credit}`)}${v.contractId ? metric("Hợp đồng", `<a href="javascript:void 0" ${jsCall("contractDetail", v.contractId)}>${esc(v.contractId)}</a>`) : ""}${wi ? `<h4 style="margin-top:10px">Hồ sơ thanh toán ${esc(wi.id)}</h4>${stepper(wi)}${btn("Mở hồ sơ", "wfOpen", wi.id)}` : ""}${v.note ? `<p class="mini">${esc(v.note)}</p>` : ""}</div></div>${v.type === UNC_TYPE ? `<div style="margin-top:12px">${uncButton(v.id)}</div>` : ""}`)
  }

  function advanceDetail(id: string) {
    const a = D("advances").find((x) => x.id === id)
    if (!a) return notFound("Tạm ứng", id)
    open(`Tạm ứng • ${a.id}`, `${metric("Người tạm ứng", esc(a.person))}${metric("Dự án", `<a href="javascript:void 0" ${jsCall("projectDetail", a.projectId)}>${esc(a.projectId)}</a>`)}${metric("Số tạm ứng", tr(a.amount))}${metric("Đã hoàn", tr(a.returned))}${metric("Còn lại", tr(A.advanceRemaining(a)))}${metric("Hạn hoàn ứng", `${vnDate(a.due)}${a.due < today() && A.advanceRemaining(a) > 0 ? ` ${badge("Quá hạn", "b-danger")}` : ""}`)}${a.missingInvoice ? '<div class="alert"><span class="dot yellow"></span><div><b>Thiếu hóa đơn</b><div class="mini">Cần bổ sung chứng từ trước khi quyết toán tạm ứng.</div></div></div>' : ""}`)
  }

  function assetAccountingDetail(id: string) {
    const a = D("fixedAssets").find((x) => x.id === id)
    if (!a) return notFound("Tài sản", id)
    const e = D("equipment").find((x) => x.id === a.equipmentId)
    open(`Tài sản • ${a.id}`, `<div class="grid twoeq"><div>${metric("Tài sản", esc(a.name))}${metric("Nguyên giá", tr(a.cost))}${metric("Giá trị còn lại", tr(a.nbv))}${metric("Đơn vị (kế toán)", esc(a.unit))}${metric("Nguồn hình thành", esc(a.source))}${metric("Đối chiếu", esc(a.status))}</div><div><h4>Hồ sơ kỹ thuật</h4>${e ? `${metric("Thiết bị", `<a href="javascript:void 0" ${jsCall("equipmentDetail", e.id)}>${esc(e.id)} • ${esc(e.name)}</a>`)}${metric("Đơn vị (thiết bị)", esc(e.unit))}${metric("Hạn kiểm định", vnDate(e.inspectionDue))}` : '<div class="mini">Chưa liên kết thiết bị.</div>'}</div></div>`)
  }

  function documentDetail(id: string) {
    const inc = D("incomingDocuments").find((x) => x.id === id)
    const out = inc ? undefined : D("outgoingDocuments").find((x) => x.id === id)
    const doc = inc ?? out
    if (!doc) return notFound("Văn bản", id)
    const info = inc
      ? `${metric("Số/ký hiệu", esc(inc.documentNumber))}${metric("Nơi gửi", esc(inc.senderUnit))}${metric("Loại / độ khẩn", `${esc(inc.documentType)} • ${esc(inc.urgency)}`)}${metric("Đơn vị xử lý", esc(inc.assignedToUnit ?? "–"))}${metric("Người giữ", esc(inc.assignedToUser ?? "–"))}${metric("Hạn", inc.dueDate ? vnDate(inc.dueDate) : "–")}${metric("Trạng thái", esc(inc.status))}`
      : `${metric("Số", esc(out!.officialNumber || out!.documentNumber))}${metric("Đơn vị soạn", esc(out!.draftingUnit))}${metric("Người ký", esc(out!.approverName))}${metric("Nơi nhận", esc(out!.recipients))}${metric("Trạng thái", esc(out!.status))}`
    open(`Văn bản • ${doc.summary.slice(0, 60)}`, `<h3 style="margin-top:0">${esc(doc.summary)}</h3><div class="grid twoeq"><div>${info}${inc?.instruction ? `<p class="mini">${esc(inc.instruction)}</p>` : ""}</div><div><h4>Lịch sử xử lý</h4><div class="timeline">${[...doc.processHistory].reverse().map((h) => `<div><b>${esc(h.timestamp)} • ${esc(h.actor)}</b> (${esc(h.role)})<br>${esc(h.action)}${h.note ? `: ${esc(h.note)}` : ""}</div>`).join("")}</div></div></div>${inc ? assignmentSectionHtml(inc.id, ctx.role()) : ""}`)
  }

  function bankReconcile() {
    const vouchers = D("vouchers")
    open("Đối chiếu sao kê ngân hàng", table(["Ngày", "Nội dung sao kê", "Số tiền", "Chứng từ đề xuất", "Độ tin cậy", ""], D("bankLines").map((l) => {
      const v = vouchers.find((x) => x.id === (l.matchedVoucherId ?? l.suggestedVoucherId))
      const action = l.matchedVoucherId ? badge(`Đã ghép ${l.matchedVoucherId}`, "b-ok") : v ? `<button class="btn btn-ok" ${jsCall("matchBankLine", l.id)}>Ghép</button>` : badge("Cần hạch toán thủ công", "b-warn")
      return `<tr><td>${vnDate(l.date)}</td><td>${esc(l.text)}</td><td>${tr(l.amount)}</td><td>${v ? `${esc(v.id)} • ${tr(v.amount)}` : "–"}</td><td>${l.confidence ? `${l.confidence}%` : "–"}</td><td>${action}</td></tr>`
    })))
  }

  function matchBankLine(id: string) {
    const l = D("bankLines").find((x) => x.id === id)
    if (!l?.suggestedVoucherId) return
    void vldcData.save("bankLines", { ...l, matchedVoucherId: l.suggestedVoucherId })
    bankReconcile()
  }

  function ledgerDetail(name: string) {
    const entries = A.ledgerFor(name, D("vouchers"))
    open(esc(name), table(["Ngày", "Chứng từ", "Diễn giải", "Dự án", "Nợ", "Có", "Số tiền", ""], entries.map((e) => `<tr><td>${vnDate(e.date)}</td><td><a href="javascript:void 0" ${jsCall("voucherDetail", e.voucherId)}>${esc(e.voucherId)}</a></td><td>${esc(e.desc)}</td><td>${esc(e.projectId)}</td><td>${e.debit}</td><td>${e.credit}</td><td>${tr(e.amount)}</td><td>${e.posted ? badge("Đã ghi sổ", "b-ok") : badge("Chưa ghi sổ", "b-warn")}</td></tr>`)))
  }

  function toggleClosing(id: string) {
    const t = D("closingTasks").find((x) => x.id === id)
    if (t) void vldcData.save("closingTasks", { ...t, done: !t.done })
  }

  function selectAcctProject(id: string) {
    selectedProject = id
    const el = content()
    if (el) el.innerHTML = projectacct()
  }

  return { equipmentDetail, contractDetail, debtDetail, debtLetter, voucherDetail, advanceDetail, assetAccountingDetail, documentDetail, bankReconcile, matchBankLine, ledgerDetail, toggleClosing, selectAcctProject }
}

const RENDERERS: Record<string, (ctx: Ctx) => string> = {
  vouchers, payments: paymentsPage, advances, receivables: () => debtPage("thu"), payables: () => debtPage("chi"),
  cashbank, acctassets, projectacct, reconcile, closing, ledgers, acctreports,
  contracts: contractsPage, documents, crossflow, handoff,
}

/** Registers the pages and the id-based detail modals (inline handlers live on window). */
export function installAccountingPages(render: Record<string, (chief?: boolean) => void>, ctx: Ctx) {
  for (const [page, html] of Object.entries(RENDERERS)) {
    render[page] = function () {
      const el = content()
      if (el) el.innerHTML = subTabsHtml(page) + html(ctx)
    }
  }
  // The engine's dashboard calls render.accounting(chief) for the two accounting roles.
  render.accounting = function (chief?: boolean) {
    const el = content()
    if (el) el.innerHTML = accounting(ctx, chief)
  }
  Object.assign(window, modals(ctx))
}
