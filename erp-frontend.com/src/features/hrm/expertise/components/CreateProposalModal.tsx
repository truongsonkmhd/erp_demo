import React, { useState } from "react"
import { Check, FilePlus2, Layers } from "lucide-react"

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
import { defaultHrmExpertRepository } from "../repositories/hrm-expert.storage"
import type { ExpertProposalRecord } from "../types/hrm-expert.types"

interface CreateProposalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (proposal: ExpertProposalRecord) => void
}

export function CreateProposalModal({
  open,
  onOpenChange,
  onCreated,
}: CreateProposalModalProps) {
  const [proposalTitle, setProposalTitle] = useState("")
  const [funder, setFunder] = useState("Cục Địa chất Việt Nam")
  const [expectedDuration, setExpectedDuration] = useState("24 tháng (2026 - 2028)")
  const [methodologiesText, setMethodologiesText] = useState("Đo từ hàng không, Đo trọng lực chi tiết")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const targetMethodology = methodologiesText
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)

    const newProposal: ExpertProposalRecord = {
      id: `PROP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      proposalTitle,
      funder,
      targetMethodology,
      expectedDuration,
      status: "draft",
      assignedExperts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    defaultHrmExpertRepository.saveProposal(newProposal)
    onOpenChange(false)
    onCreated(newProposal)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card text-card-foreground border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Khởi tạo hồ sơ năng lực đề án mới
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Thiết lập thông tin đề án để tuyển chọn và phân công đội ngũ chuyên gia.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Tên đề án / Gói thầu khảo sát</Label>
            <Input
              value={proposalTitle}
              onChange={(e) => setProposalTitle(e.target.value)}
              placeholder="Vd: Đề án điều tra địa chất khoáng sản ẩn sâu vùng Tây Bắc..."
              className="h-8.5 text-xs font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Chủ đầu tư / Cơ quan giao nhiệm vụ</Label>
              <Input
                value={funder}
                onChange={(e) => setFunder(e.target.value)}
                placeholder="Vd: Cục Địa chất Việt Nam, Bộ TN&MT..."
                className="h-8.5 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Thời gian thực hiện dự kiến</Label>
              <Input
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
                placeholder="Vd: 18 tháng (2026 - 2027)"
                className="h-8.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">
              Các phương pháp kỹ thuật yêu cầu trong đề án (cách nhau dấu phẩy)
            </Label>
            <Input
              value={methodologiesText}
              onChange={(e) => setMethodologiesText(e.target.value)}
              placeholder="Vd: Đo từ hàng không, Địa chấn nông, Đo sâu điện IP..."
              className="h-8.5 text-xs"
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
              <span>Khởi tạo hồ sơ</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
