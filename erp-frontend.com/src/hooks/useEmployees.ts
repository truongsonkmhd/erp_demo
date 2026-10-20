import { useCallback, useEffect, useState } from "react"

import { getEmployees } from "@/services/EmployeeService"
import { EmployeeAccount } from "@/types/auth"

export function useEmployees(enabled = true) {
  const [employees, setEmployees] = useState<EmployeeAccount[]>([])
  const [isLoading, setIsLoading] = useState(enabled)

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    try {
      setEmployees(await getEmployees())
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) void refetch()
    else setIsLoading(false)
  }, [enabled, refetch])

  return { employees, isLoading, refetch }
}
