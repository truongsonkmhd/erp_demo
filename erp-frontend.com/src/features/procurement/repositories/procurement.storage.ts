import type {
  PurchaseContract,
  PurchaseRequest,
  Supplier,
} from "../types/procurement.types"

const REQUESTS_STORAGE_KEY = "erp:procurement:purchase-requests:v1"
const SUPPLIERS_STORAGE_KEY = "erp:procurement:suppliers:v1"
const CONTRACTS_STORAGE_KEY = "erp:procurement:contracts:v1"

// --- DỮ LIỆU SEED MẪU BAN ĐẦU ---
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-001",
    code: "NCC-0001",
    name: "Công ty Cổ phần Thiết bị Địa vật lý Geotech Việt Nam",
    taxCode: "0102345678",
    address: "Tầng 5, Tòa nhà Licogi 13, Đường Khuất Duy Tiến, Thanh Xuân, Hà Nội",
    contactPerson: "Nguyễn Văn Hùng (GĐ Kinh doanh)",
    phone: "0912.345.678",
    email: "contact@geotechvn.com.vn",
    bankAccount: "110002839182",
    bankName: "VietinBank - CN Thanh Xuân",
    supplyCategories: [
      "Thiết bị đo từ, trọng lực, điện chuyên dụng",
      "Cáp đo địa chấn, geophone & phụ kiện",
    ],
    status: "active",
    rating: 4.8,
    contractCount: 5,
    totalTransactionValue: 4850000000,
    legalProfileSummary: "Đầy đủ ĐKKD, chứng nhận đại lý ủy quyền Scintrex & Geometrics",
    note: "Nhà cung cấp uy tín nhiều năm của Liên đoàn",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2026-09-20T10:30:00Z",
  },
  {
    id: "sup-002",
    code: "NCC-0002",
    name: "Công ty TNHH Kỹ thuật Biển & Dịch vụ Khảo sát Biển Đông",
    taxCode: "0309876543",
    address: "Số 42 Đường 30/4, Phường 9, TP. Vũng Tàu, Bà Rịa - Vũng Tàu",
    contactPerson: "Trần Thị Mai Lan",
    phone: "0908.765.432",
    email: "lan.tran@biendongsurvey.vn",
    bankAccount: "0081000987654",
    bankName: "Vietcombank - CN Vũng Tàu",
    supplyCategories: [
      "Thiết bị định vị DGPS & máy thu vệ tinh",
      "Phụ tùng trạm đo & pin lithium chuyên dụng",
    ],
    status: "active",
    rating: 4.6,
    contractCount: 3,
    totalTransactionValue: 2150000000,
    legalProfileSummary: "Giấy phép kinh doanh trang thiết bị hàng hải, ISO 9001:2015",
    note: "Chuyên cấp pin chuyên dụng chịu nước mặn",
    createdAt: "2024-06-10T09:00:00Z",
    updatedAt: "2026-08-15T14:00:00Z",
  },
  {
    id: "sup-003",
    code: "NCC-0003",
    name: "Công ty Cổ phần Vật tư Khoa học Kỹ thuật Mỏ - Địa chất",
    taxCode: "0108765432",
    address: "Số 18 Đường Cầu Giấy, Phường Quan Hoa, Cầu Giấy, Hà Nội",
    contactPerson: "Lê Hoàng Quân",
    phone: "0983.123.456",
    email: "kinhdoanh@geosupply.com.vn",
    bankAccount: "19034567890123",
    bankName: "Techcombank - CN Cầu Giấy",
    supplyCategories: [
      "Vật tư tiêu hao, hóa chất dã ngoại",
      "Trang bị bảo hộ lao động dã ngoại thực địa",
    ],
    status: "active",
    rating: 4.2,
    contractCount: 2,
    totalTransactionValue: 860000000,
    legalProfileSummary: "Đủ điều kiện kinh doanh hóa chất chuyên ngành khảo sát",
    createdAt: "2025-02-20T08:30:00Z",
    updatedAt: "2026-07-10T16:20:00Z",
  },
  {
    id: "sup-004",
    code: "NCC-0004",
    name: "Doanh nghiệp Tư nhân Thiết bị Quang cơ Hải Phòng",
    taxCode: "0201122334",
    address: "Số 88 Lê Lợi, Ngô Quyền, Hải Phòng",
    contactPerson: "Phạm Quốc Toàn",
    phone: "0913.998.877",
    email: "toan.pq@quangcohp.com",
    supplyCategories: ["Phụ tùng trạm đo & pin lithium chuyên dụng"],
    status: "paused",
    rating: 3.5,
    contractCount: 1,
    totalTransactionValue: 320000000,
    legalProfileSummary: "Đang làm thủ tục cập nhật mã ngành xuất nhập khẩu",
    note: "Tạm dừng lựa chọn do tiến độ giao hàng chậm kỳ trước",
    createdAt: "2025-08-01T10:00:00Z",
    updatedAt: "2026-09-01T09:00:00Z",
  },
]

