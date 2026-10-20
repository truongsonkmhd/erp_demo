export type MaterialStatus = "active" | "inactive"

export interface Material {
  id: string
  code: string // Mã vật tư: VT-001, CB-002...
  name: string
  category: string // Nhóm: Thiết bị, Cáp đo & geophone, Hóa chất, Pin & Nguồn...
  specification: string // Quy cách / Thông số kỹ thuật
  unit: string // ĐVT: Bộ, Cuộn, Cái, Kg, Lít, Hộp...
  manageByBatch: boolean // Quản lý theo lô
  manageByExpiry: boolean // Quản lý theo hạn dùng
  defaultMinStock?: number // Định mức tồn tối thiểu mặc định
  defaultMaxStock?: number // Định mức tồn tối đa mặc định
  status: MaterialStatus
  description?: string
  createdAt: string
  updatedAt: string
}

export interface WarehouseLocation {
  id: string
  code: string // Vị trí: K1-A01, K2-B03...
  name: string
  capacity?: string
}

export interface Warehouse {
  id: string
  code: string // KHO-TONG, KHO-MAY-BAY...
  name: string
  managingDepartment: string // Đơn vị quản lý
  address: string
  managerName: string
  managerPhone: string
  locations: WarehouseLocation[]
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export type BatchStatus = "active" | "locked" | "expired"

export interface StockBatch {
  id: string
  batchNumber: string // Lô: LO-2026-01...
  materialId: string
  materialCode: string
  materialName: string
  warehouseId: string
  warehouseCode: string
  locationId?: string
  locationCode?: string
  sourceType: "contract" | "opening" | "transfer" | "other"
  sourceReferenceCode?: string // Mã HĐ hoặc phiếu nhập
  manufacturingDate?: string
  expiryDate?: string // YYYY-MM-DD
  initialQuantity: number
  unitPrice: number
  status: BatchStatus
  notes?: string
  createdAt: string
}

export type InventoryTransactionType =
  | "receipt" // Nhập mua sắm
  | "issue" // Xuất sử dụng nhiệm vụ
  | "transfer_in" // Nhập do điều chuyển
  | "transfer_out" // Xuất do điều chuyển
  | "adjust_increase" // Kiểm kê điều chỉnh tăng
  | "adjust_decrease" // Kiểm kê điều chỉnh giảm
  | "return" // Nhập hoàn trả từ nhiệm vụ

export interface InventoryTransaction {
  id: string
  transactionCode: string // GD-2026-0001
  type: InventoryTransactionType
  sourceDocumentType: "receipt" | "issue" | "transfer" | "adjustment" | "opening"
  sourceDocumentId: string
  sourceDocumentCode: string
  materialId: string
  materialCode: string
  materialName: string
  batchId?: string
  batchNumber?: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  locationCode?: string
  quantity: number // Luôn dương; type sẽ xác định tăng/giảm
  unitPrice: number
  totalAmount: number
  timestamp: string // ISO string
  postedBy: string // Người ghi sổ
  projectName?: string // Gắn nhiệm vụ/dự án nếu có
  projectItem?: string // Hạng mục nhiệm vụ
  notes?: string
}

// PRC-05: Nhập kho
export type GoodsReceiptStatus = "draft" | "pending_post" | "posted" | "rejected" | "cancelled"

export interface GoodsReceiptLine {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  orderedQuantity: number // Số lượng theo hợp đồng còn lại
  receivedQuantity: number // Số lượng thực tế nhập
  unitPrice: number
  totalAmount: number
  batchNumber: string
  manufacturingDate?: string
  expiryDate?: string
  locationCode?: string
  qualityStatus: "passed" | "rejected" | "pending"
  notes?: string
}

export interface GoodsReceipt {
  id: string
  code: string // PNK-2026-0001
  receiptDate: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  supplierId?: string
  supplierName?: string
  contractId?: string
  contractNumber?: string
  requestCode?: string
  delivererName: string // Người giao hàng
  delivererPhone?: string
  receiverName: string // Thủ kho nhận
  status: GoodsReceiptStatus
  lines: GoodsReceiptLine[]
  totalQuantity: number
  totalAmount: number
  notes?: string
  postedAt?: string
  postedBy?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

// PRC-06: Xuất kho
export type GoodsIssueStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "pending_issue"
  | "issued"
  | "revision_required"
  | "rejected"
  | "cancelled"

export interface GoodsIssueLine {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  requestedQuantity: number // Số lượng xin cấp
  approvedQuantity: number // Số lượng duyệt cấp
  actualQuantity: number // Số lượng thực xuất kho
  unitPrice: number
  totalAmount: number
  batchId?: string
  batchNumber?: string
  locationCode?: string
  notes?: string
}

export interface GoodsIssue {
  id: string
  code: string // PXK-2026-0001
  issueDate: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  projectName: string // Nhiệm vụ / Đề án
  projectItem?: string // Hạng mục
  department: string // Đơn vị nhận vật tư
  receiverName: string // Cán bộ nhận vật tư
  receiverRole?: string
  approverName?: string
  status: GoodsIssueStatus
  lines: GoodsIssueLine[]
  totalQuantity: number
  totalAmount: number
  reason: string // Mục đích sử dụng
  notes?: string
  issuedAt?: string
  issuedBy?: string
  createdAt: string
  updatedAt: string
}

// PRC-08: Điều chuyển kho
export type StockTransferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "in_transit"
  | "pending_receive"
  | "completed"
  | "discrepancy"
  | "rejected"
  | "cancelled"

export interface StockTransferLine {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  batchId?: string
  batchNumber?: string
  unitPrice: number
  dispatchedQuantity: number // Số xuất từ kho nguồn
  receivedQuantity: number // Số thực nhận tại kho đích
  discrepancyQuantity: number // Chênh lệch (nếu có)
  totalAmount: number
  notes?: string
}

export interface StockTransfer {
  id: string
  code: string // PDC-2026-0001
  transferDate: string
  sourceWarehouseId: string
  sourceWarehouseCode: string
  sourceWarehouseName: string
  targetWarehouseId: string
  targetWarehouseCode: string
  targetWarehouseName: string
  dispatcherName: string // Người xuất
  receiverName: string // Người nhận
  transporterName?: string // Đơn vị/Người vận chuyển
  reason: string
  status: StockTransferStatus
  lines: StockTransferLine[]
  totalDispatchedQuantity: number
  totalReceivedQuantity: number
  totalAmount: number
  discrepancyReason?: string
  dispatchedAt?: string
  receivedAt?: string
  createdAt: string
  updatedAt: string
}

// Số dư tồn kho tính toán từ Sổ cái
export interface StockLevel {
  materialId: string
  materialCode: string
  materialName: string
  category: string
  unit: string
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  batchId?: string
  batchNumber?: string
  expiryDate?: string
  locationCode?: string
  physicalQuantity: number // Tồn thực tế
  reservedQuantity: number // Tồn đang giữ chỗ cho phiếu xuất đã duyệt
  availableQuantity: number // Tồn khả dụng = physical - reserved
  inTransitQuantity?: number // Đang điều chuyển tới kho này
  unitPrice: number
  totalValue: number // physicalQuantity * unitPrice
  minStock?: number
  maxStock?: number
}

// Thiết lập định mức Min/Max
export interface StockThreshold {
  id: string
  materialId: string
  materialCode: string
  warehouseId: string // "all" hoặc warehouseId cụ thể
  warehouseCode: string
  minQuantity: number
  maxQuantity: number
  updatedAt: string
}

// Cảnh báo tồn kho PRC-09
export type StockAlertType =
  | "out_of_stock" // Hết hàng
  | "below_min" // Dưới định mức tối thiểu
  | "above_max" // Vượt định mức tối đa
  | "expiring_soon" // Sắp hết hạn trong 30 ngày
  | "expired" // Đã hết hạn
  | "locked_batch" // Lô bị khóa nhưng còn tồn
  | "shortage" // Nhu cầu vượt tồn khả dụng

export type AlertSeverity = "info" | "warning" | "critical"

export interface StockAlert {
  id: string
  type: StockAlertType
  severity: AlertSeverity
  materialId: string
  materialCode: string
  materialName: string
  warehouseId?: string
  warehouseCode?: string
  warehouseName?: string
  batchNumber?: string
  expiryDate?: string
  currentQuantity: number
  thresholdQuantity?: number
  message: string
  actionSuggestion: string
  dismissed: boolean
  dismissedReason?: string
  createdAt: string
}
