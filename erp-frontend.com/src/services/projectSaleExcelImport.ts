import * as XLSX from "xlsx"
import { ProjectSale } from "@/types/projectSale"

export type ProjectSaleImportKind = "warehouse" | "quote"

type ParsedRow = Record<string, unknown>

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function parseString(value: unknown) {
  if (value == null) return undefined
  const text = String(value).trim()
  return text || undefined
}

function parseNumber(value: unknown) {
  if (value == null || value === "") return undefined
  const text = String(value).replace(/[^\d.,-]/g, "").replace(/,/g, "")
  const num = Number(text)
  return Number.isFinite(num) ? num : undefined
}

function pickValue(row: ParsedRow, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeKey)
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeKey(key)
    if (normalizedAliases.some((alias) => normalizedKey === alias || normalizedKey.includes(alias))) {
      return value
    }
  }
  return undefined
}

async function readExcelRows(file: File): Promise<ParsedRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "" })
}

function findProjectId(row: ParsedRow, projects: ProjectSale[]) {
  const orderCode = parseString(pickValue(row, ["ma dat hang", "order code", "ordercode", "ma don hang"]))
  const batchCode = parseString(pickValue(row, ["ma lo hang", "batch code", "batchcode", "ma lo"]))
  const matched = projects.find((item) => {
    if (orderCode && item.orderCode === orderCode) return true
    if (batchCode && item.batchCode === batchCode) return true
    return false
  })
  return matched?.id
}

function buildWarehousePatch(row: ParsedRow): Partial<ProjectSale> {
  const patch: Partial<ProjectSale> = {}
  const orderStatus = parseString(pickValue(row, ["theo doi dat hang", "order status", "trang thai dat hang"]))
  const shipmentStatus = parseString(pickValue(row, ["theo doi lo hang", "shipment status", "trang thai lo hang", "tien do lo hang"]))
  const freightPaymentStatus = parseString(pickValue(row, ["thu cuoc", "freight payment", "trang thai thu cuoc"]))
  const documentStatus = parseString(pickValue(row, ["chung tu", "document status", "trang thai chung tu"]))
  const notes = parseString(pickValue(row, ["ghi chu", "notes", "note"]))
  const weightKg = parseNumber(pickValue(row, ["trong luong", "weight kg", "weight"]))
  const volumeCbm = parseNumber(pickValue(row, ["the tich", "volume cbm", "volume", "cbm"]))

  if (orderStatus) patch.orderStatus = orderStatus as ProjectSale["orderStatus"]
  if (shipmentStatus) patch.shipmentStatus = shipmentStatus as ProjectSale["shipmentStatus"]
  if (freightPaymentStatus) patch.freightPaymentStatus = freightPaymentStatus as ProjectSale["freightPaymentStatus"]
  if (documentStatus) patch.documentStatus = documentStatus as ProjectSale["documentStatus"]
  if (notes) patch.notes = notes
  if (weightKg != null) patch.weightKg = weightKg
  if (volumeCbm != null) patch.volumeCbm = volumeCbm
  return patch
}

function buildQuotePatch(row: ParsedRow): Partial<ProjectSale> {
  const patch: Partial<ProjectSale> = {}
  const mappings: Array<[keyof ProjectSale, string[]]> = [
    ["unitPriceRmb", ["don gia rmb", "unit price rmb", "don gia"]],
    ["quantity", ["so luong", "quantity"]],
    ["domesticShippingRmb", ["van chuyen noi dia rmb", "domestic shipping rmb", "vc noi dia rmb"]],
    ["costExchangeRate", ["ty gia cost", "cost exchange rate"]],
    ["sellingExchangeRate", ["ty gia ban", "selling exchange rate"]],
    ["totalGoodsCostVnd", ["tong tien hang cost", "total goods cost vnd"]],
    ["totalGoodsSellingVnd", ["tong tien hang ban", "total goods selling vnd"]],
    ["purchasingFeeVnd", ["phi mua hang", "purchasing fee vnd"]],
    ["weightKg", ["trong luong", "weight kg", "weight"]],
    ["volumeCbm", ["the tich", "volume cbm", "volume", "cbm"]],
    ["sellingFreightRateKg", ["don gia cuoc ban kg", "selling freight rate kg"]],
    ["sellingFreightRateM3", ["don gia cuoc ban m3", "selling freight rate m3"]],
    ["sellingShippingFeeKg", ["cuoc vc ban kg", "selling shipping fee kg"]],
    ["sellingShippingFeeM3", ["cuoc vc ban m3", "selling shipping fee m3"]],
    ["totalPaymentAmountVnd", ["tong tien thanh toan", "total payment amount vnd"]],
    ["notes", ["ghi chu", "notes", "note"]],
  ]

  for (const [field, aliases] of mappings) {
    const raw = pickValue(row, aliases)
    if (field === "notes") {
      const text = parseString(raw)
      if (text) (patch as Record<string, unknown>)[field] = text
      continue
    }
    const num = parseNumber(raw)
    if (num != null) (patch as Record<string, unknown>)[field] = num
  }
  return patch
}

export async function importProjectSalesFromExcel(
  file: File,
  kind: ProjectSaleImportKind,
  projects: ProjectSale[],
) {
  const rows = await readExcelRows(file)
  if (!rows.length) {
    return { updated: 0, skipped: 0 }
  }

  const updates: Array<{ id: string; patch: Partial<ProjectSale> }> = []
  let skipped = 0

  for (const row of rows) {
    const projectId = findProjectId(row, projects)
    if (!projectId) {
      skipped += 1
      continue
    }
    const patch = kind === "warehouse" ? buildWarehousePatch(row) : buildQuotePatch(row)
    if (!Object.keys(patch).length) {
      skipped += 1
      continue
    }
    updates.push({ id: projectId, patch })
  }

  return { updated: updates.length, skipped, updates }
}
