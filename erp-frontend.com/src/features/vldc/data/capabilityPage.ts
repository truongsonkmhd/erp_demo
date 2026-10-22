import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday, vnDate } from "./dates"
import { UNIT_DEFS, unitName, type UnitCode } from "./org"
import { subTabsHtml } from "./menuPolicy"
import { bar, kpis } from "./pages"
import { vldcData } from "./registry"
import { staffView } from "./staffView"
import {
  EDUCATION_LEVELS, EMPTY_STAFF_FILTER, RETIRE_AGE, ageOf, capabilityStats, certState, filterStaff, hrSummary, sortStaff,
  type StaffFilter, type StaffSort,
} from "./staffCore"
import { subUnitsOf, transferStaff } from "./subUnitCore"
import type { StaffProfile } from "./types"

/**
 * Nhân sự (KPIs, staff list, Skill Matrix, certificates) and Năng lực (capability overview), both counted from the
 * staff profiles. The staff list lives on Nhân sự; capability figures open it with a preset filter (capGoto).
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }

const PAGE_SIZE = 20
const FIELD_UNITS: UnitCode[] = ["HK", "MD", "DB", "TT"]
const state = { filter: { ...EMPTY_STAFF_FILTER } as StaffFilter, sort: "name" as StaffSort, dir: 1 as 1 | -1, page: 0, scrollToList: false }
const content = () => document.getElementById("content")
const unitLabel = (code: string) => (UNIT_DEFS.some((u) => u.code === code) ? unitName(code as UnitCode) : code)
const shortUnit = (code: string) => UNIT_DEFS.find((u) => u.code === code)?.short ?? code
const subName = (id?: string) => (id ? vldcData.get("subUnits").find((s) => s.id === id)?.name : undefined)

const AGE_OPTIONS: [string, string][] = [["under30", "Dưới 30"], ["30to45", "30–45"], ["over45", "Trên 45"]]
const EXP_OPTIONS: [string, string][] = [["under5", "Dưới 5 năm"], ["from5to15", "5–15 năm"], ["over15", "Trên 15 năm"]]
const CERT_LABEL = { expired: ["Hết hạn", "b-danger"], expiring: ["Sắp hết hạn", "b-warn"], valid: ["Còn hạn", "b-ok"] } as const

function certBadges(p: StaffProfile, today: string): string {
  if (!p.certs.length) return '<span class="mini">–</span>'
  return p.certs.map((c) => {
    const [label, cls] = CERT_LABEL[certState(c.expiry, today)]
    return `<span class="badge ${cls}" title="${esc(c.name)} • ${esc(vnDate(c.expiry))}">${label}</span>`
  }).join(" ")
}

function select(key: keyof StaffFilter, all: string, options: [string, string][]): string {
  const current = state.filter[key]
  return `<select data-key="${key}" onchange="capFilter(this.dataset.key,this.value)"><option value="">${all}</option>${options.map(([v, l]) => `<option value="${esc(v)}"${v === current ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
}

function listHtml(staff: StaffProfile[], today: string): string {
  const rows = sortStaff(filterStaff(staff, state.filter, today), state.sort, state.dir, today)
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  state.page = Math.min(state.page, pages - 1)
  const shown = rows.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE)
  const th = (key: StaffSort, label: string) =>
    `<th class="vx-staff-sort" ${jsCall("capSort", key)}>${label}${state.sort === key ? (state.dir === 1 ? " ▲" : " ▼") : ""}</th>`
  const units = UNIT_DEFS.filter((u) => staff.some((p) => p.unit === u.code)).map((u): [string, string] => [u.code, u.short])
  const filtered = Object.values(state.filter).some(Boolean)
  return `<div class="card" id="hr-staff"><div class="card-head"><div><h3>Danh sách nhân sự</h3><div class="mini">Đang hiển thị ${rows.length}/${staff.length} người${filtered ? " theo bộ lọc" : ""}</div></div>${filtered ? `<button class="btn btn-light" ${jsCall("capReset")}>Bỏ lọc</button>` : ""}</div>
<div class="vx-staff-filters"><input placeholder="Tìm tên, chuyên ngành, chức danh..." value="${esc(state.filter.query)}" onchange="capFilter('query',this.value)">${select("unit", "Tất cả đơn vị", units)}${select("subUnit", "Tất cả tổ/phòng", vldcData.get("subUnits").filter((s) => s.active && (!state.filter.unit || s.unit === state.filter.unit)).map((s): [string, string] => [s.id, `${s.name} – ${shortUnit(s.unit)}`]))}${select("education", "Mọi trình độ", EDUCATION_LEVELS.map((e) => [e, e]))}${select("age", "Mọi độ tuổi", AGE_OPTIONS)}${select("exp", "Mọi kinh nghiệm", EXP_OPTIONS)}${select("cert", "Mọi chứng chỉ", [["expiring", "Hết hạn / sắp hết hạn"]])}${select("onField", "Hiện trường: tất cả", [["yes", "Đang ở hiện trường"], ["no", "Tại văn phòng"]])}</div>
<div class="vx-staff-table"><table><tr>${th("name", "Họ tên")}${th("age", "Tuổi")}${th("education", "Học vấn")}<th>Chuyên ngành</th>${th("experience", "Kinh nghiệm")}${th("unit", "Đơn vị")}<th>Chức danh</th><th>Chứng chỉ</th><th>Hiện trường</th></tr>
${shown.map((p) => `<tr class="vx-staff-row" ${jsCall("capStaff", p.id)}><td><b>${esc(p.name)}</b><div class="mini">${esc(p.id)}</div></td><td>${ageOf(p, today)}</td><td>${esc(p.education)}</td><td>${esc(p.major)}</td><td>${p.experience} năm</td><td>${esc(shortUnit(p.unit))}${subName(p.subUnit) ? `<div class="mini">${esc(subName(p.subUnit) as string)}</div>` : ""}</td><td>${esc(p.title)}</td><td>${certBadges(p, today)}</td><td>${p.onField ? '<span class="badge b-info">Hiện trường</span>' : '<span class="mini">Văn phòng</span>'}</td></tr>`).join("") || '<tr><td colspan="9" class="mini">Không có nhân sự phù hợp.</td></tr>'}</table></div>
${pages > 1 ? `<div class="vx-staff-pager"><button class="btn btn-light" ${jsCall("capPage", String(state.page - 1))}${state.page === 0 ? " disabled" : ""}>‹ Trước</button><span class="mini">Trang ${state.page + 1}/${pages}</span><button class="btn btn-light" ${jsCall("capPage", String(state.page + 1))}${state.page >= pages - 1 ? " disabled" : ""}>Sau ›</button></div>` : ""}</div>`
}

const SKILLS: [keyof SkillLevels, string][] = [["geophysics", "Địa vật lý"], ["gis", "GIS"], ["data", "Xử lý DL"], ["pm", "QL dự án"]]
type SkillLevels = { geophysics: number; gis: number; data: number; pm: number }
const dots = (n: number) => `<span class="vx-skill" title="${n}/5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)
const byUnitOrder = <T extends { unit: string }>(rows: T[]) =>
  [...rows].sort((a, b) => UNIT_DEFS.findIndex((u) => u.code === a.unit) - UNIT_DEFS.findIndex((u) => u.code === b.unit))
/** Capability figures open the staff list on the Nhân sự page with that filter. */
const goto = (key: string, value: string) => jsCall("capGoto", key, value)

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
  return `<div class="capability-grid"><div class="cap-card vx-cap-pick" ${goto("", "")}><span class="official-badge">HỒ SƠ CÔNG KHAI</span><b class="big">${s.total}</b><div>Nhân lực kỹ thuật</div><div class="mini">${EDUCATION_LEVELS.map((e) => `${edu[e]} ${e === "Tiến sĩ" ? "TS" : e === "Thạc sĩ" ? "ThS" : e === "Kỹ sư/Cử nhân" ? "KS/CN" : "KTV/CN"}`).join(" • ")}</div></div>
<div class="cap-card"><span class="official-badge">KINH NGHIỆM</span><b class="big">${link("exp", "over15", String(s.over15))}</b><div>${link("exp", "over15", "Trên 15 năm")}</div><div class="mini">${link("exp", "from5to15", `${s.from5to15} người từ 5–15 năm`)} • ${link("exp", "under5", `${s.under5} dưới 5 năm`)}</div></div>
<div class="cap-card"><span class="official-badge">ĐƠN VỊ THI CÔNG</span><b class="big">${directStaff}</b><div>Nhân sự ở ${direct.length} đơn vị trực thuộc</div><div class="mini">${direct.map((u) => link("unit", u, `${u} ${s.byUnit[u]}`)).join(" • ")}</div></div></div>
<div class="grid twoeq" style="margin-top:14px"><div class="card"><h3>Cơ cấu trình độ</h3>${EDUCATION_LEVELS.map((e) => `<div class="vx-cap-pick" ${goto("education", e)}>${bar(e, pct(edu[e], s.total), String(edu[e]))}</div>`).join("")}
<h3 style="margin-top:18px">Cơ cấu độ tuổi</h3>${bands.map(([key, label, n]) => `<div class="vx-cap-pick" ${goto("age", key)}>${bar(label, pct(n, s.total), String(n))}</div>`).join("")}<div class="mini" style="margin-top:8px">${h.retiring.length} người từ ${RETIRE_AGE} tuổi trở lên • tuổi bình quân ${avgAge}</div></div>
<div class="card"><h3>Năng lực theo đơn vị</h3><div class="mini">Tổng số và số người đang ở hiện trường</div>${byUnitOrder(h.units).map((u) => `<div class="vx-hr-unit vx-cap-pick" ${goto("unit", u.unit)}><div class="vx-hr-unit-head"><span>${esc(unitLabel(u.unit))}</span><b>${u.total} người</b></div><div class="vx-hr-bar"><i style="width:${pct(u.onField, u.total)}%"></i></div><div class="mini">${u.onField ? `${u.onField} ở hiện trường (${pct(u.onField, u.total)}%)` : "Làm việc tại văn phòng"}</div></div>`).join("")}</div></div>
<div class="toolbar" style="margin-top:14px"><button class="btn btn-primary" ${goto("", "")}>Xem danh sách nhân sự</button><span class="mini">Bấm vào bất kỳ con số nào để mở danh sách nhân sự tương ứng.</span></div>`
}