export const INITIAL_REQUESTS: PurchaseRequest[] = [
  {
    id: "req-001",
    code: "DXMS-2026-0001",
    requestDate: "2026-10-02",
    department: "Đoàn Địa vật lý Máy bay",
    requesterName: "Nguyễn Văn Đức",
    projectName: "Bay đo Từ - Trọng lực tỷ lệ 1:50.000 khu vực Tây Bắc",
    projectItem: "Hạng mục bay đo từ - phổ gamma dã ngoại",
    planReference: "KH-2026/ĐVL-03",
    budgetSource: "Kinh phí Đề án Bay đo Từ - Trọng lực Tây Bắc",
    requiredDate: "2026-10-25",
    reason: "Bổ sung cảm biến đo từ độ nhạy cao và cáp quang học chuyên dụng cho hệ thống máy bay trực thăng",
    status: "approved",
    totalAmount: 485000000,
    lines: [
      {
        id: "line-01",
        itemCode: "VT-TB-001",
        itemName: "Cảm biến đo từ quang học Cesium CS-VL",
        itemGroup: "Thiết bị đo từ, trọng lực",
        specification: "Độ nhạy 0.001 nT, tần số lấy mẫu 10Hz, đầu cáp bọc Kevlar",
        unit: "Bộ",
        availableStock: 0,
        quantity: 2,
        estimatedUnitPrice: 180000000,
        totalPrice: 360000000,
        note: "Trang bị cho máy bay số hiệu VN-862",
      },
      {
        id: "line-02",
        itemCode: "VT-PK-014",
        itemName: "Cáp kéo khí động học chịu lực 30m kèm đầu nối chống nước",
        itemGroup: "Cáp đo địa chấn & phụ kiện",
        specification: "Dây cáp chịu kéo 1500kg, tích hợp đường tín hiệu quang",
        unit: "Cuộn",
        availableStock: 1,
        quantity: 2,
        estimatedUnitPrice: 62500000,
        totalPrice: 125000000,
        note: "Dự phòng 1 cuộn cho chiến dịch bay dài ngày",
      },
    ],
    attachments: [
      {
        id: "att-01",
        name: "To_trinh_nhu_cau_thiet_bi_doan_MB.pdf",
        size: 1420500,
        type: "application/pdf",
        uploadedAt: "2026-10-02T08:30:00Z",
      },
      {
        id: "att-02",
        name: "Bien_ban_kiem_tra_ky_thuat_sensor.pdf",
        size: 890000,
        type: "application/pdf",
        uploadedAt: "2026-10-02T08:45:00Z",
      },
    ],
    approvalHistory: [
      {
        id: "wf-01",
        stepName: "Khởi tạo đề nghị",
        actorName: "Nguyễn Văn Đức",
        actorRole: "Cán bộ kỹ thuật",
        action: "create",
        actionName: "Lập đề xuất mua sắm",
        comment: "Kính trình lãnh đạo phê duyệt để kịp thời điểm triển khai bay mùa khô",
        timestamp: "2026-10-02T09:00:00Z",
        previousStatus: "draft",
        newStatus: "pending_dept",
      },
      {
        id: "wf-02",
        stepName: "Trưởng đơn vị duyệt",
        actorName: "Lê Quang Minh",
        actorRole: "Đoàn trưởng Đoàn ĐVL Máy bay",
        action: "approve",
        actionName: "Duyệt nhu cầu đơn vị",
        comment: "Xác nhận nhu cầu cấp thiết, đã rà soát kho hiện trường không còn",
        timestamp: "2026-10-03T10:15:00Z",
        previousStatus: "pending_dept",
        newStatus: "pending_planning",
      },
      {
        id: "wf-03",
        stepName: "Kiểm tra Kế hoạch/Dự toán",
        actorName: "Phạm Hải Yến",
        actorRole: "Phó Trưởng phòng KH-KT",
        action: "approve",
        actionName: "Xác nhận kế hoạch & nguồn kinh phí",
        comment: "Phù hợp dự toán hạng mục máy bay đề án Tây Bắc 2026, nguồn kinh phí đảm bảo",
        timestamp: "2026-10-04T14:30:00Z",
        previousStatus: "pending_planning",
        newStatus: "pending_leader",
      },
      {
        id: "wf-04",
        stepName: "Lãnh đạo Liên đoàn phê duyệt",
        actorName: "Trần Anh Tuấn",
        actorRole: "Phó Liên đoàn trưởng phụ trách",
        action: "approve",
        actionName: "Phê duyệt chính thức",
        comment: "Đồng ý phê duyệt. Giao phòng Kế hoạch triển khai ký hợp đồng cung ứng.",
        timestamp: "2026-10-05T09:00:00Z",
        previousStatus: "pending_leader",
        newStatus: "approved",
      },
    ],
    createdAt: "2026-10-02T09:00:00Z",
    updatedAt: "2026-10-05T09:00:00Z",
  },
  {
    id: "req-002",
    code: "DXMS-2026-0002",
    requestDate: "2026-10-06",
    department: "Đoàn Địa vật lý Biển",
    requesterName: "Trần Hữu Kiên",
    projectName: "Khảo sát Địa chấn Nông phân giải cao Vùng biển Nam Trung Bộ",
    projectItem: "Thi công tuyến địa chấn biển dã ngoại",
    planReference: "KH-2026/ĐVL-07",
    budgetSource: "Kinh phí Khảo sát Địa chấn Nông biển Nam Trung Bộ",
    requiredDate: "2026-11-05",
    reason: "Cung ứng phao nổi và hydrophone biển thay thế cụm cáp bị rách do đá ngầm",
    status: "pending_planning",
    totalAmount: 185000000,
    lines: [
      {
        id: "line-03",
        itemCode: "VT-HP-088",
        itemName: "Cụm đầu thu Hydrophone bọc cao su chịu áp 200m",
        itemGroup: "Cáp đo địa chấn & phụ kiện",
        specification: "Dải tần 5 - 1500Hz, độ nhạy -195dBV, cáp bọc PU",
        unit: "Cụm",
        availableStock: 2,
        quantity: 10,
        estimatedUnitPrice: 12500000,
        totalPrice: 125000000,
        note: "Thay thế cáp tuyến tàu khảo sát ĐVL-02",
      },
      {
        id: "line-04",
        itemCode: "VT-DK-019",
        itemName: "Dầu cách điện chuyên dụng cho cáp địa chấn biển Streamer",
        itemGroup: "Vật tư tiêu hao, hóa chất",
        specification: "Dầu silicone biến tính tỷ trọng nhẹ hơn nước biển, thùng 20L",
        unit: "Thùng",
        availableStock: 3,
        quantity: 6,
        estimatedUnitPrice: 10000000,
        totalPrice: 60000000,
      },
    ],
    attachments: [
      {
        id: "att-03",
        name: "Bao_cao_su_co_tuyen_bien_thang_9.pdf",
        size: 2150000,
        type: "application/pdf",
        uploadedAt: "2026-10-06T10:00:00Z",
      },
    ],
    approvalHistory: [
      {
        id: "wf-05",
        stepName: "Khởi tạo đề nghị",
        actorName: "Trần Hữu Kiên",
        actorRole: "Chủ nhiệm đề án biển",
        action: "create",
        actionName: "Lập đề xuất mua sắm",
        comment: "Trình duyệt khẩn trương phục vụ đợt ra khơi cuối tháng 10",
        timestamp: "2026-10-06T10:00:00Z",
        previousStatus: "draft",
        newStatus: "pending_dept",
      },
      {
        id: "wf-06",
        stepName: "Trưởng đơn vị duyệt",
        actorName: "Vũ Hải Đăng",
        actorRole: "Đoàn trưởng Đoàn ĐVL Biển",
        action: "approve",
        actionName: "Duyệt nhu cầu đơn vị",
        comment: "Nhất trí trình Liên đoàn, trang bị thiết yếu để tiếp tục đo",
        timestamp: "2026-10-07T08:30:00Z",
        previousStatus: "pending_dept",
        newStatus: "pending_planning",
      },
    ],
    createdAt: "2026-10-06T10:00:00Z",
    updatedAt: "2026-10-07T08:30:00Z",
  },
  {
    id: "req-003",
    code: "DXMS-2026-0003",
    requestDate: "2026-10-08",
    department: "Đoàn Địa vật lý Mặt đất",
    requesterName: "Hoàng Văn Thái",
    projectName: "Đo sâu điện từ phân giải cao vùng quặng đa kim Sơn La",
    budgetSource: "Ngân sách Nhà nước giao nhiệm vụ 2026",
    requiredDate: "2026-10-30",
    reason: "Cọc tiếp địa mạ đồng chống ăn mòn và dây cáp truyền tín hiệu điện trở suất",
    status: "pending_dept",
    totalAmount: 96000000,
    lines: [
      {
        id: "line-05",
        itemCode: "VT-CD-009",
        itemName: "Điện cực không phân cực Pb-PbCl2 chuyên dụng",
        itemGroup: "Thiết bị đo từ, trọng lực, điện",
        specification: "Điện thế chênh < 1mV, sử dụng cho phương pháp đo điện trường tự nhiên",
        unit: "Cặp",
        availableStock: 0,
        quantity: 12,
        estimatedUnitPrice: 8000000,
        totalPrice: 96000000,
      },
    ],
    attachments: [],
    approvalHistory: [
      {
        id: "wf-07",
        stepName: "Khởi tạo đề nghị",
        actorName: "Hoàng Văn Thái",
        actorRole: "Cán bộ thực địa",
        action: "create",
        actionName: "Lập đề xuất mua sắm",
        timestamp: "2026-10-08T14:00:00Z",
        previousStatus: "draft",
        newStatus: "pending_dept",
      },
    ],
    createdAt: "2026-10-08T14:00:00Z",
    updatedAt: "2026-10-08T14:00:00Z",
  },
]

