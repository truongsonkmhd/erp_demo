import Sortable from "sortablejs"
import { escapeHtml as esc, formatDate, jsCall } from "./html"
import { ROLE_TITLES, allowedActions, isClosed, isPendingProposal, isVisible, isWork, rolledUpProgress, type WorkAction } from "./rules"
import { workflowStore as store } from "./repository"
import type { WorkItem, WorkStatus } from "./types"
import {
  PROJECT_COLUMNS, PROPOSAL_COLUMNS, boardColumns, dropTargets, initials, moveHint, quickFilter, swimlanes, transitionFor,
  type BoardColumn, type Column, type QuickFilter, type Swimlane,
} from "./boardCore"
import { DIRECTIVE_STATUS_FILTERS, directiveExportRows, filterDirectives, type DirectiveStatusFilter } from "./directiveList"
import { canCreateTaskIn, canPropose, crumbsHtml, detailHtml, directiveLabels, run, showsProposals, workflowPerms, workflowRole } from "./views"
import { PROJECT_LOZENGE, approvalOf, canCreateProject, isProjectApprover, projectStateOf } from "../data/projectCore"
import { localToday, vnDate } from "../data/dates"
import { ROLE_PROFILES } from "../data/org"
import type { Project } from "../data/types"

/**
 * Nhiệm vụ / Dự án in the style of Jira: each project (and the proposals space) has a Board whose cards are dragged
 * (SortableJS) between status columns, a list (backlog) grouped by WBS item, an issue panel on the right (?selected=<id>) and an
 * issue page. The moves are the workflow actions of rules.ts (boardCore.ts maps a drop to one).
 */

type Shell = { go(path: string): void; openModal(title: string, html: string): void; closeModal(): void }
let shell: Shell = { go() {}, openModal() {}, closeModal() {} }

export type BoardTab = "board" | "danh-sach"
/** Luồng Nhiệm vụ (cấp dưới tạo, xin cấp trên duyệt) inside the Nhiệm vụ / Dự án menu, beside the projects. */
export const PROPOSAL_BASE = "projects/nhiem-vu"

/** A project, or the proposals space: where its pages live, its columns and the work it shows the role. */
type Space = { key: string; base: string; title: string; sub: string; columns: Column[]; project?: Project; items(): WorkItem[] }

/** Status filter of the Nhiệm vụ flow: all (the default) or one state. */
type TaskFilter = TaskState | "all"
type ViewState = { query: string; filter: QuickFilter; who: string; wbs: string; lane: Swimlane; status: DirectiveStatusFilter; task: TaskFilter | "" }
const freshView = (): ViewState => ({ query: "", filter: "", who: "", wbs: "", lane: "none", status: "", task: "" })
/** Filters belong to one space: opening another project starts clean. */
let view = freshView()
let viewKey = ""
/** Space and tab drawn last (search re-renders only the body; inline handlers act on it). */
let current: { space: Space; tab: BoardTab } | undefined

const today = () => localToday()
const roleTitle = (r: string) => ROLE_TITLES[r] || r
const personOf = (r: string) => ROLE_PROFILES[r]?.name ?? ""
export const projectBase = (id: string) => `projects/${encodeURIComponent(id)}`
export const issuePath = (x: WorkItem) =>
  x.type === "proposal" ? `${PROPOSAL_BASE}/${encodeURIComponent(x.id)}` : `${projectBase(x.project ?? "")}/viec/${encodeURIComponent(x.id)}`

function enterSpace(space: Space, tab: BoardTab) {
  if (viewKey !== space.key) {
    viewKey = space.key
    view = freshView()
  }
  current = { space, tab }
}

/** "VLDC-2027-001 · Đoàn ĐVL Mặt đất · Hạn 30/11/2027". */
const projectLine = (p: Project) => [p.id, p.unit, p.end ? `Hạn ${vnDate(p.end)}` : ""].filter(Boolean).join(" · ")

function projectSpace(p: Project): Space {
  return {
    key: p.id, base: projectBase(p.id), title: p.name, sub: projectLine(p), columns: PROJECT_COLUMNS, project: p,
    items: () => {
      const all = store.items()
      return all.filter((x) => isWork(x) && x.project === p.id && isVisible(x, workflowRole(), all))
    },
  }
}

