export type Work = {
  id: string
  title: string
  description: string
  status: "todo" | "in_progress" | "review" | "completed"
  priority: "high" | "medium" | "low"
  projectId: string
  projectName: string
  assignee: string
  dueDate: string
  createdDate: string
  tags: string[]
  completed: boolean
}