export const INITIAL_CONTRACTS: PurchaseContract[] = [
  {
    id: "ct-001",
    contractNumber: "HDMS-2026-0001",
    contractName: "Hợp đồng cung cấp cảm biến đo từ Cesium và cáp quang học chuyên dụng",
    requestId: "req-001",
    requestCode: "DXMS-2026-0001",
    supplierId: "sup-001",
    supplierName: "Công ty Cổ phần Thiết bị Địa vật lý Geotech Việt Nam",
    supplierTaxCode: "0102345678",
    signDate: "2026-10-06",
    effectiveDate: "2026-10-06",
    expiryDate: "2026-11-20",
    preTaxAmount: 440909091,
    taxAmount: 44090909,
    totalAmount: 485000000,
    paymentTerms: "Tạm ứng 30% sau khi ký hợp đồng, 70% sau khi nghiệm thu kỹ thuật và bàn giao tại kho",
    status: "active",
    lines: [
      {
        id: "cline-01",
        itemCode: "VT-TB-001",
        itemName: "Cảm biến đo từ quang học Cesium CS-VL",
        unit: "Bộ",
        quantity: 2,
        unitPrice: 180000000,
        totalPrice: 360000000,
        deliveredQuantity: 1,
        remainingQuantity: 1,
      },
      {
        id: "cline-02",
        itemCode: "VT-PK-014",
        itemName: "Cáp kéo khí động học chịu lực 30m kèm đầu nối chống nước",
        unit: "Cuộn",
        quantity: 2,
        unitPrice: 62500000,
        totalPrice: 125000000,
        deliveredQuantity: 2,
        remainingQuantity: 0,
      },
    ],
    paidAmount: 145500000,
    remainingAmount: 339500000,
    deliveredPercent: 75,
    hasAdjustment: false,
    attachments: [
      {
        id: "catt-01",
        name: "Hop_dong_kinh_te_HDMS_2026_0001.pdf",
        size: 3200000,
        type: "application/pdf",
        uploadedAt: "2026-10-06T15:00:00Z",
      },
    ],
    createdAt: "2026-10-06T15:00:00Z",
    updatedAt: "2026-10-08T11:00:00Z",
  },
]

