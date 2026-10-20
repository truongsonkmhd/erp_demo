import type {
  MaterialReturn,
  MaterialSettlement,
  MaterialSettlementStatus,
} from "../types/settlement.types"
import { SETTLEMENT_STORAGE_KEYS } from "../types/settlement.constants"

function safeGet<T>(key: string, seed: () => T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      const initial = seed()
      localStorage.setItem(key, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const initial = seed()
      localStorage.setItem(key, JSON.stringify(initial))
      return initial
    }
    return parsed as T[]
  } catch (err) {
    console.error(`Error loading storage key ${key}, fallback to seed:`, err)
    const initial = seed()
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }
}

function safeSet<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`Error saving storage key ${key}:`, err)
  }
}

// Dữ liệu mẫu hồ sơ quyết toán thực tế
const SEED_SETTLEMENTS: MaterialSettlement[] = [
  {
    id: "stl-001",
    code: "QT-2026-001",
    missionId: "NV-2026-DC01",
    missionCode: "NV-2026-DC01",
    missionName: "Khảo sát địa chấn 3D vùng đồng bằng Bắc Bộ",
    categoryId: "HM-01",
    categoryName: "Thi công tuyến đo địa chấn số 01",
    departmentName: "Đoàn Địa vật lý 1",
    period: "Quý I/2026",
    settlementDate: "2026-03-25",
    status: "approved",
    createdBy: "Nguyễn Văn Hùng",
    createdDate: "2026-03-20",
    updatedAt: "2026-03-25T14:30:00Z",
    personInCharge: "Nguyễn Văn Hùng (Chủ nhiệm đề án)",
    totalIssuedAmount: 264000000,
    totalReturnedAmount: 22000000,
    totalActualUsedAmount: 242000000,
    notes: "Quyết toán vật tư thực địa tuyến 01 hoàn thành 100% khối lượng thiết kế",
    accountingNotes: "Đã đối chiếu sổ kho và hóa đơn hợp lệ, định mức đạt yêu cầu",
    approvalNotes: "Đồng ý phê duyệt quyết toán theo biên bản nghiệm thu kỹ thuật",
    lines: [
      {
        id: "stl-line-01",
        materialId: "mat-2",
        materialCode: "VT-CAP24",
        materialName: "Cáp đo địa chấn phân xạ 24 kênh",
        unit: "Cuộn",
        specification: "Cáp 24 take-out, khoảng cách 5m",
        batchNumber: "LO-2026-CAP01",
        sourceWarehouseId: "wh-2",
        sourceWarehouseName: "Kho Thiết bị & Cáp đo Biển",
        goodsIssueId: "issue-1",
        goodsIssueCode: "XK-2026-001",
        issuedQuantity: 2,
        returnedQuantity: 0,
        actualUsedQuantity: 2,
        unitPrice: 22000000,
        totalIssuedAmount: 44000000,
        totalReturnedAmount: 0,
        actualUsedAmount: 44000000,
      },
      {
        id: "stl-line-02",
        materialId: "mat-3",
        materialCode: "VT-PIN100",
        materialName: "Pin Lithium LiFePO4 12V-100Ah",
        unit: "Cái",
        specification: "Pin chuyên dụng máy trạm dã ngoại",
        batchNumber: "LO-2026-PIN01",
        sourceWarehouseId: "wh-1",
        sourceWarehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
        goodsIssueId: "issue-1",
        goodsIssueCode: "XK-2026-001",
        issuedQuantity: 6,
        returnedQuantity: 2,
        actualUsedQuantity: 4,
        unitPrice: 15000000,
        totalIssuedAmount: 90000000,
        totalReturnedAmount: 30000000,
        actualUsedAmount: 60000000,
        note: "Hoàn kho 02 bình pin dự phòng không dùng hết",
      },
      {
        id: "stl-line-03",
        materialId: "mat-5",
        materialCode: "VT-PLB-SEA",
        materialName: "Bộ phao & định vị khẩn cấp PLB dã ngoại biển",
        unit: "Bộ",
        specification: "Chống nước IP68, phát tín hiệu 406MHz",
        batchNumber: "LO-2026-PLB01",
        sourceWarehouseId: "wh-2",
        sourceWarehouseName: "Kho Thiết bị & Cáp đo Biển",
        goodsIssueId: "issue-1",
        goodsIssueCode: "XK-2026-001",
        issuedQuantity: 4,
        returnedQuantity: 0,
        actualUsedQuantity: 4,
        unitPrice: 28000000,
        totalIssuedAmount: 112000000,
        totalReturnedAmount: 0,
        actualUsedAmount: 112000000,
      },
    ],
    history: [
      {
        id: "h-1",
        settlementId: "stl-001",
        action: "Tạo hồ sơ",
        toStatus: "draft",
        performedBy: "Nguyễn Văn Hùng",
        performedByRole: "Chủ nhiệm đề án",
        comment: "Khởi tạo hồ sơ quyết toán từ các phiếu xuất kho thực tế",
        timestamp: "2026-03-20T08:30:00Z",
      },
      {
        id: "h-2",
        settlementId: "stl-001",
        action: "Xác nhận khối lượng",
        fromStatus: "draft",
        toStatus: "unit_confirmed",
        performedBy: "Trần Đình Khang",
        performedByRole: "Trưởng đoàn Địa vật lý 1",
        comment: "Đã rà soát thực địa và xác nhận số lượng thu hồi",
        timestamp: "2026-03-22T10:15:00Z",
      },
      {
        id: "h-3",
        settlementId: "stl-001",
        action: "Kiểm tra tài chính",
        fromStatus: "unit_confirmed",
        toStatus: "accounting_reviewed",
        performedBy: "Lê Thị Bích",
        performedByRole: "Kế toán vật tư",
        comment: "Đơn giá khớp chứng từ gốc, số liệu hợp lệ",
        timestamp: "2026-03-24T15:00:00Z",
      },
      {
        id: "h-4",
        settlementId: "stl-001",
        action: "Phê duyệt quyết toán",
        fromStatus: "accounting_reviewed",
        toStatus: "approved",
        performedBy: "TS. Nguyễn Văn Tuấn",
        performedByRole: "Liên đoàn trưởng",
        comment: "Phê duyệt quyết toán chính thức và đóng mã hồ sơ",
        timestamp: "2026-03-25T14:30:00Z",
      },
    ],
  },
  {
    id: "stl-002",
    code: "QT-2026-002",
    missionId: "NV-2026-TB02",
    missionCode: "NV-2026-TB02",
    missionName: "Đo sâu điện phân giải cao Tây Bắc",
    categoryId: "HM-02",
    categoryName: "Tuyến đo điện trường sâu Fansipan",
    departmentName: "Đoàn Địa vật lý 2",
    period: "Tháng 03/2026",
    settlementDate: "2026-03-28",
    status: "accounting_reviewed",
    createdBy: "Hoàng Minh Trí",
    createdDate: "2026-03-26",
    updatedAt: "2026-03-28T09:45:00Z",
    personInCharge: "Hoàng Minh Trí (Kỹ sư chủ trì)",
    totalIssuedAmount: 184500000,
    totalReturnedAmount: 15000000,
    totalActualUsedAmount: 169500000,
    notes: "Thi công hoàn thành tuyến đo địa chấn điện trở 12km vùng đồi núi",
    accountingNotes: "Kế toán đã thẩm định, chờ Trưởng phòng Tài chính trình Lãnh đạo",
    lines: [
      {
        id: "stl-line-21",
        materialId: "mat-4",
        materialCode: "VT-CUSO4",
        materialName: "Hóa chất tạo tiếp địa điện trở CuSO4",
        unit: "Kg",
        specification: "Độ tinh khiết > 98%, bao 25kg",
        batchNumber: "LO-2025-CUS04",
        sourceWarehouseId: "wh-3",
        sourceWarehouseName: "Kho Vật tư Địa vật lý Mặt đất",
        goodsIssueId: "issue-2",
        goodsIssueCode: "XK-2026-002",
        issuedQuantity: 50,
        returnedQuantity: 10,
        actualUsedQuantity: 40,
        unitPrice: 45000,
        totalIssuedAmount: 2250000,
        totalReturnedAmount: 450000,
        actualUsedAmount: 1800000,
      },
      {
        id: "stl-line-22",
        materialId: "mat-1",
        materialCode: "VT-GSM19",
        materialName: "Máy đo từ trường proton GSM-19T",
        unit: "Bộ",
        specification: "Thiết bị đo từ, trọng lực, điện chuyên dụng",
        batchNumber: "LO-2026-GSM01",
        sourceWarehouseId: "wh-1",
        sourceWarehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
        goodsIssueId: "issue-2",
        goodsIssueCode: "XK-2026-002",
        issuedQuantity: 1,
        returnedQuantity: 0,
        actualUsedQuantity: 1,
        unitPrice: 150000000,
        totalIssuedAmount: 150000000,
        totalReturnedAmount: 0,
        actualUsedAmount: 150000000,
      },
    ],
    history: [
      {
        id: "h-21",
        settlementId: "stl-002",
        action: "Tạo hồ sơ",
        toStatus: "draft",
        performedBy: "Hoàng Minh Trí",
        performedByRole: "Kỹ sư chủ trì",
        comment: "Lập hồ sơ quyết toán sau khi thu dọn trạm đo",
        timestamp: "2026-03-26T08:00:00Z",
      },
      {
        id: "h-22",
        settlementId: "stl-002",
        action: "Đơn vị xác nhận",
        fromStatus: "draft",
        toStatus: "unit_confirmed",
        performedBy: "Đặng Quốc Việt",
        performedByRole: "Đoàn trưởng Đoàn 2",
        comment: "Xác nhận vật tư tiêu hao hóa chất và bàn giao máy",
        timestamp: "2026-03-27T11:20:00Z",
      },
      {
        id: "h-23",
        settlementId: "stl-002",
        action: "Kế toán kiểm tra",
        fromStatus: "unit_confirmed",
        toStatus: "accounting_reviewed",
        performedBy: "Lê Thị Bích",
        performedByRole: "Kế toán vật tư",
        comment: "Hồ sơ hợp lệ, đủ điều kiện trình Lãnh đạo",
        timestamp: "2026-03-28T09:45:00Z",
      },
    ],
  },
  {
    id: "stl-003",
    code: "QT-2026-003",
    missionId: "NV-2026-BL03",
    missionCode: "NV-2026-BL03",
    missionName: "Đo từ hàng không và trọng lực biển",
    categoryId: "HM-03",
    categoryName: "Trạm kiểm chuẩn từ trường Bạch Long Vĩ",
    departmentName: "Trung tâm Công nghệ Địa vật lý",
    period: "Tháng 04/2026",
    settlementDate: "2026-04-05",
    status: "draft",
    createdBy: "Vũ Hải Đăng",
    createdDate: "2026-04-05",
    updatedAt: "2026-04-05T16:00:00Z",
    personInCharge: "Vũ Hải Đăng (Cán bộ kỹ thuật)",
    totalIssuedAmount: 75000000,
    totalReturnedAmount: 0,
    totalActualUsedAmount: 75000000,
    notes: "Đang chờ thu thập biên bản nghiệm thu mốc trạm từ trường đảo",
    lines: [
      {
        id: "stl-line-31",
        materialId: "mat-3",
        materialCode: "VT-PIN100",
        materialName: "Pin Lithium LiFePO4 12V-100Ah",
        unit: "Cái",
        specification: "Pin trạm dã ngoại",
        batchNumber: "LO-2026-PIN01",
        sourceWarehouseId: "wh-1",
        sourceWarehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
        goodsIssueId: "issue-3",
        goodsIssueCode: "XK-2026-003",
        issuedQuantity: 5,
        returnedQuantity: 0,
        actualUsedQuantity: 5,
        unitPrice: 15000000,
        totalIssuedAmount: 75000000,
        totalReturnedAmount: 0,
        actualUsedAmount: 75000000,
      },
    ],
    history: [
      {
        id: "h-31",
        settlementId: "stl-003",
        action: "Tạo dự thảo",
        toStatus: "draft",
        performedBy: "Vũ Hải Đăng",
        performedByRole: "Cán bộ kỹ thuật",
        comment: "Khởi tạo bản nháp quyết toán",
        timestamp: "2026-04-05T16:00:00Z",
      },
    ],
  },
]

