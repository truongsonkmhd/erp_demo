import Sortable from "sortablejs"
import { escapeHtml as esc, formatDate, formatTime, jsCall } from "./html"
import { crumbsHtml, multiSelectHtml } from "./views"
import { avatarHtml, dueHtml, lozengeHtml, personName, projectBase, projectHeaderHtml } from "./workViews"
import { entryStateHtml, me, runAction, workCache } from "../data/workStore"
import {
  WORK_TOPICS, orgApi, projectsApi, tasksApi,
  type Comment, type Complexity, type PersonRef, type ProjectDetail, type TaskDetail, type TaskStatus, type TaskSummary,
} from "../data/workApi"
import { COLUMNS, COMPLEXITY, TASK_STATE, dropAction, filterTasks } from "./taskCore"

/**
 * Việc of a project on the project-task API, in the style of Jira: a Board whose cards are dragged between the four
 * states, a list, an issue panel (?selected=<code>), an issue page and the Tạo việc page. The server decides who may do
 * what (allowedActions); a drop asks it first, then runs the matching action.
 */

type Shell = { go(path: string): void; openModal(title: string, html: string): void; closeModal(): void; rerender(): void }
let shell: Shell = { go() {}, openModal() {}, closeModal() {}, rerender() {} }

export type TaskTab = "board" | "danh-sach"

const view = { project: "", query: "", status: "" as TaskStatus | "" }
let current: { project: ProjectDetail; tab: TaskTab } | undefined

const tasksEntry = (code: string) => workCache.get(`tasks:${code}`, () => tasksApi.list(code, { pageSize: 500 }), [WORK_TOPICS.tasks])
const taskEntry = (code: string) => workCache.get(`task:${code}`, () => tasksApi.detail(code), [WORK_TOPICS.tasks])
export const taskPath = (projectCode: string, code: string) => `${projectBase(projectCode)}/viec/${encodeURIComponent(code)}`

// ---------- Board and list

function cardHtml(t: TaskSummary): string {
  return `<div class="vx-jira-card${t.overdue ? " is-late" : ""}" data-id="${esc(t.code)}" data-status="${t.status}" ${jsCall("taskSelect", t.code)}>
<div class="vx-jira-card-title">${esc(t.title)}</div>
<div class="vx-jira-card-foot">${avatarHtml(t.assignee)}<span class="vx-jira-card-who">${esc(personName(t.assignee))}</span><span style="flex:1"></span>${dueHtml(t.dueDate, t.overdue)}</div></div>`
}

function boardHtml(items: TaskSummary[], total: number): string {
  const empty = total ? "" : '<div class="vx-jira-empty">Dự án chưa có việc giao.</div>'
  const cols = COLUMNS.map((s) => {
    const list = items.filter((t) => t.status === s).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return `<div class="vx-jira-col" data-status="${s}"><div class="vx-jira-col-head"><span>${TASK_STATE[s][0]}</span><b>${list.length}</b></div><div class="vx-jira-col-body">${list.map(cardHtml).join("")}</div></div>`
  }).join("")
  return `${empty}<div class="vx-jira-board" style="--cols:${COLUMNS.length}">${cols}</div>`
}

function listHtml(items: TaskSummary[]): string {
  const rows = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((t) => `<tr class="vx-jira-row" ${jsCall("taskSelect", t.code)}>
<td class="vx-jira-key">${esc(t.code)}</td><td>${esc(t.title)}</td><td>${lozengeHtml(TASK_STATE[t.status])}</td><td>${esc(personName(t.assignee))}</td><td>${dueHtml(t.dueDate, t.overdue)}</td><td>${t.progress}%</td></tr>`).join("")
  return `<table class="vx-jira-list"><tr><th>Mã</th><th>Nội dung</th><th>Trạng thái</th><th>Người làm</th><th>Hạn</th><th>Tiến độ</th></tr>${rows || '<tr><td colspan="6" class="mini">Không có việc nào.</td></tr>'}</table>`
}

