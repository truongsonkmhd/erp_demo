// src/services/EngineeringService.ts
// Service quản lý dữ liệu mock và lưu trữ LocalStorage cho phân hệ Kỹ thuật, Khối lượng và Nghiệm thu

import { readStore, writeStore, newLocalId } from "@/lib/localStore"
import {
  ConstructionPlan,
  TechnicalItem,
  ConstructionDailyLog,
  TechnicalInspection,
  AcceptanceRecord,
} from "@/types/engineering"

const PLANS_KEY = "erp_engineering_plans_v1"
const ITEMS_KEY = "erp_engineering_items_v1"
const DAILY_LOGS_KEY = "erp_engineering_daily_logs_v1"
const INSPECTIONS_KEY = "erp_engineering_inspections_v1"
const ACCEPTANCES_KEY = "erp_engineering_acceptances_v1"

// 1. Kế hoạch thi công mẫu (TEC-01)
export const INITIAL_PLANS: ConstructionPlan[] = [
  {
    id: "plan-001",
    code: "KH-2026/ĐVL1-01",
    taskName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền (Bắc Kạn)",
    managingUnit: "Đoàn Địa vật lý 1",
    chiefEngineer: "TS. Nguyễn Văn Tuấn",
    technicalLead: "ThS. Lê Hoàng Long",
    startDate: "2026-03-01",
    endDate: "2026-11-30",
    status: "approved",
    approvedBy: "Lãnh đạo Liên đoàn Địa vật lý",
    approvedDate: "2026-02-25",
    totalEstimatedCost: 3200000000,
    notes: "Kế hoạch đã thông qua Hội đồng Khoa học Kỹ thuật Liên đoàn.",
  },
  {
    id: "plan-002",
    code: "KH-2026/ĐVL2-02",
    taskName: "Nhiệm vụ Điều tra đánh giá Bauxit Tây Nguyên (Đắk Nông)",
    managingUnit: "Đoàn Địa vật lý 2",
    chiefEngineer: "KS. Trần Đình Trọng",
    technicalLead: "KS. Vũ Minh Đức",
    startDate: "2026-04-15",
    endDate: "2026-12-15",
    status: "approved",
    approvedBy: "Lãnh đạo Liên đoàn Địa vật lý",
    approvedDate: "2026-04-10",
    totalEstimatedCost: 4500000000,
    notes: "Triển khai đo điện đa cực 3D và từ thông phân giải cao.",
  },
  {
    id: "plan-003",
    code: "KH-2026/ĐVL3-03",
    taskName: "Nhiệm vụ Thăm dò nguồn nước dưới đất vùng ven biển Ba Chẽ (Quảng Ninh)",
    managingUnit: "Đoàn Địa vật lý 3",
    chiefEngineer: "ThS. Phạm Quốc Bảo",
    technicalLead: "KS. Nguyễn Thế Dũng",
    startDate: "2026-05-01",
    endDate: "2026-10-31",
    status: "in_progress",
    approvedBy: "Lãnh đạo Liên đoàn Địa vật lý",
    approvedDate: "2026-04-28",
    totalEstimatedCost: 1850000000,
    notes: "Đang đo sâu chuyển tiếp TEM và đo Carota giếng khoan kiểm tra.",
  },
]

