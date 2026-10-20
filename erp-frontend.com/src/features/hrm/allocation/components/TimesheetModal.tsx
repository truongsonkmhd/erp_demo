import React, { useEffect, useState } from "react"
import { Calculator, CalendarCheck, Check, DollarSign } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { defaultHrmAllocationRepository } from "../repositories/hrm-allocation.storage"
import type { TaskTimesheetRecord } from "../types/hrm-allocation.types"
import {
  calculateLaborCost,
  formatVND,
} from "../utils/allocation-calculator"

interface TimesheetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord: TaskTimesheetRecord | null
  currentMonth: number
  currentYear: number
  onSaved: () => void
}

export function TimesheetModal({
  open,
  onOpenChange,
  initialRecord,
  currentMonth,
  currentYear,
  onSaved,
}: TimesheetModalProps) {
  const [fieldworkDays, setFieldworkDays] = useState(12)
  const [officeDays, setOfficeDays] = useState(8)
  const [dailyRate, setDailyRate] = useState(550000)
  const [fieldworkAllowanceRate, setFieldworkAllowanceRate] = useState(180000)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (initialRecord) {
      setFieldworkDays(initialRecord.fieldworkDays)
      setOfficeDays(initialRecord.officeDays)
      setDailyRate(initialRecord.dailyRate)
      setFieldworkAllowanceRate(initialRecord.fieldworkAllowanceRate)
      setNotes(initialRecord.notes || "")
    } else {
      setFieldworkDays(12)
      setOfficeDays(8)
      setDailyRate(550000)
      setFieldworkAllowanceRate(180000)
      setNotes("")
    }
  }, [initialRecord, open])

  if (!initialRecord) return null

  const totalDays = fieldworkDays + officeDays
  const totalLaborCost = calculateLaborCost(
    fieldworkDays,
    officeDays,
    dailyRate,
    fieldworkAllowanceRate
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updated: TaskTimesheetRecord = {
      ...initialRecord,
      month: currentMonth,
      year: currentYear,
      fieldworkDays,
      officeDays,
      totalDays,
      dailyRate,
      fieldworkAllowanceRate,
      totalLaborCost,
      notes,
    }

    defaultHrmAllocationRepository.saveTimesheet(updated)
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Ghi nhận ngày công theo nhiệm vụ đề án
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tháng {currentMonth}/{currentYear} • {initialRecord.fullName} ({initialRecord.employeeCode})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Thông tin đề án */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <div className="text-[11px] text-muted-foreground">Đề án ghi nhận:</div>
            <div className="font-bold text-foreground mt-0.5">{initialRecord.projectName}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Đơn vị: {initialRecord.department}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Số ngày công thực địa dã ngoại</Label>
              <Input
                type="number"
                min={0}
                max={31}
                value={fieldworkDays}
                onChange={(e) => setFieldworkDays(parseInt(e.target.value) || 0)}
                className="h-8.5 text-xs font-mono font-bold"
                required
              />
              <div className="text-[10px] text-muted-foreground">
                Được hưởng thêm phụ cấp lưu động
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Số ngày công nội nghiệp / văn phòng</Label>
              <Input
                type="number"
                min={0}
                max={31}
                value={officeDays}
                onChange={(e) => setOfficeDays(parseInt(e.target.value) || 0)}
                className="h-8.5 text-xs font-mono font-bold"
                required
              />
              <div className="text-[10px] text-muted-foreground">
                Xử lý số liệu, minh giải tài liệu
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Đơn giá ngày công định mức (VNĐ)</Label>
              <Input
                type="number"
                step={10000}
                value={dailyRate}
                onChange={(e) => setDailyRate(parseInt(e.target.value) || 0)}
                className="h-8.5 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Định mức PC lưu động/ngày (VNĐ)</Label>
              <Input
                type="number"
                step={10000}
                value={fieldworkAllowanceRate}
                onChange={(e) => setFieldworkAllowanceRate(parseInt(e.target.value) || 0)}
                className="h-8.5 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Live Preview Chi phí nhân công */}
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">
                TỔNG CHI PHÍ NHÂN CÔNG ĐỀ ÁN CHỊU:
              </span>
              <span className="text-base font-extrabold text-primary font-mono">
                {formatVND(totalLaborCost)}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground flex justify-between">
              <span>Tổng số ngày công: <strong>{totalDays} ngày</strong></span>
              <span>
                (Thực địa: {fieldworkDays}n × {formatVND(dailyRate + fieldworkAllowanceRate)} + VP: {officeDays}n × {formatVND(dailyRate)})
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Ghi chú nhật ký công tác</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú tuyến đo hoặc nội dung chuyên môn..."
              className="text-xs resize-none h-16"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Hủy bỏ
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>Lưu bảng chấm công</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
