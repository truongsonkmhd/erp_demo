import React from "react"
import {
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Star,
  User,
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
import type { Supplier } from "../types/procurement.types"
import { SUPPLIER_STATUS_CONFIG } from "../types/procurement.constants"

interface SupplierDetailModalProps {
  supplier: Supplier | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenEdit?: (supplier: Supplier) => void
}

export function SupplierDetailModal({
  supplier,
  open,
  onOpenChange,
  onOpenEdit,
}: SupplierDetailModalProps) {
  if (!supplier) return null

  const statusConfig = SUPPLIER_STATUS_CONFIG[supplier.status]

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>{supplier.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Mã NCC: <span className="font-mono text-primary font-semibold">{supplier.code}</span> • MST: <span className="font-mono font-medium">{supplier.taxCode}</span>
              </DialogDescription>
            </div>
            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* 1. Thống kê nhanh */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Điểm đánh giá uy tín:</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <div className="flex items-center text-amber-500">
                  <Star className="h-4 w-4 fill-amber-500" />
                </div>
                <span className="text-lg font-bold font-mono">{supplier.rating} / 5.0</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Số hợp đồng đã ký kết:</span>
              <div className="text-lg font-bold font-mono text-foreground pt-0.5">
                {supplier.contractCount} hợp đồng
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border shadow-2xs space-y-0.5">
              <span className="text-[11px] text-muted-foreground">Tổng giá trị giao dịch lũy kế:</span>
              <div className="text-base font-extrabold font-mono text-primary pt-0.5">
                {formatVND(supplier.totalTransactionValue)}
              </div>
            </div>
          </div>

          {/* 2. Thông tin liên hệ & Pháp lý */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Địa chỉ trụ sở:</span>
                <strong className="text-foreground">{supplier.address}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Người liên hệ chính:</span>
                <strong className="text-foreground">{supplier.contactPerson}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>Số điện thoại:</span>
                <span className="font-mono text-foreground">{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>Email giao dịch:</span>
                <span className="text-foreground">{supplier.email}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span>Tài khoản ngân hàng:</span>
                <span className="font-mono text-foreground">{supplier.bankAccount || "Chưa cập nhật"}</span>
              </div>
              {supplier.bankName && (
                <div className="flex items-center gap-1.5 text-muted-foreground pl-5">
                  <span>Ngân hàng:</span>
                  <span className="text-foreground">{supplier.bankName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Ngày tạo hồ sơ:</span>
                <span>{new Date(supplier.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </div>

          {/* 3. Nhóm vật tư/dịch vụ cung ứng */}
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
              Lĩnh vực & Nhóm mặt hàng có năng lực cung ứng:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {supplier.supplyCategories?.map((cat, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-muted/80">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* 4. Hồ sơ pháp lý & Ghi chú */}
          {supplier.legalProfileSummary && (
            <div className="p-3 rounded-xl bg-card border border-border space-y-1">
              <span className="font-semibold text-foreground">Hồ sơ năng lực & pháp lý:</span>
              <p className="text-muted-foreground">{supplier.legalProfileSummary}</p>
            </div>
          )}

          {supplier.note && (
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-semibold flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Ghi chú theo dõi đặc biệt:
              </span>
              <p>{supplier.note}</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Đóng
          </Button>

          {onOpenEdit && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onOpenEdit(supplier)
              }}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Chỉnh sửa thông tin nhà cung cấp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
