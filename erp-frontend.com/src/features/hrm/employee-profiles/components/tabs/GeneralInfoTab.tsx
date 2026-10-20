import React from "react"
import { Calendar, Mail, MapPin, Phone, ShieldCheck, User } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EmployeeRecord } from "../../types/employee-profile.types.ts"
import { formatDateVN } from "../../utils/date-format.ts"

interface GeneralInfoTabProps {
  record: EmployeeRecord
}

function renderValue(val?: string | null) {
  if (!val || !val.trim()) {
    return <span className="text-muted-foreground italic">Chưa cập nhật</span>
  }
  return <span className="font-medium text-foreground">{val}</span>
}

function formatGender(gender?: string) {
  if (gender === "male") return "Nam"
  if (gender === "female") return "Nữ"
  if (gender === "other") return "Khác"
  return renderValue(gender)
}

export function GeneralInfoTab({ record }: GeneralInfoTabProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* 1. Thông tin cá nhân */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-primary" />
            <span>Thông tin nhân thân & Lý lịch</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Mã định danh cán bộ:</span>
            <span className="font-semibold text-primary font-mono">{record.employeeCode}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Họ và tên khai sinh:</span>
            <span className="font-semibold text-foreground text-sm">{record.fullName}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ngày sinh:</span>
            </span>
            <span className="font-medium text-foreground font-mono">{formatDateVN(record.dateOfBirth)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Giới tính:</span>
            <span className="font-medium text-foreground">{formatGender(record.gender)}</span>
          </div>
          <div className="flex justify-between items-start py-1.5">
            <span className="text-muted-foreground shrink-0 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Địa chỉ thường trú:</span>
            </span>
            <div className="text-right max-w-xs">{renderValue(record.address)}</div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Thông tin liên hệ & Tài khoản hệ thống */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="py-3.5 px-5 bg-muted/30 border-b border-border/60">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Liên hệ & Tài khoản hệ thống</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Email công vụ:</span>
            </span>
            <span className="font-medium text-foreground">{record.email}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Số điện thoại:</span>
            </span>
            <span className="font-mono text-foreground font-medium">{renderValue(record.phone)}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Trạng thái tài khoản:</span>
            <span className={record.accountActive ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
              {record.accountActive ? "Đang hoạt động" : "Đã khóa truy cập"}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-border/40">
            <span className="text-muted-foreground">Vai trò phân quyền:</span>
            <span className="font-medium text-foreground uppercase px-2 py-0.5 rounded bg-muted font-mono text-[11px]">
              {record.role || "staff"}
            </span>
          </div>
          <div className="flex justify-between items-center py-1.5">
            <span className="text-muted-foreground">Ngày khởi tạo hồ sơ:</span>
            <span className="font-mono text-foreground">{formatDateVN(record.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
