import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday, vnDate } from "./dates"
import { PAY_METHODS, ledgerStore, type InstallmentInput, type LedgerContract } from "./ledgerStore"
import { kpi, kpis } from "./pages"
import { projectsView } from "./projectView"

/**
 * Hợp đồng (CLM) on the backend ledger. Chuyên viên KH-TC or Kế toán creates a contract (Dự thảo); Kế toán sets the
 * instalments and confirms them (Đang thực hiện), records each receipt / payment, liquidates it when fully paid;
 * the creator records addenda; Kế toán trưởng follows every change in Lịch sử; Liên đoàn trưởng reads.
 * Buttons only appear when the backend grants the action (contract.can), and the backend checks again.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const state = { kind: "" as "" | "thu" | "chi", status: "", query: "" }
const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const num = (id: string) => Number(value(id).replace(/[.\s]/g, "")) || 0
const money = (n: number) => `${Math.round(n).toLocaleString("vi-VN")} đ`
const date = (d: string | null) => (d ? vnDate(d) : "–")
const badge = (text: string, cls: string) => `<span class="badge ${cls}">${esc(text)}</span>`
const STATUS_CLS: Record<string, string> = { "Dự thảo": "b-warn", "Đang thực hiện": "b-info", "Đã thanh lý": "b-ok" }
const kindBadge = (k: string) => (k === "thu" ? badge("Thu", "b-ok") : badge("Chi", "b-purple"))
const fail = (e: unknown) => alert((e as Error).message || "Thao tác không thành công")
const projectName = (id: string | null) => (id ? projectsView().find((p) => p.id === id)?.name ?? id : "–")

export function installContractPage(render: Record<string, () => void>, ctx: Ctx) {
  function rerender() {
    const el = content()
    if (el && location.pathname.endsWith("/contracts")) el.innerHTML = pageHtml()
  }

  function pageHtml(): string {
    const all = ledgerStore.contracts()
    const live = all.filter((c) => c.status !== "Dự thảo")
    const sum = (rows: LedgerContract[], pick: (c: LedgerContract) => number) => rows.reduce((s, c) => s + pick(c), 0)
    const thu = live.filter((c) => c.kind === "thu"), chi = live.filter((c) => c.kind === "chi")
    const q = state.query.trim().toLowerCase()
    const rows = all
      .filter((c) => (!state.kind || c.kind === state.kind) && (!state.status || c.status === state.status))
      .filter((c) => !q || `${c.contractNo} ${c.party} ${c.content} ${c.projectId ?? ""} ${projectName(c.projectId)}`.toLowerCase().includes(q))
    const body = rows.map((c) => `<tr class="vx-staff-row" ${jsCall("contractDetail", c.id)}><td><b>${esc(c.contractNo)}</b><div class="mini">${kindBadge(c.kind)}</div></td>
<td>${esc(c.party)}<div class="mini">${esc(c.content)}</div></td><td class="mini">${esc(projectName(c.projectId))}</td>
<td class="vx-ld-num">${money(c.value)}</td><td class="vx-ld-num">${money(c.paid)}</td><td class="vx-ld-num"><b>${money(c.remaining)}</b></td>
<td class="mini">${c.nextDueName ? `${esc(c.nextDueName)}<br>${date(c.nextDueDate)}` : "–"}${c.overdue ? `<br>${badge(`Quá hạn ${money(c.overdue)}`, "b-danger")}` : ""}</td>
<td>${badge(c.status, STATUS_CLS[c.status] ?? "b-info")}${c.status !== "Dự thảo" && !c.scheduleMatches ? `<br>${badge("Lịch chưa khớp", "b-warn")}` : ""}${c.status === "Dự thảo" && !c.installments.length ? `<br><span class="mini">Chờ Kế toán lập lịch</span>` : ""}</td></tr>`).join("")
    const tab = (k: "" | "thu" | "chi", label: string) => `<button class="vx-news-chip${state.kind === k ? " active" : ""}" ${jsCall("contractFilter", "kind", k)}>${label}</button>`
    return `${kpis(
      kpi("Hợp đồng thu", thu.length, `Giá trị ${money(sum(thu, (c) => c.value))}`),
      kpi("Còn phải thu", money(sum(thu, (c) => c.remaining)), sum(thu, (c) => c.overdue) ? `Quá hạn ${money(sum(thu, (c) => c.overdue))}` : "Không có đợt quá hạn"),
      kpi("Hợp đồng chi", chi.length, `Giá trị ${money(sum(chi, (c) => c.value))}`),
      kpi("Còn phải trả", money(sum(chi, (c) => c.remaining)), sum(chi, (c) => c.overdue) ? `Quá hạn ${money(sum(chi, (c) => c.overdue))}` : "Không có đợt quá hạn"),
    )}<div class="card" style="margin-top:14px"><div class="card-head"><div class="toolbar">${tab("", "Tất cả")}${tab("thu", "Hợp đồng thu")}${tab("chi", "Hợp đồng chi")}
<select onchange="contractFilter('status', this.value)" style="width:auto">${["", "Dự thảo", "Đang thực hiện", "Đã thanh lý"].map((s) => `<option value="${s}"${s === state.status ? " selected" : ""}>${s || "Mọi trạng thái"}</option>`).join("")}</select>
<input placeholder="Tìm số HĐ, đối tác, dự án…" value="${esc(state.query)}" onchange="contractFilter('query', this.value)" style="width:240px"></div>
${ledgerStore.canCreate() ? `<button class="btn btn-primary" ${jsCall("contractForm", "")}>+ Hợp đồng</button>` : ""}</div>
<div class="vx-staff-table"><table><tr><th>Số HĐ</th><th>Đối tác / nội dung</th><th>Dự án</th><th>Giá trị</th><th>Đã thanh toán</th><th>Còn lại</th><th>Đợt tới</th><th>Trạng thái</th></tr>
${body || '<tr><td colspan="8" class="mini">Chưa có hợp đồng.</td></tr>'}</table></div>
<div class="mini" style="margin-top:8px">Chuyên viên KH-TC / Kế toán tạo hợp đồng → Kế toán lập lịch thanh toán và xác nhận → ghi nhận từng lần thu / chi → thanh lý. Mọi thay đổi được ghi vào lịch sử hợp đồng.</div></div>`
  }

  render.contracts = () => {
    void ledgerStore.start().then(rerender)
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }

  // ---------- Detail
  function contractDetail(idOrNo: string) {
    const c = ledgerStore.find(idOrNo)
    if (!c) return alert("Không tìm thấy hợp đồng hoặc bạn không có quyền xem")
    const today = localToday()
    const verb = c.kind === "thu" ? "thu" : "chi"
    const actions = [
      c.can.editInfo ? `<button class="btn btn-light" ${jsCall("contractForm", c.id)}>Sửa thông tin</button>` : "",
      c.can.addendum ? `<button class="btn btn-light" ${jsCall("contractAddendumForm", c.id)}>Phụ lục (đổi giá trị)</button>` : "",
      c.can.editSchedule ? `<button class="btn ${c.installments.length ? "btn-light" : "btn-primary"}" ${jsCall("contractScheduleForm", c.id)}>${c.installments.length ? "Sửa lịch thanh toán" : "Lập lịch thanh toán"}</button>` : "",
      c.can.confirm ? `<button class="btn btn-primary" ${jsCall("contractConfirm", c.id)}>Xác nhận lịch → Đang thực hiện</button>` : "",
      c.can.liquidate ? `<button class="btn btn-ok" ${jsCall("contractLiquidate", c.id)}>Thanh lý hợp đồng</button>` : "",
      c.can.delete ? `<button class="btn btn-light" ${jsCall("contractDelete", c.id)}>Xóa dự thảo</button>` : "",
    ].join("")
    const installments = c.installments.map((i) => {
      const st = i.locked ? badge("Đã đủ 🔒", "b-ok") : i.overdue ? badge("Quá hạn", "b-danger") : i.paid > 0 ? badge("Thanh toán một phần", "b-warn") : badge(i.dueDate && i.dueDate < today ? "Đến hạn" : "Chưa đến hạn", "b-info")
      const rec = c.can.record && i.remaining > 0 ? `<button class="btn btn-light" ${jsCall("contractPaymentForm", c.id, i.id)}>Ghi nhận ${verb}</button>` : ""
      return `<tr><td><b>${esc(i.name)}</b>${i.condition ? `<div class="mini">${esc(i.condition)}</div>` : ""}</td><td>${date(i.dueDate)}</td><td class="vx-ld-num">${money(i.amount)}</td><td class="vx-ld-num">${money(i.paid)}</td><td class="vx-ld-num"><b>${money(i.remaining)}</b></td><td>${st}</td><td>${rec}</td></tr>`
    }).join("")
    const payments = [...c.payments].sort((a, b) => b.date.localeCompare(a.date)).map((p) => `<tr><td>${date(p.date)}</td><td>${esc(p.installmentName)}</td><td class="vx-ld-num"><b>${money(p.amount)}</b></td><td>${esc(p.method)}</td><td class="mini">${esc(p.note ?? "")}</td><td class="mini">${esc(p.recordedBy ?? "")}</td><td>${c.can.deletePayment ? `<button class="btn btn-light" ${jsCall("contractDeletePayment", c.id, p.id)}>Hủy</button>` : ""}</td></tr>`).join("")
    const history = [...c.history].reverse().map((h) => `<div><b>${esc(h.at.replace("T", " ").slice(0, 16))} • ${esc(h.by)}</b> – ${esc(h.action)}${h.detail ? `<div class="mini">${esc(h.detail)}</div>` : ""}</div>`).join("")
    const mismatch = c.status !== "Dự thảo" && !c.scheduleMatches
      ? `<div class="alert"><span class="dot yellow"></span><div><b>Lịch thanh toán chưa khớp giá trị hợp đồng</b><div class="mini">Tổng các đợt ${money(c.scheduleTotal)} ≠ giá trị ${money(c.value)} (sau phụ lục). Kế toán cần điều chỉnh các đợt chưa thanh toán.</div></div></div>` : ""
    ctx.openModal(`Hợp đồng ${c.contractNo}`, `<div class="vx-news-badges">${kindBadge(c.kind)}${badge(c.status, STATUS_CLS[c.status] ?? "b-info")}</div>
<h3 style="margin:8px 0 2px">${esc(c.party)}</h3><div class="mini">${esc(c.content)}</div>
<div class="mini" style="margin-top:4px">Dự án: <b>${esc(projectName(c.projectId))}</b> • Ký ${date(c.signedDate)} • Hết hạn ${date(c.endDate)} • Người tạo ${esc(c.createdByName ?? "–")}</div>
<div class="vx-pj-tiles"><div><span>Giá trị hợp đồng</span><b>${money(c.value)}</b></div><div><span>Đã ${verb}</span><b>${money(c.paid)}</b></div><div><span>Còn phải ${verb}</span><b>${money(c.remaining)}</b></div><div><span>Quá hạn</span><b${c.overdue ? ' style="color:var(--danger)"' : ""}>${money(c.overdue)}</b></div></div>
${mismatch}${actions ? `<div class="toolbar" style="margin:10px 0">${actions}</div>` : ""}
<h4>Lịch thanh toán (${c.installments.length} đợt • tổng ${money(c.scheduleTotal)})</h4>
<div class="vx-staff-table"><table><tr><th>Đợt</th><th>Hạn</th><th>Số tiền</th><th>Đã ${verb}</th><th>Còn lại</th><th>Tình trạng</th><th></th></tr>${installments || `<tr><td colspan="7" class="mini">Chưa có lịch thanh toán${c.status === "Dự thảo" ? " – chờ Kế toán lập" : ""}.</td></tr>`}</table></div>
<h4 style="margin-top:12px">Các lần ${verb}</h4>
<div class="vx-staff-table"><table><tr><th>Ngày</th><th>Đợt</th><th>Số tiền</th><th>Hình thức</th><th>Ghi chú</th><th>Người ghi</th><th></th></tr>${payments || `<tr><td colspan="7" class="mini">Chưa có lần ${verb} nào.</td></tr>`}</table></div>
<h4 style="margin-top:12px">Lịch sử</h4><div class="timeline">${history || '<div class="mini">Chưa có.</div>'}</div>`)
  }

  const reopen = (id: string) => () => { rerender(); contractDetail(id) }

  // ---------- Contract form (create / edit)
  function contractForm(id: string) {
    const c = id ? ledgerStore.find(id) : undefined
    if (c ? !c.can.editInfo : !ledgerStore.canCreate()) return
    const draft = !c || c.status === "Dự thảo"
    const projects = projectsView()
    ctx.openModal(c ? `Sửa hợp đồng ${c.contractNo}` : "Tạo hợp đồng (dự thảo)", `<div class="form-grid">
<div><label>Số hợp đồng *</label><input id="ct-no" maxlength="100" value="${esc(c?.contractNo ?? "")}" placeholder="VD: HĐ-2026-060"></div>
<div><label>Loại</label><select id="ct-kind"${draft ? "" : " disabled"}><option value="thu"${c?.kind === "chi" ? "" : " selected"}>Hợp đồng thu (khách hàng trả)</option><option value="chi"${c?.kind === "chi" ? " selected" : ""}>Hợp đồng chi (trả nhà cung cấp)</option></select></div>
<div class="full"><label>Dự án *</label><select id="ct-project"><option value="">– Chọn dự án –</option>${projects.map((p) => `<option value="${esc(p.id)}"${p.id === c?.projectId ? " selected" : ""}>${esc(p.id)} – ${esc(p.name)}</option>`).join("")}</select></div>
<div class="full"><label>Đối tác *</label><input id="ct-party" maxlength="255" value="${esc(c?.party ?? "")}"></div>
<div class="full"><label>Nội dung</label><textarea id="ct-content" rows="2">${esc(c?.content ?? "")}</textarea></div>
<div><label>Giá trị hợp đồng (đồng) *</label><input id="ct-value" type="number" min="0" step="1000" value="${c?.value ?? ""}"${draft ? "" : " disabled"}>${draft ? "" : '<div class="mini">Đổi giá trị qua "Phụ lục".</div>'}</div>
<div><label>Ngày ký</label><input id="ct-signed" type="date" value="${esc(c?.signedDate ?? "")}"></div>
<div><label>Ngày hết hạn</label><input id="ct-end" type="date" value="${esc(c?.endDate ?? "")}"></div></div>
${c ? "" : '<div class="mini" style="margin-top:8px">Sau khi tạo, Kế toán lập lịch thanh toán (các đợt) và xác nhận để hợp đồng chuyển sang Đang thực hiện.</div>'}
<button class="btn btn-primary" style="margin-top:12px" ${jsCall("contractSave", c?.id ?? "")}>${c ? "Lưu thay đổi" : "Tạo hợp đồng"}</button>`)
  }

  async function contractSave(id: string) {
    const c = id ? ledgerStore.find(id) : undefined
    const input = {
      contractNo: value("ct-no"), kind: (value("ct-kind") || c?.kind || "thu") as "thu" | "chi", projectId: value("ct-project"), party: value("ct-party"),
      content: value("ct-content"), value: c && c.status !== "Dự thảo" ? c.value : num("ct-value"), signedDate: value("ct-signed"), endDate: value("ct-end"),
    }
    if (!input.contractNo) return alert("Vui lòng nhập số hợp đồng")
    if (!input.projectId) return alert("Vui lòng chọn dự án")
    if (!input.party) return alert("Vui lòng nhập đối tác")
    if (!(input.value > 0)) return alert("Vui lòng nhập giá trị hợp đồng")
    try {
      const newId = id ? (await ledgerStore.updateInfo(id, input), id) : await ledgerStore.create(input)
      ctx.closeModal()
      reopen(newId)()
    } catch (e) {
      fail(e)
    }
  }

  // ---------- Schedule editor (Kế toán)
  const instRow = (i?: { id?: string; name: string; amount: number; dueDate: string | null; condition: string | null; paid?: number; locked?: boolean }) => {
    const paid = i?.paid ?? 0
    const locked = !!i?.locked
    return `<tr data-id="${esc(i?.id ?? "")}" data-paid="${paid}"><td><input class="cs-name" value="${esc(i?.name ?? "")}"${locked ? " disabled" : ""}></td>
<td><input class="cs-amount" type="number" min="0" step="1000" value="${i?.amount ?? ""}" oninput="contractScheduleCalc()"${locked ? " disabled" : ""}></td>
<td><input class="cs-due" type="date" value="${esc(i?.dueDate ?? "")}"${locked ? " disabled" : ""}></td><td><input class="cs-cond" value="${esc(i?.condition ?? "")}" placeholder="VD: sau nghiệm thu"${locked ? " disabled" : ""}></td>
<td class="mini">${locked ? "🔒 đã đủ" : paid ? `đã TT ${money(paid)}` : ""}</td><td>${paid ? "" : `<button class="btn btn-light" onclick="this.closest('tr').remove();contractScheduleCalc()">×</button>`}</td></tr>`
  }
  function contractScheduleForm(id: string) {
    const c = ledgerStore.find(id)
    if (!c || !c.can.editSchedule) return
    const rows = c.installments.length ? c.installments.map((i) => instRow(i)).join("") : instRow({ name: "Đợt 1 – tạm ứng", amount: 0, dueDate: null, condition: null })
    ctx.openModal(`Lịch thanh toán • ${c.contractNo}`, `<div class="mini" style="margin-bottom:8px">Giá trị hợp đồng <b>${money(c.value)}</b>. Đợt đã thanh toán đủ bị khóa; đợt đã thanh toán một phần không thể nhỏ hơn số đã trả và không xóa được.</div>
<div class="vx-staff-table"><table id="cs-table" class="vx-pj-form"><thead><tr><th>Tên đợt *</th><th>Số tiền (đồng) *</th><th>Hạn</th><th>Điều kiện</th><th></th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
<button class="btn btn-light" onclick="contractScheduleAdd()">+ Thêm đợt</button>
<div id="cs-total" class="vx-pj-tiles" style="margin-top:10px" data-value="${c.value}"></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("contractScheduleSave", c.id)}>Lưu lịch thanh toán</button>`)
    contractScheduleCalc()
  }
  function contractScheduleCalc() {
    const box = document.getElementById("cs-total")
    if (!box) return
    const target = Number(box.dataset.value) || 0
    const total = [...document.querySelectorAll<HTMLInputElement>("#cs-table .cs-amount")].reduce((s, el) => s + (Number(el.value) || 0), 0)
    const diff = target - total
    box.innerHTML = `<div><span>Tổng các đợt</span><b>${money(total)}</b></div><div><span>Giá trị hợp đồng</span><b>${money(target)}</b></div><div><span>${diff === 0 ? "Khớp" : diff > 0 ? "Còn thiếu" : "Vượt"}</span><b${diff ? ' style="color:var(--danger)"' : ' style="color:var(--ok)"'}>${diff === 0 ? "✓" : money(Math.abs(diff))}</b></div>`
  }
  async function contractScheduleSave(id: string) {
    const items: InstallmentInput[] = [...document.querySelectorAll<HTMLTableRowElement>("#cs-table tbody tr")].map((tr) => ({
      ...(tr.dataset.id ? { id: tr.dataset.id } : {}),
      name: (tr.querySelector(".cs-name") as HTMLInputElement).value.trim(),
      amount: Number((tr.querySelector(".cs-amount") as HTMLInputElement).value) || 0,
      dueDate: (tr.querySelector(".cs-due") as HTMLInputElement).value,
      condition: (tr.querySelector(".cs-cond") as HTMLInputElement).value.trim(),
    }))
    if (!items.length) return alert("Cần ít nhất một đợt")
    const bad = items.findIndex((i) => !i.name || !(i.amount > 0))
    if (bad >= 0) return alert(`Đợt thứ ${bad + 1}: vui lòng nhập tên và số tiền`)
    try {
      await ledgerStore.setSchedule(id, items)
      ctx.closeModal()
      reopen(id)()
    } catch (e) {
      fail(e)
    }
  }

  // ---------- Payments (Kế toán)
  function contractPaymentForm(id: string, installmentId: string) {
    const c = ledgerStore.find(id)
    if (!c || !c.can.record) return
    const open = c.installments.filter((i) => i.remaining > 0)
    const first = open.find((i) => i.id === installmentId) ?? open[0]
    if (!first) return alert("Tất cả các đợt đã thanh toán đủ")
    const verb = c.kind === "thu" ? "thu" : "chi"
    ctx.openModal(`Ghi nhận ${verb} • ${c.contractNo}`, `<div class="form-grid">
<div class="full"><label>Đợt</label><select id="cp-inst" onchange="document.getElementById('cp-amount').value=this.selectedOptions[0].dataset.remaining">${open.map((i) => `<option value="${esc(i.id)}" data-remaining="${i.remaining}"${i.id === first.id ? " selected" : ""}>${esc(i.name)} – còn ${money(i.remaining)}</option>`).join("")}</select></div>
<div><label>Ngày ${verb} *</label><input id="cp-date" type="date" value="${localToday()}"></div>
<div><label>Số tiền (đồng) *</label><input id="cp-amount" type="number" min="0" step="1000" value="${first.remaining}"></div>
<div><label>Hình thức</label><select id="cp-method">${PAY_METHODS.map((m) => `<option>${m}</option>`).join("")}</select></div>
<div><label>Ghi chú</label><input id="cp-note" maxlength="500"></div></div>
<button class="btn btn-primary" style="margin-top:12px" ${jsCall("contractPaymentSave", c.id)}>Ghi nhận</button>`)
  }
  async function contractPaymentSave(id: string) {
    try {
      await ledgerStore.recordPayment(id, { installmentId: value("cp-inst"), date: value("cp-date"), amount: num("cp-amount"), method: value("cp-method"), note: value("cp-note") })
      ctx.closeModal()
      reopen(id)()
    } catch (e) {
      fail(e)
    }
  }
  function contractDeletePayment(id: string, paymentId: string) {
    if (!confirm("Hủy lần thanh toán này? Việc hủy được ghi vào lịch sử hợp đồng.")) return
    ledgerStore.deletePayment(id, paymentId).then(reopen(id), fail)
  }

  // ---------- Addendum, confirm, liquidate, delete
  function contractAddendumForm(id: string) {
    const c = ledgerStore.find(id)
    if (!c || !c.can.addendum) return
    ctx.openModal(`Phụ lục • ${c.contractNo}`, `<div class="mini" style="margin-bottom:8px">Giá trị hiện tại ${money(c.value)} • đã thanh toán ${money(c.paid)}. Sau phụ lục, Kế toán điều chỉnh các đợt chưa thanh toán cho khớp.</div>
<div class="form-grid"><div><label>Giá trị mới (đồng) *</label><input id="ca-value" type="number" min="0" step="1000" value="${c.value}"></div>
<div class="full"><label>Nội dung phụ lục *</label><textarea id="ca-note" rows="2" placeholder="Số phụ lục, lý do điều chỉnh…"></textarea></div></div>
<button class="btn btn-primary" style="margin-top:12px" ${jsCall("contractAddendumSave", c.id)}>Lưu phụ lục</button>`)
  }
  async function contractAddendumSave(id: string) {
    try {
      await ledgerStore.addendum(id, num("ca-value"), value("ca-note"))
      ctx.closeModal()
      reopen(id)()
    } catch (e) {
      fail(e)
    }
  }
  function contractConfirm(id: string) {
    if (!confirm("Xác nhận lịch thanh toán? Hợp đồng chuyển sang Đang thực hiện và bắt đầu tính công nợ, cảnh báo đến hạn.")) return
    ledgerStore.confirm(id).then(reopen(id), fail)
  }
  function contractLiquidate(id: string) {
    if (!confirm("Thanh lý hợp đồng? Sau thanh lý không ghi nhận thêm thu / chi.")) return
    ledgerStore.liquidate(id).then(reopen(id), fail)
  }
  function contractDelete(id: string) {
    const c = ledgerStore.find(id)
    if (!c || !confirm(`Xóa hợp đồng dự thảo ${c.contractNo}?`)) return
    ledgerStore.remove(id).then(() => { ctx.closeModal(); rerender() }, fail)
  }

  Object.assign(window, {
    contractDetail, contractForm, contractSave, contractScheduleForm, contractScheduleCalc, contractScheduleSave,
    contractPaymentForm, contractPaymentSave, contractDeletePayment, contractAddendumForm, contractAddendumSave,
    contractConfirm, contractLiquidate, contractDelete,
    contractScheduleAdd: () => {
      document.querySelector("#cs-table tbody")?.insertAdjacentHTML("beforeend", instRow())
      contractScheduleCalc()
    },
    contractFilter: (key: "kind" | "status" | "query", v: string) => {
      if (key === "kind") state.kind = v as "" | "thu" | "chi"
      else state[key] = v
      rerender()
    },
  })
}