const proposalSpace = (): Space => ({
  key: "nhiem-vu", base: PROPOSAL_BASE, title: "Nhiệm vụ", sub: "Cấp dưới tạo nhiệm vụ, xin cấp trên trực tiếp duyệt rồi nghiệm thu • không bắt buộc thuộc dự án",
  columns: PROPOSAL_COLUMNS,
  items: () => {
    const all = store.items()
    return all.filter((x) => x.type === "proposal" && isVisible(x, workflowRole(), all))
  },
})

/** The space's work after the search, quick filter, person and WBS item (the status filter only on the list). */
type TaskState = "pending" | "doing" | "done" | "rejected"

/** The four states of a Nhiệm vụ (older "Bị trả lại" / "Chờ duyệt" records count as waiting / under way). */
function taskState(x: WorkItem): TaskState {
  if (x.status === "Chờ duyệt đề xuất" || x.status === "Bị trả lại") return "pending"
  if (x.status === "Hoàn thành") return "done"
  return x.status === "Từ chối" ? "rejected" : "doing"
}
function taskMatches(x: WorkItem, f: TaskFilter): boolean {
  return f === "all" || taskState(x) === f
}
const TASK_STATE_LABELS: Record<TaskState, string> = { pending: "Chờ duyệt", doing: "Đang thực hiện", done: "Hoàn thành", rejected: "Từ chối" }
const TASK_FILTERS: [TaskFilter, string][] = [["all", "Tất cả"], ...(Object.entries(TASK_STATE_LABELS) as [TaskFilter, string][])]

const taskFilterOf = (): TaskFilter => view.task || "all"

function filteredItems(space: Space, tab: BoardTab): WorkItem[] {
  const all = store.items()
  if (!space.project) {
    const f = taskFilterOf()
    return filterDirectives(space.items(), all, view.query, "", today(), directiveLabels).filter((x) => taskMatches(x, f))
  }
  const status = tab === "danh-sach" ? view.status : ""
  let items = filterDirectives(space.items(), all, view.query, status, today(), directiveLabels)
  items = quickFilter(items, view.filter, workflowRole(), today())
  if (view.who) items = items.filter((x) => x.owner === view.who)
  if (view.wbs) items = items.filter((x) => x.wbsItem === view.wbs)
  return items
}

const filtering = () => !!(view.query.trim() || view.filter || view.who || view.wbs || view.status)

// ---------- Small parts


const LOZENGE: Partial<Record<WorkStatus, string>> = {
  "Mới giao": "new", "Đang thực hiện": "doing", "Chờ duyệt": "review", "Hoàn thành": "done",
  "Chờ duyệt đề xuất": "proposed", "Bị trả lại": "returned", "Từ chối": "rejected",
}
const TASK_LOZENGE: Record<TaskState, string> = { pending: "proposed", doing: "doing", done: "done", rejected: "rejected" }
const lozenge = (x: WorkItem) => x.type === "proposal"
  ? `<span class="vx-jira-lozenge l-${TASK_LOZENGE[taskState(x)]}">${TASK_STATE_LABELS[taskState(x)]}</span>`
  : `<span class="vx-jira-lozenge l-${LOZENGE[x.status] ?? "new"}">${esc(x.status)}</span>`

const AVATAR_COLORS = 6
function avatar(role: string, size = ""): string {
  const name = personOf(role) || roleTitle(role)
  const hue = [...role].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % AVATAR_COLORS
  return `<span class="vx-jira-avatar a-${hue}${size ? ` ${size}` : ""}" title="${esc(`${roleTitle(role)}${personOf(role) ? ` – ${personOf(role)}` : ""}`)}">${esc(initials(name))}</span>`
}

const dueBadge = (x: WorkItem) => {
  const late = !isClosed(x) && x.due < today()
  return `<span class="vx-jira-due${late ? " late" : ""}">${formatDate(x.due)}</span>`
}


/** WBS items of the space's project as [key, name]. */
const wbsPairs = (space: Space): [string, string][] => (space.project?.wbs ?? []).map((w, i) => [w.id ?? String(i), w.name])

// ---------- Header, tabs and toolbar

function tabsOf(space: Space): [string, string][] {
  return space.project ? [["board", "Board"], ["danh-sach", "Danh sách"], ["tong-quan", "Tổng quan"]] : [["board", "Board"], ["danh-sach", "Danh sách"]]
}

