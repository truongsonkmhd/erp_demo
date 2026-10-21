import { escapeHtml as esc, jsCall } from "../workflow/html"
import { localToday } from "./dates"
import { bodyHtml, eventLine, postBadges, postCardHtml, stamp } from "./newsHtml"
import {
  NEWS_KINDS, audienceLabel, canManage, canPost, filterPosts, newsCalendarEntry, postableAudiences, sortPosts, upcomingEvents,
  visiblePosts,
} from "./newsCore"
import { ROLE_PROFILES } from "./org"
import { vldcData } from "./registry"
import type { NewsKind, NewsPost } from "./types"

/** Bảng tin: news and events published by leadership, TC-HC and unit heads; read-only for everyone else. */

type Ctx = { role(): string; perms(): string[]; openModal(title: string, html: string): void; closeModal(): void }

const state = { kind: "", query: "" }
const content = () => document.getElementById("content")
const field = (id: string) => document.getElementById(id) as HTMLInputElement | null
const value = (id: string) => (field(id)?.value ?? "").trim()

export function installNewsPage(render: Record<string, () => void>, ctx: Ctx) {
  const mine = () => sortPosts(visiblePosts(vldcData.get("news"), ctx.role()))
  const canWrite = () => canPost(ctx.perms()) && postableAudiences(ctx.role()).length > 0
  const find = (id: string) => vldcData.get("news").find((p) => p.id === id)
  const calendarOf = (id: string) => vldcData.get("calendarEvents").find((e) => e.id === `EV-${id}`)

  function pageHtml(): string {
    const posts = mine()
    const pinned = posts.find((p) => p.pinned && p.status === "Đã đăng")
    const events = upcomingEvents(posts, localToday())
    const list = filterPosts(posts, state.kind, state.query)
    const chip = (k: string, label: string) =>
      `<button class="vx-news-chip${state.kind === k ? " active" : ""}" ${jsCall("newsFilter", k)}>${label}</button>`
    const hero = pinned
      ? `<div class="card vx-news-pinned" ${jsCall("newsOpen", pinned.id)}><div class="vx-news-badges">${postBadges(pinned)}</div><h3>${esc(pinned.title)}</h3>${pinned.summary ? `<p>${esc(pinned.summary)}</p>` : ""}<div class="mini">${esc(pinned.authorName)} • ${esc(audienceLabel(pinned.audience))}</div></div>`
      : '<div class="card vx-news-pinned"><h3>Bảng tin Liên đoàn</h3><p class="mini">Chưa có bài ghim.</p></div>'
    const upcoming = `<div class="card vx-news-upcoming"><h3>Sự kiện sắp tới</h3>${events.map((e) => `<div class="vx-news-up-row" ${jsCall("newsOpen", e.id)}><div class="vx-news-date"><b>${esc(e.event!.date.slice(8, 10))}</b><span>Th${Number(e.event!.date.slice(5, 7))}</span></div><div><b>${esc(e.title)}</b><div class="mini">${eventLine(e.event!)}</div></div></div>`).join("") || '<div class="mini">Không có sự kiện sắp tới.</div>'}</div>`
    return `<div class="vx-news-top">${hero}${upcoming}</div>
<div class="card vx-news-toolbar"><div class="vx-news-chips">${chip("", "Tất cả")}${NEWS_KINDS.map((k) => chip(k, k)).join("")}</div>
<input placeholder="Tìm bài viết..." value="${esc(state.query)}" onchange="newsSearch(this.value)">${canWrite() ? `<button class="btn btn-primary" ${jsCall("newsForm")}>+ Đăng bài</button>` : ""}</div>
<div class="vx-news-list">${list.map(postCardHtml).join("") || '<div class="card mini">Không có bài viết phù hợp.</div>'}</div>`
  }

  function rerender() {
    const el = content()
    if (el) el.innerHTML = pageHtml()
  }
  render.news = rerender

  function newsOpen(id: string) {
    const p = find(id)
    if (!p) return
    const actions = canManage(p, ctx.role())
      ? `<div class="toolbar" style="margin-top:12px"><button class="btn btn-light" ${jsCall("newsForm", p.id)}>Sửa</button>${p.status === "Đã đăng" ? `<button class="btn btn-light" ${jsCall("newsPin", p.id)}>${p.pinned ? "Bỏ ghim" : "Ghim"}</button><button class="btn btn-light" ${jsCall("newsWithdraw", p.id)}>Gỡ bài</button>` : ""}</div>`
      : ""
    const event = p.event ? `<div class="metric"><span>Thời gian • địa điểm</span><b>${eventLine(p.event)}</b></div>` : ""
    ctx.openModal(p.kind, `<div class="vx-news-badges">${postBadges(p)}</div><h2 style="margin:8px 0">${esc(p.title)}</h2><div class="mini">${esc(p.authorName)} • ${esc(audienceLabel(p.audience))}${p.publishedAt ? ` • ${esc(stamp(p.publishedAt))}` : ""}</div>${event}<div class="vx-news-body">${p.summary ? `<p><b>${esc(p.summary)}</b></p>` : ""}${bodyHtml(p.body)}</div>${actions}`)
  }

  function newsForm(id?: string) {
    const p = id ? find(id) : undefined
    if (p ? !canManage(p, ctx.role()) : !canWrite()) return
    const audiences = postableAudiences(ctx.role())
    if (p && !audiences.includes(p.audience)) audiences.push(p.audience)
    const kind = p?.kind ?? "Tin tức"
    const opt = (v: string, label: string, sel: boolean) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(label)}</option>`
    ctx.openModal(p ? "Sửa bài viết" : "Đăng bài mới", `<div class="form-grid">
<div><label>Loại bài</label><select id="news-kind" onchange="document.getElementById('news-event').style.display=this.value==='Sự kiện'?'':'none'">${NEWS_KINDS.map((k) => opt(k, k, k === kind)).join("")}</select></div>
<div><label>Phạm vi</label><select id="news-audience">${audiences.map((a) => opt(a, audienceLabel(a), a === p?.audience)).join("")}</select></div>
<div class="full"><label>Tiêu đề *</label><input id="news-title" value="${esc(p?.title ?? "")}"></div>
<div class="full"><label>Tóm tắt</label><input id="news-summary" value="${esc(p?.summary ?? "")}"></div>
<div class="full"><label>Nội dung * (cách đoạn bằng dòng trống)</label><textarea id="news-body" rows="7">${esc(p?.body ?? "")}</textarea></div>
<div class="full vx-news-form-event" id="news-event" style="${kind === "Sự kiện" ? "" : "display:none"}"><div><label>Ngày *</label><input id="news-date" type="date" value="${esc(p?.event?.date ?? "")}"></div><div><label>Giờ</label><input id="news-time" type="time" value="${esc(p?.event?.time ?? "")}"></div><div><label>Địa điểm</label><input id="news-location" value="${esc(p?.event?.location ?? "")}"></div><label class="vx-news-check"><input id="news-calendar" type="checkbox"${p && calendarOf(p.id) ? " checked disabled" : ""}> Thêm vào trang Sự kiện</label></div>
<label class="vx-news-check full"><input id="news-pinned" type="checkbox"${p?.pinned ? " checked" : ""}> Ghim lên đầu bảng tin</label>
</div><div class="toolbar" style="margin-top:12px"><button class="btn btn-light" ${jsCall("newsSave", "draft", p?.id ?? "")}>Lưu nháp</button><button class="btn btn-primary" ${jsCall("newsSave", "publish", p?.id ?? "")}>Đăng</button></div>`)
  }

  function newsSave(mode: string, id: string) {
    const prev = id ? find(id) : undefined
    const role = ctx.role()
    if (prev ? !canManage(prev, role) : !canWrite()) return
    const kind = value("news-kind") as NewsKind
    const title = value("news-title"), body = value("news-body"), date = value("news-date")
    if (!title || !body) return alert("Vui lòng nhập tiêu đề và nội dung")
    if (kind === "Sự kiện" && !date) return alert("Vui lòng chọn ngày diễn ra sự kiện")
    const audience = value("news-audience") || "ALL"
    const now = new Date().toISOString()
    // "Lưu nháp" on a published post keeps it published; a withdrawn post goes back to draft.
    const status = mode === "publish" || prev?.status === "Đã đăng" ? "Đã đăng" : "Nháp"
    const post: NewsPost = {
      id: prev?.id ?? `NEWS-${Date.now().toString(36).toUpperCase()}`,
      kind, title, body, audience, status, summary: value("news-summary"), pinned: !!field("news-pinned")?.checked,
      authorRole: prev?.authorRole ?? role, authorName: prev?.authorName ?? ROLE_PROFILES[role]?.name ?? role, updatedAt: now,
    }
    const publishedAt = prev?.publishedAt ?? (status === "Đã đăng" ? now : undefined)
    if (publishedAt) post.publishedAt = publishedAt
    if (kind === "Sự kiện") post.event = { date, time: value("news-time"), location: value("news-location") }
    void vldcData.save("news", post)
    // An existing calendar entry always follows the post; a new one only when "Thêm vào Lịch" is ticked.
    const existing = calendarOf(post.id)
    const entry = existing || field("news-calendar")?.checked ? newsCalendarEntry(post, existing) : null
    if (entry) void vldcData.save("calendarEvents", entry)
    ctx.closeModal()
    rerender()
  }

  function update(id: string, patch: Partial<NewsPost>) {
    const p = find(id)
    if (!p || !canManage(p, ctx.role())) return
    const next = { ...p, ...patch, updatedAt: new Date().toISOString() }
    void vldcData.save("news", next)
    const existing = calendarOf(id)
    const entry = existing && newsCalendarEntry(next, existing)
    if (entry) void vldcData.save("calendarEvents", entry)
    ctx.closeModal()
    rerender()
  }

  Object.assign(window, {
    newsOpen, newsForm, newsSave,
    newsPin: (id: string) => update(id, { pinned: !find(id)?.pinned }),
    newsWithdraw: (id: string) => {
      if (confirm("Gỡ bài viết này khỏi bảng tin?")) update(id, { status: "Đã gỡ", pinned: false })
    },
    newsFilter: (k: string) => { state.kind = k; rerender() },
    newsSearch: (q: string) => { state.query = q; rerender() },
  })
}
