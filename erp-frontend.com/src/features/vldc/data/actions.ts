import { escapeHtml as esc, formatDate, jsCall } from "../workflow/html"
import { resolveUnitChoice, unitChoiceGroups } from "./subUnitCore"
import { staffView } from "./staffView"
import { ROLE_TITLES } from "../workflow/rules"
import { SKILLS, conclusionTasks, findExperts, type SkillKey } from "./actionsCore"
import { canCreateContract } from "./accountingMetrics"
import { addDays, localToday, vnDate } from "./dates"
import { ROLE_PROFILES } from "./org"
import { vldcData } from "./registry"
import { ledgerStore } from "./ledgerStore"
import { fetchAnnouncementOptions, publishAnnouncement } from "./notificationsApi"
import type { Scope } from "./types"

/**
 * Detail modals and create forms of the VLDC pages. Every save goes through vldcData (or the workflow),
 * so it is persisted, audited and re-rendered live like the rest of the data.
 */

type Ctx = { role(): string; openModal(title: string, html: string): void; closeModal(): void }
const D = vldcData.get
const today = () => localToday()
const val = (id: string) => ((document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? "").trim()
const num = (id: string) => Number(val(id)) || 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`
const nowIso = () => new Date().toISOString()
const nowLocal = () => `${today()}T${new Date().toTimeString().slice(0, 5)}`
const metric = (label: string, value: string) => `<div class="metric"><span>${label}</span><b>${value}</b></div>`
const field = (label: string, html: string, full = false) => `<div${full ? ' class="full"' : ""}><label>${label}</label>${html}</div>`
const input = (id: string, value = "", type = "text") => `<input id="${id}" type="${type}" value="${esc(value)}">`
const textarea = (id: string, value = "") => `<textarea id="${id}" rows="3">${esc(value)}</textarea>`
const select = (id: string, options: [string, string][], selected = "") => `<select id="${id}">${options.map(([v, l]) => `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`
const form = (fields: string, submit: string, label = "Lưu") => `<div class="form-grid">${fields}</div><button class="btn btn-primary" style="margin-top:10px" onclick="${submit}()">${label}</button>`
const required = (...pairs: [string, string][]) => {
  const missing = pairs.find(([v]) => !v)
  if (missing) alert(`Vui lòng nhập ${missing[1]}`)
  return !missing
}
const roleName = (r: string) => ROLE_TITLES[r] || r
const projectOptions = (): [string, string][] => D("projects").map((p) => [p.id, `${p.id} – ${p.name}`])
/** Unit picker: each unit ("Cả …") followed by its active tổ/phòng; values resolve with resolveUnitChoice. */
const unitPicker = (id: string, allLabel = "") =>
  `<select id="${id}">${allLabel ? `<option value="">${esc(allLabel)}</option>` : ""}${unitChoiceGroups(D("subUnits")).map((g) => `<optgroup label="${esc(g.name)}">${g.options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("")}</optgroup>`).join("")}</select>`
const unitChoice = (id: string) => resolveUnitChoice(val(id), D("subUnits"))
const roleOptions = (): [string, string][] => Object.keys(ROLE_PROFILES).map((r) => [r, roleName(r)])
const SCOPES: [Scope, string][] = [["federation", "Toàn Liên đoàn"], ["unit", "Đơn vị / phòng"], ["project", "Dự án"], ["personal", "Cá nhân"]]
const scopeFields = () => field("Phạm vi", select("f-scope", SCOPES)) + field("Đơn vị / tổ-phòng (phạm vi đơn vị)", unitPicker("f-unit")) + field("Dự án (phạm vi dự án)", select("f-project", projectOptions()))

export function installActions(ctx: Ctx) {
  const open = ctx.openModal
  const close = ctx.closeModal
  const me = () => ctx.role()

  // ----- Inbox tasks: real trail, actions append to it -----
  function taskInboxDetail(id: string) {
    const t = D("inboxTasks").find((x) => x.id === id)
    if (!t) return
    const owner = t.owner === me()
    const steps = (t.history ?? []).slice().reverse()
    const actions = owner
      ? `<button class="btn btn-ok" ${jsCall("completeInboxTask", id)}>Hoàn thành bước</button><button class="btn btn-warn" ${jsCall("returnInboxTask", id)}>Yêu cầu bổ sung</button><button class="btn btn-primary" ${jsCall("handoffInboxTask", id)}>Bàn giao → ${esc(t.next)}</button>`
      : `<button class="btn btn-primary" ${jsCall("commentInboxTask", id)}>Gửi ý kiến phối hợp</button>`
    open(`Tác vụ ${id} • ${t.type}`, `<div class="grid twoeq"><div>${metric("Nội dung", esc(t.title))}${metric("Phân hệ nguồn", esc(t.source))}${metric("Dự án/Hồ sơ", esc(t.project))}${metric("Chủ trì", esc(roleName(t.owner)))}${metric("Tôi tham gia", owner ? "Chủ trì xử lý" : "Phối hợp / Theo dõi")}${metric("SLA", `<span class="${t.overdue ? "danger" : "warn"}">${esc(t.sla)}</span>`)}<label>Ý kiến / ghi chú xử lý</label><textarea id="taskNote" rows="3" placeholder="Nhập ý kiến xử lý..."></textarea><div class="task-actions" style="margin-top:10px">${actions}<button class="btn btn-light" ${jsCall("openTaskSource", id)}>Mở phân hệ nguồn</button></div></div><div><h3>Timeline xử lý</h3><div class="timeline"><div><b>Hiện tại • ${esc(t.status)}</b> — bước kế tiếp: ${esc(t.next)}</div>${steps.map((h) => `<div>${esc(formatDate(h.at.slice(0, 10)))} ${esc(h.at.slice(11, 16))} • <b>${esc(roleName(h.by))}</b> — ${esc(h.action)}${h.note ? `: ${esc(h.note)}` : ""}</div>`).join("") || '<div class="mini">Chưa có lịch sử.</div>'}</div><h3>Người liên quan</h3>${t.cc.map((r) => metric(esc(roleName(r)), "Theo dõi / phối hợp")).join("")}</div></div>`)
  }

  function stepTask(id: string, change: { status?: string; overdue?: boolean }, action: string) {
    const t = D("inboxTasks").find((x) => x.id === id)
    if (!t) return
    const note = val("taskNote")
    void vldcData.save("inboxTasks", { ...t, ...change, history: [...(t.history ?? []), { at: nowLocal(), by: me(), action, ...(note ? { note } : {}) }] })
    close()
  }
  const completeInboxTask = (id: string) => stepTask(id, { status: "Hoàn thành bước", overdue: false }, "Hoàn thành bước")
  const returnInboxTask = (id: string) => stepTask(id, { status: "Bị trả bổ sung" }, "Yêu cầu bổ sung")
  const handoffInboxTask = (id: string) => {
    const t = D("inboxTasks").find((x) => x.id === id)
    stepTask(id, { status: "Đã bàn giao", overdue: false }, `Bàn giao → ${t?.next ?? ""}`)
  }
  const commentInboxTask = (id: string) => {
    if (!val("taskNote")) return alert("Vui lòng nhập ý kiến")
    stepTask(id, {}, "Ý kiến phối hợp")
  }

  // ----- Meetings: conclusions of that meeting, published as inbox tasks -----
  function meetingDetail(id: string) {
    const m = D("meetings").find((x) => x.id === id)
    if (!m) return
    const cs = m.conclusions ?? []
    const pending = cs.filter((c) => !c.taskId).length
    open(`Hồ sơ họp • ${m.id}`, `<div class="grid twoeq"><div>${metric("Cuộc họp", esc(m.title))}${metric("Thời gian", `${esc(m.date)} • ${esc(m.time)}`)}${metric("Phạm vi", esc(m.scope))}${metric("Tài liệu", String(m.docs))}${metric("Trạng thái", esc(m.status))}</div><div><h3>Kết luận (${cs.length})</h3>${cs.map((c, i) => `<div class="alert"><span class="dot ${c.taskId ? "green" : "yellow"}"></span><div><b>${i + 1}. ${esc(c.text)}</b><div class="mini">${esc(roleName(c.ownerRole))} • hạn ${vnDate(c.due)} • ${c.taskId ? `đã giao ${esc(c.taskId)}` : "chưa phát hành"}</div></div></div>`).join("") || '<div class="mini">Chưa có kết luận.</div>'}</div></div><div class="form-grid" style="margin-top:12px">${field("Thêm kết luận", input("c-text"), true)}${field("Người chủ trì", select("c-owner", roleOptions()))}${field("Hạn", input("c-due", addDays(today(), 7), "date"))}</div><div class="toolbar" style="margin-top:10px"><button class="btn btn-light" ${jsCall("addConclusion", m.id)}>+ Thêm kết luận</button>${pending ? `<button class="btn btn-primary" ${jsCall("publishConclusions", m.id)}>Phát hành ${pending} kết luận & giao việc</button>` : ""}</div>`)
  }

  function addConclusion(id: string) {
    const m = D("meetings").find((x) => x.id === id)
    const text = val("c-text")
    if (!m || !required([text, "nội dung kết luận"])) return
    void vldcData.save("meetings", { ...m, conclusions: [...(m.conclusions ?? []), { text, ownerRole: val("c-owner"), due: val("c-due") || addDays(today(), 7) }] })
    meetingDetail(id)
  }

  function publishConclusions(id: string) {
    const m = D("meetings").find((x) => x.id === id)
    if (!m) return
    const result = conclusionTasks(m, new Set(D("inboxTasks").map((t) => t.id)), nowIso())
    result.tasks.forEach((t) => void vldcData.save("inboxTasks", t))
    void vldcData.save("meetings", result.meeting)
    meetingDetail(id)
  }

  // ----- Expert finder -----
  function skillFind() {
    open("Tìm chuyên gia", `${form(field("Kỹ năng", select("sk-skill", Object.entries(SKILLS) as [string, string][])) + field("Mức tối thiểu", select("sk-level", [["3", "≥ 3"], ["4", "≥ 4"], ["5", "5"]], "4")) + field("Đơn vị", unitPicker("sk-unit", "Tất cả đơn vị")), "runSkillFind", "Tìm")}<div id="sk-result" style="margin-top:12px"></div>`)
  }

  function runSkillFind() {
    const skill = val("sk-skill") as SkillKey
    // A tổ narrows the Skill Matrix to the people of that tổ (from their profiles).
    const c = unitChoice("sk-unit")
    const people = c?.subUnit ? new Set(staffView().filter((p) => p.subUnit === c.subUnit).map((p) => p.id)) : null
    const pool = people ? D("staffSkills").filter((s) => people.has(s.id)) : D("staffSkills")
    const hits = findExperts(pool, skill, num("sk-level"), c && !c.subUnit ? c.unitName : "")
    const el = document.getElementById("sk-result")
    if (el) el.innerHTML = hits.length
      ? `<table><tr><th>Cán bộ</th><th>Đơn vị</th><th>${esc(SKILLS[skill])}</th><th>Hiện trường</th><th>Chứng chỉ</th></tr>${hits.map((s) => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.unit)}</td><td>${s[skill]}/5</td><td>${s.onField ? "Đang ở hiện trường" : "Sẵn sàng"}</td><td>${vnDate(s.certExpiry)}</td></tr>`).join("")}</table>`
      : '<div class="mini">Không có cán bộ đạt điều kiện.</div>'
  }

  // ----- Accounting & documents -----
  const financeForm = () => (window as unknown as { wfCreatePayment(): void }).wfCreatePayment()

  function voucherModal() {
    open("Lập chứng từ kế toán", form(
      field("Loại", select("v-type", [["Ủy nhiệm chi", "Ủy nhiệm chi"], ["Phiếu chi", "Phiếu chi"], ["Phiếu thu", "Phiếu thu"], ["Chứng từ khác", "Chứng từ khác"]])) +
      field("Ngày", input("v-date", today(), "date")) + field("Đối tượng", input("v-party")) + field("Dự án", select("v-project", projectOptions())) +
      field("Số tiền (triệu đồng)", input("v-amount", "", "number")) + field("Nguồn kinh phí", select("v-fund", [["NSNN", "NSNN"], ["Dịch vụ", "Dịch vụ"]])) +
      field("Hợp đồng liên quan", select("v-contract", [["", "Không"], ...ledgerStore.legacyContracts().map((c) => [c.id, `${c.id} – ${c.party}`] as [string, string])])) + field("Diễn giải", textarea("v-note"), true),
      "saveVoucher"))
  }

  function saveVoucher() {
    const party = val("v-party")
    if (!required([party, "đối tượng"], [num("v-amount") ? "x" : "", "số tiền"])) return
    const prefix = { "Ủy nhiệm chi": "UNC", "Phiếu chi": "PC", "Phiếu thu": "PT" }[val("v-type")] ?? "CT"
    void vldcData.save("vouchers", { id: newId(prefix), date: val("v-date") || today(), type: val("v-type"), counterparty: party, projectId: val("v-project"), amount: num("v-amount"), status: "Chờ kiểm soát", fundSource: val("v-fund"), ...(val("v-contract") ? { contractId: val("v-contract") } : {}), ...(val("v-note") ? { note: val("v-note") } : {}) })
    close()
  }

  function documentForm() {
    open("Tiếp nhận văn bản đến", form(
      field("Số / ký hiệu", input("d-number")) + field("Ngày ban hành", input("d-release", today(), "date")) + field("Trích yếu", textarea("d-summary"), true) +
      field("Nơi gửi", input("d-sender")) + field("Loại", select("d-type", ["Công văn", "Quyết định", "Thông báo", "Kế hoạch", "Báo cáo", "Tờ trình", "Khác"].map((x) => [x, x] as [string, string]))) +
      field("Độ khẩn", select("d-urgency", ["Bình thường", "Khẩn", "Thượng khẩn", "Hỏa tốc"].map((x) => [x, x] as [string, string]))) + field("Hạn xử lý", input("d-due", addDays(today(), 7), "date")),
      "saveIncomingDoc", "Vào sổ văn bản đến"))
  }

  function saveIncomingDoc() {
    const number = val("d-number")
    const summary = val("d-summary")
    if (!required([number, "số / ký hiệu"], [summary, "trích yếu"])) return
    const at = `${today()} ${new Date().toTimeString().slice(0, 5)}`
    const who = ROLE_PROFILES[me()]?.name || roleName(me())
    void vldcData.save("incomingDocuments", {
      id: newId("vldc-in"), documentNumber: number, releaseDate: val("d-release") || today(), receivedDate: at, summary, senderUnit: val("d-sender"),
      documentType: val("d-type") as never, urgency: val("d-urgency") as never, status: "Mới tiếp nhận", dueDate: val("d-due"), attachments: [],
      processHistory: [{ id: newId("log"), action: "Tiếp nhận văn bản", actor: who, role: roleName(me()), timestamp: at }], createdAt: nowIso(), updatedAt: nowIso(),
    })
    close()
  }

  // ----- Calendar, plans, notices -----
  const scopeOf = () => {
    const scope = val("f-scope") as Scope
    // A tổ/phòng is stored with its parent unit's name, so unit-scope visibility is unchanged.
    const c = scope === "unit" ? unitChoice("f-unit") : null
    return { scope, unit: c?.unitName ?? "", subUnit: c?.subUnit, project: scope === "project" ? val("f-project") : "-" }
  }

  function addEventModal() {
    open("Tạo lịch / sự kiện", form(field("Tiêu đề", input("e-title"), true) + field("Ngày", input("e-date", today(), "date")) + field("Giờ", input("e-time", "09:00", "time")) + scopeFields() + field("Mở nghiệp vụ", select("e-link", [["calendar", "Sự kiện"], ["projects", "Dự án"], ["action", "Công việc"], ["meetings", "Cuộc họp"]])) + field("Nội dung", textarea("e-note"), true), "saveEvent"))
  }

  function saveEvent() {
    const title = val("e-title")
    if (!required([title, "tiêu đề"])) return
    const s = scopeOf()
    void vldcData.save("calendarEvents", { id: newId("EV"), date: vnDate(val("e-date") || today()), time: val("e-time") || "09:00", title, scope: s.scope, unit: s.unit || "Toàn Liên đoàn", ...(s.subUnit ? { subUnit: s.subUnit } : {}), project: s.project, owner: me(), link: val("e-link"), note: val("e-note") })
    close()
  }

  function eventReminder(id: string) {
    const e = D("calendarEvents").find((x) => x.id === id)
    if (!e) return
    const [h, m] = e.time.split(":").map(Number)
    const t = Math.max(0, h * 60 + m - 30)
    const time = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
    void vldcData.save("calendarEvents", { ...e, id: newId("EV"), time, title: `Nhắc: ${e.title}`, scope: "personal", owner: me(), note: `Nhắc trước 30 phút cho "${e.title}"` })
    close()
  }

  function addPlanModal() {
    open("Tạo kế hoạch", form(
      field("Cấp kế hoạch", select("p-level", [["Liên đoàn", "Liên đoàn"], ["Đơn vị", "Đơn vị"], ["Dự án", "Dự án"], ["Cá nhân", "Cá nhân"]])) + field("Tên kế hoạch", input("p-title"), true) +
      field("Từ ngày", input("p-from", today(), "date")) + field("Đến ngày", input("p-to", addDays(today(), 30), "date")) + field("Chủ trì", input("p-owner", roleName(me()))) +
      field("Kế hoạch cấp trên", select("p-parent", [["-", "Không"], ...D("plans").map((p) => [p.id, p.title] as [string, string])])) + scopeFields() + field("Đầu việc (mỗi dòng một việc)", textarea("p-items"), true),
      "savePlan"))
  }

  function savePlan() {
    const title = val("p-title")
    if (!required([title, "tên kế hoạch"])) return
    const s = scopeOf()
    const items = val("p-items").split("\n").map((x) => x.trim()).filter(Boolean)
    void vldcData.save("plans", { id: newId("PL"), level: val("p-level"), scope: s.scope, title, period: `${vnDate(val("p-from") || today())} - ${vnDate(val("p-to") || today())}`, owner: val("p-owner"), progress: 0, status: "Mới lập", parent: val("p-parent") || "-", items, ...(s.unit ? { unit: s.unit } : {}), ...(s.subUnit ? { subUnit: s.subUnit } : {}), ...(s.project !== "-" ? { project: s.project } : {}), ...(s.scope === "personal" ? { ownerRole: me() } : {}) })
    close()
  }

  // Thông báo nội bộ go through the backend: it checks the permission and limits the audience to managed units,
  // then delivers them like any other notification (bell, e-mail, live).
  async function publishNoticeModal() {
    let options
    try {
      options = await fetchAnnouncementOptions()
    } catch {
      alert("Không tải được phạm vi phát hành. Vui lòng thử lại.")
      return
    }
    if (!options.canPublish) {
      open("Phát hành thông báo", '<p>Bạn chưa có quyền phát hành thông báo. Chức năng dành cho lãnh đạo và trưởng phòng / đoàn, trong phạm vi đơn vị mình quản lý.</p>')
      return
    }
    open("Phát hành thông báo", form(
      field("Gửi tới", select("n-target", options.targets.map((t) => [t.value, t.label]))) +
      field("Mở khi bấm vào", select("n-link", [["", "Không mở trang nào"], ["calendar", "Lịch làm việc"], ["plans", "Kế hoạch"], ["action", "Công việc"], ["directives", "Giao việc"], ["projects", "Dự án"], ["documents", "Văn bản"], ["news", "Bảng tin"]])) +
      field("Tiêu đề", '<input id="n-title" type="text" maxlength="200">', true) +
      field("Nội dung", '<textarea id="n-body" rows="4" maxlength="900"></textarea>', true) +
      field("", '<label style="display:flex;gap:8px;align-items:center;font-weight:600"><input id="n-important" type="checkbox"> Đánh dấu quan trọng</label>', true),
      "saveNotice", "Phát hành"))
  }

  async function saveNotice() {
    const title = val("n-title")
    const body = val("n-body")
    if (!required([title, "tiêu đề"], [body, "nội dung"])) return
    const button = document.querySelector<HTMLButtonElement>('#modalBody button[onclick="saveNotice()"]')
    if (button) button.disabled = true
    try {
      const sent = await publishAnnouncement({
        title, body, link: val("n-link") || null, target: val("n-target"),
        important: (document.getElementById("n-important") as HTMLInputElement | null)?.checked ?? false,
      })
      close()
      alert(`Đã phát hành tới ${sent} người.`)
    } catch (error) {
      if (button) button.disabled = false
      alert(`Không phát hành được: ${error instanceof Error ? error.message : "lỗi không xác định"}`)
    }
  }

  // ----- Executive: meetings, risks, goals -----
  function createMeeting() {
    open("Tạo cuộc họp", form(field("Tên cuộc họp", input("m-title"), true) + field("Ngày", input("m-date", addDays(today(), 1), "date")) + field("Giờ", input("m-time", "08:30", "time")) + field("Thành phần", input("m-scope", "Ban Lãnh đạo + Trưởng đơn vị")) + field("Số nội dung", input("m-agenda", "5", "number")), "saveMeeting"))
  }

  function saveMeeting() {
    const title = val("m-title")
    if (!required([title, "tên cuộc họp"])) return
    void vldcData.save("meetings", { id: newId("MTG"), date: vnDate(val("m-date") || today()), title, time: val("m-time") || "08:30", scope: val("m-scope"), status: "Sắp diễn ra", agenda: num("m-agenda"), docs: 0, actions: 0, openConclusions: 0, conclusions: [] })
    close()
  }

  function createRisk() {
    const scale: [string, string][] = ["5", "4", "3", "2", "1"].map((x) => [x, x])
    open("Ghi nhận rủi ro", form(field("Mô tả rủi ro", input("r-title"), true) + field("Khả năng (1–5)", select("r-prob", scale, "3")) + field("Tác động (1–5)", select("r-impact", scale, "3")) + field("Owner", unitPicker("r-owner")) + field("Dự án", select("r-project", [["", "Không gắn dự án"], ...projectOptions()])) + field("Biện pháp kiểm soát", textarea("r-mitigation"), true), "saveRisk"))
  }

  function saveRisk() {
    const title = val("r-title")
    if (!required([title, "mô tả rủi ro"])) return
    const c = unitChoice("r-owner")
    void vldcData.save("risks", { id: newId("R"), title, owner: c?.label ?? "", ...(c?.subUnit ? { subUnit: c.subUnit } : {}), probability: num("r-prob"), impact: num("r-impact"), mitigation: val("r-mitigation"), open: true, ...(val("r-project") ? { project: val("r-project") } : {}) })
    close()
  }

  function goalForm() {
    open("Thêm mục tiêu chiến lược", form(field("Mục tiêu", input("g-goal"), true) + field("Đơn vị chịu trách nhiệm", unitPicker("g-owner")) + field("Chỉ tiêu", input("g-target", "≥ 85%")) + field("Trọng số (%)", input("g-weight", "10", "number")), "saveGoal"))
  }

  function saveGoal() {
    const goal = val("g-goal")
    if (!required([goal, "mục tiêu"])) return
    const c = unitChoice("g-owner")
    void vldcData.save("strategicGoals", { id: newId("SG"), goal, owner: c?.label ?? "", ...(c?.subUnit ? { subUnit: c.subUnit } : {}), target: val("g-target"), actual: 0, weight: num("g-weight") })
    close()
  }

  // ----- Import -----
  function simulateImport() {
    open("Chạy import", form(field("Nguồn dữ liệu", input("im-source", "Tệp Excel tải lên"), true) + field("Loại dữ liệu", select("im-type", ["Thiết bị", "Lưu trữ", "Kế toán", "Nhân sự"].map((x) => [x, x] as [string, string]))) + field("Số dòng", input("im-rows", "100", "number")), "saveImport", "Đưa vào hàng đợi validation"))
  }

  function saveImport() {
    const rows = num("im-rows")
    if (!required([val("im-source"), "nguồn dữ liệu"], [rows ? "x" : "", "số dòng"])) return
    void vldcData.save("importJobs", { id: newId("IMP"), source: val("im-source"), type: val("im-type"), rows, ok: 0, errors: 0, runner: ROLE_PROFILES[me()]?.name || roleName(me()), at: `${today()} ${new Date().toTimeString().slice(0, 5)}`, status: "Chờ validation" })
    close()
  }

  Object.assign(window, {
    taskInboxDetail, completeInboxTask, returnInboxTask, handoffInboxTask, commentInboxTask,
    meetingDetail, addConclusion, publishConclusions, skillFind, runSkillFind,
    financeForm, voucherModal, saveVoucher, documentForm, saveIncomingDoc,
    addEventModal, saveEvent, eventReminder, addPlanModal, savePlan, publishNoticeModal, saveNotice,
    createMeeting, saveMeeting, createRisk, saveRisk, goalForm, saveGoal,
    simulateImport, saveImport,
  })
}