// Dữ liệu mẫu phiếu hoàn trả vật tư
const SEED_RETURNS: MaterialReturn[] = [
  {
    id: "ret-001",
    code: "HT-2026-001",
    settlementId: "stl-001",
    settlementCode: "QT-2026-001",
    missionId: "NV-2026-DC01",
    missionName: "Khảo sát địa chấn 3D vùng đồng bằng Bắc Bộ",
    categoryId: "HM-01",
    categoryName: "Thi công tuyến đo địa chấn số 01",
    returnDate: "2026-03-21",
    warehouseId: "wh-1",
    warehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
    returnedBy: "Nguyễn Văn Hùng",
    receiverName: "Phạm Văn Long (Thủ kho)",
    status: "posted",
    totalQuantity: 2,
    totalAmount: 30000000,
    notes: "Hoàn trả 02 bình pin Lithium dự phòng không dùng hết sau khi kết thúc tuyến đo",
    createdAt: "2026-03-21T09:00:00Z",
    updatedAt: "2026-03-21T10:00:00Z",
    lines: [
      {
        id: "ret-line-01",
        settlementLineId: "stl-line-02",
        materialId: "mat-3",
        materialCode: "VT-PIN100",
        materialName: "Pin Lithium LiFePO4 12V-100Ah",
        unit: "Cái",
        batchNumber: "LO-2026-PIN01",
        warehouseId: "wh-1",
        warehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
        issuedQuantity: 6,
        alreadyReturnedQuantity: 0,
        returnQuantity: 2,
        unitPrice: 15000000,
        totalAmount: 30000000,
        reason: "Vật tư dự phòng không phát sinh nhu cầu sử dụng thực địa",
      },
    ],
  },
]

