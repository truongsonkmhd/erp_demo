import { apiRequest } from "@/lib/api"

/** Shapes of /api/notifications (NotificationController). */
export type AppNotification = {
  id: number
  type: string
  typeName: string
  /** lucide-react icon name of the type. */
  icon: string | null
  title: string
  body: string
  /** VLDC page to open, e.g. "calendar". */
  link: string | null
  /** ISO local date-time. */
  createdAt: string
  read: boolean
  /** "Mới" (recent) vs "Trước đó". */
  fresh: boolean
}

export type NotificationPage = { items: AppNotification[]; nextCursor: string | null; unreadCount: number }

export type NotificationSetting = {
  type: string
  name: string
  description: string | null
  icon: string | null
  inApp: boolean
  email: boolean
  leadMinutes: number | null
  reminder: boolean
}

export type NotificationSettings = { email: string; emailAvailable: boolean; types: NotificationSetting[] }

/** Per-user STOMP queue; the backend pings it when a notification for this user is committed. */
export const NOTIFICATION_QUEUE = "/user/queue/notifications"

export const PAGE_SIZE = 20

export function fetchNotifications(cursor: string | null, unreadOnly: boolean) {
  const params = new URLSearchParams({ size: String(PAGE_SIZE) })
  if (cursor) params.set("cursor", cursor)
  if (unreadOnly) params.set("unread", "true")
  return apiRequest<NotificationPage>(`/api/notifications?${params}`)
}

export const fetchUnreadCount = () => apiRequest<number>("/api/notifications/unread-count")

/** Resolves to the remaining unread count. */
export const markNotificationRead = (id: number) => apiRequest<number>(`/api/notifications/${id}/read`, { method: "POST" })

export const markAllNotificationsRead = () => apiRequest<number>("/api/notifications/read-all", { method: "POST" })

export const fetchNotificationSettings = () => apiRequest<NotificationSettings>("/api/notifications/settings")

export function saveNotificationSetting(type: string, value: Pick<NotificationSetting, "inApp" | "email" | "leadMinutes">) {
  return apiRequest<NotificationSetting>(`/api/notifications/settings/${encodeURIComponent(type)}`, { method: "PUT", body: value })
}

/** Lead-time choices offered for reminder types (minutes). */
export const LEAD_OPTIONS: [number, string][] = [
  [5, "5 phút"], [15, "15 phút"], [30, "30 phút"], [60, "1 giờ"], [120, "2 giờ"], [1440, "1 ngày"], [2880, "2 ngày"],
]

/** "Phát hành": targets are "federation" or "unit:{departmentId}", limited by the backend to units the caller manages. */
export type AnnouncementOptions = { canPublish: boolean; targets: { value: string; label: string }[] }

export const fetchAnnouncementOptions = () => apiRequest<AnnouncementOptions>("/api/notifications/announcements/options")

/** Resolves to how many people were notified. */
export function publishAnnouncement(input: { title: string; body: string; link: string | null; target: string; important: boolean }) {
  return apiRequest<number>("/api/notifications/announcements", { method: "POST", body: input })
}
