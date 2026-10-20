// src/services/AssetService.ts
// Service quản lý dữ liệu mock và lưu trữ LocalStorage cho phân hệ Thiết bị địa vật lý

import { readStore, writeStore, newLocalId } from "@/lib/localStore"
import {
  GeophysicalAsset,
  CalibrationRecord,
  MaintenanceRecord,
  DispatchRecord,
} from "@/types/asset"

const ASSETS_KEY = "erp_assets_v1"
const CALIBRATIONS_KEY = "erp_calibrations_v1"
const MAINTENANCES_KEY = "erp_maintenances_v1"
const DISPATCHES_KEY = "erp_dispatches_v1"

// 8 Thiết bị địa vật lý mẫu tiêu biểu của Liên đoàn Địa vật lý
export const INITIAL_ASSETS: GeophysicalAsset[] = [
  {
    id: "ast-001",
    code: "VLĐC-ĐC-01",
    name: "Máy đo địa chấn 24 kênh Geode",
    category: "Địa chấn",
    model: "Geode 24-channel",
    serialNumber: "GEO-2021-9981",
    manufacturerCountry: "Mỹ (Geometrics)",
    yearOfManufacture: 2021,
    yearOfUse: 2022,
    originalPrice: 1450000000,
    residualValue: 1087500000,
    managingUnit: "Đoàn Địa vật lý 1",
    personInCharge: "Nguyễn Văn Tuấn (Kỹ sư Địa chấn)",
    status: "in_use",
    currentLocation: "Công trường Mỏ chì kẽm Chợ Điền (Bắc Kạn)",
    currentProject: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền",
    lastCalibrationDate: "2026-03-15",
    nextCalibrationDate: "2027-03-15",
    calibrationStatus: "valid",
    lastUsedDate: "2026-10-08",
    usageDaysThisYear: 165,
    totalMaintenanceCost: 45000000,
    qrCodeData: "VLDC-ASSET:VLĐC-ĐC-01|Geode 24-channel|Doan1",
    notes: "Đang thi công tuyến đo địa chấn phản xạ số 3.",
  },
  {
    id: "ast-002",
    code: "VLĐC-TT-01",
    name: "Máy đo từ thông Proton GSM-19T",
    category: "Từ - Trọng lực",
    model: "GSM-19T v7.0",
    serialNumber: "GEM-88321",
    manufacturerCountry: "Canada (GEM Systems)",
    yearOfManufacture: 2020,
    yearOfUse: 2021,
    originalPrice: 780000000,
    residualValue: 546000000,
    managingUnit: "Đoàn Địa vật lý 2",
    personInCharge: "Trần Đình Trọng (Kỹ sư Địa vật lý)",
    status: "active",
    currentLocation: "Kho máy Liên đoàn (Hà Nội)",
    currentProject: undefined,
    lastCalibrationDate: "2025-11-10",
    nextCalibrationDate: "2026-11-10", // Sắp hết hạn trong ~30 ngày (AST-09)
    calibrationStatus: "warning",
    lastUsedDate: "2026-08-20",
    usageDaysThisYear: 95,
    totalMaintenanceCost: 18000000,
    qrCodeData: "VLDC-ASSET:VLĐC-TT-01|GSM-19T|Doan2",
    notes: "Đã hiệu chuẩn trạm cơ sở, sẵn sàng điều động đợt đo mới.",
  },
  {
    id: "ast-003",
    code: "VLĐC-ĐĐ-02",
    name: "Hệ thống đo điện đa cực SuperSting R8/IP",
    category: "Điện - Điện từ",
    model: "SuperSting R8/IP/SP",
    serialNumber: "AGI-R8-0912",
    manufacturerCountry: "Mỹ (Advanced Geosciences)",
    yearOfManufacture: 2019,
    yearOfUse: 2020,
    originalPrice: 2200000000,
    residualValue: 1320000000,
    managingUnit: "Đoàn Địa vật lý 1",
    personInCharge: "Lê Văn Hùng (Chuyên gia Đo điện)",
    status: "in_use",
    currentLocation: "Vùng khoáng sản Bauxit Đắk Nông",
    currentProject: "Nhiệm vụ Điều tra đánh giá Bauxit Tây Nguyên",
    lastCalibrationDate: "2026-05-20",
    nextCalibrationDate: "2027-05-20",
    calibrationStatus: "valid",
    lastUsedDate: "2026-10-07",
    usageDaysThisYear: 190,
    totalMaintenanceCost: 62000000,
    qrCodeData: "VLDC-ASSET:VLĐC-ĐĐ-02|SuperSting-R8|Doan1",
    notes: "Hoạt động ổn định, 8 kênh đồng thời, kèm 56 điện cực cáp thông minh.",
  },
  {
    id: "ast-004",
    code: "VLĐC-TL-01",
    name: "Máy đo trọng lực Scintrex CG-5 Autograv",
    category: "Từ - Trọng lực",
    model: "CG-5 Autograv Microgal",
    serialNumber: "SCI-CG5-3012",
    manufacturerCountry: "Canada (Scintrex)",
    yearOfManufacture: 2018,
    yearOfUse: 2019,
    originalPrice: 1950000000,
    residualValue: 975000000,
    managingUnit: "Trung tâm Phân tích & Kỹ thuật",
    personInCharge: "Vũ Hải Đăng (Tiến sĩ Địa vật lý)",
    status: "repairing", // Đang bảo dưỡng xưởng (AST-04)
    currentLocation: "Xưởng Kỹ thuật Cơ điện Liên đoàn",
    currentProject: undefined,
    lastCalibrationDate: "2025-08-14",
    nextCalibrationDate: "2026-08-14",
    calibrationStatus: "expired",
    lastUsedDate: "2026-07-15",
    usageDaysThisYear: 60,
    totalMaintenanceCost: 85000000,
    qrCodeData: "VLDC-ASSET:VLĐC-TL-01|CG-5-Autograv|TTKT",
    notes: "Đang thay thế pin dự phòng và cân chỉnh độ trôi thạch anh cảm biến.",
  },
  {
    id: "ast-005",
    code: "VLĐC-CR-01",
    name: "Hệ thống đo Carota giếng khoan Robertson Matrix",
    category: "Đo Carota giếng khoan",
    model: "Micrologger Matrix II",
    serialNumber: "RG-MX-4481",
    manufacturerCountry: "Anh (Robertson Geologging)",
    yearOfManufacture: 2021,
    yearOfUse: 2022,
    originalPrice: 1680000000,
    residualValue: 1260000000,
    managingUnit: "Đoàn Địa vật lý 3",
    personInCharge: "Phạm Quốc Bảo (Kỹ sư Địa chất công trình)",
    status: "active",
    currentLocation: "Kho máy Liên đoàn (Hà Nội)",
    currentProject: undefined,
    lastCalibrationDate: "2026-02-18",
    nextCalibrationDate: "2027-02-18",
    calibrationStatus: "valid",
    lastUsedDate: "2026-05-10", // >90 ngày chưa dùng -> Cảnh báo ít sử dụng (AST-09)
    usageDaysThisYear: 42,
    totalMaintenanceCost: 22000000,
    qrCodeData: "VLDC-ASSET:VLĐC-CR-01|Matrix-II|Doan3",
    notes: "Tời cáp 500m, đầu thu nhiệt độ, điện trở dung dịch và suất điện động tự nhiên.",
  },
  {
    id: "ast-006",
    code: "VLĐC-ĐT-03",
    name: "Thiết bị đo điện từ trường chuyển tiếp TEM-FAST 48",
    category: "Điện - Điện từ",
    model: "TEM-FAST 48HPC",
    serialNumber: "AEM-TF-0199",
    manufacturerCountry: "Nga (AEMR Ltd)",
    yearOfManufacture: 2022,
    yearOfUse: 2023,
    originalPrice: 1350000000,
    residualValue: 1147500000,
    managingUnit: "Đoàn Địa vật lý 2",
    personInCharge: "Hoàng Minh Trí (Kỹ sư Điện từ)",
    status: "in_use",
    currentLocation: "Công trường Ba Chẽ (Quảng Ninh)",
    currentProject: "Nhiệm vụ Thăm dò nước ngầm vùng hải đảo ven biển",
    lastCalibrationDate: "2026-01-22",
    nextCalibrationDate: "2027-01-22",
    calibrationStatus: "valid",
    lastUsedDate: "2026-10-09",
    usageDaysThisYear: 140,
    totalMaintenanceCost: 12000000,
    qrCodeData: "VLDC-ASSET:VLĐC-ĐT-03|TEM-FAST-48|Doan2",
    notes: "Đo sâu chuyển tiếp tìm ranh giới xâm nhập mặn tầng ngầm.",
  },
  {
    id: "ast-007",
    code: "VLĐC-TĐ-04",
    name: "Máy định vị vệ tinh RTK GNSS Trimble R12",
    category: "Định vị vệ tinh GNSS",
    model: "Trimble R12 GNSS System",
    serialNumber: "TRM-R12-7720",
    manufacturerCountry: "Mỹ (Trimble)",
    yearOfManufacture: 2023,
    yearOfUse: 2023,
    originalPrice: 380000000,
    residualValue: 342000000,
    managingUnit: "Đoàn Địa vật lý 1",
    personInCharge: "Đặng Tiến Dũng (Trắc địa viên)",
    status: "active",
    currentLocation: "Kho máy Liên đoàn (Hà Nội)",
    currentProject: undefined,
    lastCalibrationDate: "2026-04-05",
    nextCalibrationDate: "2027-04-05",
    calibrationStatus: "valid",
    lastUsedDate: "2026-09-15",
    usageDaysThisYear: 115,
    totalMaintenanceCost: 8500000,
    qrCodeData: "VLDC-ASSET:VLĐC-TĐ-04|Trimble-R12|Doan1",
    notes: "Định vị điểm đo tọa độ độ chính xác cao milimet.",
  },
  {
    id: "ast-008",
    code: "VLĐC-PĐ-01",
    name: "Máy phát điện dã ngoại Honda EU30is",
    category: "Máy phát điện - Phụ trợ",
    model: "EU30is Inverter",
    serialNumber: "HON-EU30-5519",
    manufacturerCountry: "Nhật Bản (Honda)",
    yearOfManufacture: 2020,
    yearOfUse: 2020,
    originalPrice: 75000000,
    residualValue: 45000000,
    managingUnit: "Đoàn Địa vật lý 2",
    personInCharge: "Nguyễn Văn Đạt (Kỹ thuật viên)",
    status: "in_use",
    currentLocation: "Công trường Mỏ Chợ Điền (Bắc Kạn)",
    currentProject: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền",
    lastCalibrationDate: "2025-10-15",
    nextCalibrationDate: "2026-10-15", // Sắp hết hạn trong vài ngày
    calibrationStatus: "warning",
    lastUsedDate: "2026-10-09",
    usageDaysThisYear: 180,
    totalMaintenanceCost: 15000000,
    qrCodeData: "VLDC-ASSET:VLĐC-PĐ-01|Honda-EU30is|Doan2",
    notes: "Cấp nguồn ổn định 3kW cho trạm đo địa chấn và điện trở.",
  },
]

