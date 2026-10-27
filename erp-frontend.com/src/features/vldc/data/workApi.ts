import { apiRequest } from "@/lib/api"

/**
 * Nhiệm vụ / Dự án and Công việc on the backend action APIs (ProjectController, ProjectTaskController, MissionController,
 * MyWorkController, EquipmentController). The server checks every rule and returns what the viewer may do.
 */

export type Page<T> = { items: T[]; pageNo: number; pageSize: number; totalElements: number; totalPages: number }
export type PersonRef = { userId: number; fullName: string; roleCode: string | null; departmentCode: string | null }
export type DepartmentRef = { id: number; code: string; name: string }

export type ProjectStatus = "INITIATED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED"
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"
export type ProjectSummary = {
  code: string
  name: string
  leadDepartment: DepartmentRef | null
  status: ProjectStatus
  approvalStatus: ApprovalStatus
  progress: number
  endDate: string
  delayDays: number
  openTaskCount: number
  overdueTaskCount: number
  hasPendingDeleteRequest: boolean
}
export type ProjectPermissions = {
  canEdit: boolean
  canApprove: boolean
  canRequestDelete: boolean
  canCancelDelete: boolean
  canDecideDelete: boolean
  canCreateTask: boolean
}
export type ProjectDetail = ProjectSummary & {
  description: string | null
  manager: PersonRef | null
  coDepartments: DepartmentRef[]
  estimatedBudget: number
  startDate: string
  approvalNote: string | null
  approvedAt: string | null
  createdBy: PersonRef | null
  deleteRequest: { reason: string; requestedBy: PersonRef | null; requestedAt: string } | null
  lastDeleteRefusal: string | null
  permissions: ProjectPermissions
}
export type SaveProject = {
  code?: string
  name: string
  description?: string
  leadDepartmentId: number
  coDepartmentIds: number[]
  estimatedBudget: number
  startDate: string
  endDate: string
}

export type TaskStatus = "NEW" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
export type Complexity = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
export type TaskSummary = {
  code: string
  projectCode: string
  title: string
  status: TaskStatus
  progress: number
  complexity: Complexity
  dueDate: string
  overdue: boolean
  assignee: PersonRef | null
  department: DepartmentRef | null
}
export type Comment = { id: number; user: PersonRef | null; departmentName: string | null; content: string; createdAt: string }
/** ACCEPT, PROGRESS, SUBMIT, APPROVE, RETURN, COMMENT, MOVE, DELETE. */
export type TaskDetail = TaskSummary & {
  resultRequirement: string | null
  evidence: string | null
  assigner: PersonRef | null
  followers: PersonRef[]
  comments: Comment[]
  allowedActions: string[]
  atRisk: boolean
  completedAt: string | null
}
export type CreateTask = {
  code: string
  projectCode: string
  title: string
  resultRequirement?: string
  complexity: Complexity
  assigneeUserId: number
  followerUserIds: number[]
  dueDate: string
}
export type Progress = { progress: number; evidence?: string; note?: string }

export type MissionStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "REJECTED"
export type MissionSummary = {
  code: string
  title: string
  status: MissionStatus
  department: DepartmentRef | null
  proposer: PersonRef | null
  approver: PersonRef | null
  project: { code: string; name: string } | null
  dueDate: string
  overdue: boolean
  progress: number
}
export type Equipment = { id: number; code: string; name: string; departmentCode: string | null }
/** APPROVE, REJECT, EDIT, PROGRESS, COMPLETE, COMMENT, DELETE. */
export type MissionDetail = MissionSummary & {
  content: string | null
  equipmentIds: number[]
  equipment: Equipment[]
  followers: PersonRef[]
  evidence: string | null
  decisionNote: string | null
  decidedAt: string | null
  completedAt: string | null
  comments: Comment[]
  allowedActions: string[]
  atRisk: boolean
}
export type SaveMission = {
  code?: string
  title: string
  departmentId?: number | null
  projectCode?: string | null
  dueDate: string
  equipmentIds: number[]
  content?: string
  followerUserIds: number[]
}

/** A row of Công việc; reason says why it is there (null on the federation tab). */
export type MyWorkRow = {
  kind: "PROJECT_APPROVAL" | "PROJECT_DELETE" | "PROJECT_ASSIGN" | "PROJECT_TASK" | "MISSION"
  code: string
  title: string
  projectCode: string | null
  status: string
  dueDate: string | null
  overdue: boolean
  atRisk: boolean
  progress: number
  mine: boolean
  reason: string | null
  from: PersonRef | null
  owner: PersonRef | null
  department: DepartmentRef | null
  link: string
}
export type WorkFolder = {
  code: string
  name: string
  status: ProjectStatus
  approvalStatus: ApprovalStatus
  progress: number
  endDate: string
  overdue: boolean
  leadDepartment: DepartmentRef | null
}
export type WorkEntry = { kind: "PROJECT" | "MISSION"; project: WorkFolder | null; items: MyWorkRow[] }
export type MyWork = { counts: Record<string, number>; page: Page<WorkEntry> }

