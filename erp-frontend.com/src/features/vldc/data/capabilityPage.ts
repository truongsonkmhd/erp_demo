import { escapeHtml as esc, jsCall } from "../workflow/html"
import { hasPerm } from "../workflow/rules"
import { localToday, vnDate } from "./dates"
import { UNIT_DEFS, unitName, type UnitCode } from "./org"
import { managedUnits } from "./access"
import { subTabsHtml } from "./menuPolicy"
import { bar } from "./pages"
import { vldcData } from "./registry"
import { allStaffView, staffView } from "./staffView"
import {
  EDUCATION_LEVELS, EMPTY_STAFF_FILTER, RETIRE_AGE, ageOf, capabilityStats, certState, filterStaff, hrSummary, sortStaff,
  type StaffFilter, type StaffSort,
} from "./staffCore"
import { subUnitsOf } from "./subUnitCore"
import { errorText, fetchSkillCatalog, fetchTransfers, saveSkills, saveStaff, type SkillDef } from "./hrApi"
import type { Education, StaffCert, StaffProfile, StaffSkill } from "./types"

/**
 * Nhân sự (staff list, hồ sơ, chứng chỉ, điều chuyển, nghỉ việc) and Năng lực (capability overview + skill matrix),
 * both from the staff profiles the backend keeps. Writes go through hrApi: vldc-hr:create works on the whole
 * Liên đoàn, vldc-hr:update alone on the units the role manages, vldc-hr:delete is leaving / coming back.
 */

type Ctx = { role(): string; perms(): string[]; openModal(title: string, html: string): void; closeModal(): void }

const PAGE_SIZE = 20
const FIELD_UNITS: UnitCode[] = ["HK", "MD", "DB", "TT"]
const DEFAULT_SKILLS: SkillDef[] = [
  { code: "geophysics", name: "Địa vật lý" }, { code: "gis", name: "GIS – Bản đồ" }, { code: "data", name: "Xử lý dữ liệu" }, { code: "pm", name: "Quản lý dự án" },
]
const state = {
  filter: { ...EMPTY_STAFF_FILTER } as StaffFilter, sort: "name" as StaffSort, dir: 1 as 1 | -1, page: 0, scrollToList: false,
  skillUnit: "", skillQuery: "", expertSkill: "geophysics", expertMin: 4,
  skills: DEFAULT_SKILLS, certRows: [] as StaffCert[], busy: false,
}
const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const checked = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.checked ?? false
const unitLabel = (code: string) => (UNIT_DEFS.some((u) => u.code === code) ? unitName(code as UnitCode) : code)
const shortUnit = (code: string) => UNIT_DEFS.find((u) => u.code === code)?.short ?? code
const subName = (id?: string) => (id ? vldcData.get("subUnits").find((s) => s.id === id)?.name : undefined)
const option = (v: string, label: string, selected: boolean) => `<option value="${esc(v)}"${selected ? " selected" : ""}>${esc(label)}</option>`

const AGE_OPTIONS: [string, string][] = [["under30", "Dưới 30"], ["30to45", "30–45"], ["over45", "Trên 45"]]
const EXP_OPTIONS: [string, string][] = [["under5", "Dưới 5 năm"], ["from5to15", "5–15 năm"], ["over15", "Trên 15 năm"]]
const STATUS_OPTIONS: [string, string][] = [["left", "Đã nghỉ việc"], ["all", "Tất cả trạng thái"]]
const CERT_LABEL = { expired: ["Hết hạn", "b-danger"], expiring: ["Sắp hết hạn", "b-warn"], valid: ["Còn hạn", "b-ok"] } as const
const STATUS_BADGE: Record<string, string> = { TAM_NGHI: '<span class="badge b-warn">Tạm nghỉ</span>', NGHI_VIEC: '<span class="badge b-danger">Đã nghỉ việc</span>' }

function certBadges(p: StaffProfile, today: string): string {
  if (!p.certs.length) return '<span class="mini">–</span>'
  return p.certs.map((c) => {
    const [label, cls] = CERT_LABEL[certState(c.expiry, today)]
    return `<span class="badge ${cls}" title="${esc(c.name)} • ${c.expiry ? esc(vnDate(c.expiry)) : "không thời hạn"}">${label}</span>`
  }).join(" ")
}

function select(key: keyof StaffFilter, all: string, options: [string, string][]): string {
  const current = state.filter[key]
  return `<select data-key="${key}" onchange="capFilter(this.dataset.key,this.value)"><option value="">${all}</option>${options.map(([v, l]) => option(v, l, v === current)).join("")}</select>`
}

