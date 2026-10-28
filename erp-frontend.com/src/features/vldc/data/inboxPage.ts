import { escapeHtml as esc, formatDate, jsCall, pagerHtml } from "../workflow/html"
import { managesAllUnits } from "./access"
import { localToday } from "./dates"
import { rowLabel, slaText, statusLabel } from "./myWorkCore"
import { WORK_TOPICS, myWorkApi, orgApi, type MyWork, type MyWorkRow, type WorkEntry } from "./workApi"
import { entryStateHtml, onWorkUpdate, workCache } from "./workStore"

/**
 * Công việc on the my-work API. "Của tôi": what waits on the user (approvals, tasks to do or accept, missions) and what it
 * takes part in, as folders (a project opens to its rows; a Nhiệm vụ stands beside the projects). The federation head
 * also has "Toàn Liên đoàn": every running project and open mission, to follow only. Ten entries a page.
 */

type Ctx = { role(): string }
type Tab = "mine" | "all"
type MineFilter = "mine" | "overdue" | "today" | "cc" | "all"
type FederationStatus = "" | "IN_PROGRESS" | "OVERDUE" | "AT_RISK" | "PENDING"

const state = {
  tab: "mine" as Tab, filter: "mine" as MineFilter, status: "" as FederationStatus, departmentId: "", query: "", pageNo: 1,
  /** Folders (project codes) open; all start closed. */
  opened: new Set<string>(),
}
let ctx: Ctx = { role: () => "" }
let searchTimer: ReturnType<typeof setTimeout> | undefined

const isLeader = () => managesAllUnits(ctx.role())
const tab = (): Tab => (isLeader() ? state.tab : "mine")
const content = () => document.getElementById("content")
const onPage = () => window.location.pathname.endsWith("/action")

function entry() {
  const q = state.query.trim()
  if (tab() === "all") {
    const dept = Number(state.departmentId) || null
    return workCache.get(`mywork:all:${state.status}:${dept}:${q}:${state.pageNo}`,
      () => myWorkApi.federation({ status: state.status, departmentId: dept, keyword: q, pageNo: state.pageNo }), Object.values(WORK_TOPICS))
  }
  return workCache.get(`mywork:mine:${state.filter}:${q}:${state.pageNo}`,
    () => myWorkApi.mine({ filter: state.filter, keyword: q, pageNo: state.pageNo }), Object.values(WORK_TOPICS))
}

const statusCls = (r: MyWorkRow) => (r.overdue ? "b-danger" : /PENDING|IN_REVIEW|NEW/.test(r.status) || r.kind === "PROJECT_DELETE" || r.kind === "PROJECT_ASSIGN" ? "b-warn" : r.status === "DONE" ? "b-ok" : "b-info")

function rowHtml(r: MyWorkRow): string {
  const today = localToday()
  const sla = slaText(r.dueDate, today)
  const who = tab() === "all"
    ? [r.owner ? `→ ${r.owner.fullName}` : "", r.department?.name].filter(Boolean).join(" • ")
    : [r.from ? `Từ ${r.from.fullName}` : "", r.department?.name].filter(Boolean).join(" • ")
  const follow = tab() === "mine" && !r.mine ? ' <span class="badge b-info">Phối hợp</span>' : ""
  const risk = r.atRisk && !r.overdue ? ' <span class="badge b-warn">Nguy cơ trễ</span>' : ""
  const act = r.mine ? "Xử lý" : "Xem"
  return `<div class="vx-inbox-row${r.overdue ? " is-overdue" : ""}">
<span class="dot ${r.overdue ? "red" : r.mine ? "yellow" : "blue"}"></span>
<div class="vx-inbox-main"><div><b>${esc(r.code)}</b> <span class="mini">${esc(rowLabel(r))}</span>${follow}${risk}</div><div class="vx-inbox-title">${esc(r.title)}</div><div class="mini">${esc(who)}</div></div>
<span class="badge ${statusCls(r)}">${esc(statusLabel(r))}</span>
<div class="vx-inbox-sla">${sla ? `<span class="badge ${r.overdue ? "b-danger" : sla === "Hôm nay" ? "b-warn" : "b-info"}">${esc(sla)}</span>` : ""}${r.dueDate ? `<div class="mini">${formatDate(r.dueDate)}</div>` : ""}</div>
<button class="btn ${r.mine ? "btn-primary" : "btn-light"}" ${jsCall("go", r.link)}>${act}</button>
</div>`
}

