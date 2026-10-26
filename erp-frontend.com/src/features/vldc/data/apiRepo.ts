import type { Repo } from "./syncedCollection"

/** apiRequest from lib/api.ts (Bearer token, refresh on 401, ResultMessage unwrapped); injected so tests need no browser. */
export type ApiRequest = <T>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>

/** Undefined fields are dropped like Firestore did; the backend rejects keys it does not know. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/**
 * Repo backed by the Spring API /api/vldc/{collection}. Until realtime (WebSocket) lands, subscribers are
 * refreshed after every write and by polling; a poll only emits when the server list changed.
 * Only the first load reports errors (so the collection can go offline); later poll failures are transient.
 */
export function apiRepo<T extends { id: string }>(collection: string, request: ApiRequest, { pollMs = 10_000 } = {}): Repo<T> {
  const base = `/api/vldc/${encodeURIComponent(collection)}`
  const refreshers = new Set<() => Promise<void>>()
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
      void refresh()
      const timer = setInterval(() => void refresh(), pollMs)
      return () => {
        stopped = true
        clearInterval(timer)
        refreshers.delete(refresh)
      }
    },
  }
}
