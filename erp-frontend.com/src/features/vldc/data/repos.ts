import { collection, doc, getDocs, onSnapshot, writeBatch, setDoc } from "firebase/firestore"
import { db } from "@/config/firebaseConnect"
import { readStore, removeUndefinedValues, writeStore } from "@/lib/localStore"
import type { Repo } from "./syncedCollection"

const FIRST_SNAPSHOT_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label}: quá ${FIRST_SNAPSHOT_TIMEOUT_MS / 1000}s`)), FIRST_SNAPSHOT_TIMEOUT_MS)),
  ])
}

export function firestoreRepo<T extends { id: string }>(name: string): Repo<T> {
  const ref = collection(db, name)
  return {
    async isEmpty() {
      const snap = await withTimeout(getDocs(ref), "Firestore")
      return snap.empty
    },
    async save(item) {
      await setDoc(doc(db, name, item.id), removeUndefinedValues(item))
    },
    async replaceAll(items) {
      const existing = await withTimeout(getDocs(ref), "Firestore")
      const batch = writeBatch(db)
      existing.forEach((snap) => batch.delete(snap.ref))
      items.forEach((item) => batch.set(doc(db, name, item.id), removeUndefinedValues(item)))
      await withTimeout(batch.commit(), "Firestore")
    },
    subscribe(cb, onError) {
      let received = false
      const timer = setTimeout(() => {
        if (!received) onError(new Error("Firestore không phản hồi"))
      }, FIRST_SNAPSHOT_TIMEOUT_MS)
      const stop = onSnapshot(
        ref,
        (snap) => {
          received = true
          cb(snap.docs.map((d) => d.data() as T))
        },
        (error) => onError(error),
      )
      return () => {
        clearTimeout(timer)
        stop()
      }
    },
  }
}

/** Browser-only fallback; other tabs of the same browser stay in sync through the storage event. */
export function localRepo<T extends { id: string }>(key: string): Repo<T> {
  let notify: ((items: T[]) => void) | null = null
  const read = () => readStore<T>(key, [])
  const write = (items: T[]) => {
    writeStore(key, items)
    notify?.(items)
  }
  return {
    async isEmpty() {
      return read().length === 0
    },
    async save(item) {
      write([...read().filter((x) => x.id !== item.id), item])
    },
    async replaceAll(items) {
      write(items)
    },
    subscribe(cb) {
      notify = cb
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) cb(read())
      }
      window.addEventListener("storage", onStorage)
      cb(read())
      return () => {
        notify = null
        window.removeEventListener("storage", onStorage)
      }
    },
  }
}
