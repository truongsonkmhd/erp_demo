import { escapeHtml as esc, formatDate, jsCall } from "../workflow/html"
import { projectApprovalRows, projectCrRows, projectDeleteRows } from "./projectCore"
import { workflowStore } from "../workflow/repository"
import { localToday } from "./dates"
import {
  OTHER_GROUP, applyFilter, inboxCounts, inboxRows, inboxTree, sortRows,
  type InboxFilter, type InboxRow, type InboxScope,
} from "./inboxCore"
import { vldcData } from "./registry"
import { managesAllUnits } from "./access"

/**
 * Công việc (inbox): everything waiting on the role, as folders: each project opens to its work, a Nhiệm vụ stands beside
 * the projects, the rest is under "Việc khác"; a search box and one filter above, the most urgent first.
 */

type Ctx = { role(): string }

/** opened: the folders (project ids, "Việc khác") open; all start closed. */
const state = { filter: "mine" as InboxFilter, scope: "mine" as InboxScope, query: "", opened: new Set<string>() }
let ctx: Ctx = { role: () => "" }
const today = () => localToday()
const isLeader = () => managesAllUnits(ctx.role())
const content = () => document.getElementById("content")

/** Work meant for one tổ/phòng shows it next to the owner ("Trưởng đơn vị › Tổ đo điện"). */
function withSubUnit(row: InboxRow): InboxRow {
  if (row.kind !== "work") return row
  const id = workflowStore.items().find((x) => x.id === row.id)?.subUnit
  const sub = id ? vldcData.get("subUnits").find((s) => s.id === id) : undefined
  return sub ? { ...row, owner: `${row.owner} › ${sub.name}` } : row
}

/** Work items and project decisions only, both on the backend API (the Firebase task, document and topic lists are left out). */
function rows(): InboxRow[] {
  const scope = isLeader() ? state.scope : "mine"
  return [
    ...inboxRows(workflowStore.items(), [], ctx.role(), scope, today()).map(withSubUnit),
    // Decisions on a project sit in its folder.
    ...[
      ...projectApprovalRows(vldcData.get("projects"), ctx.role(), today()),
      ...projectDeleteRows(vldcData.get("projects"), ctx.role(), today()),
      ...projectCrRows(vldcData.get("projects"), ctx.role(), today()),
    ].map((r) => ({ ...r, project: r.id })),
  ]
}

const PRIORITY_DOT: Record<string, string> = { Cao: "red", "Trung bình": "yellow", Thấp: "blue" }
const statusCls = (s: string) => (/Quá hạn|trả|Bị/.test(s) ? "b-danger" : /Chờ|Đang|trình/.test(s) ? "b-warn" : /Mới/.test(s) ? "b-info" : "b-ok")

function rowHtml(r: InboxRow): string {
  return `<div class="vx-inbox-row${r.overdue ? " is-overdue" : ""}">
<span class="dot ${PRIORITY_DOT[r.priority] ?? "blue"}" title="Ưu tiên ${esc(r.priority)}"></span>
<div class="vx-inbox-main"><div><b>${esc(r.id)}</b> <span class="mini">${esc(r.type)}</span>${r.mine ? "" : ' <span class="badge b-info">Phối hợp</span>'}</div><div class="vx-inbox-title">${esc(r.title)}</div><div class="mini">${esc(r.source)} • ${esc(r.from)}${isLeader() && state.scope === "all" ? ` → ${esc(r.owner)}` : ""}</div></div>
<span class="badge ${statusCls(r.status)}">${esc(r.status)}</span>
<div class="vx-inbox-sla"><span class="badge ${r.overdue ? "b-danger" : r.slaText === "Hôm nay" ? "b-warn" : "b-info"}">${esc(r.slaText)}</span>${r.due ? `<div class="mini">${formatDate(r.due)}</div>` : ""}</div>
<button class="btn ${r.mine ? "btn-primary" : "btn-light"}" ${jsCall(r.open, r.id)}>${r.mine ? "Xử lý" : "Xem"}</button>
</div>`
}

/** A folder's title: the project's name and code, or "Việc khác". */
function folderTitle(key: string): string {
  if (key === OTHER_GROUP) return "<b>Việc khác</b>"
  const p = vldcData.get("projects").find((x) => x.id === key)
  return `<b>${esc(p?.name ?? key)}</b> <span class="mini">${esc(key)}</span>`
}

