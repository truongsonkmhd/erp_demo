import React, { useEffect, useState } from "react"
import { ArrowRight, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  Material,
  StockLevel,
  StockTransfer,
  StockTransferLine,
  Warehouse,
} from "../types/inventory.types"
import { StockTransferRepository } from "../repositories/inventory.storage"

interface StockTransferFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingTransfer?: StockTransfer | null
  materials: Material[]
  warehouses: Warehouse[]
  stockLevels: StockLevel[]
}

export function StockTransferFormDrawer({
  open,
  onClose,
  onSuccess,
  editingTransfer,
  materials,
  warehouses,
  stockLevels,
}: StockTransferFormDrawerProps) {
  // Form states
  const [code, setCode] = useState("")
  const [transferDate, setTransferDate] = useState("")
  const [sourceWarehouseId, setSourceWarehouseId] = useState("")
  const [targetWarehouseId, setTargetWarehouseId] = useState("")
  const [dispatcherName, setDispatcherName] = useState("")
  const [receiverName, setReceiverName] = useState("")
  const [transporterName, setTransporterName] = useState("")
  const [reason, setReason] = useState("")
  const [lines, setLines] = useState<StockTransferLine[]>([])

  useEffect(() => {
    if (editingTransfer) {
      setCode(editingTransfer.code)
      setTransferDate(editingTransfer.transferDate)
      setSourceWarehouseId(editingTransfer.sourceWarehouseId)
      setTargetWarehouseId(editingTransfer.targetWarehouseId)
      setDispatcherName(editingTransfer.dispatcherName)
      setReceiverName(editingTransfer.receiverName)
      setTransporterName(editingTransfer.transporterName || "")
      setReason(editingTransfer.reason)
      setLines(editingTransfer.lines || [])
    } else {
      setCode(`PDC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`)
      setTransferDate(new Date().toISOString().split("T")[0])
      setSourceWarehouseId(warehouses[0]?.id || "")
      setTargetWarehouseId(warehouses[1]?.id || "")
      setDispatcherName("Trần Văn Toàn (Thủ kho chính)")
      setReceiverName("Thủ kho nhận")
      setTransporterName("Xe chuyên dụng Liên đoàn (29A-882.19)")
      setReason("Điều chuyển cân đối vật tư phục vụ thi công nhiệm vụ")
      setLines([])
    }
  }, [editingTransfer, open, warehouses])

  const handleAddLine = () => {
    const firstMat = materials[0]
    const matchedStock = stockLevels.find(
      (s) => s.materialId === firstMat?.id && s.warehouseId === sourceWarehouseId
    )

    setLines((prev) => [
      ...prev,
      {
        id: `tfl-${Date.now()}`,
        materialId: firstMat?.id || "",
        materialCode: firstMat?.code || "VT-01",
        materialName: firstMat?.name || "Vật tư",
        unit: firstMat?.unit || "Cái",
        batchNumber: matchedStock?.batchNumber || "",
        unitPrice: matchedStock?.unitPrice || 0,
        dispatchedQuantity: 1,
        receivedQuantity: 0,
        discrepancyQuantity: 0,
        totalAmount: (matchedStock?.unitPrice || 0) * 1,
      },
    ])
  }

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, index) => index !== idx))
  }

  const handleLineChange = (index: number, field: keyof StockTransferLine, value: any) => {
    setLines((prev) => {
      const next = [...prev]
      const current = { ...next[index], [field]: value }

      if (field === "materialId") {
        const mat = materials.find((m) => m.id === value)
        const matchedStock = stockLevels.find(
          (s) => s.materialId === value && s.warehouseId === sourceWarehouseId
        )
        if (mat) {
          current.materialCode = mat.code
          current.materialName = mat.name
          current.unit = mat.unit
          current.batchNumber = matchedStock?.batchNumber || ""
          current.unitPrice = matchedStock?.unitPrice || 0
          current.totalAmount = (matchedStock?.unitPrice || 0) * current.dispatchedQuantity
        }
      }

      if (field === "dispatchedQuantity") {
        const q = Number(value)
        current.totalAmount = q * (current.unitPrice || 0)
      }

      next[index] = current
      return next
    })
  }

  const totalAmount = lines.reduce((sum, l) => sum + (l.totalAmount || 0), 0)
  const totalQuantity = lines.reduce((sum, l) => sum + (l.dispatchedQuantity || 0), 0)

  const handleSave = (status: "draft" | "pending_approval") => {
    if (!sourceWarehouseId || !targetWarehouseId) {
      toast.error("Vui lòng chọn cả kho xuất và kho nhận")
      return
    }

    if (sourceWarehouseId === targetWarehouseId) {
      toast.error("Kho xuất và kho nhận không được trùng nhau!")
      return
    }

    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một dòng hàng điều chuyển")
      return
    }

    // Kiểm tra tồn khả dụng kho nguồn
    for (const line of lines) {
      const availableLevel = stockLevels.find(
        (s) =>
          s.materialId === line.materialId &&
          s.warehouseId === sourceWarehouseId &&
          (!line.batchNumber || s.batchNumber === line.batchNumber)
      )

      const available = availableLevel ? availableLevel.availableQuantity : 0
      if (line.dispatchedQuantity > available) {
        toast.error(
          `Vật tư "${line.materialName}" tại kho xuất không đủ khả dụng (Cần xuất: ${line.dispatchedQuantity}, Khả dụng: ${available}). Vui lòng giảm số lượng!`
        )
        return
      }
    }

    const sourceWh = warehouses.find((w) => w.id === sourceWarehouseId)
    const targetWh = warehouses.find((w) => w.id === targetWarehouseId)

    const payload: StockTransfer = {
      id: editingTransfer?.id || `tf-${Date.now()}`,
      code,
      transferDate,
      sourceWarehouseId,
      sourceWarehouseCode: sourceWh?.code || "",
      sourceWarehouseName: sourceWh?.name || "",
      targetWarehouseId,
      targetWarehouseCode: targetWh?.code || "",
      targetWarehouseName: targetWh?.name || "",
      dispatcherName: dispatcherName.trim() || "Thủ kho xuất",
      receiverName: receiverName.trim() || "Thủ kho nhận",
      transporterName: transporterName.trim(),
      reason: reason.trim(),
      status: editingTransfer ? editingTransfer.status : status,
      lines,
      totalDispatchedQuantity: totalQuantity,
      totalReceivedQuantity: 0,
      totalAmount,
      createdAt: editingTransfer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    StockTransferRepository.save(payload)
    toast.success(
      editingTransfer ? "Cập nhật lệnh điều chuyển thành công!" : "Tạo lệnh điều chuyển thành công!"
    )
    onSuccess()
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/70 shrink-0">
          <DialogTitle className="text-lg font-bold">
            {editingTransfer ? `Chỉnh sửa: ${editingTransfer.code}` : "Lập lệnh điều chuyển kho (PRC-08)"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Điều động thiết bị, vật tư giữa hai đầu kho trong toàn hệ thống Liên đoàn.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Thông tin 2 đầu kho */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-purple-700">Kho xuất (Nguồn) *</Label>
                <Select value={sourceWarehouseId} onValueChange={setSourceWarehouseId}>
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-emerald-700">Kho nhận (Đích) *</Label>
                <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mã lệnh điều chuyển *</Label>
                <Input value={code} readOnly className="h-8.5 text-xs font-mono bg-muted/40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Ngày điều chuyển *</Label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phương tiện vận chuyển</Label>
                <Input
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="Xe chuyên dụng..."
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Người giao (Kho nguồn)</Label>
                <Input
                  value={dispatcherName}
                  onChange={(e) => setDispatcherName(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Người nhận (Kho đích)</Label>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Lý do điều chuyển</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Lý do cân đối nguồn lực..."
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          {/* Dòng hàng điều chuyển */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                Danh sách vật tư điều chuyển ({lines.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Thêm dòng vật tư</span>
              </Button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, idx) => {
                const availableLevel = stockLevels.find(
                  (s) =>
                    s.materialId === line.materialId &&
                    s.warehouseId === sourceWarehouseId &&
                    (!line.batchNumber || s.batchNumber === line.batchNumber)
                )
                const currentAvailable = availableLevel ? availableLevel.availableQuantity : 0

                return (
                  <div
                    key={line.id}
                    className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary font-mono">#{idx + 1}</span>
                        <span className="text-[11px] text-muted-foreground">
                          Khả dụng kho xuất:{" "}
                          <strong className="text-emerald-600 font-mono font-bold">
                            {currentAvailable} {line.unit}
                          </strong>
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLine(idx)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-[11px]">Vật tư điều chuyển *</Label>
                        <Select
                          value={line.materialId}
                          onValueChange={(val) => handleLineChange(idx, "materialId", val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((m) => (
                              <SelectItem key={m.id} value={m.id} className="text-xs">
                                {m.code} - {m.name} ({m.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px]">Số lượng xuất *</Label>
                        <Input
                          type="number"
                          min="1"
                          max={currentAvailable}
                          value={line.dispatchedQuantity}
                          onChange={(e) =>
                            handleLineChange(idx, "dispatchedQuantity", Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Lô xuất xưởng</Label>
                        <Input
                          value={line.batchNumber || ""}
                          onChange={(e) => handleLineChange(idx, "batchNumber", e.target.value)}
                          placeholder="Số lô..."
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px]">Giá trị ước tính</Label>
                        <div className="h-8 px-2.5 rounded-md bg-muted/40 border border-border flex items-center font-mono font-bold text-primary truncate">
                          {formatVND(line.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {lines.length > 0 && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border font-bold">
                <span>Tổng số lượng: {totalQuantity}</span>
                <span className="text-primary text-sm font-mono font-bold">
                  Tổng giá trị: {formatVND(totalAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-between items-center bg-muted/10 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Hủy
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave("draft")}
              className="h-8 text-xs"
            >
              Lưu bản nháp
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave("pending_approval")}
              className="h-8 text-xs font-medium shadow-xs"
            >
              Trình duyệt điều chuyển
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