/** The project's approval state: the approver decides here; Phòng Kỹ thuật corrects a rejected project and sends it again. */
function approvalBanner(p: Project): string {
  const role = workflowRole()
  const state = approvalOf(p)
  if (p.deleteRequest) {
    const req = p.deleteRequest
    const act = isProjectApprover(role)
      ? `<button class="btn btn-danger" ${jsCall("projectConfirmDelete", p.id, "yes")}>Xác nhận xoá</button><button class="btn btn-light" ${jsCall("projectConfirmDelete", p.id, "no")}>Không xoá</button>`
      : req.by === role ? `<button class="btn btn-light" ${jsCall("projectCancelDelete", p.id)}>Huỷ đề nghị</button>` : ""
    return `<div class="vx-jira-approval rejected"><div><b>${esc(roleTitle(req.by))} đề nghị xoá dự án – chờ Liên đoàn trưởng xác nhận</b><div class="mini">Lý do: ${esc(req.reason)}</div></div>${act}</div>`
  }
  const refusal = p.deleteRefusal && canCreateProject(role)
    ? `<div class="vx-jira-approval pending"><div><b>Liên đoàn trưởng không đồng ý xoá dự án</b><div class="mini">${esc(p.deleteRefusal)}</div></div></div>`
    : ""
  if (state === "Đã duyệt") return refusal
  if (state === "Chờ duyệt") {
    const decide = isProjectApprover(role)
      ? `<button class="btn btn-ok" ${jsCall("projectDecide", p.id, "Đã duyệt")}>Phê duyệt</button><button class="btn btn-light" ${jsCall("projectDecide", p.id, "Từ chối")}>Từ chối</button>`
      : ""
    return `<div class="vx-jira-approval pending"><div><b>Chờ Liên đoàn trưởng phê duyệt</b><div class="mini">Các phòng tham gia thấy dự án và Phòng Kỹ thuật tạo việc sau khi dự án được phê duyệt.</div></div>${decide}</div>`
  }
  const fix = canCreateProject(role) ? `<button class="btn btn-primary" ${jsCall("projectForm", p.id)}>Sửa và trình lại</button>` : ""
  return `<div class="vx-jira-approval rejected"><div><b>Liên đoàn trưởng không phê duyệt</b><div class="mini">Lý do: ${esc(p.approvalNote ?? "–")}</div></div>${fix}</div>`
}

function headerHtml(space: Space, tab: string): string {
  const create = space.project
    ? canCreateTaskIn(space.project) ? `<button class="btn btn-primary" ${jsCall("go", `${space.base}/giao-viec`)}>+ Tạo việc</button>` : ""
    : canPropose() ? `<button class="btn btn-primary" ${jsCall("go", `${PROPOSAL_BASE}/moi`)}>+ Tạo nhiệm vụ</button>` : ""
  const tabs = tabsOf(space).map(([slug, label]) => `<button class="vx-jira-tab${slug === tab ? " active" : ""}" ${jsCall("go", `${space.base}/${slug}`)}>${label}</button>`).join("")
  const state = space.project ? ` <span class="vx-jira-lozenge l-${PROJECT_LOZENGE[projectStateOf(space.project)]}">${esc(projectStateOf(space.project))}</span>` : ""
  const crumbs = space.project ? crumbsHtml([["Dự án", "projects"], [space.project.name]]) : crumbsHtml([["Nhiệm vụ / Dự án", "projects"], ["Nhiệm vụ"]])
  return `<div class="vx-jira-head">${crumbs}
<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(space.title)}${state}</h2><div class="mini">${esc(space.sub)}</div></div>${create}</div>
${space.project ? approvalBanner(space.project) : ""}<nav class="vx-jira-tabs">${tabs}</nav></div>`
}

/** Phòng Kỹ thuật manages project boards: it drags any task to any column (the others drag only work given to them). */
const freeMoves = (space?: Space) => !!space?.project && canCreateProject(workflowRole())

/** Header of a project page (the Tổng quan tab adds its own body below). */
export function projectHeaderHtml(p: Project, tab: string): string {
  const space = projectSpace(p)
  enterSpace(space, "board")
  return headerHtml(space, tab)
}

