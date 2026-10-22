import { escapeHtml as esc, jsCall } from "../workflow/html"
import { ROLE_TITLES, isClosed } from "../workflow/rules"
import { workflowStore } from "../workflow/repository"
import { localToday, vnDate } from "./dates"
import * as M from "./metrics"
import { ROLE_PROFILES, unitCodeOf } from "./org"
import { kpi, kpis } from "./pages"
import {
  CR_KINDS, PROJECT_APPROVER, PROJECT_STATUSES, addChangeRequest, canCreateProject, canUpdateProject, decideChangeRequest,
  isOverrun, projectProblems, toggleMilestone, updateWbs,
} from "./projectCore"
import { projectsView } from "./projectView"
import { vldcData } from "./registry"
import { resolveUnitChoice, unitChoiceGroups } from "./subUnitCore"
import type { ChangeRequestKind, Milestone, Project, ProjectStatus, StoredProject, WbsItem } from "./types"

/** Nhiệm vụ / Dự án: projects created on screen, figures computed from WBS, finance lines, payments and dates. */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const content = () => document.getElementById("content")
const value = (id: string, root: ParentNode = document) => ((root.querySelector(`#${id}`) as HTMLInputElement | null)?.value ?? "").trim()
const cellValue = (row: Element, cls: string) => ((row.querySelector(`.${cls}`) as HTMLInputElement | null)?.value ?? "").trim()
const roleTitle = (r?: string) => (r ? ROLE_TITLES[r] || r : "–")
const personOf = (r: string) => ROLE_PROFILES[r]?.name || roleTitle(r)
const subName = (id?: string) => (id ? vldcData.get("subUnits").find((s) => s.id === id)?.name ?? "" : "")
const bar = (pct: number, color = "var(--primary)") => `<div class="vx-plan-bar"><i style="width:${Math.min(100, Math.max(0, pct))}%;background:${color}"></i></div>`
const delayBadge = (p: Project) =>
  p.delayDays > 14 ? `<span class="badge b-danger">Trễ ${p.delayDays} ngày</span>` : p.delayDays > 0 ? `<span class="badge b-warn">Trễ ${p.delayDays} ngày</span>` : '<span class="badge b-ok">Đúng hạn</span>'