// 2. Hạng mục kỹ thuật mẫu (TEC-02, TEC-03)
export const INITIAL_ITEMS: TechnicalItem[] = [
  {
    id: "item-001",
    planId: "plan-001",
    code: "HM-ĐC-01",
    name: "Đo địa chấn phản xạ nông phân giải cao 24 kênh",
    method: "Địa chấn phản xạ / khúc xạ",
    unit: "km tuyến",
    normRate: 1.2, // 1.2 km/ngày
    unitPrice: 35000000, // 35 tr/km
    plannedVolume: 45, // 45 km kế hoạch
    completedVolume: 38.5, // 38.5 km đã thi công (TEC-05)
    internalAcceptedVolume: 35, // 35 km đã nghiệm thu nội bộ (TEC-08)
    institutionalAcceptedVolume: 25, // 25 km đã nghiệm thu cơ sở (TEC-09, TEC-11)
    targetLocation: "Khu mỏ chì kẽm Chợ Điền, huyện Chợ Đồn, tỉnh Bắc Kạn",
    coordinates: {
      system: "VN-2000",
      lineName: "Tuyến DC-01 đến DC-05",
      startPoint: "X=2462100, Y=568200",
      endPoint: "X=2465800, Y=571400",
      province: "Bắc Kạn",
    },
  },
  {
    id: "item-002",
    planId: "plan-001",
    code: "HM-ĐĐ-02",
    name: "Đo sâu điện ảnh đa cực 2D (SuperSting R8)",
    method: "Đo điện ảnh 2D / 3D",
    unit: "km tuyến",
    normRate: 1.5,
    unitPrice: 28000000,
    plannedVolume: 60,
    completedVolume: 52,
    internalAcceptedVolume: 48,
    institutionalAcceptedVolume: 36,
    targetLocation: "Thung lũng đá vôi Chợ Điền",
    coordinates: {
      system: "VN-2000",
      lineName: "Tuyến ĐA-01 đến ĐA-08",
      startPoint: "X=2461800, Y=567900",
      endPoint: "X=2466200, Y=572100",
      province: "Bắc Kạn",
    },
  },
  {
    id: "item-003",
    planId: "plan-002",
    code: "HM-TT-01",
    name: "Đo từ thông mặt đất mạng lưới chi tiết (GSM-19T)",
    method: "Đo từ thông Proton / Gradiometer",
    unit: "điểm đo",
    normRate: 120, // 120 điểm/ngày
    unitPrice: 120000,
    plannedVolume: 3500,
    completedVolume: 3100,
    internalAcceptedVolume: 2800,
    institutionalAcceptedVolume: 2400,
    targetLocation: "Vùng mỏ Bauxit Nhân Cơ, tỉnh Đắk Nông",
    coordinates: {
      system: "VN-2000",
      lineName: "Lưới trắc lượng 50m x 20m",
      startPoint: "X=1325000, Y=458000",
      endPoint: "X=1329000, Y=462500",
      province: "Đắk Nông",
    },
  },
  {
    id: "item-004",
    planId: "plan-003",
    code: "HM-TEM-01",
    name: "Đo sâu điện từ trường chuyển tiếp TEM-FAST 48",
    method: "Đo sâu chuyển tiếp TEM",
    unit: "điểm đo",
    normRate: 15,
    unitPrice: 2200000,
    plannedVolume: 120,
    completedVolume: 98,
    internalAcceptedVolume: 85,
    institutionalAcceptedVolume: 60,
    targetLocation: "Vùng hải đảo Ba Chẽ, tỉnh Quảng Ninh",
    coordinates: {
      system: "VN-2000",
      lineName: "Tuyến TEM-BC01",
      startPoint: "X=2348000, Y=625000",
      endPoint: "X=2351200, Y=629800",
      province: "Quảng Ninh",
    },
  },
  {
    id: "item-005",
    planId: "plan-003",
    code: "HM-CR-02",
    name: "Đo Carota giếng khoan sâu tỷ điện trở & Gamma tự nhiên",
    method: "Đo Carota giếng khoan",
    unit: "mét sâu",
    normRate: 200,
    unitPrice: 180000,
    plannedVolume: 1500,
    completedVolume: 1350,
    internalAcceptedVolume: 1200,
    institutionalAcceptedVolume: 1000,
    targetLocation: "5 lỗ khoan thăm dò nước ngầm ven biển Ba Chẽ",
    coordinates: {
      system: "VN-2000",
      lineName: "Lỗ khoan LK-01 đến LK-05",
      startPoint: "X=2349100, Y=626400",
      endPoint: "X=2350800, Y=628900",
      province: "Quảng Ninh",
    },
  },
]

