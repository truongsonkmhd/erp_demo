import React, { useMemo } from "react"
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  History,
  Layers,
  RotateCcw,
  User,
  UserCheck,
  X,
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

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
import type { MaterialSettlement } from "../types/settlement.types"
import { SETTLEMENT_STATUS_CONFIG } from "../types/settlement.constants"
import { MaterialReturnRepository } from "../repositories/settlement.storage"
import type { SettlementWorkflowAction } from "./SettlementActionModal"

interface SettlementDetailModalProps {
  open: boolean
  onClose: () => void
  settlement: MaterialSettlement | null
  onOpenReturnModal: (stl: MaterialSettlement) => void
  onOpenActionModal: (stl: MaterialSettlement, action: SettlementWorkflowAction) => void
  onOpenEditModal: (stl: MaterialSettlement) => void
}

export function SettlementDetailModal({
  open,
  onClose,
  settlement,
  onOpenReturnModal,
  onOpenActionModal,
  onOpenEditModal,
}: SettlementDetailModalProps) {
  if (!settlement) return null

  const returns = useMemo(() => {
    return MaterialReturnRepository.getBySettlementId(settlement.id)
  }, [settlement.id, open])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const statusCfg = SETTLEMENT_STATUS_CONFIG[settlement.status] || {
    label: settlement.status,
    badgeClass: "bg-muted text-muted-foreground",
    description: "",
  }

  const handleExportExcel = () => {
    const exportData = settlement.lines.map((l, idx) => ({
      STT: idx + 1,
      "Mã vật tư": l.materialCode,
      "Tên vật tư": l.materialName,
      "Đơn vị tính": l.unit,
      "Số lô": l.batchNumber || "—",
      "Phiếu xuất gốc": l.goodsIssueCode,
      "Kho xuất": l.sourceWarehouseName,
      "Số lượng xuất": l.issuedQuantity,
      "Số lượng hoàn trả": l.returnedQuantity,
      "Sử dụng thực tế": l.actualUsedQuantity,
      "Đơn giá xuất (VNĐ)": l.unitPrice,
      "Thành tiền xuất (VNĐ)": l.totalIssuedAmount,
      "Thành tiền hoàn trả (VNĐ)": l.totalReturnedAmount,
      "Thành tiền quyết toán (VNĐ)": l.actualUsedAmount,
      "Ghi chú": l.note || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quyet_toan_vat_tu")
    XLSX.writeFile(workbook, `Quyet_toan_${settlement.code}_${new Date().toISOString().split("T")[0]}.xlsx`)
    toast.success(`Đã xuất Excel hồ sơ quyết toán "${settlement.code}" thành công!`)
  }

  const canEdit = settlement.status === "draft" || settlement.status === "revision_requested"
  const canReturn = settlement.status !== "approved" && settlement.status !== "rejected"

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header Dialog */}
        <DialogHeader className="p-5 border-b border-border/70 shrink-0 bg-muted/10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xl font-bold text-primary">{settlement.code}</span>
                <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold ${statusCfg.badgeClass}`}>
                  {statusCfg.label}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {settlement.missionName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Hạng mục: <strong className="text-foreground">{settlement.categoryName}</strong> • Đơn vị: {settlement.departmentName}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="h-8 text-xs gap-1.5"
                title="Xuất Excel hồ sơ quyết toán"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất Excel</span>
              </Button>

              {canReturn && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenReturnModal(settlement)}
                  className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Hoàn trả vật tư</span>
                </Button>
              )}

              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => onOpenEditModal(settlement)}
                  className="h-8 text-xs font-medium"
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Nội dung cuộn 4 khu vực */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Khu vực 1: Tóm tắt tổng hợp số liệu 3 ERP Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Tổng giá trị đã xuất</span>
              <div className="text-xl font-bold font-mono text-foreground">
                {formatVND(settlement.totalIssuedAmount)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {settlement.lines.length} mặt hàng xuất phục vụ thi công
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Giá trị thu hồi hoàn kho
              </span>
              <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                {formatVND(settlement.totalReturnedAmount)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Đã lập {returns.length} phiếu hoàn trả vật tư
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 shadow-2xs space-y-1">
              <span className="text-[11px] font-medium text-primary">Giá trị quyết toán thực tế</span>
              <div className="text-xl font-bold font-mono text-primary">
                {formatVND(settlement.totalActualUsedAmount)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Khối lượng đã nghiệm thu sử dụng
              </div>
            </div>
          </div>

          {/* Khu vực 2: Bảng chi tiết vật tư quyết toán & chênh lệch */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <Layers className="h-4 w-4 text-primary" />
                <span>Bảng kê chi tiết vật tư xuất kho & quyết toán sử dụng</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Niên độ: {settlement.period} • Ngày quyết toán: {settlement.settlementDate}
              </span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th className="p-2.5 w-10 text-center">STT</th>
                    <th className="p-2.5">Mã & Tên vật tư</th>
                    <th className="p-2.5 w-24 text-center">Số lô</th>
                    <th className="p-2.5 w-28">Phiếu xuất</th>
                    <th className="p-2.5 w-24 text-right">Đã xuất</th>
                    <th className="p-2.5 w-24 text-right text-emerald-600">Hoàn trả</th>
                    <th className="p-2.5 w-28 text-right font-bold text-primary">Sử dụng</th>
                    <th className="p-2.5 w-28 text-right">Đơn giá</th>
                    <th className="p-2.5 w-32 text-right">Thành tiền QT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {settlement.lines.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5 text-center text-muted-foreground font-medium">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-mono font-bold text-primary">{line.materialCode}</div>
                        <div className="font-medium text-foreground">{line.materialName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {line.specification || `ĐVT: ${line.unit}`}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[11px] text-muted-foreground">
                        {line.batchNumber || "—"}
                      </td>
                      <td className="p-2.5 font-mono text-muted-foreground">
                        <div>{line.goodsIssueCode}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[110px]" title={line.sourceWarehouseName}>
                          {line.sourceWarehouseName}
                        </div>
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium">
                        {line.issuedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono font-medium text-emerald-600">
                        {line.returnedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-primary">
                        {line.actualUsedQuantity} {line.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono text-muted-foreground">
                        {formatVND(line.unitPrice)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-foreground">
                        {formatVND(line.actualUsedAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/40 font-semibold border-t">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-right text-muted-foreground">
                      Tổng cộng quyết toán:
                    </td>
                    <td className="p-2.5 text-right font-mono">
                      {formatVND(settlement.totalIssuedAmount)}
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-600">
                      {formatVND(settlement.totalReturnedAmount)}
                    </td>
                    <td colSpan={2} className="p-2.5 text-right text-muted-foreground">
                      Thành tiền thực tế:
                    </td>
                    <td className="p-2.5 text-right font-mono text-primary font-bold">
                      {formatVND(settlement.totalActualUsedAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Khu vực 3: Danh sách các phiếu hoàn trả vật tư liên quan */}
          {returns.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <RotateCcw className="h-4 w-4 text-emerald-600" />
                <span>Phiếu hoàn trả vật tư đã ghi sổ ({returns.length} phiếu)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {returns.map((ret) => (
                  <div key={ret.id} className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {ret.code}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{ret.returnDate}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <div>Kho nhập lại: <strong className="text-foreground">{ret.warehouseName}</strong></div>
                      <div>Người trả: {ret.returnedBy} • Thủ kho: {ret.receiverName}</div>
                      {ret.notes && <div className="italic text-[10px]">"{ret.notes}"</div>}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-emerald-500/20 text-xs">
                      <span>Tổng giá trị hoàn:</span>
                      <span className="font-mono font-bold text-emerald-600">{formatVND(ret.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Khu vực 4: Lịch sử xử lý workflow & Ý kiến phê duyệt */}
          <div className="space-y-2.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
              <History className="h-4 w-4 text-primary" />
              <span>Nhật ký xử lý & Phê duyệt quyết toán</span>
            </span>

            <div className="border border-border rounded-xl p-4 bg-card space-y-3">
              <div className="space-y-3">
                {settlement.history?.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start gap-3 text-xs">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{item.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(item.timestamp).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        Thực hiện bởi: <strong className="text-foreground">{item.performedBy}</strong> ({item.performedByRole})
                      </div>
                      {item.comment && (
                        <div className="p-2 rounded-lg bg-muted/40 text-[11px] text-foreground mt-1">
                          "{item.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer với các nút workflow nhanh */}
        <DialogFooter className="p-4 border-t border-border/70 flex justify-between items-center bg-muted/10 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8.5 text-xs">
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {settlement.status === "draft" && (
              <Button
                size="sm"
                onClick={() => onOpenActionModal(settlement, "unit_confirm")}
                className="h-8.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đơn vị xác nhận</span>
              </Button>
            )}

            {settlement.status === "unit_confirmed" && (
              <Button
                size="sm"
                onClick={() => onOpenActionModal(settlement, "accounting_review")}
                className="h-8.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Kế toán thẩm tra</span>
              </Button>
            )}

            {settlement.status === "accounting_reviewed" && (
              <Button
                size="sm"
                onClick={() => onOpenActionModal(settlement, "submit_approval")}
                className="h-8.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Trình Lãnh đạo duyệt</span>
              </Button>
            )}

            {settlement.status === "pending_approval" && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenActionModal(settlement, "request_revision")}
                  className="h-8.5 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Yêu cầu sửa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenActionModal(settlement, "reject")}
                  className="h-8.5 text-xs text-rose-600 border-rose-300 hover:bg-rose-50"
                >
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={() => onOpenActionModal(settlement, "approve")}
                  className="h-8.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Duyệt quyết toán</span>
                </Button>
              </div>
            )}

            {settlement.status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenActionModal(settlement, "reopen")}
                className="h-8.5 text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                Mở lại hồ sơ
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