export const INITIAL_CALIBRATIONS: CalibrationRecord[] = [
  {
    id: "cal-001",
    assetId: "ast-001",
    assetCode: "VLĐC-ĐC-01",
    assetName: "Máy đo địa chấn 24 kênh Geode",
    calibrationDate: "2026-03-15",
    expirationDate: "2027-03-15",
    calibrationUnit: "Viện Đo lường Việt Nam (VMI)",
    certificateNumber: "VMI-2026-ĐC-0891",
    result: "passed",
    cost: 15000000,
    notes: "Đạt chuẩn sai số biên độ và độ trễ thời gian kênh theo TCVN.",
  },
  {
    id: "cal-002",
    assetId: "ast-002",
    assetCode: "VLĐC-TT-01",
    assetName: "Máy đo từ thông Proton GSM-19T",
    calibrationDate: "2025-11-10",
    expirationDate: "2026-11-10",
    calibrationUnit: "Trung tâm Kiểm định Địa vật lý & Môi trường",
    certificateNumber: "KĐ-VLDC-2025-77",
    result: "passed",
    cost: 12000000,
    notes: "Độ nhạy 0.05 nT, sai số gradient tuyệt đối trong hạn định cho phép.",
  },
  {
    id: "cal-003",
    assetId: "ast-003",
    assetCode: "VLĐC-ĐĐ-02",
    assetName: "Hệ thống đo điện đa cực SuperSting R8/IP",
    calibrationDate: "2026-05-20",
    expirationDate: "2027-05-20",
    calibrationUnit: "Viện Đo lường Việt Nam (VMI)",
    certificateNumber: "VMI-2026-ĐĐ-1024",
    result: "passed",
    cost: 25000000,
    notes: "Kiểm định trọn bộ máy phát xung và 8 bộ tiền khuếch đại điện trường.",
  },
  {
    id: "cal-004",
    assetId: "ast-004",
    assetCode: "VLĐC-TL-01",
    assetName: "Máy đo trọng lực Scintrex CG-5 Autograv",
    calibrationDate: "2025-08-14",
    expirationDate: "2026-08-14",
    calibrationUnit: "Cục Đo đạc Bản đồ & Thông tin Địa lý",
    certificateNumber: "KĐ-TL-2025-004",
    result: "failed",
    cost: 18000000,
    notes: "Phát hiện hệ số trôi tĩnh dạt quá 0.02 mGal/ngày. Chuyển xưởng bảo dưỡng.",
  },
  {
    id: "cal-005",
    assetId: "ast-005",
    assetCode: "VLĐC-CR-01",
    assetName: "Hệ thống đo Carota giếng khoan Robertson Matrix",
    calibrationDate: "2026-02-18",
    expirationDate: "2027-02-18",
    calibrationUnit: "Trung tâm Kiểm định Đo lường Kỹ thuật",
    certificateNumber: "GCN-CR-2026-11",
    result: "passed",
    cost: 16000000,
    notes: "Đầu đo gamma tự nhiên và điện trở biểu kiến đạt chuẩn hiệu chuẩn.",
  },
]