// 3. Nhật ký thi công mẫu (TEC-04, TEC-05)
export const INITIAL_DAILY_LOGS: ConstructionDailyLog[] = [
  {
    id: "log-001",
    logCode: "NK-2026/10/08-01",
    date: "2026-10-08",
    itemId: "item-001",
    itemCode: "HM-ĐC-01",
    itemName: "Đo địa chấn phản xạ nông phân giải cao 24 kênh",
    taskName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền (Bắc Kạn)",
    unitName: "Đoàn Địa vật lý 1",
    weather: "Nắng ráo",
    temperature: "26°C",
    workforceCount: 8,
    engineersList: "KS. Nguyễn Văn Tuấn (Trưởng nhóm), KS. Đặng Văn Nam, 6 công nhân rải cáp",
    assignedEquipment: "Máy Geode 24 kênh (GEO-2021-9981), Máy phát điện Honda 3kVA",
    dailyVolume: 1.5,
    workDescription: "Thi công tuyến DC-03 từ cọc 12 đến cọc 25. Địa hình đồi thoải, tín hiệu phản xạ tầng đá vôi rõ nét.",
    safetyStatus: "Tuyệt đối an toàn lao động, đã kiểm tra nối đất chống rò điện nguồn phát.",
    loggedBy: "KS. Đặng Văn Nam",
    confirmedBy: "TS. Nguyễn Văn Tuấn",
  },
  {
    id: "log-002",
    logCode: "NK-2026/10/07-02",
    date: "2026-10-07",
    itemId: "item-002",
    itemCode: "HM-ĐĐ-02",
    itemName: "Đo sâu điện ảnh đa cực 2D (SuperSting R8)",
    taskName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền (Bắc Kạn)",
    unitName: "Đoàn Địa vật lý 1",
    weather: "Nắng ráo",
    temperature: "28°C",
    workforceCount: 6,
    engineersList: "KS. Lê Văn Hùng, KS. Phạm Văn Sơn, 4 công nhân",
    assignedEquipment: "SuperSting R8/IP (AGI-R8-0912), Cáp điện cực thông minh 56 điểm",
    dailyVolume: 1.8,
    workDescription: "Đo tuyến ĐA-04. Điện trở tiếp xúc điện cực đạt chuẩn < 1.5 kOhm sau khi tưới nước muối.",
    safetyStatus: "An toàn lao động đảm bảo 100%.",
    loggedBy: "KS. Phạm Văn Sơn",
    confirmedBy: "TS. Nguyễn Văn Tuấn",
  },
  {
    id: "log-003",
    logCode: "NK-2026/10/06-03",
    date: "2026-10-06",
    itemId: "item-004",
    itemCode: "HM-TEM-01",
    itemName: "Đo sâu điện từ trường chuyển tiếp TEM-FAST 48",
    taskName: "Nhiệm vụ Thăm dò nguồn nước dưới đất vùng ven biển Ba Chẽ (Quảng Ninh)",
    unitName: "Đoàn Địa vật lý 3",
    weather: "Độ ẩm cao - sương mù",
    temperature: "24°C",
    workforceCount: 5,
    engineersList: "KS. Hoàng Minh Trí, KS. Bùi Văn Hậu",
    assignedEquipment: "TEM-FAST 48HPC (AEM-TF-0199), Khung dây phát 50x50m",
    dailyVolume: 14,
    workDescription: "Đo 14 điểm trạm trên tuyến TEM-BC01. Tín hiệu suy giảm điện từ ổn định, phát hiện ranh giới mặn ở độ sâu 75m.",
    safetyStatus: "Đảm bảo trang bị bảo hộ hiện trường ven biển.",
    loggedBy: "KS. Bùi Văn Hậu",
    confirmedBy: "ThS. Phạm Quốc Bảo",
  },
]

