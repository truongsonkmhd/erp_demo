import React, { useEffect, useState } from "react"
import { Layers, ListFilter, Package, Plus, Save, Tag, Trash2, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import type { Material } from "../types/inventory.types"
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
} from "../types/inventory.constants"
import { MaterialRepository } from "../repositories/inventory.storage"

interface MaterialManagementDrawerProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  materials: Material[]
}

export function MaterialManagementDrawer({
  open,
  onClose,
  onSuccess,
  materials,
}: MaterialManagementDrawerProps) {
  const [activeTab, setActiveTab] = useState<"form" | "list">("form")
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Form states
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState(MATERIAL_CATEGORIES[0])
  const [specification, setSpecification] = useState("")
  const [unit, setUnit] = useState(MATERIAL_UNITS[0])
  const [manageByBatch, setManageByBatch] = useState(false)
  const [manageByExpiry, setManageByExpiry] = useState(false)
  const [defaultMinStock, setDefaultMinStock] = useState<number>(0)
  const [defaultMaxStock, setDefaultMaxStock] = useState<number>(0)
  const [description, setDescription] = useState("")

  // Khi mở popup, nếu không đang chỉnh sửa thì reset form tạo mới
  useEffect(() => {
    if (open && !editingMaterial) {
      resetForm()
      setActiveTab("form")
    }
  }, [open])

  const resetForm = () => {
    setEditingMaterial(null)
    setCode(`VT-${Date.now().toString().slice(-4)}`)
    setName("")
    setCategory(MATERIAL_CATEGORIES[0])
    setSpecification("")
    setUnit(MATERIAL_UNITS[0])
    setManageByBatch(false)
    setManageByExpiry(false)
    setDefaultMinStock(0)
    setDefaultMaxStock(0)
    setDescription("")
  }

  const handleStartCreate = () => {
    resetForm()
    setActiveTab("form")
  }

  const handleStartEdit = (mat: Material) => {
    setEditingMaterial(mat)
    setCode(mat.code)
    setName(mat.name)
    setCategory(mat.category)
    setSpecification(mat.specification)
    setUnit(mat.unit)
    setManageByBatch(mat.manageByBatch)
    setManageByExpiry(mat.manageByExpiry)
    setDefaultMinStock(mat.defaultMinStock || 0)
    setDefaultMaxStock(mat.defaultMaxStock || 0)
    setDescription(mat.description || "")
    setActiveTab("form")
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên vật tư / thiết bị")
      return
    }
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã vật tư")
      return
    }

    // Check trùng mã
    const duplicate = materials.find(
      (m) =>
        m.code.toLowerCase() === code.trim().toLowerCase() &&
        m.id !== editingMaterial?.id
    )
    if (duplicate) {
      toast.error(`Mã vật tư "${code}" đã tồn tại trên hệ thống`)
      return
    }

    const payload: Material = {
      id: editingMaterial?.id || `mat-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      specification: specification.trim(),
      unit,
      manageByBatch,
      manageByExpiry,
      defaultMinStock: Number(defaultMinStock) || 0,
      defaultMaxStock: Number(defaultMaxStock) || 0,
      status: editingMaterial ? editingMaterial.status : "active",
      description: description.trim(),
      createdAt: editingMaterial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    MaterialRepository.save(payload)
    toast.success(
      editingMaterial ? "Cập nhật thông tin vật tư thành công!" : "Thêm mới vật tư vào danh mục thành công!"
    )
    resetForm()
    onSuccess()
    onClose()
  }

  const handleDeactivate = (mat: Material) => {
    if (confirm(`Bạn có chắc muốn tạm dừng hoạt động vật tư "${mat.name}"?`)) {
      MaterialRepository.deactivate(mat.id)
      toast.success("Đã chuyển trạng thái vật tư sang ngừng sử dụng")
      onSuccess()
    }
  }

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/70 shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-lg font-bold">
                {activeTab === "form"
                  ? editingMaterial
                    ? `Chỉnh sửa vật tư: ${editingMaterial.name}`
                    : "Thêm mới vật tư & thiết bị"
                  : "Danh mục vật tư & thiết bị"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {activeTab === "form"
                  ? "Nhập quy cách kỹ thuật, đơn vị tính, cơ chế quản lý lô và hạn dùng"
                  : `Tổng cộng có ${materials.length} mặt hàng trong danh mục hệ thống`}
              </DialogDescription>
            </div>

            {/* Nút chuyển đổi Form / Danh sách */}
            <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
              <Button
                type="button"
                variant={activeTab === "form" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  if (activeTab === "list") handleStartCreate()
                }}
                className="h-7 text-xs px-2.5 font-medium"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span>{editingMaterial ? "Form sửa" : "Form thêm mới"}</span>
              </Button>
              <Button
                type="button"
                variant={activeTab === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("list")}
                className="h-7 text-xs px-2.5 font-medium"
              >
                <Layers className="h-3 w-3 mr-1" />
                <span>Danh sách ({materials.length})</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "form" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mã vật tư *</Label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: VT-GSM19"
                    className="h-9 text-xs font-mono font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Đơn vị tính *</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_UNITS.map((u) => (
                        <SelectItem key={u} value={u} className="text-xs">
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tên vật tư / thiết bị *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Máy đo từ trường proton GSM-19T"
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Nhóm vật tư *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Quy cách kỹ thuật / Tiêu chuẩn</Label>
                  <Input
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Thông số độ nhạy, dải đo, cấp chính xác..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 p-3 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                  <div>
                    <div className="text-xs font-medium">Theo dõi theo lô</div>
                    <div className="text-[10px] text-muted-foreground">Bắt buộc số lô khi nhập/xuất</div>
                  </div>
                  <Switch checked={manageByBatch} onCheckedChange={setManageByBatch} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                  <div>
                    <div className="text-xs font-medium">Theo dõi hạn dùng</div>
                    <div className="text-[10px] text-muted-foreground">Cảnh báo hết hạn FEFO</div>
                  </div>
                  <Switch checked={manageByExpiry} onCheckedChange={setManageByExpiry} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Định mức Min mặc định</Label>
                  <Input
                    type="number"
                    min="0"
                    value={defaultMinStock}
                    onChange={(e) => setDefaultMinStock(Number(e.target.value))}
                    className="h-9 text-xs font-mono"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Định mức Max mặc định</Label>
                  <Input
                    type="number"
                    min="0"
                    value={defaultMaxStock}
                    onChange={(e) => setDefaultMaxStock(Number(e.target.value))}
                    className="h-9 text-xs font-mono"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Mô tả chi tiết / Ghi chú</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú thêm về xuất xứ, tài liệu kèm theo..."
                  className="h-9 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo mã, tên, nhóm vật tư..."
                  className="h-8.5 text-xs max-w-sm"
                />
                <Button size="sm" onClick={handleStartCreate} className="h-8.5 text-xs gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm vật tư</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-3 rounded-xl border border-border bg-card flex items-start justify-between gap-3 hover:border-primary/40 transition-all text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{mat.code}</span>
                        <span className="font-semibold text-foreground truncate">{mat.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          {mat.unit}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {mat.specification || mat.category}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
                        {mat.manageByBatch && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            • Theo dõi lô
                          </span>
                        )}
                        {mat.manageByExpiry && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            • Có hạn dùng
                          </span>
                        )}
                        {mat.defaultMinStock ? (
                          <span>• Min: {mat.defaultMinStock}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(mat)}
                        className="h-7 text-xs px-2 text-primary hover:bg-primary/10"
                      >
                        Sửa
                      </Button>
                      {mat.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(mat)}
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive"
                          title="Tạm dừng sử dụng"
                        >
                          Khóa
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex items-center justify-between bg-muted/10 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8.5 text-xs">
            Đóng
          </Button>

          {activeTab === "form" && (
            <div className="flex items-center gap-2">
              {editingMaterial && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-8.5 text-xs"
                >
                  Hủy sửa
                </Button>
              )}
              <Button size="sm" onClick={handleSave} className="h-8.5 text-xs font-medium gap-1.5">
                <Save className="h-3.5 w-3.5" />
                <span>{editingMaterial ? "Lưu thay đổi" : "Lưu vào danh mục"}</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