function bodyHtml(): string {
  if (!current) return ""
  const entry = tasksEntry(current.project.code)
  if (!entry.data) return entryStateHtml(entry)
  const all = entry.data.items
  const items = filterTasks(all, view.query, current.tab === "danh-sach" ? view.status : "")
  return current.tab === "board" ? boardHtml(items, all.length) : listHtml(items)
}

function toolbarHtml(tab: TaskTab): string {
  const status = tab === "board"
    ? ""
    : `<select class="vx-filter-select" onchange="taskStatusFilter(this.value)"><option value="">Tất cả</option>${COLUMNS.map((s) => `<option value="${s}"${s === view.status ? " selected" : ""}>${TASK_STATE[s][0]}</option>`).join("")}</select>`
  return `<div class="vx-jira-toolbar"><input id="vx-jira-q" class="vx-jira-search" placeholder="Tìm việc…" value="${esc(view.query)}" oninput="taskSearch(this.value)">${status}</div>`
}

/** Board or list of a project, with the panel of the selected task. */
export function taskSpaceHtml(p: ProjectDetail, tab: TaskTab): string {
  if (view.project !== p.code) Object.assign(view, { project: p.code, query: "", status: "" })
  current = { project: p, tab }
  return `${projectHeaderHtml(p, tab)}${toolbarHtml(tab)}<div id="vx-jira-body">${bodyHtml()}</div>${panelHtml(p.code, tab)}`
}

// ---------- Issue panel, page and actions

const ACTION_LABELS: Record<string, string> = {
  ACCEPT: "Nhận việc", PROGRESS: "Cập nhật tiến độ", SUBMIT: "Nộp nghiệm thu", APPROVE: "Nghiệm thu", RETURN: "Trả lại", COMMENT: "Ghi chú",
}

/** Notes of a task or mission, latest last, with the writer's unit. */
export function commentsHtml(comments: Comment[]): string {
  return `<h4 style="margin-top:0">Ghi chú (${comments.length})</h4>${comments.map((c) => `<div class="vx-note"><div class="vx-note-head"><b>${esc(personName(c.user))}</b> <span class="mini">${c.departmentName ? `${esc(c.departmentName)} • ` : ""}${formatTime(c.createdAt)}</span></div><div>${esc(c.content)}</div></div>`).join("") || '<div class="mini">Chưa có ghi chú.</div>'}`
}

const field = (label: string, value: string, full = false) => `<div${full ? ' class="full"' : ""}><span>${label}</span><b>${value}</b></div>`
export const progressField = (n: number) => `<span class="vx-detail-progress"><i style="width:${n}%"></i></span>${n}%`
const people = (list: PersonRef[]) => list.map((p) => esc(p.fullName)).join("<br>") || "–"

function taskDetailHtml(t: TaskDetail): string {
  const info = [
    t.atRisk ? field("Cảnh báo", '<span class="badge b-danger">Nguy cơ trễ</span>') : "",
    field("Người giao", esc(personName(t.assigner))),
    field("Người thực hiện", esc(personName(t.assignee))),
    field("Đơn vị", esc(t.department?.name ?? "–")),
    field("Hạn", dueHtml(t.dueDate, t.overdue)),
    field("Tiến độ", progressField(t.progress)),
    field("Độ phức tạp", esc(COMPLEXITY[t.complexity])),
    field("Phối hợp", people(t.followers), true),
    t.resultRequirement ? field("Kết quả / minh chứng yêu cầu", esc(t.resultRequirement), true) : "",
    t.evidence ? field("Minh chứng đã nộp", esc(t.evidence), true) : "",
    t.completedAt ? field("Hoàn thành lúc", formatTime(t.completedAt)) : "",
  ].join("")
  const acts = t.allowedActions.filter((a) => ACTION_LABELS[a])
  const form = acts.length
    ? `<div class="form-grid" style="margin-top:12px">${acts.includes("PROGRESS") ? `<div><label>Tiến độ (%)</label><input id="wf-progress" type="number" min="0" max="100" value="${t.progress}"></div><div><label>Minh chứng</label><input id="wf-evidence" value="${esc(t.evidence ?? "")}"></div>` : ""}<div class="full"><label>Ghi chú / lý do</label><textarea id="wf-note" rows="2"></textarea></div></div>
<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${acts.map((a) => `<button class="btn ${a === "RETURN" || a === "COMMENT" ? "btn-light" : "btn-primary"}" ${jsCall("taskAct", t.code, a)}>${ACTION_LABELS[a]}</button>`).join("")}</div>`
    : '<div class="mini" style="margin-top:12px">Bạn chỉ có quyền xem việc này ở trạng thái hiện tại.</div>'
  const remove = t.allowedActions.includes("DELETE") ? `<div class="toolbar" style="margin-top:14px"><button class="btn btn-danger" ${jsCall("taskDelete", t.code)}>Xoá việc</button></div>` : ""
  return `<div class="vx-detail"><div class="vx-detail-main"><div class="vx-detail-grid">${info}</div>${form}${remove}</div><div class="vx-detail-side">${commentsHtml(t.comments)}</div></div>`
}

