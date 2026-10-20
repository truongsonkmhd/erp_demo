import React, { useState } from "react"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StockTransfer } from "../types/inventory.types"
import { STOCK_TRANSFER_STATUS_CONFIG } from "../types/inventory.constants"

interface StockTransferDetailModalProps {
  transfer: StockTransfer | null
  open: boolean
  onClose: () => void
  onApprove?: (transfer: StockTransfer) => void
  onDispatch?: (transfer: StockTransfer) => void
  onReceive?: (transfer: StockTransfer, discrepancyReason?: string) => void
}

export function StockTransferDetailModal({
  transfer,
  open,
  onClose,
  onApprove,
  onDispatch,
  onReceive,
}: StockTransferDetailModalProps) {
  const [showReceiveForm, setShowReceiveForm] = useState(false)
  const [discrepancyReason, setDiscrepancyReason] = useState("")

  if (!transfer) return null

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const statusConfig = STOCK_TRANSFER_STATUS_CONFIG[transfer.status]
  const canApprove = transfer.status === "pending_approval" || transfer.status === "draft"
  const canDispatch = transfer.status === "approved"
  const canReceive = transfer.status === "in_transit" || transfer.status === "pending_receive"

  const handleConfirmReceive = () => {
    if (onReceive) {
      onReceive(transfer, discrepancyReason)
      setShowReceiveForm(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg font-bold">
                  Phiếu điều chuyển kho: {transfer.code}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Ngày lập: {transfer.transferDate}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 font-semibold ${statusConfig?.badgeClass || ""}`}
            >
              {statusConfig?.label || transfer.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Lộ trình điều chuyển 2 đầu kho */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Kho xuất (Nguồn)
              </span>
              <div className="font-bold text-foreground text-sm">
                {transfer.sourceWarehouseName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Người xuất: <strong>{transfer.dispatcherName}</strong>
              </div>
            </div>

            <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
              <ArrowRight className="h-5 w-5" />
            </div>

            <div className="flex-1 space-y-1 sm:text-right">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                Kho nhận (Đích)
              </span>
              <div className="font-bold text-foreground text-sm">
                {transfer.targetWarehouseName}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Người nhận: <strong>{transfer.receiverName}</strong>
              </div>
            </div>
          </div>

          {/* Vận chuyển & Lý do */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-card">
            <div>
              <span className="text-muted-foreground block text-[11px]">Đơn vị / Phương tiện vận chuyển:</span>
              <span className="font-medium text-foreground">
                {transfer.transporterName || "Xe vận chuyển nội bộ"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Lý do điều chuyển:</span>
              <span className="font-medium text-foreground">{transfer.reason}</span>
            </div>
          </div>

          {/* Bảng chi tiết dòng hàng */}
          <div className="space-y-2">
            <div className="font-bold text-foreground">Chi tiết danh mục vật tư điều chuyển</div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/70 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-2.5 text-center w-12">STT</th>
                    <th className="p-2.5 w-28">Mã VT</th>
                    <th className="p-2.5 min-w-[200px]">Tên vật tư</th>
                    <th className="p-2.5 w-24">Số lô</th>
                    <th className="p-2.5 text-right w-24 text-purple-600">SL Xuất đi</th>
                    <th className="p-2.5 text-right w-24 text-emerald-600">SL Đã nhận</th>
                    <th className="p-2.5 text-right w-28">Đơn giá</th>
                    <th className="p-2.5 text-right w-32">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {transfer.lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="p-2.5 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-primary">
                        {line.materialCode}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">{line.materialName}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        {line.batchNumber || "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-purple-600">
                        {line.dispatchedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                        {line.receivedQuantity || (transfer.status === "completed" ? line.dispatchedQuantity : 0)}{" "}
                        {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono text-muted-foreground">
                        {formatVND(line.unitPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">
                        {formatVND(line.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 font-bold border-t border-border">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-right">
                      Tổng số lượng:
                    </td>
                    <td className="p-2.5 text-right font-mono text-purple-600">
                      {transfer.totalDispatchedQuantity}
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">
                      {transfer.totalReceivedQuantity || (transfer.status === "completed" ? transfer.totalDispatchedQuantity : 0)}
                    </td>
                    <td></td>
                    <td className="p-2.5 text-right font-mono text-primary text-sm">
                      {formatVND(transfer.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Form tiếp nhận nếu có chênh lệch */}
          {showReceiveForm && (
            <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-3">
              <div className="font-bold text-primary">Xác nhận tiếp nhận hàng tại kho đích</div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Ghi chú kiểm đếm / Lý do nếu có chênh lệch hoặc hao hụt
                </Label>
                <Input
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  placeholder="Ghi rõ tình trạng niêm phong, số lượng thực nhận..."
                  className="h-8.5 text-xs bg-background"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowReceiveForm(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleConfirmReceive} className="h-8 text-xs bg-emerald-600">
                  Hoàn tất nhận kho
                </Button>
              </div>
            </div>
          )}

          {/* Timeline theo dõi */}
          <div className="p-3.5 rounded-xl border bg-card space-y-2">
            <div className="font-bold text-foreground">Tiến trình xử lý</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
              <div>
                • Khởi tạo: <strong>{new Date(transfer.createdAt).toLocaleDateString("vi-VN")}</strong>
              </div>
              <div>
                • Xuất kho:{" "}
                <strong>
                  {transfer.dispatchedAt ? new Date(transfer.dispatchedAt).toLocaleString("vi-VN") : "Chưa xuất"}
                </strong>
              </div>
              <div>
                • Nhận kho:{" "}
                <strong>
                  {transfer.receivedAt ? new Date(transfer.receivedAt).toLocaleString("vi-VN") : "Chưa nhận"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {canApprove && onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(transfer)}
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Phê duyệt lệnh điều chuyển</span>
              </Button>
            )}

            {canDispatch && onDispatch && (
              <Button
                size="sm"
                onClick={() => onDispatch(transfer)}
                className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Xác nhận xuất kho nguồn (Bắt đầu vận chuyển)</span>
              </Button>
            )}

            {canReceive && !showReceiveForm && (
              <Button
                size="sm"
                onClick={() => setShowReceiveForm(true)}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Xác nhận nhập kho đích</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
