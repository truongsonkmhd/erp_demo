import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday, vnDate } from "./dates"
import { PAY_METHODS, ledgerStore, type LedgerContract } from "./ledgerStore"
import { kpi, kpis } from "./pages"
import { projectsView } from "./projectView"

/**
 * Kế toán › Thu, Chi, Công nợ, all computed by the backend ledger from the contracts (their instalments and recorded
 * payments) plus thu khác / chi khác. Kế toán records; Liên đoàn trưởng reads the same pages without the buttons.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const money = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`
const badge = (text: string, cls: string) => `<span class="badge ${cls}">${esc(text)}</span>`
const card = (title: string, body: string, head = "") => `<div class="card"><div class="card-head"><h3>${title}</h3>${head ? `<div class="toolbar vx-ld-head">${head}</div>` : ""}</div>${body}</div>`
const thisMonth = () => localToday().slice(0, 7)
const fail = (e: unknown) => alert((e as Error).message || "Thao tác không thành công")
const projectName = (id: string | null) => (id ? projectsView().find((p) => p.id === id)?.name ?? id : "–")

const state = { debtKind: "thu" as "thu" | "chi", debtFilter: "", month: "" }

/** One line of the Thu / Chi book: a contract payment or a thu khác / chi khác entry. */
type BookLine = { key: string; date: string; ref: string; content: string; party: string; method: string; amount: number; project: string | null; contractId?: string; entryId?: string }