/** Project toolbar: search; the list adds its status filter (on the board the columns are the states). */
function toolbarHtml(space: Space, tab: BoardTab): string {
  const list = tab === "board"
    ? ""
    : `<select onchange="boardStatus(this.value)">${DIRECTIVE_STATUS_FILTERS.map(([v, l]) => `<option value="${v}"${v === view.status ? " selected" : ""}>${v ? l : "Tất cả"}</option>`).join("")}</select>`
  const clear = filtering() ? '<button class="vx-jira-clear" onclick="boardClear()">Xoá lọc</button>' : ""
  return `<div class="vx-jira-toolbar"><input id="vx-jira-q" class="vx-jira-search" placeholder="Tìm việc…" value="${esc(view.query)}" oninput="boardSearch(this.value)">${list}${clear}</div>`
}

// ---------- Board

function cardHtml(x: WorkItem, space: Space, all: WorkItem[]): string {
  const role = workflowRole(), perms = workflowPerms()
  // Every card can be picked up; one the role cannot move shows a "not allowed" cursor and explains itself on drop.
  const locked = dropTargets(x, space.columns, role, perms, all, freeMoves(space)).length === 0
  const late = !isClosed(x) && x.due < today()
  return `<div class="vx-jira-card${late ? " is-late" : ""}${locked ? " is-locked" : ""}" data-id="${esc(x.id)}"${locked ? ' title="Bạn chỉ kéo thả việc được giao cho mình – thả vào cột để xem ai được chuyển"' : ""} ${jsCall("boardSelect", x.id)}>
<div class="vx-jira-card-title">${esc(x.title)}</div>
<div class="vx-jira-card-foot">${avatar(x.owner)}<span class="vx-jira-card-who">${esc(personOf(x.owner) || roleTitle(x.owner))}</span><span style="flex:1"></span>${dueBadge(x)}</div></div>`
}

function columnHtml(c: BoardColumn, space: Space, all: WorkItem[]): string {
  const more = c.hidden ? `<a class="vx-jira-more" href="javascript:void 0" ${jsCall("boardOlder", c.column.status)}>+ ${c.hidden} việc cũ hơn – xem Danh sách</a>` : ""
  return `<div class="vx-jira-col${c.column.collapsed && !c.items.length ? " is-collapsed" : ""}" data-status="${esc(c.column.status)}">
<div class="vx-jira-col-head"><span>${esc(c.column.title)}</span><b>${c.items.length}</b></div><div class="vx-jira-col-body">${c.items.map((x) => cardHtml(x, space, all)).join("")}${more}</div></div>`
}

function boardHtml(space: Space, items: WorkItem[]): string {
  const all = store.items()
  const lanes = swimlanes(items, view.lane, { wbs: wbsPairs(space), owner: (r) => `${roleTitle(r)}${personOf(r) ? ` – ${personOf(r)}` : ""}` })
  const empty = !space.items().length ? `<div class="vx-jira-empty">${space.project ? "Dự án chưa có việc giao." : "Chưa có nhiệm vụ."}</div>` : ""
  const rows = (lanes.length ? lanes : [{ key: "", title: "", items: [] }]).map((l) => {
    const head = l.title ? `<div class="vx-jira-lane"><b>${esc(l.title)}</b> <span class="mini">${l.items.length} việc</span></div>` : ""
    return `${head}<div class="vx-jira-board" style="--cols:${space.columns.length}">${boardColumns(l.items, space.columns, today()).map((c) => columnHtml(c, space, all)).join("")}</div>`
  }).join("")
  return empty + rows
}

// ---------- List (backlog)

const LIST_HEAD = "<tr><th>Mã</th><th>Nội dung</th><th>Trạng thái</th><th>Người làm</th><th>Hạn</th><th>Tiến độ</th></tr>"

function rowHtml(x: WorkItem, all: WorkItem[], depth: number): string {
  const indent = depth ? `<span class="vx-jira-indent" style="width:${depth * 18}px"></span>↳ ` : ""
  return `<tr class="vx-jira-row" ${jsCall("boardSelect", x.id)}><td class="vx-jira-key">${esc(x.id)}</td><td>${indent}${esc(x.title)}</td><td>${lozenge(x)}</td><td>${esc(personOf(x.owner) || roleTitle(x.owner))}</td><td>${dueBadge(x)}</td><td>${isPendingProposal(x) ? "–" : `${rolledUpProgress(x, all)}%`}</td></tr>`
}

function treeHtml(roots: WorkItem[], items: WorkItem[], all: WorkItem[], depth: number): string {
  return roots.map((x) => rowHtml(x, all, depth) + treeHtml(items.filter((k) => k.parentId === x.id).sort((a, b) => a.due.localeCompare(b.due)), items, all, depth + 1)).join("")
}

