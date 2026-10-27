import { escapeHtml as esc, formatDate, formatMoney, formatTime, jsCall, statusBadge } from "./html"
import { disbursementView, projectsView, spendView } from "../data/projectView"
import {
  BUSINESS_ROLES,
  PAYMENT_STEPS,
  ROLE_TITLES,
  allowedActions,
  blockedReason,
  childrenOf,
  createDirective,
  createPayment,
  delegatesOf,
  hasPerm,
  isAtRisk,
  isClosed,
  isVisible,
  notificationsFor,
  ownerInbox,
  rolledUpProgress,
  type WorkAction,
} from "./rules"
import type { WorkItem, WorkNotice } from "./types"
import { DIRECTIVE_STATUS_FILTERS, TYPE_LABELS, directiveExportRows, filterDirectives, notYetAccepted, type DirectiveLabels, type DirectiveStatusFilter } from "./directiveList"
import { workflowStore as store } from "./repository"
import { leaderDashboardHtml, type CashFigures, type OrgFigures } from "./leaderDashboard"
import { staffView } from "../data/staffView"
import { cashSummary, debtSummary } from "../data/ledgerCore"
import { performanceHtml, unitDetailHtml } from "./kpiViews"
import { kpiUnits, rolesByUnit, unitKpis, unitOfRole } from "./kpi"
import { vldcData } from "../data/registry"
import { ROLE_PROFILES, roleUnitCode, rolesOfUnit, unitCodeOf } from "../data/org"
import { managesAllUnits } from "../data/access"
import { subUnitOptions } from "../data/subUnitPage"

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

/** Search and status filter of the Giao việc list (kept across realtime re-renders). */
let dirQuery = ""
let dirStatus: DirectiveStatusFilter = ""

const directiveLabels: DirectiveLabels = {
  role: roleTitle,
  subUnit: (id) => (id ? vldcData.get("subUnits").find((s) => s.id === id)?.name ?? "" : ""),
  project: (id) => {
    const p = id ? vldcData.get("projects").find((x) => x.id === id) : undefined
    return p ? `${p.id} – ${p.name}` : id ?? ""
  },
}

function visibleDirectives(): { visible: WorkItem[]; all: WorkItem[] } {
  const all = store.items()
  return { all, visible: all.filter((x) => x.type !== "payment" && isVisible(x, ctx.role(), all)) }
}

const filtered = (visible: WorkItem[], all: WorkItem[]) => filterDirectives(visible, all, dirQuery, dirStatus, today(), directiveLabels)

/** The tree while nothing is searched; a flat list of the matches otherwise. */
function directiveTableHtml(visible: WorkItem[], all: WorkItem[]): string {
  const searching = !!(dirQuery.trim() || dirStatus)
  const rows = searching
    ? treeRows(filtered(visible, all).sort((a, b) => a.due.localeCompare(b.due)), [], all)
    : treeRows(visible.filter((x) => !x.parentId || !visible.some((p) => p.id === x.parentId)).sort((a, b) => a.due.localeCompare(b.due)), visible, all)
  const empty = searching ? "Không có việc nào khớp tìm kiếm." : "Chưa có việc nào trong phạm vi của bạn."
  return `${searching ? `<div class="mini" style="margin-bottom:6px">${filtered(visible, all).length} / ${visible.length} việc khớp</div>` : ""}<table><tr><th>Mã</th><th>Nội dung</th><th>Người giao</th><th>Chủ trì</th><th>Phối hợp</th><th>Trạng thái</th><th>Tiến độ</th><th>Hạn</th><th></th></tr>${rows || `<tr><td colspan="9" class="mini">${empty}</td></tr>`}</table>`
}

function wfDirectiveSearch() {
  dirQuery = inputValue("wf-dir-q")
  dirStatus = inputValue("wf-dir-status") as DirectiveStatusFilter
  const el = document.getElementById("wf-dir-table")
  const { visible, all } = visibleDirectives()
  if (el) el.innerHTML = directiveTableHtml(visible, all)
}

