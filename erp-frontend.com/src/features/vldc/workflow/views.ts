import { escapeHtml as esc, formatDate, formatMoney, formatTime, jsCall, statusBadge } from "./html"
import { subTabsHtml } from "../data/menuPolicy"
import { disbursementView, projectsView, spendView } from "../data/projectView"
import {
  BUSINESS_ROLES,
  PAYMENT_STEPS,
  ROLE_TITLES,
  allowedActions,
  blockedReason,
  childrenOf,
  canDeleteWork,
  createProjectTask,
  createPayment,
  delegatesOf,
  hasPerm,
  approverOf,
  createProposal,
  isAtRisk,
  isClosed,
  isPendingProposal,
  isVisible,
  isWork,
  notificationsFor,
  ownerInbox,
  reviewerOf,
  rolledUpProgress,
  type WorkAction,
} from "./rules"
import type { WorkItem, WorkNotice } from "./types"
import { DIRECTIVE_STATUS_FILTERS, TYPE_LABELS, directiveExportRows, filterDirectives, notYetAccepted, type DirectiveLabels, type DirectiveStatusFilter } from "./directiveList"
import { workflowStore as store } from "./repository"
import { leaderDashboardHtml, type CashFigures, type OrgFigures } from "./leaderDashboard"
import { staffView } from "../data/staffView"
import { ledgerStore } from "../data/ledgerStore"
import { performanceHtml, unitDetailHtml } from "./kpiViews"
import { kpiUnits, rolesByUnit, unitKpis, unitOfRole } from "./kpi"
import { vldcData } from "../data/registry"
import { ROLE_PROFILES, roleUnitCode, rolesOfUnit, unitCodeOf, unitName, type UnitCode } from "../data/org"
import { managesAllUnits, tierOf } from "../data/access"
import { approvalOf, canCreateTask, projectUnits } from "../data/projectCore"
import type { StoredProject } from "../data/types"
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

/** "Cán bộ hiện trường – Nguyễn Đức Hải": the role and the person holding it. */
const assignee = (role: string) => `${roleTitle(role)}${personOf(role) ? ` – ${personOf(role)}` : ""}`
/** Unit a note was written for (recorded with it; older notes fall back to the writer's unit today). */
const noteUnit = (h: { by: string; unit?: string }) => {
  const code = h.unit ?? roleUnitCode(h.by)
  return code ? unitName(code as UnitCode) : ""
}