export const INITIAL_MAINTENANCES: MaintenanceRecord[] = [
  {
    id: "mnt-001",
    code: "SC-2026/001",
    assetId: "ast-004",
    assetCode: "VLĐC-TL-01",
    assetName: "Máy đo trọng lực Scintrex CG-5 Autograv",
    startDate: "2026-08-20",
    endDate: undefined,
    type: "repair",
    description: "Khắc phục hiện tượng trôi dạt điểm không cảm biến thạch anh; thay thế cell pin Lithium dự phòng",
    sparePartsReplaced: ["Pin phụ CG-5 Li-Ion 10.8V", "Vòng đệm làm kín buồng cảm biến chân không"],
    serviceProvider: "Xưởng Cơ điện Liên đoàn & Đại diện Hãng Scintrex",
    cost: 48000000,
    status: "in_progress",
  },
  {
    id: "mnt-002",
    code: "SC-2026/002",
    assetId: "ast-003",
    assetCode: "VLĐC-ĐĐ-02",
    assetName: "Hệ thống đo điện đa cực SuperSting R8/IP",
    startDate: "2026-05-02",
    endDate: "2026-05-12",
    type: "periodic",
    description: "Bảo dưỡng định kỳ trước mùa thi công: kiểm tra 56 tiếp điểm cáp thông minh, phủ keo cách điện hộp chia",
    sparePartsReplaced: ["04 jack cắm Amphenol 32 chân", "Dây cáp bọc cao su chịu lực 20m"],
    serviceProvider: "Xưởng Kỹ thuật Cơ điện Liên đoàn",
    cost: 14000000,
    status: "completed",
  },
  {
    id: "mnt-003",
    code: "SC-2026/003",
    assetId: "ast-001",
    assetCode: "VLĐC-ĐC-01",
    assetName: "Máy đo địa chấn 24 kênh Geode",
    startDate: "2026-03-01",
    endDate: "2026-03-08",
    type: "periodic",
    description: "Kiểm tra độ nhạy chuỗi 24 đầu thu địa chấn Geophone 10Hz, làm sạch mạch tiếp xúc ngàm cáp tín hiệu",
    sparePartsReplaced: ["02 đầu thu Geophone đứng 10Hz", "01 giắc cáp 24 kênh chống nước"],
    serviceProvider: "Xưởng Kỹ thuật Cơ điện Liên đoàn",
    cost: 9500000,
    status: "completed",
  },
]

