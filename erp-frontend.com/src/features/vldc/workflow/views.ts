import { escapeHtml as esc, formatDate, formatMoney, formatTime, jsCall, statusBadge } from "./html"
import { projectsView } from "../data/projectView"
import {
  DELEGATES,
  PAYMENT_STEPS,
  ROLE_TITLES,
  allowedActions,
  blockedReason,
  childrenOf,
  createDirective,
  createPayment,
  hasPerm,
  isAtRisk,
  isClosed,
  isVisible,
  notificationsFor,
  ownerInbox,
  rolledUpProgress,
  type WorkAction,
} from "./rules"
import type { WorkItem } from "./types"
import { workflowStore as store } from "./repository"
import { leaderDashboardHtml, type CashFigures } from "./leaderDashboard"
import { cashSummary, debtSummary } from "../data/ledgerCore"
import { performanceHtml, unitDetailHtml } from "./kpiViews"
import { kpiUnits, unitKpis } from "./kpi"
import { vldcData } from "../data/registry"
import { roleUnitCode, rolesOfUnit } from "../data/org"
import { subUnitOptions } from "../data/subUnitPage"
import { liveAlerts } from "../data/liveAlerts"

export { escapeHtml, statusBadge } from "./html"

type Shell = { show(page: string): void; openModal(title: string, html: string): void; closeModal(): void }
type Context = { role(): string; perms(): string[]; userName(): string }

let ctx: Context = { role: () => "", perms: () => [], userName: () => "" }
let shell: Shell = { show() {}, openModal() {}, closeModal() {} }

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
  comment: "Bình luận",
  delegate: "Giao việc con",
  advance: "Chuyển bước tiếp",
  resubmit: "Trình lại",
}

const TYPE_LABELS: Record<WorkItem["type"], string> = { directive: "Chỉ đạo", task: "Việc được giao", payment: "Hồ sơ thanh toán" }

