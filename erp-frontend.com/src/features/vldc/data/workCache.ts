import type { ChangeFeed } from "./realtime.ts"

/**
 * What a page shows from the action APIs, kept between renders: pages render synchronously from it ("Đang tải…" until
 * the first answer) and it reloads in the background when the backend reports a change on one of the entry's topics.
 * Stale data stays on screen while it reloads, so the page does not flicker.
 */
export type CacheEntry<T> = { data?: T; error?: string; loading: boolean }

type Slot = { entry: CacheEntry<unknown>; load: () => Promise<unknown>; topics: string[]; stale: boolean; seq: number }

export function createWorkCache({ feed, onUpdate }: { feed: ChangeFeed; onUpdate: (key: string) => void }) {
  const slots = new Map<string, Slot>()
  const watching = new Set<string>()

  function fetch(key: string, slot: Slot) {
    const seq = ++slot.seq
    slot.stale = false
    slot.entry = { ...slot.entry, loading: true }
    slot.load().then(
      (data) => { if (slots.get(key) === slot && slot.seq === seq) { slot.entry = { data, loading: false }; onUpdate(key) } },
      (error: unknown) => {
        if (slots.get(key) !== slot || slot.seq !== seq) return
        slot.entry = { data: slot.entry.data, error: error instanceof Error ? error.message : String(error), loading: false }
        onUpdate(key)
      },
    )
  }

  function watch(topic: string) {
    if (watching.has(topic)) return
    watching.add(topic)
    feed.watch(topic, () => {
      for (const [key, slot] of slots) {
        if (!slot.topics.includes(topic)) continue
        slot.stale = true
        onUpdate(key)
      }
    })
  }

  return {
    /** The entry for key, loading it on first use or after a change; topics: realtime topics that make it stale. */
    get<T>(key: string, load: () => Promise<T>, topics: string[] = []): CacheEntry<T> {
      topics.forEach(watch)
      let slot = slots.get(key)
      if (!slot) {
        slot = { entry: { loading: false }, load, topics, stale: true, seq: 0 }
        slots.set(key, slot)
      }
      slot.load = load
      if (slot.stale && !slot.entry.loading) fetch(key, slot)
      return slot.entry as CacheEntry<T>
    },
    /** Marks entries whose key starts with prefix as stale (all when empty); they reload on their next get. */
    invalidate(prefix = "") {
      for (const [key, slot] of slots) if (key.startsWith(prefix)) slot.stale = true
    },
    /** Forgets everything (after logout / role switch). */
    clear() {
      slots.clear()
    },
  }
}

export type WorkCache = ReturnType<typeof createWorkCache>