// --- HÀM HỖ TRỢ TRUY XUẤT LOCALSTORAGE AN TOÀN ---

function readStorage<T>(key: string, defaultData: T[]): T[] {
  if (typeof window === "undefined") return defaultData
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData))
      return defaultData
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      localStorage.setItem(key, JSON.stringify(defaultData))
      return defaultData
    }
    return parsed
  } catch (err) {
    console.warn(`[ProcurementStorage] Lỗi đọc key ${key}, reset về dữ liệu mẫu`, err)
    localStorage.setItem(key, JSON.stringify(defaultData))
    return defaultData
  }
}

function writeStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`[ProcurementStorage] Không thể lưu vào ${key}`, err)
  }
}

// --- CÁC REPOSITORY CHÍNH THỨC ---

export const PurchaseRequestRepository = {
  list(): PurchaseRequest[] {
    return readStorage<PurchaseRequest>(REQUESTS_STORAGE_KEY, INITIAL_REQUESTS)
  },

  getById(id: string): PurchaseRequest | null {
    const list = this.list()
    return list.find((item) => item.id === id) || null
  },

  save(value: PurchaseRequest): PurchaseRequest {
    const list = this.list()
    const index = list.findIndex((item) => item.id === value.id)
    const now = new Date().toISOString()
    const updatedValue = { ...value, updatedAt: now }

    if (index >= 0) {
      list[index] = updatedValue
    } else {
      updatedValue.createdAt = updatedValue.createdAt || now
      list.unshift(updatedValue)
    }

    writeStorage(REQUESTS_STORAGE_KEY, list)
    return updatedValue
  },

  remove(id: string): void {
    const list = this.list().filter((item) => item.id !== id)
    writeStorage(REQUESTS_STORAGE_KEY, list)
  },

  generateNextCode(): string {
    const list = this.list()
    const year = new Date().getFullYear()
    const prefix = `DXMS-${year}-`
    const sameYearCodes = list
      .filter((r) => r.code?.startsWith(prefix))
      .map((r) => {
        const numPart = r.code.replace(prefix, "")
        return parseInt(numPart, 10) || 0
      })
    const maxNum = sameYearCodes.length ? Math.max(...sameYearCodes) : 0
    return `${prefix}${(maxNum + 1).toString().padStart(4, "0")}`
  },
}

