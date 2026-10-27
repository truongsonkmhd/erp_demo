import { localRepo } from "../data/repos"
import { apiRepoFor } from "../data/registry"
import { auditEvent } from "../data/audit"
import type { WorkItem } from "./types"
import { createWorkflowStore } from "./store"

/**
 * Work items (việc, nhiệm vụ, hồ sơ thanh toán) on the backend API /api/vldc/work_items, off Firebase: no sample data,
 * and a local copy of its own while the API cannot be reached.
 */
export const workflowStore = createWorkflowStore(
  apiRepoFor<WorkItem>("work_items"),
  localRepo<WorkItem>("vldc_work_items_api_v1"),
  () => [],
  // Each saved item carries the step just taken as its last history entry.
  { onSaved: (items) => items.forEach((item) => auditEvent("work_items", item, item.history.at(-1)?.action)) },
)
