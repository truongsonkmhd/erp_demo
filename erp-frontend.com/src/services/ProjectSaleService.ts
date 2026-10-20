import { ProjectSale } from "@/types/projectSale"
import { newLocalId, readStore, removeUndefinedValues, writeStore } from "@/lib/localStore"

const SALES_KEY = "pts.projects_sale"

export const initialProjectSales: ProjectSale[] = [
  {
    id: "sale-1",
    customerCode: "FOB3333",
    customerName: "Phạm Văn A",
    phone: "0912333333",
    orderCode: "DH2026-001",
    batchCode: "LH2026-A1",
    serviceType: "Vận chuyển chính ngạch",
    productName: "Máy móc công nghiệp",
    category: "Máy móc công nghiệp",
    unitPriceRmb: 500,
    quantity: 10,
    domesticShippingRmb: 50,
    costExchangeRate: 3500,
    sellingExchangeRate: 3600,
    totalGoodsCostVnd: 19250000,
    totalGoodsSellingVnd: 19800000,
    purchasingFeeVnd: 198000,
    weightKg: 500,
    volumeCbm: 1.5,
    costFreightRateKg: 30000,
    costFreightRateM3: 800000,
    floorFreightRateM3: 850000,
    sellingFreightRateKg: 35000,
    sellingFreightRateM3: 1200000,
    costShippingFeeKg: 15000000,
    costShippingFeeM3: 1200000,
    floorShippingFeeKg: 17500000,
    floorShippingFeeM3: 12750000,
    sellingShippingFeeKg: 17500000,
    sellingShippingFeeM3: 1800000,
    costVesselFreightRateKg: 1650,
    costVesselFreightRateM3: 550000,
    sellingVesselFreightRateKg: 2000,
    sellingVesselFreightRateM3: 600000,
    costVesselShippingFeeKg: 825000,
    costVesselShippingFeeM3: 825000,
    sellingVesselShippingFeeKg: 1000000,
    sellingVesselShippingFeeM3: 900000,
    importTaxRate: 15,
    importTaxAmountVnd: 2970000,
    entrustedImportFeeVnd: 396000,
    customsDeclarationFeeVnd: 300000,
    otherFeesVnd: 4000000,
    otherProfitVnd: 1000000,
    vatRate: 10,
    vatAmountVnd: 2716600,
    totalPaymentAmountVnd: 31362600,
    grossCompanyProfitVnd: 3406482,
    netSalesProfitVnd: 2918982,
    orderStatus: "Đã thanh toán",
    shipmentStatus: "Nhập kho TQ",
    freightPaymentStatus: "Đã thu cước",
    documentStatus: "Đã bàn giao",
    notes: "Đơn hàng gấp",
  },
  {
    id: "sale-2",
    customerCode: "FOB4234",
    customerName: "Phạm Văn C",
    phone: "0987424234",
    orderCode: "DH2026-002",
    batchCode: "LH2026-B2",
    serviceType: "Ký gửi hàng hóa",
    productName: "Linh kiện điện tử",
    category: "Đồ điện tử",
    unitPriceRmb: 250,
    quantity: 50,
    domesticShippingRmb: 100,
    costExchangeRate: 3500,
    sellingExchangeRate: 3620,
    totalGoodsCostVnd: 44100000,
    totalGoodsSellingVnd: 45612000,
    purchasingFeeVnd: 456120,
    weightKg: 200,
    volumeCbm: 0.8,
    costFreightRateKg: 28000,
    costFreightRateM3: 750000,
    floorFreightRateM3: 800000,
    sellingFreightRateKg: 32000,
    sellingFreightRateM3: 1100000,
    costShippingFeeKg: 5600000,
    costShippingFeeM3: 600000,
    floorShippingFeeKg: 6400000,
    floorShippingFeeM3: 640000,
    sellingShippingFeeKg: 6400000,
    sellingShippingFeeM3: 880000,
    costVesselFreightRateKg: 1500,
    costVesselFreightRateM3: 500000,
    sellingVesselFreightRateKg: 1800,
    sellingVesselFreightRateM3: 550000,
    costVesselShippingFeeKg: 300000,
    costVesselShippingFeeM3: 400000,
    sellingVesselShippingFeeKg: 360000,
    sellingVesselShippingFeeM3: 440000,
    importTaxRate: 10,
    importTaxAmountVnd: 4561200,
    entrustedImportFeeVnd: 912240,
    customsDeclarationFeeVnd: 350000,
    otherFeesVnd: 1500000,
    otherProfitVnd: 500000,
    vatRate: 10,
    vatAmountVnd: 5323544,
    totalPaymentAmountVnd: 58659104,
    grossCompanyProfitVnd: 5200000,
    netSalesProfitVnd: 4100000,
    orderStatus: "Đã sản xuất",
    shipmentStatus: "Xếp xe",
    freightPaymentStatus: "Chưa cước",
    documentStatus: "Chưa bàn giao",
    notes: "Kiểm tra hàng kỹ trước khi giao",
  },
]

function ensureSeeded(): ProjectSale[] {
  const existing = readStore<ProjectSale>(SALES_KEY)
  if (existing.length > 0) return existing
  writeStore(SALES_KEY, initialProjectSales)
  return initialProjectSales
}

export const getAllProjectSales = async (): Promise<ProjectSale[]> => {
  return ensureSeeded()
}

export const addProjectSale = async (newProjectSale: Omit<ProjectSale, "id">): Promise<void> => {
  const sales = ensureSeeded()
  sales.push(removeUndefinedValues({ ...newProjectSale, id: newLocalId("sale") } as ProjectSale))
  writeStore(SALES_KEY, sales)
}

export const updateProjectSale = async (
  id: string,
  updatedProjectSale: Partial<ProjectSale>,
): Promise<void> => {
  const sales = ensureSeeded()
  writeStore(
    SALES_KEY,
    sales.map((item) =>
      item.id === id ? removeUndefinedValues({ ...item, ...updatedProjectSale, id }) : item,
    ),
  )
}

export const deleteProjectSale = async (id: string): Promise<void> => {
  writeStore(
    SALES_KEY,
    ensureSeeded().filter((item) => item.id !== id),
  )
}

export const bulkUpdateProjectSales = async (
  updates: Array<{ id: string; patch: Partial<ProjectSale> }>,
): Promise<void> => {
  if (!updates.length) return
  const patchById = new Map(updates.map((item) => [item.id, item.patch]))
  const sales = ensureSeeded().map((item) => {
    const patch = patchById.get(item.id)
    return patch ? removeUndefinedValues({ ...item, ...patch, id: item.id }) : item
  })
  writeStore(SALES_KEY, sales)
}
