import React, { useEffect, useState } from "react"
import { AlertCircle, Calendar, Plus, Trash2 } from "lucide-react"
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
import type { GoodsReceipt, GoodsReceiptLine, Material, Warehouse } from "../types/inventory.types"
import { PurchaseContractRepository } from "@/features/procurement/repositories/procurement.storage"
import { GoodsReceiptRepository } from "../repositories/inventory.storage"

interface GoodsReceiptFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingReceipt?: GoodsReceipt | null
  materials: Material[]
  warehouses: Warehouse[]
}

export function GoodsReceiptFormDrawer({
  open,
  onClose,
  onSuccess,
  editingReceipt,
  materials,
  warehouses,
}: GoodsReceiptFormDrawerProps) {
  // Lấy danh sách hợp đồng mua sắm
  const [contracts, setContracts] = useState<any[]>([])

  // Form states
  const [code, setCode] = useState("")
  const [receiptDate, setReceiptDate] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [selectedContractId, setSelectedContractId] = useState("none")
  const [delivererName, setDelivererName] = useState("")
  const [delivererPhone, setDelivererPhone] = useState("")
  const [receiverName, setReceiverName] = useState("")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<GoodsReceiptLine[]>([])

  useEffect(() => {
    try {
      const allContracts = PurchaseContractRepository.list()
      setContracts(allContracts)
    } catch {
      setContracts([])
    }
  }, [open])

  useEffect(() => {
    if (editingReceipt) {
      setCode(editingReceipt.code)
      setReceiptDate(editingReceipt.receiptDate)
      setWarehouseId(editingReceipt.warehouseId)
      setSelectedContractId(editingReceipt.contractId || "none")
      setDelivererName(editingReceipt.delivererName)
      setDelivererPhone(editingReceipt.delivererPhone || "")
      setReceiverName(editingReceipt.receiverName)
      setNotes(editingReceipt.notes || "")
      setLines(editingReceipt.lines || [])
    } else {
      setCode(`PNK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`)
      setReceiptDate(new Date().toISOString().split("T")[0])
      setWarehouseId(warehouses[0]?.id || "")
      setSelectedContractId("none")
      setDelivererName("")
      setDelivererPhone("")
      setReceiverName("Trần Văn Toàn (Thủ kho chính)")
      setNotes("")
      setLines([])
    }
  }, [editingReceipt, open, warehouses])

  // Khi chọn hợp đồng mua sắm -> Tự động điền các dòng hàng
  const handleSelectContract = (ctId: string) => {
    setSelectedContractId(ctId)
    if (ctId === "none") return

    const ct = contracts.find((c) => c.id === ctId)
    if (!ct) return

    setDelivererName(ct.supplierName || "")

    if (ct.lines && ct.lines.length > 0) {
      const generatedLines: GoodsReceiptLine[] = ct.lines.map((l: any, idx: number) => {
        // Tìm vật tư tương ứng trong danh mục nếu có
        const matchedMat = materials.find(
          (m) => m.name.toLowerCase() === l.materialName.toLowerCase()
        )
        return {
          id: `line-${Date.now()}-${idx}`,
          materialId: matchedMat?.id || `mat-custom-${idx}`,
          materialCode: matchedMat?.code || `VT-HĐ-${idx + 1}`,
          materialName: l.materialName,
          unit: l.unit || "Bộ",
          orderedQuantity: l.quantity,
          receivedQuantity: l.quantity,
          unitPrice: l.unitPrice,
          totalAmount: l.totalAmount || l.quantity * l.unitPrice,
          batchNumber: `LO-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}${idx}`,
          qualityStatus: "passed",
        }
      })
      setLines(generatedLines)
    }
  }

  const handleAddLine = () => {
    const firstMat = materials[0]
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        materialId: firstMat?.id || "",
        materialCode: firstMat?.code || "VT-NEW",
        materialName: firstMat?.name || "Vật tư mới",
        unit: firstMat?.unit || "Cái",
        orderedQuantity: 1,
        receivedQuantity: 1,
        unitPrice: 0,
        totalAmount: 0,
        batchNumber: `LO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        qualityStatus: "passed",
      },
    ])
  }

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleLineChange = (index: number, field: keyof GoodsReceiptLine, value: any) => {
    setLines((prev) => {
      const next = [...prev]
      const current = { ...next[index], [field]: value }

      if (field === "materialId") {
        const mat = materials.find((m) => m.id === value)
        if (mat) {
          current.materialCode = mat.code
          current.materialName = mat.name
          current.unit = mat.unit
        }
      }

      if (field === "receivedQuantity" || field === "unitPrice") {
        const q = field === "receivedQuantity" ? Number(value) : current.receivedQuantity
        const p = field === "unitPrice" ? Number(value) : current.unitPrice
        current.totalAmount = (q || 0) * (p || 0)
      }

      next[index] = current
      return next
    })
  }

  const totalAmount = lines.reduce((sum, l) => sum + (l.totalAmount || 0), 0)
  const totalQuantity = lines.reduce((sum, l) => sum + (l.receivedQuantity || 0), 0)

  const handleSave = (status: "draft" | "pending_post") => {
    if (!warehouseId) {
      toast.error("Vui lòng chọn kho tiếp nhận")
      return
    }

    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một dòng hàng nhập kho")
      return
    }

    // Kiểm tra các dòng
    for (const line of lines) {
      if (line.receivedQuantity <= 0) {
        toast.error(`Số lượng nhập của "${line.materialName}" phải lớn hơn 0`)
        return
      }
      const mat = materials.find((m) => m.id === line.materialId)
      if (mat?.manageByExpiry && !line.expiryDate) {
        toast.error(`Vật tư "${line.materialName}" yêu cầu theo dõi hạn dùng. Vui lòng nhập ngày hết hạn!`)
        return
      }
    }

    const selectedWh = warehouses.find((w) => w.id === warehouseId)
    const selectedCt = contracts.find((c) => c.id === selectedContractId)

    const payload: GoodsReceipt = {
      id: editingReceipt?.id || `rc-${Date.now()}`,
      code,
      receiptDate,
      warehouseId,
      warehouseCode: selectedWh?.code || "",
      warehouseName: selectedWh?.name || "",
      supplierId: selectedCt?.supplierId,
      supplierName: selectedCt?.supplierName,
      contractId: selectedContractId === "none" ? undefined : selectedContractId,
      contractNumber: selectedCt?.contractNumber,
      requestCode: selectedCt?.requestCode,
      delivererName: delivererName.trim() || "Nhà cung cấp",
      delivererPhone: delivererPhone.trim(),
      receiverName: receiverName.trim() || "Thủ kho",
      status: editingReceipt ? editingReceipt.status : status,
      lines,
      totalQuantity,
      totalAmount,
      notes: notes.trim(),
      createdAt: editingReceipt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    GoodsReceiptRepository.save(payload)
    toast.success(
      editingReceipt ? "Cập nhật phiếu nhập kho thành công!" : "Tạo phiếu nhập kho thành công!"
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
            {editingReceipt ? `Chỉnh sửa: ${editingReceipt.code}` : "Lập phiếu nhập kho (PRC-05)"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tiếp nhận vật tư, thiết bị từ hợp đồng mua sắm hoặc mua sắm trực tiếp của Liên đoàn.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Thông tin chung */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã phiếu nhập *</Label>
              <Input value={code} readOnly className="h-8.5 text-xs font-mono bg-muted/40" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ngày nhập kho *</Label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kho tiếp nhận *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
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

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Hợp đồng mua sắm liên kết</Label>
              <Select value={selectedContractId} onValueChange={handleSelectContract}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue placeholder="Chọn hợp đồng mua sắm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    (Không liên kết HĐ / Nhập mua trực tiếp)
                  </SelectItem>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.contractNumber} - {c.contractName} ({c.supplierName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Thủ kho tiếp nhận *</Label>
              <Input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Người giao hàng</Label>
              <Input
                value={delivererName}
                onChange={(e) => setDelivererName(e.target.value)}
                placeholder="Đại diện nhà cung cấp..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">SĐT người giao</Label>
              <Input
                value={delivererPhone}
                onChange={(e) => setDelivererPhone(e.target.value)}
                placeholder="09..."
                className="h-8.5 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ghi chú phiếu</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú đợt giao..."
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          {/* Bảng dòng hàng nhập */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                Danh sách vật tư thực nhập ({lines.length})
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
              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary font-mono">#{idx + 1}</span>
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
                      <Label className="text-[11px]">Vật tư nhập *</Label>
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
                      <Label className="text-[11px]">Số lô sản xuất *</Label>
                      <Input
                        value={line.batchNumber}
                        onChange={(e) => handleLineChange(idx, "batchNumber", e.target.value)}
                        placeholder="LO-..."
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Số lượng nhập *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={line.receivedQuantity}
                        onChange={(e) =>
                          handleLineChange(idx, "receivedQuantity", Number(e.target.value))
                        }
                        className="h-8 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Đơn giá (VNĐ)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(idx, "unitPrice", Number(e.target.value))}
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Hạn dùng (nếu có)</Label>
                      <Input
                        type="date"
                        value={line.expiryDate || ""}
                        onChange={(e) => handleLineChange(idx, "expiryDate", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px]">Thành tiền</Label>
                      <div className="h-8 px-2.5 rounded-md bg-muted/40 border border-border flex items-center font-mono font-bold text-primary truncate">
                        {formatVND(line.totalAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lines.length > 0 && (
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border font-bold">
                <span>Tổng số lượng: {totalQuantity}</span>
                <span className="text-primary text-sm font-mono font-bold">
                  Tổng tiền: {formatVND(totalAmount)}
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
              onClick={() => handleSave("pending_post")}
              className="h-8 text-xs font-medium shadow-xs"
            >
              Lập phiếu chờ nhập
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
