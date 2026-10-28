import { getStoredUser } from "@/services/auth/tokenStorage"
import { escapeHtml as esc } from "../workflow/html"
import { notify } from "../workflow/dialogs"
import { serverMessage } from "./serverMessage"
import { changeFeed } from "./registry"
import { createWorkCache, type CacheEntry } from "./workCache"

/**
 * The shared cache of the Nhiệm vụ / Dự án and Công việc pages (on the action APIs) and how their buttons call the
 * server: wait for the answer, show the server's message on failure, reload what changed.
 */

const listeners = new Set<(key: string) => void>()

const cache = createWorkCache({ feed: changeFeed, onUpdate: (key) => listeners.forEach((fn) => fn(key)) })

let cachedFor: number | null | undefined

/**
 * What the server returns depends on who asks (permissions, allowed actions, what is visible), and signing out and in
 * does not reload the page: the cache is emptied whenever the signed-in person is not the one it was filled for.
 */
export const workCache: typeof cache = {
  ...cache,
  get(key, load, topics) {
    const id = getStoredUser()?.id ?? null
    if (cachedFor !== undefined && cachedFor !== id) cache.clear()
    cachedFor = id
    return cache.get(key, load, topics)
  },
}

/** Pages re-render when an entry they show has new data. */
export function onWorkUpdate(fn: (key: string) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** The signed-in person, to compare with the PersonRef values the APIs return. */
export function me(): { userId: number | null; fullName: string; orgUnitCode: string | null } {
  const user = getStoredUser()
  return { userId: user?.id ?? null, fullName: user?.fullName ?? "", orgUnitCode: user?.orgUnitCode ?? null }
}

let busy = false

/**
 * Runs a button's server call: one at a time, the server's message as a toast on failure (nothing is changed then),
 * and on success every cached entry reloads before then() navigates or re-renders.
 */
export async function runAction<T>(task: () => Promise<T>, then?: (result: T) => void): Promise<T | undefined> {
  if (busy) return undefined
  busy = true
  try {
    const result = await task()
    workCache.invalidate()
    then?.(result)
    return result
  } catch (error) {
    // The server answers 403 with a generic "Forbidden".
    const forbidden = (error as { status?: number }).status === 403
    notify.error(forbidden ? "Bạn không có quyền làm thao tác này." : serverMessage(error instanceof Error ? error.message : String(error)))
    return undefined
  } finally {
    busy = false
  }
}

/** "Đang tải…" / the load error, or "" once data is there (the caller renders it). */
export function entryStateHtml(entry: CacheEntry<unknown>): string {
  if (entry.data !== undefined) return ""
  if (entry.error) return `<div class="card"><div class="mini" style="color:var(--danger,#c0392b)">Không tải được dữ liệu: ${esc(entry.error)}</div></div>`
  return '<div class="card"><div class="mini">Đang tải…</div></div>'
}
