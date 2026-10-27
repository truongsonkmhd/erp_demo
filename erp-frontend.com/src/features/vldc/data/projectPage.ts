import { escapeHtml as esc, formatDate, formatMoney, jsCall, pagerHtml } from "../workflow/html"
import { crumbsHtml, directiveFormHtml, multiSelectHtml, proposalFormHtml } from "../workflow/views"
import { flowBarHtml, installBoard, issuePageHtml, mountBoard, projectSpaceHtml, proposalSpaceHtml } from "../workflow/boardViews"
import { PROJECT_STATE, lozengeHtml, personName, projectBase, projectHeaderHtml } from "../workflow/workViews"
import { projectsView } from "./projectView"
import { entryStateHtml, me, onWorkUpdate, runAction, workCache } from "./workStore"
import { WORK_TOPICS, orgApi, projectsApi, type OrgUnit, type ProjectDetail, type ProjectStatus, type SaveProject } from "./workApi"

/**
 * Nhiệm vụ / Dự án in the style of Jira, on the project API: the directory of projects, each with Board / Danh sách
 * (workflow/boardViews.ts) and Tổng quan (here), its form page and the decisions on it; the Nhiệm vụ flow beside them.
 * The server checks every rule and says what the viewer may do (permissions); this page shows it and calls the actions.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void; go(path: string): void }

const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
/** Projects are created and edited by Phòng Kỹ thuật (the server checks it again). */
const isTechnical = () => me().orgUnitCode === "KT"

const STATUS_FILTERS: [ProjectStatus | "", string][] = [["", "Tất cả"], ...(Object.entries(PROJECT_STATE) as [ProjectStatus, [string, string]][]).map(([k, [l]]) => [k, l] as [ProjectStatus, string])]
const APPROVAL_BADGE = { PENDING: ' <span class="badge b-warn">Chờ duyệt</span>', REJECTED: ' <span class="badge b-danger">Không duyệt</span>', APPROVED: "" }

