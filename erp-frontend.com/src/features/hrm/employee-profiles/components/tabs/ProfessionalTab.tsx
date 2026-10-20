import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EmployeeRecord } from "../../types/employee-profile.types.ts"

interface ProfessionalTabProps {
  record: EmployeeRecord
}

function renderValue(val?: string | null) {
  if (!val || !val.trim()) {
    return <span className="text-muted-foreground italic">Chưa cập nhật</span>
  }
  return <span className="font-medium text-foreground">{val}</span>
}

export function ProfessionalTab({ record }: ProfessionalTabProps) {
  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold">Trình độ & Chuyên môn đào tạo</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-md bg-muted/40 border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">Trình độ đào tạo:</span>
              <div className="text-base">{renderValue(record.qualification)}</div>
            </div>
            <div className="p-3 rounded-md bg-muted/40 border border-border/40">
              <span className="text-xs text-muted-foreground block mb-1">Chuyên ngành đào tạo:</span>
              <div className="text-base">{renderValue(record.specialty)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
