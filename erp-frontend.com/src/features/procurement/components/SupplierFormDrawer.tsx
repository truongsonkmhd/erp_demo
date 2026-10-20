import React, { useEffect, useState } from "react"
import { Building2, Save, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import type { Supplier, SupplierStatus } from "../types/procurement.types"
import {
  SUPPLIER_STATUS_CONFIG,
  SUPPLY_CATEGORIES,
} from "../types/procurement.constants"
import { SupplierRepository } from "../repositories/procurement.storage"

interface SupplierFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierToEdit?: Supplier | null
  onSaved: (savedSupplier: Supplier) => void
}

export function SupplierFormDrawer({
  open,
  onOpenChange,
  supplierToEdit,
  onSaved,
}: SupplierFormDrawerProps) {
  const [name, setName] = useState("")
  const [taxCode, setTaxCode] = useState("")
  const [address, setAddress] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [bankName, setBankName] = useState("")
  const [status, setStatus] = useState<SupplierStatus>("active")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [legalProfileSummary, setLegalProfileSummary] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name)
      setTaxCode(supplierToEdit.taxCode)
      setAddress(supplierToEdit.address)
      setContactPerson(supplierToEdit.contactPerson)
      setPhone(supplierToEdit.phone)
      setEmail(supplierToEdit.email)
      setBankAccount(supplierToEdit.bankAccount || "")
      setBankName(supplierToEdit.bankName || "")
      setStatus(supplierToEdit.status)
      setSelectedCategories(supplierToEdit.supplyCategories || [])
      setLegalProfileSummary(supplierToEdit.legalProfileSummary || "")
      setNote(supplierToEdit.note || "")
    } else {
      setName("")
      setTaxCode("")
      setAddress("")
      setContactPerson("")
      setPhone("")
      setEmail("")
      setBankAccount("")
      setBankName("")
      setStatus("active")
      setSelectedCategories([SUPPLY_CATEGORIES[0]])
      setLegalProfileSummary("")
      setNote("")
    }
  }, [supplierToEdit, open])

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat))
    } else {
      setSelectedCategories([...selectedCategories, cat])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên nhà cung cấp / doanh nghiệp")
      return
    }
    if (!taxCode.trim()) {
      toast.error("Vui lòng nhập mã số thuế")
      return
    }
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại liên hệ")
      return
    }

    // Kiểm tra trùng mã số thuế với nhà cung cấp khác
    const existingList = SupplierRepository.list()
    const isDuplicateTax = existingList.some(
      (s) => s.taxCode.trim() === taxCode.trim() && s.id !== supplierToEdit?.id
    )
    if (isDuplicateTax) {
      toast.error(`Mã số thuế ${taxCode} đã tồn tại trong hệ thống! Vui lòng kiểm tra lại.`)
      return
    }

    const now = new Date().toISOString()
    const payload: Supplier = {
      id: supplierToEdit?.id || `sup-${Date.now()}`,
      code: supplierToEdit?.code || SupplierRepository.generateNextCode(),
      name: name.trim(),
      taxCode: taxCode.trim(),
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bankAccount: bankAccount.trim(),
      bankName: bankName.trim(),
      supplyCategories: selectedCategories,
      status,
      rating: supplierToEdit?.rating || 4.5,
      contractCount: supplierToEdit?.contractCount || 0,
      totalTransactionValue: supplierToEdit?.totalTransactionValue || 0,
      legalProfileSummary: legalProfileSummary.trim(),
      note: note.trim(),
      createdAt: supplierToEdit?.createdAt || now,
      updatedAt: now,
    }

    const saved = SupplierRepository.save(payload)
    toast.success(
      supplierToEdit
        ? `Đã cập nhật thông tin nhà cung cấp ${saved.name}`
        : `Đã thêm mới nhà cung cấp ${saved.name} (${saved.code})`
    )
    onSaved(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>
              {supplierToEdit ? `Chỉnh sửa nhà cung cấp: ${supplierToEdit.code}` : "Thêm mới nhà cung cấp vật tư, thiết bị"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Quản trị danh bạ đối tác cung ứng trang thiết bị, vật tư địa vật lý và dịch vụ kỹ thuật.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Tên doanh nghiệp / Nhà cung cấp *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Công ty Cổ phần Thiết bị Địa vật lý..."
                className="h-8.5 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Mã số thuế doanh nghiệp *</Label>
              <Input
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="VD: 0102345678"
                className="h-8.5 text-xs bg-background font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Trạng thái hợp tác *</Label>
              <Select value={status} onValueChange={(val: SupplierStatus) => setStatus(val)}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPLIER_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Địa chỉ trụ sở đăng ký *</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường phố, quận/huyện, tỉnh/thành..."
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Người liên hệ chính</Label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Họ tên người phụ trách kinh doanh..."
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Số điện thoại liên hệ *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912.345.678"
                className="h-8.5 text-xs bg-background font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email giao dịch</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kinhdoanh@company.com"
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tài khoản ngân hàng</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Số tài khoản..."
                className="h-8.5 text-xs bg-background font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Ngân hàng & Chi nhánh</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: VietinBank - Chi nhánh Thanh Xuân, Hà Nội"
                className="h-8.5 text-xs bg-background"
              />
            </div>

            {/* Nhóm mặt hàng */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Nhóm vật tư / dịch vụ có năng lực cung ứng:</Label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/40 border border-border">
                {SUPPLY_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Tóm tắt hồ sơ pháp lý & năng lực</Label>
              <Textarea
                rows={2}
                value={legalProfileSummary}
                onChange={(e) => setLegalProfileSummary(e.target.value)}
                placeholder="Giấy phép kinh doanh, chứng nhận đại lý, ISO..."
                className="text-xs bg-background resize-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Ghi chú quản lý</Label>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú đánh giá, cảnh báo tiến độ nếu có..."
                className="text-xs bg-background resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Hủy
            </Button>

            <Button type="submit" size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-3.5 w-3.5" />
              <span>{supplierToEdit ? "Lưu thay đổi" : "Lưu nhà cung cấp"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
