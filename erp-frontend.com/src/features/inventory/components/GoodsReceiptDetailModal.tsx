import React from "react"
import { CheckCircle2, Clock, FileText, Package, XCircle } from "lucide-react"

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
import type { GoodsReceipt } from "../types/inventory.types"
import { GOODS_RECEIPT_STATUS_CONFIG } from "../types/inventory.constants"

interface GoodsReceiptDetailModalProps {
  receipt: GoodsReceipt | null
  open: boolean
  onClose: () => void
  onConfirmPost?: (receipt: GoodsReceipt) => void
  onReject?: (receipt: GoodsReceipt) => void
}

export function GoodsReceiptDetailModal({
  receipt,
  open,
  onClose,
  onConfirmPost,
  onReject,
}: GoodsReceiptDetailModalProps) {
  if (!receipt) return null

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const statusConfig = GOODS_RECEIPT_STATUS_CONFIG[receipt.status]
  const canPost = receipt.status === "pending_post" || receipt.status === "draft"

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg font-bold">
                  Phiếu nhập kho: {receipt.code}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Ngày lập phiếu: {receipt.receiptDate} • Kho tiếp nhận: {receipt.warehouseName}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 font-semibold ${statusConfig?.badgeClass || ""}`}
            >
              {statusConfig?.label || receipt.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-muted/40 border border-border/60">
            <div>
              <span className="text-muted-foreground block text-[11px]">Hợp đồng mua sắm:</span>
              <span className="font-mono font-semibold text-primary">
                {receipt.contractNumber || "Mua sắm trực tiếp"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Nhà cung cấp:</span>
              <span className="font-semibold text-foreground">{receipt.supplierName || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Người giao hàng:</span>
              <span className="font-medium text-foreground">
                {receipt.delivererName} {receipt.delivererPhone ? `(${receipt.delivererPhone})` : ""}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Thủ kho tiếp nhận:</span>
              <span className="font-medium text-foreground">{receipt.receiverName}</span>
            </div>
          </div>

          {/* Bảng chi tiết vật tư nhập */}
          <div className="space-y-2">
            <div className="font-bold text-foreground">Chi tiết vật tư & lô hàng thực nhập</div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/70 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-2.5 text-center w-12">STT</th>
                    <th className="p-2.5 w-28">Mã VT</th>
                    <th className="p-2.5 min-w-[200px]">Tên vật tư</th>
                    <th className="p-2.5 w-24">Số lô</th>
                    <th className="p-2.5 w-24">Hạn dùng</th>
                    <th className="p-2.5 text-right w-20">Số lượng</th>
                    <th className="p-2.5 text-right w-28">Đơn giá</th>
                    <th className="p-2.5 text-right w-32">Thành tiền</th>
                    <th className="p-2.5 text-center w-24">Kiểm định</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {receipt.lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="p-2.5 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-primary">
                        {line.materialCode}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">{line.materialName}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        {line.batchNumber || "—"}
                      </td>
                      <td className="p-2.5 text-muted-foreground">{line.expiryDate || "—"}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">
                        {line.receivedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono text-muted-foreground">
                        {formatVND(line.unitPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">
                        {formatVND(line.totalAmount)}
                      </td>
                      <td className="p-2.5 text-center">
                        {line.qualityStatus === "passed" ? (
                          <span className="text-emerald-600 font-semibold text-[11px]">Đạt chuẩn</span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-[11px]">Chờ KĐ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 font-bold border-t border-border">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right">
                      Tổng cộng:
                    </td>
                    <td className="p-2.5 text-right font-mono text-foreground">
                      {receipt.totalQuantity}
                    </td>
                    <td></td>
                    <td className="p-2.5 text-right font-mono text-primary text-sm">
                      {formatVND(receipt.totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {receipt.notes && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-muted-foreground">
              <strong>Ghi chú:</strong> {receipt.notes}
            </div>
          )}

          {receipt.postedAt && (
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Đã ghi sổ kho thành công vào lúc{" "}
                <strong>{new Date(receipt.postedAt).toLocaleString("vi-VN")}</strong> bởi{" "}
                <strong>{receipt.postedBy}</strong>.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Đóng
          </Button>

          {canPost && onConfirmPost && (
            <div className="flex items-center gap-2">
              {onReject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(receipt)}
                  className="h-8 text-xs text-rose-600 hover:bg-rose-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Từ chối nhập
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => onConfirmPost(receipt)}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Xác nhận ghi sổ nhập kho</span>
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
