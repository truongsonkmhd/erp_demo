import { firestoreRepo, localRepo } from "../data/repos"
import { auditEvent } from "../data/audit"
import type { WorkItem } from "./types"
import { buildSeed } from "./seed"
import { createWorkflowStore } from "./store"

const localToday = () => new Date().toLocaleDateString("sv-SE")

export const workflowStore = createWorkflowStore(
  firestoreRepo<WorkItem>("vldc_work_items"),
  localRepo<WorkItem>("vldc_work_items_v1"),
  () => buildSeed(localToday()),
  // Each saved item carries the step just taken as its last history entry.
  { onSaved: (items) => items.forEach((item) => auditEvent("work_items", item, item.history.at(-1)?.action)) },
)
