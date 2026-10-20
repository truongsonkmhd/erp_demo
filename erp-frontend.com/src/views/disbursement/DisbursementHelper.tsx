import { DisbursementPlanOnlyProject, DisbursementRequest } from "@/types/disbursement"

export function PlanCard(_props: {
  isTask?: boolean
  plan: DisbursementPlanOnlyProject
  actualByPeriod: Record<string, number>
  budget?: number
  onUpdatePlan: (plan: DisbursementPlanOnlyProject) => void | Promise<void>
}) {
  return <p className="text-sm text-muted-foreground">Chưa có kế hoạch giải ngân.</p>
}

export function ListTable(_props: {
  rows: DisbursementRequest[]
  onUpdate: (row: DisbursementRequest) => void
  onDelete: (id: string) => void
}) {
  return <p className="text-sm text-muted-foreground">Chưa có đề nghị giải ngân.</p>
}
