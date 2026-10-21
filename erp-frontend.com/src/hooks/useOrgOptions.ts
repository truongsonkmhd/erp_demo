import { useEffect, useState } from "react"

import { getDepartments } from "@/services/DepartmentService"
import { getEmployees } from "@/services/EmployeeService"

/**
 * Option lists for unit / person pickers: backend departments and users first, then the page's
 * built-in names (kept so seeded demo records still match). Without read access the built-ins remain.
 */

let departmentNames: Promise<string[]> | undefined
let peopleNames: Promise<string[]> | undefined

const loadDepartments = () =>
  (departmentNames ??= getDepartments().then((ds) => (ds || []).map((d) => d.name)).catch(() => []))
const loadPeople = () =>
  (peopleNames ??= getEmployees().then((us) => us.filter((u) => u.active !== false).map((u) => u.fullName).filter(Boolean)).catch(() => []))

const merge = (first: string[], rest: readonly string[]) => [...new Set([...first, ...rest])]

function useMerged(load: () => Promise<string[]>, fallback: readonly string[]): string[] {
  const [names, setNames] = useState<string[]>([...fallback])
  useEffect(() => {
    let alive = true
    void load().then((loaded) => {
      if (alive && loaded.length) setNames(merge(loaded, fallback))
    })
    return () => {
      alive = false
    }
  }, [load, fallback])
  return names
}

export const useDepartmentOptions = (fallback: readonly string[]) => useMerged(loadDepartments, fallback)
export const usePeopleOptions = (fallback: readonly string[]) => useMerged(loadPeople, fallback)
