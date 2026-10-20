import React from "react"
import { CheckCircle2, FileText, PackageMinus, RotateCcw, XCircle } from "lucide-react"

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
import type { GoodsIssue } from "../types/inventory.types"
import { GOODS_ISSUE_STATUS_CONFIG } from "../types/inventory.constants"

interface GoodsIssueDetailModalProps {
  issue: GoodsIssue | null
  open: boolean
  onClose: () => void
  onApprove?: (issue: GoodsIssue) => void
  onConfirmIssue?: (issue: GoodsIssue) => void
  onReject?: (issue: GoodsIssue) => void
}

export function GoodsIssueDetailModal({
  issue,
  open,
  onClose,
  onApprove,
  onConfirmIssue,
  onReject,
}: GoodsIssueDetailModalProps) {
  if (!issue) return null

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const statusConfig = GOODS_ISSUE_STATUS_CONFIG[issue.status]
  const canApprove = issue.status === "pending_approval" || issue.status === "draft"
  const canPostIssue = issue.status === "approved" || issue.status === "pending_issue"

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PackageMinus className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg font-bold">
                  Phiếu xuất kho: {issue.code}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Ngày lập: {issue.issueDate} • Kho xuất: {issue.warehouseName}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs px-2.5 py-0.5 font-semibold ${statusConfig?.badgeClass || ""}`}
            >
              {statusConfig?.label || issue.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Thông tin nhiệm vụ & người nhận */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-muted/40 border border-border/60">
            <div className="sm:col-span-2">
              <span className="text-muted-foreground block text-[11px]">Nhiệm vụ / Đề án:</span>
              <span className="font-semibold text-foreground">{issue.projectName}</span>
              {issue.projectItem && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Hạng mục: {issue.projectItem}
                </div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Đơn vị nhận:</span>
              <span className="font-semibold text-foreground">{issue.department}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Cán bộ nhận vật tư:</span>
              <span className="font-medium text-foreground">{issue.receiverName}</span>
            </div>
          </div>

          {/* Bảng chi tiết vật tư xuất */}
          <div className="space-y-2">
            <div className="font-bold text-foreground">Danh mục vật tư xuất kho</div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/70 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-2.5 text-center w-12">STT</th>
                    <th className="p-2.5 w-28">Mã VT</th>
                    <th className="p-2.5 min-w-[200px]">Tên vật tư</th>
                    <th className="p-2.5 w-28">Số lô</th>
                    <th className="p-2.5 text-right w-24">Yêu cầu</th>
                    <th className="p-2.5 text-right w-24 text-blue-600">Duyệt cấp</th>
                    <th className="p-2.5 text-right w-24 text-emerald-600">Thực xuất</th>
                    <th className="p-2.5 text-right w-28">Đơn giá</th>
                    <th className="p-2.5 text-right w-32">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {issue.lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="p-2.5 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-primary">
                        {line.materialCode}
                      </td>
                      <td className="p-2.5 font-medium text-foreground">{line.materialName}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        {line.batchNumber || "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono text-muted-foreground">
                        {line.requestedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-blue-600">
                        {line.approvedQuantity || line.requestedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                        {line.actualQuantity || line.approvedQuantity || line.requestedQuantity} {line.unit}
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
                    <td colSpan={6} className="p-2.5 text-right">
                      Tổng cộng:
                    </td>
                    <td className="p-2.5 text-right font-mono text-foreground">
                      {issue.totalQuantity}
                    </td>
                    <td></td>
                    <td className="p-2.5 text-right font-mono text-primary text-sm">
                      {formatVND(issue.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border text-muted-foreground">
            <strong>Mục đích sử dụng:</strong> {issue.reason}
          </div>

          {issue.issuedAt && (
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Đã thực xuất kho và giảm trừ số dư vào lúc{" "}
                <strong>{new Date(issue.issuedAt).toLocaleString("vi-VN")}</strong> bởi{" "}
                <strong>{issue.issuedBy}</strong>.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/70 flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {canApprove && onApprove && (
              <Button
                size="sm"
                onClick={() => onApprove(issue)}
                className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Phê duyệt xuất (Giữ chỗ tồn)</span>
              </Button>
            )}

            {canPostIssue && onConfirmIssue && (
              <Button
                size="sm"
                onClick={() => onConfirmIssue(issue)}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Xác nhận thực xuất kho</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
