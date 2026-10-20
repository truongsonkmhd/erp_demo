import { useCallback, useEffect, useState } from "react"

import { getCompanyDocuments } from "@/services/CompanyDocumentService"
import { CompanyDocument } from "@/types/companyDocument"

export function useCompanyDocuments() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setIsLoading(true)
    try {
      setDocuments(await getCompanyDocuments())
    } finally {
      if (!options?.silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { documents, isLoading, refetch }
}
