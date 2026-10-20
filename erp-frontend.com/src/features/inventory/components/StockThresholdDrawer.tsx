import React, { useState } from "react"
import { AlertCircle, Plus, Sliders, Trash2 } from "lucide-react"
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
import type { Material, StockThreshold, Warehouse } from "../types/inventory.types"
import { StockThresholdRepository } from "../repositories/inventory.storage"

interface StockThresholdDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  materials: Material[]
  warehouses: Warehouse[]
  thresholds: StockThreshold[]
}

export function StockThresholdDrawer({
  open,
  onClose,
  onSuccess,
  materials,
  warehouses,
  thresholds,
}: StockThresholdDrawerProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("all")
  const [minQty, setMinQty] = useState<number>(5)
  const [maxQty, setMaxQty] = useState<number>(20)

  const handleSave = () => {
    if (!selectedMaterialId) {
      toast.error("Vui lòng chọn vật tư")
      return
    }

    if (minQty < 0 || maxQty < 0) {
      toast.error("Định mức không được âm")
      return
    }

    if (maxQty > 0 && minQty > maxQty) {
      toast.error("Định mức tối thiểu không được lớn hơn tối đa")
      return
    }

    const mat = materials.find((m) => m.id === selectedMaterialId)
    const wh = warehouses.find((w) => w.id === selectedWarehouseId)

    const payload: StockThreshold = {
      id: `th-${selectedMaterialId}-${selectedWarehouseId}`,
      materialId: selectedMaterialId,
      materialCode: mat?.code || "",
      warehouseId: selectedWarehouseId,
      warehouseCode: selectedWarehouseId === "all" ? "Tất cả kho" : wh?.code || "",
      minQuantity: Number(minQty),
      maxQuantity: Number(maxQty),
      updatedAt: new Date().toISOString(),
    }

    StockThresholdRepository.save(payload)
    toast.success("Đã lưu thiết lập định mức tồn kho!")
    onSuccess()
  }

  const handleDelete = (th: StockThreshold) => {
    StockThresholdRepository.remove(th.id)
    toast.success("Đã xóa định mức")
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/70 shrink-0">
          <DialogTitle className="text-lg font-bold">Thiết lập định mức tồn kho (Min / Max)</DialogTitle>
          <DialogDescription className="text-xs">
            Cấu hình ngưỡng an toàn tối thiểu và mức trần tồn kho để tự động kích hoạt cảnh báo PRC-09.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Form thêm/cập nhật */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3.5">
            <div className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Sliders className="h-4 w-4" />
              <span>Cấu hình định mức</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Chọn vật tư *</Label>
              <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                <SelectTrigger className="h-8.5 text-xs">
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
              <Label className="text-xs font-semibold">Phạm vi kho áp dụng *</Label>
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Tất cả kho (Áp dụng toàn Liên đoàn)
                  </SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs">
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tồn tối thiểu (Min) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={minQty}
                  onChange={(e) => setMinQty(Number(e.target.value))}
                  className="h-8.5 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Dưới ngưỡng này sẽ cảnh báo</span>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tồn tối đa (Max) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxQty}
                  onChange={(e) => setMaxQty(Number(e.target.value))}
                  className="h-8.5 text-xs font-mono"
                />
                <span className="text-[10px] text-muted-foreground">Vượt ngưỡng này sẽ cảnh báo thừa</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={handleSave} className="h-8 text-xs font-medium">
                Lưu cấu hình
              </Button>
            </div>
          </div>

          {/* Danh sách định mức đã cấu hình */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground">
              Định mức đang thiết lập ({thresholds.length})
            </span>

            {thresholds.map((th) => {
              const mat = materials.find((m) => m.id === th.materialId)
              const wh = warehouses.find((w) => w.id === th.warehouseId)
              const whName = th.warehouseId === "all" ? "Tất cả kho" : wh?.name || th.warehouseCode

              return (
                <div
                  key={th.id}
                  className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {mat ? `${mat.code} - ${mat.name}` : th.materialCode}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Kho: <strong className="text-foreground">{whName}</strong>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono pt-0.5">
                      <span className="text-amber-600 font-bold">Min: {th.minQuantity} {mat?.unit || ""}</span>
                      <span className="text-blue-600 font-bold">Max: {th.maxQuantity} {mat?.unit || ""}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(th)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    title="Xóa định mức"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
