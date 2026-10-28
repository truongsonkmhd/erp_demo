import Sortable from "sortablejs"
import { escapeHtml as esc, formatTime, jsCall, pagerHtml } from "./html"
import { crumbsHtml, multiSelectHtml } from "./views"
import { avatarHtml, dueHtml, flowBarHtml, lozengeHtml, personName, projectBase } from "./workViews"
import { commentsHtml, progressField } from "./taskViews"
import { MISSION_COLUMNS, MISSION_STATE, missionDropAction, unitAndTeams } from "./missionCore"
import { entryStateHtml, me, runAction, workCache } from "../data/workStore"
import {
  WORK_TOPICS, equipmentApi, missionsApi, orgApi, projectsApi,
  type MissionDetail, type MissionStatus, type MissionSummary, type PersonRef, type SaveMission,
} from "../data/workApi"

/**
 * Luồng Nhiệm vụ on the mission API (/projects/nhiem-vu…): a subordinate proposes, its direct superior approves or
 * rejects, the proposer reports progress and completes. A list (ten a page) and a board, the issue panel
 * (?selected=<code>) and page, and the form page. The server says what the viewer may do (allowedActions).
 */

type Shell = { go(path: string): void; openModal(title: string, html: string): void; closeModal(): void; rerender(): void }
let shell: Shell = { go() {}, openModal() {}, closeModal() {}, rerender() {} }

export type MissionTab = "board" | "danh-sach"
export const MISSION_BASE = "projects/nhiem-vu"
export const missionPath = (code: string) => `${MISSION_BASE}/${encodeURIComponent(code)}`

const view = { query: "", status: "" as MissionStatus | "", pageNo: 1 }
let currentTab: MissionTab = "danh-sach"

const listEntry = () => workCache.get(`missions:list:${view.status}:${view.query.trim()}:${view.pageNo}`,
  () => missionsApi.list({ status: view.status, keyword: view.query.trim(), pageNo: view.pageNo }), [WORK_TOPICS.missions])
const boardEntry = () => workCache.get(`missions:board:${view.query.trim()}`, () => missionsApi.list({ keyword: view.query.trim(), pageSize: 500 }), [WORK_TOPICS.missions])
const missionEntry = (code: string) => workCache.get(`mission:${code}`, () => missionsApi.detail(code), [WORK_TOPICS.missions])
const approverEntry = () => workCache.get("missions:approver", () => missionsApi.approver())

// ---------- List and board

function listHtml(): string {
  const entry = listEntry()
  if (!entry.data) return entryStateHtml(entry)
  const rows = entry.data.items.map((m) => `<tr class="vx-jira-row" ${jsCall("missionSelect", m.code)}>
<td class="vx-jira-key">${esc(m.code)}</td><td>${esc(m.title)}${m.project ? `<div class="mini">${esc(`${m.project.code} – ${m.project.name}`)}</div>` : ""}</td>
<td><span class="vx-jira-who">${avatarHtml(m.proposer)}${esc(personName(m.proposer))}</span></td><td class="mini">${esc(personName(m.approver))}</td>
<td>${dueHtml(m.dueDate, m.overdue)}</td><td>${lozengeHtml(MISSION_STATE[m.status])}</td></tr>`).join("")
  return `<table class="vx-jira-list"><tr><th>Mã</th><th>Nhiệm vụ</th><th>Người lập</th><th>Người duyệt</th><th>Hạn</th><th>Trạng thái</th></tr>${rows || '<tr><td colspan="6" class="mini">Không có nhiệm vụ nào ở mục này.</td></tr>'}</table>${pagerHtml(entry.data, "missionPageNo")}`
}

function cardHtml(m: MissionSummary): string {
  return `<div class="vx-jira-card${m.overdue ? " is-late" : ""}" data-id="${esc(m.code)}" data-status="${m.status}" ${jsCall("missionSelect", m.code)}>
<div class="vx-jira-card-title">${esc(m.title)}</div>
<div class="vx-jira-card-foot">${avatarHtml(m.proposer)}<span class="vx-jira-card-who">${esc(personName(m.proposer))}</span><span style="flex:1"></span>${dueHtml(m.dueDate, m.overdue)}</div></div>`
}

