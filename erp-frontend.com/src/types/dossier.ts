export const DOSSIER_TYPES = [
  "Kế hoạch",
  "Dự toán",
  "Đề nghị mua sắm",
  "Đề nghị thanh toán",
  "Hợp đồng",
  "Nghiệm thu",
  "Nghỉ phép",
  "Điều động thiết bị",
  "Điều động phương tiện",
  "Hồ sơ nội bộ khác",
] as const

export type DossierType = (typeof DOSSIER_TYPES)[number]

export const DOSSIER_STATUSES = [
  "Dự thảo",
  "Chờ Trưởng đơn vị duyệt",
  "Chờ Phòng chuyên môn duyệt",
  "Chờ Lãnh đạo phê duyệt",
  "Yêu cầu bổ sung",
  "Đã phê duyệt",
  "Bị từ chối",
] as const

export type DossierStatus = (typeof DOSSIER_STATUSES)[number]

export interface DossierAttachment {
  id: string
  name: string
  size: number
  url: string
  uploadedAt: string
}

export interface DossierProcessLog {
  id: string
  action: string
  actor: string
  role: string
  timestamp: string
  note?: string
  previousStatus?: string
  nextStatus?: string
  dossierId?: string
  dossierCode?: string
  dossierName?: string
}

export interface DossierWorkflowStep {
  stepNumber: number
  stepName: string
  roleName: string
  assigneeName: string
  status: "completed" | "current" | "pending"
}

export interface Dossier {
  id: string
  code: string // Mã hồ sơ, e.g. "HS-2026-001"
  name: string // Tên hồ sơ
  dossierType: DossierType
  department: string // Đơn vị lập
  creatorName: string // Người lập
  createdDate: string
  currentHandler: string // Người đang xử lý
  currentStep: string // Bước phê duyệt hiện tại
  status: DossierStatus
  dueDate: string // Hạn xử lý
  summary: string // Nội dung đề xuất / Mô tả
  attachments: DossierAttachment[]
  workflowSteps: DossierWorkflowStep[]
  processHistory: DossierProcessLog[]
  createdAt: string
  updatedAt: string
}

export type DossierInput = Omit<
  Dossier,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "status"
  | "currentStep"
  | "currentHandler"
  | "workflowSteps"
  | "processHistory"
> & {
  status?: DossierStatus
}
