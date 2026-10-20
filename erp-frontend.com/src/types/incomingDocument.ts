export const INCOMING_DOCUMENT_TYPES = [
  "Công văn",
  "Quyết định",
  "Tờ trình",
  "Thông báo",
  "Kế hoạch",
  "Báo cáo",
  "Khác",
] as const

export type IncomingDocumentType = (typeof INCOMING_DOCUMENT_TYPES)[number]

export const INCOMING_DOCUMENT_STATUSES = [
  "Mới tiếp nhận",
  "Đã tiếp nhận",
  "Đã phân công",
  "Đang xử lý",
  "Hoàn thành",
] as const

export type IncomingDocumentStatus = (typeof INCOMING_DOCUMENT_STATUSES)[number]

export const URGENCY_LEVELS = ["Bình thường", "Khẩn", "Thượng khẩn", "Hỏa tốc"] as const
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]

export interface IncomingDocumentAttachment {
  id: string
  name: string
  size: number
  url: string
  uploadedAt: string
}

export interface IncomingDocumentProcessLog {
  id: string
  action: string
  actor: string
  role: string
  timestamp: string
  note?: string
}

export interface IncomingDocument {
  id: string
  documentNumber: string
  releaseDate: string
  receivedDate: string
  summary: string
  senderUnit: string
  documentType: IncomingDocumentType
  urgency: UrgencyLevel
  status: IncomingDocumentStatus
  assignedToUnit?: string
  assignedToUser?: string
  coordinatingUnits?: string[]
  dueDate?: string
  instruction?: string
  attachments: IncomingDocumentAttachment[]
  processHistory: IncomingDocumentProcessLog[]
  createdAt: string
  updatedAt: string
}

export type IncomingDocumentInput = Omit<
  IncomingDocument,
  "id" | "createdAt" | "updatedAt" | "status" | "processHistory"
> & {
  status?: IncomingDocumentStatus
}