function panelHtml(projectCode: string, tab: TaskTab): string {
  const code = new URLSearchParams(window.location.search).get("selected")
  if (!code) return ""
  const close = `${projectBase(projectCode)}/${tab}`
  const entry = taskEntry(code)
  const t = entry.data
  const head = `<div class="vx-jira-drawer-head"><span class="mini">${esc(code)}</span>${t ? lozengeHtml(TASK_STATE[t.status]) : ""}<span style="flex:1"></span>${t ? `<button class="btn btn-light" ${jsCall("go", taskPath(t.projectCode, t.code))}>Mở toàn trang</button>` : ""}<button class="btn btn-light" title="Đóng" ${jsCall("go", close)}>✕</button></div>`
  const body = t ? `<h3 class="vx-jira-issue-title">${esc(t.title)}</h3>${taskDetailHtml(t)}` : entryStateHtml(entry)
  return `<div class="vx-jira-backdrop" ${jsCall("go", close)}></div><aside class="vx-jira-drawer">${head}${body}</aside>`
}

/** Full page of one task: /projects/<project>/viec/<code>. */
export function taskPageHtml(projectCode: string, code: string): string {
  const entry = taskEntry(code)
  const t = entry.data
  const crumbs = crumbsHtml([["Dự án", "projects"], [projectCode, projectBase(projectCode)], [code]])
  if (!t) return `<div class="vx-jira-head">${crumbs}</div>${entry.error ? `<div class="mini" style="margin-top:8px">Không tìm thấy việc ${esc(code)}.</div>` : entryStateHtml(entry)}`
  return `<div class="vx-jira-head">${crumbs}<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(t.title)} ${lozengeHtml(TASK_STATE[t.status])}</h2></div></div></div>
<div class="card">${taskDetailHtml(t)}</div>`
}

const inputValue = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()

function act(code: string, action: string, note: string) {
  switch (action) {
    case "ACCEPT": return tasksApi.accept(code, note)
    case "PROGRESS": {
      const raw = inputValue("wf-progress")
      return tasksApi.progress(code, { progress: raw === "" ? NaN : Number(raw), evidence: inputValue("wf-evidence"), note })
    }
    case "SUBMIT": return tasksApi.submit(code, note)
    case "APPROVE": return tasksApi.approve(code, note)
    case "RETURN": return tasksApi.returnTask(code, note)
    default: return tasksApi.comment(code, note)
  }
}

function taskAct(code: string, action: string) {
  const note = inputValue("wf-note")
  if ((action === "RETURN" || action === "COMMENT") && !note) return alert(action === "RETURN" ? "Vui lòng nhập lý do trả lại" : "Vui lòng nhập nội dung ghi chú")
  void runAction(() => act(code, action, note), () => shell.rerender())
}

function taskDelete(code: string) {
  if (!confirm(`Xoá việc ${code}?`)) return
  // From the panel or the task page, back to the project.
  const project = current?.project.code ?? decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[2] ?? "")
  void runAction(() => tasksApi.remove(code), () => shell.go(projectBase(project)))
}

// ---------- Drag and drop

let sortables: Sortable[] = []

