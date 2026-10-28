import type { ChangeFeed } from "./realtime"
import type { Repo } from "./syncedCollection"

/** apiRequest from lib/api.ts (Bearer token, refresh on 401, ResultMessage unwrapped); injected so tests need no browser. */
export type ApiRequest = <T>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>

/** Undefined fields are dropped like Firestore did; the backend rejects keys it does not know. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Every live subscriber's refresh, per collection: writes made outside the repo (hrApi.ts) pull the new rows at once. */
const liveRefreshers = new Map<string, Set<() => Promise<void>>>()

/** Re-fetches a collection for every subscriber; the WebSocket feed does the same a moment later. */
export function refreshApiCollection(collection: string): Promise<unknown> {
  return Promise.all([...(liveRefreshers.get(collection) ?? [])].map((refresh) => refresh()))
}

/**
 * Repo backed by the Spring API /api/vldc/{collection}. Subscribers re-fetch the list when the backend reports a
 * change (WebSocket feed) and after this client's own writes; the list only re-emits when it actually changed.
 * Only the first load reports errors (so the collection can go offline); later refetch failures are transient.
 */
export function apiRepo<T extends { id: string }>(collection: string, request: ApiRequest, feed: ChangeFeed): Repo<T> {
  const base = `/api/vldc/${encodeURIComponent(collection)}`
  const refreshers = new Set<() => Promise<void>>()
  if (!liveRefreshers.has(collection)) liveRefreshers.set(collection, new Set())
  const live = liveRefreshers.get(collection) as Set<() => Promise<void>>
  const refreshAll = () => Promise.all([...refreshers].map((refresh) => refresh()))

  return {
    async isEmpty() {
      return request<boolean>(`${base}/empty`)
    },
    async save(item) {
      await request(`${base}/${encodeURIComponent(item.id)}`, { method: "PUT", body: plain(item) })
      await refreshAll()
    },
    async replaceAll(items) {
      await request(base, { method: "PUT", body: plain(items) })
      await refreshAll()
    },
    subscribe(cb, onError) {
      let last: string | undefined
      let stopped = false
      const refresh = async () => {
        try {
          const rows = await request<T[]>(base)
          const text = JSON.stringify(rows)
          if (stopped || text === last) return
          last = text
          cb(rows)
        } catch (error) {
          if (stopped) return
          if (last === undefined) onError(error)
          else console.warn(`[${collection}] Tải lại từ máy chủ lỗi:`, error)
        }
      }
      refreshers.add(refresh)
      live.add(refresh)
      void refresh()
      const unwatch = feed.watch(collection, () => void refresh())
      return () => {
        stopped = true
        unwatch()
        refreshers.delete(refresh)
        live.delete(refresh)
      }
    },
  }
}
