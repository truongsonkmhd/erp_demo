import type { WorkItem } from "./types.ts"

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

/** Escapes text before it is interpolated into the engine's HTML strings. */
export function escapeHtml(value: unknown): string {
  if (value === undefined || value === null) return ""
  return String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch])
}

/**
 * Inline-handler attributes whose arguments travel in data-* attributes, so text the browser
 * entity-decodes can never become JavaScript: jsCall("wfOpen", id) → data-arg0="…" onclick="wfOpen(this.dataset.arg0)".
 */
export function jsCall(fn: string, ...args: string[]): string {
  if (!/^[A-Za-z_$][\w$]*$/.test(fn)) throw new Error(`Invalid handler name: ${fn}`)
  const data = args.map((arg, i) => `data-arg${i}="${escapeHtml(arg)}"`)
  const params = args.map((_, i) => `this.dataset.arg${i}`).join(",")
  return [...data, `onclick="${fn}(${params})"`].join(" ")
}

/** "2026-10-25" → "25/10/2026"; anything else is returned escaped. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "")
  return match ? `${match[3]}/${match[2]}/${match[1]}` : escapeHtml(iso)
}

/** ISO datetime → "20/10 08:30" in local time; anything else is returned escaped. */
export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return escapeHtml(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatMoney(amount?: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount || 0)} đ`
}

export function statusBadge(item: WorkItem): string {
  const s = item.status
  const cls = s === "Hoàn thành" || s === "Đã chi" || s === "Đã phê duyệt" ? "b-ok"
    : s === "Bị trả lại" ? "b-danger"
      : s === "Chờ duyệt" || s === "Đang trình" ? "b-warn"
        : "b-info"
  return `<span class="badge ${cls}">${escapeHtml(s)}</span>`
}
