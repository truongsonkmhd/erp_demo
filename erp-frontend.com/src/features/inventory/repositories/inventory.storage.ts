import type {
  GoodsIssue,
  GoodsReceipt,
  InventoryTransaction,
  Material,
  StockAlert,
  StockBatch,
  StockThreshold,
  StockTransfer,
  Warehouse,
} from "../types/inventory.types"
import { DEFAULT_WAREHOUSES } from "../types/inventory.constants"

const KEYS = {
  MATERIALS: "erp:inventory:materials:v1",
  WAREHOUSES: "erp:inventory:warehouses:v1",
  BATCHES: "erp:inventory:batches:v1",
  RECEIPTS: "erp:inventory:receipts:v1",
  ISSUES: "erp:inventory:issues:v1",
  TRANSFERS: "erp:inventory:transfers:v1",
  LEDGER: "erp:inventory:ledger:v1",
  THRESHOLDS: "erp:inventory:thresholds:v1",
  ALERTS: "erp:inventory:alerts:v1",
}

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
    console.error(`Error loading storage key ${key}, falling back to seed:`, err)
    const initial = seed()
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }
}

function safeSet<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`Failed to write to localStorage for key ${key}:`, err)
  }
}

// ================= SEED DATA =================
function seedMaterials(): Material[] {
  const now = "2026-09-01T08:00:00.000Z"
  return [
    {
      id: "mat-1",
      code: "VT-GSM19",
      name: "Máy đo từ trường proton GSM-19T",
      category: "Thiết bị đo từ, trọng lực, điện chuyên dụng",
      specification: "Độ nhạy 0.05 nT, tích hợp GPS độ chính xác cao, dải đo 20.000 - 120.000 nT",
      unit: "Bộ",
      manageByBatch: true,
      manageByExpiry: false,
      defaultMinStock: 2,
      defaultMaxStock: 8,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-2",
      code: "VT-CAP24",
      name: "Cáp đo địa chấn phản xạ 24 kênh",
      category: "Cáp đo địa chấn, geophone & phụ kiện",
      specification: "Chiều dài 240m, khoảng cách kênh 10m, bọc polyurethane kháng xé chịu nước mặn",
      unit: "Cuộn",
      manageByBatch: true,
      manageByExpiry: false,
      defaultMinStock: 4,
      defaultMaxStock: 15,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-3",
      code: "VT-GEO10",
      name: "Đầu thu sóng địa chấn Geophone 10Hz",
      category: "Cáp đo địa chấn, geophone & phụ kiện",
      specification: "Tần số riêng 10Hz ± 5%, cuộn dây trở kháng 375 Ohm, kèm cọc cắm thép dã ngoại",
      unit: "Bộ",
      manageByBatch: true,
      manageByExpiry: false,
      defaultMinStock: 5,
      defaultMaxStock: 25,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-4",
      code: "VT-TRM12",
      name: "Thiết bị định vị Trimble R12i GNSS RTK",
      category: "Thiết bị định vị DGPS & máy thu vệ tinh",
      specification: "Theo dõi đa vệ tinh, bù nghiêng quán tính TIP, sai số động học ngang 8mm+1ppm",
      unit: "Bộ",
      manageByBatch: true,
      manageByExpiry: false,
      defaultMinStock: 2,
      defaultMaxStock: 6,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-5",
      code: "VT-PIN100",
      name: "Pin Lithium LiFePO4 12V-100Ah",
      category: "Pin lithium & nguồn năng lượng trạm đo",
      specification: "Chu kỳ nạp xả >3.000 lần, dòng xả tức thời 150A, vỏ chống nước IP67",
      unit: "Cái",
      manageByBatch: true,
      manageByExpiry: true,
      defaultMinStock: 6,
      defaultMaxStock: 30,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-6",
      code: "VT-CUSO4",
      name: "Hóa chất tạo tiếp địa điện trở CuSO4",
      category: "Vật tư tiêu hao, hóa chất dã ngoại",
      specification: "Độ tinh khiết 98%, tinh thể xanh lam hòa tan ngâm điện cực trạm điện mặt đất",
      unit: "Kg",
      manageByBatch: true,
      manageByExpiry: true,
      defaultMinStock: 100,
      defaultMaxStock: 500,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-7",
      code: "VT-CUC-DK",
      name: "Cực đo điện không phân cực Cu/CuSO4",
      category: "Thiết bị đo từ, trọng lực, điện chuyên dụng",
      specification: "Vỏ sứ xốp thấm hút, độ lệch thế trôi <1mV, kèm dung dịch châm bổ sung",
      unit: "Bộ",
      manageByBatch: false,
      manageByExpiry: false,
      defaultMinStock: 10,
      defaultMaxStock: 40,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "mat-8",
      code: "VT-PLB-SEA",
      name: "Bộ phao & định vị khẩn cấp PLB dã ngoại biển",
      category: "Trang bị bảo hộ lao động thực địa",
      specification: "Phao tự bung CO2 khí quyển kèm thiết bị phát sóng định vị cứu nạn Cospas-Sarsat 406MHz",
      unit: "Bộ",
      manageByBatch: true,
      manageByExpiry: true,
      defaultMinStock: 15,
      defaultMaxStock: 50,
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function seedWarehouses(): Warehouse[] {
  const now = "2026-09-01T08:00:00.000Z"
  return DEFAULT_WAREHOUSES.map((w, idx) => ({
    id: `wh-${idx + 1}`,
    code: w.code,
    name: w.name,
    managingDepartment: w.managingDepartment,
    address: w.address,
    managerName: w.managerName,
    managerPhone: w.managerPhone,
    status: "active",
    locations: [
      { id: `loc-${idx}-1`, code: `K${idx + 1}-A01`, name: "Kệ chính tầng 1" },
      { id: `loc-${idx}-2`, code: `K${idx + 1}-A02`, name: "Kệ chính tầng 2" },
      { id: `loc-${idx}-3`, code: `K${idx + 1}-B01`, name: "Khu vực hàng nhạy cảm / máy đo" },
    ],
    createdAt: now,
    updatedAt: now,
  }))
}

function seedBatches(): StockBatch[] {
  return [
    {
      id: "bat-1",
      batchNumber: "LO-2026-GSM01",
      materialId: "mat-1",
      materialCode: "VT-GSM19",
      materialName: "Máy đo từ trường proton GSM-19T",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      locationCode: "K1-B01",
      sourceType: "contract",
      sourceReferenceCode: "HDMS-2026-0001",
      manufacturingDate: "2026-01-10",
      initialQuantity: 3,
      unitPrice: 160000000,
      status: "active",
      createdAt: "2026-09-10T08:00:00.000Z",
    },
    {
      id: "bat-2",
      batchNumber: "LO-2026-CAP01",
      materialId: "mat-2",
      materialCode: "VT-CAP24",
      materialName: "Cáp đo địa chấn phản xạ 24 kênh",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      locationCode: "K3-A01",
      sourceType: "contract",
      sourceReferenceCode: "HDMS-2026-0002",
      manufacturingDate: "2026-02-15",
      initialQuantity: 8,
      unitPrice: 22000000,
      status: "active",
      createdAt: "2026-09-12T08:00:00.000Z",
    },
    {
      id: "bat-3",
      batchNumber: "LO-2026-PIN01",
      materialId: "mat-5",
      materialCode: "VT-PIN100",
      materialName: "Pin Lithium LiFePO4 12V-100Ah",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      locationCode: "K1-A02",
      sourceType: "contract",
      manufacturingDate: "2025-11-01",
      expiryDate: "2026-10-25", // Sắp hết hạn trong tháng 10/2026
      initialQuantity: 10,
      unitPrice: 7500000,
      status: "active",
      createdAt: "2026-09-05T08:00:00.000Z",
    },
    {
      id: "bat-4",
      batchNumber: "LO-2025-CUSO4",
      materialId: "mat-6",
      materialCode: "VT-CUSO4",
      materialName: "Hóa chất tạo tiếp địa điện trở CuSO4",
      warehouseId: "wh-4",
      warehouseCode: "KHO-MAT-DAT",
      locationCode: "K4-A01",
      sourceType: "contract",
      manufacturingDate: "2025-01-01",
      expiryDate: "2026-08-30", // Đã quá hạn
      initialQuantity: 50,
      unitPrice: 45000,
      status: "expired",
      createdAt: "2026-09-01T08:00:00.000Z",
    },
    {
      id: "bat-5",
      batchNumber: "LO-2026-PLB01",
      materialId: "mat-8",
      materialCode: "VT-PLB-SEA",
      materialName: "Bộ phao & định vị khẩn cấp PLB dã ngoại biển",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      locationCode: "K3-A02",
      sourceType: "contract",
      manufacturingDate: "2026-03-01",
      expiryDate: "2028-03-01",
      initialQuantity: 20,
      unitPrice: 4800000,
      status: "active",
      createdAt: "2026-09-15T08:00:00.000Z",
    },
  ]
}

function seedTransactions(): InventoryTransaction[] {
  return [
    // 1. Nhập ban đầu máy GSM-19T vào Kho Tổng
    {
      id: "tx-1",
      transactionCode: "GD-NK-0001",
      type: "receipt",
      sourceDocumentType: "receipt",
      sourceDocumentId: "rc-1",
      sourceDocumentCode: "PNK-2026-0001",
      materialId: "mat-1",
      materialCode: "VT-GSM19",
      materialName: "Máy đo từ trường proton GSM-19T",
      batchNumber: "LO-2026-GSM01",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      warehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
      locationCode: "K1-B01",
      quantity: 3,
      unitPrice: 160000000,
      totalAmount: 480000000,
      timestamp: "2026-09-10T09:30:00.000Z",
      postedBy: "Trần Văn Toàn (Thủ kho chính)",
      notes: "Nhập mới từ Hợp đồng HDMS-2026-0001",
    },
    // 2. Nhập Cáp đo 24 kênh vào Kho Biển
    {
      id: "tx-2",
      transactionCode: "GD-NK-0002",
      type: "receipt",
      sourceDocumentType: "receipt",
      sourceDocumentId: "rc-2",
      sourceDocumentCode: "PNK-2026-0002",
      materialId: "mat-2",
      materialCode: "VT-CAP24",
      materialName: "Cáp đo địa chấn phản xạ 24 kênh",
      batchNumber: "LO-2026-CAP01",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      warehouseName: "Kho Thiết bị & Cáp đo Biển",
      locationCode: "K3-A01",
      quantity: 8,
      unitPrice: 22000000,
      totalAmount: 176000000,
      timestamp: "2026-09-12T10:15:00.000Z",
      postedBy: "Trần Hữu Kiên",
      notes: "Nhập mới từ HĐ Cung cấp thiết bị khảo sát biển",
    },
    // 3. Xuất 2 cuộn Cáp đo Biển phục vụ đề án khảo sát địa chấn
    {
      id: "tx-3",
      transactionCode: "GD-XK-0001",
      type: "issue",
      sourceDocumentType: "issue",
      sourceDocumentId: "is-1",
      sourceDocumentCode: "PXK-2026-0001",
      materialId: "mat-2",
      materialCode: "VT-CAP24",
      materialName: "Cáp đo địa chấn phản xạ 24 kênh",
      batchNumber: "LO-2026-CAP01",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      warehouseName: "Kho Thiết bị & Cáp đo Biển",
      locationCode: "K3-A01",
      quantity: 2,
      unitPrice: 22000000,
      totalAmount: 44000000,
      timestamp: "2026-09-20T14:00:00.000Z",
      postedBy: "Trần Hữu Kiên",
      projectName: "Khảo sát Địa chấn Nông phân giải cao vùng biển Nam Trung Bộ",
      projectItem: "Thi công tuyến địa chấn biển dã ngoại đợt 1",
      notes: "Xuất cấp thi công hiện trường biển",
    },
    // 4. Nhập Pin Lithium vào Kho Tổng
    {
      id: "tx-4",
      transactionCode: "GD-NK-0003",
      type: "receipt",
      sourceDocumentType: "receipt",
      sourceDocumentId: "rc-3",
      sourceDocumentCode: "PNK-2026-0003",
      materialId: "mat-5",
      materialCode: "VT-PIN100",
      materialName: "Pin Lithium LiFePO4 12V-100Ah",
      batchNumber: "LO-2026-PIN01",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      warehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
      locationCode: "K1-A02",
      quantity: 10,
      unitPrice: 7500000,
      totalAmount: 75000000,
      timestamp: "2026-09-05T08:30:00.000Z",
      postedBy: "Trần Văn Toàn",
      notes: "Nhập pin dự phòng trạm đo",
    },
    // 5. Nhập Hóa chất CuSO4 vào Kho Mặt đất (lô cũ)
    {
      id: "tx-5",
      transactionCode: "GD-NK-0004",
      type: "receipt",
      sourceDocumentType: "receipt",
      sourceDocumentId: "rc-4",
      sourceDocumentCode: "PNK-2026-0004",
      materialId: "mat-6",
      materialCode: "VT-CUSO4",
      materialName: "Hóa chất tạo tiếp địa điện trở CuSO4",
      batchNumber: "LO-2025-CUSO4",
      warehouseId: "wh-4",
      warehouseCode: "KHO-MAT-DAT",
      warehouseName: "Kho Vật tư Địa vật lý Mặt đất",
      locationCode: "K4-A01",
      quantity: 50,
      unitPrice: 45000,
      totalAmount: 2250000,
      timestamp: "2026-09-01T08:30:00.000Z",
      postedBy: "Hoàng Văn Thái",
      notes: "Tồn đầu kỳ chuyển sang",
    },
    // 6. Nhập Phao PLB vào Kho Biển
    {
      id: "tx-6",
      transactionCode: "GD-NK-0005",
      type: "receipt",
      sourceDocumentType: "receipt",
      sourceDocumentId: "rc-5",
      sourceDocumentCode: "PNK-2026-0005",
      materialId: "mat-8",
      materialCode: "VT-PLB-SEA",
      materialName: "Bộ phao & định vị khẩn cấp PLB dã ngoại biển",
      batchNumber: "LO-2026-PLB01",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      warehouseName: "Kho Thiết bị & Cáp đo Biển",
      locationCode: "K3-A02",
      quantity: 20,
      unitPrice: 4800000,
      totalAmount: 96000000,
      timestamp: "2026-09-15T09:00:00.000Z",
      postedBy: "Trần Hữu Kiên",
      notes: "Trang bị an toàn hải trình",
    },
  ]
}

function seedReceipts(): GoodsReceipt[] {
  return [
    {
      id: "rc-1",
      code: "PNK-2026-0001",
      receiptDate: "2026-09-10",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      warehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
      supplierId: "ncc-1",
      supplierName: "Công ty CP Thiết bị Đo đạc & Địa vật lý Geotech",
      contractId: "ct-1",
      contractNumber: "HDMS-2026-0001",
      requestCode: "DXMS-2026-0001",
      delivererName: "Đặng Tiến Dũng (Giao hàng Geotech)",
      delivererPhone: "0912.445.667",
      receiverName: "Trần Văn Toàn (Thủ kho chính)",
      status: "posted",
      totalQuantity: 3,
      totalAmount: 480000000,
      postedAt: "2026-09-10T09:30:00.000Z",
      postedBy: "Trần Văn Toàn",
      createdAt: "2026-09-10T08:00:00.000Z",
      updatedAt: "2026-09-10T09:30:00.000Z",
      lines: [
        {
          id: "rcl-1",
          materialId: "mat-1",
          materialCode: "VT-GSM19",
          materialName: "Máy đo từ trường proton GSM-19T",
          unit: "Bộ",
          orderedQuantity: 3,
          receivedQuantity: 3,
          unitPrice: 160000000,
          totalAmount: 480000000,
          batchNumber: "LO-2026-GSM01",
          manufacturingDate: "2026-01-10",
          locationCode: "K1-B01",
          qualityStatus: "passed",
          notes: "Nguyên đai nguyên kiện, chứng chỉ CO/CQ Canada đầy đủ",
        },
      ],
    },
    {
      id: "rc-2",
      code: "PNK-2026-0002",
      receiptDate: "2026-09-12",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      warehouseName: "Kho Thiết bị & Cáp đo Biển",
      supplierName: "Công ty TNHH Cáp & Cảm biến Hàng hải Seacable",
      contractNumber: "HDMS-2026-0002",
      delivererName: "Nguyễn Tuấn Anh",
      receiverName: "Trần Hữu Kiên",
      status: "posted",
      totalQuantity: 8,
      totalAmount: 176000000,
      postedAt: "2026-09-12T10:15:00.000Z",
      postedBy: "Trần Hữu Kiên",
      createdAt: "2026-09-12T09:00:00.000Z",
      updatedAt: "2026-09-12T10:15:00.000Z",
      lines: [
        {
          id: "rcl-2",
          materialId: "mat-2",
          materialCode: "VT-CAP24",
          materialName: "Cáp đo địa chấn phản xạ 24 kênh",
          unit: "Cuộn",
          orderedQuantity: 8,
          receivedQuantity: 8,
          unitPrice: 22000000,
          totalAmount: 176000000,
          batchNumber: "LO-2026-CAP01",
          locationCode: "K3-A01",
          qualityStatus: "passed",
        },
      ],
    },
  ]
}

function seedIssues(): GoodsIssue[] {
  return [
    {
      id: "is-1",
      code: "PXK-2026-0001",
      issueDate: "2026-09-20",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      warehouseName: "Kho Thiết bị & Cáp đo Biển",
      projectName: "Khảo sát Địa chấn Nông phân giải cao vùng biển Nam Trung Bộ",
      projectItem: "Thi công tuyến địa chấn biển dã ngoại đợt 1",
      department: "Đoàn Địa vật lý Biển",
      receiverName: "Kỹ sư Lê Hoàng Nam (Tổ trưởng tuyến đo)",
      status: "issued",
      totalQuantity: 2,
      totalAmount: 44000000,
      reason: "Cấp bổ sung tuyến cáp địa chấn ngoài khơi vùng biển Nha Trang",
      issuedAt: "2026-09-20T14:00:00.000Z",
      issuedBy: "Trần Hữu Kiên",
      createdAt: "2026-09-19T08:00:00.000Z",
      updatedAt: "2026-09-20T14:00:00.000Z",
      lines: [
        {
          id: "isl-1",
          materialId: "mat-2",
          materialCode: "VT-CAP24",
          materialName: "Cáp đo địa chấn phản xạ 24 kênh",
          unit: "Cuộn",
          requestedQuantity: 2,
          approvedQuantity: 2,
          actualQuantity: 2,
          unitPrice: 22000000,
          totalAmount: 44000000,
          batchNumber: "LO-2026-CAP01",
          locationCode: "K3-A01",
        },
      ],
    },
    {
      id: "is-2",
      code: "PXK-2026-0002",
      issueDate: "2026-10-02",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      warehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
      projectName: "Bay đo Từ - Trọng lực tỷ lệ 1:50.000 khu vực Tây Bắc",
      projectItem: "Trạm đo biến thiên từ trường cơ sở dã ngoại",
      department: "Đoàn Địa vật lý Máy bay",
      receiverName: "Kỹ sư Vũ Thành Trung",
      status: "approved", // Phiếu đã duyệt -> Giữ chỗ 1 bộ GSM-19T
      totalQuantity: 1,
      totalAmount: 160000000,
      reason: "Thiết lập trạm base từ trường tại Điện Biên",
      createdAt: "2026-10-02T10:00:00.000Z",
      updatedAt: "2026-10-02T15:30:00.000Z",
      lines: [
        {
          id: "isl-2",
          materialId: "mat-1",
          materialCode: "VT-GSM19",
          materialName: "Máy đo từ trường proton GSM-19T",
          unit: "Bộ",
          requestedQuantity: 1,
          approvedQuantity: 1,
          actualQuantity: 1,
          unitPrice: 160000000,
          totalAmount: 160000000,
          batchNumber: "LO-2026-GSM01",
          locationCode: "K1-B01",
        },
      ],
    },
  ]
}

function seedTransfers(): StockTransfer[] {
  return [
    {
      id: "tf-1",
      code: "PDC-2026-0001",
      transferDate: "2026-09-25",
      sourceWarehouseId: "wh-1",
      sourceWarehouseCode: "KHO-TONG",
      sourceWarehouseName: "Kho Tổng Liên đoàn (Cầu Giấy)",
      targetWarehouseId: "wh-2",
      targetWarehouseCode: "KHO-MAY-BAY",
      targetWarehouseName: "Kho Vật tư & Trạm đo Máy bay",
      dispatcherName: "Trần Văn Toàn (Thủ kho chính)",
      receiverName: "Nguyễn Văn Đức",
      transporterName: "Xe chuyên dụng Liên đoàn (29A-882.19)",
      reason: "Điều chuyển 2 bộ pin Lithium sang trạm bay Gia Lâm chuẩn bị bay đo Tây Bắc",
      status: "completed",
      totalDispatchedQuantity: 2,
      totalReceivedQuantity: 2,
      totalAmount: 15000000,
      dispatchedAt: "2026-09-25T08:30:00.000Z",
      receivedAt: "2026-09-25T14:00:00.000Z",
      createdAt: "2026-09-24T10:00:00.000Z",
      updatedAt: "2026-09-25T14:00:00.000Z",
      lines: [
        {
          id: "tfl-1",
          materialId: "mat-5",
          materialCode: "VT-PIN100",
          materialName: "Pin Lithium LiFePO4 12V-100Ah",
          unit: "Cái",
          batchNumber: "LO-2026-PIN01",
          unitPrice: 7500000,
          dispatchedQuantity: 2,
          receivedQuantity: 2,
          discrepancyQuantity: 0,
          totalAmount: 15000000,
        },
      ],
    },
  ]
}

function seedThresholds(): StockThreshold[] {
  return [
    {
      id: "th-1",
      materialId: "mat-1",
      materialCode: "VT-GSM19",
      warehouseId: "wh-1",
      warehouseCode: "KHO-TONG",
      minQuantity: 2,
      maxQuantity: 6,
      updatedAt: "2026-09-01T08:00:00.000Z",
    },
    {
      id: "th-2",
      materialId: "mat-2",
      materialCode: "VT-CAP24",
      warehouseId: "wh-3",
      warehouseCode: "KHO-BIEN",
      minQuantity: 4,
      maxQuantity: 12,
      updatedAt: "2026-09-01T08:00:00.000Z",
    },
    {
      id: "th-3",
      materialId: "mat-4",
      materialCode: "VT-TRM12",
      warehouseId: "all",
      warehouseCode: "Tất cả kho",
      minQuantity: 1,
      maxQuantity: 5,
      updatedAt: "2026-09-01T08:00:00.000Z",
    },
  ]
}

// ================= REPOSITORIES =================

export const MaterialRepository = {
  list(): Material[] {
    return safeGet<Material>(KEYS.MATERIALS, seedMaterials)
  },
  getById(id: string): Material | null {
    return this.list().find((m) => m.id === id) || null
  },
  save(material: Material): Material {
    const list = this.list()
    const idx = list.findIndex((m) => m.id === material.id)
    if (idx >= 0) {
      list[idx] = { ...material, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({
        ...material,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    safeSet(KEYS.MATERIALS, list)
    return material
  },
  deactivate(id: string): void {
    const list = this.list()
    const item = list.find((m) => m.id === id)
    if (item) {
      item.status = "inactive"
      item.updatedAt = new Date().toISOString()
      safeSet(KEYS.MATERIALS, list)
    }
  },
}

export const WarehouseRepository = {
  list(): Warehouse[] {
    return safeGet<Warehouse>(KEYS.WAREHOUSES, seedWarehouses)
  },
  getById(id: string): Warehouse | null {
    return this.list().find((w) => w.id === id) || null
  },
  save(warehouse: Warehouse): Warehouse {
    const list = this.list()
    const idx = list.findIndex((w) => w.id === warehouse.id)
    if (idx >= 0) {
      list[idx] = { ...warehouse, updatedAt: new Date().toISOString() }
    } else {
      list.push({
        ...warehouse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    safeSet(KEYS.WAREHOUSES, list)
    return warehouse
  },
}

export const StockBatchRepository = {
  list(): StockBatch[] {
    return safeGet<StockBatch>(KEYS.BATCHES, seedBatches)
  },
  getById(id: string): StockBatch | null {
    return this.list().find((b) => b.id === id) || null
  },
  save(batch: StockBatch): StockBatch {
    const list = this.list()
    const idx = list.findIndex((b) => b.id === batch.id)
    if (idx >= 0) {
      list[idx] = batch
    } else {
      list.unshift(batch)
    }
    safeSet(KEYS.BATCHES, list)
    return batch
  },
  saveMultiple(batches: StockBatch[]): void {
    const list = this.list()
    for (const b of batches) {
      const idx = list.findIndex((existing) => existing.id === b.id || (existing.materialId === b.materialId && existing.batchNumber === b.batchNumber))
      if (idx >= 0) {
        list[idx] = b
      } else {
        list.unshift(b)
      }
    }
    safeSet(KEYS.BATCHES, list)
  },
}

export const InventoryLedgerRepository = {
  list(): InventoryTransaction[] {
    return safeGet<InventoryTransaction>(KEYS.LEDGER, seedTransactions)
  },
  append(transaction: InventoryTransaction): void {
    const list = this.list()
    list.push(transaction)
    safeSet(KEYS.LEDGER, list)
  },
  appendMultiple(transactions: InventoryTransaction[]): void {
    const list = this.list()
    list.push(...transactions)
    safeSet(KEYS.LEDGER, list)
  },
  getByMaterial(materialId: string, warehouseId?: string): InventoryTransaction[] {
    return this.list().filter(
      (tx) => tx.materialId === materialId && (!warehouseId || warehouseId === "all" || tx.warehouseId === warehouseId)
    )
  },
}

export const GoodsReceiptRepository = {
  list(): GoodsReceipt[] {
    return safeGet<GoodsReceipt>(KEYS.RECEIPTS, seedReceipts)
  },
  getById(id: string): GoodsReceipt | null {
    return this.list().find((r) => r.id === id) || null
  },
  save(receipt: GoodsReceipt): GoodsReceipt {
    const list = this.list()
    const idx = list.findIndex((r) => r.id === receipt.id)
    if (idx >= 0) {
      list[idx] = { ...receipt, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({
        ...receipt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    safeSet(KEYS.RECEIPTS, list)
    return receipt
  },
  remove(id: string): void {
    const list = this.list().filter((r) => r.id !== id)
    safeSet(KEYS.RECEIPTS, list)
  },
}

export const GoodsIssueRepository = {
  list(): GoodsIssue[] {
    return safeGet<GoodsIssue>(KEYS.ISSUES, seedIssues)
  },
  getById(id: string): GoodsIssue | null {
    return this.list().find((i) => i.id === id) || null
  },
  save(issue: GoodsIssue): GoodsIssue {
    const list = this.list()
    const idx = list.findIndex((i) => i.id === issue.id)
    if (idx >= 0) {
      list[idx] = { ...issue, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({
        ...issue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    safeSet(KEYS.ISSUES, list)
    return issue
  },
  remove(id: string): void {
    const list = this.list().filter((i) => i.id !== id)
    safeSet(KEYS.ISSUES, list)
  },
}

export const StockTransferRepository = {
  list(): StockTransfer[] {
    return safeGet<StockTransfer>(KEYS.TRANSFERS, seedTransfers)
  },
  getById(id: string): StockTransfer | null {
    return this.list().find((t) => t.id === id) || null
  },
  save(transfer: StockTransfer): StockTransfer {
    const list = this.list()
    const idx = list.findIndex((t) => t.id === transfer.id)
    if (idx >= 0) {
      list[idx] = { ...transfer, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({
        ...transfer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    safeSet(KEYS.TRANSFERS, list)
    return transfer
  },
  remove(id: string): void {
    const list = this.list().filter((t) => t.id !== id)
    safeSet(KEYS.TRANSFERS, list)
  },
}

export const StockThresholdRepository = {
  list(): StockThreshold[] {
    return safeGet<StockThreshold>(KEYS.THRESHOLDS, seedThresholds)
  },
  save(threshold: StockThreshold): StockThreshold {
    const list = this.list()
    const idx = list.findIndex(
      (th) => th.materialId === threshold.materialId && th.warehouseId === threshold.warehouseId
    )
    if (idx >= 0) {
      list[idx] = { ...threshold, updatedAt: new Date().toISOString() }
    } else {
      list.unshift({ ...threshold, updatedAt: new Date().toISOString() })
    }
    safeSet(KEYS.THRESHOLDS, list)
    return threshold
  },
  remove(id: string): void {
    const list = this.list().filter((th) => th.id !== id)
    safeSet(KEYS.THRESHOLDS, list)
  },
}

export const StockAlertRepository = {
  list(): StockAlert[] {
    return safeGet<StockAlert>(KEYS.ALERTS, () => [])
  },
  saveAll(alerts: StockAlert[]): void {
    safeSet(KEYS.ALERTS, alerts)
  },
  dismiss(id: string, reason?: string): void {
    const list = this.list()
    const target = list.find((a) => a.id === id)
    if (target) {
      target.dismissed = true
      target.dismissedReason = reason || "Người dùng đã xem và bỏ qua"
      safeSet(KEYS.ALERTS, list)
    }
  },
}