export function installProjectPage(render: Record<string, () => void>, ctx: Ctx) {
  const list = { status: "" as ProjectStatus | "", query: "", pageNo: 1 }
  let searchTimer: ReturnType<typeof setTimeout> | undefined

  const listKey = () => `projects:list:${list.status}:${list.query.trim()}:${list.pageNo}`
  const listEntry = () => workCache.get(listKey(), () => projectsApi.list({ status: list.status, keyword: list.query.trim(), pageNo: list.pageNo }), [WORK_TOPICS.projects])
  const detailEntry = (code: string) => workCache.get(`projects:detail:${code}`, () => projectsApi.detail(code), [WORK_TOPICS.projects, WORK_TOPICS.tasks])
  const orgEntry = () => workCache.get("org", () => orgApi.directory())

  /**
   * The project rows (re-rendered alone while typing, so the search box keeps focus): code, name, lead unit, state,
   * progress (none before approval) and deadline with any forecast delay.
   */
  function projectTableHtml(): string {
    const entry = listEntry()
    if (!entry.data) return entryStateHtml(entry)
    const page = entry.data
    const rows = page.items.map((p) => {
      const progress = p.approvalStatus === "APPROVED" ? `${p.progress}%` : "—"
      const late = p.delayDays > 0 ? `<span class="vx-pj-late"> · trễ ${p.delayDays} ngày</span>` : ""
      return `<tr class="vx-staff-row" ${jsCall("go", projectBase(p.code))}><td class="mini">${esc(p.code)}</td><td><b>${esc(p.name)}</b></td>
<td>${esc(p.leadDepartment?.name ?? "–")}</td><td>${lozengeHtml(PROJECT_STATE[p.status])}${APPROVAL_BADGE[p.approvalStatus]}</td>
<td>${progress}</td><td>${formatDate(p.endDate)}${late}</td></tr>`
    }).join("")
    const filtering = !!(list.status || list.query.trim())
    const empty = rows ? "" : `<tr><td colspan="6" class="mini">${filtering ? "Không có dự án nào khớp." : "Chưa có dự án."}</td></tr>`
    return `<table><tr><th>Mã</th><th>Tên dự án</th><th>Đơn vị chủ trì</th><th>Trạng thái</th><th>Tiến độ</th><th>Hạn</th></tr>${rows}${empty}</table>${pagerHtml(page, "projectPageNo")}`
  }

  /** Luồng Dự án: the flow bar; search and status; the projects, ten a page. */
  function pageHtml(): string {
    const status = `<select class="vx-filter-select" onchange="projectFilterSet(this.value)">${STATUS_FILTERS.map(([k, l]) => `<option value="${k}"${k === list.status ? " selected" : ""}>${l}</option>`).join("")}</select>`
    const create = isTechnical() ? `<button class="btn btn-primary" ${jsCall("projectForm", "")}>+ Dự án</button>` : ""
    return `${flowBarHtml("du-an", create)}<div class="vx-jira-toolbar"><input class="vx-jira-search" placeholder="Tìm dự án…" value="${esc(list.query)}" oninput="projectSearch(this.value)">${status}</div><div class="card"><div class="vx-staff-table" id="vx-pj-table">${projectTableHtml()}</div></div>`
  }

  type Route = { first: string; second: string; third: string }
  const route = (): Route => {
    const [first = "", second = "", third = ""] = window.location.pathname.split("/").filter(Boolean).slice(2).map(decodeURIComponent)
    return { first, second, third }
  }
  const isListRoute = (r = route()) => !r.first
  const isFormRoute = (r = route()) => r.first === "moi" || r.second === "sua" || r.second === "giao-viec" || (r.first === "nhiem-vu" && (r.second === "moi" || r.third === "sua"))

  /**
   * Nhiệm vụ / Dự án and its sub pages, read from the address: /projects (directory), /projects/<code>[/board|/danh-sach|
   * /tong-quan|/sua|/giao-viec|/viec/<item>], /projects/moi; luồng Nhiệm vụ: /projects/nhiem-vu[/board|/danh-sach|/moi|<item>|<item>/sua];
   * ?selected=<item> opens the issue panel on a board or list.
   */
  function pageFor(): string {
    const { first, second, third } = route()
    if (!first) return pageHtml()
    if (first === "nhiem-vu") {
      if (!second || second === "board" || second === "danh-sach") return proposalSpaceHtml(second === "board" ? "board" : "danh-sach")
      if (second === "moi") return proposalFormHtml()
      return third === "sua" ? proposalFormHtml(second) : issuePageHtml(second)
    }
    if (first === "giao-viec") return directiveFormHtml()
    if (first === "moi") return projectFormHtml("")
    if (second === "sua") return projectFormHtml(first)
    if (second === "viec") return issuePageHtml(third)
    if (second === "giao-viec") return directiveFormHtml(first)
    const entry = detailEntry(first)
    if (!entry.data) {
      const head = `<div class="vx-jira-head">${crumbsHtml([["Dự án", "projects"], [first]])}</div>`
      return entry.error ? `${head}<div class="mini" style="margin-top:8px">Không tìm thấy dự án ${esc(first)}.</div>` : head + entryStateHtml(entry)
    }
    const tab = second || "board"
    if (tab === "board" || tab === "danh-sach") {
      // The board still reads the work of the project from the older store until it moves to the task API.
      const old = projectsView().find((x) => x.id === first)
      if (old) return projectSpaceHtml(old, tab)
    }
    return projectHeaderHtml(entry.data, "tong-quan") + projectOverviewHtml(entry.data)
  }

  function rerender() {
    const el = content()
    if (!el) return
    el.innerHTML = pageFor()
    // A board (if this page has one) gets its drag and drop.
    mountBoard()
  }
  render.projects = rerender
  installBoard({ go: ctx.go, openModal: ctx.openModal, closeModal: ctx.closeModal })

  /** New data: the list only redraws its table (the search box keeps focus); a form is never redrawn under the user. */
  onWorkUpdate((key) => {
    if (!window.location.pathname.includes("/projects")) return
    const r = route()
    if (isListRoute(r)) {
      if (!key.startsWith("projects:list")) return
      const el = document.getElementById("vx-pj-table")
      if (el) el.innerHTML = projectTableHtml()
      return
    }
    if (isFormRoute(r) && document.getElementById("pj-form-ready")) return
    rerender()
  })

  /** Tổng quan tab: who and when (with editing and the delete request) and three figures. */
  function projectOverviewHtml(p: ProjectDetail): string {
    const can = p.permissions
    const actions = [
      can.canEdit ? `<button class="btn btn-light" ${jsCall("projectForm", p.code)}>Sửa dự án</button>` : "",
      can.canRequestDelete ? `<button class="btn btn-danger" ${jsCall("projectRequestDelete", p.code)}>Đề nghị xoá dự án</button>` : "",
    ].join("")
    const co = p.coDepartments.filter((d) => d.id !== p.leadDepartment?.id).map((d) => d.name)
    const info: [string, string][] = [
      ["Thời gian", `${formatDate(p.startDate)} – ${formatDate(p.endDate)}`],
      ["Đơn vị chủ trì", p.leadDepartment?.name ?? "–"],
      ["Đơn vị phối hợp", co.join(", ") || "–"],
      ["Ngân sách dự kiến", formatMoney(p.estimatedBudget)],
      ["Người lập", personName(p.createdBy)],
      ["Phê duyệt", p.approvedAt ? formatDate(p.approvedAt) : p.approvalStatus === "PENDING" ? "Chờ duyệt" : "–"],
    ]
    const late = p.delayDays ? `<small style="color:var(--danger)">trễ ${p.delayDays} ngày</small>` : "<small>đúng hạn</small>"
    return `<div class="card"><div class="card-head"><h4 style="margin:0">Thông tin chung</h4>${actions ? `<div class="toolbar">${actions}</div>` : ""}</div>
<div class="vx-pj-info">${info.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div>${p.description ? `<div class="vx-pj-desc"><span>Mục tiêu và phạm vi</span><div>${esc(p.description)}</div></div>` : ""}</div>
<div class="vx-pj-tiles three" style="margin-top:14px"><div><span>Tiến độ</span><b>${p.approvalStatus === "APPROVED" ? `${p.progress}%` : "—"}</b><small>theo độ phức tạp của việc đã xong</small></div><div><span>Việc đang mở</span><b>${p.openTaskCount}</b><small>${p.overdueTaskCount ? `<span style="color:var(--danger)">${p.overdueTaskCount} quá hạn</span>` : "không có việc quá hạn"}</small></div><div><span>Hạn</span><b>${formatDate(p.endDate)}</b>${late}</div></div>`
  }

  // ---------- Lập / sửa dự án

  /** Units a project can be given to (the federation board itself aside), in directory order. */
  const projectUnits = (units: OrgUnit[]) => units.filter((u) => u.code !== "BLD")

  /** Lập / sửa dự án opens as a page: /projects/moi or /projects/<code>/sua. */
  function projectForm(code: string) {
    ctx.go(code ? `${projectBase(code)}/sua` : "projects/moi")
  }

  /** The project form: general (code, name, goal and scope), units, time and expected budget. */
  function projectFormHtml(code: string): string {
    const crumbs = code ? crumbsHtml([["Dự án", "projects"], [code, projectBase(code)], ["Sửa dự án"]]) : crumbsHtml([["Dự án", "projects"], ["Lập dự án mới"]])
    const head = (title: string, sub: string) => `<div class="vx-jira-head">${crumbs}<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(title)}</h2><div class="mini">${sub}</div></div></div></div>`
    if (!code && !isTechnical()) return head("Lập dự án", "Chỉ Phòng Kỹ thuật lập và sửa dự án.")
    const org = orgEntry()
    const detail = code ? detailEntry(code) : undefined
    if (!org.data) return head(code ? "Sửa dự án" : "Lập dự án mới", "") + entryStateHtml(org)
    if (detail && !detail.data) return head("Sửa dự án", "") + entryStateHtml(detail)
    const p = detail?.data
    if (p && !p.permissions.canEdit) return head("Sửa dự án", "Bạn không sửa được dự án này.")
    const units = projectUnits(org.data.units)
    const lead = p?.leadDepartment?.id
    const co = (p?.coDepartments ?? []).map((d) => String(d.id))
    const section = (title: string, hint: string, body: string) => `<div class="card vx-pj-section"><h4>${title}</h4>${hint ? `<div class="mini" style="margin:-4px 0 10px">${hint}</div>` : ""}${body}</div>`
    const general = section("Thông tin chung", "", `<div class="form-grid">
<div><label>Mã dự án *</label><input id="pj-id" maxlength="30" value="${esc(p?.code ?? "")}"${p ? " disabled" : ' placeholder="VD: VLDC-2026-001"'}></div>
<div class="full"><label>Tên dự án *</label><input id="pj-name" value="${esc(p?.name ?? "")}"></div>
<div class="full"><label>Mục tiêu và phạm vi</label><textarea id="pj-desc" rows="3" placeholder="Mục tiêu, khu vực, khối lượng chính, sản phẩm giao nộp">${esc(p?.description ?? "")}</textarea></div></div>`)
    const unitsBox = section("Đơn vị thực hiện", "Phòng Kỹ thuật luôn tham gia. Sau khi Liên đoàn trưởng phê duyệt, trưởng các đơn vị tham gia tạo việc và giao cho nhân viên đơn vị mình.", `<div class="form-grid">
<div><label>Đơn vị chủ trì *</label><select id="pj-unit"><option value="">– Chọn đơn vị –</option>${units.map((u) => `<option value="${u.id}"${u.id === lead ? " selected" : ""}>${esc(u.name)}</option>`).join("")}</select></div>
<div class="full"><label>Đơn vị phối hợp</label>${multiSelectHtml("pj-co", units.filter((u) => u.code !== "KT").map((u) => [String(u.id), u.name]), co, "Chọn đơn vị phối hợp")}</div></div>`)
    const time = section("Thời gian và kinh phí", "", `<div class="form-grid">
<div><label>Bắt đầu *</label><input id="pj-start" type="date" value="${esc(p?.startDate ?? new Date().toLocaleDateString("sv-SE"))}"></div>
<div><label>Kết thúc *</label><input id="pj-end" type="date" value="${esc(p?.endDate ?? "")}"></div>
<div><label>Ngân sách dự kiến (đồng) *</label><input id="pj-budget" type="number" min="0" step="1000000" value="${p?.estimatedBudget ?? ""}"></div></div>`)
    const submit = !p ? "Lập dự án và trình duyệt" : p.approvalStatus === "REJECTED" ? "Lưu và trình lại" : "Lưu thay đổi"
    const sub = p
      ? `${esc(p.code)} · ${p.approvalStatus === "APPROVED" ? esc(PROJECT_STATE[p.status][0]) : "Chờ Liên đoàn trưởng phê duyệt"}`
      : "Dự án mới được gửi Liên đoàn trưởng phê duyệt; sau khi được duyệt, trưởng các đơn vị tham gia tạo việc trên Board."
    return `${head(p ? "Sửa dự án" : "Lập dự án mới", sub)}<div class="vx-pj-formpage" id="pj-form-ready">${general}${unitsBox}${time}
<div class="vx-pj-actions"><button class="btn btn-primary" ${jsCall("projectSave", p?.code ?? "")}>${submit}</button><button class="btn btn-light" ${jsCall("go", p ? projectBase(p.code) : "projects")}>Huỷ</button></div></div>`
  }

  function projectSave(code: string) {
    const body: SaveProject = {
      code: code || value("pj-id"), name: value("pj-name"), description: value("pj-desc"), leadDepartmentId: Number(value("pj-unit")),
      coDepartmentIds: [...document.querySelectorAll<HTMLInputElement>('input[name="pj-co"]:checked')].map((x) => Number(x.value)),
      estimatedBudget: Number(value("pj-budget")), startDate: value("pj-start"), endDate: value("pj-end"),
    }
    if (!body.leadDepartmentId) return alert("Vui lòng chọn đơn vị chủ trì")
    void runAction(() => (code ? projectsApi.update(code, body) : projectsApi.create(body)), (saved) => ctx.go(projectBase(saved.code)))
  }

  // ---------- Phê duyệt, xoá dự án

  function projectDecide(code: string, decision: string) {
    if (decision === "approve") return void runAction(() => projectsApi.approve(code), rerender)
    const note = prompt("Lý do không phê duyệt") ?? ""
    if (!note.trim()) return
    void runAction(() => projectsApi.reject(code, note.trim()), rerender)
  }

  /** Phòng Kỹ thuật asks to delete the project (once it has no task); the federation head confirms. */
  function projectRequestDelete(code: string) {
    const reason = prompt(`Lý do đề nghị xoá dự án ${code}`) ?? ""
    if (!reason.trim()) return
    void runAction(() => projectsApi.requestDelete(code, reason.trim()), rerender)
  }

  function projectCancelDelete(code: string) {
    void runAction(() => projectsApi.cancelDelete(code), rerender)
  }

  function projectConfirmDelete(code: string, answer: string) {
    if (answer === "yes") {
      if (!confirm(`Xoá dự án ${code}?`)) return
      return void runAction(() => projectsApi.approveDelete(code), () => ctx.go("projects"))
    }
    const note = prompt("Lý do không xoá") ?? ""
    if (!note.trim()) return
    void runAction(() => projectsApi.rejectDelete(code, note.trim()), rerender)
  }

  Object.assign(window, {
    projectForm, projectSave, projectDecide, projectRequestDelete, projectCancelDelete, projectConfirmDelete,
    projectOpen: (code: string) => ctx.go(projectBase(code)),
    projectFilterSet: (status: ProjectStatus | "") => {
      list.status = status
      list.pageNo = 1
      rerender()
    },
    projectSearch: (q: string) => {
      list.query = q
      list.pageNo = 1
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => {
        const el = document.getElementById("vx-pj-table")
        if (el) el.innerHTML = projectTableHtml()
      }, 250)
    },
    projectPageNo: (n: string) => {
      list.pageNo = Number(n) || 1
      const el = document.getElementById("vx-pj-table")
      if (el) el.innerHTML = projectTableHtml()
    },
    // Older pages open projects through projectDetail.
    projectDetail: (code: string) => ctx.go(projectBase(code)),
  })
}