/** Project work by deadline, sub-tasks under their parent (a flat list while searching or filtering). */
function listHtml(space: Space, items: WorkItem[]): string {
  const all = store.items()
  const sorted = [...items].sort((a, b) => a.due.localeCompare(b.due))
  const empty = (text: string) => `<tr><td colspan="6" class="mini">${text}</td></tr>`
  if (filtering()) {
    const count = `<div class="mini" style="margin-bottom:6px">${items.length} / ${space.items().length} việc khớp</div>`
    return `${count}<table class="vx-jira-list">${LIST_HEAD}${sorted.map((x) => rowHtml(x, all, 0)).join("") || empty("Không có việc nào.")}</table>`
  }
  const roots = sorted.filter((x) => !x.parentId || !items.some((p) => p.id === x.parentId))
  return `<table class="vx-jira-list">${LIST_HEAD}${treeHtml(roots, items, all, 0) || empty("Dự án chưa có việc giao.")}</table>`
}

// ---------- Issue panel and page

function whereLine(x: WorkItem): string {
  const p = x.project ? directiveLabels.project(x.project) : ""
  const wbs = x.project && x.wbsItem && current?.space.project?.id === x.project ? wbsPairs(current.space).find(([k]) => k === x.wbsItem)?.[1] : ""
  const sub = directiveLabels.subUnit(x.subUnit)
  return [p ? `Dự án <a href="javascript:void 0" ${jsCall("go", projectBase(x.project ?? ""))}><b>${esc(p)}</b></a>` : x.type === "proposal" ? "Không thuộc dự án" : "", wbs ? `hạng mục <b>${esc(wbs)}</b>` : "", sub ? `tổ <b>${esc(sub)}</b>` : ""].filter(Boolean).join(" • ")
}

function panelHtml(space: Space, tab: BoardTab): string {
  const id = new URLSearchParams(window.location.search).get("selected")
  if (!id) return ""
  const all = store.items()
  const x = all.find((w) => w.id === id)
  if (!x || !isVisible(x, workflowRole(), all)) return ""
  const close = `${space.base}/${tab}`
  return `<div class="vx-jira-backdrop" ${jsCall("go", close)}></div><aside class="vx-jira-drawer"><div class="vx-jira-drawer-head"><span class="mini">${esc(x.id)}</span>${lozenge(x)}<span style="flex:1"></span><button class="btn btn-light" ${jsCall("go", issuePath(x))}>Mở toàn trang</button><button class="btn btn-light" title="Đóng" ${jsCall("go", close)}>✕</button></div>
<h3 class="vx-jira-issue-title">${esc(x.title)}</h3>${detailHtml(x, true)}</aside>`
}

/** Full page of one work item (or proposal): /projects/<id>/viec/<item> or /projects/nhiem-vu/<item>. */
export function issuePageHtml(id: string): string {
  const all = store.items()
  const x = all.find((w) => w.id === id)
  if (!x || !isVisible(x, workflowRole(), all)) {
    return `<div class="vx-jira-head">${crumbsHtml([["Dự án", "projects"], [id]])}<div class="mini" style="margin-top:8px">Không tìm thấy việc ${esc(id)}.</div></div>`
  }
  // Dự án › <project> › <work>, or Nhiệm vụ › <task>.
  const project = x.project ? directiveLabels.project(x.project).replace(`${x.project} – `, "") : ""
  const levels: [string, string?][] = x.type === "proposal"
    ? [["Nhiệm vụ", PROPOSAL_BASE], [x.id]]
    : [["Dự án", "projects"], ...(x.project ? [[project, projectBase(x.project)] as [string, string]] : []), [x.id]]
  return `<div class="vx-jira-head">${crumbsHtml(levels)}
<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(x.title)} ${lozenge(x)}</h2>${x.project ? "" : `<div class="mini">${whereLine(x)}</div>`}</div></div></div>
<div class="card">${detailHtml(x, true)}</div>`
}

// ---------- Spaces

function bodyHtml(space: Space, tab: BoardTab): string {
  const items = filteredItems(space, tab)
  if (tab === "board") return boardHtml(space, items)
  return space.project ? listHtml(space, items) : taskListHtml(items)
}

// ---------- Luồng Nhiệm vụ: a list with the decisions on each row (the board is the other view)