/** Nhân sự: the people themselves – KPIs filter the list in place. */
function hrHtml(): string {
  const staff = staffView()
  const skills = vldcData.get("staffSkills")
  const today = localToday()
  const s = hrSummary(staff, today)
  const pick = (key: string, value: string) => (key ? jsCall("capPick", key, value) : jsCall("capReset"))
  const tile = (attrs: string, label: string, value: number | string, sub: string, cls = "") =>
    `<div class="kpi vx-cap-pick ${cls}" ${attrs}><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`
  return `${kpis(
    tile(pick("", ""), "Nhân sự", s.total, `${s.units.length} phòng, đơn vị`),
    tile(pick("onField", "yes"), "Đang ở hiện trường", s.onField, `${pct(s.onField, s.total)}% nhân lực`),
    tile(pick("cert", "expiring"), "Chứng chỉ cần gia hạn", s.certExpired + s.certExpiring, `${s.certExpired} người đã hết hạn • ${s.certExpiring} sắp hết hạn`, s.certExpired ? "vx-kpi-alert" : ""),
    tile(jsCall("hrRetiring"), `Từ ${RETIRE_AGE} tuổi`, s.retiring.length, "Cần chuẩn bị nhân sự kế cận"),
  )}
<div style="margin-top:14px">${listHtml(staff, today)}</div>
<div class="grid twoeq" style="margin-top:14px"><div class="card"><div class="card-head"><div><h3>Skill Matrix – cán bộ chủ chốt</h3><div class="mini">Mức 1–5 • bấm một người để xem hồ sơ</div></div><button class="btn btn-primary" onclick="skillFind()">Tìm chuyên gia</button></div>
<div class="vx-staff-table"><table><tr><th>Nhân sự</th>${SKILLS.map(([, l]) => `<th>${l}</th>`).join("")}<th>Chứng chỉ</th></tr>${skills.map((k) => { const [label, cls] = CERT_LABEL[certState(k.certExpiry, today)]; return `<tr class="vx-staff-row" ${jsCall("capStaff", k.id)}><td><b>${esc(k.name)}</b><div class="mini">${esc(k.unit)}</div></td>${SKILLS.map(([key]) => `<td>${dots(k[key])}</td>`).join("")}<td><span class="badge ${cls}">${label}</span><div class="mini">${esc(vnDate(k.certExpiry))}</div></td></tr>` }).join("")}</table></div></div>
<div class="card"><div class="card-head"><h3>Chứng chỉ cần gia hạn</h3>${s.certAlerts.length > 6 ? `<button class="btn btn-light" ${pick("cert", "expiring")}>Lọc danh sách</button>` : ""}</div>${s.certAlerts.slice(0, 6).map((a) => `<div class="alert vx-cap-pick" ${jsCall("capStaff", a.person.id)}><span class="dot ${a.state === "expired" ? "red" : "yellow"}"></span><div><b>${esc(a.person.name)}</b> • ${esc(shortUnit(a.person.unit))}<div class="mini">${esc(a.cert.name)} • ${a.state === "expired" ? "đã hết hạn" : "hết hạn"} ${esc(vnDate(a.cert.expiry))}</div></div></div>`).join("") || '<div class="mini">Không có chứng chỉ cần gia hạn.</div>'}</div></div>`
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

export function installCapabilityPage(render: Record<string, () => void>, ctx: Ctx) {
  render.capability = () => renderInto(() => subTabsHtml("capability") + capabilityHtml())
  render.hr = renderHr
  const refresh = (scroll = false) => {
    state.scrollToList = scroll
    renderHr()
  }

  function capStaff(id: string) {
    const p = staffView().find((x) => x.id === id)
    if (!p) return
    const today = localToday()
    const metric = (l: string, v: string) => `<div class="metric"><span>${l}</span><b>${v}</b></div>`
    ctx.openModal(`Hồ sơ năng lực • ${p.id}`, `<h2 style="margin:0 0 4px">${esc(p.name)}</h2><div class="mini">${esc(p.title)} • ${esc(unitLabel(p.unit))}${subName(p.subUnit) ? ` • ${esc(subName(p.subUnit) as string)}` : ""}</div>
<div class="grid twoeq" style="margin-top:12px"><div>${metric("Năm sinh", `${p.birthYear} (${ageOf(p, today)} tuổi)`)}${metric("Học vấn", esc(p.education))}${metric("Chuyên ngành", esc(p.major))}${metric("Kinh nghiệm", `${p.experience} năm`)}${metric("Nơi làm việc", p.onField ? "Đang ở hiện trường" : "Văn phòng")}</div>
<div><h4 style="margin-top:0">Chứng chỉ</h4>${p.certs.map((c) => { const [label, cls] = CERT_LABEL[certState(c.expiry, today)]; return `<div class="metric"><span>${esc(c.name)}<br><small>Hạn ${esc(vnDate(c.expiry))}</small></span><b><span class="badge ${cls}">${label}</span></b></div>` }).join("") || '<div class="mini">Chưa có chứng chỉ.</div>'}</div></div>${ctx.role() === "lanhdao" ? transferHtml(p) : ""}`)
  }

  /** Điều chuyển tổ/phòng (any unit's active tổ; moving across units changes the unit too). */
  function transferHtml(p: StaffProfile): string {
    const groups = UNIT_DEFS.map((u) => [u, subUnitsOf(u.code, vldcData.get("subUnits"))] as const).filter(([, subs]) => subs.length)
    return `<div class="form-grid" style="margin-top:12px"><div class="full"><label>Điều chuyển tổ / phòng</label><select id="st-sub"><option value="">– Không thuộc tổ nào –</option>${groups.map(([u, subs]) => `<optgroup label="${esc(u.name)}">${subs.map((s) => `<option value="${esc(s.id)}"${s.id === p.subUnit ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</optgroup>`).join("")}</select></div></div><button class="btn btn-light" style="margin-top:8px" ${jsCall("staffTransfer", p.id)}>Lưu điều chuyển</button>`
  }

  function staffTransfer(id: string) {
    const p = staffView().find((x) => x.id === id)
    if (!p || ctx.role() !== "lanhdao") return
    const target = ((document.getElementById("st-sub") as HTMLSelectElement | null)?.value ?? "")
    try {
      const next = transferStaff(p, target, vldcData.get("subUnits"))
      void vldcData.save("staffProfiles", next)
      // A head who leaves stops heading the old tổ.
      const led = vldcData.get("subUnits").find((s) => s.headId === p.id && s.id !== next.subUnit)
      if (led) void vldcData.save("subUnits", { ...led, headId: undefined })
      ctx.closeModal()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function hrRetiring() {
    const today = localToday()
    const list = hrSummary(staffView(), today).retiring
    ctx.openModal(`Nhân sự từ ${RETIRE_AGE} tuổi`, `<div class="mini" style="margin-bottom:8px">${list.length} người • sắp xếp theo tuổi giảm dần</div>${list.map((p) => `<div class="metric vx-cap-pick" ${jsCall("capStaff", p.id)}><span><b>${esc(p.name)}</b><br><small>${esc(p.title)} • ${esc(shortUnit(p.unit))}</small></span><b>${ageOf(p, today)} tuổi</b></div>`).join("") || '<div class="mini">Không có.</div>'}`)
  }

  Object.assign(window, {
    capStaff, hrRetiring, staffTransfer,
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
