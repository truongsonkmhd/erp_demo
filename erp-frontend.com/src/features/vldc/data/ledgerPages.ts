import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday, vnDate } from "./dates"
import {
  PAY_METHODS, activeDebts, activeEntries, canEditLedger, cashSummary, debtPaid, debtPct, debtProblems, debtRemaining, debtSummary,
  entryProblems, nextId, projectBalances, receiptRows,
} from "./ledgerCore"
import { bar, kpi, kpis, metric, tr } from "./pages"
import { vldcData } from "./registry"
import type { CashEntry, DebtInstallment, DebtRecord } from "./types"

/**
 * Kế toán › Thu, Chi, Công nợ. The accountants enter the records; the Liên đoàn trưởng reads the same pages
 * (figures, table, projects to chase) without the edit buttons.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const cellValue = (row: Element, cls: string) => ((row.querySelector(`.${cls}`) as HTMLInputElement | null)?.value ?? "").trim()
/** Full amount, as written on vouchers: 1.250.000.000 đ. */
const money = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`
/** Short amount for tiles: triệu / tỷ. */
const short = (n: number) => tr(Math.round(n / 1e5) / 10)
const badge = (text: string, cls: string) => `<span class="badge ${cls}">${esc(text)}</span>`
const card = (title: string, body: string, head = "") => `<div class="card"><div class="card-head"><h3>${title}</h3>${head ? `<div class="toolbar vx-ld-head">${head}</div>` : ""}</div>${body}</div>`
const doneBadge = (done: boolean) => (done ? badge("Đã hoàn thành", "b-ok") : badge("Đang thực hiện", "b-warn"))
const remainingBadge = (n: number) => (n > 0 ? badge(money(n), "b-danger") : badge("Đã thu đủ", "b-ok"))
const thisMonth = () => localToday().slice(0, 7)

let debtFilter = ""
let cashMonth = ""

export function installLedgerPages(render: Record<string, () => void>, ctx: Ctx) {
  const D = vldcData.get
  const debts = () => activeDebts(D("debtRecords"))
  const debtById = (id: string) => D("debtRecords").find((d) => d.id === id)
  const editor = () => canEditLedger(ctx.role())
  const by = () => ctx.role()

  function rerender(page?: string) {
    const el = content()
    if (!el) return
    const p = page ?? (el.dataset.ledger || "")
    if (p === "debts") el.innerHTML = debtsHtml()
    else if (p === "cashin") el.innerHTML = cashHtml("thu")
    else if (p === "cashout") el.innerHTML = cashHtml("chi")
    el.dataset.ledger = p
  }
  render.debts = () => rerender("debts")
  render.cashin = () => rerender("cashin")
  render.cashout = () => rerender("cashout")

  // ---------- Công nợ
  function debtsHtml(): string {
    const all = debts()
    const s = debtSummary(all)
    const cash = cashSummary(D("debtRecords"), D("cashEntries"), thisMonth())
    const rows = all.filter((r) =>
      debtFilter === "owing" ? debtRemaining(r) > 0 : debtFilter === "done" ? r.done : debtFilter === "running" ? !r.done : true)
    const cols = Math.max(2, ...rows.map((r) => r.installments.length))
    const canEdit = editor()
    const lanHead = Array.from({ length: cols }, (_, i) => `<th colspan="2" class="vx-ld-lan">Lần ${i + 1}</th>`).join("")
    const lanSub = Array.from({ length: cols }, () => '<th class="vx-ld-sub">Số tiền</th><th class="vx-ld-sub">Ngày</th>').join("")
    const body = rows.map((r, i) => {
      const lan = Array.from({ length: cols }, (_, k) => {
        const x = r.installments[k]
        return x ? `<td class="vx-ld-num">${money(x.amount)}</td><td class="vx-ld-date">${esc(vnDate(x.date))}</td>` : '<td class="vx-ld-empty">–</td><td class="vx-ld-empty"></td>'
      }).join("")
      const remaining = debtRemaining(r)
      const plus = canEdit ? `<td>${remaining > 0 ? `<button class="btn btn-light vx-ld-plus" title="Thêm lần thanh toán ${r.installments.length + 1}" ${jsCall("debtInstallmentForm", r.id)}>+</button>` : ""}</td>` : ""
      const status = canEdit
        ? `<button class="vx-ld-status" title="Bấm để đổi trạng thái" ${jsCall("debtToggleDone", r.id)}>${doneBadge(r.done)}</button>`
        : doneBadge(r.done)
      return `<tr><td>${i + 1}</td><td class="vx-ld-nowrap"><b>${esc(r.contractNo)}</b></td><td class="vx-ld-name">${esc(r.projectName)}${r.projectId ? `<div class="mini">${esc(r.projectId)}</div>` : ""}</td><td class="mini vx-ld-content">${esc(r.content)}</td><td class="vx-ld-num"><b>${money(r.amount)}</b></td>${lan}${plus}<td class="vx-ld-num">${money(debtPaid(r))}<div class="mini">${debtPct(r)}%</div></td><td>${remainingBadge(remaining)}</td><td>${status}</td>${canEdit ? `<td><button class="btn btn-light" ${jsCall("debtForm", r.id)}>Sửa</button></td>` : ""}</tr>`
    }).join("")
    const total = (pick: (r: DebtRecord) => number) => rows.reduce((t, r) => t + pick(r), 0)
    const lanTotals = Array.from({ length: cols }, (_, k) => `<td class="vx-ld-num">${money(total((r) => r.installments[k]?.amount ?? 0))}</td><td></td>`).join("")
    const span = 5 + cols * 2 + (canEdit ? 1 : 0) + 3 + (canEdit ? 1 : 0)
    const foot = rows.length
      ? `<tr class="vx-ld-total"><td colspan="4">Tổng cộng (${rows.length} dự án)</td><td class="vx-ld-num">${money(total((r) => r.amount))}</td>${lanTotals}${canEdit ? "<td></td>" : ""}<td class="vx-ld-num">${money(total(debtPaid))}</td><td class="vx-ld-num">${money(total(debtRemaining))}</td><td></td>${canEdit ? "<td></td>" : ""}</tr>`
      : `<tr><td colspan="${span}" class="mini">${all.length ? "Không có dự án phù hợp bộ lọc." : "Chưa có dữ liệu công nợ."}</td></tr>`
    const filter = `<select onchange="debtFilterSet(this.value)">${[["", "Tất cả dự án"], ["owing", "Còn nợ"], ["running", "Đang thực hiện"], ["done", "Đã hoàn thành"]].map(([v, l]) => `<option value="${v}"${v === debtFilter ? " selected" : ""}>${l}</option>`).join("")}</select>`
    const table = card("Bảng công nợ dự án", `<div class="vx-staff-table vx-ld-table"><table><tr><th rowspan="2">STT</th><th rowspan="2">Số hợp đồng</th><th rowspan="2">Tên dự án</th><th rowspan="2">Nội dung</th><th rowspan="2">Giá trị hợp đồng</th>${lanHead}${canEdit ? '<th rowspan="2" title="Thêm lần thanh toán">+</th>' : ""}<th rowspan="2">Đã thanh toán</th><th rowspan="2">Còn lại</th><th rowspan="2">Trạng thái dự án</th>${canEdit ? '<th rowspan="2"></th>' : ""}</tr><tr>${lanSub}</tr>${body}${foot}</table></div>`,
      `${filter}${canEdit ? `<button class="btn btn-primary" ${jsCall("debtForm", "")}>+ Thêm dự án</button>` : ""}`)
    const balances = projectBalances(D("debtRecords"), D("cashEntries")).sort((a, b) => b.remaining - a.remaining)
    const watch = s.doneOwing.map((r) => `<div class="alert"><span class="dot red"></span><div><b>${esc(r.contractNo)} • ${esc(r.projectName)}</b><div class="mini">Dự án đã hoàn thành, còn phải thu ${money(debtRemaining(r))} (${debtPct(r)}% đã thu)</div></div></div>`).join("")
    return `${kpis(
      kpi("Tổng giá trị hợp đồng", short(s.total), `${s.count} dự án • ${s.done} đã hoàn thành`),
      kpi("Đã thu", short(s.paid), `${s.paidPct}% giá trị hợp đồng`),
      kpi("Còn phải thu", short(s.remaining), `${s.owingCount} dự án chưa thu đủ`),
      kpi("Đã xong – chưa thu đủ", s.doneOwing.length, s.doneOwing.length ? `Còn ${short(s.doneOwingAmount)} cần đôn đốc` : "Không có"),
    )}<div style="margin-top:14px">${table}</div><div class="grid twoeq" style="margin-top:14px">${card("Tỷ lệ đã thu theo dự án", balances.map((b) => bar(`${b.debt.contractNo} • ${b.debt.projectName}`, b.pct, `${b.pct}%`)).join("") || '<div class="mini">Chưa có dữ liệu.</div>')}${card("Thu – chi tổng hợp", `${metric("Tổng thu", money(cash.thu))}${metric("Tổng chi", money(cash.chi))}${metric("Chênh lệch thu – chi", money(cash.net))}${metric(`Thu / chi tháng ${thisMonth().slice(5)}/${thisMonth().slice(0, 4)}`, `${short(cash.thuMonth)} / ${short(cash.chiMonth)}`)}${watch ? `<h4 style="margin:12px 0 6px">Cần đôn đốc thu</h4>${watch}` : ""}`, '<button class="btn btn-light" onclick="show(\'cashin\')">Thu</button><button class="btn btn-light" onclick="show(\'cashout\')">Chi</button>')}</div>`
  }

  const instRow = (x?: DebtInstallment) => `<tr><td class="ld-i-no"></td><td><input class="ld-i-amount" type="number" min="0" step="1000" value="${x?.amount ?? ""}" oninput="ledgerCalc()"></td><td><input class="ld-i-date" type="date" value="${esc(x?.date ?? localToday())}"></td><td><button class="btn btn-light" onclick="this.closest('tr').remove();ledgerCalc()">×</button></td></tr>`

  function debtForm(id: string) {
    if (!editor()) return
    const r = id ? debtById(id) : undefined
    const projects = D("projects")
    ctx.openModal(r ? `Sửa công nợ • ${r.contractNo}` : "Thêm dự án vào bảng công nợ", `<div class="form-grid">