export function detailHtml(item: WorkItem, withHeader = false): string {
  const all = store.items()
  const role = ctx.role()
  const actions = allowedActions(item, role, ctx.perms(), all)
  const parent = item.parentId ? all.find((x) => x.id === item.parentId) : undefined
  const kids = all.filter((x) => x.parentId === item.id)
  const metric = (label: string, value: string) => `<div class="metric"><span>${label}</span><b>${value}</b></div>`
  const info = [
    withHeader ? "" : metric("Loại", TYPE_LABELS[item.type]),
    withHeader ? (riskBadge(item, all) ? metric("Cảnh báo", riskBadge(item, all)) : "") : metric("Trạng thái", statusBadge(item) + riskBadge(item, all)),
    item.type === "proposal"
      ? metric("Người đề xuất", esc(roleTitle(item.createdBy))) + metric("Người duyệt", esc(roleTitle(item.approver ?? "")))
      : metric("Người giao / lập", esc(roleTitle(item.createdBy))),
    item.type === "proposal" && isPendingProposal(item) ? "" : metric(item.type === "payment" ? "Đang ở" : "Người thực hiện", esc(assignee(item.owner))),
    metric("Phối hợp", item.cc.map((r) => esc(roleTitle(r))).join(", ") || "–"),
    metric("Hạn", formatDate(item.due)),
    item.type === "payment" ? metric("Số tiền", formatMoney(item.amount)) : metric("Tiến độ", `${rolledUpProgress(item, all)}%${childrenOf(item.id, all).length ? " (cuộn từ việc con)" : ""}`),
    item.evidence ? metric("Minh chứng", esc(item.evidence)) : "",
    parent ? metric("Việc cha", `<a href="javascript:void 0" ${jsCall("wfOpen", parent.id)}>${esc(parent.id)} • ${esc(parent.title)}</a>`) : "",
    item.description ? `<p>${esc(item.description)}</p>` : "",
  ].join("")
  const kidList = kids.length
    ? `<h4 style="margin-top:12px">Việc con / hồ sơ liên quan</h4>${kids.map((k) => `<div class="alert"><span class="dot ${isClosed(k) ? "green" : "blue"}"></span><div><a href="javascript:void 0" ${jsCall("wfOpen", k.id)}><b>${esc(k.id)}</b> • ${esc(k.title)}</a><div class="mini">Giao cho <b>${esc(assignee(k.owner))}</b> • ${esc(k.status)}${k.type === "payment" ? "" : ` • ${rolledUpProgress(k, all)}%`}</div></div></div>`).join("")}`
    : ""
  const notes = item.history.filter((h) => h.action === "comment")
  const noteList = `<h4 style="margin-top:12px">Ghi chú (${notes.length})</h4>${notes.map((h) => `<div class="vx-note"><div class="vx-note-head"><b>${esc(h.byName || personOf(h.by) || roleTitle(h.by))}</b> <span class="mini">${esc(roleTitle(h.by))}${noteUnit(h) ? ` • ${esc(noteUnit(h))}` : ""} • ${formatTime(h.at)}</span></div><div>${esc(h.note ?? "")}</div></div>`).join("") || '<div class="mini">Chưa có ghi chú.</div>'}`
  const history = `${item.type === "payment" ? "" : noteList}<h4 style="margin-top:12px">Lịch sử xử lý</h4><div class="timeline">${[...item.history].reverse().filter((h) => h.action !== "comment" || item.type === "payment").map((h) => `<div><b>${formatTime(h.at)} • ${esc(roleTitle(h.by))}</b><br>${esc(ACTION_LABELS[h.action as WorkAction] || (h.action === "create" ? "Khởi tạo" : h.action))}${h.note ? `: ${esc(h.note)}` : ""}</div>`).join("")}</div>`
  const form = actions.length
    ? `<div class="form-grid" style="margin-top:12px">${actions.includes("progress") ? `<div><label>Tiến độ (%)</label><input id="wf-progress" type="number" min="0" max="100" value="${Number(item.progress) || 0}"></div><div><label>Minh chứng</label><input id="wf-evidence" value="${esc(item.evidence || "")}"></div>` : ""}<div class="full"><label>Ghi chú / lý do</label><textarea id="wf-note" rows="2"></textarea></div></div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${actions.map((a) => actionButton(item, a)).join("")}</div>`
    : '<div class="mini" style="margin-top:12px">Bạn chỉ có quyền xem việc này ở trạng thái hiện tại.</div>'
  const remove = canDeleteWork(item, role, all) ? `<button class="btn btn-danger" ${jsCall("wfDelete", item.id)}>Xoá việc</button>` : ""
  const blocked = blockedReason(item, role, all)
  const blockedNote = blocked ? `<div class="alert" style="margin-top:12px"><span class="dot yellow"></span><div>${esc(blocked)}</div></div>` : ""
  return `<div class="grid twoeq"><div>${info}${kidList}${blockedNote}</div><div>${item.type === "payment" ? paymentStepper(item) : ""}${history}</div></div>${form}${remove ? `<div class="toolbar" style="margin-top:14px;justify-content:flex-end">${remove}</div>` : ""}`
}

/** A returned proposal is corrected on its form page; the other actions run from the note box above. */
function actionButton(item: WorkItem, a: WorkAction): string {
  if (item.type === "proposal" && a === "resubmit") return `<button class="btn btn-primary" ${jsCall("go", `projects/de-xuat/${encodeURIComponent(item.id)}/sua`)}>Sửa và gửi lại</button>`
  const handler = a === "delegate" ? jsCall("wfDelegate", item.id) : jsCall("wfAct", item.id, a)
  return `<button class="btn ${a === "return" || a === "reject" ? "btn-light" : "btn-primary"}" ${handler}>${ACTION_LABELS[a]}</button>`
}

function inputValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | null)?.value ?? ""
}

function checkedValues(name: string): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)).map((x) => x.value)
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
  // Proposals and project work open as issue pages under Nhiệm vụ / Dự án; payments and older work keep the modal.
  if (item.type === "proposal") return shell.go(proposalPath(item.id))
  if (item.project && item.type !== "payment") return shell.go(`${projectPath(item.project)}/viec/${encodeURIComponent(item.id)}`)
  const sub = item.subUnit ? vldcData.get("subUnits").find((s) => s.id === item.subUnit) : undefined
  const project = item.project ? projectsView().find((p) => p.id === item.project) : undefined
  const wbs = project?.wbs.find((w, i) => (w.id ?? String(i)) === item.wbsItem)
  const where = [
    sub ? `Tổ / phòng thực hiện: <b>${esc(sub.name)}</b>` : "",
    project ? `Dự án: <a href="javascript:void 0" ${jsCall("go", projectPath(project.id))}><b>${esc(project.id)}</b></a>${wbs ? ` • hạng mục <b>${esc(wbs.name)}</b>` : ""}` : "",
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

/** Project picker shared by the directive (required, with its WBS item), proposal and payment (optional) forms. */
function projectPicker(selected = "", withWbs = false, selectedWbs = "", required = false): string {
  const wbs = withWbs ? `<div><label>Hạng mục dự án</label><select id="wf-wbs" onchange="wfWbsPicked()">${wbsOptionsHtml(selected, selectedWbs)}</select></div>` : ""
  return `<div><label>Dự án${required ? " *" : ""}</label><select id="wf-project"${withWbs ? ' onchange="wfProjectPicked(this.value)"' : ""}><option value="">${required ? "– Chọn dự án –" : "– Không gắn dự án –"}</option>${projectsView().map((p) => `<option value="${esc(p.id)}"${p.id === selected ? " selected" : ""}>${esc(`${p.id} – ${p.name}`)}</option>`).join("")}</select></div>${wbs}`
}

/** Roles of the units taking part in the project: who its tasks can be given to (heads first within a unit). */
function taskOwners(p: StoredProject): string[] {
  const units = projectUnits(p)
  const rank = (r: string) => (tierOf(r) === "head" ? 0 : 1)
  return BUSINESS_ROLES.filter((r) => units.includes(roleUnitCode(r) ?? "")).sort((a, b) => rank(a) - rank(b))
}

/** Who a task of the project (or one of its WBS items) goes to by default: the item's tổ, else the project's tổ, else its main unit. */
function projectTarget(p: StoredProject, wbsId = ""): { sub?: string; unit?: string } {
  const subId = p.wbs.find((w, i) => (w.id ?? String(i)) === wbsId)?.subUnit || p.subUnit
  const sub = subId ? vldcData.get("subUnits").find((s) => s.id === subId) : undefined
  return { sub: sub?.id, unit: sub?.unit ?? unitCodeOf(p.unit) }
}

const ownerOfUnit = (owners: string[], unit?: string) => (unit ? owners.find((r) => rolesOfUnit(unit as never).includes(r)) : undefined)

/** Picking a WBS item in the task form moves the owner and tổ to the ones doing it. */
function applyProjectTarget(projectId: string, wbsId = "") {
  const p = projectsView().find((x) => x.id === projectId)
  if (!p) return
  const { sub, unit } = projectTarget(p, wbsId)
  const owner = ownerOfUnit(taskOwners(p), unit)
  const ownerEl = document.getElementById("wf-owner") as HTMLSelectElement | null
  const subEl = document.getElementById("wf-sub") as HTMLSelectElement | null
  if (!owner || !ownerEl || !subEl) return
  ownerEl.value = owner
  subEl.innerHTML = subOptionsHtml(owner, sub)
  const hint = document.getElementById("wf-owner-unit")
  if (hint) hint.innerHTML = ownerUnitHint(owner)
}

const projectPath = (id: string) => `projects/${encodeURIComponent(id)}`
const proposalPath = (id: string) => `projects/de-xuat/${encodeURIComponent(id)}`
const backLink = (path: string, label: string) => `<a class="vx-back" href="javascript:void 0" ${jsCall("go", path)}>← ${esc(label)}</a>`
const pageHead = (back: string, title: string, sub = "") => `<div class="card vx-subpage-head">${back}<h3 style="margin:6px 0 2px">${esc(title)}</h3>${sub ? `<div class="mini">${sub}</div>` : ""}</div>`

/** Tạo việc opens as a page of the project (optionally for one WBS item); without a project, the projects to pick from. */
function wfCreateDirective(_presetSub = "", presetProject = "", presetWbs = "") {
  shell.go(presetProject ? `${projectPath(presetProject)}/giao-viec${presetWbs ? `?wbs=${encodeURIComponent(presetWbs)}` : ""}` : "projects/giao-viec")
}

/** The role may create tasks in this project (Phòng Kỹ thuật, approved project). */
export const canCreateTaskIn = (p: StoredProject) => canCreateTask(p, ctx.role())

/**
 * Form page of a project task (Phòng Kỹ thuật): the owner is a role of a unit taking part; without a project, the
 * approved projects to create it in.
 */
export function directiveFormHtml(presetProject = "", presetWbs = ""): string {
  const role = ctx.role()
  const project = presetProject ? projectsView().find((p) => p.id === presetProject) : undefined
  if (!presetProject) {
    const ps = projectsView().filter((p) => canCreateTask(p, role))
    const rows = ps.map((p) => `<div class="alert vx-cap-pick" ${jsCall("go", `${projectPath(p.id)}/giao-viec`)}><span class="dot green"></span><div><b>${esc(p.id)} – ${esc(p.name)}</b><div class="mini">${esc(p.unit)}</div></div></div>`).join("")
    return pageHead(backLink("projects", "Nhiệm vụ / Dự án"), "Tạo việc", "Chọn dự án (đã được phê duyệt) để tạo việc.") + `<div class="card">${rows || '<div class="mini">Bạn không có dự án nào để tạo việc.</div>'}</div>`
  }
  const back = project ? backLink(projectPath(project.id), `${project.id} – ${project.name}`) : backLink("projects", "Nhiệm vụ / Dự án")
  if (!project) return pageHead(back, "Tạo việc") + `<div class="card mini">Không tìm thấy dự án ${esc(presetProject)}.</div>`
  if (!canCreateTask(project, role)) {
    const why = approvalOf(project) === "Đã duyệt" ? "Chỉ Phòng Kỹ thuật tạo việc trong dự án." : "Dự án chưa được Liên đoàn trưởng phê duyệt."
    return pageHead(back, "Tạo việc") + `<div class="card mini">${why}</div>`
  }
  const owners = taskOwners(project)
  if (!owners.length) return pageHead(back, "Tạo việc") + '<div class="card mini">Dự án chưa có phòng thực hiện.</div>'
  const target = projectTarget(project, presetWbs)
  const owner = ownerOfUnit(owners, target.unit) || owners[0]
  const sub = target.sub ? vldcData.get("subUnits").find((s) => s.id === target.sub) : undefined
  const done = projectPath(project.id)
  return `${pageHead(back, "Tạo việc", "Việc giao cho một phòng tham gia dự án; Phòng Kỹ thuật duyệt kết quả. Các phòng tham gia xem và ghi chú.")}
<div class="card"><div class="form-grid"><div class="full"><label>Nội dung công việc *</label><textarea id="wf-title" rows="2"></textarea></div><div><label>Dự án</label><input type="hidden" id="wf-project" value="${esc(project.id)}"><div class="vx-fixed-field"><b>${esc(project.id)}</b> – ${esc(project.name)}</div></div><div><label>Hạng mục dự án</label><select id="wf-wbs" onchange="wfWbsPicked()">${wbsOptionsHtml(project.id, presetWbs)}</select></div><div><label>Người chủ trì (phòng tham gia) *</label><select id="wf-owner" onchange="wfSubOptions(this.value)">${roleOptions(owners, owner)}</select><div class="mini" id="wf-owner-unit" style="margin-top:4px">${ownerUnitHint(owner)}</div></div><div><label>Tổ / phòng thực hiện</label><select id="wf-sub">${subOptionsHtml(owner, sub?.id)}</select></div><div><label>Hạn hoàn thành *</label><input id="wf-due" type="date" min="${today()}"${project.end ? ` max="${esc(project.end)}"` : ""}></div>${priorityField}<div class="full"><label>Kết quả / minh chứng yêu cầu</label><input id="wf-desc"></div><div class="full"><label>Phối hợp</label>${ccBoxes(owners.filter((r) => r !== role))}</div></div>
<div class="toolbar" style="margin-top:12px"><button class="btn btn-primary" ${jsCall("wfSubmitDirective", done)}>Tạo việc</button><button class="btn btn-light" ${jsCall("go", done)}>Hủy</button></div></div>`
}

function wfSubmitDirective(done: string) {
  const project = projectsView().find((p) => p.id === inputValue("wf-project"))
  void run(async () => {
    if (!project) throw new Error("Không tìm thấy dự án")
    const item = createProjectTask({
      id: newId("CD"),
      title: inputValue("wf-title"),
      owner: inputValue("wf-owner"),
      subUnit: inputValue("wf-sub") || undefined,
      project: project.id,
      wbsItem: inputValue("wf-wbs") || undefined,
      cc: checkedValues("wf-cc"),
      due: inputValue("wf-due"),
      priority: inputValue("wf-priority") as WorkItem["priority"],
      description: inputValue("wf-desc") || undefined,
    }, ctx.role(), { canCreate: canCreateTask(project, ctx.role()), owners: taskOwners(project), latest: project.end }, new Date().toISOString())
    await store.add(item)
  }, undefined, () => shell.go(done))
}

/** Deletes a task (its creator only), after confirmation; from its page, back to the project. */
function wfDelete(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item || !confirm(`Xoá việc ${item.id} • ${item.title}?`)) return
  const onPage = window.location.pathname.includes(`/viec/${encodeURIComponent(id)}`) || window.location.pathname.endsWith(`/de-xuat/${encodeURIComponent(id)}`)
  const back = item.type === "proposal" ? "projects/de-xuat" : item.project ? projectPath(item.project) : ""
  void run(() => store.remove(id, ctx.role()), undefined, onPage && back ? () => shell.go(back) : undefined)
}

