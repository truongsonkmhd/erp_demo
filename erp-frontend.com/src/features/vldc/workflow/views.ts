import { escapeHtml as esc, formatDate, formatMoney, formatTime, jsCall, statusBadge } from "./html"
import { disbursementView, projectsView, spendView } from "../data/projectView"
import {
  PAYMENT_STEPS,
  ROLE_TITLES,
  allowedActions,
  blockedReason,
  childrenOf,
  canDeleteWork,
  createPayment,
  hasPerm,
  isAtRisk,
  isClosed,
  isPendingProposal,
  isVisible,
  notificationsFor,
  ownerInbox,
  rolledUpProgress,
  type WorkAction,
} from "./rules"
import { type WorkItem, type WorkNotice } from "./types"
import { TYPE_LABELS, type DirectiveLabels } from "./directiveList"
import { workflowStore as store } from "./repository"
import { leaderDashboardHtml, type CashFigures, type OrgFigures } from "./leaderDashboard"
import { staffView } from "../data/staffView"
import { cashSummary, debtSummary } from "../data/ledgerCore"
import { performanceHtml, unitDetailHtml } from "./kpiViews"
import { kpiUnits, unitKpis } from "./kpi"
import { vldcData } from "../data/registry"
import { ROLE_PROFILES, roleUnitCode, unitName, type UnitCode } from "../data/org"
import { managesAllUnits } from "../data/access"
import { subUnitOptions } from "../data/subUnitPage"

export { escapeHtml, statusBadge } from "./html"

type Shell = { show(page: string): void; go(path: string): void; rerender(): void; openModal(title: string, html: string): void; closeModal(): void }
type Context = { role(): string; perms(): string[]; userName(): string }

let ctx: Context = { role: () => "", perms: () => [], userName: () => "" }
let shell: Shell = { show() {}, go() {}, rerender() {}, openModal() {}, closeModal() {} }

export const workflowPerms = () => ctx.perms()

export function setWorkflowContext(next: Context) {
  ctx = next
}

const ACTION_LABELS: Record<WorkAction, string> = {
  accept: "Nhận việc",
  progress: "Cập nhật tiến độ",
  submit: "Báo cáo hoàn thành",
  approve: "Duyệt đóng",
  return: "Trả lại",
  comment: "Ghi chú",
  delegate: "Tạo việc con",
  advance: "Chuyển bước tiếp",
  resubmit: "Trình lại",
  endorse: "Duyệt đề xuất",
  reject: "Từ chối",
  move: "Chuyển trạng thái",
}


