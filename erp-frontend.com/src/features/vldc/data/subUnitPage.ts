import { escapeHtml as esc, jsCall } from "../workflow/html"
import { RATING_LABELS, subUnitKpis, unitKpis, type UnitKpi } from "../workflow/kpi"
import { isClosed } from "../workflow/rules"
import { workflowStore } from "../workflow/repository"
import { localToday, vnDate } from "./dates"
import { UNIT_DEFS, unitName, type UnitCode } from "./org"
import { managesAllUnits } from "./access"
import { kpis } from "./pages"
import { vldcData } from "./registry"
import { staffView } from "./staffView"
import { SUB_UNIT_KINDS, dissolveBlockers, dissolveSubUnit, orgTree, saveSubUnitCheck, subUnitsOf, withHead } from "./subUnitCore"
import type { SubUnit, SubUnitKind } from "./types"

/** Không gian đơn vị: Liên đoàn → đơn vị → tổ/phòng, with KPIs per tổ; the federation head restructures it. */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const state = { collapsed: new Set<string>() }
const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const unitLabel = (code: string) => (UNIT_DEFS.some((u) => u.code === code) ? unitName(code as UnitCode) : code)
const RATING_CLS: Record<string, string> = { good: "b-ok", watch: "b-warn", bad: "b-danger", none: "b-info" }
const scoreBadge = (k?: UnitKpi) => (k ? `<span class="badge ${RATING_CLS[k.rating]}" title="${RATING_LABELS[k.rating]}">${k.score ?? "–"}</span>` : "")
const overdueOf = (k: UnitKpi, today: string) => k.items.filter((x) => !isClosed(x) && x.due < today).length