/** Excel file of the work shown (the search applies), by due date. */
async function wfExportDirectives() {
  const { visible, all } = visibleDirectives()
  const rows = directiveExportRows(filtered(visible, all).sort((a, b) => a.due.localeCompare(b.due)), all, directiveLabels)
  if (!rows.length) return alert("Không có việc nào để xuất.")
  const XLSX = await import("xlsx")
  const sheet = XLSX.utils.json_to_sheet(rows)
  sheet["!cols"] = Object.keys(rows[0]).map((k) => ({ wch: k === "Nội dung" ? 50 : k === "Dự án" ? 34 : 18 }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Giao việc")
  XLSX.writeFile(book, `giao-viec-${today()}.xlsx`)
}

function renderDirectives() {
  const all = store.items()
  const role = ctx.role()
  const perms = ctx.perms()
  const visible = all.filter((x) => x.type !== "payment" && isVisible(x, role, all))
  const open = visible.filter((x) => !isClosed(x))
  const atRisk = open.filter((x) => isAtRisk(x, all, today()))
  const waiting = visible.filter((x) => x.createdBy === role && x.status === "Chờ duyệt")
  // The top of the organisation is never the owner: its first column follows the work it gave out that nobody has accepted yet.
  const leader = managesAllUnits(role)
  const mine = leader ? notYetAccepted(role, visible) : ownerInbox(role, all).filter((x) => x.type !== "payment")
  // Giving work needs the permission and someone in the role's managed scope to give it to.
  const canCreate = hasPerm(perms, "vldc-directives:create") && delegatesOf(role).length > 0
  const canReset = leader || perms.includes("*")
  const el = content()
  if (!el) return
  el.innerHTML = `${offlineBanner()}<div class="grid kpis"><div class="kpi"><div class="label">Đang mở</div><div class="value">${open.length}</div><div class="sub">Chỉ đạo & việc liên quan</div></div><div class="kpi"><div class="label">Nguy cơ trễ</div><div class="value">${atRisk.length}</div><div class="sub">≤ 2 ngày, &lt; 80%</div></div><div class="kpi"><div class="label">Chờ tôi duyệt</div><div class="value">${waiting.length}</div><div class="sub">Đã báo cáo hoàn thành</div></div><div class="kpi"><div class="label">Hoàn thành</div><div class="value">${visible.length - open.length}</div><div class="sub">Đã duyệt đóng</div></div></div>
 <div class="card" style="margin-top:14px"><div class="card-head"><div><h3>Giao việc</h3><div class="mini">Giao việc theo cấp, theo dõi tiến độ cuộn lên và duyệt kết quả</div></div><div>${canReset ? '<button class="btn btn-light" onclick="wfResetDemo()">Đặt lại dữ liệu demo</button> ' : ""}${canCreate ? '<button class="btn btn-primary" onclick="wfCreateDirective()">+ Giao việc</button>' : ""}</div></div>
 <div class="directive-board">${column(leader ? "Mới giao – chưa nhận" : "Tôi cần xử lý", mine, all)}${column("Chờ tôi duyệt", waiting, all)}${column("Nguy cơ trễ", atRisk, all)}</div></div>
 <div class="card" style="margin-top:14px"><div class="card-head"><h3>Cây chỉ đạo – việc được giao</h3><div class="vx-dir-tools"><input id="wf-dir-q" placeholder="Tìm mã, nội dung, đơn vị, tổ, dự án…" value="${esc(dirQuery)}" oninput="wfDirectiveSearch()"><select id="wf-dir-status" onchange="wfDirectiveSearch()">${DIRECTIVE_STATUS_FILTERS.map(([v, l]) => `<option value="${v}"${v === dirStatus ? " selected" : ""}>${l}</option>`).join("")}</select><button class="btn btn-light" onclick="wfExportDirectives()">Xuất Excel</button></div></div><div id="wf-dir-table">${directiveTableHtml(visible, all)}</div></div>`
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

const personOf = (r: string) => ROLE_PROFILES[r]?.name ?? ""

/** Owners grouped by the unit their work counts for (KPI), "Chức danh – Họ tên" in each group. */
function roleOptions(roles: string[], selected = ""): string {
  return rolesByUnit(roles).map((g) => `<optgroup label="${esc(g.name)}">${g.roles.map((r) => `<option value="${r}"${r === selected ? " selected" : ""}>${esc(roleTitle(r))}${personOf(r) ? ` – ${esc(personOf(r))}` : ""}</option>`).join("")}</optgroup>`).join("")
}

/** "Tính vào KPI của …" under the owner picker. */
const ownerUnitHint = (owner: string) => {
  const unit = unitOfRole(owner)
  return unit ? `Thuộc <b>${esc(unit.name)}</b> • việc tính vào KPI của đơn vị này` : "Không thuộc đơn vị nào trong KPI"
}

function ccBoxes(roles: string[]): string {
  return `<div class="vx-cc-groups">${rolesByUnit(roles).map((g) => `<div class="vx-cc-group"><div class="mini"><b>${esc(g.name)}</b></div>${g.roles.map((r) => `<label class="mini"><input type="checkbox" name="wf-cc" value="${r}">${esc(roleTitle(r))}</label>`).join("")}</div>`).join("")}</div>`
}

const priorityField = '<div><label>Mức ưu tiên</label><select id="wf-priority"><option>Cao</option><option>Trung bình</option><option>Thấp</option></select></div>'

function wfOpen(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item) return alert(`Không tìm thấy ${id}`)
  const sub = item.subUnit ? vldcData.get("subUnits").find((s) => s.id === item.subUnit) : undefined
  const project = item.project ? projectsView().find((p) => p.id === item.project) : undefined
  const wbs = project?.wbs.find((w, i) => (w.id ?? String(i)) === item.wbsItem)
  const where = [
    sub ? `Tổ / phòng thực hiện: <b>${esc(sub.name)}</b>` : "",
    project ? `Dự án: <a href="javascript:void 0" ${jsCall("projectOpen", project.id)}><b>${esc(project.id)}</b></a>${wbs ? ` • hạng mục <b>${esc(wbs.name)}</b>` : ""}` : "",
  ].filter(Boolean).join(" • ")
  shell.openModal(`${TYPE_LABELS[item.type]} ${item.id}`, `<h3 style="margin-top:0">${esc(item.title)}</h3>${where ? `<div class="mini" style="margin:-6px 0 8px">${where}</div>` : ""}${detailHtml(item)}`)
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

/** WBS items of a project, for the "Hạng mục" picker of the directive form. */
function wbsOptionsHtml(projectId: string, selected = ""): string {
  const p = projectsView().find((x) => x.id === projectId)
  return `<option value="">– Cả dự án –</option>${(p?.wbs ?? []).map((w, i) => {
    const key = w.id ?? String(i)
    return `<option value="${esc(key)}"${key === selected ? " selected" : ""}>${esc(w.name)}${w.weight ? ` (${w.weight}%)` : ""}</option>`
  }).join("")}`
}

/** Optional project picker shared by the directive and payment forms; the directive form adds its WBS item. */
function projectPicker(selected = "", withWbs = false, selectedWbs = ""): string {
  const wbs = withWbs ? `<div><label>Hạng mục dự án</label><select id="wf-wbs" onchange="wfWbsPicked()">${wbsOptionsHtml(selected, selectedWbs)}</select></div>` : ""
  return `<div><label>Dự án</label><select id="wf-project"${withWbs ? ' onchange="wfProjectPicked(this.value)"' : ""}><option value="">– Không gắn dự án –</option>${projectsView().map((p) => `<option value="${esc(p.id)}"${p.id === selected ? " selected" : ""}>${esc(`${p.id} – ${p.name}`)}</option>`).join("")}</select></div>${wbs}`
}

/** Who a directive for a project (or one of its WBS items) goes to: the item's tổ, else the project's tổ, else its unit. */
function projectTarget(projectId: string, wbsId = ""): { sub?: string; unit?: string } {
  const p = projectsView().find((x) => x.id === projectId)
  if (!p) return {}
  const subId = p.wbs.find((w, i) => (w.id ?? String(i)) === wbsId)?.subUnit || p.subUnit
  const sub = subId ? vldcData.get("subUnits").find((s) => s.id === subId) : undefined
  return { sub: sub?.id, unit: sub?.unit ?? unitCodeOf(p.unit) }
}

const ownerOfUnit = (unit?: string) => (unit ? delegatesOf(ctx.role()).find((r) => rolesOfUnit(unit as never).includes(r)) : undefined)

/** Picking a project / WBS item in the directive form moves the owner and tổ to the ones doing it. */
function applyProjectTarget(projectId: string, wbsId = "") {
  const { sub, unit } = projectTarget(projectId, wbsId)
  const owner = ownerOfUnit(unit)
  const ownerEl = document.getElementById("wf-owner") as HTMLSelectElement | null
  const subEl = document.getElementById("wf-sub") as HTMLSelectElement | null
  if (!owner || !ownerEl || !subEl) return
  ownerEl.value = owner
  subEl.innerHTML = subOptionsHtml(owner, sub)
  const hint = document.getElementById("wf-owner-unit")
  if (hint) hint.innerHTML = ownerUnitHint(owner)
}

function wfCreateDirective(presetSub = "", presetProject = "", presetWbs = "") {
  const role = ctx.role()
  const others = delegatesOf(role)
  if (!others.length) return shell.openModal("Giao việc", '<div class="mini">Không có người nào thuộc phạm vi quản lý của bạn để giao việc.</div>')
  const target = presetSub ? { sub: presetSub, unit: vldcData.get("subUnits").find((s) => s.id === presetSub)?.unit } : projectTarget(presetProject, presetWbs)
  const owner = ownerOfUnit(target.unit) || others[0]
  const sub = target.sub ? vldcData.get("subUnits").find((s) => s.id === target.sub) : undefined
  shell.openModal("Giao việc", `<div class="form-grid"><div class="full"><label>Nội dung chỉ đạo</label><textarea id="wf-title" rows="2"></textarea></div><div><label>Người chủ trì (theo đơn vị)</label><select id="wf-owner" onchange="wfSubOptions(this.value)">${roleOptions(others, owner)}</select><div class="mini" id="wf-owner-unit" style="margin-top:4px">${ownerUnitHint(owner)}</div></div><div><label>Tổ / phòng thực hiện</label><select id="wf-sub">${subOptionsHtml(owner, sub?.id)}</select></div>${projectPicker(presetProject, true, presetWbs)}<div><label>Hạn hoàn thành</label><input id="wf-due" type="date" min="${today()}"></div>${priorityField}<div class="full"><label>Kết quả / minh chứng yêu cầu</label><input id="wf-desc"></div><div class="full"><label>Phối hợp</label>${ccBoxes(BUSINESS_ROLES.filter((r) => r !== role))}</div></div><button class="btn btn-primary" style="margin-top:10px" onclick="wfSubmitDirective()">Giao việc</button>`)
}

function wfSubmitDirective() {
  void run(async () => {
    const item = createDirective({
      id: newId("CD"),
      title: inputValue("wf-title"),
      owner: inputValue("wf-owner"),
      subUnit: inputValue("wf-sub") || undefined,
      project: inputValue("wf-project") || undefined,
      wbsItem: inputValue("wf-wbs") || undefined,
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
  const subs = delegatesOf(ctx.role())
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
  return notificationsFor(role, store.items()).filter((n) => !read.has(n.id))
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

function paymentsBlock(): string {
  const all = store.items()
  const role = ctx.role()
  const payments = all.filter((x) => x.type === "payment" && isVisible(x, role, all)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const canCreate = role === PAYMENT_STEPS[0].owner && hasPerm(ctx.perms(), "vldc-payments:create")
  const rows = payments.map((p) => `<tr><td><b>${esc(p.id)}</b></td><td>${esc(p.title)}</td><td>${formatMoney(p.amount)}</td><td>${esc(PAYMENT_STEPS[p.step ?? 0].label)}<div class="mini">${esc(roleTitle(p.owner))}</div></td><td>${statusBadge(p)}</td><td>${formatDate(p.due)}</td><td>${openButton(p, p.owner === role && !isClosed(p) ? "Xử lý" : "Xem")}</td></tr>`).join("")
  return `${offlineBanner()}<div class="card" style="margin-bottom:14px"><div class="card-head"><div><h3>Hồ sơ thanh toán liên phòng</h3><div class="mini">${PAYMENT_STEPS.map((s) => esc(roleTitle(s.owner))).join(" → ")}</div></div>${canCreate ? '<button class="btn btn-primary" onclick="wfCreatePayment()">+ Lập đề nghị thanh toán</button>' : ""}</div>${rows ? `<table><tr><th>Mã</th><th>Nội dung</th><th>Số tiền</th><th>Bước hiện tại</th><th>Trạng thái</th><th>Hạn</th><th></th></tr>${rows}</table>` : '<div class="mini">Chưa có hồ sơ trong phạm vi của bạn.</div>'}</div>`
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
  else shell.show(currentPage())
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
      el.innerHTML = leaderDashboardHtml(store.items(), { projects: projectsView(), disbursement: disbursementView(), spend: spendView(), org: leaderOrg(), risks: vldcData.get("risks"), cash: leaderCash() }, today(), offlineBanner())
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
    wfOpen, wfAct, wfCreateDirective, wfSubmitDirective, wfDelegate, wfSubmitDelegate,
    wfCreatePayment, wfSubmitPayment, wfResetDemo, wfNotice, wfUnitKpi, wfDirectiveSearch, wfExportDirectives,
    createDirective: wfCreateDirective,
    wfCreateDirectiveFor: (subId: string) => wfCreateDirective(subId),
    wfCreateDirectiveForProject: (projectId: string) => wfCreateDirective("", projectId),
    /** Đôn đốc / giao việc for one WBS item: project, item, its tổ and unit preset. */
    wfCreateDirectiveForWbs: (projectId: string, wbsId: string) => wfCreateDirective("", projectId, wbsId),
    wfProjectPicked: (projectId: string) => {
      const el = document.getElementById("wf-wbs")
      if (el) el.innerHTML = wbsOptionsHtml(projectId)
      applyProjectTarget(projectId)
    },
    wfWbsPicked: () => applyProjectTarget(inputValue("wf-project"), inputValue("wf-wbs")),
    wfSubOptions: (owner: string) => {
      const el = document.getElementById("wf-sub")
      if (el) el.innerHTML = subOptionsHtml(owner)
      const hint = document.getElementById("wf-owner-unit")
      if (hint) hint.innerHTML = ownerUnitHint(owner)
    },
    directiveDetail: wfOpen,
  })
}
