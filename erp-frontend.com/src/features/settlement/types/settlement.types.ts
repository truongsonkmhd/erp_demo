import type { InventoryTransaction, Material, Warehouse } from "@/features/inventory/types/inventory.types"

export type MaterialSettlementStatus =
  | "draft"                 // Nháp
  | "unit_confirmed"       // Đơn vị sử dụng xác nhận
  | "accounting_reviewed"   // Kế toán kiểm tra
  | "pending_approval"     // Chờ lãnh đạo duyệt
  | "approved"             // Đã quyết toán (Hoàn thành)
  | "revision_requested"   // Yêu cầu chỉnh sửa
  | "rejected"             // Từ chối

export interface SettlementHistoryEntry {
  id: string
  settlementId: string
  action: string
  fromStatus?: MaterialSettlementStatus
  toStatus: MaterialSettlementStatus
  performedBy: string
  performedByRole: string
  comment?: string
  timestamp: string
}

export interface MaterialSettlementLine {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  specification?: string
  batchNumber?: string
  sourceWarehouseId: string
  sourceWarehouseName: string
  goodsIssueId: string
  goodsIssueCode: string
  issuedQuantity: number      // Số lượng đã xuất kho
  returnedQuantity: number    // Lũy kế đã hoàn trả
  actualUsedQuantity: number  // Số lượng sử dụng thực tế (issued - returned)
  unitPrice: number          // Đơn giá xuất kho
  totalIssuedAmount: number   // Thành tiền xuất (issued * price)
  totalReturnedAmount: number // Thành tiền hoàn trả (returned * price)
  actualUsedAmount: number    // Thành tiền sử dụng thực tế (actualUsed * price)
  note?: string
}

export interface MaterialSettlement {
  id: string
  code: string                    // QT-YYYY-XXXX
  missionId: string              // Mã nhiệm vụ / Đề án
  missionCode: string
  missionName: string
  categoryId: string             // Hạng mục công việc / chuyên môn
  categoryName: string
  departmentName: string         // Đơn vị thi công / chủ trì
  period: string                 // Niên độ / Quý / Tháng quyết toán
  settlementDate: string
  status: MaterialSettlementStatus
  createdBy: string
  createdDate: string
  updatedAt: string
  personInCharge: string         // Người phụ trách
  
  // Tổng hợp số liệu
  totalIssuedAmount: number      // Tổng giá trị đã xuất
  totalReturnedAmount: number    // Tổng giá trị hoàn trả
  totalActualUsedAmount: number  // Giá trị quyết toán sử dụng thực tế
  
  lines: MaterialSettlementLine[]
  history: SettlementHistoryEntry[]
  notes?: string
  accountingNotes?: string
  approvalNotes?: string
}

export interface MaterialReturnLine {
  id: string
  settlementLineId: string
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  batchNumber?: string
  warehouseId: string            // Kho tiếp nhận lại
  warehouseName: string
  issuedQuantity: number
  alreadyReturnedQuantity: number
  returnQuantity: number         // Số lượng hoàn trả đợt này
  unitPrice: number
  totalAmount: number
  reason?: string
}

export interface MaterialReturn {
  id: string
  code: string                    // HT-YYYY-XXXX
  settlementId: string
  settlementCode: string
  missionId: string
  missionName: string
  categoryId: string
  categoryName: string
  returnDate: string
  warehouseId: string
  warehouseName: string
  returnedBy: string             // Người giao trả
  receiverName: string           // Người nhận (Thủ kho)
  status: "draft" | "posted" | "cancelled"
  lines: MaterialReturnLine[]
  totalQuantity: number
  totalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
}
