export const OUTGOING_DOCUMENT_TYPES = [
  "Công văn",
  "Quyết định",
  "Tờ trình",
  "Thông báo",
  "Kế hoạch",
  "Báo cáo",
  "Khác",
] as const

export type OutgoingDocumentType = (typeof OUTGOING_DOCUMENT_TYPES)[number]

export const OUTGOING_DOCUMENT_STATUSES = [
  "Dự thảo",
  "Chờ ký",
  "Đã ký",
  "Đã phát hành",
] as const

export type OutgoingDocumentStatus = (typeof OUTGOING_DOCUMENT_STATUSES)[number]

export const URGENCY_LEVELS = ["Bình thường", "Khẩn", "Thượng khẩn", "Hỏa tốc"] as const
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]

export interface OutgoingDocumentAttachment {
  id: string
  name: string
  size: number
  url: string
  uploadedAt: string
}

export interface OutgoingDocumentProcessLog {
  id: string
  action: string
  actor: string
  role: string
  timestamp: string
  note?: string
}

export interface OutgoingDocument {
  id: string
  documentNumber: string // e.g. "45/LĐVLĐC-KH" or "Dự thảo #12"
  officialNumber?: string // Số chính thức sau khi phát hành, e.g. "78/QĐ-LĐVLĐC"
  summary: string
  documentType: OutgoingDocumentType
  urgency: UrgencyLevel
  status: OutgoingDocumentStatus
  draftingUnit: string // Đơn vị soạn thảo
  drafterName: string // Người soạn thảo
  approverName: string // Người ký / phê duyệt (Lãnh đạo)
  recipients: string // Nơi nhận (Các đơn vị/cơ quan nhận)
  submittedDate?: string // Ngày trình ký
  signedDate?: string // Ngày ký
  issuedDate?: string // Ngày phát hành
  attachments: OutgoingDocumentAttachment[]
  processHistory: OutgoingDocumentProcessLog[]
  createdAt: string
  updatedAt: string
}

export type OutgoingDocumentInput = Omit<
  OutgoingDocument,
  "id" | "createdAt" | "updatedAt" | "status" | "processHistory"
> & {
  status?: OutgoingDocumentStatus
}
