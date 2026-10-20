// src/types/engineering.ts
// Định nghĩa kiểu dữ liệu chuẩn cho phân hệ 02. Quản lý kỹ thuật, khối lượng và nghiệm thu

export type MethodGeophysical =
  | "Địa chấn phản xạ / khúc xạ"
  | "Đo điện ảnh 2D / 3D"
  | "Đo sâu điện đối xứng (VES)"
  | "Đo từ thông Proton / Gradiometer"
  | "Đo trọng lực vi sai"
  | "Đo Carota giếng khoan"
  | "Đo sâu chuyển tiếp TEM"
  | "Trắc địa định vị GNSS RTK"

export type PlanStatus =
  | "draft"              // Dự thảo
  | "pending_approval"  // Chờ phê duyệt
  | "approved"          // Đã phê duyệt
  | "in_progress"       // Đang triển khai hiện trường
  | "completed"         // Đã hoàn thành

export interface ConstructionPlan {
  id: string
  code: string                    // Mã kế hoạch thi công: KH-2026/ĐVL1-01
  taskName: string                // Tên nhiệm vụ / Đề án
  managingUnit: string            // Đơn vị thi công (Đoàn 1, Đoàn 2...)
  chiefEngineer: string           // Chủ nhiệm đề án
  technicalLead: string           // Cán bộ kỹ thuật phụ trách
  startDate: string               // Ngày bắt đầu
  endDate: string                 // Ngày kết thúc
  status: PlanStatus              // Trạng thái phê duyệt (TEC-01)
  approvedBy?: string             // Người phê duyệt (Lãnh đạo Liên đoàn)
  approvedDate?: string           // Ngày phê duyệt
  totalEstimatedCost: number      // Tổng dự toán kỹ thuật (VNĐ)
  notes?: string
}

export interface TechnicalItem {
  id: string
  planId: string                  // Liên kết kế hoạch thi công
  code: string                    // Mã hạng mục: HM-ĐC-01
  name: string                    // Tên hạng mục công việc
  method: MethodGeophysical       // Phương pháp kỹ thuật
  unit: string                    // Đơn vị tính: km tuyến, điểm đo, mét sâu, ca đo...
  normRate: number                // Định mức kỹ thuật (VD: 1.5 km/ngày, 20 điểm/ngày)
  unitPrice: number               // Đơn giá định mức (VNĐ/đơn vị)
  plannedVolume: number           // Khối lượng kế hoạch (TEC-02)
  completedVolume: number         // Khối lượng đã thực hiện lũy kế (TEC-05)
  internalAcceptedVolume: number  // Khối lượng đã nghiệm thu nội bộ (TEC-08)
  institutionalAcceptedVolume: number // Khối lượng đã nghiệm thu cơ sở (TEC-09, TEC-11)
  targetLocation: string          // Khu vực thi công (TEC-03)
  coordinates: {                  // Tọa độ thi công VN-2000 (TEC-03)
    system: "VN-2000" | "WGS-84"
    lineName: string              // Tên tuyến đo: Tuyến DC-01
    startPoint: string            // Tọa độ điểm đầu: X=2345678, Y=567890
    endPoint: string              // Tọa độ điểm cuối: X=2346789, Y=568901
    province: string              // Tỉnh / Địa bàn
  }
}

export interface ConstructionDailyLog {
  id: string
  logCode: string                 // Mã nhật ký: NK-2026/10/08-01
  date: string                    // Ngày thi công (YYYY-MM-DD)
  itemId: string                  // Hạng mục kỹ thuật (TEC-04)
  itemCode: string
  itemName: string
  taskName: string
  unitName: string
  weather: "Nắng ráo" | "Mưa nhẹ" | "Mưa to - nghỉ đo" | "Độ ẩm cao - sương mù"
  temperature: string             // Nhiệt độ: 28°C
  workforceCount: number          // Số nhân lực (kỹ sư + công nhân)
  engineersList: string           // Danh sách kỹ sư tham gia
  assignedEquipment: string       // Thiết bị máy móc sử dụng (mã máy, số serial)
  dailyVolume: number             // Khối lượng thực hiện trong ngày (TEC-05)
  workDescription: string         // Mô tả công việc hiện trường
  safetyStatus: string            // Tình trạng an toàn lao động
  loggedBy: string                // Người ghi nhật ký (Cán bộ kỹ thuật hiện trường)
  confirmedBy?: string            // Chủ nhiệm đề án xác nhận
}

export interface TechnicalRevisionAudit {
  revisionId: string
  date: string
  inspector: string
  comment: string
  actionRequired: string
  status: "pending" | "resolved"
}

export interface TechnicalInspection {
  id: string
  code: string                    // Mã phiếu kiểm tra: KT-2026/012
  itemId: string
  itemCode: string
  itemName: string
  taskName: string
  unitName: string
  inspectionDate: string          // Ngày kiểm tra
  inspectorName: string           // Cán bộ Phòng Kỹ thuật kiểm tra
  inspectedVolume: number         // Khối lượng kiểm tra thực tế
  result: "passed" | "request_revision" | "re_measurement" // Đạt / Yêu cầu sửa / Đo bù (TEC-06)
  qualityScore: number            // Điểm chất lượng (thang 100)
  findings: string                // Sai số biên độ, nhiễu công nghiệp, tiếp xúc điện cực...
  revisionHistory: TechnicalRevisionAudit[] // Lưu vết quá trình kiểm tra & sửa đổi (Audit trail - TEC-06)
}

export interface AcceptanceRecord {
  id: string
  code: string                    // Số biên bản: BB-NTNB-2026/05 hoặc BBNT-CS-2026/02
  type: "internal" | "institutional" // Nghiệm thu nội bộ (TEC-08) | Nghiệm thu cơ sở (TEC-09)
  taskName: string
  unitName: string
  acceptanceDate: string
  committeeMembers: string        // Thành phần hội đồng nghiệm thu
  itemId: string
  itemName: string
  acceptedVolume: number          // Khối lượng nghiệm thu (TEC-11)
  plannedVolume: number           // Khối lượng kế hoạch đối chiếu
  unit: string
  acceptedValue: number           // Giá trị thành tiền nghiệm thu (VNĐ)
  rating: "Xuất sắc" | "Đạt yêu cầu" | "Chưa đạt"
  conclusion: string              // Kết luận hội đồng
  taskCompletionStatus: "Đang thi công" | "Hoàn thành nhiệm vụ" // (TEC-09)
  attachedDocuments: {            // Quản lý biên bản và tài liệu kết quả (TEC-10)
    name: string
    size: string
    uploadDate: string
  }[]
  signStatus: "draft" | "signed"  // Trạng thái ký duyệt
}

export const METHOD_LIST: MethodGeophysical[] = [
  "Địa chấn phản xạ / khúc xạ",
  "Đo điện ảnh 2D / 3D",
  "Đo sâu điện đối xứng (VES)",
  "Đo từ thông Proton / Gradiometer",
  "Đo trọng lực vi sai",
  "Đo Carota giếng khoan",
  "Đo sâu chuyển tiếp TEM",
  "Trắc địa định vị GNSS RTK",
]