export const INITIAL_DISPATCHES: DispatchRecord[] = [
  {
    id: "dsp-001",
    dispatchCode: "ĐĐ-2026/001",
    assetId: "ast-001",
    assetCode: "VLĐC-ĐC-01",
    assetName: "Máy đo địa chấn 24 kênh Geode",
    originUnit: "Kho máy Liên đoàn (Hà Nội)",
    destinationUnit: "Đoàn Địa vật lý 1",
    projectName: "Đề án Thăm dò khoáng sản kim loại vùng Chợ Điền",
    startDate: "2026-08-01",
    expectedEndDate: "2026-11-15",
    requestedBy: "Đoàn trưởng Đoàn 1",
    approver: "Phó Liên đoàn trưởng phụ trách Kỹ thuật",
    receiverName: "Nguyễn Văn Tuấn (Kỹ sư)",
    status: "dispatched",
    hasConflict: false,
    notes: "Đang thi công tuyến địa chấn nông phân giải cao Chợ Điền.",
    estimatedCost: 160000000,
    dailyRate: 1500000,
  },
  {
    id: "dsp-002",
    dispatchCode: "ĐĐ-2026/002",
    assetId: "ast-003",
    assetCode: "VLĐC-ĐĐ-02",
    assetName: "Hệ thống đo điện đa cực SuperSting R8/IP",
    originUnit: "Kho máy Liên đoàn (Hà Nội)",
    destinationUnit: "Đoàn Địa vật lý 1",
    projectName: "Nhiệm vụ Điều tra đánh giá Bauxit Tây Nguyên",
    startDate: "2026-07-15",
    expectedEndDate: "2026-10-30",
    requestedBy: "Đoàn trưởng Đoàn 1",
    approver: "Liên đoàn trưởng",
    receiverName: "Lê Văn Hùng (Chuyên gia)",
    status: "dispatched",
    hasConflict: false,
    notes: "Đo điện ảnh 2D và nạp điện trường IP phục vụ phân tầng quặng bauxit.",
    estimatedCost: 220000000,
    dailyRate: 2000000,
  },
  {
    id: "dsp-003",
    dispatchCode: "ĐĐ-2026/003",
    assetId: "ast-001", // CỐ Ý TRÙNG MÁY AST-001 ĐỂ MINH HỌA XUNG ĐỘT (AST-06)
    assetCode: "VLĐC-ĐC-01",
    assetName: "Máy đo địa chấn 24 kênh Geode",
    originUnit: "Kho máy Liên đoàn (Hà Nội)",
    destinationUnit: "Đoàn Địa vật lý 2",
    projectName: "Đề án Khảo sát đứt gãy kiến tạo Tây Bắc",
    startDate: "2026-10-15",
    expectedEndDate: "2026-11-30",
    requestedBy: "Đoàn trưởng Đoàn 2",
    receiverName: "Trần Đình Trọng (Kỹ sư)",
    status: "pending_approval",
    hasConflict: true, // XUNG ĐỘT VỚI LỆNH ĐĐ-2026/001 ĐANG DÙNG TẠI CHỢ ĐIỀN ĐẾN 15/11
    conflictReason: "Xung đột lịch: Máy đo địa chấn Geode đang được Đoàn 1 sử dụng tại Chợ Điền đến hết ngày 15/11/2026!",
    notes: "Cần xem xét bố trí lùi thời gian hoặc điều động máy 48 kênh thay thế.",
    estimatedCost: 70000000,
    dailyRate: 1500000,
  },
]

