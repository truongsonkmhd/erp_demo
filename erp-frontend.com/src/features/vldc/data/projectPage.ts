import { escapeHtml as esc, formatBillion, jsCall } from "../workflow/html"
import { ROLE_TITLES } from "../workflow/rules"
import { crumbsHtml, directiveFormHtml, multiSelectHtml, proposalFormHtml } from "../workflow/views"
import { flowBarHtml, installBoard, issuePageHtml, mountBoard, projectHeaderHtml, projectSpaceHtml, proposalSpaceHtml } from "../workflow/boardViews"
import { tierOf } from "./access"
import { workflowStore } from "../workflow/repository"
import { localToday, vnDate } from "./dates"
import * as M from "./metrics"
import { ROLE_PROFILES, UNIT_DEFS, type UnitCode, unitCodeOf, unitName } from "./org"
import {
  CR_KINDS, PROJECT_APPROVER, PROJECT_LOZENGE, PROJECT_STATUSES, addChangeRequest, approvalOf, canCreateProject, canRequestDelete, cancelDeleteRequest, canSeeProject, canUpdateProject,
  decideChangeRequest, decideDelete, decideProject, deleteBlocker, requestDelete, isProjectApprover, projectProblems, projectStateOf, submitProject,
  type ProjectState, toggleMilestone, updateWbs, wbsRemovalProblems,
} from "./projectCore"
import { projectWork, projectsView } from "./projectView"
import { vldcData } from "./registry"
import { dmsStore } from "./dmsStore"
import { resolveUnitChoice, unitChoiceGroups } from "./subUnitCore"
import type { ChangeRequestKind, Project, ProjectStatus, StoredProject } from "./types"