export function installSubUnitPage(render: Record<string, () => void>, ctx: Ctx) {
  const subs = () => vldcData.get("subUnits")
  const staff = () => staffView()
  const find = (id: string) => subs().find((s) => s.id === id)
  const manager = () => managesAllUnits(ctx.role())
  const personName = (id?: string) => (id ? staff().find((p) => p.id === id)?.name : undefined)

  function pageHtml(): string {
    const today = localToday()
    const items = workflowStore.items()
    const tree = orgTree(subs(), staff())
    const unitK = unitKpis(items, today)
    const allSubs = subs().filter((s) => s.active)
    const subK = new Map(subUnitKpis(allSubs, items, today).map((k) => [k.unit.id, k]))
    const tagged = items.filter((x) => x.subUnit && !isClosed(x)).length
    const unassigned = tree.reduce((n, u) => n + (u.unit === "BLD" ? 0 : u.unassigned), 0)
    const head = `${kpis(
      `<div class="kpi"><div class="label">Đơn vị</div><div class="value">${tree.length}</div><div class="sub">Ban lãnh đạo, phòng chức năng, đơn vị trực thuộc</div></div>`,
      `<div class="kpi"><div class="label">Tổ / phòng</div><div class="value">${allSubs.length}</div><div class="sub">Đang hoạt động</div></div>`,
      `<div class="kpi"><div class="label">Việc giao tới tổ</div><div class="value">${tagged}</div><div class="sub">Đang mở</div></div>`,
      `<div class="kpi ${unassigned ? "vx-kpi-alert" : ""}"><div class="label">Chưa xếp tổ</div><div class="value">${unassigned}</div><div class="sub">Nhân sự thuộc đơn vị nhưng chưa vào tổ nào</div></div>`,
    )}`
    const units = tree.map((u) => {
      const k = unitK.find((x) => x.unit.id === u.unit)
      const open = !state.collapsed.has(u.unit)
      const rows = u.children.map(({ sub, staff: n }) => {
        const sk = subK.get(sub.id)
        const late = sk ? overdueOf(sk, today) : 0
        return `<div class="vx-org-row vx-cap-pick" ${jsCall("subOpen", sub.id)}><div><span class="badge b-purple">${esc(sub.kind)}</span> <b>${esc(sub.name)}</b><div class="mini">Tổ trưởng: ${esc(personName(sub.headId) ?? "chưa chỉ định")}</div></div>
<div class="mini">${n} người</div><div class="mini">${sk?.open ?? 0} việc mở${late ? ` • <span style="color:var(--danger)">${late} quá hạn</span>` : ""}</div><div>${scoreBadge(sk)}</div></div>`
      }).join("")
      return `<div class="card vx-org-unit"><div class="vx-org-unit-head"><button class="vx-plan-toggle" ${jsCall("subToggle", u.unit)}>${open ? "▾" : "▸"}</button>
<div><h3 style="margin:0">${esc(unitLabel(u.unit))}</h3><div class="mini">${u.staff} người • ${u.children.length} tổ/phòng${u.unassigned && u.unit !== "BLD" ? ` • ${u.unassigned} chưa xếp tổ` : ""}${k ? ` • ${k.open} việc mở` : ""}</div></div>
<div class="toolbar">${k ? `KPI ${scoreBadge(k)}` : ""}${manager() && u.unit !== "BLD" ? `<button class="btn btn-light" ${jsCall("subForm", u.unit, "")}>+ Thêm tổ/phòng</button>` : ""}</div></div>
${open ? rows || '<div class="mini" style="padding:8px 0">Chưa chia tổ/phòng.</div>' : ""}</div>`
    }).join("")
    // Không gian đơn vị has no menu entry of its own: it opens from Phòng ban and leads back there.
    return `<div class="toolbar" style="margin-bottom:12px"><button class="btn btn-light" onclick="show('organization')">← Phòng ban</button></div>${head}<div class="mini" style="margin:12px 0 8px">Bấm vào một tổ/phòng để xem nhân sự, công việc, KPI${manager() ? ", giao việc hoặc sửa cơ cấu" : ""}.</div>${units}`
  }

  function rerender() {
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }
  render.units = rerender

  function subOpen(id: string) {
    const s = find(id)
    if (!s) return
    const today = localToday()
    const items = workflowStore.items()
    const [k] = subUnitKpis([s], items, today)
    const members = staff().filter((p) => p.subUnit === s.id)
    const metric = (l: string, v: string) => `<div class="metric"><span>${l}</span><b>${v}</b></div>`
    const crit = (l: string, v: number | null) => metric(l, v == null ? "–" : `${v}%`)
    const open = k.items.filter((x) => !isClosed(x))
    const actions = manager() && s.active
      ? `<div class="toolbar" style="margin-top:12px"><button class="btn btn-light" ${jsCall("subForm", s.unit, s.id)}>Sửa</button><button class="btn btn-light" ${jsCall("subDissolve", s.id)}>Giải thể</button></div>`
      : ""
    ctx.openModal(`${s.kind} • ${s.name}`, `<div class="mini">${esc(unitLabel(s.unit))}${s.active ? "" : " • đã giải thể"}</div><p>${esc(s.duty)}</p>
<div class="grid twoeq"><div>${metric("Tổ trưởng", esc(personName(s.headId) ?? "Chưa chỉ định"))}${metric("Nhân sự", `${members.length} người`)}${metric("Việc đang mở", String(open.length))}${metric("Điểm KPI", k.score == null ? "–" : `${k.score} • ${RATING_LABELS[k.rating]}`)}${crit("Tiến độ", k.criteria.progress.value)}${crit("Đúng hạn", k.criteria.onTime.value)}${crit("Chất lượng", k.criteria.quality.value)}</div>
<div><h4 style="margin-top:0">Việc đang làm</h4>${open.map((x) => `<div class="alert vx-cap-pick" ${jsCall("wfOpen", x.id)}><span class="dot ${x.due < today ? "red" : "green"}"></span><div><b>${esc(x.title)}</b><div class="mini">${esc(x.status)} • ${x.progress}% • hạn ${esc(vnDate(x.due))}</div></div></div>`).join("") || '<div class="mini">Không có việc đang mở.</div>'}</div></div>
<h4>Nhân sự (${members.length})</h4><div class="vx-org-members">${members.map((p) => `<button class="vx-org-member" ${jsCall("capStaff", p.id)}><b>${esc(p.name)}</b><span class="mini">${esc(p.title)}${p.id === s.headId ? " • tổ trưởng" : ""}</span></button>`).join("") || '<div class="mini">Chưa có người.</div>'}</div>
<div class="toolbar" style="margin-top:8px"><button class="btn btn-light" ${jsCall("capGoto", "subUnit", s.id)}>Xem trong danh sách nhân sự</button></div>${actions}`)
  }

  function subForm(unit: string, id: string) {
    if (!manager()) return
    const s = id ? find(id) : undefined
    const members = staff().filter((p) => (s ? p.subUnit === s.id : p.unit === unit))
    ctx.openModal(s ? `Sửa ${s.kind.toLowerCase()} • ${s.name}` : `Thêm tổ/phòng • ${unitLabel(unit)}`, `<div class="form-grid">
<div class="full"><label>Tên *</label><input id="su-name" value="${esc(s?.name ?? "")}"></div>
<div><label>Loại</label><select id="su-kind">${SUB_UNIT_KINDS.map((k) => `<option${k === (s?.kind ?? "Tổ") ? " selected" : ""}>${k}</option>`).join("")}</select></div>
<div><label>Tổ trưởng</label><select id="su-head"><option value="">– Chưa chỉ định –</option>${members.map((p) => `<option value="${esc(p.id)}"${p.id === s?.headId ? " selected" : ""}>${esc(p.name)} – ${esc(p.title)}</option>`).join("")}</select></div>
<div class="full"><label>Chức năng, nhiệm vụ</label><textarea id="su-duty" rows="2">${esc(s?.duty ?? "")}</textarea></div></div>
${s ? "" : '<div class="mini" style="margin-top:6px">Tổ trưởng chọn trong nhân sự của đơn vị; người được chọn sẽ được chuyển vào tổ mới.</div>'}
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("subSave", unit, s?.id ?? "")}>${s ? "Lưu" : "Thêm"}</button>`)
  }

  function subSave(unit: string, id: string) {
    if (!manager()) return
    const prev = id ? find(id) : undefined
    const headId = value("su-head") || undefined
    const next: SubUnit = {
      ...(prev ?? { id: `${unit}-${Date.now().toString(36).toUpperCase()}`, unit, active: true, createdAt: new Date().toISOString() }),
      name: value("su-name"), kind: value("su-kind") as SubUnitKind, duty: value("su-duty"), headId,
    }
    const problem = saveSubUnitCheck(next, subs())
    if (problem) return alert(problem)
    // One person heads one tổ: the tổ they headed before loses its head.
    for (const changed of withHead(next, subs())) void vldcData.save("subUnits", changed)
    // A head picked for a new tổ moves into it.
    const head = headId ? staff().find((p) => p.id === headId) : undefined
    if (head && head.subUnit !== next.id) void vldcData.save("staffProfiles", { ...head, unit: next.unit, subUnit: next.id })
    ctx.closeModal()
    rerender()
  }

  function subDissolve(id: string) {
    const s = find(id)
    if (!s || !manager()) return
    const blockers = dissolveBlockers(s, staff(), workflowStore.items(), vldcData.get("projects"))
    if (blockers.length) return alert(`Chưa thể giải thể ${s.name}: ${blockers.join(", ")}. Hãy điều chuyển nhân sự, hoàn thành/chuyển việc và giao hạng mục dự án cho tổ khác trước.`)
    if (!confirm(`Giải thể ${s.name}? Lịch sử công việc của tổ vẫn được giữ.`)) return
    void vldcData.save("subUnits", dissolveSubUnit(s, new Date().toISOString()))
    ctx.closeModal()
    rerender()
  }

  Object.assign(window, {
    subOpen, subForm, subSave, subDissolve,
    subToggle: (unit: string) => {
      if (state.collapsed.has(unit)) state.collapsed.delete(unit)
      else state.collapsed.add(unit)
      rerender()
    },
  })
}

/** Active sub units of the unit a role belongs to, for pickers (e.g. the directive form). */
export const subUnitOptions = (unit: string | undefined) => (unit ? subUnitsOf(unit, vldcData.get("subUnits")) : [])