let ctxRef: Ctx | undefined
const perms = () => ctxRef?.perms() ?? []
/** Adds people and works anywhere in the Liên đoàn. */
const hrWhole = () => hasPerm(perms(), "vldc-hr:create")
const canEdit = (unit: string) => hrWhole() || (hasPerm(perms(), "vldc-hr:update") && managedUnits(ctxRef?.role() ?? "").has(unit))
const canLeave = (unit: string) => canEdit(unit) && hasPerm(perms(), "vldc-hr:delete")
const canAccounts = () => hasPerm(perms(), "vldc-accounts:create")

function listHtml(staff: StaffProfile[], today: string): string {
  const rows = sortStaff(filterStaff(staff, state.filter, today), state.sort, state.dir, today)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  state.page = Math.min(state.page, pages - 1)
  const shown = rows.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE)
  const th = (key: StaffSort, label: string) =>
    `<th class="vx-staff-sort" ${jsCall("capSort", key)}>${label}${state.sort === key ? (state.dir === 1 ? " ▲" : " ▼") : ""}</th>`
  const units = UNIT_DEFS.filter((u) => staff.some((p) => p.unit === u.code)).map((u): [string, string] => [u.code, u.short])
  const working = staff.filter((p) => p.status !== "NGHI_VIEC").length
  const filtered = Object.values(state.filter).some(Boolean)
  const nameCell = (p: StaffProfile) => `<b>${esc(p.name)}</b> ${STATUS_BADGE[p.status ?? ""] ?? ""}<div class="mini">${esc(p.id)}${p.account ? ` • <span title="Tài khoản đăng nhập">🔑 ${esc(p.account)}${p.accountActive === false ? " (khoá)" : ""}</span>` : ""}</div>`
  return `<div class="card" id="hr-staff"><div class="card-head"><div><h3>Danh sách nhân sự</h3><div class="mini">Đang hiển thị ${rows.length}/${working} người đang làm việc${filtered ? " theo bộ lọc" : ""}</div></div><div class="toolbar">${filtered ? `<button class="btn btn-light" ${jsCall("capReset")}>Bỏ lọc</button>` : ""}${hrWhole() ? `<button class="btn btn-primary" ${jsCall("staffForm", "")}>+ Thêm nhân sự</button>` : ""}</div></div>
<div class="vx-staff-filters"><input placeholder="Tìm tên, mã, chuyên ngành, chức danh..." value="${esc(state.filter.query)}" onchange="capFilter('query',this.value)">${select("unit", "Tất cả đơn vị", units)}${select("subUnit", "Tất cả tổ/phòng", vldcData.get("subUnits").filter((s) => s.active && (!state.filter.unit || s.unit === state.filter.unit)).map((s): [string, string] => [s.id, `${s.name} – ${shortUnit(s.unit)}`]))}${select("education", "Tất cả trình độ", EDUCATION_LEVELS.map((e) => [e, e]))}${select("age", "Tất cả độ tuổi", AGE_OPTIONS)}${select("exp", "Tất cả kinh nghiệm", EXP_OPTIONS)}${select("cert", "Tất cả chứng chỉ", [["expiring", "Hết hạn / sắp hết hạn"]])}${select("status", "Đang làm việc", STATUS_OPTIONS)}</div>
<div class="vx-staff-table"><table><tr>${th("name", "Họ tên")}${th("age", "Tuổi")}${th("education", "Học vấn")}<th>Chuyên ngành</th>${th("experience", "Kinh nghiệm")}${th("unit", "Đơn vị")}<th>Chức danh</th><th>Chứng chỉ</th></tr>
${shown.map((p) => `<tr class="vx-staff-row${p.status === "NGHI_VIEC" ? " vx-staff-left" : ""}" ${jsCall("capStaff", p.id)}><td>${nameCell(p)}</td><td>${ageOf(p, today)}</td><td>${esc(p.education)}</td><td>${esc(p.major)}</td><td>${p.experience} năm</td><td>${esc(shortUnit(p.unit))}${subName(p.subUnit) ? `<div class="mini">${esc(subName(p.subUnit) as string)}</div>` : ""}</td><td>${esc(p.title)}</td><td>${certBadges(p, today)}</td></tr>`).join("") || '<tr><td colspan="8" class="mini">Không có nhân sự phù hợp.</td></tr>'}</table></div>
${pages > 1 ? `<div class="vx-staff-pager"><button class="btn btn-light" ${jsCall("capPage", String(state.page - 1))}${state.page === 0 ? " disabled" : ""}>‹ Trước</button><span class="mini">Trang ${state.page + 1}/${pages}</span><button class="btn btn-light" ${jsCall("capPage", String(state.page + 1))}${state.page >= pages - 1 ? " disabled" : ""}>Sau ›</button></div>` : ""}</div>`
}

