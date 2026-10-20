import React from "react"
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  MapPin,
  Tag,
  User,
  X,
  XCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PurchaseRequest } from "../types/procurement.types"
import { PURCHASE_REQUEST_STATUS_CONFIG } from "../types/procurement.constants"

interface PurchaseRequestDetailModalProps {
  request: PurchaseRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApproveAction?: (request: PurchaseRequest) => void
  canApprove?: boolean
}

export function PurchaseRequestDetailModal({
  request,
  open,
  onOpenChange,
  onApproveAction,
  canApprove = false,
}: PurchaseRequestDetailModalProps) {
  if (!request) return null

  const statusConfig = PURCHASE_REQUEST_STATUS_CONFIG[request.status]

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>Hồ sơ đề xuất mua sắm:</span>
                <span className="font-mono text-primary text-base">{request.code}</span>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Ngày đề nghị: {new Date(request.requestDate).toLocaleDateString("vi-VN")} • Đơn vị: {request.department}
              </DialogDescription>
            </div>
            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2 text-xs">
          {/* 1. Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/70">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>Người đề xuất:</span>
                <strong className="text-foreground">{request.requesterName}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Đơn vị công tác:</span>
                <strong className="text-foreground">{request.department}</strong>
              </div>
              <div className="flex items-start gap-1.5 text-muted-foreground">
                <Tag className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>Nhiệm vụ / Đề án:</span>
                <strong className="text-foreground">{request.projectName}</strong>
              </div>
              {request.projectItem && (
                <div className="flex items-center gap-1.5 text-muted-foreground pl-5">
                  <span>Hạng mục:</span>
                  <span className="text-foreground">{request.projectItem}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Thời điểm cần hàng:</span>
                <strong className="text-foreground">
                  {new Date(request.requiredDate).toLocaleDateString("vi-VN")}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Nguồn kinh phí:</span>
                <span className="text-foreground font-medium">{request.budgetSource}</span>
              </div>
              {request.planReference && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Kế hoạch tham chiếu:</span>
                  <span className="text-foreground font-mono">{request.planReference}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Tổng giá trị dự kiến:</span>
                <strong className="text-primary font-mono text-sm">
                  {formatVND(request.totalAmount)}
                </strong>
              </div>
            </div>

            {request.reason && (
              <div className="md:col-span-2 pt-2 border-t border-border/60">
                <span className="text-muted-foreground font-medium">Lý do & mục đích mua sắm: </span>
                <span className="text-foreground">{request.reason}</span>
              </div>
            )}
          </div>

          {/* 2. Danh mục vật tư đề nghị */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                Danh sách vật tư / thiết bị đề nghị ({request.lines.length} mục)
              </h4>
              <span className="font-mono text-xs text-muted-foreground">
                Tổng cộng: <strong className="text-primary">{formatVND(request.totalAmount)}</strong>
              </span>
            </div>

            <div className="border border-border/70 rounded-xl overflow-hidden">
              <Table className="text-xs">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold">STT</TableHead>
                    <TableHead className="w-24 font-bold">Mã VT</TableHead>
                    <TableHead className="min-w-[160px] font-bold">Tên vật tư / Quy cách</TableHead>
                    <TableHead className="w-16 text-center font-bold">ĐVT</TableHead>
                    <TableHead className="w-20 text-center font-bold">Tồn kho</TableHead>
                    <TableHead className="w-20 text-right font-bold">SL mua</TableHead>
                    <TableHead className="w-28 text-right font-bold">Đơn giá dự kiến</TableHead>
                    <TableHead className="w-32 text-right font-bold">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.lines.map((line, idx) => (
                    <TableRow key={line.id}>
                      <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-primary font-medium">{line.itemCode}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{line.itemName}</div>
                        {line.specification && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">
                            {line.specification}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{line.unit}</TableCell>
                      <TableCell className="text-center">
                        {line.availableStock > 0 ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                            Còn {line.availableStock}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground font-mono">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {line.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {formatVND(line.estimatedUnitPrice)}
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

          {/* 3. Tài liệu đính kèm */}
          {request.attachments?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide">
                Hồ sơ & Tài liệu đính kèm ({request.attachments.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {request.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border text-xs hover:border-primary/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium truncate max-w-[220px]">{att.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ({(att.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" title="Tải tài liệu">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Tiến trình phê duyệt (Timeline) */}
          <div className="space-y-2 pt-2 border-t border-border/70">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Tiến trình phê duyệt hồ sơ ({request.approvalHistory?.length || 0} bước)</span>
            </h4>

            <div className="space-y-2.5 relative pl-4 border-l-2 border-primary/20 ml-2">
              {request.approvalHistory?.map((step) => (
                <div key={step.id} className="relative group">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="p-2.5 rounded-lg bg-card border border-border shadow-2xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-foreground">
                        {step.stepName} • <span className="text-primary font-normal">{step.actionName}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {new Date(step.timestamp).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Người thực hiện: <strong className="text-foreground">{step.actorName}</strong> ({step.actorRole})
                    </div>
                    {step.comment && (
                      <div className="text-xs bg-muted/50 p-1.5 rounded text-foreground italic border-l-2 border-primary/40">
                        &quot;{step.comment}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Đóng
          </Button>

          {canApprove && onApproveAction && request.status !== "approved" && request.status !== "rejected" && (
            <Button
              size="sm"
              onClick={() => onApproveAction(request)}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Xử lý phê duyệt hồ sơ này
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
