import { ProjectSale } from "@/types/projectSale"

const defaults: Omit<
  ProjectSale,
  | "id"
  | "customerCode"
  | "customerName"
  | "phone"
  | "orderCode"
  | "productName"
  | "createdAt"
  | "grossCompanyProfitVnd"
  | "netSalesProfitVnd"
> = {
  batchCode: "LH-DEMO",
  serviceType: "Vận chuyển chính ngạch",
  category: "Hàng tiêu dùng",
  unitPriceRmb: 100,
  quantity: 10,
  domesticShippingRmb: 20,
  costExchangeRate: 3500,
  sellingExchangeRate: 3600,
  totalGoodsCostVnd: 10000000,
  totalGoodsSellingVnd: 12000000,
  purchasingFeeVnd: 120000,
  weightKg: 100,
  volumeCbm: 0.5,
  floorFreightRateM3: 800000,
  sellingFreightRateKg: 30000,
  sellingFreightRateM3: 1000000,
  floorShippingFeeKg: 1000000,
  floorShippingFeeM3: 400000,
  sellingShippingFeeKg: 1200000,
  sellingShippingFeeM3: 500000,
  sellingVesselFreightRateKg: 1800,
  sellingVesselFreightRateM3: 550000,
  sellingVesselShippingFeeKg: 200000,
  sellingVesselShippingFeeM3: 250000,
  importTaxRate: 10,
  importTaxAmountVnd: 1000000,
  entrustedImportFeeVnd: 200000,
  customsDeclarationFeeVnd: 300000,
  otherFeesVnd: 100000,
  otherProfitVnd: 200000,
  vatRate: 10,
  vatAmountVnd: 500000,
  totalPaymentAmountVnd: 15000000,
  orderStatus: "Đã thanh toán",
  shipmentStatus: "Đã giao",
  freightPaymentStatus: "Đã thu cước",
  documentStatus: "Đã bàn giao",
}

function sale(
  id: string,
  name: string,
  code: string,
  phone: string,
  orderCode: string,
  productName: string,
  createdAt: string,
  gross: number,
  net: number,
): ProjectSale {
  return {
    ...defaults,
    id,
    customerName: name,
    customerCode: code,
    phone,
    orderCode,
    productName,
    createdAt,
    grossCompanyProfitVnd: gross,
    netSalesProfitVnd: net,
  }
}

/** Dữ liệu mẫu cho bảng Kết quả KD theo KH (năm 2025–2026). */
export const CUSTOMER_KD_DEMO_SALES: ProjectSale[] = [
  // Nguyễn Thị Lan — đặt đều: 8 tháng / 8 đơn → kỳ 1.0
  sale("demo-lan-1", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-01", "Gia dụng", "2026-01-12T08:00:00.000Z", 4200000, 3100000),
  sale("demo-lan-2", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-02", "Gia dụng", "2026-02-08T08:00:00.000Z", 3800000, 2800000),
  sale("demo-lan-3", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-03", "Nội thất", "2026-03-15T08:00:00.000Z", 5100000, 4000000),
  sale("demo-lan-4", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-04", "Gia dụng", "2026-04-10T08:00:00.000Z", 2900000, 2100000),
  sale("demo-lan-5", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-05", "Đồ decor", "2026-05-20T08:00:00.000Z", 4600000, 3500000),
  sale("demo-lan-6", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-06", "Gia dụng", "2026-06-05T08:00:00.000Z", 3300000, 2500000),
  sale("demo-lan-7", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-07", "Nội thất", "2026-07-18T08:00:00.000Z", 4800000, 3600000),
  sale("demo-lan-8", "Nguyễn Thị Lan", "FOB1111", "0912111111", "DH26-LAN-08", "Gia dụng", "2026-08-02T08:00:00.000Z", 4100000, 3000000),

  // Trần Minh Đức — 3 tháng có đơn → kỳ 8/3 ≈ 2.7
  sale("demo-duc-1", "Trần Minh Đức", "FOB2222", "0912222222", "DH26-DUC-01", "Máy móc", "2026-01-22T08:00:00.000Z", 8200000, 6500000),
  sale("demo-duc-2", "Trần Minh Đức", "FOB2222", "0912222222", "DH26-DUC-02", "Máy móc", "2026-04-14T08:00:00.000Z", 7600000, 5900000),
  sale("demo-duc-3", "Trần Minh Đức", "FOB2222", "0912222222", "DH26-DUC-03", "Phụ tùng", "2026-08-09T08:00:00.000Z", 9100000, 7200000),

  // Lê Hoàng Nam — 2 tháng → kỳ 8/2 = 4.0 (vàng)
  sale("demo-nam-1", "Lê Hoàng Nam", "FOB3333", "0912333333", "DH26-NAM-01", "Vải cuốn", "2026-02-03T08:00:00.000Z", 2400000, 1800000),
  sale("demo-nam-2", "Lê Hoàng Nam", "FOB3333", "0912333333", "DH26-NAM-02", "Thời trang", "2026-06-28T08:00:00.000Z", 2700000, 2000000),

  // Phạm Thu Hà — 1 tháng → kỳ 8/1 = 8.0 (đỏ)
  sale("demo-ha-1", "Phạm Thu Hà", "FOB4444", "0912444444", "DH26-HA-01", "Mỹ phẩm", "2026-03-11T08:00:00.000Z", 1500000, 1100000),
  sale("demo-ha-2", "Phạm Thu Hà", "FOB4444", "0912444444", "DH26-HA-02", "Mỹ phẩm", "2026-03-25T08:00:00.000Z", 1800000, 1300000),

  // Võ Quốc Bảo — 2 tháng, 3 đơn tháng 1 → kỳ 4.0 (vàng)
  sale("demo-bao-1", "Võ Quốc Bảo", "FOB5555", "0912555555", "DH26-BAO-01", "Kim khí", "2026-01-06T08:00:00.000Z", 6200000, 4800000),
  sale("demo-bao-2", "Võ Quốc Bảo", "FOB5555", "0912555555", "DH26-BAO-02", "Kim khí", "2026-01-19T08:00:00.000Z", 3100000, 2400000),
  sale("demo-bao-3", "Võ Quốc Bảo", "FOB5555", "0912555555", "DH26-BAO-03", "Cơ khí", "2026-07-07T08:00:00.000Z", 5400000, 4100000),

  // Năm 2025 — 12 tháng / 4 tháng có đơn → kỳ 3.0 (xanh)
  sale("demo-linh-1", "Đặng Mỹ Linh", "FOB6666", "0912666666", "DH25-LINH-01", "Đồ chơi", "2025-01-15T08:00:00.000Z", 2200000, 1600000),
  sale("demo-linh-2", "Đặng Mỹ Linh", "FOB6666", "0912666666", "DH25-LINH-02", "Đồ chơi", "2025-04-09T08:00:00.000Z", 2500000, 1900000),
  sale("demo-linh-3", "Đặng Mỹ Linh", "FOB6666", "0912666666", "DH25-LINH-03", "Đồ chơi", "2025-08-21T08:00:00.000Z", 2800000, 2100000),
  sale("demo-linh-4", "Đặng Mỹ Linh", "FOB6666", "0912666666", "DH25-LINH-04", "Đồ chơi", "2025-11-04T08:00:00.000Z", 3000000, 2300000),
]