// 4. Kiểm tra chất lượng & Lưu vết chỉnh sửa (Audit Trail) (TEC-06, TEC-07)
export const INITIAL_INSPECTIONS: TechnicalInspection[] = [
  {
    id: "insp-001",
    code: "KT-2026/012",
    itemId: "item-001",
    itemCode: "HM-ĐC-01",
    itemName: "Đo địa chấn phản xạ nông phân giải cao 24 kênh",
    taskName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền (Bắc Kạn)",
    unitName: "Đoàn Địa vật lý 1",
    inspectionDate: "2026-09-25",
    inspectorName: "Phòng Kỹ thuật - Khối lượng (ThS. Nguyễn Văn Hòa)",
    inspectedVolume: 12.5,
    result: "passed",
    qualityScore: 94,
    findings: "Độ phân giải tuyến tốt, sóng phản xạ liên tục, sai số thời gian trễ kênh < 2ms theo TCVN.",
    revisionHistory: [],
  },
  {
    id: "insp-002",
    code: "KT-2026/013",
    itemId: "item-002",
    itemCode: "HM-ĐĐ-02",
    itemName: "Đo sâu điện ảnh đa cực 2D (SuperSting R8)",
    taskName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền (Bắc Kạn)",
    unitName: "Đoàn Địa vật lý 1",
    inspectionDate: "2026-09-28",
    inspectorName: "Phòng Kỹ thuật - Khối lượng (KS. Đỗ Quang Huy)",
    inspectedVolume: 15,
    result: "request_revision", // Yêu cầu chỉnh sửa / đo bù (TEC-06)
    qualityScore: 78,
    findings: "Phát hiện nhiễu công nghiệp tại đoạn cọc 18-22 do gần đường dây hạ thế 0.4kV; điện trở tiếp xúc 3 điện cực bị trôi.",
    revisionHistory: [
      {
        revisionId: "rev-01",
        date: "2026-09-29",
        inspector: "KS. Đỗ Quang Huy",
        comment: "Yêu cầu Đoàn 1 lọc nhiễu tần số 50Hz bằng phần mềm và đo bù 400m tuyến đoạn cọc 18-22.",
        actionRequired: "Đo bù 400m và xử lý lọc số tín hiệu",
        status: "resolved",
      },
      {
        revisionId: "rev-02",
        date: "2026-10-02",
        inspector: "ThS. Nguyễn Văn Hòa",
        comment: "Đã kiểm tra lại kết quả đo bù ngày 01/10. Tỷ số tín hiệu/nhiễu đạt yêu cầu, chấp nhận kết quả.",
        actionRequired: "Nghiệm thu khối lượng đo bù",
        status: "resolved",
      },
    ],
  },
]

// 5. Nghiệm thu nội bộ & Nghiệm thu cơ sở (TEC-08, TEC-09, TEC-10, TEC-11)
export const INITIAL_ACCEPTANCES: AcceptanceRecord[] = [
  {
    id: "acc-001",
    code: "BB-NTNB-2026/05",
    type: "internal", // Nghiệm thu nội bộ (TEC-08)
    taskName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền (Bắc Kạn)",
    unitName: "Đoàn Địa vật lý 1",
    acceptanceDate: "2026-09-30",
    committeeMembers: "TS. Nguyễn Văn Tuấn (Trưởng ban), ThS. Lê Hoàng Long, KS. Đặng Văn Nam",
    itemId: "item-001",
    itemName: "Đo địa chấn phản xạ nông phân giải cao 24 kênh",
    acceptedVolume: 35,
    plannedVolume: 45,
    unit: "km tuyến",
    acceptedValue: 1225000000,
    rating: "Xuất sắc",
    conclusion: "Khối lượng thi công đạt 35/45 km (77.8%), chất lượng băng đo đảm bảo yêu cầu kỹ thuật đề cương.",
    taskCompletionStatus: "Đang thi công",
    attachedDocuments: [
      { name: "Bien-ban-nghiem-thu-noi-bo-Dot2-ChoDien.pdf", size: "3.2 MB", uploadDate: "2026-09-30" },
      { name: "Phu-luc-mat-cat-dia-chan-tuyen-01-05.dwg", size: "14.5 MB", uploadDate: "2026-09-30" },
    ],
    signStatus: "signed",
  },
  {
    id: "acc-002",
    code: "BBNT-CS-2026/02",
    type: "institutional", // Nghiệm thu cơ sở cấp Liên đoàn (TEC-09)
    taskName: "Nhiệm vụ Thăm dò nguồn nước dưới đất vùng ven biển Ba Chẽ (Quảng Ninh)",
    unitName: "Đoàn Địa vật lý 3",
    acceptanceDate: "2026-10-05",
    committeeMembers: "Hội đồng nghiệm thu cơ sở Liên đoàn: Phó Liên đoàn trưởng (Chủ tịch), Trưởng phòng Kỹ thuật, Trưởng phòng KHTC",
    itemId: "item-004",
    itemName: "Đo sâu điện từ trường chuyển tiếp TEM-FAST 48",
    acceptedVolume: 60,
    plannedVolume: 120,
    unit: "điểm đo",
    acceptedValue: 132000000,
    rating: "Đạt yêu cầu",
    conclusion: "Nghiệm thu khối lượng giai đoạn 1 đạt 60 điểm đo TEM. Đủ điều kiện thanh toán khối lượng hoàn thành cấp cơ sở.",
    taskCompletionStatus: "Đang thi công",
    attachedDocuments: [
      { name: "Bien-ban-nghiem-thu-co-so-Giai-doan-1-BaChe.pdf", size: "4.8 MB", uploadDate: "2026-10-05" },
      { name: "Bao-cao-ket-qua-dia-vat-ly-TEM-BaChe.docx", size: "8.1 MB", uploadDate: "2026-10-05" },
    ],
    signStatus: "signed",
  },
]

