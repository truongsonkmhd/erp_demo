import { getStoredUser } from "@/services/auth/tokenStorage"
import { escapeHtml as esc } from "../workflow/html"
import { changeFeed } from "./registry"
import { createWorkCache, type CacheEntry } from "./workCache"

/**
 * The shared cache of the Nhiệm vụ / Dự án and Công việc pages (on the action APIs) and how their buttons call the
 * server: wait for the answer, show the server's message on failure, reload what changed.
 */

const listeners = new Set<(key: string) => void>()

export const workCache = createWorkCache({ feed: changeFeed, onUpdate: (key) => listeners.forEach((fn) => fn(key)) })

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
 * Runs a button's server call: one at a time, the server's message on failure (nothing is changed then), and on
 * success every cached entry reloads before then() navigates or re-renders.
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
    alert(forbidden ? "Bạn không có quyền làm thao tác này." : error instanceof Error ? error.message : String(error))
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
