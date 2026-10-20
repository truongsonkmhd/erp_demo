import { useCallback, useEffect, useState } from "react"

import { getAllProjectSales } from "@/services/ProjectSaleService"
import { ProjectSale } from "@/types/projectSale"

export function useProjectSales() {
  const [projectSales, setProjectSales] = useState<ProjectSale[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    try {
      setProjectSales(await getAllProjectSales())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { projectSales, isLoading, refetch }
}
