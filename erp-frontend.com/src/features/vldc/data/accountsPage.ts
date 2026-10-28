import { escapeHtml as esc, jsCall } from "../workflow/html"
import { hasPerm } from "../workflow/rules"
import { UNIT_DEFS } from "./org"
import { kpis } from "./pages"
import {
  createAccount, errorText, fetchAccountOptions, fetchAccounts, resetAccountPassword, updateAccount,
  type Account, type AccountOptions, type AccountSecret,
} from "./hrApi"

/**
 * Tài khoản: login accounts tied to hồ sơ nhân sự. Accounts are created from a profile (name, phone, unit come from
 * it) with a one-time password shown once; roles, chức vụ and khoá/mở change here. vldc-accounts:create / :update;
 * the backend keeps admin accounts out of reach of non-admins.
 */

type Ctx = { perms(): string[]; openModal(title: string, html: string): void; closeModal(): void }

const state = {
  accounts: null as Account[] | null, options: null as AccountOptions | null, error: "",
  query: "", status: "", unit: "", busy: false,
}
const content = () => document.getElementById("content")
const value = (id: string) => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? "").trim()
const option = (v: string, label: string, selected: boolean) => `<option value="${esc(v)}"${selected ? " selected" : ""}>${esc(label)}</option>`
const unitShort = (code?: string) => UNIT_DEFS.find((u) => u.code === code)?.short ?? code ?? ""