/** Each column a sortable list of one group; a drop asks the server what the user may do, then runs that action. */
export function mountTaskBoard() {
  sortables.forEach((s) => s.destroy())
  sortables = [...document.querySelectorAll<HTMLElement>(".vx-jira-col-body")].map((list) => Sortable.create(list, {
    group: "vx-board", sort: false, draggable: ".vx-jira-card", emptyInsertThreshold: 60, animation: 150, delay: 180, delayOnTouchOnly: true,
    ghostClass: "vx-jira-ghost", chosenClass: "vx-jira-chosen", dragClass: "vx-jira-drag",
    onEnd: (evt) => {
      if (evt.to === evt.from) return
      // The board shows the data: put the card back and let the action (and its re-render) move it.
      evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex ?? 0] ?? null)
      const to = (evt.to.closest<HTMLElement>(".vx-jira-col")?.dataset.status ?? "") as TaskStatus
      void dropOn(evt.item.dataset.id ?? "", (evt.item.dataset.status ?? "") as TaskStatus, to)
    },
  }))
}

async function dropOn(code: string, from: TaskStatus, to: TaskStatus) {
  const wanted = dropAction(from, to)
  if (!wanted) return
  let detail: TaskDetail
  try {
    detail = await tasksApi.detail(code)
  } catch (e) {
    return alert((e as Error).message)
  }
  const allowed = detail.allowedActions
  const action = allowed.includes(wanted) ? wanted : allowed.includes("MOVE") ? "MOVE" : null
  if (!action) return alert("Bạn không chuyển được việc này sang cột đó: chỉ người thực hiện nhận / nộp việc, người giao nghiệm thu, trả lại hoặc kéo tự do.")
  if (action === "RETURN") return askReturn(code)
  void runAction(() => (action === "MOVE" ? tasksApi.move(code, to) : act(code, action, "")), () => shell.rerender())
}

function askReturn(code: string) {
  shell.openModal(`Trả lại • ${code}`, `<label>Lý do *</label><textarea id="vx-move-note" rows="3"></textarea><div class="toolbar" style="margin-top:10px"><button class="btn btn-primary" ${jsCall("taskConfirmReturn", code)}>Trả lại</button><button class="btn btn-light" onclick="closeModal()">Hủy</button></div>`)
}

function taskConfirmReturn(code: string) {
  const note = ((document.getElementById("vx-move-note") as HTMLTextAreaElement | null)?.value ?? "").trim()
  if (!note) return alert("Vui lòng nhập lý do trả lại")
  void runAction(() => tasksApi.returnTask(code, note), () => {
    shell.closeModal()
    shell.rerender()
  })
}

// ---------- Tạo việc

const today = () => new Date().toLocaleDateString("sv-SE")

/**
 * Tạo việc (/projects/<code>/giao-viec): the head of a unit taking part gives one task of the approved project to
 * someone of its own unit; it follows the task and accepts it.
 */