<div><label>Số hợp đồng *</label><input id="ld-no" value="${esc(r?.contractNo ?? "")}" placeholder="VD: HĐ-2026-060"></div>
<div><label>Trạng thái dự án</label><select id="ld-done"><option value="0"${r?.done ? "" : " selected"}>Đang thực hiện</option><option value="1"${r?.done ? " selected" : ""}>Đã hoàn thành</option></select></div>
<div class="full"><label>Tên dự án *</label><input id="ld-name" list="ld-projects" value="${esc(r?.projectName ?? "")}" placeholder="Chọn dự án có sẵn hoặc nhập tên mới"><datalist id="ld-projects">${projects.map((p) => `<option value="${esc(p.name)}">${esc(p.id)}</option>`).join("")}</datalist></div>
<div class="full"><label>Nội dung</label><textarea id="ld-content" rows="2">${esc(r?.content ?? "")}</textarea></div>
<div><label>Số tiền hợp đồng (đồng) *</label><input id="ld-amount" type="number" min="0" step="1000" value="${r?.amount ?? ""}" oninput="ledgerCalc()"></div>
<div><label>Bằng số</label><div id="ld-amount-text" class="vx-ld-amount"></div></div></div>
<h4 style="margin-top:12px">Các lần thanh toán</h4><div class="vx-staff-table"><table id="ld-inst" class="vx-pj-form"><thead><tr><th>Lần</th><th>Số tiền (đồng)</th><th>Ngày</th><th></th></tr></thead><tbody>${(r?.installments ?? []).map((x) => instRow(x)).join("")}</tbody></table></div>
<button class="btn btn-light" onclick="ledgerAddInstallment()">+ Thêm lần thanh toán</button>
<div id="ld-calc" class="vx-pj-tiles" style="margin-top:12px"></div>
<div class="toolbar" style="margin-top:14px"><button class="btn btn-primary" ${jsCall("debtSave", r?.id ?? "")}>${r ? "Lưu thay đổi" : "Thêm vào bảng công nợ"}</button>${r ? `<button class="btn btn-light" ${jsCall("debtRemove", r.id)}>Xóa khỏi bảng</button>` : ""}</div>`)
    ledgerCalc()
  }

  /** Live figures in the debt form: the amount written out, paid, remaining, and the lần numbering. */
  function ledgerCalc() {
    const amount = Number(value("ld-amount")) || 0
    const rows = [...document.querySelectorAll("#ld-inst tbody tr")]
    rows.forEach((row, i) => {
      const no = row.querySelector(".ld-i-no")
      if (no) no.textContent = `Lần ${i + 1}`
    })
    const paid = rows.reduce((s, row) => s + (Number(cellValue(row, "ld-i-amount")) || 0), 0)
    const text = document.getElementById("ld-amount-text")
    if (text) text.textContent = amount ? money(amount) : "–"
    const calc = document.getElementById("ld-calc")
    if (calc) {
      const left = amount - paid
      calc.innerHTML = `<div><span>Giá trị hợp đồng</span><b>${money(amount)}</b></div><div><span>Đã thanh toán (${rows.length} lần)</span><b>${money(paid)}</b><small>${amount ? Math.round((paid / amount) * 100) : 0}%</small></div><div><span>Còn lại</span><b${left < 0 ? ' style="color:var(--danger)"' : ""}>${money(left)}</b>${left < 0 ? "<small>Vượt giá trị hợp đồng</small>" : ""}</div>`
    }
  }

  function debtSave(id: string) {
    if (!editor()) return
    const prev = id ? debtById(id) : undefined
    const name = value("ld-name")
    const project = D("projects").find((p) => p.name.trim().toLowerCase() === name.toLowerCase())
    const installments = [...document.querySelectorAll("#ld-inst tbody tr")]
      // Rows left without an amount are blank lines, not payments.
      .filter((row) => cellValue(row, "ld-i-amount") !== "")
      .map((row) => ({ amount: Number(cellValue(row, "ld-i-amount")) || 0, date: cellValue(row, "ld-i-date") }))
    const now = new Date().toISOString()
    const next: DebtRecord = {
      ...(prev ?? { id: nextId("CN", localToday().slice(0, 4), D("debtRecords")), createdBy: by(), createdAt: now }),
      contractNo: value("ld-no"), projectName: name, content: value("ld-content"), amount: Number(value("ld-amount")) || 0,
      installments, done: value("ld-done") === "1", updatedAt: now,
    }
    if (project) next.projectId = project.id
    else delete next.projectId
    const problems = debtProblems(next, D("debtRecords"))
    if (problems.length) return alert(problems.join("\n"))
    void vldcData.save("debtRecords", next)
    ctx.closeModal()
    rerender()
  }

  function debtRemove(id: string) {
    const r = debtById(id)
    if (!r || !editor()) return
    if (!confirm(`Xóa ${r.contractNo} – ${r.projectName} khỏi bảng công nợ?`)) return
    void vldcData.save("debtRecords", { ...r, deleted: true, updatedAt: new Date().toISOString() })
    ctx.closeModal()
    rerender()
  }

  function debtToggleDone(id: string) {
    const r = debtById(id)
    if (!r || !editor()) return
    void vldcData.save("debtRecords", { ...r, done: !r.done, updatedAt: new Date().toISOString() })
    rerender()
  }

  function debtInstallmentForm(id: string) {
    const r = debtById(id)
    if (!r || !editor()) return
    const n = r.installments.length + 1
    ctx.openModal(`Thanh toán lần ${n} • ${r.contractNo}`, `<div class="mini" style="margin-bottom:10px"><b>${esc(r.projectName)}</b><br>Giá trị hợp đồng ${money(r.amount)} • đã thanh toán ${money(debtPaid(r))} • còn lại <b>${money(debtRemaining(r))}</b></div>
