import React, { useEffect, useState } from "react"
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Layers,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react"
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
  PurchaseRequest,
  PurchaseRequestLine,
  PurchaseRequestStatus,
} from "../types/procurement.types"
import {
  BUDGET_SOURCES,
  PROCUREMENT_DEPARTMENTS,
  SUPPLY_CATEGORIES,
} from "../types/procurement.constants"
import { PurchaseRequestRepository } from "../repositories/procurement.storage"

interface PurchaseRequestFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestToEdit?: PurchaseRequest | null
  currentUser?: { fullName?: string; department?: string; role?: string }
  onSaved: (savedRequest: PurchaseRequest) => void
}

const EMPTY_LINE: Omit<PurchaseRequestLine, "id" | "totalPrice"> = {
  itemCode: "",
  itemName: "",
  itemGroup: SUPPLY_CATEGORIES[0],
  specification: "",
  unit: "Bộ",
  availableStock: 0,
  quantity: 1,
  estimatedUnitPrice: 0,
  note: "",
}

export function PurchaseRequestFormDrawer({
  open,
  onOpenChange,
  requestToEdit,
  currentUser,
  onSaved,
}: PurchaseRequestFormDrawerProps) {
  const [department, setDepartment] = useState(
    currentUser?.department || PROCUREMENT_DEPARTMENTS[0]
  )
  const [requesterName, setRequesterName] = useState(
    currentUser?.fullName || "Nguyễn Văn Đức"
  )
  const [projectName, setProjectName] = useState("")
  const [projectItem, setProjectItem] = useState("")
  const [planReference, setPlanReference] = useState("")
  const [budgetSource, setBudgetSource] = useState(BUDGET_SOURCES[0])
  const [requiredDate, setRequiredDate] = useState("")
  const [reason, setReason] = useState("")
  const [lines, setLines] = useState<PurchaseRequestLine[]>([])

  useEffect(() => {
    if (requestToEdit) {
      setDepartment(requestToEdit.department)
      setRequesterName(requestToEdit.requesterName)
      setProjectName(requestToEdit.projectName)
      setProjectItem(requestToEdit.projectItem || "")
      setPlanReference(requestToEdit.planReference || "")
      setBudgetSource(requestToEdit.budgetSource)
      setRequiredDate(requestToEdit.requiredDate)
      setReason(requestToEdit.reason)
      setLines(requestToEdit.lines || [])
    } else {
      setDepartment(currentUser?.department || PROCUREMENT_DEPARTMENTS[0])
      setRequesterName(currentUser?.fullName || "Cán bộ kỹ thuật")
      setProjectName("Đề án Bay đo Từ - Trọng lực Tây Bắc")
      setProjectItem("Hạng mục khảo sát thực địa năm 2026")
      setPlanReference(`KH-2026/ĐVL-${Math.floor(Math.random() * 9 + 1)}`)
      setBudgetSource(BUDGET_SOURCES[0])
      const nextMonth = new Date()
      nextMonth.setDate(nextMonth.getDate() + 20)
      setRequiredDate(nextMonth.toISOString().split("T")[0])
      setReason("")
      setLines([
        {
          id: `line-${Date.now()}-1`,
          ...EMPTY_LINE,
          itemCode: "VT-01",
          itemName: "",
          totalPrice: 0,
        },
      ])
    }
  }, [requestToEdit, currentUser, open])

  // Tính tổng thành tiền
  const totalAmount = lines.reduce((acc, l) => acc + (l.totalPrice || 0), 0)

  // Kiểm tra cảnh báo tồn kho
  const hasItemsInStock = lines.some((l) => l.availableStock > 0)

  const handleAddLine = () => {
    const newLine: PurchaseRequestLine = {
      id: `line-${Date.now()}-${lines.length + 1}`,
      ...EMPTY_LINE,
      itemCode: `VT-${(lines.length + 1).toString().padStart(2, "0")}`,
      totalPrice: 0,
    }
    setLines([...lines, newLine])
  }

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) {
      toast.warning("Đề xuất phải có ít nhất 1 dòng vật tư")
      return
    }
    setLines(lines.filter((_, idx) => idx !== index))
  }

  const handleUpdateLine = (
    index: number,
    field: keyof PurchaseRequestLine,
    value: string | number
  ) => {
    const updated = [...lines]
    const cur = { ...updated[index], [field]: value }

    if (field === "quantity" || field === "estimatedUnitPrice") {
      const q = field === "quantity" ? Number(value) || 0 : cur.quantity
      const p = field === "estimatedUnitPrice" ? Number(value) || 0 : cur.estimatedUnitPrice
      cur.totalPrice = q * p
    }

    updated[index] = cur
    setLines(updated)
  }

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num)
  }

  const handleSubmit = (targetStatus: PurchaseRequestStatus) => {
    // Validation
    if (!projectName.trim()) {
      toast.error("Vui lòng nhập tên Nhiệm vụ / Đề án")
      return
    }
    if (!requiredDate) {
      toast.error("Vui lòng chọn thời điểm cần hàng")
      return
    }
    if (lines.length === 0) {
      toast.error("Vui lòng bổ sung ít nhất một dòng vật tư")
      return
    }
    const invalidLine = lines.find((l) => !l.itemName.trim() || l.quantity <= 0)
    if (invalidLine) {
      toast.error("Vui lòng nhập đầy đủ tên vật tư và số lượng lớn hơn 0")
      return
    }

    const now = new Date().toISOString()
    const isNew = !requestToEdit

    const requestPayload: PurchaseRequest = {
      id: requestToEdit?.id || `req-${Date.now()}`,
      code: requestToEdit?.code || PurchaseRequestRepository.generateNextCode(),
      requestDate: requestToEdit?.requestDate || new Date().toISOString().split("T")[0],
      department,
      requesterName,
      projectName,
      projectItem,
      planReference,
      budgetSource,
      requiredDate,
      reason,
      status: targetStatus,
      totalAmount,
      lines,
      attachments: requestToEdit?.attachments || [],
      approvalHistory: requestToEdit?.approvalHistory || [
        {
          id: `wf-${Date.now()}`,
          stepName: "Khởi tạo đề nghị",
          actorName: requesterName,
          actorRole: currentUser?.role || "Cán bộ đề xuất",
          action: targetStatus === "draft" ? "create" : "submit",
          actionName: targetStatus === "draft" ? "Lưu bản nháp" : "Trình duyệt đề xuất",
          comment: reason || "Đề nghị cấp vật tư phục vụ nhiệm vụ",
          timestamp: now,
          previousStatus: "draft",
          newStatus: targetStatus,
        },
      ],
      createdAt: requestToEdit?.createdAt || now,
      updatedAt: now,
    }

    // Nếu sửa và trình duyệt
    if (!isNew && targetStatus === "pending_dept" && requestToEdit.status !== "pending_dept") {
      requestPayload.approvalHistory.push({
        id: `wf-${Date.now()}`,
        stepName: "Trình duyệt lại",
        actorName: requesterName,
        actorRole: currentUser?.role || "Cán bộ đề xuất",
        action: "submit",
        actionName: "Trình trưởng đơn vị duyệt",
        comment: "Đã cập nhật hoàn thiện hồ sơ đề xuất",
        timestamp: now,
        previousStatus: requestToEdit.status,
        newStatus: "pending_dept",
      })
    }

    const saved = PurchaseRequestRepository.save(requestPayload)
    toast.success(
      targetStatus === "draft"
        ? `Đã lưu bản nháp đề xuất ${saved.code}`
        : `Đã trình duyệt thành công đề xuất ${saved.code}`
    )
    onSaved(saved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>
                  {requestToEdit ? `Chỉnh sửa đề xuất ${requestToEdit.code}` : "Lập đề nghị mua sắm vật tư, thiết bị mới"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Kiểm tra đối chiếu với kế hoạch được giao, dự toán nguồn kinh phí và tồn kho khả dụng trước khi trình duyệt.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Cảnh báo tồn kho nếu có */}
          {hasItemsInStock && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <strong>Lưu ý:</strong> Một số vật tư trong danh mục vẫn còn tồn khả dụng tại kho của Liên đoàn. Vui lòng rà soát lại nhu cầu thực tế trước khi trình duyệt để tránh lãng phí.
              </div>
            </div>
          )}

          {/* Phần 1: Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-muted/40 border border-border/70">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Đơn vị đề xuất *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROCUREMENT_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-xs">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cán bộ đề xuất *</Label>
              <Input
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Họ và tên cán bộ..."
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Thời điểm cần hàng *</Label>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Nhiệm vụ / Đề án sử dụng *</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Tên đầy đủ của đề án, nhiệm vụ địa chất..."
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Hạng mục thi công</Label>
              <Input
                value={projectItem}
                onChange={(e) => setProjectItem(e.target.value)}
                placeholder="Hạng mục công việc..."
                className="h-8.5 text-xs bg-background"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs font-semibold">Nguồn kinh phí chi trả *</Label>
              <Select value={budgetSource} onValueChange={setBudgetSource}>
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_SOURCES.map((bs) => (
                    <SelectItem key={bs} value={bs} className="text-xs">
                      {bs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kế hoạch / Dự toán tham chiếu</Label>
              <Input
                value={planReference}
                onChange={(e) => setPlanReference(e.target.value)}
                placeholder="VD: KH-2026/ĐVL-03..."
                className="h-8.5 text-xs bg-background font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <Label className="text-xs font-semibold">Lý do & Mục đích mua sắm</Label>
              <Textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mô tả sự cần thiết, tình trạng trang thiết bị hiện tại, mục đích sử dụng..."
                className="text-xs bg-background resize-none"
              />
            </div>
          </div>

          {/* Phần 2: Bảng danh mục vật tư đề nghị */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-foreground text-xs uppercase tracking-wide flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Danh mục vật tư, thiết bị cần mua ({lines.length} dòng)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm dòng vật tư</span>
              </Button>
            </div>

            <div className="border border-border/70 rounded-xl overflow-hidden shadow-2xs">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="w-10 text-center font-bold">STT</TableHead>
                    <TableHead className="w-24 font-bold">Mã VT</TableHead>
                    <TableHead className="min-w-[180px] font-bold">Tên vật tư / Thiết bị *</TableHead>
                    <TableHead className="w-36 font-bold">Nhóm vật tư</TableHead>
                    <TableHead className="w-20 text-center font-bold">ĐVT</TableHead>
                    <TableHead className="w-20 text-center font-bold">Tồn kho</TableHead>
                    <TableHead className="w-20 text-right font-bold">SL mua *</TableHead>
                    <TableHead className="w-28 text-right font-bold">Đơn giá dự kiến</TableHead>
                    <TableHead className="w-32 text-right font-bold">Thành tiền</TableHead>
                    <TableHead className="w-10 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, idx) => (
                    <TableRow key={line.id} className="hover:bg-muted/20">
                      <TableCell className="text-center font-mono text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={line.itemCode}
                          onChange={(e) => handleUpdateLine(idx, "itemCode", e.target.value)}
                          className="h-7 text-xs font-mono"
                          placeholder="Mã VT"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            value={line.itemName}
                            onChange={(e) => handleUpdateLine(idx, "itemName", e.target.value)}
                            className="h-7 text-xs font-medium"
                            placeholder="Nhập tên vật tư..."
                          />
                          <Input
                            value={line.specification}
                            onChange={(e) => handleUpdateLine(idx, "specification", e.target.value)}
                            className="h-6 text-[11px] text-muted-foreground"
                            placeholder="Quy cách, thông số kỹ thuật..."
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={line.itemGroup}
                          onValueChange={(val) => handleUpdateLine(idx, "itemGroup", val)}
                        >
                          <SelectTrigger className="h-7 text-[11px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPLY_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={line.unit}
                          onChange={(e) => handleUpdateLine(idx, "unit", e.target.value)}
                          className="h-7 text-xs text-center"
                          placeholder="Bộ/Cái"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="0"
                          value={line.availableStock}
                          onChange={(e) => handleUpdateLine(idx, "availableStock", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs text-center font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateLine(idx, "quantity", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs text-right font-mono font-bold"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="100000"
                          value={line.estimatedUnitPrice}
                          onChange={(e) => handleUpdateLine(idx, "estimatedUnitPrice", parseInt(e.target.value) || 0)}
                          className="h-7 text-xs text-right font-mono"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-primary">
                        {formatVND(line.totalPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLine(idx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs">
              <span className="text-muted-foreground">
                Tổng số lượng dòng: <strong>{lines.length}</strong> mặt hàng
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Tổng kinh phí đề nghị:</span>
                <span className="text-base font-mono font-extrabold text-primary">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Hủy bỏ
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSubmit("draft")}
              className="text-xs gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Lưu bản nháp</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit("pending_dept")}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Lưu & Trình phê duyệt</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
