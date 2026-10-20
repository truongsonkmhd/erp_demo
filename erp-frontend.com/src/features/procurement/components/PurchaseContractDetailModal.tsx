import React from "react"
import {
  Calendar,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  Info,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react"

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
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PurchaseContract } from "../types/procurement.types"
import { CONTRACT_STATUS_CONFIG } from "../types/procurement.constants"

interface PurchaseContractDetailModalProps {
  contract: PurchaseContract | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseContractDetailModal({
  contract,
  open,
  onOpenChange,
}: PurchaseContractDetailModalProps) {
  if (!contract) return null

  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status]

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <span>Hợp đồng kinh tế:</span>
                <span className="font-mono text-primary text-base">{contract.contractNumber}</span>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {contract.contractName}
              </DialogDescription>
            </div>
            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* 1. Thẻ tiến độ & thanh toán */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Tiến độ giao hàng:</span>
                <strong className="font-mono text-emerald-600">{contract.deliveredPercent}%</strong>
              </div>
              <Progress value={contract.deliveredPercent} className="h-2 bg-muted" />
              <div className="text-[11px] text-muted-foreground">
                Theo dõi lũy kế phiếu bàn giao kho
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground">Tổng giá trị hợp đồng:</span>
              <div className="text-base font-extrabold font-mono text-primary">
                {formatVND(contract.totalAmount)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Đã thanh toán: <strong className="text-foreground">{formatVND(contract.paidAmount)}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground">Giá trị còn lại phải trả:</span>
              <div className="text-base font-extrabold font-mono text-foreground">
                {formatVND(contract.remainingAmount)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Căn cứ thanh lý & nghiệm thu
              </div>
            </div>
          </div>

          {/* 2. Thông tin đối tác & Pháp lý */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <Truck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Nhà cung cấp:</span>
                <strong className="text-foreground">{contract.supplierName}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground pl-5">
                <span>Mã số thuế:</span>
                <span className="font-mono text-foreground">{contract.supplierTaxCode}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Đề nghị mua sắm nguồn:</span>
                <strong className="font-mono text-primary">{contract.requestCode}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Ngày ký hợp đồng:</span>
                <strong className="text-foreground">
                  {new Date(contract.signDate).toLocaleDateString("vi-VN")}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Thời hạn hiệu lực:</span>
                <span>
                  {new Date(contract.effectiveDate).toLocaleDateString("vi-VN")} đến{" "}
                  <strong>{new Date(contract.expiryDate).toLocaleDateString("vi-VN")}</strong>
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Điều khoản thanh toán:</span>
                <span className="text-foreground">{contract.paymentTerms}</span>
              </div>
            </div>
          </div>

          {/* 3. Danh mục hàng hóa & tiến độ giao */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                Chi tiết danh mục hàng hóa theo hợp đồng ({contract.lines?.length || 0} mặt hàng)
              </h4>
            </div>

            <div className="border border-border/70 rounded-xl overflow-hidden">
              <Table className="text-xs">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold">STT</TableHead>
                    <TableHead className="w-24 font-bold">Mã VT</TableHead>
                    <TableHead className="min-w-[160px] font-bold">Tên vật tư / Thiết bị</TableHead>
                    <TableHead className="w-16 text-center font-bold">ĐVT</TableHead>
                    <TableHead className="w-20 text-right font-bold">Số lượng HĐ</TableHead>
                    <TableHead className="w-24 text-right font-bold">Đã giao</TableHead>
                    <TableHead className="w-24 text-right font-bold">Còn phải giao</TableHead>
                    <TableHead className="w-28 text-right font-bold">Đơn giá</TableHead>
                    <TableHead className="w-32 text-right font-bold">Tổng tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contract.lines?.map((line, idx) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-primary font-medium">{line.itemCode}</TableCell>
                      <TableCell className="font-medium text-foreground">{line.itemName}</TableCell>
                      <TableCell className="text-center">{line.unit}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{line.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 font-bold">
                        {line.deliveredQuantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-amber-600 font-bold">
                        {line.remainingQuantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatVND(line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatVND(line.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 4. Hồ sơ đính kèm */}
          {contract.attachments?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                Bản scan hợp đồng & phụ lục ({contract.attachments.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {contract.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border text-xs hover:border-primary/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium truncate max-w-[240px]">{att.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({(att.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" title="Tải file">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
