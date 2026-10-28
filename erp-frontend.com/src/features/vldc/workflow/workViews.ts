import { escapeHtml as esc, formatDate, jsCall } from "./html"
import { crumbsHtml } from "./views"
import type { PersonRef, ProjectDetail, ProjectStatus } from "../data/workApi"

/**
 * Pieces shared by the Nhiệm vụ / Dự án pages on the action APIs: state lozenges, people, due dates and the project
 * header (title, approval / deletion banner, tabs). What the viewer may do comes from the server (permissions).
 */

export const PROJECT_STATE: Record<ProjectStatus, [string, string]> = {
  INITIATED: ["Khởi tạo", "new"], IN_PROGRESS: ["Đang thực hiện", "doing"], PAUSED: ["Tạm dừng", "review"], COMPLETED: ["Hoàn thành", "done"],
}

export const lozengeHtml = ([label, tone]: [string, string]) => `<span class="vx-jira-lozenge l-${tone}">${esc(label)}</span>`

export const projectBase = (code: string) => `projects/${encodeURIComponent(code)}`

/** "Nguyễn Văn A" (or "–"). */
export const personName = (p: PersonRef | null | undefined) => (p ? p.fullName : "–")

/** "Lê Hoàng Nam" → "HN": the last two words' initials. */
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((p) => p[0]).join("").toUpperCase() || "?"

const AVATAR_COLORS = 6
export function avatarHtml(p: PersonRef | null | undefined): string {
  if (!p) return ""
  const hue = [...String(p.userId)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % AVATAR_COLORS
  return `<span class="vx-jira-avatar a-${hue}" title="${esc(p.fullName)}">${esc(initials(p.fullName))}</span>`
}

export const dueHtml = (due: string | null | undefined, late: boolean) => (due ? `<span class="vx-jira-due${late ? " late" : ""}">${formatDate(due)}</span>` : "")

/** The project's approval or deletion state, with the buttons the viewer is allowed. */
function bannerHtml(p: ProjectDetail): string {
  const can = p.permissions
  const banner = (tone: string, title: string, note: string, buttons: string) =>
    `<div class="vx-jira-approval ${tone}"><div><b>${title}</b>${note ? `<div class="mini">${note}</div>` : ""}</div>${buttons}</div>`
  if (p.deleteRequest) {
    const req = p.deleteRequest
    const buttons = can.canDecideDelete
      ? `<button class="btn btn-danger" ${jsCall("projectConfirmDelete", p.code, "yes")}>Xác nhận xoá</button><button class="btn btn-light" ${jsCall("projectConfirmDelete", p.code, "no")}>Không xoá</button>`
      : can.canCancelDelete ? `<button class="btn btn-light" ${jsCall("projectCancelDelete", p.code)}>Huỷ đề nghị</button>` : ""
    return banner("rejected", `${esc(personName(req.requestedBy))} đề nghị xoá dự án – chờ Liên đoàn trưởng xác nhận`, `Lý do: ${esc(req.reason)}`, buttons)
  }
  if (p.approvalStatus === "PENDING") {
    const buttons = can.canApprove
      ? `<button class="btn btn-ok" ${jsCall("projectDecide", p.code, "approve")}>Phê duyệt</button><button class="btn btn-light" ${jsCall("projectDecide", p.code, "reject")}>Từ chối</button>`
      : ""
    return banner("pending", "Chờ Liên đoàn trưởng phê duyệt", "Sau khi được duyệt, trưởng các đơn vị tham gia tạo việc và giao cho nhân viên đơn vị mình.", buttons)
  }
  if (p.approvalStatus === "REJECTED") {
    const fix = can.canEdit ? `<button class="btn btn-primary" ${jsCall("projectForm", p.code)}>Sửa và trình lại</button>` : ""
    return banner("rejected", "Liên đoàn trưởng không phê duyệt", `Lý do: ${esc(p.approvalNote ?? "–")}`, fix)
  }
  return p.lastDeleteRefusal && can.canEdit ? banner("pending", "Liên đoàn trưởng không đồng ý xoá dự án", esc(p.lastDeleteRefusal), "") : ""
}

/** Header of every tab of a project: crumbs, title with its state, "+ Tạo việc" when allowed, banner, tabs. */
export function projectHeaderHtml(p: ProjectDetail, tab: string): string {
  const base = projectBase(p.code)
  const sub = [p.code, p.leadDepartment?.name, p.endDate ? `Hạn ${formatDate(p.endDate)}` : ""].filter(Boolean).join(" · ")
  const create = p.permissions.canCreateTask ? `<button class="btn btn-primary" ${jsCall("go", `${base}/giao-viec`)}>+ Tạo việc</button>` : ""
  const tabs = ([["board", "Board"], ["danh-sach", "Danh sách"], ["tong-quan", "Tổng quan"]] as [string, string][])
    .map(([slug, label]) => `<button class="vx-jira-tab${slug === tab ? " active" : ""}" ${jsCall("go", `${base}/${slug}`)}>${label}</button>`).join("")
  return `<div class="vx-jira-head">${crumbsHtml([["Dự án", "projects"], [p.name]])}
<div class="vx-jira-title"><div style="flex:1;min-width:0"><h2>${esc(p.name)} ${lozengeHtml(PROJECT_STATE[p.status])}</h2><div class="mini">${esc(sub)}</div></div>${create}</div>
${bannerHtml(p)}<nav class="vx-jira-tabs">${tabs}</nav></div>`
}

/**
 * Bar heading the Nhiệm vụ / Dự án menu: a switch between its two flows, Dự án (Phòng Kỹ thuật makes projects, the
 * federation head approves them, unit heads hand the work down) and Nhiệm vụ (a subordinate asks its direct superior),
 * then the flow's actions.
 */
export function flowBarHtml(active: "du-an" | "nhiem-vu", actions = ""): string {
  const seg = (key: string, path: string, label: string, hint: string) =>
    `<button class="${key === active ? "active" : ""}" title="${esc(hint)}" ${jsCall("go", path)}>${label}</button>`
  return `<div class="vx-flow-bar"><div class="vx-flow-seg">${seg("du-an", "projects", "Dự án", "Phòng Kỹ thuật lập dự án, Liên đoàn trưởng duyệt, trưởng đơn vị giao việc")}${seg("nhiem-vu", "projects/nhiem-vu", "Nhiệm vụ", "Cấp dưới lập nhiệm vụ, cấp trên trực tiếp duyệt")}</div><span style="flex:1"></span>${actions}</div>`
}