export function installLedgerPages(render: Record<string, () => void>, ctx: Ctx) {
  const PAGES: Record<string, () => string> = { debts: debtsHtml, cashin: () => cashHtml("thu"), cashout: () => cashHtml("chi") }
  function rerender(page?: string) {
    const el = content()
    const p = page ?? location.pathname.split("/").pop() ?? ""
    if (el && PAGES[p] && location.pathname.endsWith(`/${p}`)) el.innerHTML = PAGES[p]()
  }
  for (const p of Object.keys(PAGES)) {
    render[p] = () => {
      void ledgerStore.start().then(() => rerender(p))
      const el = content()
      if (el) el.innerHTML = PAGES[p]()
    }
  }

  // ---------- Công nợ (phải thu / phải trả) from running contracts
  function debtsHtml(): string {
    const kind = state.debtKind
    const verb = kind === "thu" ? "thu" : "trả"
    const live = ledgerStore.contracts().filter((c) => c.kind === kind && c.status !== "Dự thảo")
    const rows = live.filter((c) => state.debtFilter === "owing" ? c.remaining > 0 : state.debtFilter === "overdue" ? c.overdue > 0
      : state.debtFilter === "done" ? c.projectDone : state.debtFilter === "running" ? !c.projectDone : true)
      .sort((a, b) => b.overdue - a.overdue || b.remaining - a.remaining)
    const cols = Math.max(2, ...rows.map((c) => c.payments.length))
    const money$ = ledgerStore.canManageMoney()
    const lanHead = Array.from({ length: cols }, (_, i) => `<th colspan="2" class="vx-ld-lan">Lần ${i + 1}</th>`).join("")
    const lanSub = Array.from({ length: cols }, () => '<th class="vx-ld-sub">Số tiền</th><th class="vx-ld-sub">Ngày</th>').join("")
    const body = rows.map((c, idx) => {
      const pays = [...c.payments].sort((a, b) => a.date.localeCompare(b.date))
      const lan = Array.from({ length: cols }, (_, k) => pays[k] ? `<td class="vx-ld-num">${money(pays[k].amount)}</td><td class="vx-ld-date">${vnDate(pays[k].date)}</td>` : '<td class="vx-ld-empty">–</td><td class="vx-ld-empty"></td>').join("")
      const plus = money$ ? `<td>${c.can.record && c.remaining > 0 ? `<button class="btn btn-light vx-ld-plus" title="Ghi nhận lần ${verb} tiếp theo" data-arg0="${esc(c.id)}" onclick="event.stopPropagation();contractPaymentForm(this.dataset.arg0,'')">+</button>` : ""}</td>` : ""
      const done = c.projectDone ? badge("Đã hoàn thành", "b-ok") : badge("Đang thực hiện", "b-warn")
      const status = money$ ? `<button class="vx-ld-status" title="Bấm để đổi trạng thái dự án" data-arg0="${esc(c.id)}" data-arg1="${c.projectDone ? "" : "1"}" onclick="event.stopPropagation();debtToggleDone(this.dataset.arg0,this.dataset.arg1)">${done}</button>` : done
      const remaining = c.remaining > 0 ? badge(money(c.remaining), c.overdue > 0 ? "b-danger" : "b-warn") : badge(`Đã ${verb} đủ`, "b-ok")
      return `<tr class="vx-staff-row" ${jsCall("contractDetail", c.id)}><td>${idx + 1}</td><td class="vx-ld-nowrap"><b>${esc(c.contractNo)}</b></td><td class="vx-ld-name">${esc(projectName(c.projectId))}<div class="mini">${esc(c.party)}</div></td><td class="mini vx-ld-content">${esc(c.content)}</td><td class="vx-ld-num"><b>${money(c.value)}</b></td>${lan}${plus}<td class="vx-ld-num">${money(c.paid)}<div class="mini">${c.value ? Math.round((c.paid / c.value) * 100) : 0}%</div></td><td>${remaining}${c.overdue ? `<div class="mini" style="color:var(--danger)">quá hạn ${money(c.overdue)}</div>` : ""}</td><td>${status}</td></tr>`
    }).join("")
    const sum = (pick: (c: LedgerContract) => number) => rows.reduce((t, c) => t + pick(c), 0)
    const span = 5 + cols * 2 + (money$ ? 1 : 0) + 3
    const foot = rows.length
      ? `<tr class="vx-ld-total"><td colspan="4">Tổng cộng (${rows.length} hợp đồng)</td><td class="vx-ld-num">${money(sum((c) => c.value))}</td><td colspan="${cols * 2 + (money$ ? 1 : 0)}"></td><td class="vx-ld-num">${money(sum((c) => c.paid))}</td><td class="vx-ld-num">${money(sum((c) => c.remaining))}</td><td></td></tr>`
      : `<tr><td colspan="${span}" class="mini">${live.length ? "Không có hợp đồng phù hợp bộ lọc." : `Chưa có hợp đồng ${kind} đang thực hiện.`}</td></tr>`
    const tab = (k: "thu" | "chi", label: string) => `<button class="vx-news-chip${kind === k ? " active" : ""}" ${jsCall("debtKind", k)}>${label}</button>`
    const filter = `<select onchange="debtFilterSet(this.value)" style="width:auto">${[["", "Tất cả"], ["owing", `Còn phải ${verb}`], ["overdue", "Có đợt quá hạn"], ["running", "Dự án đang thực hiện"], ["done", "Dự án đã hoàn thành"]].map(([v, l]) => `<option value="${v}"${v === state.debtFilter ? " selected" : ""}>${l}</option>`).join("")}</select>`
    const due = live.flatMap((c) => c.installments.filter((i) => i.overdue).map((i) => ({ c, i }))).sort((a, b) => (a.i.dueDate ?? "").localeCompare(b.i.dueDate ?? ""))
    const watch = live.filter((c) => c.projectDone && c.remaining > 0)
    const s = ledgerStore.summary()
    return `<div class="toolbar" style="margin-bottom:12px">${tab("thu", "Phải thu (hợp đồng thu)")}${tab("chi", "Phải trả (hợp đồng chi)")}</div>${kpis(
      kpi("Tổng giá trị hợp đồng", money(sum((c) => c.value)), `${rows.length} hợp đồng`),
      kpi(`Đã ${verb}`, money(sum((c) => c.paid)), `${sum((c) => c.value) ? Math.round((sum((c) => c.paid) / sum((c) => c.value)) * 100) : 0}% giá trị`),
      kpi(`Còn phải ${verb}`, money(kind === "thu" ? s.receivable : s.payable), `${live.filter((c) => c.remaining > 0).length} hợp đồng chưa ${verb} đủ`),
      kpi("Quá hạn", money(kind === "thu" ? s.overdueReceivable : s.overduePayable), `${due.length} đợt quá hạn`),
    )}<div style="margin-top:14px">${card(kind === "thu" ? "Công nợ phải thu" : "Công nợ phải trả", `<div class="vx-staff-table vx-ld-table"><table><tr><th rowspan="2">STT</th><th rowspan="2">Số hợp đồng</th><th rowspan="2">Dự án / đối tác</th><th rowspan="2">Nội dung</th><th rowspan="2">Giá trị hợp đồng</th>${lanHead}${money$ ? '<th rowspan="2">+</th>' : ""}<th rowspan="2">Đã thanh toán</th><th rowspan="2">Còn lại</th><th rowspan="2">Trạng thái dự án</th></tr><tr>${lanSub}</tr>${body}${foot}</table></div><div class="mini" style="margin-top:8px">Lần 1, lần 2… là các lần ${verb} thực tế theo thứ tự ngày. Bấm vào dòng để mở hồ sơ hợp đồng (lịch các đợt, lịch sử).</div>`, filter)}</div>
<div class="grid twoeq" style="margin-top:14px">${card("Đợt quá hạn", due.map(({ c, i }) => `<div class="alert vx-cap-pick" ${jsCall("contractDetail", c.id)}><span class="dot red"></span><div><b>${esc(c.contractNo)} • ${esc(i.name)}</b><div class="mini">Hạn ${vnDate(i.dueDate ?? "")} • còn ${money(i.remaining)} • ${esc(c.party)}</div></div></div>`).join("") || '<div class="mini">Không có đợt quá hạn.</div>')}
${card(kind === "thu" ? "Dự án đã xong – chưa thu đủ" : "Dự án đã xong – chưa trả đủ", watch.map((c) => `<div class="alert vx-cap-pick" ${jsCall("contractDetail", c.id)}><span class="dot yellow"></span><div><b>${esc(c.contractNo)} • ${esc(projectName(c.projectId))}</b><div class="mini">Còn ${money(c.remaining)} (${c.value ? Math.round((c.paid / c.value) * 100) : 0}% đã ${verb})</div></div></div>`).join("") || '<div class="mini">Không có.</div>')}</div>`
  }

  // ---------- Thu / Chi books
  function bookLines(kind: "thu" | "chi"): BookLine[] {
    const fromContracts = ledgerStore.contracts().filter((c) => c.kind === kind).flatMap((c) => c.payments.map((p): BookLine => ({
      key: p.id, date: p.date, ref: `${c.contractNo} • ${p.installmentName}`, content: c.content || c.contractNo, party: c.party, method: p.method,
      amount: p.amount, project: c.projectId, contractId: c.id,
    })))
    const other = ledgerStore.cashEntries().filter((e) => e.kind === kind).map((e): BookLine => ({
      key: e.id, date: e.date, ref: e.id, content: e.content, party: e.counterparty ?? "", method: e.method, amount: e.amount, project: e.projectId, entryId: e.id,
    }))
    return [...fromContracts, ...other].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key))
  }

  function cashHtml(kind: "thu" | "chi"): string {
    const thu = kind === "thu"
    const s = ledgerStore.summary()
    const lines = bookLines(kind).filter((l) => !state.month || l.date.startsWith(state.month))
    const monthLabel = `${thisMonth().slice(5)}/${thisMonth().slice(0, 4)}`
    const tiles = thu
      ? [kpi("Tổng thu", money(s.thu), `Theo hợp đồng ${money(s.thuContract)}`), kpi(`Thu tháng ${monthLabel}`, money(s.thuMonth), "Theo ngày thu"), kpi("Thu khác", money(s.thuOther), "Không thuộc hợp đồng")]
      : [kpi("Tổng chi", money(s.chi), `Theo hợp đồng ${money(s.chiContract)}`), kpi(`Chi tháng ${monthLabel}`, money(s.chiMonth), "Theo ngày chi"), kpi("Chi khác", money(s.chiOther), "Không thuộc hợp đồng")]
    tiles.push(kpi("Chênh lệch thu – chi", money(s.thu - s.chi), `Thu ${money(s.thu)} • Chi ${money(s.chi)}`))
    const filter = `<input type="month" value="${esc(state.month)}" onchange="ledgerMonth(this.value)" title="Lọc theo tháng" style="width:auto">${state.month ? '<button class="btn btn-light" onclick="ledgerMonth(\'\')">Tất cả</button>' : ""}`
    const add = ledgerStore.canManageMoney() ? `<button class="btn btn-primary" ${jsCall("cashForm", kind, "")}>+ ${thu ? "Thu khác" : "Chi khác"}</button>` : ""
    const body = lines.map((l, i) => `<tr><td>${i + 1}</td><td>${vnDate(l.date)}</td><td><b>${esc(l.ref)}</b></td><td>${esc(l.content)}</td><td>${esc(l.party) || "–"}</td><td class="mini">${esc(projectName(l.project))}</td><td>${esc(l.method)}</td><td class="vx-ld-num"><b>${money(l.amount)}</b></td>
<td>${l.contractId ? badge("Hợp đồng", "b-info") : badge(thu ? "Thu khác" : "Chi khác", "b-ok")}</td><td>${l.contractId ? `<button class="btn btn-light" ${jsCall("contractDetail", l.contractId)}>Hợp đồng</button>` : ledgerStore.canManageMoney() && l.entryId ? `<button class="btn btn-light" ${jsCall("cashForm", kind, l.entryId)}>Sửa</button>` : ""}</td></tr>`).join("")
    const total = lines.reduce((t, l) => t + l.amount, 0)
    const book = card(`Sổ ${thu ? "thu" : "chi"}${state.month ? ` tháng ${state.month.slice(5)}/${state.month.slice(0, 4)}` : ""}`, `<div class="mini" style="margin-bottom:8px">Các lần ${thu ? "thu" : "chi"} theo hợp đồng được ghi trong hồ sơ hợp đồng (Kế toán › Công nợ hoặc Hợp đồng) và tự vào sổ này.</div><div class="vx-staff-table"><table><tr><th>STT</th><th>Ngày</th><th>Số phiếu / HĐ</th><th>Nội dung</th><th>${thu ? "Người nộp" : "Người nhận"}</th><th>Dự án</th><th>Hình thức</th><th>Số tiền</th><th>Nguồn</th><th></th></tr>${body || `<tr><td colspan="10" class="mini">Chưa có khoản ${thu ? "thu" : "chi"}.</td></tr>`}${lines.length ? `<tr class="vx-ld-total"><td colspan="7">Tổng (${lines.length} khoản)</td><td class="vx-ld-num">${money(total)}</td><td colspan="2"></td></tr>` : ""}</table></div>`, `${filter}${add}`)
    // Thu – chi per project: contract payments plus thu / chi khác attached to a project.
    const byProject = new Map<string, { thu: number; chi: number }>()
    for (const k of ["thu", "chi"] as const) for (const l of bookLines(k)) {
      if (!l.project) continue
      const row = byProject.get(l.project) ?? { thu: 0, chi: 0 }
      row[k] += l.amount
      byProject.set(l.project, row)
    }
    const balance = card("Thu – chi theo dự án", `<div class="vx-staff-table"><table><tr><th>Dự án</th><th>Đã thu</th><th>Đã chi</th><th>Chênh lệch thu – chi</th></tr>${[...byProject.entries()].sort((a, b) => b[1].thu - a[1].thu).map(([p, v]) => `<tr><td><b>${esc(p)}</b><div class="mini">${esc(projectName(p))}</div></td><td class="vx-ld-num">${money(v.thu)}</td><td class="vx-ld-num">${money(v.chi)}</td><td class="vx-ld-num">${badge(money(v.thu - v.chi), v.thu >= v.chi ? "b-ok" : "b-danger")}</td></tr>`).join("") || '<tr><td colspan="4" class="mini">Chưa có số liệu.</td></tr>'}</table></div>`)
    return `${kpis(...tiles)}<div style="margin-top:14px">${book}</div><div style="margin-top:14px">${balance}</div>`
  }

  // ---------- Thu khác / chi khác form (Kế toán)
  function cashForm(kind: "thu" | "chi", id: string) {
    if (!ledgerStore.canManageMoney()) return
    const thu = kind === "thu"
    const e = id ? ledgerStore.cashEntries().find((x) => x.id === id) : undefined
    const projects = projectsView()
    ctx.openModal(e ? `Sửa ${thu ? "thu" : "chi"} khác • ${e.id}` : `${thu ? "Thu" : "Chi"} khác (không thuộc hợp đồng)`, `<div class="mini" style="margin-bottom:8px">Tiền ${thu ? "thu" : "chi"} theo hợp đồng ghi trong hồ sơ hợp đồng, không ghi ở đây.</div><div class="form-grid">
<div><label>Ngày *</label><input id="cash-date" type="date" value="${esc(e?.date ?? localToday())}"></div>
<div><label>Số tiền (đồng) *</label><input id="cash-amount" type="number" min="0" step="1000" value="${e?.amount ?? ""}"></div>
<div class="full"><label>Nội dung *</label><input id="cash-content" maxlength="500" value="${esc(e?.content ?? "")}" placeholder="${thu ? "VD: Thu lãi tiền gửi" : "VD: Văn phòng phẩm quý IV"}"></div>
<div><label>${thu ? "Người nộp tiền" : "Người nhận tiền"}</label><input id="cash-party" maxlength="255" value="${esc(e?.counterparty ?? "")}"></div>
<div><label>Hình thức</label><select id="cash-method">${PAY_METHODS.map((m) => `<option${m === (e?.method ?? PAY_METHODS[0]) ? " selected" : ""}>${m}</option>`).join("")}</select></div>
<div class="full"><label>Dự án (nếu có)</label><select id="cash-project"><option value="">– Chung, không thuộc dự án –</option>${projects.map((p) => `<option value="${esc(p.id)}"${p.id === e?.projectId ? " selected" : ""}>${esc(p.id)} – ${esc(p.name)}</option>`).join("")}</select></div></div>
<div class="toolbar" style="margin-top:12px"><button class="btn btn-primary" ${jsCall("cashSave", kind, e?.id ?? "")}>${e ? "Lưu thay đổi" : "Lưu"}</button>${e ? `<button class="btn btn-light" ${jsCall("cashRemove", e.id)}>Xóa phiếu</button>` : ""}</div>`)
  }
  async function cashSave(kind: "thu" | "chi", id: string) {
    const amount = Number(value("cash-amount")) || 0
    if (!value("cash-content")) return alert("Vui lòng nhập nội dung")
    if (!(amount > 0)) return alert("Vui lòng nhập số tiền")
    try {
      await ledgerStore.saveCash(id, { kind, date: value("cash-date"), amount, content: value("cash-content"), counterparty: value("cash-party"), method: value("cash-method"), projectId: value("cash-project") })
      ctx.closeModal()
      rerender()
    } catch (e) {
      fail(e)
    }
  }
  function cashRemove(id: string) {
    if (!confirm(`Xóa phiếu ${id}?`)) return
    ledgerStore.deleteCash(id).then(() => { ctx.closeModal(); rerender() }, fail)
  }

  Object.assign(window, {
    cashForm, cashSave, cashRemove,
    debtKind: (k: "thu" | "chi") => { state.debtKind = k; state.debtFilter = ""; rerender("debts") },
    debtFilterSet: (v: string) => { state.debtFilter = v; rerender("debts") },
    debtToggleDone: (id: string, done: string) => ledgerStore.setProjectDone(id, done === "1").then(() => rerender("debts"), fail),
    ledgerMonth: (v: string) => { state.month = v; rerender() },
  })
}
