import { UNIT_DEFS, roleUnitCode, unitKey, unitName, type UnitCode } from "./org.ts"
import { vnDate } from "./dates.ts"
import type { CalendarEvent, NewsKind, NewsPost } from "./types.ts"

export const NEWS_KINDS: NewsKind[] = ["Tin tức", "Sự kiện", "Thông báo nội bộ"]
/** Roles that publish for the whole federation; other posters only for their own unit. */
const FEDERATION_POSTERS = ["lanhdao", "tochuc"]
const UNIT_HEADS = ["truongdonvi", "matdat", "bien", "hangkhong", "trungtam"]

export const canPost = (perms: string[]) => perms.includes("*") || perms.includes("vldc-news:create")

export function postableAudiences(role: string): string[] {
  if (FEDERATION_POSTERS.includes(role)) return ["ALL", ...UNIT_DEFS.map((u) => u.code)]
  const code = UNIT_HEADS.includes(role) ? roleUnitCode(role) : undefined
  return code ? [code] : []
}

export const canManage = (post: NewsPost, role: string) => post.authorRole === role || FEDERATION_POSTERS.includes(role)

/** Published posts for the reader's audience; authors also see their own drafts and withdrawn posts. */
export function visiblePosts(posts: NewsPost[], role: string): NewsPost[] {
  const unit = roleUnitCode(role)
  return posts.filter((p) => {
    if (p.status !== "Đã đăng") return p.authorRole === role
    return role === "lanhdao" || p.audience === "ALL" || p.audience === unit || p.authorRole === role
  })
}

const when = (p: NewsPost) => p.publishedAt ?? p.updatedAt ?? ""

export const sortPosts = (posts: NewsPost[]) =>
  [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || when(b).localeCompare(when(a)))

export const upcomingEvents = (posts: NewsPost[], today: string, n = 3) =>
  posts
    .filter((p) => p.status === "Đã đăng" && p.event?.date && p.event.date >= today)
    .sort((a, b) => `${a.event!.date} ${a.event!.time}`.localeCompare(`${b.event!.date} ${b.event!.time}`))
    .slice(0, n)

export function filterPosts(posts: NewsPost[], kind: string, query: string): NewsPost[] {
  const q = unitKey(query.trim())
  return posts.filter((p) => (!kind || p.kind === kind) && (!q || unitKey(`${p.title} ${p.summary}`).includes(q)))
}

export const audienceLabel = (a: string) => (a === "ALL" ? "Toàn Liên đoàn" : unitName(a as UnitCode))

/**
 * The post's "Thêm vào Lịch" entry (stable id EV-<postId>). A post that is no longer a published event keeps
 * its existing entry, marked withdrawn (the store has no delete); without one there is nothing to add.
 */
export function newsCalendarEntry(post: NewsPost, existing?: CalendarEvent): CalendarEvent | null {
  if (post.status === "Đã đăng" && post.event) {
    return {
      id: `EV-${post.id}`, date: vnDate(post.event.date), time: post.event.time || "08:00", title: post.title,
      scope: post.audience === "ALL" ? "federation" : "unit", unit: audienceLabel(post.audience), project: "-",
      owner: post.authorRole, link: "news", note: [post.event.location, post.summary].filter(Boolean).join(" • "),
    }
  }
  return existing ? { ...existing, title: `[Đã gỡ] ${post.title}` } : null
}