export const SupplierRepository = {
  list(): Supplier[] {
    return readStorage<Supplier>(SUPPLIERS_STORAGE_KEY, INITIAL_SUPPLIERS)
  },

  getById(id: string): Supplier | null {
    const list = this.list()
    return list.find((item) => item.id === id) || null
  },

  save(value: Supplier): Supplier {
    const list = this.list()
    const index = list.findIndex((item) => item.id === value.id)
    const now = new Date().toISOString()
    const updatedValue = { ...value, updatedAt: now }

    if (index >= 0) {
      list[index] = updatedValue
    } else {
      updatedValue.createdAt = updatedValue.createdAt || now
      list.unshift(updatedValue)
    }

    writeStorage(SUPPLIERS_STORAGE_KEY, list)
    return updatedValue
  },

  remove(id: string): void {
    const list = this.list().filter((item) => item.id !== id)
    writeStorage(SUPPLIERS_STORAGE_KEY, list)
  },

  generateNextCode(): string {
    const list = this.list()
    const nums = list
      .map((s) => {
        const match = s.code?.match(/NCC-(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      })
      .filter(Boolean)
    const maxNum = nums.length ? Math.max(...nums) : 0
    return `NCC-${(maxNum + 1).toString().padStart(4, "0")}`
  },
}

export const PurchaseContractRepository = {
  list(): PurchaseContract[] {
    return readStorage<PurchaseContract>(CONTRACTS_STORAGE_KEY, INITIAL_CONTRACTS)
  },

  getById(id: string): PurchaseContract | null {
    const list = this.list()
    return list.find((item) => item.id === id) || null
  },

  save(value: PurchaseContract): PurchaseContract {
    const list = this.list()
    const index = list.findIndex((item) => item.id === value.id)
    const now = new Date().toISOString()
    const updatedValue = { ...value, updatedAt: now }

    if (index >= 0) {
      list[index] = updatedValue
    } else {
      updatedValue.createdAt = updatedValue.createdAt || now
      list.unshift(updatedValue)
    }

    writeStorage(CONTRACTS_STORAGE_KEY, list)
    return updatedValue
  },

  remove(id: string): void {
    const list = this.list().filter((item) => item.id !== id)
    writeStorage(CONTRACTS_STORAGE_KEY, list)
  },

  generateNextNumber(): string {
    const list = this.list()
    const year = new Date().getFullYear()
    const prefix = `HDMS-${year}-`
    const sameYearNums = list
      .filter((c) => c.contractNumber?.startsWith(prefix))
      .map((c) => {
        const numPart = c.contractNumber.replace(prefix, "")
        return parseInt(numPart, 10) || 0
      })
    const maxNum = sameYearNums.length ? Math.max(...sameYearNums) : 0
    return `${prefix}${(maxNum + 1).toString().padStart(4, "0")}`
  },
}
