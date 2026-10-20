export type PurchaseRequestStatus =
  | "draft"                 // Nháp
  | "pending_dept"           // Chờ trưởng đơn vị
  | "pending_planning"       // Chờ kiểm tra kế hoạch/dự toán
  | "pending_leader"         // Chờ lãnh đạo duyệt
  | "approved"               // Đã duyệt
  | "ordered"                // Đã chuyển mua sắm
  | "rejected"               // Từ chối
  | "revision_required"      // Yêu cầu bổ sung
  | "cancelled"              // Hủy

export type SupplierStatus =
  | "active"       // Đang hợp tác
  | "paused"       // Tạm ngừng
  | "terminated"   // Ngừng hợp tác
  | "restricted"   // Hạn chế lựa chọn

export type ContractStatus =
  | "draft"        // Dự thảo
  | "pending_sign" // Chờ ký
  | "active"       // Đang thực hiện
  | "completed"    // Hoàn thành
  | "liquidated"   // Thanh lý
  | "suspended"    // Tạm dừng
  | "overdue"      // Quá hạn
  | "cancelled"    // Hủy

export interface PurchaseRequestLine {
  id: string
  itemCode: string
  itemName: string
  itemGroup: string
  specification: string
  unit: string
  availableStock: number
  quantity: number
  estimatedUnitPrice: number
  totalPrice: number
  note?: string
}

export interface ApprovalHistoryEntry {
  id: string
  stepName: string
  actorName: string
  actorRole: string
  action: "create" | "submit" | "approve" | "request_revision" | "reject" | "cancel" | "transfer_order"
  actionName: string
  comment?: string
  timestamp: string
  previousStatus?: PurchaseRequestStatus
  newStatus?: PurchaseRequestStatus
}

export interface AttachmentMetadata {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

export interface PurchaseRequest {
  id: string
  code: string // DXMS-YYYY-NNNN
  requestDate: string
  department: string
  requesterName: string
  projectName: string
  projectItem?: string
  planReference?: string
  budgetSource: string
  requiredDate: string
  reason: string
  status: PurchaseRequestStatus
  totalAmount: number
  lines: PurchaseRequestLine[]
  attachments: AttachmentMetadata[]
  approvalHistory: ApprovalHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  code: string // NCC-NNNN
  name: string
  taxCode: string
  address: string
  contactPerson: string
  phone: string
  email: string
  bankAccount?: string
  bankName?: string
  supplyCategories: string[]
  status: SupplierStatus
  rating: number // 1 - 5 sao
  contractCount: number
  totalTransactionValue: number
  legalProfileSummary?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseContractLine {
  id: string
  itemCode: string
  itemName: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  deliveredQuantity: number
  remainingQuantity: number
}

export interface PurchaseContract {
  id: string
  contractNumber: string // HDMS-YYYY-NNNN
  contractName: string
  requestId: string
  requestCode: string
  supplierId: string
  supplierName: string
  supplierTaxCode: string
  signDate: string
  effectiveDate: string
  expiryDate: string
  preTaxAmount: number
  taxAmount: number
  totalAmount: number
  paymentTerms: string
  status: ContractStatus
  lines: PurchaseContractLine[]
  paidAmount: number
  remainingAmount: number
  deliveredPercent: number
  hasAdjustment: boolean
  attachments: AttachmentMetadata[]
  createdAt: string
  updatedAt: string
}
