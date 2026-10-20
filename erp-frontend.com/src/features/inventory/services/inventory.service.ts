import type {
  GoodsIssue,
  GoodsReceipt,
  InventoryTransaction,
  Material,
  StockAlert,
  StockBatch,
  StockLevel,
  StockThreshold,
  StockTransfer,
} from "../types/inventory.types"

/**
 * Tính toán số dư tồn kho từ Sổ cái giao dịch bất biến (Immutable Ledger)
 * Công thức:
 * Tồn thực tế = (+receipt +transfer_in +adjust_increase +return) - (+issue +transfer_out +adjust_decrease)
 * Tồn khả dụng = Tồn thực tế - Đang giữ chỗ (từ phiếu xuất đã duyệt)
 */
export function calculateStockLevels(
  materials: Material[],
  transactions: InventoryTransaction[],
  batches: StockBatch[],
  issues: GoodsIssue[],
  thresholds: StockThreshold[],
  inTransitTransfers: StockTransfer[] = []
): StockLevel[] {
  // 1. Nhóm giao dịch theo key: `${materialId}_${warehouseId}_${batchNumber || "NO_BATCH"}`
  const balanceMap = new Map<
    string,
    {
      materialId: string
      materialCode: string
      materialName: string
      warehouseId: string
      warehouseCode: string
      warehouseName: string
      batchId?: string
      batchNumber?: string
      locationCode?: string
      physical: number
      totalValue: number
      latestUnitPrice: number
    }
  >()

  for (const tx of transactions) {
    const batchKey = tx.batchNumber || "NO_BATCH"
    const key = `${tx.materialId}_${tx.warehouseId}_${batchKey}`

    let current = balanceMap.get(key)
    if (!current) {
      current = {
        materialId: tx.materialId,
        materialCode: tx.materialCode,
        materialName: tx.materialName,
        warehouseId: tx.warehouseId,
        warehouseCode: tx.warehouseCode,
        warehouseName: tx.warehouseName,
        batchId: tx.batchId,
        batchNumber: tx.batchNumber,
        locationCode: tx.locationCode,
        physical: 0,
        totalValue: 0,
        latestUnitPrice: tx.unitPrice,
      }
      balanceMap.set(key, current)
    }

    const isAddition =
      tx.type === "receipt" ||
      tx.type === "transfer_in" ||
      tx.type === "adjust_increase" ||
      tx.type === "return"

    if (isAddition) {
      current.physical += tx.quantity
      current.totalValue += tx.totalAmount
    } else {
      current.physical -= tx.quantity
      current.totalValue -= tx.totalAmount
    }

    current.latestUnitPrice = tx.unitPrice
    if (tx.locationCode) current.locationCode = tx.locationCode
  }

  // 2. Tính số lượng giữ chỗ (reserved) từ các phiếu xuất đã duyệt (approved / pending_issue)
  const reservedMap = new Map<string, number>()
  for (const issue of issues) {
    if (issue.status === "approved" || issue.status === "pending_issue") {
      for (const line of issue.lines) {
        const batchKey = line.batchNumber || "NO_BATCH"
        const key = `${line.materialId}_${issue.warehouseId}_${batchKey}`
        const qtyToReserve = line.approvedQuantity || line.requestedQuantity || 0
        reservedMap.set(key, (reservedMap.get(key) || 0) + qtyToReserve)
      }
    }
  }

  // 3. Tính số lượng đang trên đường vận chuyển tới kho đích (in-transit)
  const inTransitMap = new Map<string, number>()
  for (const transfer of inTransitTransfers) {
    if (transfer.status === "in_transit" || transfer.status === "pending_receive") {
      for (const line of transfer.lines) {
        const key = `${line.materialId}_${transfer.targetWarehouseId}`
        inTransitMap.set(key, (inTransitMap.get(key) || 0) + line.dispatchedQuantity)
      }
    }
  }

  // 4. Map thresholds để gán min/max
  const thresholdMap = new Map<string, StockThreshold>()
  for (const th of thresholds) {
    thresholdMap.set(`${th.materialId}_${th.warehouseId}`, th)
  }

  // 5. Tạo kết quả StockLevel
  const materialDict = new Map<string, Material>(materials.map((m) => [m.id, m]))
  const batchDict = new Map<string, StockBatch>(batches.map((b) => [`${b.materialId}_${b.batchNumber}`, b]))

  const result: StockLevel[] = []

  for (const [key, bal] of balanceMap.entries()) {
    // Không hiển thị nếu tồn <= 0 và không có giao dịch còn lại
    if (bal.physical <= 0 && bal.totalValue <= 0) continue

    const mat = materialDict.get(bal.materialId)
    const reserved = reservedMap.get(key) || 0
    const available = Math.max(0, bal.physical - reserved)
    const inTransit = inTransitMap.get(`${bal.materialId}_${bal.warehouseId}`) || 0

    // Tìm batch info nếu có
    const batchInfo = bal.batchNumber ? batchDict.get(`${bal.materialId}_${bal.batchNumber}`) : undefined

    // Tìm threshold
    const thWarehouse = thresholdMap.get(`${bal.materialId}_${bal.warehouseId}`)
    const thAll = thresholdMap.get(`${bal.materialId}_all`)
    const activeTh = thWarehouse || thAll

    const unitPrice =
      bal.physical > 0 ? Math.round(bal.totalValue / bal.physical) : bal.latestUnitPrice

    result.push({
      materialId: bal.materialId,
      materialCode: bal.materialCode,
      materialName: bal.materialName,
      category: mat?.category || "Chưa phân loại",
      unit: mat?.unit || "Cái",
      warehouseId: bal.warehouseId,
      warehouseCode: bal.warehouseCode,
      warehouseName: bal.warehouseName,
      batchId: bal.batchId,
      batchNumber: bal.batchNumber,
      expiryDate: batchInfo?.expiryDate,
      locationCode: bal.locationCode || batchInfo?.locationCode,
      physicalQuantity: bal.physical,
      reservedQuantity: reserved,
      availableQuantity: available,
      inTransitQuantity: inTransit,
      unitPrice: unitPrice > 0 ? unitPrice : bal.latestUnitPrice,
      totalValue: Math.max(0, bal.totalValue),
      minStock: activeTh?.minQuantity ?? mat?.defaultMinStock,
      maxStock: activeTh?.maxQuantity ?? mat?.defaultMaxStock,
    })
  }

  return result
}