const enc = encodeURIComponent
/** "?a=1&b=x" from the set values. */
export function query(params: Record<string, string | number | null | undefined>): string {
  const parts = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}=${enc(String(v))}`)
  return parts.length ? `?${parts.join("&")}` : ""
}

const P = "/api/vldc/projects"
const T = "/api/vldc/project-tasks"
const M = "/api/vldc/missions"
const post = <R>(path: string, body: unknown = {}) => apiRequest<R>(path, { method: "POST", body })

export const projectsApi = {
  list: (q: { status?: string; keyword?: string; pageNo?: number; pageSize?: number }) => apiRequest<Page<ProjectSummary>>(`${P}${query(q)}`),
  detail: (code: string) => apiRequest<ProjectDetail>(`${P}/${enc(code)}`),
  create: (body: SaveProject) => post<ProjectDetail>(P, body),
  update: (code: string, body: SaveProject) => apiRequest<ProjectDetail>(`${P}/${enc(code)}`, { method: "PUT", body }),
  approve: (code: string) => post<ProjectDetail>(`${P}/${enc(code)}/approve`),
  reject: (code: string, note: string) => post<ProjectDetail>(`${P}/${enc(code)}/reject`, { note }),
  requestDelete: (code: string, reason: string) => post<ProjectDetail>(`${P}/${enc(code)}/delete-requests`, { reason }),
  cancelDelete: (code: string) => post<ProjectDetail>(`${P}/${enc(code)}/delete-requests/cancel`),
  approveDelete: (code: string) => post<unknown>(`${P}/${enc(code)}/delete-requests/approve`),
  rejectDelete: (code: string, note: string) => post<ProjectDetail>(`${P}/${enc(code)}/delete-requests/reject`, { note }),
  assignableUsers: (code: string, departmentId: number) => apiRequest<PersonRef[]>(`${P}/${enc(code)}/assignable-users${query({ departmentId })}`),
}

export const tasksApi = {
  list: (projectCode: string, q: { status?: string; keyword?: string; pageNo?: number; pageSize?: number } = {}) =>
    apiRequest<Page<TaskSummary>>(`${T}${query({ projectCode, ...q })}`),
  detail: (code: string) => apiRequest<TaskDetail>(`${T}/${enc(code)}`),
  create: (body: CreateTask) => post<TaskDetail>(T, body),
  accept: (code: string, note?: string) => post<TaskDetail>(`${T}/${enc(code)}/accept`, { note }),
  progress: (code: string, body: Progress) => post<TaskDetail>(`${T}/${enc(code)}/progress`, body),
  submit: (code: string, note?: string) => post<TaskDetail>(`${T}/${enc(code)}/submit`, { note }),
  approve: (code: string, note?: string) => post<TaskDetail>(`${T}/${enc(code)}/approve`, { note }),
  returnTask: (code: string, note: string) => post<TaskDetail>(`${T}/${enc(code)}/return`, { note }),
  move: (code: string, toStatus: TaskStatus) => post<TaskDetail>(`${T}/${enc(code)}/move`, { toStatus }),
  comment: (code: string, content: string) => post<TaskDetail>(`${T}/${enc(code)}/comments`, { content }),
  remove: (code: string) => apiRequest<unknown>(`${T}/${enc(code)}`, { method: "DELETE" }),
}

export const missionsApi = {
  list: (q: { status?: string; keyword?: string; pageNo?: number; pageSize?: number }) => apiRequest<Page<MissionSummary>>(`${M}${query(q)}`),
  detail: (code: string) => apiRequest<MissionDetail>(`${M}/${enc(code)}`),
  approver: () => apiRequest<PersonRef | null>(`${M}/approver`),
  create: (body: SaveMission) => post<MissionDetail>(M, body),
  update: (code: string, body: SaveMission) => apiRequest<MissionDetail>(`${M}/${enc(code)}`, { method: "PUT", body }),
  approve: (code: string, note?: string) => post<MissionDetail>(`${M}/${enc(code)}/approve`, { note }),
  reject: (code: string, note: string) => post<MissionDetail>(`${M}/${enc(code)}/reject`, { note }),
  progress: (code: string, body: Progress) => post<MissionDetail>(`${M}/${enc(code)}/progress`, body),
  complete: (code: string, note?: string) => post<MissionDetail>(`${M}/${enc(code)}/complete`, { note }),
  comment: (code: string, content: string) => post<MissionDetail>(`${M}/${enc(code)}/comments`, { content }),
  remove: (code: string) => apiRequest<unknown>(`${M}/${enc(code)}`, { method: "DELETE" }),
}

export const myWorkApi = {
  mine: (q: { filter?: string; keyword?: string; pageNo?: number; pageSize?: number }) => apiRequest<MyWork>(`/api/vldc/my-work${query(q)}`),
  federation: (q: { status?: string; departmentId?: number | null; keyword?: string; pageNo?: number; pageSize?: number }) =>
    apiRequest<MyWork>(`/api/vldc/my-work/federation${query(q)}`),
}

export const equipmentApi = {
  search: (keyword?: string) => apiRequest<Equipment[]>(`/api/vldc/equipment${query({ keyword })}`),
}

/** Realtime topics the backend publishes after each change (/topic/vldc/{topic}). */
export const WORK_TOPICS = { projects: "projects", tasks: "project-tasks", missions: "missions" } as const

export type OrgUnit = { id: number; code: string; name: string; parentId: number | null; parentCode: string | null }
export type OrgPerson = {
  id: number
  fullName: string
  roleCodes: string[]
  positionName: string | null
  positionLevel: number | null
  managesUnit: boolean | null
  orgUnitCode: string | null
  orgUnitName: string | null
}
/** Units (with their numeric ids, for the forms) and people of the organisation. */
export const orgApi = {
  directory: () => apiRequest<{ units: OrgUnit[]; people: OrgPerson[] }>("/api/org/directory"),
}
