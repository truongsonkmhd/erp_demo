import React, { useState } from "react"
import { Calendar, Check, Loader2, Sparkles } from "lucide-react"
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
import { defaultHrmPayrollRepository } from "../repositories/hrm-payroll.storage"
import type { PayrollPeriodRecord } from "../types/hrm-payroll.types"

interface CreatePayrollPeriodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (period: PayrollPeriodRecord) => void
}

export function CreatePayrollPeriodModal({
  open,
  onOpenChange,
  onCreated,
}: CreatePayrollPeriodModalProps) {
  const currentDate = new Date()
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1)
  const [year, setYear] = useState<number>(currentDate.getFullYear())
  const [title, setTitle] = useState<string>(
    `Bảng lương cán bộ Tháng ${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getFullYear()}`
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMonthChange = (newMonthStr: string) => {
    const newMonth = parseInt(newMonthStr, 10)
    setMonth(newMonth)
    setTitle(`Bảng lương cán bộ Tháng ${newMonth.toString().padStart(2, "0")}/${year}`)
  }

  const handleYearChange = (newYearStr: string) => {
    const newYear = parseInt(newYearStr, 10)
    setYear(newYear)
    setTitle(`Bảng lương cán bộ Tháng ${month.toString().padStart(2, "0")}/${newYear}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const periodId = `PAY-${year}-${month.toString().padStart(2, "0")}`
      const existing = defaultHrmPayrollRepository.getPeriodById(periodId)
      if (existing) {
        setError(`Kỳ lương Tháng ${month}/${year} (${periodId}) đã tồn tại trong hệ thống!`)
        setIsSubmitting(false)
        return
      }

      const created = defaultHrmPayrollRepository.createPeriod(month, year, title)
      setIsSubmitting(false)
      onOpenChange(false)
      onCreated(created)
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra khi khởi tạo kỳ lương.")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Khởi tạo kỳ tính lương mới
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tự động tổng hợp danh sách cán bộ, hệ số lương và phụ cấp đặc thù.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tháng tính lương</Label>
              <Select value={month.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn tháng" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()} className="text-xs">
                      Tháng {m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Năm</Label>
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                  {[2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-xs">
                      Năm {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tên hiển thị kỳ lương</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Bảng lương cán bộ Tháng 10/2026"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Quy trình tự động hóa:</span>
            </div>
            <p>
              • Kế thừa ngạch bậc và hệ số lương mới nhất từ hồ sơ cán bộ (HRM-01) & quyết định nâng lương (HRM-02).
            </p>
            <p>
              • Tự động trích xuất số ngày nghỉ không lương từ module Nghỉ phép (HRM-03).
            </p>
            <p>
              • Áp dụng mức lương cơ sở nhà nước hiện hành: <strong>2.340.000 ₫/tháng</strong>.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-8 gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Khởi tạo kỳ tính lương</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
