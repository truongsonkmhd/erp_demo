export interface CustomerCare {
  id: string
  projectId: string
  customerName: string
  careProgress: string
  careProgressNote: string
  hasIssue: boolean
  issueNote: string
  createdAt: string
  updatedAt: string
}

export type CustomerCareInput = Pick<
  CustomerCare,
  "careProgress" | "careProgressNote" | "hasIssue" | "issueNote"
>
