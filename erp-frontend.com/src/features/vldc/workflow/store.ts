import type { WorkItem } from "./types.ts"
import { allowedActions, applyAction, blockedReason, type ActionInput, type WorkAction } from "./rules.ts"

export type WorkItemRepo = {
  subscribe(cb: (items: WorkItem[]) => void, onError: (e: unknown) => void): () => void
  save(item: WorkItem): Promise<void>
  replaceAll(items: WorkItem[]): Promise<void>
  isEmpty(): Promise<boolean>
}

export type WorkflowStore = ReturnType<typeof createWorkflowStore>

/**
 * In-memory view of the shared work items. Reads come from the primary repo (Firestore);
 * any primary failure switches the store to the fallback repo (localStorage) for the session.
 */
export function createWorkflowStore(
  primary: WorkItemRepo,
  fallback: WorkItemRepo,
  seed: () => WorkItem[],
  { saveTimeoutMs = 8000 }: { saveTimeoutMs?: number } = {},
) {
  let items: WorkItem[] = []
  let mode: "online" | "offline" = "online"
  let unsubscribe: () => void = () => {}
  const listeners = new Set<() => void>()

  const emit = () => listeners.forEach((fn) => fn())
  const repo = () => (mode === "online" ? primary : fallback)

  async function connect(source: WorkItemRepo, onError: (e: unknown) => void) {
    if (await source.isEmpty()) await source.replaceAll(seed())
    unsubscribe = source.subscribe((rows) => {
      items = rows
      emit()
    }, onError)
  }

  async function goOffline(error: unknown) {
    if (mode === "offline") return
    console.warn("[Workflow] Firestore không khả dụng, chuyển sang LocalStorage:", error)
    unsubscribe()
    mode = "offline"
    await connect(fallback, (e) => console.warn("[Workflow] LocalStorage lỗi:", e))
    emit()
  }

  function upsert(item: WorkItem) {
    items = [...items.filter((x) => x.id !== item.id), item]
  }

  /** Firestore writes wait for the server while offline; treat a long wait as going offline. */
  function saveWithTimeout(target: WorkItemRepo, item: WorkItem): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Lưu quá thời gian chờ")), saveTimeoutMs)
    })
    return Promise.race([target.save(item), timeout]).finally(() => clearTimeout(timer))
  }

  async function persist(changed: WorkItem[]) {
    changed.forEach(upsert)
    emit()
    try {
      for (const item of changed) await saveWithTimeout(repo(), item)
    } catch (error) {
      if (mode === "offline") throw error
      await goOffline(error)
      for (const item of changed) await fallback.save(item)
    }
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
    items: () => items,
    mode: () => mode,
    onChange(fn: () => void): () => void {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    async dispatch(id: string, action: WorkAction, input: ActionInput, role: string, perms: string[]): Promise<void> {
      const item = items.find((x) => x.id === id)
      if (!item) throw new Error(`Không tìm thấy ${id}`)
      if (!allowedActions(item, role, perms, items).includes(action)) {
        throw new Error((action === "submit" && blockedReason(item, role, items)) || "Bạn không có quyền thực hiện thao tác này hoặc trạng thái đã thay đổi")
      }
      const result = applyAction(item, action, input, role, new Date().toISOString(), items)
      await persist(result.created ? [result.item, result.created] : [result.item])
    },
    async add(item: WorkItem): Promise<void> {
      await persist([item])
    },
    async reset(): Promise<void> {
      await repo().replaceAll(seed())
    },
  }
}
