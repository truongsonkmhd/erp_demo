import React, { useEffect, useState } from "react"
import { AlertCircle, FileCheck2, Info, Save, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type {
  ContractStatus,
  PurchaseContract,
  PurchaseContractLine,
  PurchaseRequest,
  Supplier,
} from "../types/procurement.types"
import { PurchaseContractRepository } from "../repositories/procurement.storage"

interface PurchaseContractFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractToEdit?: PurchaseContract | null
  approvedRequests: PurchaseRequest[]
  activeSuppliers: Supplier[]
  onSaved: (savedContract: PurchaseContract) => void
}

export function PurchaseContractFormDrawer({
  open,
  onOpenChange,
  contractToEdit,
  approvedRequests,
  activeSuppliers,
  onSaved,
}: PurchaseContractFormDrawerProps) {
  const [selectedRequestId, setSelectedRequestId] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [contractName, setContractName] = useState("")
  const [signDate, setSignDate] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [paymentTerms, setPaymentTerms] = useState(
    "Tạm ứng 30% sau khi ký hợp đồng, thanh toán 70% còn lại sau khi giao hàng và nghiệm thu tại kho."
  )
  const [status, setStatus] = useState<ContractStatus>("active")
  const [hasAdjustment, setHasAdjustment] = useState(false)
  const [lines, setLines] = useState<PurchaseContractLine[]>([])

  useEffect(() => {
    if (contractToEdit) {
      setSelectedRequestId(contractToEdit.requestId)
      setSelectedSupplierId(contractToEdit.supplierId)
      setContractName(contractToEdit.contractName)
      setSignDate(contractToEdit.signDate)
      setEffectiveDate(contractToEdit.effectiveDate)
      setExpiryDate(contractToEdit.expiryDate)
      setPaymentTerms(contractToEdit.paymentTerms)
      setStatus(contractToEdit.status)
      setHasAdjustment(contractToEdit.hasAdjustment || false)
      setLines(contractToEdit.lines || [])
    } else {
      setSelectedRequestId(approvedRequests[0]?.id || "")
      setSelectedSupplierId(activeSuppliers[0]?.id || "")
      setContractName("")
      const today = new Date().toISOString().split("T")[0]
      setSignDate(today)
      setEffectiveDate(today)
      const future = new Date()
      future.setDate(future.getDate() + 45)
      setExpiryDate(future.toISOString().split("T")[0])
      setStatus("active")
      setHasAdjustment(false)

      // Nạp lines từ request đầu tiên nếu có
      if (approvedRequests[0]) {
        populateLinesFromRequest(approvedRequests[0])
      } else {
        setLines([])
      }
    }
  }, [contractToEdit, approvedRequests, activeSuppliers, open])

  const populateLinesFromRequest = (req: PurchaseRequest) => {
    setContractName(`Hợp đồng mua sắm vật tư theo đề xuất ${req.code} - ${req.projectName}`)
    const cLines: PurchaseContractLine[] = req.lines.map((l, idx) => ({
      id: `cline-${Date.now()}-${idx + 1}`,
      itemCode: l.itemCode,
      itemName: l.itemName,
      unit: l.unit,
      quantity: l.quantity,
      unitPrice: l.estimatedUnitPrice,
      totalPrice: l.totalPrice,
      deliveredQuantity: 0,
      remainingQuantity: l.quantity,
    }))
    setLines(cLines)
  }

  const handleRequestChange = (reqId: string) => {
    setSelectedRequestId(reqId)
    const req = approvedRequests.find((r) => r.id === reqId)
    if (req) {
      populateLinesFromRequest(req)
    }
  }

  const handleUpdatePrice = (index: number, newUnitPrice: number) => {
    const updated = [...lines]
    const cur = updated[index]
    const up = Number(newUnitPrice) || 0
    cur.unitPrice = up
    cur.totalPrice = cur.quantity * up
    updated[index] = cur
    setLines(updated)
  }

  const totalAmount = lines.reduce((acc, l) => acc + l.totalPrice, 0)
  const preTaxAmount = Math.round(totalAmount / 1.1)
  const taxAmount = totalAmount - preTaxAmount

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const chosenRequest = approvedRequests.find((r) => r.id === selectedRequestId)
    const chosenSupplier = activeSuppliers.find((s) => s.id === selectedSupplierId)

    if (!chosenRequest) {
      toast.error("Vui lòng chọn đề nghị mua sắm đã được phê duyệt làm căn cứ")
      return
    }
    if (!chosenSupplier) {
      toast.error("Vui lòng chọn nhà cung cấp đang hợp tác")
      return
    }
    if (!contractName.trim()) {
      toast.error("Vui lòng nhập tên hợp đồng")
      return
    }

    // Kiểm tra quy tắc: Giá trị hợp đồng không vượt giá trị đề xuất nếu chưa đánh dấu điều chỉnh
    if (!hasAdjustment && totalAmount > chosenRequest.totalAmount) {
      toast.error(
        `Tổng giá trị hợp đồng (${formatVND(totalAmount)}) vượt mức kinh phí đề xuất được duyệt (${formatVND(
          chosenRequest.totalAmount
        )})! Vui lòng tích chọn xác nhận điều chỉnh hoặc giảm đơn giá.`
      )
      return
    }

    const now = new Date().toISOString()
    const payload: PurchaseContract = {
      id: contractToEdit?.id || `ct-${Date.now()}`,
      contractNumber: contractToEdit?.contractNumber || PurchaseContractRepository.generateNextNumber(),
      contractName: contractName.trim(),
      requestId: chosenRequest.id,
      requestCode: chosenRequest.code,
      supplierId: chosenSupplier.id,
      supplierName: chosenSupplier.name,
      supplierTaxCode: chosenSupplier.taxCode,
      signDate,
      effectiveDate,
      expiryDate,
      preTaxAmount,
      taxAmount,
      totalAmount,
      paymentTerms: paymentTerms.trim(),
      status,
      lines,
      paidAmount: contractToEdit?.paidAmount || 0,
      remainingAmount: totalAmount - (contractToEdit?.paidAmount || 0),
      deliveredPercent: contractToEdit?.deliveredPercent || 0,
      hasAdjustment,
      attachments: contractToEdit?.attachments || [],
      createdAt: contractToEdit?.createdAt || now,
      updatedAt: now,
    }

    const saved = PurchaseContractRepository.save(payload)
    toast.success(
      contractToEdit
        ? `Đã cập nhật hợp đồng ${saved.contractNumber}`
        : `Đã ký lập thành công hợp đồng mua sắm ${saved.contractNumber}`
    )
    onSaved(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <span>
              {contractToEdit
                ? `Chỉnh sửa hợp đồng: ${contractToEdit.contractNumber}`
                : "Ký lập hợp đồng mua sắm với nhà cung cấp"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Hợp đồng mua sắm căn cứ trên đề nghị đã được phê duyệt và đơn vị cung ứng đủ điều kiện pháp lý.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/70">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Căn cứ đề nghị mua sắm đã duyệt *</Label>
              <Select value={selectedRequestId} onValueChange={handleRequestChange}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn đề nghị đã duyệt..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedRequests.length === 0 ? (
                    <SelectItem value="none" disabled className="text-xs">
                      Không có đề nghị nào đã duyệt
                    </SelectItem>
                  ) : (
                    approvedRequests.map((req) => (
                      <SelectItem key={req.id} value={req.id} className="text-xs">
                        {req.code} - {req.projectName.slice(0, 30)}... ({formatVND(req.totalAmount)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nhà cung cấp đối tác *</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn nhà cung cấp..." />
                </SelectTrigger>
                <SelectContent>
                  {activeSuppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id} className="text-xs">
                      {sup.name} (MST: {sup.taxCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Tên hợp đồng kinh tế *</Label>
              <Input
                value={contractName}
                onChange={(e) => setContractName(e.target.value)}
                placeholder="VD: Hợp đồng cung cấp cảm biến đo từ Cesium CS-VL..."
                className="h-8.5 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ngày ký kết *</Label>
              <Input
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
                className="h-8.5 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Thời hạn kết thúc giao hàng *</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-8.5 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Điều khoản thanh toán & nghiệm thu</Label>
              <Textarea
                rows={2}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="text-xs bg-background resize-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2 flex items-center gap-2 pt-1">
              <Checkbox
                id="adjust"
                checked={hasAdjustment}
                onCheckedChange={(c) => setHasAdjustment(Boolean(c))}
              />
              <label htmlFor="adjust" className="text-xs cursor-pointer select-none text-muted-foreground">
                Xác nhận cho phép điều chỉnh giá trị hợp đồng (vượt mức dự toán đề xuất ban đầu có văn bản phê duyệt bổ sung)
              </label>
            </div>
          </div>

          {/* Bảng dòng hàng hóa theo hợp đồng */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
              Danh mục hàng hóa và đơn giá hợp đồng ({lines.length} mặt hàng)
            </h4>

            <div className="border border-border/70 rounded-xl overflow-hidden">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold">STT</TableHead>
                    <TableHead className="w-24 font-bold">Mã VT</TableHead>
                    <TableHead className="min-w-[180px] font-bold">Tên vật tư / Thiết bị</TableHead>
                    <TableHead className="w-16 text-center font-bold">ĐVT</TableHead>
                    <TableHead className="w-24 text-right font-bold">Số lượng</TableHead>
                    <TableHead className="w-36 text-right font-bold">Đơn giá ký kết (VNĐ)</TableHead>
                    <TableHead className="w-36 text-right font-bold">Tổng tiền (VNĐ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-primary font-medium">{line.itemCode}</TableCell>
                      <TableCell className="font-medium text-foreground">{line.itemName}</TableCell>
                      <TableCell className="text-center">{line.unit}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{line.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdatePrice(idx, Number(e.target.value) || 0)}
                          className="h-7 text-xs text-right font-mono"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatVND(line.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs">
              <div className="space-y-0.5">
                <div className="text-muted-foreground">
                  Giá trị trước thuế: <strong className="text-foreground">{formatVND(preTaxAmount)}</strong>
                </div>
                <div className="text-muted-foreground">
                  Thuế GTGT (10%): <strong className="text-foreground">{formatVND(taxAmount)}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="font-semibold text-foreground">Tổng giá trị hợp đồng: </span>
                <span className="text-base font-mono font-extrabold text-primary">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Hủy
            </Button>

            <Button type="submit" size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-3.5 w-3.5" />
              <span>{contractToEdit ? "Lưu thay đổi" : "Lưu hợp đồng kinh tế"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
