import React from "react"
import { Briefcase, Building2, Calendar, FileText } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeStatusBadge } from "../EmployeeStatusBadge"
import type { EmployeeRecord } from "../../types/employee-profile.types.ts"
import { formatDateVN } from "../../utils/date-format.ts"

interface JobContractTabProps {
  record: EmployeeRecord
}

function renderValue(val?: string | null) {
  if (!val || !val.trim()) {
    return <span className="text-muted-foreground italic">Chưa cập nhật</span>
  }
  return <span className="font-medium text-foreground">{val}</span>
}

export function JobContractTab({ record }: JobContractTabProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* 1. Vị trí & Đơn vị công tác */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Tổ chức & Vị trí việc làm</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Đơn vị / Phòng ban:</span>
            <span className="font-semibold text-foreground">{renderValue(record.department)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Vị trí việc làm:</span>
            <span className="font-semibold text-foreground">{renderValue(record.position)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Chuyên môn phụ trách:</span>
            <span>{renderValue(record.specialty)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-muted-foreground">Trạng thái công tác:</span>
            <EmployeeStatusBadge status={record.workStatus} />
          </div>
        </CardContent>
      </Card>

      {/* 2. Hợp đồng lao động */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-primary" />
            <span>Hợp đồng lao động & Chế độ</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Loại hợp đồng lao động:</span>
            <span className="font-medium text-foreground">{renderValue(record.contractType)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Số hiệu hợp đồng:</span>
            <span className="font-mono font-medium text-foreground">{renderValue(record.contractNumber)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ngày bắt đầu hiệu lực:</span>
            </span>
            <span className="font-mono text-foreground font-medium">
              {formatDateVN(record.contractStartDate)}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ngày hết hạn hợp đồng:</span>
            </span>
            <span className="font-mono text-foreground font-medium">
              {formatDateVN(record.contractEndDate, "Vô thời hạn")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