function boardHtml(): string {
  const entry = boardEntry()
  if (!entry.data) return entryStateHtml(entry)
  const items = entry.data.items
  const empty = items.length ? "" : '<div class="vx-jira-empty">Chưa có nhiệm vụ.</div>'
  const cols = MISSION_COLUMNS.map((s) => {
    const list = items.filter((m) => m.status === s).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return `<div class="vx-jira-col" data-status="${s}"><div class="vx-jira-col-head"><span>${MISSION_STATE[s][0]}</span><b>${list.length}</b></div><div class="vx-jira-col-body">${list.map(cardHtml).join("")}</div></div>`
  }).join("")
  return `${empty}<div class="vx-jira-board" style="--cols:${MISSION_COLUMNS.length}">${cols}</div>`
}

const bodyHtml = () => (currentTab === "board" ? boardHtml() : listHtml())

/** The Nhiệm vụ space: flow bar (with "+ Tạo nhiệm vụ" for whoever has a superior), search, state, the two views. */
export function missionSpaceHtml(tab: MissionTab): string {
  currentTab = tab
  const approver = approverEntry().data
  const create = approver ? `<button class="btn btn-primary" ${jsCall("go", `${MISSION_BASE}/moi`)}>+ Tạo nhiệm vụ</button>` : ""
  const views = `<div class="vx-flow-view">${([["danh-sach", "Danh sách"], ["board", "Board"]] as [MissionTab, string][]).map(([t, l]) => `<button class="${t === tab ? "active" : ""}" ${jsCall("go", `${MISSION_BASE}/${t}`)}>${l}</button>`).join("")}</div>`
  const status = tab === "board"
    ? ""
    : `<select class="vx-filter-select" onchange="missionStatusFilter(this.value)"><option value="">Tất cả</option>${MISSION_COLUMNS.map((s) => `<option value="${s}"${s === view.status ? " selected" : ""}>${MISSION_STATE[s][0]}</option>`).join("")}</select>`
  return `${flowBarHtml("nhiem-vu", create)}<div class="vx-jira-toolbar"><input id="vx-jira-q" class="vx-jira-search" placeholder="Tìm nhiệm vụ…" value="${esc(view.query)}" oninput="missionSearch(this.value)">${status}${views}</div><div id="vx-jira-body">${bodyHtml()}</div>${panelHtml(tab)}`
}

// ---------- Panel, page and actions

const ACTION_LABELS: Record<string, string> = { APPROVE: "Duyệt", REJECT: "Từ chối", PROGRESS: "Cập nhật tiến độ", COMPLETE: "Hoàn thành", COMMENT: "Ghi chú" }
const field = (label: string, value: string, full = false) => `<div${full ? ' class="full"' : ""}><span>${label}</span><b>${value}</b></div>`
const people = (list: PersonRef[]) => list.map((p) => esc(p.fullName)).join("<br>") || "–"

function missionDetailHtml(m: MissionDetail): string {
  const info = [
    m.atRisk ? field("Cảnh báo", '<span class="badge b-danger">Nguy cơ trễ</span>') : "",
    field("Người lập", esc(personName(m.proposer))),
    field("Người duyệt", esc(personName(m.approver))),
    field("Đơn vị / tổ đội", esc(m.department?.name ?? "–")),
    field("Dự án", m.project ? `<a href="javascript:void 0" ${jsCall("go", projectBase(m.project.code))}>${esc(`${m.project.code} – ${m.project.name}`)}</a>` : "Không thuộc dự án"),
    field("Hạn hoàn thành", dueHtml(m.dueDate, m.overdue)),
    m.status === "PENDING" || m.status === "REJECTED" ? "" : field("Tiến độ", progressField(m.progress)),
    field("Thiết bị", m.equipment.map((e) => esc(`${e.code} – ${e.name}`)).join("<br>") || "–", true),
    field("Phối hợp", people(m.followers), true),
    m.content ? field("Nội dung", esc(m.content), true) : "",
    m.evidence ? field("Minh chứng", esc(m.evidence), true) : "",
    m.decisionNote ? field("Lý do từ chối", esc(m.decisionNote), true) : "",
    m.completedAt ? field("Hoàn thành lúc", formatTime(m.completedAt)) : "",
  ].join("")
  const acts = m.allowedActions.filter((a) => ACTION_LABELS[a])
  const edit = m.allowedActions.includes("EDIT") ? `<button class="btn btn-light" ${jsCall("go", `${missionPath(m.code)}/sua`)}>Sửa nhiệm vụ</button>` : ""
  const form = acts.length || edit
    ? `<div class="form-grid" style="margin-top:12px">${acts.includes("PROGRESS") ? `<div><label>Tiến độ (%)</label><input id="wf-progress" type="number" min="0" max="100" value="${m.progress}"></div><div><label>Minh chứng</label><input id="wf-evidence" value="${esc(m.evidence ?? "")}"></div>` : ""}${acts.length ? '<div class="full"><label>Ghi chú / lý do</label><textarea id="wf-note" rows="2"></textarea></div>' : ""}</div>
<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${acts.map((a) => `<button class="btn ${a === "REJECT" || a === "COMMENT" ? "btn-light" : "btn-primary"}" ${jsCall("missionAct", m.code, a)}>${ACTION_LABELS[a]}</button>`).join("")}${edit}</div>`
    : '<div class="mini" style="margin-top:12px">Bạn chỉ có quyền xem nhiệm vụ này ở trạng thái hiện tại.</div>'
  const remove = m.allowedActions.includes("DELETE") ? `<div class="toolbar" style="margin-top:14px"><button class="btn btn-danger" ${jsCall("missionDelete", m.code)}>Xoá nhiệm vụ</button></div>` : ""
  return `<div class="vx-detail"><div class="vx-detail-main"><div class="vx-detail-grid">${info}</div>${form}${remove}</div><div class="vx-detail-side">${commentsHtml(m.comments)}</div></div>`
}