export function installAccountsPage(render: Record<string, () => void>, ctx: Ctx) {
  const canCreate = () => hasPerm(ctx.perms(), "vldc-accounts:create")
  const canUpdate = () => hasPerm(ctx.perms(), "vldc-accounts:update")
  const onPage = () => !!document.getElementById("acc-page")

  async function load() {
    try {
      const [accounts, options] = await Promise.all([fetchAccounts(), fetchAccountOptions()])
      state.accounts = accounts
      state.options = options
      state.error = ""
    } catch (e) {
      state.error = errorText(e)
    }
    if (onPage()) draw()
  }

  function rowsHtml(list: Account[]): string {
    return list.map((a) => `<tr><td><b>${esc(a.fullName)}</b><div class="mini">${a.employeeCode ? `${esc(a.employeeCode)}${a.employeeStatus === "NGHI_VIEC" ? " • đã nghỉ việc" : ""}` : "Chưa gắn hồ sơ nhân sự"}</div></td>
<td>${esc(a.username)}<div class="mini">${esc(a.email)}</div></td><td>${esc(unitShort(a.unitCode) || "–")}<div class="mini">${esc(a.positionName ?? "")}</div></td>
<td>${a.roleNames.map((r) => `<span class="badge b-info">${esc(r)}</span>`).join(" ") || '<span class="mini">–</span>'}</td>
<td>${a.active ? '<span class="badge b-ok">Hoạt động</span>' : '<span class="badge b-danger">Đã khoá</span>'}</td>
<td class="vx-acc-actions">${canUpdate() ? `<button class="btn btn-light" ${jsCall("accEdit", String(a.id))}>Sửa</button><button class="btn btn-light" ${jsCall("accToggle", String(a.id))}>${a.active ? "Khoá" : "Mở khoá"}</button><button class="btn btn-light" ${jsCall("accReset", String(a.id))}>Đặt lại mật khẩu</button>` : ""}</td></tr>`).join("")
  }

  function pageHtml(): string {
    if (state.error) return `<div class="card" id="acc-page"><h3>Tài khoản</h3><div class="mini">${esc(state.error)}</div><button class="btn btn-light" style="margin-top:8px" ${jsCall("accReload")}>Thử lại</button></div>`
    if (!state.accounts || !state.options) return '<div class="card" id="acc-page"><div class="mini">Đang tải tài khoản…</div></div>'
    const all = state.accounts
    const q = state.query.toLowerCase()
    const list = all.filter((a) => (!q || `${a.fullName} ${a.username} ${a.email} ${a.employeeCode ?? ""}`.toLowerCase().includes(q))
      && (!state.status || (state.status === "active") === a.active)
      && (!state.unit || a.unitCode === state.unit))
    const units = UNIT_DEFS.filter((u) => all.some((a) => a.unitCode === u.code))
    const kpi = (label: string, v: number, sub: string, alert = false) => `<div class="kpi${alert ? " vx-kpi-alert" : ""}"><div class="label">${label}</div><div class="value">${v}</div><div class="sub">${sub}</div></div>`
    return `<div id="acc-page">${kpis(
      kpi("Tài khoản", all.length, "Gắn hoặc chưa gắn hồ sơ"),
      kpi("Đang hoạt động", all.filter((a) => a.active).length, "Đăng nhập được"),
      kpi("Đã khoá", all.filter((a) => !a.active).length, "Nghỉ việc hoặc bị khoá"),
      kpi("Chưa có tài khoản", state.options.employees.length, "Nhân sự đang làm việc", state.options.employees.length > 0),
    )}<div class="card" style="margin-top:14px"><div class="card-head"><div><h3>Danh sách tài khoản</h3><div class="mini">Đang hiển thị ${list.length}/${all.length}</div></div><div class="toolbar"><button class="btn btn-light" ${jsCall("accReload")}>Làm mới</button>${canCreate() ? `<button class="btn btn-primary" ${jsCall("accCreate", "")}>+ Tạo tài khoản</button>` : ""}</div></div>
<div class="vx-staff-filters"><input placeholder="Tìm họ tên, tên đăng nhập, email, mã NS..." value="${esc(state.query)}" onchange="accFilter('query',this.value)"><select onchange="accFilter('status',this.value)"><option value="">Mọi trạng thái</option>${option("active", "Hoạt động", state.status === "active")}${option("locked", "Đã khoá", state.status === "locked")}</select><select onchange="accFilter('unit',this.value)"><option value="">Tất cả đơn vị</option>${units.map((u) => option(u.code, u.short, u.code === state.unit)).join("")}</select></div>
<div class="vx-staff-table"><table><tr><th>Họ tên</th><th>Tên đăng nhập</th><th>Đơn vị / chức vụ</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr>${rowsHtml(list) || '<tr><td colspan="6" class="mini">Không có tài khoản phù hợp.</td></tr>'}</table></div></div></div>`
  }

  function draw() {
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }

  render.accounts = () => {
    draw()
    void load()
  }

  const rolesHtml = (selected: string[]) => `<div class="vx-acc-roles">${(state.options?.roles ?? []).map((r) => `<label><input type="checkbox" class="acc-role" value="${esc(r.code)}"${selected.includes(r.code) ? " checked" : ""}> ${esc(r.name)}</label>`).join("")}</div>`
  const pickedRoles = () => [...document.querySelectorAll<HTMLInputElement>(".acc-role:checked")].map((el) => el.value)
  const positionsHtml = (selected?: string) => `<select id="acc-position"><option value="">– Không –</option>${(state.options?.positions ?? []).map((p) => option(p.code, p.name, p.code === selected)).join("")}</select>`

  async function run<T>(task: () => Promise<T>, done: (result: T) => void) {
    if (state.busy) return
    state.busy = true
    try {
      done(await task())
    } catch (e) {
      alert(errorText(e))
    } finally {
      state.busy = false
    }
  }

  /** Shows a one-time password; it is never shown again. */
  function showSecret(title: string, secret: AccountSecret) {
    ctx.openModal(title, `<p>Tài khoản <b>${esc(secret.account.username)}</b> (${esc(secret.account.fullName)}).</p>
<div class="metric"><span>Mật khẩu tạm thời</span><b><code id="acc-secret">${esc(secret.temporaryPassword)}</code></b></div>
<div class="mini" style="margin:8px 0">Mật khẩu chỉ hiển thị một lần. Hãy giao trực tiếp cho người dùng và yêu cầu đổi sau lần đăng nhập đầu.</div>
<div class="toolbar"><button class="btn btn-light" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('acc-secret').textContent)">Sao chép</button><button class="btn btn-primary" onclick="closeModal()">Đã giao</button></div>`)
  }

  async function accCreate(employeeCode: string) {
    if (!canCreate()) return
    if (!state.options) {
      try {
        state.options = await fetchAccountOptions()
      } catch (e) {
        return alert(errorText(e))
      }
    }
    const people = state.options.employees
    if (!people.length) return alert("Mọi nhân sự đang làm việc đều đã có tài khoản.")
    ctx.openModal("Tạo tài khoản", `<div class="form-grid">
<div class="full"><label>Nhân sự *</label><select id="acc-employee" onchange="accPickEmployee(this.value)">${people.map((p) => option(p.code, `${p.name} – ${p.code} • ${unitShort(p.unit)} • ${p.title}`, p.code === employeeCode)).join("")}</select></div>
<div><label>Email *</label><input id="acc-email" type="email" value="${esc(people.find((p) => p.code === employeeCode)?.email ?? people[0].email ?? "")}"></div>
<div><label>Tên đăng nhập</label><input id="acc-username" placeholder="Bỏ trống = theo email"></div>
<div><label>Chức vụ</label>${positionsHtml("NHAN_VIEN")}</div>
<div class="full"><label>Vai trò *</label>${rolesHtml([])}</div></div>
<div class="mini" style="margin-top:6px">Đơn vị, họ tên, điện thoại lấy từ hồ sơ nhân sự. Mật khẩu tạm thời được tạo ngẫu nhiên.</div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("accCreateSave")}>Tạo</button>`)
  }

  function accCreateSave() {
    const roleCodes = pickedRoles()
    if (!value("acc-employee")) return alert("Chọn nhân sự")
    if (!value("acc-email")) return alert("Vui lòng nhập email")
    if (!roleCodes.length) return alert("Chọn ít nhất một vai trò")
    void run(() => createAccount({
      employeeCode: value("acc-employee"), email: value("acc-email"), username: value("acc-username") || undefined,
      roleCodes, positionCode: value("acc-position") || undefined,
    }), (secret) => {
      showSecret("Đã tạo tài khoản", secret)
      void load()
    })
  }

  function accEdit(id: string) {
    const a = state.accounts?.find((x) => String(x.id) === id)
    if (!a || !canUpdate()) return
    ctx.openModal(`Sửa tài khoản • ${a.username}`, `<div class="mini">${esc(a.fullName)} • ${esc(unitShort(a.unitCode))}</div><div class="form-grid" style="margin-top:10px">
<div><label>Chức vụ</label>${positionsHtml(a.positionCode)}</div>
<div class="full"><label>Vai trò *</label>${rolesHtml(a.roleCodes)}</div></div>
<button class="btn btn-primary" style="margin-top:10px" ${jsCall("accEditSave", id)}>Lưu</button>`)
  }

  function accEditSave(id: string) {
    const roleCodes = pickedRoles()
    if (!roleCodes.length) return alert("Chọn ít nhất một vai trò")
    void run(() => updateAccount(Number(id), { roleCodes, positionCode: value("acc-position") }), () => {
      ctx.closeModal()
      void load()
    })
  }

  function accToggle(id: string) {
    const a = state.accounts?.find((x) => String(x.id) === id)
    if (!a || !canUpdate()) return
    if (!confirm(a.active ? `Khoá tài khoản ${a.username}? Người dùng bị đăng xuất ở lần thao tác kế tiếp.` : `Mở khoá tài khoản ${a.username}?`)) return
    void run(() => updateAccount(a.id, { active: !a.active }), () => void load())
  }

  function accReset(id: string) {
    const a = state.accounts?.find((x) => String(x.id) === id)
    if (!a || !canUpdate() || !confirm(`Đặt lại mật khẩu của ${a.username}? Mật khẩu cũ hết hiệu lực ngay.`)) return
    void run(() => resetAccountPassword(a.id), (secret) => showSecret("Đã đặt lại mật khẩu", secret))
  }

  Object.assign(window, {
    accCreate, accCreateSave, accEdit, accEditSave, accToggle, accReset,
    accReload: () => {
      state.error = ""
      void load()
    },
    accFilter: (key: "query" | "status" | "unit", v: string) => {
      state[key] = v
      draw()
    },
    accPickEmployee: (code: string) => {
      const email = document.getElementById("acc-email") as HTMLInputElement | null
      const person = state.options?.employees.find((p) => p.code === code)
      if (email) email.value = person?.email ?? ""
    },
  })
}