// ============ ASSETS CRUD ============
export function getAssets(): GeophysicalAsset[] {
  const data = readStore<GeophysicalAsset>(ASSETS_KEY, [])
  if (!data || data.length === 0) {
    writeStore(ASSETS_KEY, INITIAL_ASSETS)
    return INITIAL_ASSETS
  }
  return data
}

export function getAssetById(id: string): GeophysicalAsset | undefined {
  return getAssets().find((a) => a.id === id)
}

export function saveAsset(asset: GeophysicalAsset): GeophysicalAsset {
  const current = getAssets()
  const index = current.findIndex((a) => a.id === asset.id)
  let updated: GeophysicalAsset[]
  if (index >= 0) {
    updated = [...current]
    updated[index] = asset
  } else {
    updated = [asset, ...current]
  }
  writeStore(ASSETS_KEY, updated)
  return asset
}

export function deleteAsset(id: string): void {
  const current = getAssets()
  const updated = current.filter((a) => a.id !== id)
  writeStore(ASSETS_KEY, updated)
}

// ============ CALIBRATIONS ============
export function getCalibrations(): CalibrationRecord[] {
  const data = readStore<CalibrationRecord>(CALIBRATIONS_KEY, [])
  if (!data || data.length === 0) {
    writeStore(CALIBRATIONS_KEY, INITIAL_CALIBRATIONS)
    return INITIAL_CALIBRATIONS
  }
  return data
}