export const MaterialSettlementRepository = {
  list(): MaterialSettlement[] {
    return safeGet<MaterialSettlement>(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, () => SEED_SETTLEMENTS)
  },

  getById(id: string): MaterialSettlement | undefined {
    return this.list().find((item) => item.id === id)
  },

  save(settlement: MaterialSettlement): void {
    const list = this.list()
    const index = list.findIndex((item) => item.id === settlement.id)
    if (index >= 0) {
      list[index] = { ...settlement, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({ ...settlement, updatedAt: new Date().toISOString() })
    }
    safeSet(SETTLEMENT_STORAGE_KEYS.SETTLEMENTS, list)
  },

  checkDuplicateActiveSettlement(missionName: string, categoryName: string, excludeId?: string): boolean {
    const list = this.list()
    return list.some(
      (s) =>
        s.id !== excludeId &&
        s.missionName.trim().toLowerCase() === missionName.trim().toLowerCase() &&
        s.categoryName.trim().toLowerCase() === categoryName.trim().toLowerCase() &&
        s.status !== "rejected"
    )
  },

  updateStatus(
    id: string,
    newStatus: MaterialSettlementStatus,
    performedBy: string,
    performedByRole: string,
    comment?: string
  ): MaterialSettlement | null {
    const settlement = this.getById(id)
    if (!settlement) return null

    const historyEntry = {
      id: `h-${Date.now()}`,
      settlementId: id,
      action: getActionLabel(newStatus),
      fromStatus: settlement.status,
      toStatus: newStatus,
      performedBy,
      performedByRole,
      comment,
      timestamp: new Date().toISOString(),
    }

    const updated: MaterialSettlement = {
      ...settlement,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      history: [...(settlement.history || []), historyEntry],
      accountingNotes: newStatus === "accounting_reviewed" ? comment || settlement.accountingNotes : settlement.accountingNotes,
      approvalNotes: newStatus === "approved" || newStatus === "rejected" ? comment || settlement.approvalNotes : settlement.approvalNotes,
    }

    this.save(updated)
    return updated
  },
}

export const MaterialReturnRepository = {
  list(): MaterialReturn[] {
    return safeGet<MaterialReturn>(SETTLEMENT_STORAGE_KEYS.RETURNS, () => SEED_RETURNS)
  },

  getById(id: string): MaterialReturn | undefined {
    return this.list().find((item) => item.id === id)
  },

  getBySettlementId(settlementId: string): MaterialReturn[] {
    return this.list().filter((item) => item.settlementId === settlementId)
  },

  save(doc: MaterialReturn): void {
    const list = this.list()
    const index = list.findIndex((item) => item.id === doc.id)
    if (index >= 0) {
      list[index] = { ...doc, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({ ...doc, updatedAt: new Date().toISOString() })
    }
    safeSet(SETTLEMENT_STORAGE_KEYS.RETURNS, list)
  },
}

function getActionLabel(status: MaterialSettlementStatus): string {
  switch (status) {
    case "unit_confirmed":
      return "Đơn vị xác nhận"
    case "accounting_reviewed":
      return "Kế toán kiểm tra"
    case "pending_approval":
      return "Trình Lãnh đạo duyệt"
    case "approved":
      return "Phê duyệt quyết toán"
    case "revision_requested":
      return "Yêu cầu chỉnh sửa"
    case "rejected":
      return "Từ chối hồ sơ"
    default:
      return "Cập nhật hồ sơ"
  }
}
