import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, BellOff, CalendarClock, CheckCheck, ClipboardList, DoorOpen, Flag, FolderCheck, FolderX, ListChecks, Loader2, Megaphone, Settings, Truck, Wallet, type LucideIcon } from "lucide-react"
import { changeFeed } from "@/features/vldc/data/registry"
import {
  NOTIFICATION_QUEUE, fetchNotifications, fetchUnreadCount, markAllNotificationsRead, markNotificationRead,
  type AppNotification,
} from "@/features/vldc/data/notificationsApi"
import { openNotices } from "@/features/vldc/legacy/engine"
import { vldcActions } from "@/features/vldc/store"

/** Icon per notification type (the backend sends the lucide name); unknown types fall back to the bell. */
const ICONS: Record<string, LucideIcon> = { CalendarClock, Wallet, Truck, DoorOpen, Megaphone, FolderCheck, FolderX, ClipboardList, ListChecks, Flag }

type Filter = "all" | "unread"

function timeLabel(iso: string, now = new Date()): string {
  const at = new Date(iso)
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60000)
  if (minutes < 1) return "Vừa xong"
  if (minutes < 60) return `${minutes} phút trước`
  const hm = at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  if (at.toDateString() === now.toDateString()) return `${hm} hôm nay`
  return `${hm} ${String(at.getDate()).padStart(2, "0")}/${String(at.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Bell + dropdown of the signed-in user's notifications: "Mới" / "Trước đó", lazy-loaded by cursor as the list scrolls,
 * refreshed live through the per-user STOMP queue. `legacyUnread` counts the older in-browser business notices,
 * still reachable from the footer.
 */
export function VldcNotificationBell({ legacyUnread }: { legacyUnread: number }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [items, setItems] = useState<AppNotification[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [unread, setUnread] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Responses of a superseded request (filter switched, list reloaded) are dropped.
  const seq = useRef(0)

  const reload = useCallback(async (which: Filter) => {
    const mine = ++seq.current
    setLoading(true)
    setFailed(false)
    try {
      const page = await fetchNotifications(null, which === "unread")
      if (mine !== seq.current) return
      setItems(page.items)
      setCursor(page.nextCursor)
      setHasMore(Boolean(page.nextCursor))
      setUnread(page.unreadCount)
      listRef.current?.scrollTo({ top: 0 })
    } catch {
      if (mine === seq.current) setFailed(true)
    } finally {
      if (mine === seq.current) setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return
    const mine = seq.current
    setLoading(true)
    try {
      const page = await fetchNotifications(cursor, filter === "unread")
      if (mine !== seq.current) return
      setItems((current) => {
        const seen = new Set(current.map((n) => n.id))
        return [...current, ...page.items.filter((n) => !seen.has(n.id))]
      })
      setCursor(page.nextCursor)
      setHasMore(Boolean(page.nextCursor))
      setUnread(page.unreadCount)
    } catch {
      if (mine === seq.current) setFailed(true)
    } finally {
      if (mine === seq.current) setLoading(false)
    }
  }, [cursor, filter, hasMore, loading])

  // Newly arrived notifications go on top without resetting how far the user has scrolled.
  const pullNew = useCallback(async () => {
    try {
      const page = await fetchNotifications(null, filter === "unread")
      setUnread(page.unreadCount)
      setItems((current) => {
        const seen = new Set(current.map((n) => n.id))
        const fresh = page.items.filter((n) => !seen.has(n.id))
        return fresh.length ? [...fresh, ...current] : current
      })
    } catch {
      // the next ping or reopening the panel catches up
    }
  }, [filter])

  useEffect(() => {
    void fetchUnreadCount().then(setUnread).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (open) void reload(filter)
  }, [open, filter, reload])

  // Live: the backend pings this user's queue after each new notification (and the feed re-fires on reconnect).
  const openRef = useRef(open)
  openRef.current = open
  useEffect(
    () =>
      changeFeed.watch(NOTIFICATION_QUEUE, () => {
        if (openRef.current) void pullNew()
        else void fetchUnreadCount().then(setUnread).catch(() => undefined)
      }),
    [pullNew],
  )

  // Lazy loading: fetch the next page when the sentinel at the end of the list scrolls into view.
  useEffect(() => {
    const target = sentinelRef.current
    if (!open || !target || !hasMore) return
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void loadMore(), {
      root: listRef.current,
      rootMargin: "120px",
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [open, hasMore, loadMore, items.length])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => wrapRef.current && !wrapRef.current.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  async function openItem(n: AppNotification) {
    if (!n.read) {
      setItems((current) => (filter === "unread" ? current.filter((x) => x.id !== n.id) : current.map((x) => (x.id === n.id ? { ...x, read: true } : x))))
      setUnread((u) => Math.max(0, u - 1))
      void markNotificationRead(n.id).then(setUnread).catch(() => undefined)
    }
    if (n.link) {
      setOpen(false)
      vldcActions.show(n.link)
    }
  }

  async function readAll() {
    setItems((current) => (filter === "unread" ? [] : current.map((x) => ({ ...x, read: true }))))
    setHasMore(filter === "unread" ? false : hasMore)
    setUnread(0)
    try {
      await markAllNotificationsRead()
    } catch {
      void reload(filter)
    }
  }

  const fresh = items.filter((n) => n.fresh)
  const older = items.filter((n) => !n.fresh)

  const row = (n: AppNotification) => {
    const Icon = (n.icon && ICONS[n.icon]) || Bell
    return (
      <button key={n.id} type="button" className={`vn-item${n.read ? "" : " is-unread"}`} onClick={() => void openItem(n)}>
        <span className={`vn-icon t-${n.type.toLowerCase()}`} aria-hidden="true">
          <Icon size={18} />
        </span>
        <span className="vn-body">
          <span className="vn-title">{n.title}</span>
          <span className="vn-text">{n.body}</span>
          <span className="vn-meta">
            {n.typeName} • <time dateTime={n.createdAt}>{timeLabel(n.createdAt)}</time>
          </span>
        </span>
        {!n.read && <span className="vn-dot" aria-label="Chưa đọc" />}
      </button>
    )
  }

  return (
    <div className="vn-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`vx-icon-btn vx-action${open ? " is-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title={unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo"}
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={19} />
        {unread > 0 && <span className="vx-badge is-danger">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="vn-panel" role="dialog" aria-label="Thông báo">
          <div className="vn-head">
            <h2>Thông báo</h2>
            <div className="vn-head-actions">
              <button type="button" className="vn-ghost" onClick={() => void readAll()} disabled={unread === 0}>
                <CheckCheck size={15} aria-hidden="true" /> Đọc hết
              </button>
              <button
                type="button"
                className="vn-icon-btn"
                onClick={() => {
                  setOpen(false)
                  vldcActions.show("notifications")
                }}
                aria-label="Quản lý thông báo"
                title="Quản lý thông báo"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
          <div className="vn-tabs" role="group" aria-label="Lọc thông báo">
            {(["all", "unread"] as Filter[]).map((f) => (
              <button key={f} type="button" className={filter === f ? "is-active" : ""} aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "Tất cả" : "Chưa đọc"}
                {f === "unread" && unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
              </button>
            ))}
          </div>

          <div
            className="vn-list"
            ref={listRef}
            onScroll={(e) => {
              // Also triggers paging where IntersectionObserver is throttled; near the end is enough.
              const el = e.currentTarget
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) void loadMore()
            }}
          >
            {fresh.length > 0 && <div className="vn-section">Mới</div>}
            {fresh.map(row)}
            {older.length > 0 && <div className="vn-section">Trước đó</div>}
            {older.map(row)}

            {!loading && !failed && items.length === 0 && (
              <div className="vn-empty">
                <BellOff size={28} aria-hidden="true" />
                <span>{filter === "unread" ? "Bạn đã đọc hết thông báo." : "Chưa có thông báo nào."}</span>
              </div>
            )}
            {failed && (
              <div className="vn-empty">
                <span>Không tải được thông báo.</span>
                <button type="button" className="vn-ghost" onClick={() => void reload(filter)}>Thử lại</button>
              </div>
            )}
            {loading && (
              <div className="vn-loading" aria-live="polite">
                <Loader2 size={18} className="vn-spin" aria-hidden="true" /> Đang tải…
              </div>
            )}
            <div ref={sentinelRef} className="vn-sentinel" aria-hidden="true" />
          </div>

          {legacyUnread > 0 && (
            <button
              type="button"
              className="vn-footer"
              onClick={() => {
                setOpen(false)
                openNotices()
              }}
            >
              Thông báo nghiệp vụ khác <b>{legacyUnread}</b>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