export function addCalibration(record: Omit<CalibrationRecord, "id">): CalibrationRecord {
  const current = getCalibrations()
  const newRec: CalibrationRecord = { ...record, id: newLocalId("cal") }
  writeStore(CALIBRATIONS_KEY, [newRec, ...current])

  // Cập nhật ngày kiểm định mới vào hồ sơ tài sản
  const assets = getAssets()
  const asset = assets.find((a) => a.id === record.assetId)
  if (asset) {
    asset.lastCalibrationDate = record.calibrationDate
    asset.nextCalibrationDate = record.expirationDate
    asset.calibrationStatus = "valid"
    saveAsset(asset)
  }

  return newRec
}

// ============ MAINTENANCES ============
export function getMaintenances(): MaintenanceRecord[] {
  const data = readStore<MaintenanceRecord>(MAINTENANCES_KEY, [])
  if (!data || data.length === 0) {
    writeStore(MAINTENANCES_KEY, INITIAL_MAINTENANCES)
    return INITIAL_MAINTENANCES
  }
  return data
}

export function addMaintenance(record: Omit<MaintenanceRecord, "id">): MaintenanceRecord {
  const current = getMaintenances()
  const newRec: MaintenanceRecord = { ...record, id: newLocalId("mnt") }
  writeStore(MAINTENANCES_KEY, [newRec, ...current])

  // Cập nhật trạng thái và chi phí máy
  const assets = getAssets()
  const asset = assets.find((a) => a.id === record.assetId)
  if (asset) {
    if (record.status !== "completed") {
      asset.status = "repairing"
    } else {
      asset.status = "active"
    }
    asset.totalMaintenanceCost += record.cost
    saveAsset(asset)
  }

  return newRec
}

// ============ DISPATCHES & CONFLICT DETECTION (AST-05, AST-06) ============
export function getDispatches(): DispatchRecord[] {
  const data = readStore<DispatchRecord>(DISPATCHES_KEY, [])
  if (!data || data.length === 0) {
    writeStore(DISPATCHES_KEY, INITIAL_DISPATCHES)
    return INITIAL_DISPATCHES
  }
  return data
}

export function checkDispatchConflict(
  assetId: string,
  startDate: string,
  expectedEndDate: string,
  excludeDispatchId?: string
): { hasConflict: boolean; reason?: string } {
  const dispatches = getDispatches()
  const activeDispatches = dispatches.filter(
    (d) =>
      d.assetId === assetId &&
      d.id !== excludeDispatchId &&
      (d.status === "dispatched" || d.status === "approved" || d.status === "pending_approval")
  )

  const reqStart = new Date(startDate).getTime()
  const reqEnd = new Date(expectedEndDate).getTime()

  for (const d of activeDispatches) {
    const dStart = new Date(d.startDate).getTime()
    const dEnd = new Date(d.expectedEndDate).getTime()

    // Kiểm tra khoảng thời gian giao nhau
    if (reqStart <= dEnd && reqEnd >= dStart) {
      return {
        hasConflict: true,
        reason: `Xung đột: Thiết bị đang có lịch sử dụng tại [${d.destinationUnit} - ${d.projectName}] từ ${d.startDate} đến ${d.expectedEndDate}!`,
      }
    }
  }

  // Kiểm tra nếu thiết bị đang hỏng/sửa chữa
  const assets = getAssets()
  const asset = assets.find((a) => a.id === assetId)
  if (asset && asset.status === "repairing") {
    return {
      hasConflict: true,
      reason: `Cảnh báo: Thiết bị đang trong tình trạng [Đang sửa chữa/Bảo dưỡng] tại Xưởng.`,
    }
  }

  return { hasConflict: false }
}

