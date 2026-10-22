import { UNIT_DEFS, roleUnitCode, unitKey, unitName, type UnitCode } from "./org.ts"
import { vnDate } from "./dates.ts"
import type { CalendarEvent, NewsKind, NewsPost, SubUnit } from "./types.ts"

export const NEWS_KINDS: NewsKind[] = ["Tin tức", "Sự kiện", "Thông báo nội bộ"]
/** Roles that publish for the whole federation; other posters only for their own unit. */
const FEDERATION_POSTERS = ["lanhdao", "tochuc"]
const UNIT_HEADS = ["truongdonvi", "matdat", "bien", "hangkhong", "trungtam"]

export const canPost = (perms: string[]) => perms.includes("*") || perms.includes("vldc-news:create")

/** Active tổ/phòng ids of a unit, by name. */
const subIdsOf = (unit: string, subs: SubUnit[]) =>
  subs.filter((s) => s.unit === unit && s.active).sort((a, b) => a.name.localeCompare(b.name, "vi")).map((s) => s.id)

/** Audiences a role may post to: "ALL", units and their tổ/phòng (each tổ right after its unit). */
export function postableAudiences(role: string, subs: SubUnit[] = []): string[] {
  const withSubs = (unit: string) => [unit, ...subIdsOf(unit, subs)]
  if (FEDERATION_POSTERS.includes(role)) return ["ALL", ...UNIT_DEFS.flatMap((u) => withSubs(u.code))]
  const code = UNIT_HEADS.includes(role) ? roleUnitCode(role) : undefined
  return code ? withSubs(code) : []
}

/** The unit an audience belongs to: itself for a unit, the parent unit for a tổ/phòng. */
const audienceUnit = (audience: string, subs: SubUnit[]) => subs.find((s) => s.id === audience)?.unit ?? audience

export const canManage = (post: NewsPost, role: string) => post.authorRole === role || FEDERATION_POSTERS.includes(role)

/** Published posts for the reader's audience; authors also see their own drafts and withdrawn posts. */
export function visiblePosts(posts: NewsPost[], role: string, subs: SubUnit[] = []): NewsPost[] {
  const unit = roleUnitCode(role)
  return posts.filter((p) => {
    if (p.status !== "Đã đăng") return p.authorRole === role
    // Tổ/phòng have no accounts of their own: their posts reach the accounts of the parent unit.
    return role === "lanhdao" || p.audience === "ALL" || audienceUnit(p.audience, subs) === unit || p.authorRole === role
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

export function audienceLabel(a: string, subs: SubUnit[] = []): string {
  if (a === "ALL") return "Toàn Liên đoàn"
  const sub = subs.find((s) => s.id === a)
  if (sub) return `${sub.name} – ${unitName(sub.unit as UnitCode)}`
  // An unknown id (e.g. a tổ not loaded yet) is shown as is rather than failing.
  return UNIT_DEFS.some((u) => u.code === a) ? unitName(a as UnitCode) : a
}

/**
 * The post's "Thêm vào Lịch" entry (stable id EV-<postId>). A post that is no longer a published event keeps
 * its existing entry, marked withdrawn (the store has no delete); without one there is nothing to add.
 */
export function newsCalendarEntry(post: NewsPost, existing?: CalendarEvent, subs: SubUnit[] = []): CalendarEvent | null {
  if (post.status === "Đã đăng" && post.event) {
    return {
      id: `EV-${post.id}`, date: vnDate(post.event.date), time: post.event.time || "08:00", title: post.title,
      scope: post.audience === "ALL" ? "federation" : "unit", unit: audienceLabel(audienceUnit(post.audience, subs)), project: "-",
      owner: post.authorRole, link: "news", note: [post.event.location, post.summary].filter(Boolean).join(" • "),
    }
  }
  return existing ? { ...existing, title: `[Đã gỡ] ${post.title}` } : null
}