const today = () => new Date().toLocaleDateString("sv-SE")
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`
const roleTitle = (role: string) => ROLE_TITLES[role] || role
const content = () => document.getElementById("content")

function riskBadge(item: WorkItem, all: WorkItem[]): string {
  return isAtRisk(item, all, today()) ? ' <span class="badge b-danger">Nguy cơ trễ</span>' : ""
}

function openButton(item: WorkItem, label = "Mở"): string {
  return `<button class="btn btn-light" ${jsCall("wfOpen", item.id)}>${label}</button>`
}

/** Names shown for role codes, tổ ids and project ids (search, export, cards). */
export const directiveLabels: DirectiveLabels = {
  role: roleTitle,
  subUnit: (id) => (id ? vldcData.get("subUnits").find((s) => s.id === id)?.name ?? "" : ""),
  project: (id) => {
    const p = id ? vldcData.get("projects").find((x) => x.id === id) : undefined
    return p ? `${p.id} – ${p.name}` : id ?? ""
  },
}


/** The role the workflow acts as and its permission codes (for the board views). */
export const workflowRole = () => ctx.role()

function paymentStepper(item: WorkItem): string {
  const step = item.step ?? 0
  return `<div class="timeline">${PAYMENT_STEPS.map((s, i) => `<div>${i < step || item.status === "Đã chi" ? "✓" : i === step ? "▶" : "○"} <b>${esc(s.label)}</b> – ${esc(roleTitle(s.owner))}</div>`).join("")}</div>`
}

/** Unit a note was written for (recorded with it; older notes fall back to the writer's unit today). */
const noteUnit = (h: { by: string; unit?: string }) => {
  const code = h.unit ?? roleUnitCode(h.by)
  return code ? unitName(code as UnitCode) : ""
}

/** "Trần Quốc Hùng – Trưởng đơn vị": the person first, then the role. */
const who = (role: string) => (personOf(role) ? `${personOf(role)} – ${roleTitle(role)}` : roleTitle(role))
/** History entries shown before "Xem tất cả". */
const HISTORY_SHOWN = 5

/**
 * The work's details: fields in a grid (label above value), its sub-tasks and actions on the left; notes on the right
 * (a payment dossier shows its processing history there instead, latest first, the older ones folded). withHeader: the page or panel already shows
 * the status and kind, so they are left out here.
 */
export function detailHtml(item: WorkItem, withHeader = false): string {
  const all = store.items()
  const role = ctx.role()
  const actions = allowedActions(item, role, ctx.perms(), all).filter((a) => a !== "delegate")
  const parent = item.parentId ? all.find((x) => x.id === item.parentId) : undefined
  const kids = all.filter((x) => x.parentId === item.id)
  const field = (label: string, value: string, full = false) => `<div${full ? ' class="full"' : ""}><span>${label}</span><b>${value}</b></div>`
  const progress = rolledUpProgress(item, all)
  const unit = directiveLabels.subUnit(item.subUnit) || (roleUnitCode(item.owner) ? unitName(roleUnitCode(item.owner) as UnitCode) : "")
  const info = [
    withHeader ? "" : field("Loại", TYPE_LABELS[item.type]),
    withHeader ? (riskBadge(item, all) ? field("Cảnh báo", riskBadge(item, all)) : "") : field("Trạng thái", statusBadge(item) + riskBadge(item, all)),
    item.type === "proposal"
      ? field("Người đề xuất", esc(who(item.createdBy))) + field("Người duyệt", esc(who(item.approver ?? "")))
      : field(item.type === "payment" ? "Người lập" : "Người giao", esc(who(item.createdBy))),
    item.type === "proposal" && isPendingProposal(item) ? "" : field(item.type === "payment" ? "Đang ở" : "Người thực hiện", esc(who(item.owner))),
    item.type === "payment" || !unit ? "" : field("Đơn vị / tổ", esc(unit)),
    field("Hạn", formatDate(item.due)),
    item.type === "payment"
      ? field("Số tiền", formatMoney(item.amount))
      : field("Tiến độ", `<span class="vx-detail-progress"><i style="width:${progress}%"></i></span>${progress}%${childrenOf(item.id, all).length ? ' <span class="mini">(theo việc con)</span>' : ""}`),
    item.complexity ? field("Độ phức tạp", esc(item.complexity)) : "",
    field("Phối hợp", item.cc.map((r) => esc(who(r))).join("<br>") || "–", true),
    item.description ? field(item.project && item.type !== "payment" ? "Kết quả / minh chứng yêu cầu" : "Mô tả", esc(item.description), true) : "",
    item.evidence ? field("Minh chứng đã nộp", esc(item.evidence), true) : "",
    parent ? field("Việc cha", `<a href="javascript:void 0" ${jsCall("wfOpen", parent.id)}>${esc(parent.id)} • ${esc(parent.title)}</a>`, true) : "",
  ].join("")
  const kidList = kids.length
    ? `<h4 style="margin-top:16px">Việc con (${kids.length})</h4>${kids.map((k) => `<div class="alert"><span class="dot ${isClosed(k) ? "green" : "blue"}"></span><div><a href="javascript:void 0" ${jsCall("wfOpen", k.id)}><b>${esc(k.title)}</b></a><div class="mini">${esc(who(k.owner))} • ${esc(k.status)}${k.type === "payment" ? "" : ` • ${rolledUpProgress(k, all)}%`}</div></div></div>`).join("")}`
    : ""
  const notes = item.history.filter((h) => h.action === "comment")
  const noteList = `<h4 style="margin-top:0">Ghi chú (${notes.length})</h4>${notes.map((h) => `<div class="vx-note"><div class="vx-note-head"><b>${esc(h.byName || personOf(h.by) || roleTitle(h.by))}</b> <span class="mini">${esc(roleTitle(h.by))}${noteUnit(h) ? ` • ${esc(noteUnit(h))}` : ""} • ${formatTime(h.at)}</span></div><div>${esc(h.note ?? "")}</div></div>`).join("") || '<div class="mini">Chưa có ghi chú.</div>'}`
  const steps = [...item.history].reverse().filter((h) => h.action !== "comment" || item.type === "payment")
    .map((h) => `<div><b>${formatTime(h.at)} • ${esc(h.byName || personOf(h.by) || roleTitle(h.by))}</b><br>${esc(ACTION_LABELS[h.action as WorkAction] || (h.action === "create" ? "Khởi tạo" : h.action))}${h.note ? `: ${esc(h.note)}` : ""}</div>`)
  const older = steps.length > HISTORY_SHOWN
    ? `<details class="vx-history-more"><summary>Xem tất cả (${steps.length})</summary><div class="timeline">${steps.slice(HISTORY_SHOWN).join("")}</div></details>`
    : ""
  // Work shows its notes only; a payment dossier keeps its processing trail.
  const history = item.type === "payment" ? `<h4 style="margin-top:16px">Lịch sử xử lý</h4><div class="timeline">${steps.slice(0, HISTORY_SHOWN).join("")}</div>${older}` : noteList
  const form = actions.length
    ? `<div class="form-grid" style="margin-top:12px">${actions.includes("progress") ? `<div><label>Tiến độ (%)</label><input id="wf-progress" type="number" min="0" max="100" value="${Number(item.progress) || 0}"></div><div><label>Minh chứng</label><input id="wf-evidence" value="${esc(item.evidence || "")}"></div>` : ""}<div class="full"><label>Ghi chú / lý do</label><textarea id="wf-note" rows="2"></textarea></div></div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${actions.map((a) => actionButton(item, a)).join("")}</div>`
    : '<div class="mini" style="margin-top:12px">Bạn chỉ có quyền xem việc này ở trạng thái hiện tại.</div>'
  const remove = canDeleteWork(item, role, all) ? `<button class="btn btn-danger" ${jsCall("wfDelete", item.id)}>Xoá việc</button>` : ""
  const blocked = blockedReason(item, role, all)
  const blockedNote = blocked ? `<div class="alert" style="margin-top:12px"><span class="dot yellow"></span><div>${esc(blocked)}</div></div>` : ""
  return `<div class="vx-detail"><div class="vx-detail-main"><div class="vx-detail-grid">${info}</div>${kidList}${blockedNote}${form}${remove ? `<div class="toolbar" style="margin-top:14px">${remove}</div>` : ""}</div><div class="vx-detail-side">${item.type === "payment" ? paymentStepper(item) : ""}${history}</div></div>`
}

/** A returned proposal is corrected on its form page; the other actions run from the note box above. */
function actionButton(item: WorkItem, a: WorkAction): string {
  if (item.type === "proposal" && a === "resubmit") return `<button class="btn btn-light" ${jsCall("go", `projects/nhiem-vu/${encodeURIComponent(item.id)}/sua`)}>Sửa nhiệm vụ</button>`
  if (item.type === "proposal" && a === "submit") return `<button class="btn btn-primary" ${jsCall("wfAct", item.id, a)}>Hoàn thành</button>`
  const handler = jsCall("wfAct", item.id, a)
  return `<button class="btn ${a === "return" || a === "reject" ? "btn-light" : "btn-primary"}" ${handler}>${ACTION_LABELS[a]}</button>`
}

function inputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | null)?.value ?? ""
}

/** Runs a change; on success closes the modal and re-renders the page, or goes where `then` says. */
export async function run(task: () => Promise<void>, onError?: () => void, then?: () => void) {
  try {
    await task()
    shell.closeModal()
    if (then) then()
    else shell.rerender()
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error))
    onError?.()
  }
}

const personOf = (r: string) => ROLE_PROFILES[r]?.name ?? ""

/** Breadcrumb levels: [label, path] for each level above, the last one (the page itself) without a path. */
export function crumbsHtml(levels: [string, string?][]): string {
  return `<nav class="vx-jira-crumbs">${levels.map(([label, path]) => path
    ? `<a href="javascript:void 0" class="vx-crumb" ${jsCall("go", path)}>${esc(label)}</a>`
    : `<span class="vx-crumb current">${esc(label)}</span>`).join('<span class="vx-crumb-sep">›</span>')}</nav>`
}

/** A select of several values: a dropdown with a checkbox per option; the closed box lists the ones picked. */
export function multiSelectHtml(name: string, options: [string, string][], selected: string[], placeholder: string): string {
  const picked = options.filter(([v]) => selected.includes(v)).map(([, l]) => l).join(", ")
  return `<details class="vx-multiselect" data-placeholder="${esc(placeholder)}"><summary>${esc(picked || placeholder)}</summary><div class="vx-multiselect-list">${options.map(([v, l]) => `<label><input type="checkbox" name="${esc(name)}" value="${esc(v)}" data-label="${esc(l)}"${selected.includes(v) ? " checked" : ""} onchange="vxMultiPick(this)">${esc(l)}</label>`).join("")}</div></details>`
}

/** Shows the picked options in the closed box. */
function vxMultiPick(input: HTMLInputElement) {
  const box = input.closest("details")
  const summary = box?.querySelector("summary")
  if (!box || !summary) return
  const picked = [...box.querySelectorAll<HTMLInputElement>("input:checked")].map((x) => x.dataset.label ?? x.value)
  summary.textContent = picked.join(", ") || box.dataset.placeholder || ""
}

// A multi-select closes when clicking elsewhere, like a select.
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    document.querySelectorAll("details.vx-multiselect[open]").forEach((d) => { if (!d.contains(e.target as Node)) d.removeAttribute("open") })
  })
}

function wfOpen(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item) return alert(`Không tìm thấy ${id}`)
  const sub = item.subUnit ? vldcData.get("subUnits").find((s) => s.id === item.subUnit) : undefined
  const project = item.project ? projectsView().find((p) => p.id === item.project) : undefined
  const where = [
    sub ? `Tổ / phòng thực hiện: <b>${esc(sub.name)}</b>` : "",
    project ? `Dự án: <a href="javascript:void 0" ${jsCall("go", `projects/${encodeURIComponent(project.id)}`)}><b>${esc(project.id)}</b></a>` : "",
  ].filter(Boolean).join(" • ")
  shell.openModal(`${TYPE_LABELS[item.type]} ${item.id}`, `<h3 style="margin-top:0">${esc(item.title)}</h3>${where ? `<div class="mini" style="margin:-6px 0 8px">${where}</div>` : ""}${detailHtml(item)}`)
}

function wfAct(id: string, action: WorkAction) {
  const progressRaw = inputValue("wf-progress")
  void run(() => store.dispatch(id, action, {
    note: inputValue("wf-note"),
    byName: ctx.userName(),
    progress: progressRaw === "" ? undefined : Number(progressRaw),
    evidence: inputValue("wf-evidence"),
  }, ctx.role(), ctx.perms()), () => {
    // A validation error keeps what was typed; a stale view (state changed elsewhere) is redrawn: the modal, or the
    // issue panel / page the action was taken from.
    const current = store.items().find((x) => x.id === id)
    if (current && allowedActions(current, ctx.role(), ctx.perms(), store.items()).includes(action)) return
    if (document.querySelector(".modal")) wfOpen(id)
    else shell.rerender()
  })
}

/** Project picker of the payment form (optional). */
function projectPicker(selected = ""): string {
  return `<div><label>Dự án</label><select id="wf-project"><option value="">– Không gắn dự án –</option>${projectsView().map((p) => `<option value="${esc(p.id)}"${p.id === selected ? " selected" : ""}>${esc(`${p.id} – ${p.name}`)}</option>`).join("")}</select></div>`
}

/** Deletes a work item (its creator only), after confirmation. */
function wfDelete(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item || !confirm(`Xoá việc ${item.id} • ${item.title}?`)) return
  void run(() => store.remove(id, ctx.role()))
}

function wfCreatePayment() {
  const all = store.items()
  const parents = all.filter((x) => x.type !== "payment" && !isClosed(x) && isVisible(x, ctx.role(), all))
  shell.openModal("Lập đề nghị thanh toán", `<div class="form-grid"><div class="full"><label>Nội dung thanh toán</label><textarea id="wf-title" rows="2"></textarea></div>${projectPicker()}<div><label>Số tiền (đồng)</label><input id="wf-amount" type="number" min="1" step="1000"></div><div><label>Hạn thanh toán</label><input id="wf-due" type="date" min="${today()}"></div><div class="full"><label>Gắn với chỉ đạo / việc (tuỳ chọn)</label><select id="wf-parent"><option value="">– Không –</option>${parents.map((p) => `<option value="${esc(p.id)}">${esc(p.id)} • ${esc(p.title)}</option>`).join("")}</select></div><div class="full"><label>Chứng từ kèm theo</label><input id="wf-desc"></div></div><div class="mini" style="margin-top:8px">Luồng duyệt: ${PAYMENT_STEPS.slice(1).map((s) => esc(roleTitle(s.owner))).join(" → ")}</div><button class="btn btn-primary" style="margin-top:10px" onclick="wfSubmitPayment()">Trình hồ sơ</button>`)
}

function wfSubmitPayment() {
  void run(async () => {
    const item = createPayment({
      id: newId("PAY"),
      title: inputValue("wf-title"),
      amount: Number(inputValue("wf-amount")),
      due: inputValue("wf-due"),
      parentId: inputValue("wf-parent") || undefined,
      description: inputValue("wf-desc") || undefined,
      project: inputValue("wf-project") || undefined,
    }, ctx.role(), ctx.perms(), new Date().toISOString())
    await store.add(item)
  })
}

/** Sample data back for the Firebase datasets; projects and work items live on the backend API and are left alone. */
function wfResetDemo() {
  if (!confirm("Xoá dữ liệu (tài chính, thiết bị, lịch...) và nạp lại dữ liệu mẫu? Dự án và công việc không bị ảnh hưởng.")) return
  void run(async () => {
    await vldcData.resetAll()
  })
}

const readKey = (role: string) => `vldc_read_${role}`

function readIds(role: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(readKey(role)) || "[]"))
  } catch {
    return new Set()
  }
}

function markRead(role: string, ...noticeIds: string[]) {
  const ids = readIds(role)
  noticeIds.forEach((id) => ids.add(id))
  try {
    localStorage.setItem(readKey(role), JSON.stringify([...ids]))
  } catch {
    // private mode: unread state just isn't remembered
  }
}

function unreadNotices(role: string) {
  const read = readIds(role)
  return notificationsFor(role, store.allItems()).filter((n) => !read.has(n.id))
}

/** The role's workflow notices with their read state, for the notification dialog (all of them, so it matches the badge). */
export function workflowNotices(role: string): (WorkNotice & { read: boolean })[] {
  const read = readIds(role)
  return notificationsFor(role, store.items()).map((n) => ({ ...n, read: read.has(n.id) }))
}

export function markWorkflowNoticesRead(role: string) {
  markRead(role, ...notificationsFor(role, store.items()).map((n) => n.id))
}

/** Counts added to the topbar badges by the engine's getShellBadges(). */
export function workflowBadges(role: string): { tasks: number; notices: number } {
  return { tasks: ownerInbox(role, store.items()).length, notices: unreadNotices(role).length }
}

function prepend(html: string) {
  content()?.insertAdjacentHTML("afterbegin", html)
}

function inboxTable(items: WorkItem[]): string {
  if (!items.length) return '<div class="mini">Không có việc nào đang chờ bạn.</div>'
  return `<table><tr><th>Mã</th><th>Loại</th><th>Nội dung</th><th>Người giao / lập</th><th>Trạng thái</th><th>Hạn</th><th></th></tr>${items.map((x) => `<tr><td><b>${esc(x.id)}</b></td><td>${TYPE_LABELS[x.type]}</td><td>${esc(x.title)}${riskBadge(x, store.items())}</td><td>${esc(roleTitle(x.createdBy))}</td><td>${statusBadge(x)}</td><td>${formatDate(x.due)}</td><td>${openButton(x, "Xử lý")}</td></tr>`).join("")}</table>`
}

function inboxBlock(limit?: number): string {
  const items = ownerInbox(ctx.role(), store.items())
  const shown = limit ? items.slice(0, limit) : items
  return `<div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Việc của tôi (luồng liên tài khoản)</h3><div class="mini">Chỉ đạo, việc được giao và hồ sơ thanh toán đang chờ bạn xử lý • đồng bộ realtime</div></div><span class="badge ${items.length ? "b-danger" : "b-ok"}">${items.length} việc</span></div>${inboxTable(shown)}${limit && items.length > limit ? `<div class="mini" style="margin-top:8px"><a href="javascript:void 0" onclick="show('action')">Xem tất cả ${items.length} việc</a></div>` : ""}</div>`
}

function noticesBlock(): string {
  const role = ctx.role()
  const read = readIds(role)
  const notices = notificationsFor(role, store.allItems()).slice(0, 30)
  const unread = notices.filter((n) => !read.has(n.id)).length
  const rows = notices.map((n) => `<div class="alert" style="cursor:pointer${read.has(n.id) ? ";opacity:.6" : ""}" ${jsCall("wfNotice", n.id, n.itemId)}><span class="dot ${read.has(n.id) ? "green" : "red"}"></span><div><b>${esc(n.title)}</b><div class="mini">${esc(n.body)} • ${formatTime(n.at)}</div></div></div>`).join("")
  return `<div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Thông báo luồng công việc</h3><div class="mini">Giao việc, báo cáo, duyệt, trả lại, chuyển bước hồ sơ</div></div><span class="badge ${unread ? "b-danger" : "b-ok"}">${unread} chưa đọc</span></div>${rows || '<div class="mini">Chưa có thông báo.</div>'}</div>`
}

function paymentsBlock(): string {
  const all = store.items()
  const role = ctx.role()
  const payments = all.filter((x) => x.type === "payment" && isVisible(x, role, all)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const canCreate = role === PAYMENT_STEPS[0].owner && hasPerm(ctx.perms(), "vldc-payments:create")
  const rows = payments.map((p) => `<tr><td><b>${esc(p.id)}</b></td><td>${esc(p.title)}</td><td>${formatMoney(p.amount)}</td><td>${esc(PAYMENT_STEPS[p.step ?? 0].label)}<div class="mini">${esc(roleTitle(p.owner))}</div></td><td>${statusBadge(p)}</td><td>${formatDate(p.due)}</td><td>${openButton(p, p.owner === role && !isClosed(p) ? "Xử lý" : "Xem")}</td></tr>`).join("")
  return `<div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Hồ sơ thanh toán liên phòng</h3><div class="mini">${PAYMENT_STEPS.map((s) => esc(roleTitle(s.owner))).join(" → ")}</div></div>${canCreate ? '<button class="btn btn-primary" onclick="wfCreatePayment()">+ Lập đề nghị thanh toán</button>' : ""}</div>${rows ? `<table><tr><th>Mã</th><th>Nội dung</th><th>Số tiền</th><th>Bước hiện tại</th><th>Trạng thái</th><th>Hạn</th><th></th></tr>${rows}</table>` : '<div class="mini">Chưa có hồ sơ trong phạm vi của bạn.</div>'}</div>`
}

function leaderStats(): string {
  const role = ctx.role()
  const all = store.items()
  const open = all.filter((x) => x.type !== "payment" && !isClosed(x))
  const risky = open.filter((x) => isAtRisk(x, all, today()))
  const pendingPayments = all.filter((x) => x.type === "payment" && x.owner === role && !isClosed(x))
  const waiting = all.filter((x) => x.createdBy === role && x.status === "Chờ duyệt")
  const box = (label: string, value: number, sub: string) => `<div class="kpi" style="cursor:pointer" onclick="show('directives')"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`
  return `<div class="grid kpis" style="margin-bottom:14px">${box("Chỉ đạo & việc đang mở", open.length, "Toàn Liên đoàn")}${box("Nguy cơ trễ", risky.length, "Cần đôn đốc")}${box("Chờ tôi duyệt", waiting.length, "Đã báo cáo hoàn thành")}${box("Hồ sơ chờ phê duyệt", pendingPayments.length, "Thanh toán liên phòng")}</div>`
}

function wfUnitKpi(unitId: string) {
  const unit = kpiUnits().find((u) => u.id === unitId)
  shell.openModal(`KPI • ${unit?.name ?? unitId}`, unitDetailHtml(unitId, store.items(), today(), subUnitOptions(unitId)))
}

/** Swaps the Command Center's hard-coded unit heatmap for the computed one. */
function commandHeatmap() {
  const map = content()?.querySelector(".heatmap")
  if (!map) return
  const cell = (v: number | null) => `<div class="score ${v == null ? "" : v >= 85 ? "good" : v >= 70 ? "watch" : "bad"}">${v == null ? "–" : `${v}%`}</div>`
  map.innerHTML = `<div class="head">Đơn vị</div><div class="head">Tiến độ</div><div class="head">Đúng hạn</div><div class="head">Chất lượng</div><div class="head">Điểm</div>${unitKpis(store.items(), today()).map((k) => `<div><a href="javascript:void 0" ${jsCall("wfUnitKpi", k.unit.id)}><b>${esc(k.unit.name)}</b></a></div>${cell(k.criteria.progress.value)}${cell(k.criteria.onTime.value)}${cell(k.criteria.quality.value)}<div class="score ${k.rating}">${k.score ?? "–"}</div>`).join("")}`
}

function wfNotice(id: string, itemId: string) {
  markRead(ctx.role(), id)
  if (store.items().some((x) => x.id === itemId)) wfOpen(itemId)
  else shell.rerender()
}

function wrap(render: Record<string, () => void>, page: string, extra: () => string) {
  const original = render[page]
  if (typeof original !== "function") return
  render[page] = function () {
    original()
    prepend(extra())
  }
}

/** Adds workflow blocks to other pages and exposes inline handlers (Giao việc lives in each project's page). */
export function installWorkflow(render: Record<string, () => void>, nextShell: Shell) {
  shell = nextShell
  wrap(render, "notifications", noticesBlock)
  wrap(render, "payments", paymentsBlock)
  // The leader gets a purpose-built dashboard instead of the stacked legacy demo blocks.
  const unitDashboard = render.dashboard
  function leaderCash(): CashFigures {
    const debts = vldcData.get("debtRecords"), entries = vldcData.get("cashEntries")
    const d = debtSummary(debts)
    const c = cashSummary(debts, entries, today().slice(0, 7))
    return { revenue: d.total + c.thuOther, contracts: d.count, thu: c.thu, thuOther: c.thuOther, thuMonth: c.thuMonth, chi: c.chi, chiMonth: c.chiMonth, remaining: d.remaining, doneOwing: d.doneOwing.length }
  }

  /** Same counts as the Phòng ban page: staff profiles, its unit cards and the active tổ/phòng. */
  function leaderOrg(): OrgFigures {
    const units = vldcData.get("orgUnits")
    return {
      staff: staffView().length, units: units.length, support: units.filter((u) => u.type === "Bộ máy giúp việc").length,
      direct: units.filter((u) => u.type === "Đơn vị trực thuộc").length, subUnits: vldcData.get("subUnits").filter((s) => s.active).length,
    }
  }

  render.dashboard = function () {
    const el = content()
    if (managesAllUnits(ctx.role()) && el) {
      el.innerHTML = leaderDashboardHtml(store.items(), { projects: projectsView(), disbursement: disbursementView(), spend: spendView(), org: leaderOrg(), risks: vldcData.get("risks"), cash: leaderCash() }, today())
      return
    }
    unitDashboard()
    prepend(inboxBlock(5))
  }
  wrap(render, "command", () => (managesAllUnits(ctx.role()) ? leaderStats() : ""))
  const command = render.command
  render.command = function () {
    command()
    if (managesAllUnits(ctx.role())) commandHeatmap()
  }
  render.performance = function () {
    const el = content()
    if (el) el.innerHTML = performanceHtml(store.items(), ctx.role(), today())
  }
  Object.assign(window, {
    wfOpen, wfAct, wfDelete, wfCreatePayment, wfSubmitPayment, wfResetDemo, wfNotice, wfUnitKpi,
    directiveDetail: wfOpen,
    vxMultiPick,
  })
}
