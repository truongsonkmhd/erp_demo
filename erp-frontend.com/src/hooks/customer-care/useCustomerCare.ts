import { useCallback, useEffect, useState } from "react"

import { getCustomerCareRecords } from "@/services/CustomerCareService"
import { CustomerCare } from "@/types/customerCare"

export function useCustomerCare(projectId: string) {
  const [records, setRecords] = useState<CustomerCare[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    try {
      setRecords(projectId ? await getCustomerCareRecords(projectId) : [])
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => { void refetch() }, [refetch])

  return { records, isLoading, refetch }
}
