/** Simple browser persistence used after Firebase was removed. */

export function readStore<T>(key: string, fallback: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

export function newLocalId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function removeUndefinedValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeUndefinedValues) as T
  }
  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, removeUndefinedValues(entry)]),
    ) as T
  }
  return value
}