// ---------- Nhiệm vụ đề xuất: a subordinate proposes, its closest superior approves.

/** Heads and staff see the proposal flow; the leader only hands work down (it approves proposals from Công việc). */
export const showsProposals = () => tierOf(ctx.role()) !== "leader"

/** The role may propose: not the leader, it has a superior and may work on tasks. */
export const canPropose = () => showsProposals() && hasPerm(ctx.perms(), "vldc-directives:update") && !!approverOf(ctx.role())

/** Form page of a new proposal, or of a returned one to correct and send again. */
export function proposalFormHtml(id = ""): string {
  const role = ctx.role()
  const back = backLink(id ? proposalPath(id) : "projects", id ? id : "Nhiệm vụ / Dự án")
  const item = id ? store.items().find((x) => x.id === id && x.type === "proposal") : undefined
  if (id && (!item || !allowedActions(item, role, ctx.perms(), store.items()).includes("resubmit"))) {
    return pageHead(back, "Sửa đề xuất") + '<div class="card mini">Đề xuất này không ở trạng thái được sửa.</div>'
  }
  const approver = item?.approver ?? approverOf(role)
  if (!item && !canPropose()) return pageHead(back, "Đề xuất nhiệm vụ") + '<div class="card mini">Bạn không có cấp trên để duyệt đề xuất.</div>'
  const returned = item ? [...item.history].reverse().find((h) => h.action === "return") : undefined
  const priority = item?.priority ?? "Trung bình"
  return `${pageHead(back, item ? `Sửa đề xuất ${item.id}` : "Đề xuất nhiệm vụ", `Người duyệt: <b>${esc(roleTitle(approver ?? ""))}</b>${personOf(approver ?? "") ? ` – ${esc(personOf(approver ?? ""))}` : ""} (cấp trên trực tiếp)`)}
${returned?.note ? `<div class="alert" style="margin-bottom:12px"><span class="dot yellow"></span><div><b>Lý do trả lại</b><div class="mini">${esc(returned.note)}</div></div></div>` : ""}
<div class="card"><div class="form-grid"><div class="full"><label>Tên nhiệm vụ *</label><input id="wf-title" value="${esc(item?.title ?? "")}"></div><div class="full"><label>Nội dung, lý do, kết quả dự kiến</label><textarea id="wf-desc" rows="3">${esc(item?.description ?? "")}</textarea></div>${projectPicker(item?.project ?? "")}<div><label>Hạn hoàn thành *</label><input id="wf-due" type="date" min="${today()}" value="${esc(item?.due ?? "")}"></div><div><label>Mức ưu tiên</label><select id="wf-priority">${["Cao", "Trung bình", "Thấp"].map((p) => `<option${p === priority ? " selected" : ""}>${p}</option>`).join("")}</select></div>${item ? '<div class="full"><label>Giải trình khi gửi lại</label><textarea id="wf-note" rows="2"></textarea></div>' : `<div class="full"><label>Phối hợp</label>${ccBoxes(BUSINESS_ROLES.filter((r) => r !== role && r !== approver))}</div>`}</div>
<div class="toolbar" style="margin-top:12px"><button class="btn btn-primary" ${jsCall("wfSubmitProposal", id)}>${item ? "Gửi lại" : "Gửi đề xuất"}</button><button class="btn btn-light" ${jsCall("go", id ? proposalPath(id) : "projects")}>Hủy</button></div></div>`
}