const QUICK: Partial<Record<WorkAction, string>> = { endorse: "Duyệt", reject: "Từ chối", submit: "Hoàn thành", resubmit: "Sửa", approve: "Nghiệm thu", return: "Trả lại" }

/** The decisions the role can take on the row, as buttons that do not open the panel. */
function quickButtons(x: WorkItem, all: WorkItem[]): string {
  return allowedActions(x, workflowRole(), workflowPerms(), all).filter((a) => QUICK[a]).map((a) =>
    `<button class="btn ${a === "endorse" || a === "approve" || a === "submit" ? "btn-primary" : "btn-light"} vx-quick" data-arg0="${esc(x.id)}" data-arg1="${a}" onclick="event.stopPropagation();taskQuickAct(this.dataset.arg0,this.dataset.arg1)">${QUICK[a]}</button>`,
  ).join("")
}

function taskListHtml(items: WorkItem[]): string {
  const all = store.items()
  const rows = [...items].sort((a, b) => a.due.localeCompare(b.due)).map((x) => `<tr class="vx-jira-row" ${jsCall("boardSelect", x.id)}>
<td class="vx-jira-key">${esc(x.id)}</td><td>${esc(x.title)}${x.project ? `<div class="mini">${esc(directiveLabels.project(x.project))}</div>` : ""}</td>
<td><span class="vx-jira-who">${avatar(x.createdBy)}${esc(personOf(x.createdBy) || roleTitle(x.createdBy))}</span></td><td class="mini">${esc(roleTitle(x.approver ?? ""))}</td>
<td>${dueBadge(x)}</td><td>${lozenge(x)}</td><td class="vx-quick-cell">${quickButtons(x, all)}</td></tr>`).join("")
  return `<table class="vx-jira-list"><tr><th>Mã</th><th>Nhiệm vụ</th><th>Người tạo</th><th>Người duyệt</th><th>Hạn</th><th>Trạng thái</th><th></th></tr>${rows || '<tr><td colspan="7" class="mini">Không có nhiệm vụ nào ở mục này.</td></tr>'}</table>`
}

function taskSpaceHtml(space: Space, tab: BoardTab): string {
  const f = taskFilterOf()
  const items = space.items()
  const create = canPropose() ? `<button class="btn btn-primary" ${jsCall("go", `${PROPOSAL_BASE}/moi`)}>+ Tạo nhiệm vụ</button>` : ""
  const views = `<div class="vx-flow-view">${([["danh-sach", "Danh sách"], ["board", "Board"]] as [BoardTab, string][]).map(([t, l]) => `<button class="${t === tab ? "active" : ""}" ${jsCall("go", `${PROPOSAL_BASE}/${t}`)}>${l}</button>`).join("")}</div>`
  const status = `<select class="vx-filter-select" onchange="taskFilter(this.value)">${TASK_FILTERS.map(([k, l]) => `<option value="${k}"${k === f ? " selected" : ""}>${l}</option>`).join("")}</select>`
  return `${flowBarHtml("nhiem-vu", create)}<div class="vx-jira-toolbar"><input id="vx-jira-q" class="vx-jira-search" placeholder="Tìm nhiệm vụ…" value="${esc(view.query)}" oninput="boardSearch(this.value)">${status}${views}</div><div id="vx-jira-body">${bodyHtml(space, tab)}</div>${panelHtml(space, tab)}`
}

function spaceHtml(space: Space, tab: BoardTab): string {
  enterSpace(space, tab)
  if (!space.project) return taskSpaceHtml(space, tab)
  return `${headerHtml(space, tab)}${toolbarHtml(space, tab)}<div id="vx-jira-body">${bodyHtml(space, tab)}</div>${panelHtml(space, tab)}`
}

export const projectSpaceHtml = (p: Project, tab: BoardTab) => spaceHtml(projectSpace(p), tab)

/** Proposals space (heads and staff; the leader approves from Công việc). */
export function proposalSpaceHtml(tab: BoardTab): string {
  if (!showsProposals()) return `<div class="vx-jira-head">${crumbsHtml([["Nhiệm vụ / Dự án", "projects"], ["Nhiệm vụ"]])}<div class="mini" style="margin-top:8px">Lãnh đạo duyệt đề xuất từ menu Công việc.</div></div>`
  return spaceHtml(proposalSpace(), tab)
}