function entryHtml(e: WorkEntry, searching: boolean): string {
  if (e.kind === "MISSION" || !e.project) return `<div class="vx-inbox-group vx-inbox-solo"><div class="vx-inbox-solo-tag">Nhiệm vụ</div>${e.items.map(rowHtml).join("")}</div>`
  const p = e.project
  const open = searching || state.opened.has(p.code)
  const late = e.items.filter((r) => r.overdue).length
  const progress = p.approvalStatus === "APPROVED" ? ` <span class="mini">• ${p.progress}%</span>` : ""
  const badges = `${late ? `<span class="badge b-danger">${late} quá hạn</span> ` : ""}<span class="badge b-info">${e.items.length} việc</span>`
  const body = open ? `<div class="vx-inbox-folder">${e.items.map(rowHtml).join("") || '<div class="mini" style="padding:8px 10px">Không có việc đang mở.</div>'}<div class="mini" style="padding:6px 10px"><a href="javascript:void 0" ${jsCall("go", `projects/${encodeURIComponent(p.code)}`)}>Mở dự án →</a></div></div>` : ""
  return `<div class="vx-inbox-group"><button class="vx-inbox-group-head project" ${jsCall("inboxToggleGroup", p.code)}><span>${open ? "▾" : "▸"} <b>${esc(p.name)}</b> <span class="mini">${esc(p.code)}</span>${progress}</span><span>${badges}</span></button>${body}</div>`
}

function listHtml(data: MyWork | undefined): string {
  if (!data) return entryStateHtml(entry())
  if (!data.page.items.length) return '<div class="mini" style="padding:18px 4px">Không có việc phù hợp bộ lọc.</div>'
  const searching = !!state.query.trim()
  return data.page.items.map((e) => entryHtml(e, searching)).join("") + pagerHtml(data.page, "inboxPageNo")
}

const MINE_TILES: [MineFilter, string, string][] = [["mine", "Cần tôi xử lý", "blue"], ["overdue", "Quá hạn", "red"], ["today", "Đến hạn hôm nay", "yellow"], ["cc", "Tôi phối hợp", "gray"]]
const MINE_FILTERS: [MineFilter, string][] = [["mine", "Cần tôi xử lý"], ["overdue", "Quá hạn"], ["today", "Đến hạn hôm nay"], ["cc", "Tôi phối hợp"], ["all", "Tất cả"]]
const ALL_TILES: [FederationStatus, string, string, string][] = [["IN_PROGRESS", "inProgress", "Đang thực hiện", "blue"], ["OVERDUE", "overdue", "Quá hạn", "red"], ["AT_RISK", "atRisk", "Có nguy cơ trễ", "yellow"], ["PENDING", "pending", "Chờ xử lý", "gray"]]