function panelHtml(tab: MissionTab): string {
  const code = new URLSearchParams(window.location.search).get("selected")
  if (!code) return ""
  const close = `${MISSION_BASE}/${tab}`
  const entry = missionEntry(code)
  const m = entry.data
  const head = `<div class="vx-jira-drawer-head"><span class="mini">${esc(code)}</span>${m ? lozengeHtml(MISSION_STATE[m.status]) : ""}<span style="flex:1"></span>${m ? `<button class="btn btn-light" ${jsCall("go", missionPath(m.code))}>Mở toàn trang</button>` : ""}<button class="btn btn-light" title="Đóng" ${jsCall("go", close)}>✕</button></div>`
  const body = m ? `<h3 class="vx-jira-issue-title">${esc(m.title)}</h3>${missionDetailHtml(m)}` : entryStateHtml(entry)
  return `<div class="vx-jira-backdrop" ${jsCall("go", close)}></div><aside class="vx-jira-drawer">${head}${body}</aside>`
}

/** Full page of one mission: /projects/nhiem-vu/<code>. */
export function missionPageHtml(code: string): string {
  const entry = missionEntry(code)
  const m = entry.data
  const crumbs = crumbsHtml([["Nhiệm vụ", MISSION_BASE], [code]])
  if (!m) return `<div class="vx-jira-head">${crumbs}</div>${entry.error ? `<div class="mini" style="margin-top:8px">Không tìm thấy nhiệm vụ ${esc(code)}.</div>` : entryStateHtml(entry)}`
  return `<div class="vx-jira-head">${crumbs}<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(m.title)} ${lozengeHtml(MISSION_STATE[m.status])}</h2><div class="mini">${esc(m.code)}</div></div></div></div>
<div class="card">${missionDetailHtml(m)}</div>`
}

const inputValue = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()

function act(code: string, action: string, note: string) {
  switch (action) {
    case "APPROVE": return missionsApi.approve(code, note)
    case "REJECT": return missionsApi.reject(code, note)
    case "PROGRESS": {
      const raw = inputValue("wf-progress")
      return missionsApi.progress(code, { progress: raw === "" ? NaN : Number(raw), evidence: inputValue("wf-evidence"), note })
    }
    case "COMPLETE": return missionsApi.complete(code, note)
    default: return missionsApi.comment(code, note)
  }
}

function missionAct(code: string, action: string) {
  const note = inputValue("wf-note")
  if ((action === "REJECT" || action === "COMMENT") && !note) return alert(action === "REJECT" ? "Vui lòng nhập lý do từ chối" : "Vui lòng nhập nội dung ghi chú")
  void runAction(() => act(code, action, note), () => shell.rerender())
}

function missionDelete(code: string) {
  if (!confirm(`Xoá nhiệm vụ ${code}?`)) return
  void runAction(() => missionsApi.remove(code), () => shell.go(MISSION_BASE))
}

// ---------- Board drag and drop

let sortables: Sortable[] = []

