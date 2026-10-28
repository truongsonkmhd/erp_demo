import { toast } from "sonner"
import { escapeHtml as esc } from "./html"

/**
 * Feedback of the Nhiệm vụ / Dự án and Công việc pages instead of the browser's alert / confirm / prompt: toasts for
 * messages, and a confirm or reason popup in the page's own modal (the answer comes back as a promise).
 */

export const notify = {
  error: (message: string) => void toast.error(message),
  success: (message: string) => void toast.success(message),
  info: (message: string) => void toast(message),
}

type Modal = { openModal(title: string, html: string): void; closeModal(): void }
const modal = () => window as unknown as Modal

/** The open popup's answer; a new popup (or closing with ✕ / Esc and opening another) answers the old one with null. */
let pending: { resolve(value: string | null): void; required: boolean } | undefined

function open(title: string, html: string, required: boolean): Promise<string | null> {
  pending?.resolve(null)
  return new Promise((resolve) => {
    pending = { resolve, required }
    modal().openModal(title, html)
    setTimeout(() => (document.getElementById("vx-dialog-text") as HTMLTextAreaElement | null)?.focus(), 0)
  })
}

function answer(value: string | null) {
  const p = pending
  pending = undefined
  modal().closeModal()
  p?.resolve(value)
}

function vxDialogOk() {
  if (!pending) return
  const box = document.getElementById("vx-dialog-text") as HTMLTextAreaElement | null
  const text = box?.value.trim() ?? ""
  if (box && pending.required && !text) {
    const err = document.getElementById("vx-dialog-error")
    if (err) err.style.display = ""
    box.focus()
    return
  }
  answer(box ? text : "ok")
}

const buttons = (ok: string, danger: boolean) =>
  `<div class="toolbar" style="margin-top:14px;justify-content:flex-end"><button class="btn btn-light" onclick="vxDialogCancel()">Huỷ</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" onclick="vxDialogOk()">${esc(ok)}</button></div>`

/** "Xoá dự án X?": true when confirmed. */
export async function confirmDialog(o: { title: string; message: string; confirmLabel?: string; danger?: boolean }): Promise<boolean> {
  const html = `<div>${esc(o.message)}</div>${buttons(o.confirmLabel ?? "Xác nhận", !!o.danger)}`
  return (await open(o.title, html, false)) !== null
}

/** A reason / note to type (required unless said otherwise): the text, or null when cancelled. */
export function reasonDialog(o: { title: string; label?: string; hint?: string; confirmLabel?: string; danger?: boolean; required?: boolean }): Promise<string | null> {
  const required = o.required ?? true
  const html = `${o.hint ? `<div class="mini" style="margin-bottom:8px">${esc(o.hint)}</div>` : ""}<label>${esc(o.label ?? "Lý do")}${required ? " *" : ""}</label><textarea id="vx-dialog-text" rows="3"></textarea>
<div id="vx-dialog-error" class="mini" style="display:none;color:var(--danger,#c0392b);margin-top:4px">Vui lòng nhập ${esc((o.label ?? "lý do").toLowerCase())}.</div>${buttons(o.confirmLabel ?? "Xác nhận", !!o.danger)}`
  return open(o.title, html, required)
}

if (typeof window !== "undefined") Object.assign(window, { vxDialogOk, vxDialogCancel: () => answer(null) })
