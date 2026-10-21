import { firestoreRepo, localRepo } from "./repos"
import { createSyncedCollection, type SyncedCollection } from "./syncedCollection"
import { DATASETS, storageOf, type DatasetKey, type Row } from "./datasets"
import { localToday } from "./dates"
import { auditEvent, setAuditSink, type AuditEvent } from "./audit"

type Collections = { [K in DatasetKey]: SyncedCollection<Row<K>> }

const collections = Object.fromEntries(
  (Object.keys(DATASETS) as DatasetKey[]).map((key) => {
    const seed = () => (DATASETS[key].seed as (today: string) => { id: string }[])(localToday())
    const store = storageOf(key)
    // Every user save is audited, except the audit trail itself.
    const onSaved = key === "auditEvents" ? undefined : (rows: { id: string }[]) => rows.forEach((row) => auditEvent(store.firestore, row))
    return [key, createSyncedCollection(key, firestoreRepo(store.firestore), localRepo(store.local), seed, { sharedSeed: store.shared, onSaved })]
  }),
) as unknown as Collections

setAuditSink((event: AuditEvent) => void collections.auditEvents.save(event).catch((e) => console.warn("[audit] Ghi log lỗi:", e)))

let started: Promise<unknown> | undefined

/** Synchronous, always-populated accessors for the legacy engine, plus lifecycle for the page host. */
export const vldcData = {
  get<K extends DatasetKey>(key: K): Row<K>[] {
    return collections[key].items() as Row<K>[]
  },
  save<K extends DatasetKey>(key: K, row: Row<K>): Promise<void> {
    return (collections[key] as SyncedCollection<Row<K>>).save(row)
  },
  startAll(): Promise<unknown> {
    return (started ??= Promise.all(Object.values(collections).map((c) => c.start())))
  },
  /** Fires with the changed dataset's key. */
  onAnyChange(fn: (key: DatasetKey) => void): () => void {
    const offs = (Object.keys(collections) as DatasetKey[]).map((key) => collections[key].onChange(() => fn(key)))
    return () => offs.forEach((off) => off())
  },
  offline(): boolean {
    return Object.values(collections).some((c) => c.mode() === "offline")
  },
  resetAll(): Promise<unknown> {
    return Promise.all(Object.values(collections).map((c) => c.reset()))
  },
}
