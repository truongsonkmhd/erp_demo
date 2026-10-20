import React, { useState } from "react"
import { Check, Settings } from "lucide-react"
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
import { defaultHrmPayrollRepository } from "../repositories/hrm-payroll.storage"
import type { PayrollConfig } from "../types/hrm-payroll.types"

interface PayrollSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function PayrollSettingsModal({ open, onOpenChange, onSaved }: PayrollSettingsModalProps) {
  const [config, setConfig] = useState<PayrollConfig>(
    defaultHrmPayrollRepository.getConfig()
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    defaultHrmPayrollRepository.saveConfig(config)
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Cấu hình tham số tiền lương
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Thiết lập mức lương cơ sở nhà nước và các tỷ lệ trích nộp theo luật.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Mức lương cơ sở nhà nước (VNĐ/tháng)</Label>
            <Input
              type="number"
              value={config.baseSalaryRate}
              onChange={(e) =>
                setConfig({ ...config, baseSalaryRate: parseInt(e.target.value) || 0 })
              }
              className="h-8.5 text-xs font-mono"
              required
            />
            <div className="text-[10px] text-muted-foreground">
              Áp dụng theo Nghị định 73/2024/NĐ-CP (2.340.000 ₫ từ 01/07/2024).
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">
              Định mức phụ cấp lưu động/thực địa (VNĐ/ngày công)
            </Label>
            <Input
              type="number"
              value={config.fieldworkDayRate}
              onChange={(e) =>
                setConfig({ ...config, fieldworkDayRate: parseInt(e.target.value) || 0 })
              }
              className="h-8.5 text-xs font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Tỷ lệ BHXH NLĐ đóng (%)</Label>
              <Input
                type="number"
                step={0.1}
                value={config.bhxhRate * 100}
                onChange={(e) =>
                  setConfig({ ...config, bhxhRate: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="h-8.5 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Tỷ lệ BHYT NLĐ đóng (%)</Label>
              <Input
                type="number"
                step={0.1}
                value={config.bhytRate * 100}
                onChange={(e) =>
                  setConfig({ ...config, bhytRate: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Tỷ lệ BHTN NLĐ đóng (%)</Label>
              <Input
                type="number"
                step={0.1}
                value={config.bhtnRate * 100}
                onChange={(e) =>
                  setConfig({ ...config, bhtnRate: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="h-8.5 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Kinh phí Đoàn thể (%)</Label>
              <Input
                type="number"
                step={0.1}
                value={config.unionRate * 100}
                onChange={(e) =>
                  setConfig({ ...config, unionRate: (parseFloat(e.target.value) || 0) / 100 })
                }
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Giảm trừ bản thân (VNĐ)</Label>
              <Input
                type="number"
                value={config.personalDeduction}
                onChange={(e) =>
                  setConfig({ ...config, personalDeduction: parseInt(e.target.value) || 0 })
                }
                className="h-8.5 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Giảm trừ người phụ thuộc (VNĐ)</Label>
              <Input
                type="number"
                value={config.dependentDeduction}
                onChange={(e) =>
                  setConfig({ ...config, dependentDeduction: parseInt(e.target.value) || 0 })
                }
                className="h-8.5 text-xs font-mono"
              />
            </div>
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
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>Lưu cấu hình</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
