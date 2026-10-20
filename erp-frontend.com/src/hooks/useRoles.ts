import { useCallback, useEffect, useState } from "react"

import { getRoles } from "@/services/RoleService"
import { RoleDefinition } from "@/types/auth"

export function useRoles() {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    try {
      setRoles(await getRoles())
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { roles, isLoading, refetch }
}