const metric = (l: string, v: string) => `<div class="metric"><span>${l}</span><b>${v}</b></div>`
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

  function pageHtml(): string {
    const ps = projectsView()
    const m = M.projectMetrics(ps, vldcData.get("risks"))
    const rows = ps.map((p) => `<tr class="vx-staff-row" ${jsCall("projectOpen", p.id)}><td><b>${esc(p.id)}</b><div class="mini">${esc(p.status ?? "")}</div></td><td>${esc(p.name)}<div class="mini">${esc(p.unit)}${subName(p.subUnit) ? ` • ${esc(subName(p.subUnit))}` : ""} • Chủ nhiệm ${esc(roleTitle(p.leadRole))}</div></td>
<td><div class="vx-plan-nums"><b>${p.technical}%</b>${p.plannedPct == null ? "" : `<span class="mini">cần ${p.plannedPct}%</span>`}</div>${bar(p.technical)}</td>
<td><div class="vx-plan-nums"><b>${p.costUsed}%</b><span class="mini">${p.spent} / ${p.budget} tỷ</span></div>${bar(p.costUsed, isOverrun(p) ? "var(--danger)" : "var(--warn)")}${isOverrun(p) ? '<span class="badge b-danger">lệch</span>' : ""}</td>
<td>${delayBadge(p)}${p.end ? `<div class="mini">hạn ${esc(vnDate(p.end))}</div>` : ""}</td><td class="mini">${p.upcomingMilestones} mốc / 30 ngày${p.changeRequestsPending ? `<br><span class="badge b-warn">${p.changeRequestsPending} CR chờ duyệt</span>` : ""}</td></tr>`).join("")
    return `${kpis(
      kpi("Nhiệm vụ", m.count, `${m.late} có dự báo trễ`),
      kpi("Milestone sắp tới", m.milestones, "Trong 30 ngày"),
      kpi("Risk đang mở", m.openRisks, `${m.highRisks} mức cao`),
      kpi("Change Request", m.changeRequests, `${m.changeRequestsPending} chờ duyệt`),
    )}<div class="card" style="margin-top:14px"><div class="card-head"><div><h3>Danh mục nhiệm vụ / dự án</h3><div class="mini">Tiến độ = trung bình có trọng số các hạng mục • Chi phí = đã chi / ngân sách • Dự báo trễ theo tốc độ thực hiện</div></div><div class="toolbar"><button class="btn btn-light" onclick="show('finance')">Tài chính dự án</button>${canCreateProject(ctx.role()) ? `<button class="btn btn-primary" ${jsCall("projectForm", "")}>+ Dự án</button>` : ""}</div></div>
<div class="vx-staff-table"><table><tr><th>Mã</th><th>Dự án</th><th>Tiến độ kỹ thuật</th><th>Chi phí đã dùng</th><th>Dự báo</th><th>Mốc / CR</th></tr>${rows || '<tr><td colspan="6" class="mini">Chưa có dự án.</td></tr>'}</table></div></div>`
  }

  function rerender() {
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }
  render.projects = rerender

  // ---------- Hồ sơ dự án
  function projectOpen(id: string) {
    const p = computed(id)
    if (!p) return alert(`Không tìm thấy dự án ${id}`)
    const role = ctx.role()
    const today = localToday()
    const work = workflowStore.items().filter((x) => x.project === p.id)
    const directives = work.filter((x) => x.type !== "payment")
    const payments = work.filter((x) => x.type === "payment")
    const lines = vldcData.get("financeLines").filter((l) => l.project === p.id)
    const contracts = vldcData.get("contracts").filter((c) => c.projectId === p.id)
    const files = vldcData.get("dmsFiles").filter((f) => f.projectId === p.id)
    const risks = vldcData.get("risks").filter((r) => r.project === p.id && r.open)
    const events = vldcData.get("calendarEvents").filter((e) => e.project === p.id)
    const canEdit = canCreateProject(role), canUpdate = canUpdateProject(p, role)
    const wbs = p.wbs.map((w) => {
      const late = w.end && w.end < today && w.progress < 100
      return `<tr><td><b>${esc(w.name)}</b>${subName(w.subUnit) ? `<div class="mini">${esc(subName(w.subUnit))}</div>` : ""}</td><td>${w.weight ?? "–"}%</td><td class="mini">${w.start ? esc(vnDate(w.start)) : ""} – ${w.end ? esc(vnDate(w.end)) : ""}</td><td><div class="vx-plan-nums"><b>${w.progress}%</b>${late ? '<span class="badge b-danger">quá hạn</span>' : ""}</div>${bar(w.progress, late ? "var(--danger)" : "var(--primary)")}</td></tr>`
    }).join("")
    const ms = (p.milestones ?? []).map((m) => `<div class="alert"><span class="dot ${m.doneAt ? "green" : m.due < today ? "red" : "yellow"}"></span><div style="flex:1"><b>${esc(m.name)}</b><div class="mini">Hạn ${esc(vnDate(m.due))}${m.doneAt ? ` • đạt ${esc(vnDate(m.doneAt.slice(0, 10)))}` : ""}</div></div>${canUpdate ? `<button class="btn btn-light" ${jsCall("projectMilestone", p.id, m.id)}>${m.doneAt ? "Bỏ đánh dấu" : "Đã đạt"}</button>` : ""}</div>`).join("") || '<div class="mini">Chưa có mốc.</div>'
    const crs = (p.crs ?? []).map((c) => `<div class="alert"><span class="dot ${c.status === "Đã duyệt" ? "green" : c.status === "Từ chối" ? "red" : "yellow"}"></span><div style="flex:1"><b>${esc(c.kind)}: ${esc(c.content)}</b><div class="mini">${esc(roleTitle(c.by))} • ${esc(vnDate(c.at.slice(0, 10)))} • ${esc(c.status)}${c.newEnd ? ` • hạn mới ${esc(vnDate(c.newEnd))}` : ""}${c.newBudget ? ` • ngân sách mới ${c.newBudget} tỷ` : ""}${c.note ? ` • ${esc(c.note)}` : ""}</div></div>${c.status === "Chờ duyệt" && role === PROJECT_APPROVER ? `<button class="btn btn-ok" ${jsCall("projectCrDecide", p.id, c.id, "Đã duyệt")}>Duyệt</button><button class="btn btn-light" ${jsCall("projectCrDecide", p.id, c.id, "Từ chối")}>Từ chối</button>` : ""}</div>`).join("") || '<div class="mini">Chưa có yêu cầu thay đổi.</div>'
    const list = (items: string[], empty: string) => items.join("") || `<div class="mini">${empty}</div>`
    const actions = [
      canEdit ? `<button class="btn btn-light" ${jsCall("projectForm", p.id)}>Sửa dự án</button>` : "",
      canUpdate ? `<button class="btn btn-primary" ${jsCall("projectProgressForm", p.id)}>Cập nhật tiến độ</button>` : "",
      canUpdate ? `<button class="btn btn-light" ${jsCall("projectCrForm", p.id)}>Đề xuất thay đổi</button>` : "",
      role === PROJECT_APPROVER ? `<button class="btn btn-light" ${jsCall("wfCreateDirectiveForProject", p.id)}>Giao chỉ đạo cho dự án</button>` : "",
    ].join("")
    ctx.openModal(`Hồ sơ dự án • ${p.id}`, `<h3 style="margin:0 0 4px">${esc(p.name)}</h3><div class="mini">${esc(p.unit)}${subName(p.subUnit) ? ` • ${esc(subName(p.subUnit))}` : ""} • Chủ nhiệm ${esc(roleTitle(p.leadRole))} • ${esc(p.status ?? "")}${p.start && p.end ? ` • ${esc(vnDate(p.start))} – ${esc(vnDate(p.end))}` : ""}</div>
${actions ? `<div class="toolbar" style="margin:10px 0">${actions}</div>` : ""}
<div class="vx-pj-tiles"><div><span>Tiến độ kỹ thuật</span><b>${p.technical}%</b>${p.plannedPct == null ? "" : `<small>cần đạt ${p.plannedPct}% hôm nay</small>`}</div><div><span>Chi phí đã dùng</span><b>${p.costUsed}%</b><small>${p.spent} / ${p.budget} tỷ</small></div><div><span>Dự báo</span><b>${p.delayDays ? `Trễ ${p.delayDays} ngày` : "Đúng hạn"}</b><small>${p.overdueWbs} hạng mục quá hạn</small></div><div><span>Mốc 30 ngày</span><b>${p.upcomingMilestones}</b><small>${p.changeRequestsPending} CR chờ duyệt</small></div></div>
${p.start ? "" : '<div class="mini" style="margin:6px 0">Dự án nhập trước khi có lập kế hoạch: số liệu là số cũ, bấm "Sửa dự án" để nhập ngày và hạng mục.</div>'}
<h4>Hạng mục (WBS)</h4><div class="vx-staff-table"><table><tr><th>Hạng mục</th><th>Trọng số</th><th>Thời gian</th><th>Tiến độ</th></tr>${wbs}</table></div>
<div class="grid twoeq" style="margin-top:10px"><div><h4>Mốc</h4>${ms}</div><div><h4>Yêu cầu thay đổi</h4>${crs}</div></div>
<div class="grid twoeq" style="margin-top:10px"><div><h4>Chỉ đạo liên quan (${directives.length})</h4>${list(directives.map((x) => `<div class="alert vx-cap-pick" ${jsCall("wfOpen", x.id)}><span class="dot ${isClosed(x) ? "green" : x.due < today ? "red" : "yellow"}"></span><div><b>${esc(x.title)}</b><div class="mini">${esc(roleTitle(x.owner))} • ${esc(x.status)} • ${x.progress}% • hạn ${esc(vnDate(x.due))}</div></div></div>`), "Chưa có chỉ đạo gắn dự án.")}</div>
<div><h4>Thanh toán (${payments.length})</h4>${list(payments.map((x) => `<div class="alert vx-cap-pick" ${jsCall("wfOpen", x.id)}><span class="dot ${x.status === "Đã chi" ? "green" : "yellow"}"></span><div><b>${esc(x.title)}</b><div class="mini">${((x.amount ?? 0) / 1e6).toLocaleString("vi-VN")} tr.đ • ${esc(x.status)}</div></div></div>`), "Chưa có hồ sơ thanh toán gắn dự án.")}</div></div>
<div class="grid twoeq" style="margin-top:10px"><div><h4>Tài chính (cost center)</h4>${list(lines.map((l) => metric(esc(l.item), `${l.paid.toLocaleString("vi-VN")} / ${l.budget.toLocaleString("vi-VN")} tr.đ`)), "Chưa có dòng tài chính.")}</div>
<div><h4>Liên kết</h4>${list(contracts.map((c) => `<div class="alert vx-cap-pick" ${jsCall("contractDetail", c.id)}><span class="dot green"></span><div><b>Hợp đồng ${esc(c.id)}</b><div class="mini">${esc(c.name)}</div></div></div>`), "Chưa có hợp đồng.")}${files.length ? `<div class="alert vx-cap-pick" ${jsCall("projectFiles", p.id)}><span class="dot green"></span><div><b>${files.length} tài liệu DMS</b><div class="mini">Hồ sơ điện tử của dự án</div></div></div>` : ""}${risks.map((r) => `<div class="alert"><span class="dot red"></span><div><b>Rủi ro: ${esc(r.title)}</b><div class="mini">${esc(r.mitigation)}</div></div></div>`).join("")}${events.map((e) => `<div class="alert"><span class="dot yellow"></span><div><b>${esc(e.title)}</b><div class="mini">${esc(e.date)} ${esc(e.time)}</div></div></div>`).join("")}</div></div>
${(p.log ?? []).length ? `<h4>Nhật ký cập nhật</h4><div class="timeline">${[...(p.log ?? [])].reverse().slice(0, 8).map((l) => `<div><b>${esc(vnDate(l.at.slice(0, 10)))} • ${esc(l.byName)}</b><br>${esc(l.note)}${l.changes.length ? `<div class="mini">${l.changes.map((c) => `${esc(c.name)}: ${c.from}% → ${c.to}%`).join(" • ")}</div>` : ""}</div>`).join("")}</div>` : ""}`)
  }

  function projectFiles(id: string) {
    const files = vldcData.get("dmsFiles").filter((f) => f.projectId === id)
    ctx.openModal(`Tài liệu DMS • ${id}`, files.map((f) => `<div class="metric vx-cap-pick" ${jsCall("openDmsFile", f.id)}><span>${esc(f.name)}<br><small>${esc(f.folder)} • v${f.version}</small></span><b>${esc(f.status)}</b></div>`).join("") || '<div class="mini">Không có tài liệu.</div>')
  }

  // ---------- Tạo / sửa dự án
  const subOptions = (selected = "") => `<option value="">–</option>${vldcData.get("subUnits").filter((s) => s.active).map((s) => `<option value="${esc(s.id)}"${s.id === selected ? " selected" : ""}>${esc(s.name)}</option>`).join("")}`
  const wbsRow = (w?: WbsItem) => `<tr><td><input class="pj-w-name" value="${esc(w?.name ?? "")}"></td><td><input class="pj-w-weight" type="number" min="0" max="100" value="${w?.weight ?? ""}"></td><td><input class="pj-w-start" type="date" value="${esc(w?.start ?? "")}"></td><td><input class="pj-w-end" type="date" value="${esc(w?.end ?? "")}"></td><td><select class="pj-w-sub">${subOptions(w?.subUnit)}</select></td><td><input type="hidden" class="pj-w-id" value="${esc(w?.id ?? "")}"><input type="hidden" class="pj-w-progress" value="${w?.progress ?? 0}"><button class="btn btn-light" onclick="this.closest('tr').remove()">×</button></td></tr>`
  const msRow = (m?: Milestone) => `<tr><td><input class="pj-m-name" value="${esc(m?.name ?? "")}"></td><td><input class="pj-m-due" type="date" value="${esc(m?.due ?? "")}"></td><td><input type="hidden" class="pj-m-id" value="${esc(m?.id ?? "")}"><input type="hidden" class="pj-m-done" value="${esc(m?.doneAt ?? "")}"><button class="btn btn-light" onclick="this.closest('tr').remove()">×</button></td></tr>`

  function projectForm(id: string) {
    const role = ctx.role()
    if (!canCreateProject(role)) return
    const p = id ? stored(id) : undefined
    const year = localToday().slice(0, 4)
    const nextId = `VLDC-${year}-${String(vldcData.get("projects").filter((x) => x.id.startsWith(`VLDC-${year}-`)).length + 101).slice(-3)}`
    const unitValue = p?.subUnit || unitCodeOf(p?.unit) || ""
    const roles = Object.keys(ROLE_TITLES).filter((r) => r !== "admin")
    ctx.openModal(p ? `Sửa dự án • ${p.id}` : "Lập dự án mới", `<div class="form-grid">
<div><label>Mã dự án *</label><input id="pj-id" value="${esc(p?.id ?? nextId)}"${p ? " disabled" : ""}></div>
<div><label>Trạng thái</label><select id="pj-status">${PROJECT_STATUSES.map((s) => `<option${s === (p?.status ?? "Đang thực hiện") ? " selected" : ""}>${s}</option>`).join("")}</select></div>
<div class="full"><label>Tên dự án *</label><input id="pj-name" value="${esc(p?.name ?? "")}"></div>
<div><label>Đơn vị / tổ thực hiện *</label><select id="pj-unit">${unitChoiceGroups(vldcData.get("subUnits")).map((g) => `<optgroup label="${esc(g.name)}">${g.options.map((o) => `<option value="${esc(o.value)}"${o.value === unitValue ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</optgroup>`).join("")}</select></div>
<div><label>Chủ nhiệm</label><select id="pj-lead">${roles.map((r) => `<option value="${r}"${r === (p?.leadRole ?? "chunhiem") ? " selected" : ""}>${esc(roleTitle(r))} – ${esc(personOf(r))}</option>`).join("")}</select></div>
<div><label>Ngân sách (tỷ đồng) *</label><input id="pj-budget" type="number" min="0" step="0.1" value="${p?.budget ?? ""}"></div>
<div><label>Bắt đầu *</label><input id="pj-start" type="date" value="${esc(p?.start ?? localToday())}"></div>
<div><label>Kết thúc *</label><input id="pj-end" type="date" value="${esc(p?.end ?? "")}"></div></div>
<h4 style="margin-top:12px">Hạng mục (WBS) – tổng trọng số 100%</h4><div class="vx-staff-table"><table id="pj-wbs" class="vx-pj-form"><thead><tr><th>Hạng mục</th><th>Trọng số %</th><th>Bắt đầu</th><th>Kết thúc</th><th>Tổ thực hiện</th><th></th></tr></thead><tbody>${(p?.wbs.length ? p.wbs : [undefined]).map((w) => wbsRow(w)).join("")}</tbody></table></div>
<button class="btn btn-light" onclick="projectAddRow('pj-wbs')">+ Hạng mục</button>
<h4 style="margin-top:12px">Mốc</h4><div class="vx-staff-table"><table id="pj-ms" class="vx-pj-form"><thead><tr><th>Mốc</th><th>Hạn</th><th></th></tr></thead><tbody>${(p?.milestones ?? []).map((m) => msRow(m)).join("")}</tbody></table></div>
<button class="btn btn-light" onclick="projectAddRow('pj-ms')">+ Mốc</button>
<div style="margin-top:14px"><button class="btn btn-primary" ${jsCall("projectSave", p?.id ?? "")}>${p ? "Lưu thay đổi" : "Lập dự án"}</button></div>`)
  }

  function projectSave(id: string) {
    const role = ctx.role()
    if (!canCreateProject(role)) return
    const prev = id ? stored(id) : undefined
    const unit = resolveUnitChoice(value("pj-unit"), vldcData.get("subUnits"))
    const wbs: WbsItem[] = [...document.querySelectorAll("#pj-wbs tbody tr")].map((row, i) => {
      const weight = Number(cellValue(row, "pj-w-weight"))
      const progress = Number(cellValue(row, "pj-w-progress")) || 0
      const start = cellValue(row, "pj-w-start"), end = cellValue(row, "pj-w-end"), sub = cellValue(row, "pj-w-sub")
      return {
        id: cellValue(row, "pj-w-id") || `W${i + 1}-${Date.now().toString(36)}`, name: cellValue(row, "pj-w-name"), progress,
        status: progress >= 100 ? "Hoàn thành" : progress > 0 ? "Đang thực hiện" : "Chưa bắt đầu",
        ...(weight ? { weight } : {}), ...(start ? { start } : {}), ...(end ? { end } : {}), ...(sub ? { subUnit: sub } : {}),
      }
    }).filter((w) => w.name || w.weight)
    const milestones: Milestone[] = [...document.querySelectorAll("#pj-ms tbody tr")].map((row, i) => {
      const done = cellValue(row, "pj-m-done")
      return { id: cellValue(row, "pj-m-id") || `M${i + 1}-${Date.now().toString(36)}`, name: cellValue(row, "pj-m-name"), due: cellValue(row, "pj-m-due"), ...(done ? { doneAt: done } : {}) }
    }).filter((m) => m.name && m.due)
    const next: StoredProject = {
      ...(prev ?? { crs: [], log: [] }),
      id: prev?.id ?? value("pj-id"), name: value("pj-name"), unit: unit?.unitName ?? "", subUnit: unit?.subUnit ?? "",
      leadRole: value("pj-lead"), budget: Number(value("pj-budget")), start: value("pj-start"), end: value("pj-end"),
      status: value("pj-status") as ProjectStatus, wbs, milestones,
    }
    if (!unit) return alert("Vui lòng chọn đơn vị thực hiện")
    const problems = projectProblems(next, vldcData.get("projects"), !prev)
    if (problems.length) return alert(problems.join("\n"))
    void vldcData.save("projects", next)
    if (!prev || prev.leadRole !== next.leadRole) notice(next.leadRole as string, `Dự án ${next.id}`, `Bạn là chủ nhiệm dự án "${next.name}".`, role)
    ctx.closeModal()
    rerender()
  }

  // ---------- Tiến độ, mốc, yêu cầu thay đổi
  function projectProgressForm(id: string) {
    const p = stored(id)
    if (!p || !canUpdateProject(p, ctx.role())) return
    ctx.openModal(`Cập nhật tiến độ • ${p.id}`, `<div class="vx-staff-table"><table id="pj-prog"><tr><th>Hạng mục</th><th>Trọng số</th><th>Tiến độ %</th></tr>${p.wbs.map((w, i) => `<tr><td>${esc(w.name)}</td><td>${w.weight ?? "–"}%</td><td><input class="pj-p" data-key="${esc(w.id ?? String(i))}" type="number" min="0" max="100" value="${w.progress}"></td></tr>`).join("")}</table></div>
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
    if (!p || role !== PROJECT_APPROVER) return
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
    projectCrSave, projectCrDecide,
    // Older pages open projects through projectDetail.
    projectDetail: projectOpen,
    projectAddRow: (table: string) => {
      const body = document.querySelector(`#${table} tbody`)
      if (body) body.insertAdjacentHTML("beforeend", table === "pj-wbs" ? wbsRow() : msRow())
    },
  })
}

