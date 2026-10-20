import React, { useEffect, useState } from "react"
import { AlertCircle, ArrowDownLeft, Check, Package, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { MaterialReturn, MaterialReturnLine, MaterialSettlement } from "../types/settlement.types"
import { MaterialReturnRepository, MaterialSettlementRepository } from "../repositories/settlement.storage"
import { createReturnTransactions } from "../services/settlement.service"
import { InventoryLedgerRepository, WarehouseRepository } from "@/features/inventory/repositories/inventory.storage"

interface MaterialReturnModalProps {
  open: boolean
  onClose: () => void
  settlement: MaterialSettlement | null
  onSuccess: () => void
}

interface ReturnItemState {
  settlementLineId: string
  selected: boolean
  returnQuantity: number
  reason: string
}

export function MaterialReturnModal({
  open,
  onClose,
  settlement,
  onSuccess,
}: MaterialReturnModalProps) {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [warehouseId, setWarehouseId] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [returnedBy, setReturnedBy] = useState("")
  const [receiverName, setReceiverName] = useState("")
  const [notes, setNotes] = useState("")
  const [itemStates, setItemStates] = useState<Record<string, ReturnItemState>>({})

  useEffect(() => {
    if (open && settlement) {
      const whList = WarehouseRepository.list()
      setWarehouses(whList)
      setWarehouseId(whList[0]?.id || "")
      setReturnDate(new Date().toISOString().split("T")[0])
      setReturnedBy(settlement.personInCharge || "Cán bộ thi công")
      setReceiverName("Phạm Văn Long (Thủ kho)")
      setNotes("")

      // Khởi tạo state chọn dòng hoàn trả
      const initialStates: Record<string, ReturnItemState> = {}
      settlement.lines.forEach((line) => {
        const remaining = line.issuedQuantity - line.returnedQuantity
        initialStates[line.id] = {
          settlementLineId: line.id,
          selected: remaining > 0,
          returnQuantity: remaining > 0 ? remaining : 0,
          reason: "Vật tư không dùng hết hoặc thu hồi sau thi công",
        }
      })
      setItemStates(initialStates)
    }
  }, [open, settlement])

  if (!settlement) return null

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleToggleSelect = (lineId: string) => {
    setItemStates((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        selected: !prev[lineId]?.selected,
      },
    }))
  }

  const handleQuantityChange = (lineId: string, val: number, max: number) => {
    const validQty = Math.max(0, Math.min(val, max))
    setItemStates((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        returnQuantity: validQty,
      },
    }))
  }

  const handleReasonChange = (lineId: string, reason: string) => {
    setItemStates((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        reason,
      },
    }))
  }

  // Tính tổng số lượng và giá trị hoàn trả dự kiến
  const selectedLinesSummary = settlement.lines
    .filter((line) => itemStates[line.id]?.selected && itemStates[line.id]?.returnQuantity > 0)
    .map((line) => {
      const qty = itemStates[line.id].returnQuantity
      return {
        line,
        qty,
        amount: qty * line.unitPrice,
      }
    })

  const totalReturnQty = selectedLinesSummary.reduce((sum, item) => sum + item.qty, 0)
  const totalReturnAmount = selectedLinesSummary.reduce((sum, item) => sum + item.amount, 0)

  const handleSubmit = () => {
    if (!warehouseId) {
      toast.error("Vui lòng chọn kho tiếp nhận hoàn trả")
      return
    }
    if (selectedLinesSummary.length === 0) {
      toast.error("Vui lòng chọn ít nhất một vật tư có số lượng hoàn trả lớn hơn 0")
      return
    }

    const selectedWh = warehouses.find((w) => w.id === warehouseId)

    const returnCode = `HT-${Date.now().toString().slice(-4)}`
    const returnLines: MaterialReturnLine[] = selectedLinesSummary.map(({ line, qty, amount }) => ({
      id: `rtl-${Date.now()}-${line.id.slice(-4)}`,
      settlementLineId: line.id,
      materialId: line.materialId,
      materialCode: line.materialCode,
      materialName: line.materialName,
      unit: line.unit,
      batchNumber: line.batchNumber,
      warehouseId,
      warehouseName: selectedWh?.name || "Kho tiếp nhận",
      issuedQuantity: line.issuedQuantity,
      alreadyReturnedQuantity: line.returnedQuantity,
      returnQuantity: qty,
      unitPrice: line.unitPrice,
      totalAmount: amount,
      reason: itemStates[line.id]?.reason || notes,
    }))

    const returnDoc: MaterialReturn = {
      id: `ret-${Date.now()}`,
      code: returnCode,
      settlementId: settlement.id,
      settlementCode: settlement.code,
      missionId: settlement.missionId,
      missionName: settlement.missionName,
      categoryId: settlement.categoryId,
      categoryName: settlement.categoryName,
      returnDate,
      warehouseId,
      warehouseName: selectedWh?.name || "",
      returnedBy: returnedBy.trim() || "Cán bộ thi công",
      receiverName: receiverName.trim() || "Thủ kho",
      status: "posted",
      lines: returnLines,
      totalQuantity: totalReturnQty,
      totalAmount: totalReturnAmount,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 1. Lưu phiếu hoàn trả
    MaterialReturnRepository.save(returnDoc)

    // 2. Sinh giao dịch kho "return" và cập nhật sổ cái kho (tăng tồn kho)
    const txList = createReturnTransactions(returnDoc, settlement)
    InventoryLedgerRepository.appendMultiple(txList)

    // 3. Cập nhật hồ sơ quyết toán
    const updatedSettlementLines = settlement.lines.map((stlLine) => {
      const matchRet = returnLines.find((r) => r.settlementLineId === stlLine.id)
      if (matchRet) {
        const newReturnedQty = stlLine.returnedQuantity + matchRet.returnQuantity
        const newActualUsedQty = Math.max(0, stlLine.issuedQuantity - newReturnedQty)
        return {
          ...stlLine,
          returnedQuantity: newReturnedQty,
          actualUsedQuantity: newActualUsedQty,
          totalReturnedAmount: newReturnedQty * stlLine.unitPrice,
          actualUsedAmount: newActualUsedQty * stlLine.unitPrice,
        }
      }
      return stlLine
    })

    const newTotalIssued = updatedSettlementLines.reduce((s, l) => s + l.totalIssuedAmount, 0)
    const newTotalReturned = updatedSettlementLines.reduce((s, l) => s + l.totalReturnedAmount, 0)
    const newTotalActualUsed = updatedSettlementLines.reduce((s, l) => s + l.actualUsedAmount, 0)

    const updatedSettlement: MaterialSettlement = {
      ...settlement,
      lines: updatedSettlementLines,
      totalIssuedAmount: newTotalIssued,
      totalReturnedAmount: newTotalReturned,
      totalActualUsedAmount: newTotalActualUsed,
      updatedAt: new Date().toISOString(),
      history: [
        ...(settlement.history || []),
        {
          id: `h-ret-${Date.now()}`,
          settlementId: settlement.id,
          action: `Lập phiếu hoàn trả ${returnCode}`,
          toStatus: settlement.status,
          performedBy: returnedBy || "Cán bộ",
          performedByRole: "Thủ kho tiếp nhận",
          comment: `Hoàn kho ${totalReturnQty} đơn vị vật tư, giá trị: ${formatVND(totalReturnAmount)}. Tăng tồn kho tại ${selectedWh?.name}.`,
          timestamp: new Date().toISOString(),
        },
      ],
    }

    MaterialSettlementRepository.save(updatedSettlement)

    toast.success(
      `Lập phiếu hoàn trả "${returnCode}" thành công! Đã tăng tồn kho và cập nhật hồ sơ quyết toán.`
    )
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Lập phiếu hoàn trả vật tư về kho</DialogTitle>
              <DialogDescription className="text-xs">
                Gắn với hồ sơ quyết toán: <strong className="font-mono text-primary">{settlement.code}</strong> — {settlement.missionName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Thông tin chung phiếu hoàn trả */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border bg-muted/20">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kho nhận lại *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue placeholder="Chọn kho..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id} className="text-xs">
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ngày hoàn trả *</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Người giao trả *</Label>
              <Input
                value={returnedBy}
                onChange={(e) => setReturnedBy(e.target.value)}
                placeholder="Họ tên người trả..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Người tiếp nhận *</Label>
              <Input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Họ tên thủ kho..."
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          {/* Bảng chọn dòng vật tư hoàn trả */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" />
                <span>Danh mục vật tư xuất kho có thể hoàn trả</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Đã chọn hoàn trả: <strong className="text-emerald-600 font-mono">{totalReturnQty}</strong> vật tư
              </span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th className="p-2.5 w-10 text-center">Chọn</th>
                    <th className="p-2.5">Vật tư / Quy cách</th>
                    <th className="p-2.5 w-24 text-center">Số lô</th>
                    <th className="p-2.5 w-24 text-right">Đã xuất</th>
                    <th className="p-2.5 w-24 text-right">Đã trả</th>
                    <th className="p-2.5 w-28 text-center">Số lượng trả</th>
                    <th className="p-2.5 w-32 text-right">Đơn giá</th>
                    <th className="p-2.5 w-36 text-right">Thành tiền hoàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {settlement.lines.map((line) => {
                    const remaining = line.issuedQuantity - line.returnedQuantity
                    const state = itemStates[line.id] || { selected: false, returnQuantity: 0, reason: "" }
                    const isSelectable = remaining > 0

                    return (
                      <tr
                        key={line.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          state.selected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            disabled={!isSelectable}
                            checked={state.selected}
                            onChange={() => handleToggleSelect(line.id)}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer disabled:opacity-40"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="font-mono font-bold text-primary">{line.materialCode}</div>
                          <div className="font-medium text-foreground truncate max-w-[200px]">{line.materialName}</div>
                          <div className="text-[10px] text-muted-foreground">ĐVT: {line.unit}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px] text-muted-foreground">
                          {line.batchNumber || "—"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold">
                          {line.issuedQuantity}
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          {line.returnedQuantity}
                        </td>
                        <td className="p-2.5">
                          {isSelectable ? (
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              disabled={!state.selected}
                              value={state.returnQuantity}
                              onChange={(e) =>
                                handleQuantityChange(line.id, Number(e.target.value), remaining)
                              }
                              className="h-7 text-xs text-right font-mono w-24 mx-auto"
                            />
                          ) : (
                            <span className="text-[10px] text-muted-foreground block text-center">Đã trả hết</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          {formatVND(line.unitPrice)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {formatVND(state.selected ? state.returnQuantity * line.unitPrice : 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Lý do / Biên bản kiểm nghiệm hoàn trả</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về tình trạng kỹ thuật của thiết bị khi hoàn trả (hoạt động tốt, nguyên niêm phong...)"
              rows={2}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-between items-center bg-muted/10 shrink-0">
          <div className="text-xs">
            <span className="text-muted-foreground">Tổng giá trị hoàn kho: </span>
            <strong className="text-emerald-600 font-mono text-sm">{formatVND(totalReturnAmount)}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8.5 text-xs">
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              className="h-8.5 text-xs font-medium gap-1.5 shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Xác nhận ghi sổ hoàn trả</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