/**
 * Bar heading the Nhiệm vụ / Dự án menu: a switch between its two flows, Dự án (work handed down: Phòng Kỹ thuật makes
 * projects, the federation head approves them) and Nhiệm vụ (a subordinate asks its superior), then the flow's actions.
 * The leader only hands work down, so it gets no switch.
 */
export function flowBarHtml(active: "du-an" | "nhiem-vu", actions = ""): string {
  const seg = (key: string, path: string, label: string, hint: string, badge = "") =>
    `<button class="${key === active ? "active" : ""}" title="${esc(hint)}" ${jsCall("go", path)}>${label}${badge}</button>`
  const waiting = showsProposals() ? quickFilter(proposalSpace().items(), "review", workflowRole(), today()).length : 0
  const flows = showsProposals()
    ? `<div class="vx-flow-seg">${seg("du-an", "projects", "Dự án", "Cấp trên giao việc cho cấp dưới – Phòng Kỹ thuật lập dự án, Liên đoàn trưởng duyệt")}${seg("nhiem-vu", PROPOSAL_BASE, "Nhiệm vụ", "Cấp dưới tạo nhiệm vụ, xin cấp trên trực tiếp duyệt", waiting ? `<span class="vx-flow-count">${waiting}</span>` : "")}</div>`
    : ""
  return `<div class="vx-flow-bar">${flows}<span style="flex:1"></span>${actions}</div>`
}

/** Asks the reason of a return or a rejection, then runs it (a drop on the board, or a row button). */
function askReason(item: WorkItem, action: WorkAction) {
  const title = action === "reject" ? "Từ chối" : "Trả lại"
  shell.openModal(`${title} • ${item.id}`, `<div class="mini" style="margin-bottom:8px">${esc(item.title)}</div><label>Lý do *</label><textarea id="vx-move-note" rows="3"></textarea><div class="toolbar" style="margin-top:10px"><button class="btn btn-primary" ${jsCall("boardConfirmMove", item.id, action)}>${title}</button><button class="btn btn-light" onclick="closeModal()">Hủy</button></div>`)
}

/** A decision taken from a row of the Nhiệm vụ list. */
function taskQuickAct(id: string, action: WorkAction) {
  const item = store.items().find((x) => x.id === id)
  if (!item) return
  if (action === "resubmit") return shell.go(`${PROPOSAL_BASE}/${encodeURIComponent(id)}/sua`)
  if (action === "return" || action === "reject") return askReason(item, action)
  void run(() => store.dispatch(id, action, {}, workflowRole(), workflowPerms()))
}

// ---------- Handlers

function redraw() {
  if (!current) return
  const el = document.getElementById("vx-jira-body")
  if (el) el.innerHTML = bodyHtml(current.space, current.tab)
  mountBoard()
}

/** Filters change the toolbar too, so the whole space is drawn again in place (the URL, and an open panel, stay). */
function redrawAll() {
  const el = document.getElementById("content")
  if (current && el) el.innerHTML = spaceHtml(current.space, current.tab)
  mountBoard()
}

// ---------- Drag and drop (SortableJS: mouse and touch, animation, auto-scroll near the edges)

/** Columns the dragged item may land on now (the others still take the drop, to explain why nothing happens). */
function dragTargets(id: string): Set<string> {
  const all = store.items()
  const item = all.find((x) => x.id === id)
  return item ? new Set(dropTargets(item, current?.space.columns ?? [], workflowRole(), workflowPerms(), all, freeMoves(current?.space))) : new Set()
}

const columnsOnPage = () => [...document.querySelectorAll<HTMLElement>(".vx-jira-col")]
const statusOf = (list: HTMLElement) => (list.closest<HTMLElement>(".vx-jira-col")?.dataset.status ?? "") as WorkStatus

let sortables: Sortable[] = []
let targets = new Set<string>()

function clearTargets() {
  columnsOnPage().forEach((col) => col.classList.remove("is-drop-ok", "is-drop-no"))
}

/**
 * Makes the board's columns sortable lists of one group. Cards never reorder inside a column: a drop on another
 * column runs the workflow action of that move (or says why it cannot), and the card goes back until the data
 * re-renders the board.
 */