<div class="form-grid"><div><label>Số tiền lần ${n} (đồng) *</label><input id="ld-pay-amount" type="number" min="0" step="1000" value="${debtRemaining(r)}"></div>
<div><label>Ngày thanh toán *</label><input id="ld-pay-date" type="date" value="${localToday()}"></div></div>
<button class="btn btn-primary" style="margin-top:12px" ${jsCall("debtInstallmentSave", r.id)}>Ghi nhận lần ${n}</button>`)
  }

  function addInstallment(r: DebtRecord, x: DebtInstallment): string[] {
    const next = { ...r, installments: [...r.installments, x], updatedAt: new Date().toISOString() }
    const problems = debtProblems(next, D("debtRecords"))
    if (!problems.length) void vldcData.save("debtRecords", next)
    return problems
  }

  function debtInstallmentSave(id: string) {
    const r = debtById(id)
    if (!r || !editor()) return
    const problems = addInstallment(r, { amount: Number(value("ld-pay-amount")) || 0, date: value("ld-pay-date") })
    if (problems.length) return alert(problems.join("\n"))
    ctx.closeModal()
    rerender()
  }

  // ---------- Thu / Chi
  function cashHtml(kind: CashEntry["kind"]): string {
    const thu = kind === "thu"
    const s = cashSummary(D("debtRecords"), D("cashEntries"), thisMonth())
    const canEdit = editor()
    const inMonth = (date: string) => !cashMonth || date.startsWith(cashMonth)
    const monthLabel = `${thisMonth().slice(5)}/${thisMonth().slice(0, 4)}`
    const netTile = kpi("Chênh lệch thu – chi", short(s.net), `Thu ${short(s.thu)} • Chi ${short(s.chi)}`)
    const tiles = thu
      ? [kpi("Tổng thu", short(s.thu), `${s.receiptCount} khoản`), kpi(`Thu tháng ${monthLabel}`, short(s.thuMonth), "Theo ngày thu"), kpi("Thu theo hợp đồng", short(s.thuContract), `Thu khác ${short(s.thuOther)}`), netTile]
      : [kpi("Tổng chi", short(s.chi), `${s.paymentCount} phiếu chi`), kpi(`Chi tháng ${monthLabel}`, short(s.chiMonth), "Theo ngày chi"), kpi("Chi cho dự án", short(s.chiProject), `Chi khác ${short(s.chiOther)}`), netTile]
    const filter = `<input type="month" value="${esc(cashMonth)}" onchange="ledgerMonth(this.value)" title="Lọc theo tháng">${cashMonth ? '<button class="btn btn-light" onclick="ledgerMonth(\'\')">Tất cả</button>' : ""}`
    const add = canEdit ? `<button class="btn btn-primary" ${jsCall("cashForm", kind, "")}>+ ${thu ? "Phiếu thu" : "Phiếu chi"}</button>` : ""
    let list: string
    if (thu) {
      const rows = receiptRows(D("debtRecords"), D("cashEntries")).filter((r) => inMonth(r.date))
      const body = rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(vnDate(r.date))}</td><td><b>${esc(r.ref)}</b></td><td>${esc(r.content)}</td><td>${esc(r.counterparty) || "–"}</td><td>${esc(r.method) || "–"}</td><td class="vx-ld-num"><b>${money(r.amount)}</b></td><td>${r.debt ? badge("Công nợ", "b-info") : badge("Phiếu thu", "b-ok")}</td><td>${r.debt ? '<button class="btn btn-light" onclick="show(\'debts\')">Công nợ</button>' : canEdit && r.entry ? `<button class="btn btn-light" ${jsCall("cashForm", "thu", r.entry.id)}>Sửa</button>` : ""}</td></tr>`).join("")
      const total = rows.reduce((t, r) => t + r.amount, 0)
      list = card(`Sổ thu${cashMonth ? ` tháng ${cashMonth.slice(5)}/${cashMonth.slice(0, 4)}` : ""}`, `<div class="mini" style="margin-bottom:8px">Các lần thanh toán ghi ở bảng Công nợ tự động vào sổ thu.</div><div class="vx-staff-table"><table><tr><th>STT</th><th>Ngày</th><th>Số phiếu / HĐ</th><th>Nội dung</th><th>Người nộp</th><th>Hình thức</th><th>Số tiền</th><th>Nguồn</th><th></th></tr>${body || '<tr><td colspan="9" class="mini">Chưa có khoản thu.</td></tr>'}${rows.length ? `<tr class="vx-ld-total"><td colspan="6">Tổng thu (${rows.length} khoản)</td><td class="vx-ld-num">${money(total)}</td><td colspan="2"></td></tr>` : ""}</table></div>`, `${filter}${add}`)
    } else {
      const rows = activeEntries(D("cashEntries"), "chi").filter((e) => inMonth(e.date)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      const contractOf = (e: CashEntry) => (e.debtId ? debtById(e.debtId) : undefined)
      const body = rows.map((e, i) => {
        const d = contractOf(e)
        return `<tr><td>${i + 1}</td><td>${esc(vnDate(e.date))}</td><td><b>${esc(e.id)}</b></td><td>${esc(e.content)}</td><td>${esc(e.counterparty) || "–"}</td><td>${d ? `${esc(d.contractNo)}<div class="mini">${esc(d.projectName)}</div>` : '<span class="mini">Chi chung</span>'}</td><td>${esc(e.method)}</td><td class="vx-ld-num"><b>${money(e.amount)}</b></td><td>${canEdit ? `<button class="btn btn-light" ${jsCall("cashForm", "chi", e.id)}>Sửa</button>` : ""}</td></tr>`
      }).join("")
      const total = rows.reduce((t, r) => t + r.amount, 0)
      list = card(`Sổ chi${cashMonth ? ` tháng ${cashMonth.slice(5)}/${cashMonth.slice(0, 4)}` : ""}`, `<div class="vx-staff-table"><table><tr><th>STT</th><th>Ngày</th><th>Số phiếu</th><th>Nội dung</th><th>Người nhận</th><th>Dự án / HĐ</th><th>Hình thức</th><th>Số tiền</th><th></th></tr>${body || '<tr><td colspan="9" class="mini">Chưa có khoản chi.</td></tr>'}${rows.length ? `<tr class="vx-ld-total"><td colspan="7">Tổng chi (${rows.length} phiếu)</td><td class="vx-ld-num">${money(total)}</td><td></td></tr>` : ""}</table></div>`, `${filter}${add}`)
    }
    const balances = projectBalances(D("debtRecords"), D("cashEntries"))
    const byProject = card("Thu – chi theo dự án", `<div class="vx-staff-table"><table><tr><th>Hợp đồng</th><th>Dự án</th><th>Giá trị HĐ</th><th>Đã thu</th><th>Đã chi</th><th>Chênh lệch thu – chi</th><th>Còn phải thu</th></tr>${balances.map((b) => `<tr><td><b>${esc(b.debt.contractNo)}</b></td><td>${esc(b.debt.projectName)}</td><td class="vx-ld-num">${money(b.debt.amount)}</td><td class="vx-ld-num">${money(b.thu)}</td><td class="vx-ld-num">${money(b.chi)}</td><td class="vx-ld-num">${badge(money(b.net), b.net >= 0 ? "b-ok" : "b-danger")}</td><td class="vx-ld-num">${money(b.remaining)}</td></tr>`).join("") || '<tr><td colspan="7" class="mini">Chưa có dự án trong bảng công nợ.</td></tr>'}</table></div>`)
    return `${kpis(...tiles)}<div style="margin-top:14px">${list}</div><div style="margin-top:14px">${byProject}</div>`
  }

  function cashForm(kind: CashEntry["kind"], id: string) {
    if (!editor()) return
    const thu = kind === "thu"
    const e = id ? D("cashEntries").find((x) => x.id === id) : undefined
    const newId = nextId(thu ? "PT" : "PC", localToday().slice(0, 4), D("cashEntries"))
    const contracts = debts().filter((d) => !thu || debtRemaining(d) > 0)
    const linkLabel = thu ? "Thu tiền hợp đồng (ghi thành lần thanh toán ở Công nợ)" : "Chi cho dự án / hợp đồng"
    ctx.openModal(e ? `Sửa ${thu ? "phiếu thu" : "phiếu chi"} • ${e.id}` : `Lập ${thu ? "phiếu thu" : "phiếu chi"} • ${newId}`, `<div class="form-grid">
<div><label>Ngày *</label><input id="ld-c-date" type="date" value="${esc(e?.date ?? localToday())}"></div>
<div><label>Số tiền (đồng) *</label><input id="ld-c-amount" type="number" min="0" step="1000" value="${e?.amount ?? ""}" oninput="document.getElementById('ld-c-amount-text').textContent=(Number(this.value)||0).toLocaleString('vi-VN')+' đ'"><div id="ld-c-amount-text" class="mini">${e ? money(e.amount) : ""}</div></div>
<div class="full"><label>${linkLabel}</label><select id="ld-c-debt"><option value="">${thu ? "– Thu khác (không thuộc hợp đồng) –" : "– Chi chung –"}</option>${contracts.map((d) => `<option value="${esc(d.id)}"${d.id === e?.debtId ? " selected" : ""}>${esc(d.contractNo)} – ${esc(d.projectName)}${thu ? ` (còn ${money(debtRemaining(d))})` : ""}</option>`).join("")}</select></div>
<div class="full"><label>Nội dung *</label><input id="ld-c-content" value="${esc(e?.content ?? "")}"></div>
<div><label>${thu ? "Người nộp tiền" : "Người nhận tiền"}</label><input id="ld-c-party" value="${esc(e?.counterparty ?? "")}"></div>
<div><label>Hình thức</label><select id="ld-c-method">${PAY_METHODS.map((m) => `<option${m === (e?.method ?? PAY_METHODS[0]) ? " selected" : ""}>${m}</option>`).join("")}</select></div></div>
<div class="toolbar" style="margin-top:14px"><button class="btn btn-primary" ${jsCall("cashSave", kind, e?.id ?? "")}>${e ? "Lưu thay đổi" : thu ? "Lập phiếu thu" : "Lập phiếu chi"}</button>${e ? `<button class="btn btn-light" ${jsCall("cashRemove", e.id)}>Xóa phiếu</button>` : ""}</div>`)
  }

  function cashSave(kind: CashEntry["kind"], id: string) {
    if (!editor()) return
    const prev = id ? D("cashEntries").find((x) => x.id === id) : undefined
    const debtId = value("ld-c-debt")
    const entry: CashEntry = {
      ...(prev ?? { id: nextId(kind === "thu" ? "PT" : "PC", localToday().slice(0, 4), D("cashEntries")), createdBy: by(), createdAt: new Date().toISOString() }),
      kind, date: value("ld-c-date"), content: value("ld-c-content"), counterparty: value("ld-c-party"), amount: Number(value("ld-c-amount")) || 0,
      method: value("ld-c-method"),
    }
    if (debtId) entry.debtId = debtId
    else delete entry.debtId
    const problems = entryProblems(entry)
    if (problems.length) return alert(problems.join("\n"))
    // A receipt for a contract is a payment on the debt table, so it is counted once.
    if (kind === "thu" && debtId) {
      const d = debtById(debtId)
      if (!d) return alert("Không tìm thấy hợp đồng")
      const err = addInstallment(d, { amount: entry.amount, date: entry.date })
      if (err.length) return alert(err.join("\n"))
      if (prev) void vldcData.save("cashEntries", { ...prev, deleted: true })
    } else void vldcData.save("cashEntries", entry)
    ctx.closeModal()
    rerender()
  }

  function cashRemove(id: string) {
    const e = D("cashEntries").find((x) => x.id === id)
    if (!e || !editor()) return
    if (!confirm(`Xóa ${e.kind === "thu" ? "phiếu thu" : "phiếu chi"} ${e.id}?`)) return
    void vldcData.save("cashEntries", { ...e, deleted: true })
    ctx.closeModal()
    rerender()
  }

  Object.assign(window, {
    debtForm, debtSave, debtRemove, debtToggleDone, debtInstallmentForm, debtInstallmentSave, ledgerCalc, cashForm, cashSave, cashRemove,
    ledgerAddInstallment: () => {
      document.querySelector("#ld-inst tbody")?.insertAdjacentHTML("beforeend", instRow())
      ledgerCalc()
    },
    debtFilterSet: (v: string) => {
      debtFilter = v
      rerender("debts")
    },
    ledgerMonth: (v: string) => {
      cashMonth = v
      rerender()
    },
  })
}