/** Four counts (each also a filter), search and the filter select (the leader picks its tab), then the folders. */
function pageHtml(): string {
  const e = entry()
  const counts = e.data?.counts ?? {}
  const n = (k: string) => (e.data ? counts[k] ?? 0 : "…")
  const tile = (key: string, label: string, value: number | string, cls: string, active: boolean, handler: string) =>
    `<button class="vx-inbox-chip ${cls}${active ? " active" : ""}" ${jsCall(handler, key)}><b>${value}</b><span>${label}</span></button>`
  const all = tab() === "all"
  const tiles = all
    ? ALL_TILES.map(([s, k, l, c]) => tile(s, l, n(k), c, state.status === s, "inboxStatus")).join("")
    : MINE_TILES.map(([f, l, c]) => tile(f, l, n(f), c, state.filter === f, "inboxFilter")).join("")
  const scope = isLeader()
    ? `<div class="vx-flow-view">${(["mine", "all"] as Tab[]).map((t) => `<button class="${tab() === t ? "active" : ""}" ${jsCall("inboxScope", t)}>${t === "mine" ? "Của tôi" : "Toàn Liên đoàn"}</button>`).join("")}</div>`
    : ""
  let filter: string
  if (all) {
    const units = workCache.get("org", () => orgApi.directory()).data?.units.filter((u) => u.code !== "BLD") ?? []
    filter = `<select class="vx-filter-select" onchange="inboxStatus(this.value)"><option value="">Mọi trạng thái</option>${ALL_TILES.map(([s, , l]) => `<option value="${s}"${s === state.status ? " selected" : ""}>${l}</option>`).join("")}</select>
<select class="vx-filter-select" onchange="inboxDepartment(this.value)"><option value="">Mọi đơn vị</option>${units.map((u) => `<option value="${u.id}"${String(u.id) === state.departmentId ? " selected" : ""}>${esc(u.name)}</option>`).join("")}</select>`
  } else {
    filter = `<select class="vx-filter-select" onchange="inboxFilter(this.value)">${MINE_FILTERS.map(([f, l]) => `<option value="${f}"${f === state.filter ? " selected" : ""}>${l}</option>`).join("")}</select>`
  }
  return `<div class="vx-inbox-chips vx-inbox-stats">${tiles}</div><div class="vx-jira-toolbar"><input id="inboxq" class="vx-jira-search" placeholder="Tìm mã, nội dung…" value="${esc(state.query)}" oninput="inboxSearch(this.value)">${filter}${scope}</div>
<div class="card"><div id="inboxList">${listHtml(e.data)}</div></div>`
}

function rerender() {
  const el = content()
  if (el) el.innerHTML = pageHtml()
}

/** Only the list re-renders while typing, so the search box keeps focus (the tiles follow on the next full render). */
function redrawList() {
  const el = document.getElementById("inboxList")
  if (el) el.innerHTML = listHtml(entry().data)
}

const refilter = (change: () => void) => {
  change()
  state.pageNo = 1
  rerender()
}

export function installInboxPage(render: Record<string, () => void>, nextCtx: Ctx) {
  ctx = nextCtx
  render.action = rerender
  onWorkUpdate((key) => {
    if (!onPage()) return
    // While the user types in the search box only the list is redrawn, so it keeps focus.
    if (key.startsWith("mywork:") && document.activeElement?.id === "inboxq") redrawList()
    else if (key.startsWith("mywork:") || (key === "org" && tab() === "all")) rerender()
  })
  Object.assign(window, {
    inboxSearch: (q: string) => {
      state.query = q
      state.pageNo = 1
      clearTimeout(searchTimer)
      searchTimer = setTimeout(redrawList, 250)
    },
    inboxFilter: (f: MineFilter) => refilter(() => { state.filter = f }),
    inboxStatus: (s: FederationStatus) => refilter(() => { state.status = state.status === s && s ? "" : s }),
    inboxDepartment: (id: string) => refilter(() => { state.departmentId = id }),
    // Switching to the whole federation shows everything; back to "mine" shows what awaits the leader.
    inboxScope: (t: Tab) => refilter(() => {
      state.tab = t
      state.filter = "mine"
      state.status = ""
    }),
    inboxPageNo: (n: string) => {
      state.pageNo = Number(n) || 1
      rerender()
    },
    inboxToggleGroup: (code: string) => {
      if (state.opened.has(code)) state.opened.delete(code)
      else state.opened.add(code)
      redrawList()
    },
  })
}
