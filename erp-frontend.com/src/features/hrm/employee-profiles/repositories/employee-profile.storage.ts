import type { EmployeeProfile } from "../types/employee-profile.types.ts"

export const HRM_PROFILES_STORAGE_KEY = "erp:hrm:employee-profiles:v1"

// Fallback in-memory storage if localStorage is not accessible
class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

const defaultMemoryStorage = new MemoryStorage()

function getSafeStorage(customStorage?: Storage): Storage {
  if (customStorage) return customStorage
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage
    }
  } catch {
    // LocalStorage might be disabled or restricted in sandboxed iframes
  }
  return defaultMemoryStorage
}

export class EmployeeProfileRepository {
  private storage: Storage

  constructor(storage?: Storage) {
    this.storage = getSafeStorage(storage)
  }

  getAll(): EmployeeProfile[] {
    try {
      const raw = this.storage.getItem(HRM_PROFILES_STORAGE_KEY)
      if (!raw) return []

      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      // Validate schema of items: must have non-empty userId and employeeCode
      return parsed.filter((item): item is EmployeeProfile => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as Partial<EmployeeProfile>).userId === "string" &&
          Boolean((item as Partial<EmployeeProfile>).userId) &&
          typeof (item as Partial<EmployeeProfile>).employeeCode === "string" &&
          Boolean((item as Partial<EmployeeProfile>).employeeCode)
        )
      })
    } catch {
      // Corrupted JSON or unexpected error: recover safely with empty list
      return []
    }
  }

  getByUserId(userId: string): EmployeeProfile | null {
    const all = this.getAll()
    return all.find((p) => p.userId === userId) ?? null
  }

  save(profile: EmployeeProfile): void {
    try {
      const all = this.getAll()
      const index = all.findIndex((p) => p.userId === profile.userId)
      if (index >= 0) {
        all[index] = profile
      } else {
        all.push(profile)
      }
      this.storage.setItem(HRM_PROFILES_STORAGE_KEY, JSON.stringify(all))
    } catch {
      // Storage quota exceeded or permission denied: log warning without crashing
      console.warn("Could not save employee profile to local storage")
    }
  }

  remove(userId: string): void {
    try {
      const all = this.getAll()
      const filtered = all.filter((p) => p.userId !== userId)
      this.storage.setItem(HRM_PROFILES_STORAGE_KEY, JSON.stringify(filtered))
    } catch {
      console.warn("Could not remove employee profile from local storage")
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(HRM_PROFILES_STORAGE_KEY)
    } catch {
      // safe fallback
    }
  }
}

export const defaultEmployeeProfileRepository = new EmployeeProfileRepository()