// ============ CRUD SERVICES ============

// PLANS (TEC-01)
export function getPlans(): ConstructionPlan[] {
  const data = readStore<ConstructionPlan>(PLANS_KEY, [])
  if (!data || data.length === 0) {
    writeStore(PLANS_KEY, INITIAL_PLANS)
    return INITIAL_PLANS
  }
  return data
}

export function savePlan(plan: ConstructionPlan): ConstructionPlan {
  const current = getPlans()
  const idx = current.findIndex((p) => p.id === plan.id)
  let updated: ConstructionPlan[]
  if (idx >= 0) {
    updated = [...current]
    updated[idx] = plan
  } else {
    updated = [plan, ...current]
  }
  writeStore(PLANS_KEY, updated)
  return plan
}

// ITEMS (TEC-02, TEC-03)
export function getTechnicalItems(): TechnicalItem[] {
  const data = readStore<TechnicalItem>(ITEMS_KEY, [])
  if (!data || data.length === 0) {
    writeStore(ITEMS_KEY, INITIAL_ITEMS)
    return INITIAL_ITEMS
  }
  return data
}

export function saveTechnicalItem(item: TechnicalItem): TechnicalItem {
  const current = getTechnicalItems()
  const idx = current.findIndex((i) => i.id === item.id)
  let updated: TechnicalItem[]
  if (idx >= 0) {
    updated = [...current]
    updated[idx] = item
  } else {
    updated = [item, ...current]
  }
  writeStore(ITEMS_KEY, updated)
  return item
}

// DAILY LOGS (TEC-04, TEC-05)
export function getDailyLogs(): ConstructionDailyLog[] {
  const data = readStore<ConstructionDailyLog>(DAILY_LOGS_KEY, [])
  if (!data || data.length === 0) {
    writeStore(DAILY_LOGS_KEY, INITIAL_DAILY_LOGS)
    return INITIAL_DAILY_LOGS
  }
  return data
}

export function addDailyLog(log: Omit<ConstructionDailyLog, "id" | "logCode">): ConstructionDailyLog {
  const current = getDailyLogs()
  const code = `NK-${log.date.replace(/-/g, "/")}-${String(current.length + 1).padStart(2, "0")}`
  const newLog: ConstructionDailyLog = {
    ...log,
    id: newLocalId("log"),
    logCode: code,
  }

  writeStore(DAILY_LOGS_KEY, [newLog, ...current])

  // Tự động cộng dồn khối lượng thực hiện vào hạng mục kỹ thuật (TEC-05)
  const items = getTechnicalItems()
  const item = items.find((i) => i.id === log.itemId)
  if (item) {
    item.completedVolume = Number((item.completedVolume + log.dailyVolume).toFixed(2))
    saveTechnicalItem(item)
  }

  return newLog
}