export function taskFormHtml(p: ProjectDetail | undefined, code: string, loading: string): string {
  const head = (sub: string) => `<div class="vx-jira-head">${crumbsHtml([["Dự án", "projects"], [p?.name ?? code, projectBase(code)], ["Tạo việc"]])}<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>Tạo việc</h2><div class="mini">${sub}</div></div></div></div>`
  if (!p) return head("") + loading
  if (!p.permissions.canCreateTask) {
    return head(p.approvalStatus === "APPROVED" ? "Chỉ trưởng đơn vị tham gia dự án tạo việc cho nhân viên đơn vị mình." : "Dự án chưa được Liên đoàn trưởng phê duyệt.")
  }
  const org = workCache.get("org", () => orgApi.directory())
  if (!org.data) return head("") + entryStateHtml(org)
  const unit = org.data.units.find((u) => u.code === me().orgUnitCode)
  if (!unit) return head("Không xác định được đơn vị của bạn.")
  const assignees = workCache.get(`assignees:${code}:${unit.id}`, () => projectsApi.assignableUsers(code, unit.id))
  if (!assignees.data) return head("") + entryStateHtml(assignees)
  const mine = me().userId
  const staff = assignees.data.filter((x) => x.userId !== mine)
  const others = org.data.people.filter((x) => x.id !== mine).map((x) => [String(x.id), `${x.fullName}${x.positionName ? ` – ${x.positionName}` : ""}`] as [string, string])
  const section = (title: string, body: string) => `<div class="card vx-pj-section"><h4>${title}</h4><div class="form-grid">${body}</div></div>`
  const work = section("Thông tin công việc", `<div><label>Mã việc *</label><input id="wf-code" maxlength="30" placeholder="VD: ${esc(code)}-01"></div>
<div class="full"><label>Tên công việc *</label><input id="wf-title" placeholder="Ví dụ: Đo từ tuyến T1–T5 khu vực A"></div>
<div class="full"><label>Kết quả / minh chứng yêu cầu</label><textarea id="wf-desc" rows="2" placeholder="Sản phẩm cần nộp khi hoàn thành"></textarea></div>
<div><label>Độ phức tạp</label><select id="wf-complexity">${(Object.entries(COMPLEXITY) as [Complexity, string][]).map(([k, l]) => `<option value="${k}"${k === "MEDIUM" ? " selected" : ""}>${l}</option>`).join("")}</select></div>`)
  const who = section("Người thực hiện", `<div><label>Đơn vị</label><input value="${esc(unit.name)}" disabled></div>
<div><label>Người thực hiện *</label><select id="wf-owner"><option value="">– Chọn người –</option>${staff.map((x) => `<option value="${x.userId}">${esc(x.fullName)}</option>`).join("")}</select><div class="mini" style="margin-top:4px">Bạn theo dõi và nghiệm thu việc này.</div></div>
<div class="full"><label>Phối hợp</label>${multiSelectHtml("wf-cc", others, [], "Chọn người phối hợp")}</div>`)
  const time = section("Thời hạn", `<div><label>Hạn hoàn thành *</label><input id="wf-due" type="date" min="${today()}" max="${esc(p.endDate)}"><div class="mini" style="margin-top:4px">Không quá hạn dự án ${formatDate(p.endDate)}</div></div>`)
  return `${head(`Giao một việc của dự án cho nhân viên ${esc(unit.name)}.`)}<div class="vx-pj-formpage" id="pj-form-ready">${work}${who}${time}
<div class="vx-pj-actions"><button class="btn btn-primary" ${jsCall("taskCreate", code)}>Tạo việc</button><button class="btn btn-light" ${jsCall("go", projectBase(code))}>Huỷ</button></div></div>`
}

function taskCreate(projectCode: string) {
  const owner = Number(inputValue("wf-owner"))
  if (!owner) return alert("Vui lòng chọn người thực hiện")
  const due = inputValue("wf-due")
  if (!due) return alert("Vui lòng chọn hạn hoàn thành")
  void runAction(() => tasksApi.create({
    code: inputValue("wf-code"), projectCode, title: inputValue("wf-title"), resultRequirement: inputValue("wf-desc"),
    complexity: inputValue("wf-complexity") as Complexity, assigneeUserId: owner, dueDate: due,
    followerUserIds: [...document.querySelectorAll<HTMLInputElement>('input[name="wf-cc"]:checked')].map((x) => Number(x.value)),
  }), () => shell.go(projectBase(projectCode)))
}

// ---------- Handlers

function redrawBody() {
  const el = document.getElementById("vx-jira-body")
  if (el) el.innerHTML = bodyHtml()
  mountTaskBoard()
}

export function installTaskViews(next: Shell) {
  shell = next
  Object.assign(window, {
    taskAct, taskDelete, taskCreate, taskConfirmReturn,
    taskSelect: (code: string) => current && shell.go(`${projectBase(current.project.code)}/${current.tab}?selected=${encodeURIComponent(code)}`),
    /** Only the cards / rows re-render while typing, so the search box keeps focus. */
    taskSearch: (q: string) => {
      view.query = q
      redrawBody()
    },
    taskStatusFilter: (s: TaskStatus | "") => {
      view.status = s
      redrawBody()
    },
  })
}