export function mountMissionBoard() {
  sortables.forEach((s) => s.destroy())
  sortables = [...document.querySelectorAll<HTMLElement>(".vx-jira-col-body")].map((list) => Sortable.create(list, {
    group: "vx-board", sort: false, draggable: ".vx-jira-card", emptyInsertThreshold: 60, animation: 150, delay: 180, delayOnTouchOnly: true,
    ghostClass: "vx-jira-ghost", chosenClass: "vx-jira-chosen", dragClass: "vx-jira-drag",
    onEnd: (evt) => {
      if (evt.to === evt.from) return
      evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex ?? 0] ?? null)
      const to = (evt.to.closest<HTMLElement>(".vx-jira-col")?.dataset.status ?? "") as MissionStatus
      void dropOn(evt.item.dataset.id ?? "", (evt.item.dataset.status ?? "") as MissionStatus, to)
    },
  }))
}

async function dropOn(code: string, from: MissionStatus, to: MissionStatus) {
  const wanted = missionDropAction(from, to)
  if (!wanted) return alert("Nhiệm vụ chỉ kéo được: Chờ duyệt → Đang thực hiện (duyệt) hoặc Từ chối, Đang thực hiện → Hoàn thành.")
  let detail: MissionDetail
  try {
    detail = await missionsApi.detail(code)
  } catch (e) {
    return alert((e as Error).message)
  }
  if (!detail.allowedActions.includes(wanted)) {
    return alert(wanted === "COMPLETE" ? "Chỉ người lập báo hoàn thành nhiệm vụ." : "Chỉ người duyệt (cấp trên trực tiếp) duyệt hoặc từ chối nhiệm vụ.")
  }
  if (wanted === "REJECT") {
    return shell.openModal(`Từ chối • ${code}`, `<label>Lý do *</label><textarea id="vx-move-note" rows="3"></textarea><div class="toolbar" style="margin-top:10px"><button class="btn btn-primary" ${jsCall("missionConfirmReject", code)}>Từ chối</button><button class="btn btn-light" onclick="closeModal()">Hủy</button></div>`)
  }
  void runAction(() => act(code, wanted, ""), () => shell.rerender())
}

function missionConfirmReject(code: string) {
  const note = ((document.getElementById("vx-move-note") as HTMLTextAreaElement | null)?.value ?? "").trim()
  if (!note) return alert("Vui lòng nhập lý do từ chối")
  void runAction(() => missionsApi.reject(code, note), () => {
    shell.closeModal()
    shell.rerender()
  })
}

// ---------- Form

const today = () => new Date().toLocaleDateString("sv-SE")

