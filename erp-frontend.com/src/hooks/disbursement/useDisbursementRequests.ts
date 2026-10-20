import { useCallback, useState } from "react"

import { DisbursementRequest } from "@/types/disbursement"

export function useDisbursementRequests() {
  const [requests, setRequests] = useState<DisbursementRequest[]>([])
  const [isLoading] = useState(false)

  const update = useCallback(async (id: string, patch: DisbursementRequest) => {
    setRequests((prev) => prev.map((item) => (item.id === id ? patch : item)))
  }, [])

  const remove = useCallback(async (id: string) => {
    setRequests((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return { requests, update, remove, isLoading }
}
