import React, { useMemo, useState } from "react"
import {
  Award,
  Briefcase,
  Check,
  Compass,
  Copy,
  Edit3,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import type { ExpertProfileRecord } from "../types/hrm-expert.types"
import { exportExpertsToExcel } from "../utils/expert-export"
import { DEGREE_LABELS } from "../utils/expert-search"

interface ExpertListTabProps {
  experts: ExpertProfileRecord[]
  onOpenCreate: () => void
  onOpenEdit: (expert: ExpertProfileRecord) => void
  onOpenDetail: (expert: ExpertProfileRecord) => void
  onDelete: (id: string) => void
}

export function ExpertListTab({
  experts,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
}: ExpertListTabProps) {
  const [keyword, setKeyword] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [degreeFilter, setDegreeFilter] = useState("all")

  // Thống kê 4 ERP Metric Cards
  const stats = useMemo(() => {
    const total = experts.length
    const expOver10 = experts.filter((e) => e.yearsOfExperience >= 10).length
    const fieldworkReady = experts.filter((e) => e.fieldworkReadiness).length
    const projectLeads = experts.filter((e) =>
      e.projects.some((p) => p.role === "lead")
    ).length
    return { total, expOver10, fieldworkReady, projectLeads }
  }, [experts])

  // Lấy danh sách chuyên ngành xuất hiện
  const specialties = useMemo(() => {
    const set = new Set<string>()
    experts.forEach((e) => {
      if (e.primarySpecialty) set.add(e.primarySpecialty)
    })
    return Array.from(set)
  }, [experts])

  // Lọc dữ liệu
  const filteredExperts = useMemo(() => {
    return experts.filter((e) => {
      const matchKeyword =
        !keyword.trim() ||
        e.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(keyword.toLowerCase()) ||
        e.department.toLowerCase().includes(keyword.toLowerCase()) ||
        e.primarySpecialty.toLowerCase().includes(keyword.toLowerCase())

      const matchSpec =
        specialtyFilter === "all" || e.primarySpecialty === specialtyFilter

      const matchDegree =
        degreeFilter === "all" || e.academicDegree === degreeFilter

      return matchKeyword && matchSpec && matchDegree
    })
  }, [experts, keyword, specialtyFilter, degreeFilter])

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã cán bộ: ${code}`)
  }

  return (
    <div className="space-y-4">
      {/* 1. Bốn thẻ chỉ số ERP Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tổng số chuyên gia
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {stats.total} cán bộ
              </div>
              <div className="text-[11px] text-muted-foreground">
                Được lập hồ sơ năng lực chuyên môn
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Kinh nghiệm ≥ 10 năm
              </span>
              <div className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
                {stats.expOver10} chuyên gia
              </div>
              <div className="text-[11px] text-muted-foreground">
                Lực lượng nòng cốt kỹ thuật
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Đã từng làm Chủ nhiệm
              </span>
              <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
                {stats.projectLeads} chuyên gia
              </div>
              <div className="text-[11px] text-muted-foreground">
                Có năng lực điều hành đề án lớn
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Briefcase className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Sẵn sàng thực địa dã ngoại
              </span>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.fieldworkReady} chuyên gia
              </div>
              <div className="text-[11px] text-muted-foreground">
                Đáp ứng khảo sát hiện trường
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Thanh lọc & Hành động */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, mã cán bộ, chuyên ngành..."
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <div className="w-52">
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả chuyên ngành" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả chuyên ngành</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-40">
            <Select value={degreeFilter} onValueChange={setDegreeFilter}>
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả học vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tất cả học vị</SelectItem>
                <SelectItem value="tien_si" className="text-xs">Tiến sĩ</SelectItem>
                <SelectItem value="thac_si" className="text-xs">Thạc sĩ</SelectItem>
                <SelectItem value="ky_su" className="text-xs">Kỹ sư</SelectItem>
                <SelectItem value="cu_nhan" className="text-xs">Cử nhân</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportExpertsToExcel(filteredExperts)}
            className="h-8.5 text-xs gap-1.5"
            title="Xuất danh sách ra Excel"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8.5 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm hồ sơ chuyên gia</span>
          </Button>
        </div>
      </div>

      {/* 3. Data Grid Mật độ cao sử dụng PaginatedDataTable chuẩn */}
      <PaginatedDataTable
        data={filteredExperts}
        columns={[
          {
            key: "stt",
            header: "STT",
            headClassName: "w-12 text-center font-bold text-foreground",
            cellClassName: "text-center font-medium text-muted-foreground",
            render: (_item, rowIndex) => rowIndex + 1,
          },
          {
            key: "employeeCode",
            header: "Mã CB",
            headClassName: "w-28 font-bold text-foreground sticky left-0 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "sticky left-0 z-10 bg-card group-hover:bg-muted/30 transition-colors font-mono font-semibold text-foreground",
            render: (expert) => (
              <div className="flex items-center gap-1 group">
                <span className="font-mono font-semibold text-foreground">
                  {expert.employeeCode}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(expert.employeeCode, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                  title="Sao chép mã"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            ),
          },
          {
            key: "fullName",
            header: "Họ và tên",
            headClassName: "min-w-[160px] font-bold text-foreground sticky left-28 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "sticky left-28 z-10 bg-card group-hover:bg-muted/30 transition-colors font-medium",
            render: (expert) => (
              <button
                type="button"
                onClick={() => onOpenDetail(expert)}
                className="text-left font-semibold hover:text-primary hover:underline transition-colors truncate max-w-[150px]"
                title="Xem chi tiết CV"
              >
                {expert.fullName}
              </button>
            ),
          },
          {
            key: "department",
            header: "Đơn vị công tác",
            headClassName: "min-w-[140px] font-semibold text-foreground",
            cellClassName: "text-muted-foreground truncate max-w-[140px]",
            render: (expert) => expert.department,
          },
          {
            key: "primarySpecialty",
            header: "Chuyên ngành chính",
            headClassName: "min-w-[170px] font-semibold text-foreground",
            cellClassName: "font-medium text-foreground",
            render: (expert) => expert.primarySpecialty,
          },
          {
            key: "academicDegree",
            header: "Học vị",
            headClassName: "w-24 font-semibold text-center text-foreground",
            cellClassName: "text-center",
            render: (expert) => (
              <Badge variant="outline" className="text-[10px] bg-muted/50">
                {DEGREE_LABELS[expert.academicDegree] || expert.academicDegree}
              </Badge>
            ),
          },
          {
            key: "yearsOfExperience",
            header: "Thâm niên",
            headClassName: "w-24 font-semibold text-center text-foreground",
            cellClassName: "text-center font-mono font-medium",
            render: (expert) => `${expert.yearsOfExperience} năm`,
          },
          {
            key: "projectLeads",
            header: "Đề án (Chủ nhiệm)",
            headClassName: "min-w-[120px] font-semibold text-center text-foreground",
            cellClassName: "text-center",
            render: (expert) => {
              const leadCount = expert.projects.filter((p) => p.role === "lead").length
              return (
                <div>
                  <span className="font-semibold text-foreground">{expert.projects.length}</span>
                  {leadCount > 0 && (
                    <span className="text-primary font-bold ml-1" title="Số đề án làm Chủ nhiệm">
                      ({leadCount} CN)
                    </span>
                  )}
                </div>
              )
            },
          },
          {
            key: "certificates",
            header: "Chứng chỉ",
            headClassName: "min-w-[100px] font-semibold text-center text-foreground",
            cellClassName: "text-center",
            render: (expert) => (
              <Badge
                variant="secondary"
                className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
              >
                {expert.certificates.length} chứng chỉ
              </Badge>
            ),
          },
          {
            key: "fieldworkReadiness",
            header: "Thực địa",
            headClassName: "w-24 font-semibold text-center text-foreground",
            cellClassName: "text-center",
            render: (expert) => (
              <Badge
                variant="outline"
                className={
                  expert.fieldworkReadiness
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 text-[10px]"
                    : "bg-slate-100 text-slate-600 border-slate-300 text-[10px]"
                }
              >
                {expert.fieldworkReadiness ? "Sẵn sàng" : "Không"}
              </Badge>
            ),
          },
          {
            key: "ratingScore",
            header: "Đánh giá",
            headClassName: "w-24 font-semibold text-center text-foreground",
            cellClassName: "text-center",
            render: (expert) => (
              <div className="flex items-center justify-center gap-0.5 text-amber-500 font-mono font-bold">
                <Star className="h-3 w-3 fill-amber-500" />
                <span>{expert.ratingScore.toFixed(1)}</span>
              </div>
            ),
          },
          {
            key: "actions",
            header: "Thao tác",
            headClassName: "w-28 text-center font-bold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "text-center sticky right-0 z-10 bg-card group-hover:bg-muted/30 transition-colors",
            render: (expert) => (
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenDetail(expert)}
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                  title="Xem chi tiết CV"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenEdit(expert)}
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(expert.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  title="Xóa hồ sơ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          },
        ]}
        rowKey={(row) => row.id}
        defaultPageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        minTableWidth="1300px"
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="7rem"
      />
    </div>
  )
}