// INSPECTIONS (TEC-06, TEC-07)
export function getInspections(): TechnicalInspection[] {
  const data = readStore<TechnicalInspection>(INSPECTIONS_KEY, [])
  if (!data || data.length === 0) {
    writeStore(INSPECTIONS_KEY, INITIAL_INSPECTIONS)
    return INITIAL_INSPECTIONS
  }
  return data
}

export function saveInspection(inspection: TechnicalInspection): TechnicalInspection {
  const current = getInspections()
  const idx = current.findIndex((i) => i.id === inspection.id)
  let updated: TechnicalInspection[]
  if (idx >= 0) {
    updated = [...current]
    updated[idx] = inspection
  } else {
    updated = [inspection, ...current]
  }
  writeStore(INSPECTIONS_KEY, updated)
  return inspection
}

// ACCEPTANCES (TEC-08, TEC-09, TEC-10, TEC-11)
export function getAcceptances(): AcceptanceRecord[] {
  const data = readStore<AcceptanceRecord>(ACCEPTANCES_KEY, [])
  if (!data || data.length === 0) {
    writeStore(ACCEPTANCES_KEY, INITIAL_ACCEPTANCES)
    return INITIAL_ACCEPTANCES
  }
  return data
}

export function saveAcceptance(record: AcceptanceRecord): AcceptanceRecord {
  const current = getAcceptances()
  const idx = current.findIndex((a) => a.id === record.id)
  let updated: AcceptanceRecord[]
  if (idx >= 0) {
    updated = [...current]
    updated[idx] = record
  } else {
    updated = [record, ...current]
  }
  writeStore(ACCEPTANCES_KEY, updated)

  // Cập nhật khối lượng đã nghiệm thu vào hạng mục (TEC-11)
  const items = getTechnicalItems()
  const item = items.find((i) => i.id === record.itemId)
  if (item) {
    if (record.type === "internal") {
      item.internalAcceptedVolume = Math.max(item.internalAcceptedVolume, record.acceptedVolume)
    } else {
      item.institutionalAcceptedVolume = Math.max(item.institutionalAcceptedVolume, record.acceptedVolume)
    }
    saveTechnicalItem(item)
  }

  return record
}

// KPI CALCULATION (TEC-07, TEC-11)
export function getEngineeringKPIs() {
  const items = getTechnicalItems()
  const inspections = getInspections()
  const acceptances = getAcceptances()

  // Tổng khối lượng kế hoạch vs thi công vs nghiệm thu
  const totalPlannedVal = items.reduce((s, i) => s + i.plannedVolume * i.unitPrice, 0)
  const totalCompletedVal = items.reduce((s, i) => s + i.completedVolume * i.unitPrice, 0)
  const totalInternalAcceptedVal = items.reduce((s, i) => s + i.internalAcceptedVolume * i.unitPrice, 0)
  const totalInstAcceptedVal = items.reduce((s, i) => s + i.institutionalAcceptedVolume * i.unitPrice, 0)

  const overallProgressPercent = totalPlannedVal > 0 ? Math.round((totalCompletedVal / totalPlannedVal) * 100) : 0
  const acceptancePercent = totalPlannedVal > 0 ? Math.round((totalInstAcceptedVal / totalPlannedVal) * 100) : 0

  // Tỷ lệ nghiệm thu đạt lần đầu % (First-Pass Yield) (TEC-07)
  const totalInspected = inspections.length
  const passedFirstPass = inspections.filter((i) => i.result === "passed" && i.revisionHistory.length === 0).length
  const firstPassYield = totalInspected > 0 ? Math.round((passedFirstPass / totalInspected) * 100) : 85

  return {
    totalPlannedVal,
    totalCompletedVal,
    totalInternalAcceptedVal,
    totalInstAcceptedVal,
    overallProgressPercent,
    acceptancePercent,
    firstPassYield,
    totalItemsCount: items.length,
    activePlansCount: getPlans().filter((p) => p.status === "approved" || p.status === "in_progress").length,
  }
}