const today = () => new Date().toLocaleDateString("sv-SE")
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`
const roleTitle = (role: string) => ROLE_TITLES[role] || role
const currentPage = () => window.location.pathname.split("/").filter(Boolean).pop() || "dashboard"
const content = () => document.getElementById("content")

function riskBadge(item: WorkItem, all: WorkItem[]): string {
  return isAtRisk(item, all, today()) ? ' <span class="badge b-danger">Nguy cơ trễ</span>' : ""
}

function progressBar(value: number): string {
  return `<div class="progress" style="margin:4px 0"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div><span class="mini">${value}%</span>`
}

/** Strip shown when Firestore is unreachable and data is browser-local. */
export function offlineBanner(): string {
  return store.mode() === "offline" || vldcData.offline()
    ? '<div class="alert" style="margin-bottom:12px"><span class="dot yellow"></span><div><b>Đang chạy chế độ offline</b><div class="mini">Dữ liệu chỉ có trên máy này.</div></div></div>'
    : ""
}

function openButton(item: WorkItem, label = "Mở"): string {
  return `<button class="btn btn-light" ${jsCall("wfOpen", item.id)}>${label}</button>`
}

function workCard(item: WorkItem, all: WorkItem[]): string {
  return `<div class="directive-item">${statusBadge(item)}${riskBadge(item, all)}<h5>${esc(item.id)} • ${esc(item.title)}</h5><div class="directive-meta">${esc(roleTitle(item.owner))} • Hạn ${formatDate(item.due)}</div>${item.type === "payment" ? "" : progressBar(rolledUpProgress(item, all))}${openButton(item)}</div>`
}

function column(title: string, items: WorkItem[], all: WorkItem[]): string {
  return `<div class="directive-col"><h4>${title}</h4>${items.map((x) => workCard(x, all)).join("") || '<div class="mini">Không có.</div>'}</div>`
}

function treeRows(roots: WorkItem[], visible: WorkItem[], all: WorkItem[], depth = 0): string {
  return roots.map((item) => {
    const kids = visible.filter((x) => x.parentId === item.id && x.type !== "payment")
    const indent = depth ? `<span class="mini" style="padding-left:${depth * 18}px">↳ </span>` : ""
    return `<tr><td><b>${esc(item.id)}</b></td><td>${indent}${esc(item.title)}${riskBadge(item, all)}</td><td>${esc(roleTitle(item.createdBy))}</td><td>${esc(roleTitle(item.owner))}</td><td>${item.cc.map((r) => esc(roleTitle(r))).join(", ")}</td><td>${statusBadge(item)}</td><td style="min-width:110px">${progressBar(rolledUpProgress(item, all))}</td><td>${formatDate(item.due)}</td><td>${openButton(item)}</td></tr>`
      + treeRows(kids, visible, all, depth + 1)
  }).join("")
}

function renderDirectives() {
  const all = store.items()
  const role = ctx.role()
  const perms = ctx.perms()
  const visible = all.filter((x) => x.type !== "payment" && isVisible(x, role, all))
  const roots = visible.filter((x) => !x.parentId || !visible.some((p) => p.id === x.parentId)).sort((a, b) => a.due.localeCompare(b.due))
  const open = visible.filter((x) => !isClosed(x))
  const atRisk = open.filter((x) => isAtRisk(x, all, today()))
  const waiting = visible.filter((x) => x.createdBy === role && x.status === "Chờ duyệt")
  const mine = ownerInbox(role, all).filter((x) => x.type !== "payment")
  const canCreate = role === "lanhdao" && hasPerm(perms, "vldc-directives:create")
  const canReset = role === "lanhdao" || perms.includes("*")
  const el = content()
  if (!el) return
  el.innerHTML = `${offlineBanner()}<div class="grid kpis"><div class="kpi"><div class="label">Đang mở</div><div class="value">${open.length}</div><div class="sub">Chỉ đạo & việc liên quan</div></div><div class="kpi"><div class="label">Nguy cơ trễ</div><div class="value">${atRisk.length}</div><div class="sub">≤ 2 ngày, &lt; 80%</div></div><div class="kpi"><div class="label">Chờ tôi duyệt</div><div class="value">${waiting.length}</div><div class="sub">Đã báo cáo hoàn thành</div></div><div class="kpi"><div class="label">Hoàn thành</div><div class="value">${visible.length - open.length}</div><div class="sub">Đã duyệt đóng</div></div></div>
 <div class="card" style="margin-top:14px"><div class="card-head"><div><h3>Chỉ đạo điều hành</h3><div class="mini">Giao việc theo cấp, theo dõi tiến độ cuộn lên và duyệt kết quả</div></div><div>${canReset ? '<button class="btn btn-light" onclick="wfResetDemo()">Đặt lại dữ liệu demo</button> ' : ""}${canCreate ? '<button class="btn btn-primary" onclick="wfCreateDirective()">+ Giao chỉ đạo</button>' : ""}</div></div>
 <div class="directive-board">${column("Tôi cần xử lý", mine, all)}${column("Chờ tôi duyệt", waiting, all)}${column("Nguy cơ trễ", atRisk, all)}</div></div>
 <div class="card" style="margin-top:14px"><h3>Cây chỉ đạo – việc được giao</h3><table><tr><th>Mã</th><th>Nội dung</th><th>Người giao</th><th>Chủ trì</th><th>Phối hợp</th><th>Trạng thái</th><th>Tiến độ</th><th>Hạn</th><th></th></tr>${treeRows(roots, visible, all) || '<tr><td colspan="9" class="mini">Chưa có việc nào trong phạm vi của bạn.</td></tr>'}</table></div>`
}

function paymentStepper(item: WorkItem): string {
  const step = item.step ?? 0
  return `<div class="timeline">${PAYMENT_STEPS.map((s, i) => `<div>${i < step || item.status === "Đã chi" ? "✓" : i === step ? "▶" : "○"} <b>${esc(s.label)}</b> – ${esc(roleTitle(s.owner))}</div>`).join("")}</div>`
}

function detailHtml(item: WorkItem): string {
  const all = store.items()
  const role = ctx.role()
  const actions = allowedActions(item, role, ctx.perms(), all)
  const parent = item.parentId ? all.find((x) => x.id === item.parentId) : undefined
  const kids = all.filter((x) => x.parentId === item.id)
  const metric = (label: string, value: string) => `<div class="metric"><span>${label}</span><b>${value}</b></div>`
  const info = [
    metric("Loại", TYPE_LABELS[item.type]),
    metric("Trạng thái", statusBadge(item) + riskBadge(item, all)),
    metric("Người giao / lập", esc(roleTitle(item.createdBy))),
    metric(item.type === "payment" ? "Đang ở" : "Chủ trì", esc(roleTitle(item.owner))),
    metric("Phối hợp", item.cc.map((r) => esc(roleTitle(r))).join(", ") || "–"),
    metric("Hạn", formatDate(item.due)),
    item.type === "payment" ? metric("Số tiền", formatMoney(item.amount)) : metric("Tiến độ", `${rolledUpProgress(item, all)}%${childrenOf(item.id, all).length ? " (cuộn từ việc con)" : ""}`),
    item.evidence ? metric("Minh chứng", esc(item.evidence)) : "",
    parent ? metric("Việc cha", `<a href="javascript:void 0" ${jsCall("wfOpen", parent.id)}>${esc(parent.id)} • ${esc(parent.title)}</a>`) : "",
    item.description ? `<p>${esc(item.description)}</p>` : "",
  ].join("")
  const kidList = kids.length
    ? `<h4 style="margin-top:12px">Việc con / hồ sơ liên quan</h4>${kids.map((k) => `<div class="alert"><span class="dot ${isClosed(k) ? "green" : "blue"}"></span><div><a href="javascript:void 0" ${jsCall("wfOpen", k.id)}><b>${esc(k.id)}</b> • ${esc(k.title)}</a><div class="mini">${esc(roleTitle(k.owner))} • ${esc(k.status)}${k.type === "payment" ? "" : ` • ${rolledUpProgress(k, all)}%`}</div></div></div>`).join("")}`
    : ""
  const history = `<h4 style="margin-top:12px">Lịch sử xử lý</h4><div class="timeline">${[...item.history].reverse().map((h) => `<div><b>${formatTime(h.at)} • ${esc(roleTitle(h.by))}</b><br>${esc(ACTION_LABELS[h.action as WorkAction] || (h.action === "create" ? "Khởi tạo" : h.action))}${h.note ? `: ${esc(h.note)}` : ""}</div>`).join("")}</div>`
  const form = actions.length
    ? `<div class="form-grid" style="margin-top:12px">${actions.includes("progress") ? `<div><label>Tiến độ (%)</label><input id="wf-progress" type="number" min="0" max="100" value="${Number(item.progress) || 0}"></div><div><label>Minh chứng</label><input id="wf-evidence" value="${esc(item.evidence || "")}"></div>` : ""}<div class="full"><label>Ghi chú / lý do / bình luận</label><textarea id="wf-note" rows="2"></textarea></div></div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${actions.map((a) => `<button class="btn ${a === "return" ? "btn-light" : "btn-primary"}" ${a === "delegate" ? jsCall("wfDelegate", item.id) : jsCall("wfAct", item.id, a)}>${ACTION_LABELS[a]}</button>`).join("")}</div>`
    : '<div class="mini" style="margin-top:12px">Bạn chỉ có quyền xem việc này ở trạng thái hiện tại.</div>'
  const blocked = blockedReason(item, role, all)
  const blockedNote = blocked ? `<div class="alert" style="margin-top:12px"><span class="dot yellow"></span><div>${esc(blocked)}</div></div>` : ""
  return `<div class="grid twoeq"><div>${info}${kidList}${blockedNote}</div><div>${item.type === "payment" ? paymentStepper(item) : ""}${history}</div></div>${form}`
}

function inputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | null)?.value ?? ""
}

function checkedValues(name: string): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)).map((x) => x.value)
}

async function run(task: () => Promise<void>, onError?: () => void) {
  try {
    await task()
    shell.closeModal()
    shell.show(currentPage())
  } catch (error) {
    alert(error instanceof Error ? error.message : String(error))
    onError?.()
  }
}

function roleOptions(roles: string[], selected = ""): string {
  return roles.map((r) => `<option value="${r}"${r === selected ? " selected" : ""}>${esc(roleTitle(r))}</option>`).join("")
}

function ccBoxes(roles: string[]): string {
  return `<div style="display:flex;flex-wrap:wrap;gap:6px 14px">${roles.map((r) => `<label class="mini" style="display:flex;gap:4px;align-items:center"><input type="checkbox" name="wf-cc" value="${r}">${esc(roleTitle(r))}</label>`).join("")}</div>`
}

const priorityField = '<div><label>Mức ưu tiên</label><select id="wf-priority"><option>Cao</option><option>Trung bình</option><option>Thấp</option></select></div>'

function wfOpen(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item) return alert(`Không tìm thấy ${id}`)
  const sub = item.subUnit ? vldcData.get("subUnits").find((s) => s.id === item.subUnit) : undefined
  shell.openModal(`${TYPE_LABELS[item.type]} ${item.id}`, `<h3 style="margin-top:0">${esc(item.title)}</h3>${sub ? `<div class="mini" style="margin:-6px 0 8px">Tổ / phòng thực hiện: <b>${esc(sub.name)}</b></div>` : ""}${detailHtml(item)}`)
}

function wfAct(id: string, action: WorkAction) {
  const progressRaw = inputValue("wf-progress")
  void run(() => store.dispatch(id, action, {
    note: inputValue("wf-note"),
    progress: progressRaw === "" ? undefined : Number(progressRaw),
    evidence: inputValue("wf-evidence"),
  }, ctx.role(), ctx.perms()), () => {
    // A validation error keeps what was typed; a stale modal (state changed elsewhere) is redrawn.
    const current = store.items().find((x) => x.id === id)
    if (!current || !allowedActions(current, ctx.role(), ctx.perms(), store.items()).includes(action)) wfOpen(id)
  })
}

/** Options of the tổ/phòng picker for the chosen owner's unit. */
function subOptionsHtml(owner: string, selected = ""): string {
  return `<option value="">– Cả đơn vị –</option>${subUnitOptions(roleUnitCode(owner)).map((s) => `<option value="${esc(s.id)}"${s.id === selected ? " selected" : ""}>${esc(s.name)}</option>`).join("")}`
}

/** Optional project picker shared by the directive and payment forms. */
function projectPicker(selected = ""): string {
  return `<div><label>Dự án</label><select id="wf-project"><option value="">– Không gắn dự án –</option>${projectsView().map((p) => `<option value="${esc(p.id)}"${p.id === selected ? " selected" : ""}>${esc(`${p.id} – ${p.name}`)}</option>`).join("")}</select></div>`
}

function wfCreateDirective(presetSub = "", presetProject = "") {
  const others = DELEGATES.lanhdao
  const sub = presetSub ? vldcData.get("subUnits").find((s) => s.id === presetSub) : undefined
  const owner = (sub && others.find((r) => rolesOfUnit(sub.unit as never).includes(r))) || others[0]
  shell.openModal("Giao chỉ đạo điều hành", `<div class="form-grid"><div class="full"><label>Nội dung chỉ đạo</label><textarea id="wf-title" rows="2"></textarea></div><div><label>Đơn vị / người chủ trì</label><select id="wf-owner" onchange="wfSubOptions(this.value)">${roleOptions(others, owner)}</select></div><div><label>Tổ / phòng thực hiện</label><select id="wf-sub">${subOptionsHtml(owner, sub?.id)}</select></div>${projectPicker(presetProject)}<div><label>Hạn hoàn thành</label><input id="wf-due" type="date" min="${today()}"></div>${priorityField}<div class="full"><label>Kết quả / minh chứng yêu cầu</label><input id="wf-desc"></div><div class="full"><label>Phối hợp</label>${ccBoxes(others)}</div></div><button class="btn btn-primary" style="margin-top:10px" onclick="wfSubmitDirective()">Giao chỉ đạo</button>`)
}

function wfSubmitDirective() {
  void run(async () => {
    const item = createDirective({
      id: newId("CD"),
      title: inputValue("wf-title"),
      owner: inputValue("wf-owner"),
      subUnit: inputValue("wf-sub") || undefined,
      project: inputValue("wf-project") || undefined,
      cc: checkedValues("wf-cc"),
      due: inputValue("wf-due"),
      priority: inputValue("wf-priority") as WorkItem["priority"],
      description: inputValue("wf-desc") || undefined,
    }, ctx.role(), ctx.perms(), new Date().toISOString())
    await store.add(item)
  })
}

function wfDelegate(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item) return
  const subs = DELEGATES[ctx.role()] || []
  shell.openModal(`Giao việc con • ${item.id}`, `<div class="mini">Thuộc: ${esc(item.title)}</div><div class="form-grid" style="margin-top:8px"><div class="full"><label>Nội dung công việc</label><textarea id="wf-title" rows="2"></textarea></div><div><label>Giao cho</label><select id="wf-owner">${roleOptions(subs)}</select></div><div><label>Hạn hoàn thành</label><input id="wf-due" type="date" min="${today()}" max="${esc(item.due)}" value="${esc(item.due)}"></div>${priorityField}<div class="full"><label>Mô tả</label><input id="wf-desc"></div></div><button class="btn btn-primary" style="margin-top:10px" ${jsCall("wfSubmitDelegate", item.id)}>Giao việc</button>`)
}

function wfSubmitDelegate(id: string) {
  void run(() => store.dispatch(id, "delegate", {
    child: {
      id: newId("TASK"),
      title: inputValue("wf-title"),
      owner: inputValue("wf-owner"),
      due: inputValue("wf-due"),
      priority: inputValue("wf-priority") as WorkItem["priority"],
      description: inputValue("wf-desc") || undefined,
    },
  }, ctx.role(), ctx.perms()))
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

function wfResetDemo() {
  if (!confirm("Xoá toàn bộ dữ liệu (luồng giao việc, dự án, tài chính, thiết bị, lịch...) và nạp lại dữ liệu mẫu?")) return
  void run(async () => {
    await Promise.all([store.reset(), vldcData.resetAll()])
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

function markRead(role: string, id: string) {
  const ids = readIds(role)
  ids.add(id)
  try {
    localStorage.setItem(readKey(role), JSON.stringify([...ids]))
  } catch {
    // private mode: unread state just isn't remembered
  }
}

function unreadNotices(role: string) {
  const read = readIds(role)
  return notificationsFor(role, store.items()).filter((n) => !read.has(n.id))
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
  const notices = notificationsFor(role, store.items()).slice(0, 30)
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
  return `${offlineBanner()}<div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Hồ sơ thanh toán liên phòng</h3><div class="mini">${PAYMENT_STEPS.map((s) => esc(roleTitle(s.owner))).join(" → ")}</div></div>${canCreate ? '<button class="btn btn-primary" onclick="wfCreatePayment()">+ Lập đề nghị thanh toán</button>' : ""}</div>${rows ? `<table><tr><th>Mã</th><th>Nội dung</th><th>Số tiền</th><th>Bước hiện tại</th><th>Trạng thái</th><th>Hạn</th><th></th></tr>${rows}</table>` : '<div class="mini">Chưa có hồ sơ trong phạm vi của bạn.</div>'}</div>`
}

function leaderStats(): string {
  const all = store.items()
  const open = all.filter((x) => x.type !== "payment" && !isClosed(x))
  const risky = open.filter((x) => isAtRisk(x, all, today()))
  const pendingPayments = all.filter((x) => x.type === "payment" && x.owner === "lanhdao" && !isClosed(x))
  const waiting = all.filter((x) => x.createdBy === "lanhdao" && x.status === "Chờ duyệt")
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
  store.items().some((x) => x.id === itemId) ? wfOpen(itemId) : shell.show(currentPage())
}

function wrap(render: Record<string, () => void>, page: string, extra: () => string) {
  const original = render[page]
  if (typeof original !== "function") return
  render[page] = function () {
    original()
    prepend(extra())
  }
}

/** Replaces the mock directives page, adds workflow blocks to other pages and exposes inline handlers. */
export function installWorkflow(render: Record<string, () => void>, nextShell: Shell) {
  shell = nextShell
  render.directives = renderDirectives
  wrap(render, "notifications", noticesBlock)
  wrap(render, "payments", paymentsBlock)
  // The leader gets a purpose-built dashboard instead of the stacked legacy demo blocks.
  const unitDashboard = render.dashboard
  function leaderCash(): CashFigures {
    const debts = vldcData.get("debtRecords"), entries = vldcData.get("cashEntries")
    const d = debtSummary(debts)
    const c = cashSummary(debts, entries, today().slice(0, 7))
    return { revenue: d.total, contracts: d.count, thu: c.thu, thuMonth: c.thuMonth, chi: c.chi, chiMonth: c.chiMonth, remaining: d.remaining, doneOwing: d.doneOwing.length }
  }

  render.dashboard = function () {
    const el = content()
    if (ctx.role() === "lanhdao" && el) {
      el.innerHTML = leaderDashboardHtml(store.items(), { projects: projectsView(), disbursement: vldcData.get("disbursement"), risks: vldcData.get("risks"), alerts: liveAlerts(vldcData.get("alertRules")), cash: leaderCash() }, today(), inboxBlock(5), offlineBanner())
      return
    }
    unitDashboard()
    prepend(inboxBlock(5))
  }
  wrap(render, "command", () => (ctx.role() === "lanhdao" ? leaderStats() : ""))
  const command = render.command
  render.command = function () {
    command()
    if (ctx.role() === "lanhdao") commandHeatmap()
  }
  render.performance = function () {
    const el = content()
    if (el) el.innerHTML = performanceHtml(store.items(), ctx.role(), today())
  }
  Object.assign(window, {
    wfOpen, wfAct, wfCreateDirective, wfSubmitDirective, wfDelegate, wfSubmitDelegate,
    wfCreatePayment, wfSubmitPayment, wfResetDemo, wfNotice, wfUnitKpi,
    createDirective: wfCreateDirective,
    wfCreateDirectiveFor: (subId: string) => wfCreateDirective(subId),
    wfCreateDirectiveForProject: (projectId: string) => wfCreateDirective("", projectId),
    wfSubOptions: (owner: string) => {
      const el = document.getElementById("wf-sub")
      if (el) el.innerHTML = subOptionsHtml(owner)
    },
    directiveDetail: wfOpen,
  })
}
