import { escapeHtml as esc, jsCall } from "../workflow/html.ts"
import { vnDate } from "./dates.ts"
import { audienceLabel } from "./newsCore.ts"
import { roleUnitCode, unitName } from "./org.ts"
import type { NewsPost, SubUnit } from "./types.ts"

/** Pure HTML pieces of Bảng tin; every post field is escaped. */

const KIND_CLASS: Record<string, string> = { "Tin tức": "b-info", "Sự kiện": "b-ok", "Thông báo nội bộ": "b-warn" }

const two = (n: number) => String(n).padStart(2, "0")
/** ISO timestamp → "dd/mm/yyyy hh:mm" in local time. */
export function stamp(iso?: string): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return ""
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`
}

export const eventLine = (e: NonNullable<NewsPost["event"]>) =>
  `${esc(vnDate(e.date))}${e.time ? ` • ${esc(e.time)}` : ""}${e.location ? ` • ${esc(e.location)}` : ""}`

/** Unit of the poster, from the role they posted with. */
export const authorUnit = (p: NewsPost) => {
  const code = roleUnitCode(p.authorRole)
  return code ? unitName(code) : ""
}

/** "Nguyễn Văn Minh – Ban Lãnh đạo Liên đoàn". */
export const authorLine = (p: NewsPost) => `${esc(p.authorName)}${authorUnit(p) ? ` – ${esc(authorUnit(p))}` : ""}`

/** Who the post is for: the whole federation or one unit. */
const audienceBadge = (p: NewsPost, subs: SubUnit[]) =>
  `<span class="badge ${p.audience === "ALL" ? "b-info" : "b-purple"}" title="Phạm vi">👥 ${esc(audienceLabel(p.audience, subs))}</span>`

export function postBadges(p: NewsPost, subs: SubUnit[] = []): string {
  return `<span class="badge ${KIND_CLASS[p.kind] ?? "b-info"}">${esc(p.kind)}</span>${audienceBadge(p, subs)}`
    + (p.pinned && p.status === "Đã đăng" ? '<span class="badge b-danger">Ghim</span>' : "")
    + (p.status !== "Đã đăng" ? `<span class="badge b-warn">${esc(p.status)}</span>` : "")
}

export function postCardHtml(p: NewsPost, subs: SubUnit[] = []): string {
  return `<article class="vx-news-card" ${jsCall("newsOpen", p.id)}><div class="vx-news-badges">${postBadges(p, subs)}</div>
<h4>${esc(p.title)}</h4>${p.summary ? `<p>${esc(p.summary)}</p>` : ""}${p.event ? `<div class="vx-news-event">📅 ${eventLine(p.event)}</div>` : ""}
<div class="mini">${authorLine(p)} • ${esc(stamp(p.publishedAt ?? p.updatedAt))}</div></article>`
}

/** Plain-text body → paragraphs (blank-line separated), single newlines kept as line breaks. */
export const bodyHtml = (body: string) =>
  body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).map((s) => `<p>${esc(s).replace(/\n/g, "<br>")}</p>`).join("")
