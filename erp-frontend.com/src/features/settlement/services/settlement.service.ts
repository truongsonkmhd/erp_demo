import type { GoodsIssue, InventoryTransaction } from "@/features/inventory/types/inventory.types"
import type {
  MaterialReturn,
  MaterialSettlement,
  MaterialSettlementLine,
} from "../types/settlement.types"

/**
 * 1. Tổng hợp các dòng vật tư đã xuất kho theo Nhiệm vụ/Đề án & Hạng mục
 * Chỉ tổng hợp từ các phiếu xuất kho đã ghi sổ thực tế (status === "posted")
 */
export function aggregateGoodsIssuesForSettlement(
  missionName: string,
  categoryName: string,
  postedGoodsIssues: GoodsIssue[],
  existingReturns: MaterialReturn[] = []
): MaterialSettlementLine[] {
  // Lọc các phiếu xuất kho đã ghi sổ đúng nhiệm vụ và hạng mục
  const matchedIssues = postedGoodsIssues.filter(
    (issue) =>
      issue.status === "posted" &&
      issue.projectName?.trim().toLowerCase() === missionName.trim().toLowerCase() &&
      (!categoryName || issue.projectItem?.trim().toLowerCase() === categoryName.trim().toLowerCase())
  )

  // Tính số lượng đã hoàn trả trước đó cho từng vật tư + số lô
  const returnedMap = new Map<string, number>()
  for (const ret of existingReturns) {
    if (ret.status === "posted") {
      for (const retLine of ret.lines) {
        const key = `${retLine.materialId}_${retLine.batchNumber || "NO_BATCH"}_${retLine.warehouseId}`
        returnedMap.set(key, (returnedMap.get(key) || 0) + retLine.returnQuantity)
      }
    }
  }

  // Gom các dòng vật tư đã xuất
  const aggregatedLines: MaterialSettlementLine[] = []

  for (const issue of matchedIssues) {
    for (const line of issue.lines) {
      const lineKey = `${line.materialId}_${line.batchNumber || "NO_BATCH"}_${issue.warehouseId}`
      const alreadyReturned = returnedMap.get(lineKey) || 0

      const issuedQty = line.actualQuantity || line.requestedQuantity || 0
      // Số lượng hoàn trả gắn với dòng này (không vượt quá số xuất)
      const allocatedReturn = Math.min(issuedQty, alreadyReturned)
      // Cập nhật lại số lượng hoàn trả còn lại trong map
      returnedMap.set(lineKey, Math.max(0, alreadyReturned - allocatedReturn))

      const actualUsed = Math.max(0, issuedQty - allocatedReturn)
      const price = line.unitPrice || 0

      aggregatedLines.push({
        id: `stl-${line.id}-${Date.now().toString().slice(-4)}`,
        materialId: line.materialId,
        materialCode: line.materialCode,
        materialName: line.materialName,
        unit: line.unit,
        specification: line.specification,
        batchNumber: line.batchNumber,
        sourceWarehouseId: issue.warehouseId,
        sourceWarehouseName: issue.warehouseName,
        goodsIssueId: issue.id,
        goodsIssueCode: issue.code,
        issuedQuantity: issuedQty,
        returnedQuantity: allocatedReturn,
        actualUsedQuantity: actualUsed,
        unitPrice: price,
        totalIssuedAmount: issuedQty * price,
        totalReturnedAmount: allocatedReturn * price,
        actualUsedAmount: actualUsed * price,
      })
    }
  }

  return aggregatedLines
}

/**
 * 2. Tính toán tổng hợp giá trị của hồ sơ quyết toán
 */
export function calculateSettlementTotals(lines: MaterialSettlementLine[]) {
  const totalIssuedAmount = lines.reduce((sum, l) => sum + (l.totalIssuedAmount || 0), 0)
  const totalReturnedAmount = lines.reduce((sum, l) => sum + (l.totalReturnedAmount || 0), 0)
  const totalActualUsedAmount = lines.reduce((sum, l) => sum + (l.actualUsedAmount || 0), 0)

  return {
    totalIssuedAmount,
    totalReturnedAmount,
    totalActualUsedAmount,
  }
}

/**
 * 3. Kiểm tra tính hợp lệ của số lượng hoàn trả
 * Không cho hoàn trả vượt quá (số đã xuất - số đã hoàn trả trước đó)
 */
export function validateReturnQuantities(
  returnLines: { settlementLineId: string; returnQuantity: number; materialName: string }[],
  settlementLines: MaterialSettlementLine[]
): { valid: boolean; message?: string } {
  for (const retLine of returnLines) {
    if (retLine.returnQuantity <= 0) {
      return {
        valid: false,
        message: `Số lượng hoàn trả cho vật tư "${retLine.materialName}" phải lớn hơn 0.`,
      }
    }

    const matchedSettlementLine = settlementLines.find((l) => l.id === retLine.settlementLineId)
    if (!matchedSettlementLine) {
      return {
        valid: false,
        message: `Không tìm thấy dòng xuất kho tương ứng của vật tư "${retLine.materialName}".`,
      }
    }

    const maxReturnable = matchedSettlementLine.issuedQuantity - matchedSettlementLine.returnedQuantity
    if (retLine.returnQuantity > maxReturnable) {
      return {
        valid: false,
        message: `Số lượng hoàn trả cho "${retLine.materialName}" (${retLine.returnQuantity}) vượt quá số lượng còn lại có thể hoàn (${maxReturnable} ${matchedSettlementLine.unit}).`,
      }
    }
  }

  return { valid: true }
}

/**
 * 4. Sinh các giao dịch kho bất biến loại "return" để tăng tồn kho khi ghi sổ phiếu hoàn trả
 */
export function createReturnTransactions(
  returnDoc: MaterialReturn,
  settlement: MaterialSettlement
): InventoryTransaction[] {
  const timestamp = new Date().toISOString()
  const transactions: InventoryTransaction[] = []

  returnDoc.lines.forEach((line, index) => {
    const tx: InventoryTransaction = {
      id: `tx-ret-${Date.now()}-${index}`,
      transactionCode: `GD-HT-${Date.now().toString().slice(-6)}-${index + 1}`,
      type: "return",
      sourceDocumentType: "adjustment",
      sourceDocumentId: returnDoc.id,
      sourceDocumentCode: returnDoc.code,
      materialId: line.materialId,
      materialCode: line.materialCode,
      materialName: line.materialName,
      batchNumber: line.batchNumber,
      warehouseId: line.warehouseId,
      warehouseCode: "KHO-HT",
      warehouseName: line.warehouseName,
      quantity: line.returnQuantity,
      unitPrice: line.unitPrice,
      totalAmount: line.totalAmount,
      timestamp,
      postedBy: returnDoc.receiverName || "Thủ kho",
      projectName: settlement.missionName,
      projectItem: settlement.categoryName,
      notes: `Nhập hoàn trả từ hồ sơ quyết toán ${settlement.code}: ${line.reason || returnDoc.notes || ""}`,
    }
    transactions.push(tx)
  })

  return transactions
}
