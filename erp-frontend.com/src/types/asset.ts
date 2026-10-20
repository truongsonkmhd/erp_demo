// src/types/asset.ts
// Định nghĩa kiểu dữ liệu chuẩn cho phân hệ Quản lý tài sản - máy móc - thiết bị địa vật lý

export type AssetCategory =
  | "Địa chấn"
  | "Điện - Điện từ"
  | "Từ - Trọng lực"
  | "Xạ - Môi trường"
  | "Đo Carota giếng khoan"
  | "Định vị vệ tinh GNSS"
  | "Máy phát điện - Phụ trợ"

export type AssetStatus =
  | "active"       // Sẵn sàng tại kho
  | "in_use"       // Đang thi công ngoài thực địa
  | "repairing"    // Đang sửa chữa / bảo dưỡng
  | "calibrating"  // Đang kiểm định / hiệu chuẩn
  | "broken"       // Hỏng hóc chờ thanh lý / sửa

export type CalibrationStatus =
  | "valid"        // Còn hạn kiểm định
  | "warning"      // Sắp hết hạn trong vòng 30 ngày
  | "expired"      // Đã hết hạn kiểm định

export interface GeophysicalAsset {
  id: string
  code: string                    // Mã tài sản: VLĐC-ĐC-01
  name: string                    // Tên thiết bị
  category: AssetCategory         // Chủng loại máy móc
  model: string                   // Model máy
  serialNumber: string            // Số serial sản xuất
  manufacturerCountry: string     // Nước sản xuất & Hãng
  yearOfManufacture: number       // Năm sản xuất
  yearOfUse: number               // Năm đưa vào sử dụng
  originalPrice: number           // Nguyên giá (VNĐ)
  residualValue: number           // Giá trị còn lại (VNĐ)
  managingUnit: string            // Đơn vị quản lý (Đoàn 1, Đoàn 2...)
  personInCharge: string          // Người phụ trách
  status: AssetStatus             // Tình trạng hoạt động
  currentLocation: string         // Vị trí hiện tại (Kho hoặc công trường)
  currentProject?: string         // Dự án/Đề án đang phục vụ (nếu có)
  lastCalibrationDate: string     // Ngày kiểm định gần nhất (YYYY-MM-DD)
  nextCalibrationDate: string     // Hạn kiểm định kế tiếp (YYYY-MM-DD)
  calibrationStatus: CalibrationStatus
  lastUsedDate: string            // Ngày sử dụng gần nhất (YYYY-MM-DD)
  usageDaysThisYear: number       // Số ngày hoạt động trong năm hiện tại
  totalMaintenanceCost: number    // Tổng chi phí bảo dưỡng tích lũy (VNĐ)
  qrCodeData: string              // Dữ liệu mã QR
  notes?: string                  // Ghi chú kỹ thuật
}

export interface CalibrationRecord {
  id: string
  assetId: string
  assetCode: string
  assetName: string
  calibrationDate: string
  expirationDate: string
  calibrationUnit: string         // Viện Đo lường, Trung tâm Kiểm định...
  certificateNumber: string       // Số giấy chứng nhận / tem kiểm định
  result: "passed" | "failed"
  cost: number                    // Chi phí kiểm định (VNĐ)
  notes?: string
}

export interface MaintenanceRecord {
  id: string
  code: string                    // Mã phiếu sửa chữa: SC-2026/001
  assetId: string
  assetCode: string
  assetName: string
  startDate: string
  endDate?: string
  type: "periodic" | "repair" | "upgrade"
  description: string             // Mô tả hư hỏng hoặc nội dung bảo trì
  sparePartsReplaced: string[]    // Linh kiện phụ tùng thay thế
  serviceProvider: string         // Xưởng cơ điện Liên đoàn / Hãng ngoài
  cost: number                    // Chi phí sửa chữa (VNĐ)
  status: "in_progress" | "waiting_parts" | "completed"
}

export interface DispatchRecord {
  id: string
  dispatchCode: string            // Mã lệnh: ĐĐ-2026/001
  assetId: string
  assetCode: string
  assetName: string
  originUnit: string             // Đơn vị xuất máy
  destinationUnit: string        // Đơn vị tiếp nhận máy
  projectName: string            // Đề án / Nhiệm vụ thực hiện
  startDate: string              // Ngày bắt đầu điều động
  expectedEndDate: string        // Ngày dự kiến hoàn trả
  actualEndDate?: string
  requestedBy: string            // Người lập đề nghị
  approver?: string              // Người phê duyệt
  receiverName: string           // Người tiếp nhận
  status: "pending_approval" | "approved" | "dispatched" | "returned" | "rejected"
  hasConflict?: boolean          // Cảnh báo xung đột lịch trùng
  conflictReason?: string        // Chi tiết lý do xung đột
  notes?: string
  estimatedCost: number          // Dự toán chi phí ca máy (VNĐ)
  dailyRate: number              // Đơn giá ca máy theo ngày (VNĐ/ngày)
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  "Địa chấn",
  "Điện - Điện từ",
  "Từ - Trọng lực",
  "Xạ - Môi trường",
  "Đo Carota giếng khoan",
  "Định vị vệ tinh GNSS",
  "Máy phát điện - Phụ trợ",
]

export const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; badgeClass: string }> = {
  active: {
    label: "Sẵn sàng (Kho)",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  in_use: {
    label: "Đang thi công",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  repairing: {
    label: "Đang sửa chữa",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  calibrating: {
    label: "Đang kiểm định",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  broken: {
    label: "Hỏng hóc",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
}

export const DISPATCH_STATUS_CONFIG: Record<DispatchRecord["status"], { label: string; badgeClass: string }> = {
  pending_approval: {
    label: "Chờ phê duyệt",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Đã duyệt (Chờ xuất)",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  dispatched: {
    label: "Đang thi công",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  returned: {
    label: "Đã hoàn trả",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Từ chối",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
}