/**
 * Nhiệm vụ / Dự án in the style of Jira: a directory of projects (figures computed from WBS, finance lines, payments and
 * dates), each with Board / Danh sách (workflow/boardViews.ts) and Tổng quan (here), and the Nhiệm vụ flow beside them.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void; go(path: string): void }

const content = () => document.getElementById("content")
const value = (id: string, root: ParentNode = document) => ((root.querySelector(`#${id}`) as HTMLInputElement | null)?.value ?? "").trim()
const roleTitle = (r?: string) => (r ? ROLE_TITLES[r] || r : "–")
const personOf = (r: string) => ROLE_PROFILES[r]?.name || roleTitle(r)
const subName = (id?: string) => (id ? vldcData.get("subUnits").find((s) => s.id === id)?.name ?? "" : "")
const bar = (pct: number, color = "var(--primary)") => `<div class="vx-plan-bar"><i style="width:${Math.min(100, Math.max(0, pct))}%;background:${color}"></i></div>`
const notice = (ownerRole: string, title: string, body: string, by: string) => {
  const now = new Date()
  void vldcData.save("notices", {
    id: `NTF-${now.getTime().toString(36).toUpperCase()}-${ownerRole}`, scope: "personal", ownerRole, title, body,
    time: `${vnDate(localToday()).slice(0, 5)} ${now.toTimeString().slice(0, 5)}`, priority: "Trung bình", readBy: [by], link: "projects",
  })
}

export function installProjectPage(render: Record<string, () => void>, ctx: Ctx) {
  const stored = (id: string) => vldcData.get("projects").find((p) => p.id === id)
  const computed = (id: string) => projectsView().find((p) => p.id === id)

  const projectPath = (id: string) => `projects/${encodeURIComponent(id)}`

  /** Projects the role sees: all for Phòng Kỹ thuật and the approver; approved ones its unit takes part in for the others. */
  const myProjects = () => projectsView().filter((p) => canSeeProject(p, ctx.role()))
  const approvalBadge = (p: StoredProject) =>
    approvalOf(p) === "Chờ duyệt" ? ' <span class="badge b-warn">Chờ duyệt</span>' : approvalOf(p) === "Từ chối" ? ' <span class="badge b-danger">Không duyệt</span>' : ""

  /** Status filter of the Dự án flow: all (the default) or one state. */
  type ProjectFilter = ProjectState | "all"
  const PROJECT_FILTERS: [ProjectFilter, string][] = [["all", "Tất cả"], ...PROJECT_STATUSES.map((s) => [s, s] as [ProjectFilter, string])]
  let projectFilter: ProjectFilter = "all"
  let projectQuery = ""
  const projectMatches = (p: Project, f: ProjectFilter) => f === "all" || projectStateOf(p) === f
  const projectSearchText = (p: Project) => `${p.id} ${p.name} ${p.unit} ${subName(p.subUnit)} ${roleTitle(p.leadRole)}`.toLowerCase()

  /**
   * The project rows for the filter and search (re-rendered alone while typing, so the search box keeps focus): code, name,
   * lead unit, state, technical progress (none before approval) and deadline with any forecast delay. Cost, milestones and
   * change requests are on the project's own page.
   */
  function projectTableHtml(): string {
    const all = myProjects()
    const q = projectQuery.trim().toLowerCase()
    const ps = all.filter((p) => projectMatches(p, projectFilter) && (!q || projectSearchText(p).includes(q)))
    const rows = ps.map((p) => {
      const state = projectStateOf(p)
      const progress = state === "Khởi tạo" ? "—" : `${p.technical}%`
      const late = p.delayDays > 0 ? `<span class="vx-pj-late">${p.end ? " · trễ" : "Trễ"} ${p.delayDays} ngày</span>` : ""
      return `<tr class="vx-staff-row" ${jsCall("go", projectPath(p.id))}><td class="mini">${esc(p.id)}</td><td><b>${esc(p.name)}</b></td>
<td>${esc(p.unit)}${subName(p.subUnit) ? `<div class="mini">${esc(subName(p.subUnit))}</div>` : ""}</td>
<td><span class="vx-jira-lozenge l-${PROJECT_LOZENGE[state]}">${esc(state)}</span>${approvalBadge(p)}</td>
<td>${progress}</td><td>${p.end ? esc(vnDate(p.end)) : late ? "" : "—"}${late}</td></tr>`
    }).join("")
    const empty = rows ? "" : `<tr><td colspan="6" class="mini">${all.length ? "Không có dự án nào khớp." : "Chưa có dự án."}</td></tr>`
    return `<table><tr><th>Mã</th><th>Tên dự án</th><th>Đơn vị chủ trì</th><th>Trạng thái</th><th>Tiến độ</th><th>Hạn</th></tr>${rows}${empty}</table>`
  }

  /** Luồng Dự án: the flow bar; search and status; a one-line summary; the projects. */
  function pageHtml(): string {
    const role = ctx.role()
    const all = myProjects()
    const staff = tierOf(role) === "staff"
    const m = M.projectMetrics(all, vldcData.get("risks"))
    const summary = staff ? "" : `<div class="mini vx-flow-summary">${m.count} dự án • ${m.late} dự báo trễ • ${m.milestones} mốc trong 30 ngày • ${m.openRisks} rủi ro đang mở (${m.highRisks} mức cao) • ${m.changeRequestsPending} đề xuất thay đổi chờ duyệt</div>`
    const status = `<select class="vx-filter-select" onchange="projectFilterSet(this.value)">${PROJECT_FILTERS.map(([k, l]) => `<option value="${esc(k)}"${k === projectFilter ? " selected" : ""}>${l}</option>`).join("")}</select>`
    const create = canCreateProject(role) ? `<button class="btn btn-primary" ${jsCall("projectForm", "")}>+ Dự án</button>` : ""
    return `${flowBarHtml("du-an", create)}<div class="vx-jira-toolbar"><input class="vx-jira-search" placeholder="Tìm dự án…" value="${esc(projectQuery)}" oninput="projectSearch(this.value)">${status}</div>${summary}<div class="card"><div class="vx-staff-table" id="vx-pj-table">${projectTableHtml()}</div></div>`
  }

  /**
   * Nhiệm vụ / Dự án and its sub pages, read from the address: /projects (directory), /projects/<id>[/board|/danh-sach|
   * /tong-quan|/sua|/giao-viec?wbs=|/viec/<item>], /projects/moi (lập dự án), /projects/giao-viec (pick a project); luồng Nhiệm vụ: /projects/nhiem-vu[/board|/danh-sach|/moi|<item>|<item>/sua];
   * ?selected=<item> opens the issue panel on a board or list.
   */
  function pageFor(): string {
    const [first = "", second = "", third = ""] = window.location.pathname.split("/").filter(Boolean).slice(2).map(decodeURIComponent)
    const query = new URLSearchParams(window.location.search)
    if (!first) return pageHtml()
    if (first === "nhiem-vu") {
      // The list is the default view of the Nhiệm vụ flow (decisions on each row); the board is the other one.
      if (!second || second === "board" || second === "danh-sach") return proposalSpaceHtml(second === "board" ? "board" : "danh-sach")
      if (second === "moi") return proposalFormHtml()
      return third === "sua" ? proposalFormHtml(second) : issuePageHtml(second)
    }
    if (first === "giao-viec") return directiveFormHtml()
    if (first === "moi") return projectFormHtml("")
    if (second === "sua") return projectFormHtml(first)
    // Work is opened by whoever may see it, also staff that do not follow the whole project.
    if (second === "viec") return issuePageHtml(third)
    if (second === "giao-viec") return directiveFormHtml(first, query.get("wbs") ?? "")
    const p = myProjects().find((x) => x.id === first)
    if (!p) return `<div class="vx-jira-head">${crumbsHtml([["Dự án", "projects"], [first]])}<div class="mini" style="margin-top:8px">Không tìm thấy dự án ${esc(first)}.</div></div>`
    const tab = second || "board"
    if (tab === "board" || tab === "danh-sach") return projectSpaceHtml(p, tab)
    return projectHeaderHtml(p, "tong-quan") + projectOverviewHtml(p)
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

  function projectOpen(id: string) {
    ctx.go(projectPath(id))
  }

  /** Tổng quan tab: who and when (with editing and the delete request), three figures and the update log. */
  function projectOverviewHtml(p: Project): string {
    const role = ctx.role()
    const files = dmsStore.files().filter((f) => f.projectId === p.id)
    const canEdit = canCreateProject(role)
    const actions = [
      canEdit ? `<button class="btn btn-light" ${jsCall("projectForm", p.id)}>Sửa dự án</button>` : "",
      canRequestDelete(p, role) ? `<button class="btn btn-danger" ${jsCall("projectRequestDelete", p.id)}>Đề nghị xoá dự án</button>` : "",
    ].join("")
    const co = (p.coUnits ?? []).filter((u) => u !== unitCodeOf(p.unit)).map((u) => unitName(u as UnitCode))
    const info: [string, string][] = [
      ["Thời gian", p.start && p.end ? `${vnDate(p.start)} – ${vnDate(p.end)}` : p.end ? `đến ${vnDate(p.end)}` : "–"],
      ["Đơn vị chủ trì", `${p.unit}${subName(p.subUnit) ? ` – ${subName(p.subUnit)}` : ""}`],
      ["Đơn vị phối hợp", co.join(", ") || "–"],
      ["Chủ nhiệm", p.leadRole ? roleTitle(p.leadRole) : "–"],
    ]
    const docs = files.length ? `<a href="javascript:void 0" class="mini" ${jsCall("projectFiles", p.id)}>${files.length} tài liệu DMS</a>` : ""
    const late = p.delayDays ? `<small style="color:var(--danger)">trễ ${p.delayDays} ngày</small>` : "<small>đúng hạn</small>"
    return `<div class="card"><div class="card-head"><h4 style="margin:0">Thông tin chung</h4>${actions ? `<div class="toolbar">${actions}</div>` : ""}</div>
<div class="vx-pj-info">${info.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("")}</div>${p.description ? `<div class="vx-pj-desc"><span>Mục tiêu và phạm vi</span><div>${esc(p.description)}</div></div>` : ""}${docs}
${p.start ? "" : '<div class="mini" style="margin-top:6px">Dự án nhập trước khi có lập kế hoạch: bấm "Sửa dự án" để nhập ngày và hạng mục.</div>'}</div>
<div class="vx-pj-tiles three" style="margin-top:14px"><div><span>Tiến độ</span><b>${p.technical}%</b></div><div><span>Chi phí</span><b>${p.costUsed}%</b><small>${formatBillion(p.spent)} / ${formatBillion(p.budget)}</small></div><div><span>Hạn</span><b>${p.end ? esc(vnDate(p.end)) : "–"}</b>${late}</div></div>
${(p.log ?? []).length ? `<div class="card" style="margin-top:14px"><h4>Nhật ký cập nhật</h4><div class="timeline">${[...(p.log ?? [])].reverse().slice(0, 5).map((l) => `<div><b>${esc(vnDate(l.at.slice(0, 10)))} • ${esc(l.byName)}</b><br>${esc(l.note)}${l.changes.length ? `<div class="mini">${l.changes.map((c) => `${esc(c.name)}: ${c.from}% → ${c.to}%`).join(" • ")}</div>` : ""}</div>`).join("")}</div></div>` : ""}`
  }

  function projectFiles(id: string) {
    const files = dmsStore.files().filter((f) => f.projectId === id)
    ctx.openModal(`Tài liệu DMS • ${id}`, files.map((f) => `<div class="metric vx-cap-pick" ${jsCall("openDmsFile", f.id)}><span>${esc(f.name)}<br><small>${esc(f.folder)} • v${f.version}</small></span><b>${esc(f.status)}</b></div>`).join("") || '<div class="mini">Không có tài liệu.</div>')
  }

  // ---------- Tạo / sửa dự án
  /** Đơn vị phối hợp: a dropdown of the units with a checkbox each. */
  const coSelectHtml = (codes: string[]) => multiSelectHtml("pj-co", UNIT_DEFS.filter((u) => u.code !== "BLD").map((u) => [u.code, u.name]), codes, "Chọn đơn vị phối hợp")

  /** Lập / sửa dự án opens as a page: /projects/moi or /projects/<id>/sua. */
  function projectForm(id: string) {
    ctx.go(id ? `${projectPath(id)}/sua` : "projects/moi")
  }

  /**
   * The project form: general (code, name, goal and scope), units and lead, time and expected budget (with the state once
   * approved). Its tasks are created on the board once the federation head approves it.
   */
  function projectFormHtml(id: string): string {
    const role = ctx.role()
    const p = id ? stored(id) : undefined
    const crumbs = p ? crumbsHtml([["Dự án", "projects"], [p.name, projectPath(p.id)], ["Sửa dự án"]]) : crumbsHtml([["Dự án", "projects"], ["Lập dự án mới"]])
    const head = (title: string, sub: string) => `<div class="vx-jira-head">${crumbs}<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(title)}</h2><div class="mini">${sub}</div></div></div></div>`
    if (!canCreateProject(role)) return head("Lập dự án", "Chỉ Phòng Kỹ thuật lập và sửa dự án.")
    if (id && !p) return head("Sửa dự án", `Không tìm thấy dự án ${esc(id)}.`)
    const year = localToday().slice(0, 4)
    const nextId = `VLDC-${year}-${String(vldcData.get("projects").filter((x) => x.id.startsWith(`VLDC-${year}-`)).length + 101).slice(-3)}`
    const unitValue = p?.subUnit || unitCodeOf(p?.unit) || ""
    const roles = Object.keys(ROLE_TITLES).filter((r) => r !== "admin")
    const approved = !!p && approvalOf(p) === "Đã duyệt"
    const state = approved
      ? `<div><label>Trạng thái</label><select id="pj-status">${PROJECT_STATUSES.filter((s) => s !== "Khởi tạo").map((s) => `<option${s === projectStateOf(p) ? " selected" : ""}>${s}</option>`).join("")}</select></div>`
      : ""
    const section = (title: string, hint: string, body: string) => `<div class="card vx-pj-section"><h4>${title}</h4>${hint ? `<div class="mini" style="margin:-4px 0 10px">${hint}</div>` : ""}${body}</div>`
    const general = section("Thông tin chung", "", `<div class="form-grid">
<div><label>Mã dự án *</label><input id="pj-id" value="${esc(p?.id ?? nextId)}"${p ? " disabled" : ""}></div>
<div class="full"><label>Tên dự án *</label><input id="pj-name" value="${esc(p?.name ?? "")}"></div>
<div class="full"><label>Mục tiêu và phạm vi</label><textarea id="pj-desc" rows="3" placeholder="Mục tiêu, khu vực, khối lượng chính, sản phẩm giao nộp">${esc(p?.description ?? "")}</textarea></div></div>`)
    const units = section("Đơn vị thực hiện", "Sau khi Liên đoàn trưởng phê duyệt, đơn vị chủ trì và các đơn vị phối hợp thấy dự án, nhận việc và ghi chú vào việc.", `<div class="form-grid">
<div><label>Đơn vị chủ trì (tổ) *</label><select id="pj-unit">${unitChoiceGroups(vldcData.get("subUnits")).map((g) => `<optgroup label="${esc(g.name)}">${g.options.map((o) => `<option value="${esc(o.value)}"${o.value === unitValue ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</optgroup>`).join("")}</select></div>
<div><label>Chủ nhiệm dự án</label><select id="pj-lead">${roles.map((r) => `<option value="${r}"${r === (p?.leadRole ?? "chunhiem") ? " selected" : ""}>${esc(roleTitle(r))} – ${esc(personOf(r))}</option>`).join("")}</select></div>
<div class="full"><label>Đơn vị phối hợp</label>${coSelectHtml(p?.coUnits ?? [])}</div></div>`)
    const time = section("Thời gian và kinh phí", "", `<div class="form-grid">
<div><label>Bắt đầu *</label><input id="pj-start" type="date" value="${esc(p?.start ?? localToday())}"></div>
<div><label>Kết thúc *</label><input id="pj-end" type="date" value="${esc(p?.end ?? "")}"></div>
<div><label>Ngân sách dự kiến (tỷ đồng) *</label><input id="pj-budget" type="number" min="0" step="0.1" value="${p?.budget ?? ""}"></div>${state}</div>`)
    const submit = !p ? "Lập dự án và trình duyệt" : p.approval === "Từ chối" ? "Lưu và trình lại" : "Lưu thay đổi"
    const sub = p ? `${esc(p.id)} · ${esc(approved ? projectStateOf(p) : "Khởi tạo – chờ Liên đoàn trưởng phê duyệt")}` : "Dự án mới ở trạng thái Khởi tạo và được gửi Liên đoàn trưởng phê duyệt; sau khi được duyệt, Phòng Kỹ thuật tạo việc trên Board."
    return `${head(p ? "Sửa dự án" : "Lập dự án mới", sub)}<div class="vx-pj-formpage">${general}${units}${time}
<div class="vx-pj-actions"><button class="btn btn-primary" ${jsCall("projectSave", p?.id ?? "")}>${submit}</button><button class="btn btn-light" ${jsCall("go", p ? projectPath(p.id) : "projects")}>Huỷ</button></div></div>`
  }

  function projectSave(id: string) {
    const role = ctx.role()
    if (!canCreateProject(role)) return
    const prev = id ? stored(id) : undefined
    const unit = resolveUnitChoice(value("pj-unit"), vldcData.get("subUnits"))
    const next: StoredProject = {
      ...(prev ?? { crs: [], log: [] }),
      id: prev?.id ?? value("pj-id"), name: value("pj-name"), unit: unit?.unitName ?? "", subUnit: unit?.subUnit ?? "",
      leadRole: value("pj-lead"), budget: Number(value("pj-budget")), start: value("pj-start"), end: value("pj-end"), description: value("pj-desc"),
      // Only an approved project's state is picked here; before that it stays Khởi tạo.
      status: prev && approvalOf(prev) === "Đã duyệt" ? (value("pj-status") as ProjectStatus) : "Khởi tạo", wbs: prev?.wbs ?? [], milestones: prev?.milestones ?? [],
      coUnits: [...document.querySelectorAll<HTMLInputElement>('input[name="pj-co"]:checked')].map((x) => x.value).filter((u) => u !== unitCodeOf(unit?.unitName)),
    }
    if (!unit) return alert("Vui lòng chọn phòng thực hiện chính")
    const problems = [...projectProblems(next, vldcData.get("projects"), !prev), ...(prev ? wbsRemovalProblems(prev, next, projectWork()) : [])]
    if (problems.length) return alert(problems.join("\n"))
    const saved = submitProject(prev, next, role)
    void vldcData.save("projects", saved)
    if (approvalOf(saved) === "Chờ duyệt" && (!prev || approvalOf(prev) !== "Chờ duyệt")) {
      notice(PROJECT_APPROVER, `Dự án ${saved.id} chờ phê duyệt`, `${roleTitle(role)} trình dự án "${saved.name}".`, role)
    }
    if (!prev || prev.leadRole !== saved.leadRole) notice(saved.leadRole as string, `Dự án ${saved.id}`, `Bạn là chủ nhiệm dự án "${saved.name}".`, role)
    ctx.go(projectPath(saved.id))
  }

  // ---------- Phê duyệt, xoá dự án
  function projectDecide(id: string, decision: "Đã duyệt" | "Từ chối") {
    const p = stored(id)
    const role = ctx.role()
    if (!p || !isProjectApprover(role)) return
    const note = decision === "Từ chối" ? prompt("Lý do không phê duyệt") ?? "" : ""
    if (decision === "Từ chối" && !note.trim()) return
    try {
      void vldcData.save("projects", decideProject(p, decision, note, new Date().toISOString()))
      if (p.createdBy) notice(p.createdBy, `Dự án ${p.id}: ${decision === "Đã duyệt" ? "đã được phê duyệt" : "không được phê duyệt"}`, `${p.name}${note ? ` – ${note}` : ""}`, role)
      rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  /** Tasks still in the project (payment dossiers aside): each is deleted by its own creator before the project can go. */
  const liveWork = (id: string) => workflowStore.items().filter((x) => x.project === id && x.type !== "payment").length

  /** The creator asks to delete the project; the federation head confirms (projectConfirmDelete). */
  function projectRequestDelete(id: string) {
    const p = stored(id)
    const role = ctx.role()
    if (!p || !canRequestDelete(p, role)) return
    const blocker = deleteBlocker(liveWork(id))
    if (blocker) return alert(blocker)
    const reason = prompt(`Lý do đề nghị xoá dự án ${p.id}`) ?? ""
    if (!reason.trim()) return
    try {
      void vldcData.save("projects", requestDelete(p, role, reason, new Date().toISOString(), liveWork(id)))
      notice(PROJECT_APPROVER, `Đề nghị xoá dự án ${p.id}`, `${roleTitle(role)} đề nghị xoá "${p.name}": ${reason.trim()}`, role)
      rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function projectCancelDelete(id: string) {
    const p = stored(id)
    if (!p) return
    try {
      void vldcData.save("projects", cancelDeleteRequest(p, ctx.role()))
      rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  /** The federation head confirms the deletion (only of a project with no task left) or keeps the project, with a reason. */
  function projectConfirmDelete(id: string, answer: string) {
    const p = stored(id)
    const role = ctx.role()
    if (!p?.deleteRequest || !isProjectApprover(role)) return
    const confirmed = answer === "yes"
    if (confirmed && deleteBlocker(liveWork(id))) return alert(deleteBlocker(liveWork(id)))
    if (confirmed && !confirm(`Xoá dự án ${p.id} • ${p.name}?`)) return
    const note = confirmed ? "" : prompt("Lý do không xoá") ?? ""
    if (!confirmed && !note.trim()) return
    try {
      void vldcData.save("projects", decideDelete(p, confirmed, note, role, new Date().toISOString(), liveWork(id)))
      notice(p.deleteRequest.by, `Dự án ${p.id}: ${confirmed ? "đã xoá" : "không xoá"}`, confirmed ? `Liên đoàn trưởng đã xác nhận xoá "${p.name}".` : `Liên đoàn trưởng giữ lại "${p.name}": ${note.trim()}`, role)
      if (confirmed) ctx.go("projects")
      else rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  // ---------- Tiến độ, mốc, yêu cầu thay đổi
  function projectProgressForm(id: string) {
    const p = computed(id)
    if (!p || !canUpdateProject(p, ctx.role())) return
    ctx.openModal(`Cập nhật tiến độ • ${p.id}`, `<div class="vx-staff-table"><table id="pj-prog"><tr><th>Hạng mục</th><th>Trọng số</th><th>Tiến độ %</th></tr>${p.wbs.map((w, i) => `<tr><td>${esc(w.name)}</td><td>${w.weight ?? "–"}%</td><td>${w.linkedWork ? `<b>${w.progress}%</b><div class="mini">Tự tính từ ${w.linkedWork} việc giao</div>` : `<input class="pj-p" data-key="${esc(w.id ?? String(i))}" type="number" min="0" max="100" value="${w.progress}">`}</td></tr>`).join("")}</table></div>
<div class="form-grid" style="margin-top:10px"><div class="full"><label>Công việc đã làm *</label><textarea id="pj-note" rows="2"></textarea></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("projectProgressSave", p.id)}>Lưu tiến độ</button>`)
  }

  function projectProgressSave(id: string) {
    const p = stored(id)
    const role = ctx.role()
    if (!p || !canUpdateProject(p, role)) return
    const progress = Object.fromEntries([...document.querySelectorAll<HTMLInputElement>("#pj-prog .pj-p")].map((el) => [el.dataset.key as string, Number(el.value)]))
    try {
      void vldcData.save("projects", updateWbs(p, progress, role, personOf(role), value("pj-note"), new Date().toISOString()))
      ctx.closeModal()
      rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function projectMilestone(id: string, milestoneId: string) {
    const p = stored(id)
    if (!p || !canUpdateProject(p, ctx.role())) return
    void vldcData.save("projects", toggleMilestone(p, milestoneId, new Date().toISOString()))
    projectOpen(id)
  }

  function projectCrForm(id: string) {
    const p = stored(id)
    if (!p || !canUpdateProject(p, ctx.role())) return
    ctx.openModal(`Đề xuất thay đổi • ${p.id}`, `<div class="form-grid"><div><label>Loại thay đổi</label><select id="pj-cr-kind" onchange="document.getElementById('pj-cr-end-box').style.display=this.value==='Thời gian'?'':'none';document.getElementById('pj-cr-budget-box').style.display=this.value==='Ngân sách'?'':'none'">${CR_KINDS.map((k) => `<option>${k}</option>`).join("")}</select></div>
<div id="pj-cr-end-box" style="display:none"><label>Ngày kết thúc mới</label><input id="pj-cr-end" type="date" value="${esc(p.end ?? "")}"></div>
<div id="pj-cr-budget-box" style="display:none"><label>Ngân sách mới (tỷ)</label><input id="pj-cr-budget" type="number" step="0.1" value="${p.budget}"></div>
<div class="full"><label>Nội dung, lý do *</label><textarea id="pj-cr-content" rows="3"></textarea></div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("projectCrSave", p.id)}>Trình Liên đoàn trưởng</button>`)
  }

  function projectCrSave(id: string) {
    const p = stored(id)
    const role = ctx.role()
    if (!p || !canUpdateProject(p, role)) return
    try {
      const kind = value("pj-cr-kind") as ChangeRequestKind
      const next = addChangeRequest(p, { kind, content: value("pj-cr-content"), newEnd: value("pj-cr-end"), newBudget: Number(value("pj-cr-budget")) }, role, new Date().toISOString())
      void vldcData.save("projects", next)
      notice(PROJECT_APPROVER, `Yêu cầu thay đổi dự án ${p.id}`, `${roleTitle(role)} đề xuất thay đổi ${kind.toLowerCase()} cho "${p.name}".`, role)
      ctx.closeModal()
      rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function projectCrDecide(id: string, crId: string, decision: "Đã duyệt" | "Từ chối") {
    const p = stored(id)
    const role = ctx.role()
    if (!p || !isProjectApprover(role)) return
    const note = decision === "Từ chối" ? prompt("Lý do từ chối") ?? "" : ""
    try {
      void vldcData.save("projects", decideChangeRequest(p, crId, decision, note, new Date().toISOString()))
      const cr = (p.crs ?? []).find((c) => c.id === crId)
      if (cr) notice(cr.by, `Yêu cầu thay đổi ${p.id}: ${decision}`, `${cr.kind}: ${cr.content}${note ? ` – ${note}` : ""}`, role)
      projectOpen(id)
      rerender()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  Object.assign(window, {
    projectOpen, projectFiles, projectForm, projectSave, projectProgressForm, projectProgressSave, projectMilestone, projectCrForm,
    projectFilterSet: (f: ProjectFilter) => {
      projectFilter = f
      rerender()
    },
    projectSearch: (q: string) => {
      projectQuery = q
      const el = document.getElementById("vx-pj-table")
      if (el) el.innerHTML = projectTableHtml()
    },
    projectCrSave, projectCrDecide, projectDecide, projectRequestDelete, projectCancelDelete, projectConfirmDelete,
    // Older pages open projects through projectDetail.
    projectDetail: projectOpen,
  })
}

