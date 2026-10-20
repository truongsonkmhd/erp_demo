import React, { useMemo, useState } from "react"
import { Calendar, Download, FileSpreadsheet, Filter, History, X } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  InventoryTransaction,
  Material,
  StockLevel,
  Warehouse,
} from "../types/inventory.types"
import { TRANSACTION_TYPE_CONFIG } from "../types/inventory.constants"

interface StockCardModalProps {
  open: boolean
  onClose: () => void
  material: Material | null
  stockLevel?: StockLevel | null
  transactions: InventoryTransaction[]
  warehouses: Warehouse[]
}

export function StockCardModal({
  open,
  onClose,
  material,
  stockLevel,
  transactions,
  warehouses,
}: StockCardModalProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("all")

  // Thiết lập kho ban đầu nếu được truyền từ stockLevel
  React.useEffect(() => {
    if (stockLevel?.warehouseId) {
      setSelectedWarehouseId(stockLevel.warehouseId)
    } else {
      setSelectedWarehouseId("all")
    }
  }, [stockLevel])

  // Lọc giao dịch của vật tư
  const filteredTx = useMemo(() => {
    if (!material) return []
    return transactions
      .filter((tx) => {
        const matchMat = tx.materialId === material.id
        const matchWh =
          selectedWarehouseId === "all" || tx.warehouseId === selectedWarehouseId
        return matchMat && matchWh
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [material, transactions, selectedWarehouseId])

  // Tính số dư lũy kế từng dòng
  const runningLedger = useMemo(() => {
    let currentBalance = 0
    return filteredTx.map((tx) => {
      const isAdd =
        tx.type === "receipt" ||
        tx.type === "transfer_in" ||
        tx.type === "adjust_increase" ||
        tx.type === "return"
      const inQty = isAdd ? tx.quantity : 0
      const outQty = !isAdd ? tx.quantity : 0
      currentBalance = currentBalance + inQty - outQty

      return {
        ...tx,
        inQty,
        outQty,
        runningBalance: currentBalance,
      }
    })
  }, [filteredTx])

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleExport = () => {
    if (runningLedger.length === 0) {
      toast.warning("Không có dữ liệu thẻ kho để xuất Excel")
      return
    }

    const data = runningLedger.map((row, idx) => ({
      STT: idx + 1,
      "Thời gian": new Date(row.timestamp).toLocaleDateString("vi-VN"),
      "Mã giao dịch": row.transactionCode,
      "Loại giao dịch": TRANSACTION_TYPE_CONFIG[row.type]?.label || row.type,
      "Chứng từ gốc": row.sourceDocumentCode,
      "Kho lưu trữ": row.warehouseName,
      "Số lô": row.batchNumber || "—",
      "Số lượng nhập": row.inQty || "",
      "Số lượng xuất": row.outQty || "",
      "Tồn sau GD": row.runningBalance,
      "Đơn giá (VNĐ)": row.unitPrice,
      "Thành tiền (VNĐ)": row.totalAmount,
      "Người ghi sổ": row.postedBy,
      "Nhiệm vụ / Diễn giải": row.notes || row.projectName || "",
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "The_kho")
    XLSX.writeFile(
      workbook,
      `The_kho_${material?.code}_${new Date().toISOString().split("T")[0]}.xlsx`
    )
    toast.success("Đã xuất Excel Thẻ kho thành công!")
  }

  if (!material) return null

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 border-b border-border/70">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg font-bold">
                  Thẻ kho: {material.code} - {material.name}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs mt-1">
                Sổ giao dịch bất biến ghi nhận mọi biến động Nhập - Xuất - Điều chuyển của vật tư.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                <SelectTrigger className="h-8.5 text-xs w-48">
                  <SelectValue placeholder="Lọc theo kho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Tất cả các kho
                  </SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-xs">
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8.5 text-xs gap-1.5"
                title="Xuất Thẻ kho ra Excel"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Xuất Excel</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Nội dung bảng giao dịch */}
        <div className="flex-1 overflow-y-auto p-5">
          {runningLedger.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              Chưa có giao dịch phát sinh nào cho vật tư này tại kho đã chọn.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/70 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-2.5 text-center w-12">STT</th>
                    <th className="p-2.5 w-24">Ngày</th>
                    <th className="p-2.5 w-28">Mã GD</th>
                    <th className="p-2.5 w-32">Loại giao dịch</th>
                    <th className="p-2.5 w-28">Chứng từ</th>
                    <th className="p-2.5 w-36">Kho lưu trữ</th>
                    <th className="p-2.5 w-24">Số lô</th>
                    <th className="p-2.5 text-right w-20 text-emerald-600">Nhập (+)</th>
                    <th className="p-2.5 text-right w-20 text-rose-600">Xuất (-)</th>
                    <th className="p-2.5 text-right w-24 font-bold">Tồn cuối</th>
                    <th className="p-2.5 text-right w-28">Đơn giá</th>
                    <th className="p-2.5 min-w-[180px]">Diễn giải</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {runningLedger.map((row, idx) => {
                    const typeConfig = TRANSACTION_TYPE_CONFIG[row.type]
                    return (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 text-center text-muted-foreground">{idx + 1}</td>
                        <td className="p-2.5 text-muted-foreground whitespace-nowrap">
                          {new Date(row.timestamp).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-primary whitespace-nowrap">
                          {row.transactionCode}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`font-semibold text-[11px] ${typeConfig?.colorClass || ""}`}
                          >
                            {typeConfig?.label || row.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-foreground">
                          {row.sourceDocumentCode}
                        </td>
                        <td className="p-2.5 truncate max-w-[150px]">{row.warehouseName}</td>
                        <td className="p-2.5 font-mono text-muted-foreground">
                          {row.batchNumber || "—"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {row.inQty > 0 ? `+${row.inQty}` : ""}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                          {row.outQty > 0 ? `-${row.outQty}` : ""}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-foreground bg-muted/20">
                          {row.runningBalance} {material.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          {formatVND(row.unitPrice)}
                        </td>
                        <td className="p-2.5 text-[11px] text-muted-foreground">
                          {row.notes || row.projectName || "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/70 flex justify-between items-center bg-card text-xs">
          <div className="text-muted-foreground">
            Quy cách: <strong>{material.specification || "Tiêu chuẩn Liên đoàn"}</strong> • ĐVT:{" "}
            <strong>{material.unit}</strong>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Đóng Thẻ kho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
