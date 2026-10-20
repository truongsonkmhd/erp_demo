import React, { useState } from "react"
import { Building2, MapPin, Phone, Plus, Trash2, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Warehouse } from "../types/inventory.types"
import { WarehouseRepository } from "../repositories/inventory.storage"

interface WarehouseManagementDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  warehouses: Warehouse[]
}

export function WarehouseManagementDrawer({
  open,
  onClose,
  onSuccess,
  warehouses,
}: WarehouseManagementDrawerProps) {
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Form states
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [managingDepartment, setManagingDepartment] = useState("")
  const [address, setAddress] = useState("")
  const [managerName, setManagerName] = useState("")
  const [managerPhone, setManagerPhone] = useState("")

  const resetForm = () => {
    setEditingWarehouse(null)
    setIsCreating(false)
    setCode("")
    setName("")
    setManagingDepartment("")
    setAddress("")
    setManagerName("")
    setManagerPhone("")
  }

  const handleStartCreate = () => {
    resetForm()
    setIsCreating(true)
    setCode(`KHO-${Date.now().toString().slice(-4)}`)
  }

  const handleStartEdit = (wh: Warehouse) => {
    setIsCreating(false)
    setEditingWarehouse(wh)
    setCode(wh.code)
    setName(wh.name)
    setManagingDepartment(wh.managingDepartment)
    setAddress(wh.address)
    setManagerName(wh.managerName)
    setManagerPhone(wh.managerPhone)
  }

  const handleSave = () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Vui lòng điền mã và tên kho")
      return
    }

    const payload: Warehouse = {
      id: editingWarehouse?.id || `wh-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      managingDepartment: managingDepartment.trim() || "Phòng Kế hoạch - Kỹ thuật",
      address: address.trim(),
      managerName: managerName.trim() || "Thủ kho",
      managerPhone: managerPhone.trim(),
      status: "active",
      locations: editingWarehouse?.locations || [
        { id: `loc-1`, code: "K-A01", name: "Khu vực kệ chính" },
      ],
      createdAt: editingWarehouse?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    WarehouseRepository.save(payload)
    toast.success(editingWarehouse ? "Cập nhật kho thành công!" : "Thêm mới kho thành công!")
    resetForm()
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/70 shrink-0">
          <DialogTitle className="text-lg font-bold">Danh mục hệ thống kho vật tư</DialogTitle>
          <DialogDescription className="text-xs">
            Quản lý địa điểm lưu trữ, đơn vị chủ quản và danh sách vị trí lưu kho.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {(isCreating || editingWarehouse) ? (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                <span className="text-xs font-bold text-primary">
                  {editingWarehouse ? `Chỉnh sửa: ${editingWarehouse.name}` : "Thêm kho mới"}
                </span>
                <Button variant="ghost" size="sm" onClick={resetForm} className="h-6 text-xs px-2">
                  Hủy
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mã kho *</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: KHO-TAY-BAC"
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tên kho vật tư *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Kho Vật tư Tây Bắc"
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Đơn vị quản lý</Label>
                <Input
                  value={managingDepartment}
                  onChange={(e) => setManagingDepartment(e.target.value)}
                  placeholder="VD: Đoàn Địa vật lý Máy bay"
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Địa chỉ kho</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Địa chỉ thực địa..."
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Thủ kho phụ trách</Label>
                  <Input
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Họ và tên..."
                    className="h-8.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Điện thoại</Label>
                  <Input
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    placeholder="0912..."
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={handleSave} className="h-8 text-xs font-medium">
                  {editingWarehouse ? "Cập nhật" : "Tạo kho"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Đang có <strong>{warehouses.length}</strong> kho lưu trữ đang hoạt động.
              </span>
              <Button size="sm" onClick={handleStartCreate} className="h-8 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm kho mới</span>
              </Button>
            </div>
          )}

          <div className="space-y-2.5">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{wh.code}</span>
                      <span className="font-bold text-foreground">{wh.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Đơn vị: {wh.managingDepartment}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(wh)}
                    className="h-7 text-xs px-2 text-primary hover:bg-primary/10"
                  >
                    Chỉnh sửa
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{wh.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 shrink-0" />
                    <span>{wh.managerName} ({wh.managerPhone})</span>
                  </div>
                </div>
              </div>
            ))}
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