function listHtml(): string {
  const t = today()
  const visible = sortRows(applyFilter(rows(), state.filter, t, state.query), "due")
  if (!visible.length) return '<div class="mini" style="padding:18px 4px">Không có việc phù hợp bộ lọc.</div>'
  // While searching every folder is open, so the matches show.
  const searching = !!state.query.trim()
  return inboxTree(visible).map((e) => {
    if (e.kind === "row") return `<div class="vx-inbox-group vx-inbox-solo"><div class="vx-inbox-solo-tag">Nhiệm vụ</div>${rowHtml(e.row)}</div>`
    const open = searching || state.opened.has(e.key)
    const late = e.rows.filter((r) => r.overdue).length
    return `<div class="vx-inbox-group"><button class="vx-inbox-group-head${e.key === OTHER_GROUP ? "" : " project"}" ${jsCall("inboxToggleGroup", e.key)}><span>${open ? "▾" : "▸"} ${folderTitle(e.key)}</span><span>${late ? `<span class="badge b-danger">${late} quá hạn</span> ` : ""}<span class="badge b-info">${e.rows.length} việc</span></span></button>${open ? `<div class="vx-inbox-folder">${e.rows.map(rowHtml).join("")}</div>` : ""}</div>`
  }).join("")
}

/** The filters of the list, in the one select (no counts): what waits on the role first. */
const FILTERS: [InboxFilter, string][] = [["mine", "Cần tôi xử lý"], ["overdue", "Quá hạn"], ["today", "Đến hạn hôm nay"], ["cc", "Tôi phối hợp"], ["all", "Tất cả"]]

/**
 * At a glance: four counts (each also a filter), then search and the filter select (the leader also picks its own work or
 * the whole federation), then the folders.
 */
function pageHtml(): string {
  const all = rows()
  const c = inboxCounts(all, today())
  const tile = (f: InboxFilter, label: string, n: number, cls: string) =>
    `<button class="vx-inbox-chip ${cls}${state.filter === f ? " active" : ""}" ${jsCall("inboxFilter", f)}><b>${n}</b><span>${label}</span></button>`
  const tiles = `<div class="vx-inbox-chips vx-inbox-stats">${tile("mine", "Cần tôi xử lý", c.mine, "blue")}${tile("overdue", "Quá hạn", c.overdue, "red")}${tile("today", "Đến hạn hôm nay", c.today, "yellow")}${tile("cc", "Tôi phối hợp", c.cc, "gray")}</div>`
  const scope = isLeader()
    ? `<div class="vx-flow-view">${(["mine", "all"] as InboxScope[]).map((s) => `<button class="${state.scope === s ? "active" : ""}" ${jsCall("inboxScope", s)}>${s === "mine" ? "Của tôi" : "Toàn Liên đoàn"}</button>`).join("")}</div>`
    : ""
  const filter = `<select class="vx-filter-select" onchange="inboxFilter(this.value)">${FILTERS.map(([f, l]) => `<option value="${f}"${f === state.filter ? " selected" : ""}>${l}</option>`).join("")}</select>`
  return `${tiles}<div class="vx-jira-toolbar"><input id="inboxq" class="vx-jira-search" placeholder="Tìm mã, nội dung…" value="${esc(state.query)}" oninput="inboxSearch(this.value)">${filter}${scope}</div>
<div class="card"><div id="inboxList">${listHtml()}</div></div>`
}

function rerender() {
  const el = content()
  if (el) el.innerHTML = pageHtml()
}

/** Only the list re-renders while typing, so the search box keeps focus. */
function inboxSearch(q: string) {
  state.query = q
  const el = document.getElementById("inboxList")
  if (el) el.innerHTML = listHtml()
}

export function installInboxPage(render: Record<string, () => void>, nextCtx: Ctx) {
  ctx = nextCtx
  render.action = rerender
  Object.assign(window, {
    inboxSearch,
    inboxFilter: (f: InboxFilter) => { state.filter = f; rerender() },
    // Switching to the whole federation shows everything; back to "mine" shows what awaits the leader.
    inboxScope: (s: InboxScope) => { state.scope = s; state.filter = s === "all" ? "all" : "mine"; rerender() },
    inboxToggleGroup: (key: string) => {
      if (state.opened.has(key)) state.opened.delete(key)
      else state.opened.add(key)
      rerender()
    },
  })
}