/** Lập / sửa nhiệm vụ (BA fields): tên, mã, đơn vị / tổ đội, dự án, hạn, thiết bị; plus nội dung and phối hợp. */
export function missionFormHtml(code = ""): string {
  const back = code ? missionPath(code) : MISSION_BASE
  const head = (title: string, sub: string) => `<div class="vx-jira-head">${crumbsHtml([["Nhiệm vụ", MISSION_BASE], ...(code ? [[code, back] as [string, string]] : []), [title]])}<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(title)}</h2><div class="mini">${sub}</div></div></div></div>`
  const title = code ? "Sửa nhiệm vụ" : "Tạo nhiệm vụ"
  const approver = approverEntry()
  const org = workCache.get("org", () => orgApi.directory())
  const devices = workCache.get("equipment", () => equipmentApi.search())
  const projects = workCache.get("projects:options", () => projectsApi.list({ pageSize: 500 }), [WORK_TOPICS.projects])
  const mission = code ? missionEntry(code) : undefined
  for (const e of [approver, org, devices, projects, ...(mission ? [mission] : [])]) {
    if (e.data === undefined) return head(title, "") + entryStateHtml(e)
  }
  const m = mission?.data
  if (m && !m.allowedActions.includes("EDIT")) return head(title, "Chỉ người lập sửa nhiệm vụ khi còn chờ duyệt.")
  if (!m && !approver.data) return head(title, "Bạn không có cấp trên trực tiếp để duyệt nhiệm vụ.")
  const units = unitAndTeams(org.data!.units, me().orgUnitCode)
  const unitId = m?.department?.id ?? units[0]?.id
  const mine = me().userId
  const followerIds = (m?.followers ?? []).map((p) => String(p.userId))
  const peopleOptions = org.data!.people.filter((p) => p.id !== mine).map((p) => [String(p.id), `${p.fullName}${p.positionName ? ` – ${p.positionName}` : ""}`] as [string, string])
  const approved = projects.data!.items.filter((p) => p.approvalStatus === "APPROVED" && p.status !== "COMPLETED")
  const section = (t: string, body: string) => `<div class="card vx-pj-section"><h4>${t}</h4><div class="form-grid">${body}</div></div>`
  const general = section("Thông tin nhiệm vụ", `<div><label>Mã nhiệm vụ *</label><input id="mv-code" maxlength="30" value="${esc(m?.code ?? "")}"${m ? " disabled" : ' placeholder="VD: NV-2026-001"'}></div>
<div class="full"><label>Tên nhiệm vụ *</label><input id="mv-title" value="${esc(m?.title ?? "")}"></div>
<div><label>Đơn vị / tổ đội *</label><select id="mv-unit">${units.map((u) => `<option value="${u.id}"${u.id === unitId ? " selected" : ""}>${esc(u.name)}</option>`).join("")}</select></div>
<div><label>Dự án</label><select id="mv-project"><option value="">– Không gắn dự án –</option>${approved.map((p) => `<option value="${esc(p.code)}"${p.code === m?.project?.code ? " selected" : ""}>${esc(`${p.code} – ${p.name}`)}</option>`).join("")}</select></div>
<div><label>Hạn hoàn thành *</label><input id="mv-due" type="date" min="${today()}" value="${esc(m?.dueDate ?? "")}"></div>
<div class="full"><label>Nội dung</label><textarea id="mv-content" rows="3" placeholder="Nội dung, lý do, kết quả dự kiến">${esc(m?.content ?? "")}</textarea></div>`)
  const extra = section("Thiết bị và phối hợp", `<div class="full"><label>Thiết bị</label>${multiSelectHtml("mv-eq", devices.data!.map((e) => [String(e.id), `${e.code} – ${e.name}`]), (m?.equipmentIds ?? []).map(String), "Chọn thiết bị (không bắt buộc)")}</div>
<div class="full"><label>Phối hợp</label>${multiSelectHtml("mv-cc", peopleOptions, followerIds, "Chọn người phối hợp")}</div>`)
  const who = m?.approver ?? approver.data
  const sub = `Người duyệt: <b>${esc(personName(who))}</b>${m ? "" : " • nhiệm vụ gửi cấp trên trực tiếp duyệt"}`
  return `${head(title, sub)}<div class="vx-pj-formpage" id="pj-form-ready">${general}${extra}
<div class="vx-pj-actions"><button class="btn btn-primary" ${jsCall("missionSave", m?.code ?? "")}>${m ? "Lưu thay đổi" : "Gửi duyệt"}</button><button class="btn btn-light" ${jsCall("go", back)}>Huỷ</button></div></div>`
}

const checked = (name: string) => [...document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)].map((x) => Number(x.value))

function missionSave(code: string) {
  const body: SaveMission = {
    code: code || inputValue("mv-code"), title: inputValue("mv-title"), departmentId: Number(inputValue("mv-unit")) || null,
    projectCode: inputValue("mv-project") || null, dueDate: inputValue("mv-due"), content: inputValue("mv-content"),
    equipmentIds: checked("mv-eq"), followerUserIds: checked("mv-cc"),
  }
  if (!body.dueDate) return alert("Vui lòng chọn hạn hoàn thành")
  void runAction(() => (code ? missionsApi.update(code, body) : missionsApi.create(body)), (saved) => shell.go(missionPath(saved.code)))
}

// ---------- Handlers

let searchTimer: ReturnType<typeof setTimeout> | undefined

function redrawBody() {
  const el = document.getElementById("vx-jira-body")
  if (el) el.innerHTML = bodyHtml()
  if (currentTab === "board") mountMissionBoard()
}

/** New data for the list or board only redraws its body (the search box keeps focus). */
export const isMissionListKey = (key: string) => key.startsWith("missions:list") || key.startsWith("missions:board")
export const redrawMissionBody = redrawBody

export function installMissionViews(next: Shell) {
  shell = next
  Object.assign(window, {
    missionAct, missionDelete, missionSave, missionConfirmReject,
    missionSelect: (code: string) => shell.go(`${MISSION_BASE}/${currentTab}?selected=${encodeURIComponent(code)}`),
    missionSearch: (q: string) => {
      view.query = q
      view.pageNo = 1
      clearTimeout(searchTimer)
      searchTimer = setTimeout(redrawBody, 250)
    },
    missionStatusFilter: (s: MissionStatus | "") => {
      view.status = s
      view.pageNo = 1
      redrawBody()
    },
    missionPageNo: (n: string) => {
      view.pageNo = Number(n) || 1
      redrawBody()
    },
  })
}
