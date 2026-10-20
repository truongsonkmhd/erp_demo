import { useCallback, useState } from "react"

import { DisbursementPlanOnlyProject } from "@/types/disbursement"

export function useDisbursementPlanOnlyProject() {
  const [plans, setPlans] = useState<DisbursementPlanOnlyProject[]>([])
  const [isLoading] = useState(false)

  const add = useCallback(async (plan: Omit<DisbursementPlanOnlyProject, "id">) => {
    setPlans((prev) => [...prev, { ...plan, id: `plan-${Date.now()}` }])
  }, [])

  const update = useCallback(async (id: string, plan: DisbursementPlanOnlyProject) => {
    setPlans((prev) => prev.map((item) => (item.id === id ? plan : item)))
  }, [])

  return { plans, add, update, isLoading }
}