/**
 * Ghi sổ Nhập kho: Sinh giao dịch `receipt` và trả về danh sách giao dịch
 */
export function postReceipt(
  receipt: GoodsReceipt,
  actorName: string
): {
  transactions: InventoryTransaction[]
  newBatches: StockBatch[]
} {
  const transactions: InventoryTransaction[] = []
  const newBatches: StockBatch[] = []
  const now = new Date().toISOString()

  for (let i = 0; i < receipt.lines.length; i++) {
    const line = receipt.lines[i]
    if (line.receivedQuantity <= 0) continue

    const txCode = `GD-NK-${Date.now().toString().slice(-6)}-${i + 1}`
    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}-${i}`,
      transactionCode: txCode,
      type: "receipt",
      sourceDocumentType: "receipt",
      sourceDocumentId: receipt.id,
      sourceDocumentCode: receipt.code,
      materialId: line.materialId,
      materialCode: line.materialCode,
      materialName: line.materialName,
      batchNumber: line.batchNumber,
      warehouseId: receipt.warehouseId,
      warehouseCode: receipt.warehouseCode,
      warehouseName: receipt.warehouseName,
      locationCode: line.locationCode,
      quantity: line.receivedQuantity,
      unitPrice: line.unitPrice,
      totalAmount: line.receivedQuantity * line.unitPrice,
      timestamp: now,
      postedBy: actorName,
      notes: `Nhập kho theo ${receipt.code} (HĐ: ${receipt.contractNumber || "N/A"})`,
    }
    transactions.push(tx)

    if (line.batchNumber) {
      newBatches.push({
        id: `batch-${Date.now()}-${i}`,
        batchNumber: line.batchNumber,
        materialId: line.materialId,
        materialCode: line.materialCode,
        materialName: line.materialName,
        warehouseId: receipt.warehouseId,
        warehouseCode: receipt.warehouseCode,
        locationCode: line.locationCode,
        sourceType: "contract",
        sourceReferenceCode: receipt.contractNumber || receipt.code,
        manufacturingDate: line.manufacturingDate,
        expiryDate: line.expiryDate,
        initialQuantity: line.receivedQuantity,
        unitPrice: line.unitPrice,
        status: "active",
        createdAt: now,
      })
    }
  }

  return { transactions, newBatches }
}

/**
 * Ghi sổ Xuất kho: Kiểm tra tồn khả dụng, sinh giao dịch `issue`
 */
export function postIssue(
  issue: GoodsIssue,
  stockLevels: StockLevel[],
  actorName: string
): {
  success: boolean
  transactions?: InventoryTransaction[]
  errorMessage?: string
} {
  const transactions: InventoryTransaction[] = []
  const now = new Date().toISOString()

  for (let i = 0; i < issue.lines.length; i++) {
    const line = issue.lines[i]
    const qty = line.actualQuantity || line.approvedQuantity || line.requestedQuantity
    if (qty <= 0) continue

    // Tìm tồn khả dụng trong kho này
    const currentLevel = stockLevels.find(
      (s) =>
        s.materialId === line.materialId &&
        s.warehouseId === issue.warehouseId &&
        (!line.batchNumber || s.batchNumber === line.batchNumber)
    )

    if (!currentLevel || currentLevel.physicalQuantity < qty) {
      return {
        success: false,
        errorMessage: `Vật tư "${line.materialName}" (${line.materialCode}) trong kho ${issue.warehouseName} không đủ tồn thực tế để xuất (Yêu cầu: ${qty}, Hiện có: ${currentLevel?.physicalQuantity || 0}).`,
      }
    }

    const txCode = `GD-XK-${Date.now().toString().slice(-6)}-${i + 1}`
    const tx: InventoryTransaction = {
      id: `tx-issue-${Date.now()}-${i}`,
      transactionCode: txCode,
      type: "issue",
      sourceDocumentType: "issue",
      sourceDocumentId: issue.id,
      sourceDocumentCode: issue.code,
      materialId: line.materialId,
      materialCode: line.materialCode,
      materialName: line.materialName,
      batchId: line.batchId,
      batchNumber: line.batchNumber,
      warehouseId: issue.warehouseId,
      warehouseCode: issue.warehouseCode,
      warehouseName: issue.warehouseName,
      locationCode: line.locationCode,
      quantity: qty,
      unitPrice: line.unitPrice || currentLevel.unitPrice,
      totalAmount: qty * (line.unitPrice || currentLevel.unitPrice),
      timestamp: now,
      postedBy: actorName,
      projectName: issue.projectName,
      projectItem: issue.projectItem,
      notes: `Xuất dùng cho ${issue.projectName} (${issue.code})`,
    }
    transactions.push(tx)
  }

  return { success: true, transactions }
}

/**
 * Xuất điều chuyển (Kho nguồn -> Đang vận chuyển)
 */
export function dispatchTransfer(
  transfer: StockTransfer,
  stockLevels: StockLevel[],
  actorName: string
): {
  success: boolean
  transactions?: InventoryTransaction[]
  errorMessage?: string
} {
  if (transfer.sourceWarehouseId === transfer.targetWarehouseId) {
    return {
      success: false,
      errorMessage: "Kho xuất và kho nhận không được trùng nhau.",
    }
  }

  const transactions: InventoryTransaction[] = []
  const now = new Date().toISOString()

  for (let i = 0; i < transfer.lines.length; i++) {
    const line = transfer.lines[i]
    if (line.dispatchedQuantity <= 0) continue

    const currentLevel = stockLevels.find(
      (s) =>
        s.materialId === line.materialId &&
        s.warehouseId === transfer.sourceWarehouseId &&
        (!line.batchNumber || s.batchNumber === line.batchNumber)
    )

    if (!currentLevel || currentLevel.availableQuantity < line.dispatchedQuantity) {
      return {
        success: false,
        errorMessage: `Vật tư "${line.materialName}" tại kho ${transfer.sourceWarehouseName} không đủ tồn khả dụng để điều chuyển (Cần xuất: ${line.dispatchedQuantity}, Khả dụng: ${currentLevel?.availableQuantity || 0}).`,
      }
    }

    const txCode = `GD-DC-OUT-${Date.now().toString().slice(-6)}-${i + 1}`
    const tx: InventoryTransaction = {
      id: `tx-tfout-${Date.now()}-${i}`,
      transactionCode: txCode,
      type: "transfer_out",
      sourceDocumentType: "transfer",
      sourceDocumentId: transfer.id,
      sourceDocumentCode: transfer.code,
      materialId: line.materialId,
      materialCode: line.materialCode,
      materialName: line.materialName,
      batchId: line.batchId,
      batchNumber: line.batchNumber,
      warehouseId: transfer.sourceWarehouseId,
      warehouseCode: transfer.sourceWarehouseCode,
      warehouseName: transfer.sourceWarehouseName,
      quantity: line.dispatchedQuantity,
      unitPrice: line.unitPrice,
      totalAmount: line.dispatchedQuantity * line.unitPrice,
      timestamp: now,
      postedBy: actorName,
      notes: `Xuất điều chuyển sang ${transfer.targetWarehouseName} (${transfer.code})`,
    }
    transactions.push(tx)
  }

  return { success: true, transactions }
}

/**
 * Nhận điều chuyển (Đang vận chuyển -> Kho đích)
 */
export function receiveTransfer(
  transfer: StockTransfer,
  actorName: string
): {
  transactions: InventoryTransaction[]
} {
  const transactions: InventoryTransaction[] = []
  const now = new Date().toISOString()

  for (let i = 0; i < transfer.lines.length; i++) {
    const line = transfer.lines[i]
    const qty = line.receivedQuantity || line.dispatchedQuantity
    if (qty <= 0) continue

    const txCode = `GD-DC-IN-${Date.now().toString().slice(-6)}-${i + 1}`
    const tx: InventoryTransaction = {
      id: `tx-tfin-${Date.now()}-${i}`,
      transactionCode: txCode,
      type: "transfer_in",
      sourceDocumentType: "transfer",
      sourceDocumentId: transfer.id,
      sourceDocumentCode: transfer.code,
      materialId: line.materialId,
      materialCode: line.materialCode,
      materialName: line.materialName,
      batchId: line.batchId,
      batchNumber: line.batchNumber,
      warehouseId: transfer.targetWarehouseId,
      warehouseCode: transfer.targetWarehouseCode,
      warehouseName: transfer.targetWarehouseName,
      quantity: qty,
      unitPrice: line.unitPrice,
      totalAmount: qty * line.unitPrice,
      timestamp: now,
      postedBy: actorName,
      notes: `Nhận điều chuyển từ ${transfer.sourceWarehouseName} (${transfer.code})`,
    }
    transactions.push(tx)
  }

  return { transactions }
}

/**
 * Tự sinh Cảnh báo tồn kho (PRC-09)
 */
export function generateStockAlerts(
  stockLevels: StockLevel[],
  batches: StockBatch[]
): StockAlert[] {
  const alerts: StockAlert[] = []
  const now = new Date()

  // Gom theo vật tư và kho để cảnh báo định mức
  const groupedByMatAndWh = new Map<string, StockLevel[]>()
  for (const sl of stockLevels) {
    const key = `${sl.materialId}_${sl.warehouseId}`
    const list = groupedByMatAndWh.get(key) || []
    list.push(sl)
    groupedByMatAndWh.set(key, list)
  }

  for (const [key, levels] of groupedByMatAndWh.entries()) {
    const first = levels[0]
    const totalPhysical = levels.reduce((sum, item) => sum + item.physicalQuantity, 0)
    const totalAvailable = levels.reduce((sum, item) => sum + item.availableQuantity, 0)
    const totalReserved = levels.reduce((sum, item) => sum + item.reservedQuantity, 0)
    const minStock = first.minStock ?? 0
    const maxStock = first.maxStock

    // 1. Hết hàng hoàn toàn
    if (totalPhysical <= 0) {
      alerts.push({
        id: `alt-oos-${key}`,
        type: "out_of_stock",
        severity: "critical",
        materialId: first.materialId,
        materialCode: first.materialCode,
        materialName: first.materialName,
        warehouseId: first.warehouseId,
        warehouseCode: first.warehouseCode,
        warehouseName: first.warehouseName,
        currentQuantity: 0,
        thresholdQuantity: minStock,
        message: `Vật tư "${first.materialName}" tại ${first.warehouseName} đã hết hàng (Tồn = 0 ${first.unit}).`,
        actionSuggestion: "Lập đề xuất mua sắm bổ sung ngay để không gián đoạn nhiệm vụ.",
        dismissed: false,
        createdAt: now.toISOString(),
      })
    }
    // 2. Dưới định mức tối thiểu
    else if (minStock > 0 && totalPhysical < minStock) {
      alerts.push({
        id: `alt-below-min-${key}`,
        type: "below_min",
        severity: "warning",
        materialId: first.materialId,
        materialCode: first.materialCode,
        materialName: first.materialName,
        warehouseId: first.warehouseId,
        warehouseCode: first.warehouseCode,
        warehouseName: first.warehouseName,
        currentQuantity: totalPhysical,
        thresholdQuantity: minStock,
        message: `Tồn kho "${first.materialName}" (${totalPhysical} ${first.unit}) thấp hơn mức an toàn tối thiểu (${minStock} ${first.unit}).`,
        actionSuggestion: "Khuyến nghị điều chuyển từ kho khác hoặc tạo đề nghị mua sắm dự phòng.",
        dismissed: false,
        createdAt: now.toISOString(),
      })
    }

    // 3. Vượt định mức tối đa
    if (typeof maxStock === "number" && maxStock > 0 && totalPhysical > maxStock) {
      alerts.push({
        id: `alt-above-max-${key}`,
        type: "above_max",
        severity: "info",
        materialId: first.materialId,
        materialCode: first.materialCode,
        materialName: first.materialName,
        warehouseId: first.warehouseId,
        warehouseCode: first.warehouseCode,
        warehouseName: first.warehouseName,
        currentQuantity: totalPhysical,
        thresholdQuantity: maxStock,
        message: `Tồn kho "${first.materialName}" (${totalPhysical} ${first.unit}) vượt định mức tối đa (${maxStock} ${first.unit}).`,
        actionSuggestion: "Tạm dừng nhập mua thêm, ưu tiên xuất kho hoặc điều chuyển san tải.",
        dismissed: false,
        createdAt: now.toISOString(),
      })
    }

    // 4. Nhu cầu vượt tồn khả dụng
    if (totalReserved > totalPhysical) {
      alerts.push({
        id: `alt-shortage-${key}`,
        type: "shortage",
        severity: "critical",
        materialId: first.materialId,
        materialCode: first.materialCode,
        materialName: first.materialName,
        warehouseId: first.warehouseId,
        warehouseCode: first.warehouseCode,
        warehouseName: first.warehouseName,
        currentQuantity: totalAvailable,
        thresholdQuantity: totalReserved,
        message: `Nhu cầu duyệt xuất (${totalReserved} ${first.unit}) vượt quá số lượng tồn thực tế (${totalPhysical} ${first.unit}).`,
        actionSuggestion: "Kiểm tra rà soát lại các phiếu xuất đã duyệt hoặc điều chuyển gấp từ kho bạn.",
        dismissed: false,
        createdAt: now.toISOString(),
      })
    }
  }

  // 5. Cảnh báo theo Lô: Sắp hết hạn trong 30 ngày, Quá hạn, Lô bị khóa
  for (const batch of batches) {
    if (batch.status === "locked") {
      alerts.push({
        id: `alt-locked-${batch.id}`,
        type: "locked_batch",
        severity: "warning",
        materialId: batch.materialId,
        materialCode: batch.materialCode,
        materialName: batch.materialName,
        warehouseId: batch.warehouseId,
        warehouseCode: batch.warehouseCode,
        batchNumber: batch.batchNumber,
        currentQuantity: batch.initialQuantity,
        message: `Lô "${batch.batchNumber}" của vật tư "${batch.materialName}" đang bị tạm khóa (Lý do kiểm định / lỗi kỹ thuật).`,
        actionSuggestion: "Kiểm tra chất lượng kiểm định trước khi mở khóa cho phép xuất.",
        dismissed: false,
        createdAt: now.toISOString(),
      })
    }

    if (batch.expiryDate) {
      const expDate = new Date(batch.expiryDate)
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        alerts.push({
          id: `alt-exp-${batch.id}`,
          type: "expired",
          severity: "critical",
          materialId: batch.materialId,
          materialCode: batch.materialCode,
          materialName: batch.materialName,
          warehouseId: batch.warehouseId,
          warehouseCode: batch.warehouseCode,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          currentQuantity: batch.initialQuantity,
          message: `Lô "${batch.batchNumber}" (${batch.materialName}) đã hết hạn từ ngày ${batch.expiryDate}!`,
          actionSuggestion: "Cách ly lô hàng, lập biên bản hủy hoặc trả về nhà cung cấp nếu có bảo hành.",
          dismissed: false,
          createdAt: now.toISOString(),
        })
      } else if (diffDays <= 30) {
        alerts.push({
          id: `alt-expsoon-${batch.id}`,
          type: "expiring_soon",
          severity: "warning",
          materialId: batch.materialId,
          materialCode: batch.materialCode,
          materialName: batch.materialName,
          warehouseId: batch.warehouseId,
          warehouseCode: batch.warehouseCode,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          currentQuantity: batch.initialQuantity,
          message: `Lô "${batch.batchNumber}" (${batch.materialName}) sẽ hết hạn trong ${diffDays} ngày tới (Hạn: ${batch.expiryDate}).`,
          actionSuggestion: "Áp dụng nguyên tắc FEFO, ưu tiên xuất lô này cho các nhiệm vụ đang thi công.",
          dismissed: false,
          createdAt: now.toISOString(),
        })
      }
    }
  }

  return alerts
}
