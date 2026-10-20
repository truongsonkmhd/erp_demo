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
import type {
  GoodsIssue,
  GoodsIssueLine,
  Material,
  StockBatch,
  StockLevel,
  Warehouse,
} from "../types/inventory.types"
import { GoodsIssueRepository } from "../repositories/inventory.storage"

interface GoodsIssueFormDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingIssue?: GoodsIssue | null
  materials: Material[]
  warehouses: Warehouse[]
  stockLevels: StockLevel[]
  batches: StockBatch[]
}

const DEPARTMENTS = [
  "Đoàn Địa vật lý Máy bay",
  "Đoàn Địa vật lý Biển",
  "Đoàn Địa vật lý Mặt đất",
  "Trung tâm Phân tích & Xử lý Dữ liệu",
  "Phòng Kế hoạch - Kỹ thuật",
  "Phòng Tài chính - Kế toán",
]

export function GoodsIssueFormDrawer({
  open,
  onClose,
  onSuccess,
  editingIssue,
  materials,
  warehouses,
  stockLevels,
  batches,
}: GoodsIssueFormDrawerProps) {
  // Form states
  const [code, setCode] = useState("")
  const [issueDate, setIssueDate] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [receiverName, setReceiverName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [projectItem, setProjectItem] = useState("")
  const [reason, setReason] = useState("")
  const [lines, setLines] = useState<GoodsIssueLine[]>([])

  useEffect(() => {
    if (editingIssue) {
      setCode(editingIssue.code)
      setIssueDate(editingIssue.issueDate)
      setWarehouseId(editingIssue.warehouseId)
      setDepartment(editingIssue.department)
      setReceiverName(editingIssue.receiverName)
      setProjectName(editingIssue.projectName)
      setProjectItem(editingIssue.projectItem || "")
      setReason(editingIssue.reason)
      setLines(editingIssue.lines || [])
    } else {
      setCode(`PXK-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`)
      setIssueDate(new Date().toISOString().split("T")[0])
      setWarehouseId(warehouses[0]?.id || "")
      setDepartment(DEPARTMENTS[0])
      setReceiverName("")
      setProjectName("Bay đo Từ - Trọng lực tỷ lệ 1:50.000 khu vực Tây Bắc")
      setProjectItem("Trạm đo biến thiên từ trường cơ sở dã ngoại")
      setReason("Cấp vật tư thực địa phục vụ thi công nhiệm vụ")
      setLines([])
    }
  }, [editingIssue, open, warehouses])

  const handleAddLine = () => {
    const firstMat = materials[0]
    // Tìm tồn khả dụng của vật tư này trong kho đã chọn
    const matchedStock = stockLevels.find(
      (s) => s.materialId === firstMat?.id && s.warehouseId === warehouseId
    )

    setLines((prev) => [
      ...prev,
      {
        id: `isl-${Date.now()}`,
        materialId: firstMat?.id || "",
        materialCode: firstMat?.code || "VT-01",
        materialName: firstMat?.name || "Vật tư",
        unit: firstMat?.unit || "Cái",
        requestedQuantity: 1,
        approvedQuantity: 1,
        actualQuantity: 1,
        unitPrice: matchedStock?.unitPrice || 0,
        totalAmount: (matchedStock?.unitPrice || 0) * 1,
        batchNumber: matchedStock?.batchNumber || "",
      },
    ])
  }

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, index) => index !== idx))
  }

  const handleLineChange = (index: number, field: keyof GoodsIssueLine, value: any) => {
    setLines((prev) => {
      const next = [...prev]
      const current = { ...next[index], [field]: value }

      if (field === "materialId") {
        const mat = materials.find((m) => m.id === value)
        const matchedStock = stockLevels.find(
          (s) => s.materialId === value && s.warehouseId === warehouseId
        )
        if (mat) {
          current.materialCode = mat.code
          current.materialName = mat.name
          current.unit = mat.unit
          current.unitPrice = matchedStock?.unitPrice || 0
          current.batchNumber = matchedStock?.batchNumber || ""
          current.totalAmount = (matchedStock?.unitPrice || 0) * current.requestedQuantity
        }
      }

      if (field === "requestedQuantity") {
        const q = Number(value)
        current.approvedQuantity = q
        current.actualQuantity = q
        current.totalAmount = q * (current.unitPrice || 0)
      }

      next[index] = current
      return next
    })
  }

  const totalAmount = lines.reduce((sum, l) => sum + (l.totalAmount || 0), 0)
  const totalQuantity = lines.reduce((sum, l) => sum + (l.requestedQuantity || 0), 0)

  const handleSave = (status: "draft" | "pending_approval") => {
    if (!warehouseId) {
      toast.error("Vui lòng chọn kho xuất")
      return
    }

    if (!projectName.trim()) {
      toast.error("Vui lòng nhập tên Nhiệm vụ / Đề án")
      return
    }

    if (!receiverName.trim()) {
      toast.error("Vui lòng nhập tên cán bộ nhận vật tư")
      return
    }

    if (lines.length === 0) {
      toast.error("Vui lòng thêm ít nhất một dòng hàng xuất kho")
      return
    }

    // Kiểm tra tồn khả dụng
    for (const line of lines) {
      const availableLevel = stockLevels.find(
        (s) =>
          s.materialId === line.materialId &&
          s.warehouseId === warehouseId &&
          (!line.batchNumber || s.batchNumber === line.batchNumber)
      )

      const available = availableLevel ? availableLevel.availableQuantity : 0
      if (line.requestedQuantity > available) {
        toast.error(
          `Vật tư "${line.materialName}" không đủ tồn khả dụng (Yêu cầu: ${line.requestedQuantity}, Khả dụng: ${available}). Vui lòng giảm số lượng!`
        )
        return
      }
    }

    const selectedWh = warehouses.find((w) => w.id === warehouseId)

    const payload: GoodsIssue = {
      id: editingIssue?.id || `is-${Date.now()}`,
      code,
      issueDate,
      warehouseId,
      warehouseCode: selectedWh?.code || "",
      warehouseName: selectedWh?.name || "",
      projectName: projectName.trim(),
      projectItem: projectItem.trim(),
      department,
      receiverName: receiverName.trim(),
      status: editingIssue ? editingIssue.status : status,
      lines,
      totalQuantity,
      totalAmount,
      reason: reason.trim() || "Cấp dùng nhiệm vụ",
      createdAt: editingIssue?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    GoodsIssueRepository.save(payload)
    toast.success(
      editingIssue ? "Cập nhật phiếu xuất kho thành công!" : "Tạo phiếu xuất kho thành công!"
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
            {editingIssue ? `Chỉnh sửa: ${editingIssue.code}` : "Lập phiếu xuất kho (PRC-06)"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Xuất cấp vật tư, trang thiết bị chuyên dụng phục vụ thi công nhiệm vụ, đề án địa vật lý.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Thông tin chung */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã phiếu xuất *</Label>
              <Input value={code} readOnly className="h-8.5 text-xs font-mono bg-muted/40" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ngày xuất kho *</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kho xuất hàng *</Label>
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
              <Label className="text-xs font-semibold">Nhiệm vụ / Đề án *</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="VD: Bay đo Từ - Trọng lực Tây Bắc..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Hạng mục nhiệm vụ</Label>
              <Input
                value={projectItem}
                onChange={(e) => setProjectItem(e.target.value)}
                placeholder="Hạng mục thi công..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Đơn vị tiếp nhận *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cán bộ nhận vật tư *</Label>
              <Input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Họ tên cán bộ..."
                className="h-8.5 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Lý do / Mục đích xuất</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mục đích..."
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          {/* Dòng hàng xuất */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">
                Danh sách vật tư yêu cầu xuất ({lines.length})
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
                    s.warehouseId === warehouseId &&
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
                          Khả dụng trong kho:{" "}
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
                        <Label className="text-[11px]">Chọn vật tư xuất *</Label>
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
                        <Label className="text-[11px]">Số lượng xin cấp *</Label>
                        <Input
                          type="number"
                          min="1"
                          max={currentAvailable}
                          value={line.requestedQuantity}
                          onChange={(e) =>
                            handleLineChange(idx, "requestedQuantity", Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">Lô xuất (Gợi ý FEFO/FIFO)</Label>
                        <Input
                          value={line.batchNumber || ""}
                          onChange={(e) => handleLineChange(idx, "batchNumber", e.target.value)}
                          placeholder="Số lô..."
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px]">Đơn giá bình quân</Label>
                        <div className="h-8 px-2.5 rounded-md bg-muted/40 border border-border flex items-center font-mono text-muted-foreground truncate">
                          {formatVND(line.unitPrice)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px]">Dự toán thành tiền</Label>
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
                  Tổng dự toán: {formatVND(totalAmount)}
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
              Trình duyệt xuất kho
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
