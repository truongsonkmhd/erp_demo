import { escapeHtml as esc } from "../workflow/html"
import {
  LEAD_OPTIONS, fetchAnnouncementOptions, fetchNotificationSettings, saveNotificationSetting, type NotificationSetting,
  type NotificationSettings,
} from "./notificationsApi"

/** Quản lý thông báo: per notification type, whether it reaches the user in the app and/or by Gmail, and how early. */

const ICON_PATHS: Record<string, string> = {
  CalendarClock: '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4M8 2v4M3 10h5"/><circle cx="16" cy="16" r="6"/><path d="M16 14v2l1 1"/>',
  Wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  Truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62L18.3 9.38a1 1 0 0 0-.78-.38H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  Megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  DoorOpen: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.56v16.157a.5.5 0 0 1-.68.467L5.79 18.85A2 2 0 0 1 5 17.236V6.764a2 2 0 0 1 1.28-1.866l6.04-2.32A.5.5 0 0 1 13 4.56Z"/>',
}
const BELL = '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
const icon = (name: string | null) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${(name && ICON_PATHS[name]) || BELL}</svg>`

let data: NotificationSettings | null = null
/** Whether this account may publish thông báo nội bộ (shows the button). */
let canPublish = false
let failed = false
const content = () => document.getElementById("content")
const input = (id: string) => document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null

function toggle(id: string, label: string, checked: boolean, type: string) {
  return `<label class="ns-switch" title="${label}"><input type="checkbox" id="${id}" ${checked ? "checked" : ""} onchange="nsSave('${type}')"><span class="ns-track" aria-hidden="true"></span><span class="ns-sr">${label}</span></label>`
}

function rowHtml(t: NotificationSetting) {
  const id = esc(t.type)
  const lead = t.reminder
    ? `<select id="ns-lead-${id}" aria-label="Nhắc trước – ${esc(t.name)}" onchange="nsSave('${id}')" ${t.inApp || t.email ? "" : "disabled"}>${LEAD_OPTIONS.map(([m, l]) => `<option value="${m}" ${m === t.leadMinutes ? "selected" : ""}>${l}</option>`).join("")}${LEAD_OPTIONS.some(([m]) => m === t.leadMinutes) || t.leadMinutes == null ? "" : `<option value="${t.leadMinutes}" selected>${t.leadMinutes} phút</option>`}</select>`
    : '<span class="ns-na">—</span>'
  return `<div class="ns-row" role="row"><div class="ns-type" role="cell"><span class="ns-icon t-${id.toLowerCase()}">${icon(t.icon)}</span><span><b>${esc(t.name)}</b><small>${esc(t.description ?? "")}</small></span></div><div role="cell" data-label="Hệ thống">${toggle(`ns-app-${id}`, "Thông báo hệ thống", t.inApp, id)}</div><div role="cell" data-label="Gmail">${toggle(`ns-mail-${id}`, "Gửi Gmail", t.email, id)}</div><div role="cell" data-label="Nhắc trước">${lead}</div><div class="ns-status" role="cell" id="ns-status-${id}" aria-live="polite"></div></div>`
}

function pageHtml() {
  if (failed) return `<div class="card ns-card"><p>Không tải được cài đặt thông báo.</p><button class="btn btn-light" onclick="nsReload()">Thử lại</button></div>`
  if (!data) return '<div class="card ns-card"><p class="mini">Đang tải cài đặt…</p></div>'
  return `<div class="card ns-card"><div class="ns-head"><div><h3>Kênh nhận thông báo</h3><p>Chọn loại thông báo bạn muốn nhận và nơi nhận. Thay đổi được lưu ngay và chỉ áp dụng cho tài khoản của bạn.</p></div><div class="ns-aside"><div class="ns-mail">Gmail gửi tới<b>${esc(data.email)}</b></div>${canPublish ? '<button class="btn btn-primary" onclick="publishNoticeModal()">Phát hành thông báo</button>' : ""}</div></div>${data.emailAvailable ? "" : '<div class="ns-warn">Máy chủ chưa cấu hình tài khoản gửi Gmail: lựa chọn Gmail vẫn được lưu và sẽ có hiệu lực khi quản trị cấu hình xong.</div>'}<div class="ns-table" role="table" aria-label="Cài đặt thông báo"><div class="ns-row ns-th" role="row"><div role="columnheader">Loại thông báo</div><div role="columnheader">Hệ thống</div><div role="columnheader">Gmail</div><div role="columnheader">Nhắc trước</div><div role="columnheader"><span class="ns-sr">Trạng thái</span></div></div>${data.types.map(rowHtml).join("")}</div></div>`
}

/** Repaints only while this page is still shown (a slow response must not overwrite the page the user moved to). */
function paint() {
  const el = content()
  if (el?.querySelector(".ns-card")) el.innerHTML = pageHtml()
}

async function load() {
  try {
    const [settings, options] = await Promise.all([fetchNotificationSettings(), fetchAnnouncementOptions().catch(() => null)])
    data = settings
    canPublish = Boolean(options?.canPublish)
    failed = false
  } catch {
    failed = true
  }
  paint()
}

async function nsSave(type: string) {
  if (!data) return
  const current = data.types.find((t) => t.type === type)
  if (!current) return
  const inApp = (input(`ns-app-${type}`) as HTMLInputElement | null)?.checked ?? current.inApp
  const email = (input(`ns-mail-${type}`) as HTMLInputElement | null)?.checked ?? current.email
  const leadEl = input(`ns-lead-${type}`)
  const leadMinutes = current.reminder && leadEl ? Number(leadEl.value) : null
  if (leadEl) leadEl.disabled = !inApp && !email
  const status = document.getElementById(`ns-status-${type}`)
  if (status) status.textContent = "Đang lưu…"
  try {
    const saved = await saveNotificationSetting(type, { inApp, email, leadMinutes })
    data = { ...data, types: data.types.map((t) => (t.type === type ? saved : t)) }
    if (status) {
      status.textContent = "Đã lưu"
      setTimeout(() => status.textContent === "Đã lưu" && (status.textContent = ""), 1800)
    }
  } catch {
    if (status) status.textContent = "Lỗi, chưa lưu"
    void load()
  }
}

export function installNotificationSettingsPage(render: Record<string, () => void>) {
  render.notifications = function () {
    const el = content()
    if (!el) return
    el.innerHTML = pageHtml()
    void load()
  }
  Object.assign(window, { nsSave, nsReload: load })
}
