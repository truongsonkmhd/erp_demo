export type Repo<T> = {
  subscribe(cb: (items: T[]) => void, onError: (e: unknown) => void): () => void
  save(item: T): Promise<void>
  replaceAll(items: T[]): Promise<void>
  isEmpty(): Promise<boolean>
}

export type SyncedCollection<T extends { id: string }> = ReturnType<typeof createSyncedCollection<T>>

/**
 * In-memory view of one shared collection. Reads come from the primary repo (Firestore);
 * any primary failure switches it to the fallback repo (localStorage) for the session.
 * With sharedSeed the collection also belongs to other screens: seeding only adds missing seed ids and
 * reset() rewrites the seed records without deleting anything else.
 * Until the first snapshot arrives, items() serves the seed (unless seedUntilLoaded is false) so
 * synchronous renderers never see an empty page. onSaved runs after a user save succeeds (not for seeding).
 */
export function createSyncedCollection<T extends { id: string }>(
  name: string,
  primary: Repo<T>,
  fallback: Repo<T>,
  seed: () => T[],
  {
    saveTimeoutMs = 8000,
    seedUntilLoaded = true,
    sharedSeed = false,
    onSaved,
  }: { saveTimeoutMs?: number; seedUntilLoaded?: boolean; sharedSeed?: boolean; onSaved?: (rows: T[]) => void } = {},
) {
  let items: T[] | null = null
  let mode: "online" | "offline" = "online"
  let unsubscribe: () => void = () => {}
  const listeners = new Set<() => void>()

  const emit = () => listeners.forEach((fn) => fn())
  const repo = () => (mode === "online" ? primary : fallback)
  const current = () => items ?? (seedUntilLoaded ? (items = seed()) : [])

  async function connect(source: Repo<T>, onError: (e: unknown) => void) {
    if (!sharedSeed && (await source.isEmpty())) await source.replaceAll(seed())
    let topUp = sharedSeed
    unsubscribe = source.subscribe((rows) => {
      items = rows
      emit()
      if (topUp) {
        topUp = false
        const have = new Set(rows.map((r) => r.id))
        const missing = seed().filter((r) => !have.has(r.id))
        if (missing.length) void write(missing).catch((e) => console.warn(`[${name}] Bổ sung seed lỗi:`, e))
      }
    }, onError)
  }

  async function goOffline(error: unknown) {
    if (mode === "offline") return
    console.warn(`[${name}] Firestore không khả dụng, chuyển sang LocalStorage:`, error)
    unsubscribe()
    mode = "offline"
    await connect(fallback, (e) => console.warn(`[${name}] LocalStorage lỗi:`, e))
    emit()
  }

  /** Firestore writes wait for the server while offline; treat a long wait as going offline. */
  function saveWithTimeout(target: Repo<T>, item: T): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Lưu quá thời gian chờ")), saveTimeoutMs)
    })
    return Promise.race([target.save(item), timeout]).finally(() => clearTimeout(timer))
  }

  /** Optimistic: the change is visible immediately, then written to the active repo. */
  async function write(changed: T[]) {
    const ids = new Set(changed.map((x) => x.id))
    items = [...current().filter((x) => !ids.has(x.id)), ...changed]
    emit()
    try {
      for (const item of changed) await saveWithTimeout(repo(), item)
    } catch (error) {
      if (mode === "offline") throw error
      await goOffline(error)
      for (const item of changed) await fallback.save(item)
    }
  }

  async function saveMany(changed: T[]) {
    await write(changed)
    onSaved?.(changed)
  }

  return {
    async start(): Promise<() => void> {
      try {
        await connect(primary, (e) => void goOffline(e))
      } catch (error) {
        await goOffline(error)
      }
      return () => unsubscribe()
    },
    items: current,
    mode: () => mode,
    onChange(fn: () => void): () => void {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    saveMany,
    save: (item: T) => saveMany([item]),
    async reset(): Promise<void> {
      if (sharedSeed) await write(seed())
      else await repo().replaceAll(seed())
    },
  }
}
