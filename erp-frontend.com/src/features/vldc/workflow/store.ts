import type { WorkItem } from "./types.ts"
import { allowedActions, applyAction, blockedReason, type ActionInput, type WorkAction } from "./rules.ts"
import { createSyncedCollection, type Repo } from "../data/syncedCollection.ts"

export type WorkItemRepo = Repo<WorkItem>

export type WorkflowStore = ReturnType<typeof createWorkflowStore>

/** Shared work items on top of a synced collection, plus the workflow rules for changing them. */
export function createWorkflowStore(
  primary: WorkItemRepo,
  fallback: WorkItemRepo,
  seed: () => WorkItem[],
  { saveTimeoutMs = 8000, onSaved }: { saveTimeoutMs?: number; onSaved?: (items: WorkItem[]) => void } = {},
) {
  const col = createSyncedCollection("Workflow", primary, fallback, seed, { saveTimeoutMs, seedUntilLoaded: false, onSaved })
  return {
    start: col.start,
    items: col.items,
    mode: col.mode,
    onChange: col.onChange,
    async dispatch(id: string, action: WorkAction, input: ActionInput, role: string, perms: string[]): Promise<void> {
      const items = col.items()
      const item = items.find((x) => x.id === id)
      if (!item) throw new Error(`Không tìm thấy ${id}`)
      if (!allowedActions(item, role, perms, items).includes(action)) {
        throw new Error((action === "submit" && blockedReason(item, role, items)) || "Bạn không có quyền thực hiện thao tác này hoặc trạng thái đã thay đổi")
      }
      const result = applyAction(item, action, input, role, new Date().toISOString(), items)
      await col.saveMany(result.created ? [result.item, result.created] : [result.item])
    },
    add: col.save,
    reset: col.reset,
  }
}