export function mountBoard() {
  sortables.forEach((s) => s.destroy())
  sortables = [...document.querySelectorAll<HTMLElement>(".vx-jira-col-body")].map((list) => Sortable.create(list, {
    group: "vx-board",
    sort: false,
    draggable: ".vx-jira-card",
    // An empty column takes the card from well around it, not only right on its edge.
    emptyInsertThreshold: 60,
    animation: 150,
    // Touch: hold briefly to drag, so a swipe still scrolls the board and a tap opens the panel.
    delay: 180,
    delayOnTouchOnly: true,
    ghostClass: "vx-jira-ghost",
    chosenClass: "vx-jira-chosen",
    dragClass: "vx-jira-drag",
    onStart: (evt) => {
      targets = dragTargets(evt.item.dataset.id ?? "")
      columnsOnPage().forEach((col) => {
        const status = col.dataset.status ?? ""
        if (status === statusOf(evt.from)) return
        col.classList.add(targets.has(status) ? "is-drop-ok" : "is-drop-no")
      })
    },
    onEnd: (evt) => {
      clearTargets()
      if (evt.to === evt.from) return
      // The board shows the data: put the card back and let the action (and its re-render) move it.
      evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex ?? 0] ?? null)
      dropOn(evt.item.dataset.id ?? "", statusOf(evt.to))
    },
  }))
}

function dropOn(id: string, status: WorkStatus) {
  const all = store.items()
  const item = all.find((x) => x.id === id)
  if (!item || item.status === status) return
  const role = workflowRole(), perms = workflowPerms()
  const free = freeMoves(current?.space)
  const move = transitionFor(item, status, role, perms, all, free)
  if (!move) {
    const why = moveHint(item, status, role, perms, all, free)
    if (why) alert(why)
    return
  }
  if (move.edit) return shell.go(`${PROPOSAL_BASE}/${encodeURIComponent(item.id)}/sua`)
  if (move.needsNote) return askReason(item, move.action)
  if (move.action === "move") return void run(() => store.moveTo(item.id, status, role, free))
  void run(() => store.dispatch(item.id, move.action, {}, role, perms))
}

function boardConfirmMove(id: string, action: string) {
  const note = (document.getElementById("vx-move-note") as HTMLTextAreaElement | null)?.value ?? ""
  void run(() => store.dispatch(id, action as never, { note }, workflowRole(), workflowPerms()))
}

async function boardExport() {
  if (!current) return
  const all = store.items()
  const rows = directiveExportRows(filteredItems(current.space, "danh-sach").sort((a, b) => a.due.localeCompare(b.due)), all, directiveLabels)
  if (!rows.length) return alert("Không có việc nào để xuất.")
  const XLSX = await import("xlsx")
  const sheet = XLSX.utils.json_to_sheet(rows)
  sheet["!cols"] = Object.keys(rows[0]).map((k) => ({ wch: k === "Nội dung" ? 50 : k === "Dự án" ? 34 : 18 }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, "Việc")
  XLSX.writeFile(book, `viec-${current.space.key}-${today()}.xlsx`)
}

export function installBoard(nextShell: Shell) {
  shell = nextShell
  Object.assign(window, {
    boardConfirmMove, boardExport, taskQuickAct,
    taskFilter: (f: TaskFilter) => {
      view.task = f
      redrawAll()
    },
    boardSelect: (id: string) => current && shell.go(`${current.space.base}/${current.tab}?selected=${encodeURIComponent(id)}`),
    /** Only the cards/rows re-render while typing, so the search box keeps focus. */
    boardSearch: (q: string) => {
      view.query = q
      redraw()
    },
    boardFilter: (f: QuickFilter) => {
      view.filter = view.filter === f ? "" : f
      redrawAll()
    },
    boardWho: (role: string) => {
      view.who = view.who === role ? "" : role
      redrawAll()
    },
    boardWbs: (key: string) => {
      view.wbs = key
      redrawAll()
    },
    boardLane: (lane: Swimlane) => {
      view.lane = lane
      redrawAll()
    },
    boardStatus: (status: DirectiveStatusFilter) => {
      view.status = status
      redrawAll()
    },
    boardClear: () => {
      Object.assign(view, { query: "", filter: "", who: "", wbs: "", status: "" })
      redrawAll()
    },
    /** "+ n việc cũ hơn": the list view with that status. */
    boardOlder: (status: WorkStatus) => {
      if (!current) return
      view.status = status === "Hoàn thành" || status === "Từ chối" ? "done" : ""
      shell.go(`${current.space.base}/danh-sach`)
    },
  })
}