const dots = (n: number) => `<span class="vx-skill" title="${n ? `${n}/5` : "Chưa đánh giá"}">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
const byUnitOrder = <T extends { unit: string }>(rows: T[]) =>
  [...rows].sort((a, b) => UNIT_DEFS.findIndex((u) => u.code === a.unit) - UNIT_DEFS.findIndex((u) => u.code === b.unit))
/** Capability figures open the staff list on the Nhân sự page with that filter. */
const goto = (key: string, value: string) => jsCall("capGoto", key, value)
const levelOf = (s: StaffSkill | undefined, code: string) => s?.levels?.[code] ?? ((s as Record<string, unknown> | undefined)?.[code] as number | undefined) ?? 0

/** Skill matrix: people × skills (1–5), filtered by unit/name, plus a finder for experts of one skill. */
function skillMatrixHtml(staff: StaffProfile[]): string {
  const rows = new Map(vldcData.get("staffSkills").map((s) => [s.id, s]))
  const q = state.skillQuery.toLowerCase()
  const people = staff.filter((p) => rows.has(p.id) && (!state.skillUnit || p.unit === state.skillUnit) && (!q || `${p.name} ${p.major} ${p.id}`.toLowerCase().includes(q)))
    .sort((a, b) => UNIT_DEFS.findIndex((u) => u.code === a.unit) - UNIT_DEFS.findIndex((u) => u.code === b.unit) || a.name.localeCompare(b.name, "vi"))
  const assessed = staff.filter((p) => rows.has(p.id)).length
  const unassessed = staff.filter((p) => !rows.has(p.id) && canEdit(p.unit))
  const units = UNIT_DEFS.filter((u) => staff.some((p) => p.unit === u.code && rows.has(p.id)))
  const experts = staff.filter((p) => levelOf(rows.get(p.id), state.expertSkill) >= state.expertMin)
    .sort((a, b) => levelOf(rows.get(b.id), state.expertSkill) - levelOf(rows.get(a.id), state.expertSkill) || b.experience - a.experience)
  const skillName = state.skills.find((s) => s.code === state.expertSkill)?.name ?? state.expertSkill
  const shown = people.slice(0, 60)
  return `<div class="grid two" style="margin-top:14px"><div class="card"><div class="card-head"><div><h3>Skill matrix</h3><div class="mini">${assessed}/${staff.length} người đã đánh giá • mức 1–5${people.length > shown.length ? ` • hiện ${shown.length}/${people.length}, lọc thêm để xem hết` : ""}</div></div>${unassessed.length ? `<select onchange="if(this.value)skillForm(this.value)"><option value="">+ Đánh giá thêm người…</option>${unassessed.map((p) => option(p.id, `${p.name} – ${shortUnit(p.unit)}`, false)).join("")}</select>` : ""}</div>