function wfSubmitProposal(id: string) {
  const fields = { title: inputValue("wf-title"), description: inputValue("wf-desc"), due: inputValue("wf-due"), project: inputValue("wf-project") }
  const newIdValue = id || newId("DX")
  void run(async () => {
    if (id) {
      await store.dispatch(id, "resubmit", { note: inputValue("wf-note"), proposal: fields }, ctx.role(), ctx.perms())
      return
    }
    await store.add(createProposal({
      id: newIdValue, ...fields, project: fields.project || undefined, priority: inputValue("wf-priority") as WorkItem["priority"], cc: checkedValues("wf-cc"),
    }, ctx.role(), ctx.perms(), new Date().toISOString()))
  }, undefined, () => shell.go(proposalPath(newIdValue)))
}

function wfDelegate(id: string) {
  const item = store.items().find((x) => x.id === id)
  if (!item) return
  const subs = delegatesOf(ctx.role())
  shell.openModal(`Tạo việc con • ${item.id}`, `<div class="mini">Thuộc: ${esc(item.title)}</div><div class="form-grid" style="margin-top:8px"><div class="full"><label>Nội dung công việc *</label><textarea id="wf-title" rows="2"></textarea></div><div><label>Giao cho nhân viên *</label><select id="wf-owner">${roleOptions(subs)}</select></div><div><label>Hạn hoàn thành</label><input id="wf-due" type="date" min="${today()}" max="${esc(item.due)}" value="${esc(item.due)}"></div>${priorityField}<div class="full"><label>Mô tả</label><input id="wf-desc"></div></div><button class="btn btn-primary" style="margin-top:10px" ${jsCall("wfSubmitDelegate", item.id)}>Tạo việc con</button>`)
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
    // Computed by the backend from contracts (running ones), their payments and thu khác / chi khác.
    const s = ledgerStore.summary()
    const contracts = ledgerStore.contracts().filter((c) => c.kind === "thu" && c.status !== "Dự thảo").length
    return { revenue: s.revenue, contracts, thu: s.thu, thuOther: s.thuOther, thuMonth: s.thuMonth, chi: s.chi, chiMonth: s.chiMonth, remaining: s.receivable, doneOwing: s.doneOwing }
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
    wfOpen, wfAct, wfCreateDirective, wfSubmitDirective, wfDelegate, wfSubmitDelegate, wfSubmitProposal, wfDelete,
    wfCreatePayment, wfSubmitPayment, wfResetDemo, wfNotice, wfUnitKpi, vxMultiPick,
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
