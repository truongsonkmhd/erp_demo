export const COMPANY_DOCUMENT_CATEGORIES = [
  "Hợp đồng",
  "Quy chế / Nội quy",
  "Biểu mẫu",
  "Báo cáo",
  "Nhân sự",
  "Tài chính / Kế toán",
  "Chứng từ vận tải",
  "Khác",
] as const

export type CompanyDocumentCategory = (typeof COMPANY_DOCUMENT_CATEGORIES)[number]

export interface CompanyDocument {
  id: string
  name: string
  category: string
  department: string
  description: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export type CompanyDocumentInput = Omit<CompanyDocument, "id" | "createdAt" | "updatedAt">