<div class="vx-staff-filters"><input placeholder="Tìm tên, chuyên ngành..." value="${esc(state.skillQuery)}" onchange="skillFilter('query',this.value)"><select onchange="skillFilter('unit',this.value)"><option value="">Tất cả đơn vị</option>${units.map((u) => option(u.code, u.short, u.code === state.skillUnit)).join("")}</select></div>
<div class="vx-staff-table"><table><tr><th>Nhân sự</th>${state.skills.map((s) => `<th>${esc(s.name)}</th>`).join("")}</tr>
${shown.map((p) => `<tr class="${canEdit(p.unit) ? "vx-staff-row" : ""}" ${canEdit(p.unit) ? jsCall("skillForm", p.id) : ""}><td><b>${esc(p.name)}</b><div class="mini">${esc(shortUnit(p.unit))} • ${esc(p.major)}</div></td>${state.skills.map((s) => `<td>${dots(levelOf(rows.get(p.id), s.code))}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${state.skills.length + 1}" class="mini">Chưa có ai được đánh giá.</td></tr>`}</table></div></div>
<div class="card"><h3>Tìm chuyên gia</h3><div class="mini">Người đang làm việc có mức kỹ năng từ ngưỡng trở lên</div><div class="vx-staff-filters" style="margin-top:8px"><select onchange="skillFilter('expert',this.value)">${state.skills.map((s) => option(s.code, s.name, s.code === state.expertSkill)).join("")}</select><select onchange="skillFilter('min',this.value)">${[3, 4, 5].map((n) => option(String(n), `Từ mức ${n}`, n === state.expertMin)).join("")}</select></div>
${experts.slice(0, 12).map((p) => `<div class="alert vx-cap-pick" ${jsCall("capStaff", p.id)}><span class="dot ${p.onField ? "yellow" : "green"}"></span><div style="flex:1"><b>${esc(p.name)}</b><div class="mini">${esc(shortUnit(p.unit))} • ${esc(p.title)} • ${p.experience} năm${p.onField ? " • đang ở hiện trường" : ""}</div></div>${dots(levelOf(rows.get(p.id), state.expertSkill))}</div>`).join("") || `<div class="mini">Chưa có ai đạt mức ${state.expertMin} về ${esc(skillName)}.</div>`}
${experts.length > 12 ? `<div class="mini">… và ${experts.length - 12} người khác</div>` : ""}</div></div>`
}

/** Năng lực: the federation's capability at a glance. */
function capabilityHtml(): string {
  const staff = staffView()
  const today = localToday()
  const s = capabilityStats(staff)
  const h = hrSummary(staff, today)
  const edu = s.byEducation as Record<string, number>
  const direct = FIELD_UNITS.filter((u) => s.byUnit[u])
  const directStaff = direct.reduce((n, u) => n + s.byUnit[u], 0)
  const link = (key: string, value: string, label: string) => `<a href="javascript:void 0" ${goto(key, value)}>${label}</a>`
  const bands: [string, string, number][] = [["under30", "Dưới 30 tuổi", h.ageBands.under30], ["30to45", "30–45 tuổi", h.ageBands["30to45"]], ["over45", "Trên 45 tuổi", h.ageBands.over45]]
  const avgAge = s.total ? Math.round(staff.reduce((n, p) => n + ageOf(p, today), 0) / s.total) : 0
  return `<div class="capability-grid"><div class="cap-card vx-cap-pick" ${goto("", "")}><span class="official-badge">HỒ SƠ NHÂN SỰ</span><b class="big">${s.total}</b><div>Nhân lực đang làm việc</div><div class="mini">${EDUCATION_LEVELS.map((e) => `${edu[e]} ${e === "Tiến sĩ" ? "TS" : e === "Thạc sĩ" ? "ThS" : e === "Kỹ sư/Cử nhân" ? "KS/CN" : "KTV/CN"}`).join(" • ")}</div></div>
<div class="cap-card"><span class="official-badge">KINH NGHIỆM</span><b class="big">${link("exp", "over15", String(s.over15))}</b><div>${link("exp", "over15", "Trên 15 năm")}</div><div class="mini">${link("exp", "from5to15", `${s.from5to15} người từ 5–15 năm`)} • ${link("exp", "under5", `${s.under5} dưới 5 năm`)}</div></div>
<div class="cap-card"><span class="official-badge">ĐƠN VỊ THI CÔNG</span><b class="big">${directStaff}</b><div>Nhân sự ở ${direct.length} đơn vị trực thuộc</div><div class="mini">${direct.map((u) => link("unit", u, `${u} ${s.byUnit[u]}`)).join(" • ")}</div></div></div>
<div class="grid twoeq" style="margin-top:14px"><div class="card"><h3>Cơ cấu trình độ</h3>${EDUCATION_LEVELS.map((e) => `<div class="vx-cap-pick" ${goto("education", e)}>${bar(e, pct(edu[e], s.total), String(edu[e]))}</div>`).join("")}
<h3 style="margin-top:18px">Cơ cấu độ tuổi</h3>${bands.map(([key, label, n]) => `<div class="vx-cap-pick" ${goto("age", key)}>${bar(label, pct(n, s.total), String(n))}</div>`).join("")}<div class="mini" style="margin-top:8px">${h.retiring.length} người từ ${RETIRE_AGE} tuổi trở lên • tuổi bình quân ${avgAge}</div></div>
<div class="card"><h3>Năng lực theo đơn vị</h3><div class="mini">Tổng số và số người đang ở hiện trường</div>${byUnitOrder(h.units).map((u) => `<div class="vx-hr-unit vx-cap-pick" ${goto("unit", u.unit)}><div class="vx-hr-unit-head"><span>${esc(unitLabel(u.unit))}</span><b>${u.total} người</b></div><div class="vx-hr-bar"><i style="width:${pct(u.onField, u.total)}%"></i></div><div class="mini">${u.onField ? `${u.onField} ở hiện trường (${pct(u.onField, u.total)}%)` : "Làm việc tại văn phòng"}</div></div>`).join("")}</div></div>
${skillMatrixHtml(staff)}
<div class="toolbar" style="margin-top:14px"><button class="btn btn-primary" ${goto("", "")}>Xem danh sách nhân sự</button><span class="mini">Bấm vào bất kỳ con số nào để mở danh sách nhân sự tương ứng.</span></div>`
}

/** Nhân sự: the people themselves – KPIs filter the list in place. */
function hrHtml(): string {
  return `<div>${listHtml(allStaffView(), localToday())}</div>`
}

function renderInto(html: () => string) {
  const el = content()
  if (!el) return
  el.innerHTML = html()
  if (state.scrollToList) {
    state.scrollToList = false
    document.getElementById("hr-staff")?.scrollIntoView({ block: "start" })
  }
}
const renderHr = () => renderInto(() => subTabsHtml("hr") + hrHtml())
const renderCapability = () => renderInto(() => subTabsHtml("capability") + capabilityHtml())

/** Next free NS-xxx code. */
function nextCode(): string {
  const max = allStaffView().reduce((n, p) => Math.max(n, Number(/^NS-(\d+)$/.exec(p.id)?.[1] ?? 0)), 0)
  return `NS-${String(max + 1).padStart(3, "0")}`
}

/** "unit|tổ" choices: the unit itself, then its active tổ/phòng; only units the role may move people into. */
function placeOptions(selectedUnit: string, selectedSub: string, allowed: (unit: string) => boolean): string {
  const subs = vldcData.get("subUnits")
  return UNIT_DEFS.filter((u) => allowed(u.code) || u.code === selectedUnit).map((u) => `<optgroup label="${esc(u.name)}">${option(`${u.code}|`, `${u.short} (trực thuộc đơn vị)`, u.code === selectedUnit && !selectedSub)}${subUnitsOf(u.code, subs).map((s) => option(`${u.code}|${s.id}`, `${s.name}`, s.id === selectedSub)).join("")}</optgroup>`).join("")
}

export function installCapabilityPage(render: Record<string, () => void>, ctx: Ctx) {
  ctxRef = ctx
  render.capability = () => {
    renderCapability()
    if (state.skills === DEFAULT_SKILLS) {
      void fetchSkillCatalog().then((list) => {
        if (list.length) state.skills = list
        if (document.querySelector(".capability-grid")) renderCapability()
      }).catch(() => undefined)
    }
  }
  render.hr = renderHr
  const refresh = (scroll = false) => {
    state.scrollToList = scroll
    renderHr()
  }
  const find = (id: string) => allStaffView().find((x) => x.id === id)

  async function run(task: () => Promise<unknown>, done?: () => void) {
    if (state.busy) return
    state.busy = true
    try {
      await task()
      done?.()
    } catch (e) {
      alert(errorText(e))
    } finally {
      state.busy = false
    }
  }

  function capStaff(id: string) {
    const p = find(id)
    if (!p) return
    const today = localToday()
    const metric = (l: string, v: string) => `<div class="metric"><span>${l}</span><b>${v}</b></div>`
    const editable = canEdit(p.unit) && p.status !== "NGHI_VIEC"
    const actions = [
      editable ? `<button class="btn btn-primary" ${jsCall("staffForm", p.id)}>Sửa hồ sơ</button>` : "",
      editable ? `<button class="btn btn-light" ${jsCall("staffMoveForm", p.id)}>Điều chuyển</button>` : "",
      editable ? `<button class="btn btn-light" ${jsCall("skillForm", p.id)}>Đánh giá kỹ năng</button>` : "",
      editable && !p.account && canAccounts() ? `<button class="btn btn-light" ${jsCall("accCreate", p.id)}>Tạo tài khoản</button>` : "",
      canLeave(p.unit) && p.status !== "NGHI_VIEC" ? `<button class="btn btn-light" style="color:var(--danger)" ${jsCall("staffLeave", p.id)}>Cho nghỉ việc</button>` : "",
      canLeave(p.unit) && p.status === "NGHI_VIEC" ? `<button class="btn btn-light" ${jsCall("staffReturn", p.id)}>Khôi phục làm việc</button>` : "",
    ].filter(Boolean).join("")
    ctx.openModal(`Hồ sơ nhân sự • ${p.id}`, `<h2 style="margin:0 0 4px">${esc(p.name)} ${STATUS_BADGE[p.status ?? ""] ?? ""}</h2><div class="mini">${esc(p.title)} • ${esc(unitLabel(p.unit))}${subName(p.subUnit) ? ` • ${esc(subName(p.subUnit) as string)}` : ""}</div>
<div class="grid twoeq" style="margin-top:12px"><div>${metric("Năm sinh", `${p.birthYear} (${ageOf(p, today)} tuổi)${p.gender ? ` • ${esc(p.gender)}` : ""}`)}${metric("Học vấn", esc(p.education))}${metric("Chuyên ngành", esc(p.major))}${metric("Kinh nghiệm", `${p.experience} năm`)}${metric("Nơi làm việc", p.onField ? "Đang ở hiện trường" : "Văn phòng")}${p.phone ? metric("Điện thoại", esc(p.phone)) : ""}${p.email ? metric("Email", esc(p.email)) : ""}${metric("Tài khoản", p.account ? `${esc(p.account)}${p.accountActive === false ? " (đã khoá)" : ""}` : "Chưa có")}${p.leftAt ? metric("Nghỉ việc từ", esc(vnDate(p.leftAt))) : ""}</div>
<div><h4 style="margin-top:0">Chứng chỉ</h4>${p.certs.map((c) => { const [label, cls] = CERT_LABEL[certState(c.expiry, today)]; return `<div class="metric"><span>${esc(c.name)}${c.number ? ` • số ${esc(c.number)}` : ""}<br><small>${c.expiry ? `Hạn ${esc(vnDate(c.expiry))}` : "Không thời hạn"}${c.issuedBy ? ` • ${esc(c.issuedBy)}` : ""}</small></span><b><span class="badge ${cls}">${label}</span></b></div>` }).join("") || '<div class="mini">Chưa có chứng chỉ.</div>'}
<h4>Quá trình công tác</h4><div id="st-history" class="mini">Đang tải…</div></div></div>${actions ? `<div class="toolbar" style="margin-top:12px">${actions}</div>` : ""}`)
    void fetchTransfers(p.id).then((list) => {
      const el = document.getElementById("st-history")
      if (!el) return
      el.innerHTML = list.length
        ? list.map((t) => `<div class="metric"><span>${esc(vnDate(t.date))} • ${t.from ? `${esc(t.from)} → ` : "Tiếp nhận vào "}${esc(t.to)}${t.note ? `<br><small>${esc(t.note)}</small>` : ""}</span><b class="mini">${esc(t.by ?? "")}</b></div>`).join("")
        : "Chưa có điều chuyển nào được ghi nhận."
    }).catch(() => {
      const el = document.getElementById("st-history")
      if (el) el.textContent = "Không tải được quá trình công tác."
    })
  }

  function certRowsHtml(): string {
    return `${state.certRows.map((c, i) => `<div class="vx-cert-row"><input data-cert="${i}" data-field="name" placeholder="Tên chứng chỉ *" value="${esc(c.name)}" onchange="certEdit(this)"><input data-cert="${i}" data-field="number" placeholder="Số hiệu" value="${esc(c.number ?? "")}" onchange="certEdit(this)"><input type="date" data-cert="${i}" data-field="expiry" value="${esc(c.expiry)}" title="Hạn (bỏ trống = không thời hạn)" onchange="certEdit(this)"><button class="btn btn-light" ${jsCall("certRemove", String(i))} title="Xoá">✕</button></div>`).join("")}<button class="btn btn-light" ${jsCall("certAdd")}>+ Thêm chứng chỉ</button>`
  }
  const redrawCerts = () => {
    const el = document.getElementById("st-certs")
    if (el) el.innerHTML = certRowsHtml()
  }

  /** Thêm / sửa hồ sơ (id "" = new person). */
  function staffForm(id: string) {
    const p = id ? find(id) : undefined
    if (p ? !canEdit(p.unit) : !hrWhole()) return
    state.certRows = (p?.certs ?? []).map((c) => ({ ...c }))
    const year = Number(localToday().slice(0, 4))
    const allowed = (unit: string) => canEdit(unit)
    ctx.openModal(p ? `Sửa hồ sơ • ${p.id}` : "Thêm nhân sự", `<div class="form-grid">
<div class="full"><label>Họ và tên *</label><input id="sf-name" value="${esc(p?.name ?? "")}"></div>
<div><label>Mã nhân sự</label><input id="sf-id" value="${esc(p?.id ?? nextCode())}" ${p ? "disabled" : ""}></div>
<div><label>Giới tính</label><select id="sf-gender"><option value="">–</option>${["Nam", "Nữ"].map((g) => option(g, g, p?.gender === g)).join("")}</select></div>
<div><label>Năm sinh *</label><input id="sf-birth" type="number" min="1940" max="${year - 18}" value="${p?.birthYear ?? year - 25}"></div>
<div><label>Số năm kinh nghiệm *</label><input id="sf-exp" type="number" min="0" max="60" value="${p?.experience ?? 0}"></div>
<div><label>Học vấn *</label><select id="sf-edu">${EDUCATION_LEVELS.map((e) => option(e, e, (p?.education ?? "Kỹ sư/Cử nhân") === e)).join("")}</select></div>
<div><label>Chuyên ngành *</label><input id="sf-major" value="${esc(p?.major ?? "")}"></div>
<div><label>Chức danh *</label><input id="sf-title" value="${esc(p?.title ?? "")}" placeholder="Kỹ sư, Chuyên viên, Tổ trưởng..."></div>
<div><label>Đơn vị / tổ *</label><select id="sf-place">${placeOptions(p?.unit ?? "", p?.subUnit ?? "", allowed)}</select></div>
<div><label>Điện thoại</label><input id="sf-phone" value="${esc(p?.phone ?? "")}"></div>
<div><label>Email</label><input id="sf-email" type="email" value="${esc(p?.email ?? "")}"></div>
<div class="full"><label><input type="checkbox" id="sf-field" ${p?.onField ? "checked" : ""}> Đang công tác ở hiện trường</label></div>
<div class="full"><label>Chứng chỉ</label><div id="st-certs">${certRowsHtml()}</div></div></div>
${p ? '<div class="mini" style="margin-top:6px">Đổi đơn vị/tổ ở đây được ghi vào quá trình công tác như một lần điều chuyển.</div>' : ""}
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("staffSave", p?.id ?? "")}>${p ? "Lưu" : "Thêm"}</button>`)
  }

  function staffSave(id: string) {
    const prev = id ? find(id) : undefined
    const [unit, subUnit] = value("sf-place").split("|")
    const code = prev?.id ?? value("sf-id").toUpperCase()
    const missing = [["sf-name", "họ tên"], ["sf-major", "chuyên ngành"], ["sf-title", "chức danh"]].filter(([f]) => !value(f)).map(([, l]) => l)
    if (!unit) missing.push("đơn vị")
    if (missing.length) return alert(`Vui lòng nhập ${missing.join(", ")}.`)
    if (!prev && allStaffView().some((x) => x.id === code)) return alert(`Mã ${code} đã có người dùng.`)
    const certs = state.certRows.map((c) => ({ ...c, name: c.name.trim() })).filter((c) => c.name)
    const next: StaffProfile = {
      ...(prev ?? { id: code, status: "DANG_LAM" as const }),
      id: code, name: value("sf-name"), birthYear: Number(value("sf-birth")), experience: Number(value("sf-exp")),
      education: value("sf-edu") as Education, major: value("sf-major"), title: value("sf-title"), unit, subUnit: subUnit ?? "",
      gender: (value("sf-gender") || undefined) as StaffProfile["gender"], phone: value("sf-phone") || undefined, email: value("sf-email") || undefined,
      onField: checked("sf-field"), certs,
    }
    delete next.account
    delete next.accountActive
    void run(() => saveStaff(next), () => { ctx.closeModal(); capStaff(code) })
  }

  /** Điều chuyển: any đơn vị/tổ the role may move people into, with a reason for the history. */
  function staffMoveForm(id: string) {
    const p = find(id)
    if (!p || !canEdit(p.unit)) return
    ctx.openModal(`Điều chuyển • ${p.name}`, `<div class="form-grid"><div class="full"><label>Đến đơn vị / tổ</label><select id="st-place">${placeOptions(p.unit, p.subUnit ?? "", (u) => canEdit(u))}</select></div>
<div class="full"><label>Lý do / quyết định</label><input id="st-note" placeholder="VD: QĐ số 12/QĐ-VLDC ngày ..."></div></div>
<div class="mini" style="margin-top:6px">Nếu đang là tổ trưởng của tổ cũ, người này thôi giữ vị trí đó. Tài khoản (nếu có) được chuyển theo đơn vị mới.</div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("staffMove", p.id)}>Lưu điều chuyển</button>`)
  }

  function staffMove(id: string) {
    const p = find(id)
    if (!p) return
    const [unit, subUnit] = value("st-place").split("|")
    if (unit === p.unit && (subUnit ?? "") === (p.subUnit ?? "")) return alert("Chọn nơi công tác mới.")
    void run(() => saveStaff({ ...p, unit, subUnit: subUnit ?? "", transferNote: value("st-note") || undefined }), () => { ctx.closeModal(); capStaff(id) })
  }

  function staffLeave(id: string) {
    const p = find(id)
    if (!p || !canLeave(p.unit)) return
    const date = prompt(`Ngày ${p.name} nghỉ việc (yyyy-mm-dd):`, localToday())
    if (!date) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert("Ngày không hợp lệ.")
    if (!confirm(`Xác nhận ${p.name} nghỉ việc từ ${vnDate(date)}?${p.account ? " Tài khoản đăng nhập sẽ bị khoá." : ""} Hồ sơ vẫn được giữ.`)) return
    void run(() => saveStaff({ ...p, status: "NGHI_VIEC", leftAt: date }), () => { ctx.closeModal(); refresh() })
  }

  function staffReturn(id: string) {
    const p = find(id)
    if (!p || !canLeave(p.unit) || !confirm(`Khôi phục ${p.name} về trạng thái đang làm việc? Tài khoản (nếu có) cần mở lại ở trang Tài khoản.`)) return
    void run(() => saveStaff({ ...p, status: "DANG_LAM", leftAt: undefined }), () => { ctx.closeModal(); capStaff(id) })
  }

  /** Mức 1–5 of each skill for one person (0 = not assessed). */
  function skillForm(id: string) {
    const p = find(id)
    if (!p || !canEdit(p.unit)) return
    const row = vldcData.get("staffSkills").find((s) => s.id === id)
    const levels = ["Chưa đánh giá", "1 – Cơ bản", "2 – Biết làm", "3 – Thành thạo", "4 – Giỏi", "5 – Chuyên gia"]
    ctx.openModal(`Đánh giá kỹ năng • ${p.name}`, `<div class="mini">${esc(shortUnit(p.unit))} • ${esc(p.major)} • ${p.experience} năm kinh nghiệm</div><div class="form-grid" style="margin-top:10px">${state.skills.map((s) => `<div><label>${esc(s.name)}</label><select data-skill="${esc(s.code)}" class="sk-level">${levels.map((l, i) => option(String(i), l, i === levelOf(row, s.code))).join("")}</select></div>`).join("")}</div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("skillSave", p.id)}>Lưu</button>`)
  }

  function skillSave(id: string) {
    const p = find(id)
    if (!p) return
    const levels: Record<string, number> = {}
    document.querySelectorAll<HTMLSelectElement>(".sk-level").forEach((el) => { levels[el.dataset.skill as string] = Number(el.value) })
    const row: StaffSkill = {
      id, name: p.name, unit: unitLabel(p.unit), onField: p.onField, certExpiry: "",
      geophysics: levels.geophysics ?? 0, gis: levels.gis ?? 0, data: levels.data ?? 0, pm: levels.pm ?? 0, levels,
    }
    void run(() => saveSkills(row), () => {
      ctx.closeModal()
      if (document.querySelector(".capability-grid")) renderCapability()
    })
  }

  Object.assign(window, {
    capStaff, staffForm, staffSave, staffMoveForm, staffMove, staffLeave, staffReturn, skillForm, skillSave,
    // Older links (Không gian đơn vị) still call the transfer by this name.
    staffTransfer: staffMoveForm,
    certAdd: () => { state.certRows.push({ name: "", expiry: "" }); redrawCerts() },
    certRemove: (i: string) => { state.certRows.splice(Number(i), 1); redrawCerts() },
    certEdit: (el: HTMLInputElement) => {
      const row = state.certRows[Number(el.dataset.cert)]
      if (row) (row as Record<string, string>)[el.dataset.field as string] = el.value
    },
    skillFilter: (key: string, v: string) => {
      if (key === "query") state.skillQuery = v
      else if (key === "unit") state.skillUnit = v
      else if (key === "expert") state.expertSkill = v
      else if (key === "min") state.expertMin = Number(v)
      renderCapability()
    },
    capGoto: (key: keyof StaffFilter | "", value: string) => {
      state.filter = key ? { ...EMPTY_STAFF_FILTER, [key]: value } : { ...EMPTY_STAFF_FILTER }
      state.page = 0
      state.scrollToList = true
      const nav = window as unknown as { show(page: string): void }
      nav.show("hr")
    },
    capFilter: (key: keyof StaffFilter, value: string) => { state.filter = { ...state.filter, [key]: value }; state.page = 0; refresh() },
    capPick: (key: keyof StaffFilter, value: string) => { state.filter = { ...EMPTY_STAFF_FILTER, [key]: value }; state.page = 0; refresh(true) },
    capReset: () => { state.filter = { ...EMPTY_STAFF_FILTER }; state.page = 0; refresh(true) },
    capSort: (key: StaffSort) => { state.dir = state.sort === key ? (state.dir === 1 ? -1 : 1) : 1; state.sort = key; refresh() },
    capPage: (page: string) => { state.page = Math.max(0, Number(page)); refresh() },
  })
}