export function createDispatch(
  record: Omit<DispatchRecord, "id" | "dispatchCode" | "hasConflict" | "conflictReason">
): DispatchRecord {
  const current = getDispatches()
  const conflictCheck = checkDispatchConflict(record.assetId, record.startDate, record.expectedEndDate)
  const code = `ĐĐ-2026/${String(current.length + 1).padStart(3, "0")}`

  const newRec: DispatchRecord = {
    ...record,
    id: newLocalId("dsp"),
    dispatchCode: code,
    hasConflict: conflictCheck.hasConflict,
    conflictReason: conflictCheck.reason,
  }

  writeStore(DISPATCHES_KEY, [newRec, ...current])
  return newRec
}

export function updateDispatchStatus(
  id: string,
  status: DispatchRecord["status"],
  approverName?: string
): void {
  const current = getDispatches()
  const target = current.find((d) => d.id === id)
  if (!target) return

  target.status = status
  if (approverName) target.approver = approverName

  // Nếu điều động thành công, cập nhật vị trí và dự án của thiết bị (AST-07, AST-08)
  if (status === "dispatched") {
    const assets = getAssets()
    const asset = assets.find((a) => a.id === target.assetId)
    if (asset) {
      asset.status = "in_use"
      asset.currentLocation = `Công trường ${target.destinationUnit}`
      asset.currentProject = target.projectName
      asset.lastUsedDate = new Date().toISOString().slice(0, 10)
      saveAsset(asset)
    }
  } else if (status === "returned") {
    const assets = getAssets()
    const asset = assets.find((a) => a.id === target.assetId)
    if (asset) {
      asset.status = "active"
      asset.currentLocation = "Kho máy Liên đoàn (Hà Nội)"
      asset.currentProject = undefined
      saveAsset(asset)
    }
  }

  writeStore(DISPATCHES_KEY, current)
}

// ============ ANALYTICS & KPIS (AST-09, AST-10, AST-11) ============
export function calculateAssetKPIs() {
  const assets = getAssets()
  const total = assets.length
  const activeCount = assets.filter((a) => a.status === "active").length
  const inUseCount = assets.filter((a) => a.status === "in_use").length
  const repairingCount = assets.filter((a) => a.status === "repairing").length
  const calibratingCount = assets.filter((a) => a.status === "calibrating").length

  // Tỷ lệ sẵn sàng hoạt động (Availability Rate %): (Sẵn sàng + Đang dùng) / Tổng số máy
  const operationalCount = activeCount + inUseCount
  const availabilityRate = total > 0 ? Math.round((operationalCount / total) * 100) : 0

  // Tỷ lệ sử dụng (Utilization Rate %): Đang dùng / Máy hoạt động tốt
  const utilizationRate = operationalCount > 0 ? Math.round((inUseCount / operationalCount) * 100) : 0

  // Thiết bị cảnh báo kiểm định (AST-09)
  const calibrationWarnings = assets.filter(
    (a) => a.calibrationStatus === "warning" || a.calibrationStatus === "expired"
  )

  // Thiết bị ít sử dụng (> 90 ngày chưa dùng) (AST-09)
  const now = new Date()
  const idleAssets = assets.filter((a) => {
    if (a.status === "in_use") return false
    const lastDate = new Date(a.lastUsedDate)
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24))
    return diffDays > 90
  })

  // Tổng nguyên giá và tổng chi phí bảo dưỡng
  const totalOriginalValue = assets.reduce((sum, a) => sum + a.originalPrice, 0)
  const totalMaintenanceCost = assets.reduce((sum, a) => sum + a.totalMaintenanceCost, 0)

  return {
    total,
    activeCount,
    inUseCount,
    repairingCount,
    calibratingCount,
    availabilityRate,
    utilizationRate,
    calibrationWarnings,
    idleAssets,
    totalOriginalValue,
    totalMaintenanceCost,
  }
}
