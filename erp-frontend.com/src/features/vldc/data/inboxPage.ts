import { escapeHtml as esc, formatDate, jsCall } from "../workflow/html"
import { assignmentInboxRows } from "./docAssignCore"
import { topicReviewRows } from "./scienceCore"
import { workflowStore } from "../workflow/repository"
import { localToday } from "./dates"
import {
  GROUP_LABELS, applyFilter, groupRows, inboxCounts, inboxRows, sortRows,
  type InboxFilter, type InboxRow, type InboxScope, type InboxSort, type UrgencyGroup,
} from "./inboxCore"
import { vldcData } from "./registry"

/** Hộp việc: one urgency-ordered list of everything waiting on the role, with filter chips and search. */

type Ctx = { role(): string }

const state = { filter: "mine" as InboxFilter, scope: "mine" as InboxScope, query: "", source: "", sort: "due" as InboxSort, collapsed: new Set<UrgencyGroup>(["later"]) }
let ctx: Ctx = { role: () => "" }
const today = () => localToday()
const isLeader = () => ctx.role() === "lanhdao"
const content = () => document.getElementById("content")

function rows(): InboxRow[] {
  const scope = isLeader() ? state.scope : "mine"
  return [
    ...inboxRows(workflowStore.items(), vldcData.get("inboxTasks"), ctx.role(), scope, today()),
    ...assignmentInboxRows(vldcData.get("docAssignments"), ctx.role(), scope, today()),
    ...topicReviewRows(vldcData.get("scienceTopics"), ctx.role(), today()),
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

function listHtml(): string {
  const t = today()
  const visible = sortRows(applyFilter(rows(), state.filter, t, state.query, state.source), state.sort)
  if (!visible.length) return '<div class="mini" style="padding:18px 4px">Không có việc phù hợp bộ lọc.</div>'
  const groups = groupRows(visible, t)
  return (Object.keys(GROUP_LABELS) as UrgencyGroup[]).filter((g) => groups[g].length).map((g) => {
    const open = !state.collapsed.has(g)
    return `<div class="vx-inbox-group"><button class="vx-inbox-group-head ${g}" ${jsCall("inboxToggleGroup", g)}><span>${open ? "▾" : "▸"} ${GROUP_LABELS[g]}</span><span class="badge ${g === "overdue" ? "b-danger" : g === "today" ? "b-warn" : "b-info"}">${groups[g].length}</span></button>${open ? groups[g].map(rowHtml).join("") : ""}</div>`
  }).join("")
}

function pageHtml(): string {
  const t = today()
  const all = rows()
  const c = inboxCounts(all, t)
  const chip = (f: InboxFilter, label: string, n: number, cls: string) =>
    `<button class="vx-inbox-chip ${cls}${state.filter === f ? " active" : ""}" ${jsCall("inboxFilter", f)}><b>${n}</b><span>${label}</span></button>`
  const sources = [...new Set(all.map((r) => r.source))].map((s) => [s, all.filter((r) => r.source === s).length] as const).sort((a, b) => b[1] - a[1])
  const scope = isLeader()
    ? `<div class="vx-inbox-scope">${(["mine", "all"] as InboxScope[]).map((s) => `<button class="${state.scope === s ? "active" : ""}" ${jsCall("inboxScope", s)}>${s === "mine" ? "Của tôi" : "Toàn Liên đoàn"}</button>`).join("")}</div>`
    : ""
  return `<div class="card vx-inbox-head"><div class="card-head"><div><h3>Hộp việc</h3><div class="mini">Chỉ đạo, việc được giao, hồ sơ thanh toán và tác vụ nghiệp vụ • cập nhật realtime</div></div>${scope}</div>
<div class="vx-inbox-chips">${chip("mine", "Cần tôi xử lý", c.mine, "blue")}${chip("overdue", "Quá hạn", c.overdue, "red")}${chip("today", "Đến hạn hôm nay", c.today, "yellow")}${chip("cc", "Tôi phối hợp", c.cc, "gray")}${chip("all", "Tất cả", all.length, "gray")}</div>
<div class="vx-inbox-toolbar"><input id="inboxq" placeholder="Tìm mã, nội dung, nguồn..." value="${esc(state.query)}" oninput="inboxSearch(this.value)"><select onchange="inboxSource(this.value)"><option value="">Tất cả nguồn</option>${sources.map(([s]) => `<option${s === state.source ? " selected" : ""}>${esc(s)}</option>`).join("")}</select><select onchange="inboxSort(this.value)"><option value="due"${state.sort === "due" ? " selected" : ""}>Sắp xếp: Hạn</option><option value="priority"${state.sort === "priority" ? " selected" : ""}>Sắp xếp: Ưu tiên</option></select></div></div>
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
    inboxSource: (s: string) => { state.source = s; rerender() },
    inboxSort: (s: InboxSort) => { state.sort = s; rerender() },
    inboxToggleGroup: (g: UrgencyGroup) => {
      if (state.collapsed.has(g)) state.collapsed.delete(g)
      else state.collapsed.add(g)
      rerender()
    },
  })
}
