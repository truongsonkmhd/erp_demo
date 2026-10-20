import { useEffect, useState, useMemo } from "react"
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  DollarSign,
  Search,
  Building2,
  Zap,
  Database,
  PieChart,
  Calendar,
  RotateCcw,
  Filter,
  Eye,
  HeartHandshake,
  MoreVertical,
  UserPlus,
  UserCheck,
  RefreshCw,
} from "lucide-react"
import { useProjects } from "@/hooks/project/useProjects"
import { getAllCustomerCareRecords } from "@/services/CustomerCareService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { ActionButton } from "@/components/ui/action-button"
import { CARE_PROGRESS_OPTIONS } from "@/constants/customerCare"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { YearPicker } from "@/components/ui/year-picker"
import { MonthPicker } from "@/components/ui/month-picker"
import CustomerCarePage from "@/views/pages/CustomerCarePage"
import CustomerReorderAnalytics from "@/components/dashboard/CustomerReorderAnalytics"
import CustomerBusinessResults from "@/components/dashboard/CustomerBusinessResults"
import { CustomerCare } from "@/types/customerCare"
import { Project } from "@/types/project"
import { useLocale } from "@/i18n/LocaleContext"

const DEFAULT_SALES_PEOPLE = [
  "Nguyễn Văn A (Sales Logistics)",
  "Trần Thị B (Sales Freight)",
  "Phạm Văn C (Sales CSKH)",
  "Lê Văn D (Sales Marketing)",
  "Hoàng Thị E (Sales Khách Hàng)",
]
const ASSIGNMENTS_KEY = "hoangminh_project_assignments"

type SaleAssignment = { manager: string; status: "pending" | "assigned" }
type DateFilterType = "all" | "day" | "week" | "month" | "year"

function toIsoWeekValue(dateStr: string) {
  const date = new Date(`${dateStr.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ""
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

function currentIsoWeekValue() {
  return toIsoWeekValue(new Date().toISOString().slice(0, 10))
}

function ProcessedDataDetailModal({
  open,
  onOpenChange,
  projects,
  careRecords,
  activeFilterLabel,
  initialProgressFilter = "all",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  careRecords: CustomerCare[]
  activeFilterLabel: string
  initialProgressFilter?: string
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProgressFilter, setSelectedProgressFilter] = useState<string>(initialProgressFilter)
  const [selectedProjectForCare, setSelectedProjectForCare] = useState<Project | null>(null)
  const [assigningProject, setAssigningProject] = useState<Project | null>(null)
  const [selectedSaleName, setSelectedSaleName] = useState("")
  const [customSaleName, setCustomSaleName] = useState("")
  const [assignments, setAssignments] = useState<Record<string, SaleAssignment>>(() => {
    try {
      const saved = localStorage.getItem(ASSIGNMENTS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const saveAssignments = (next: Record<string, SaleAssignment>) => {
    setAssignments(next)
    try {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const handleOpenAssignDialog = (project: Project) => {
    const currentAssign = assignments[project.id]
    const initialSale = currentAssign?.manager || project.manager || DEFAULT_SALES_PEOPLE[0]
    setAssigningProject(project)
    if (DEFAULT_SALES_PEOPLE.includes(initialSale)) {
      setSelectedSaleName(initialSale)
      setCustomSaleName("")
    } else {
      setSelectedSaleName("custom")
      setCustomSaleName(initialSale)
    }
  }

  const handleConfirmGiaoXong = () => {
    if (!assigningProject) return
    const finalSale = selectedSaleName === "custom" ? customSaleName.trim() : selectedSaleName
    if (!finalSale) {
      appToast.error("Lỗi", "Vui lòng chọn hoặc nhập tên nhân viên sale!")
      return
    }
    saveAssignments({
      ...assignments,
      [assigningProject.id]: { manager: finalSale, status: "pending" },
    })
    appToast.success("Giao việc thành công!", `Đã giao cho "${finalSale}". Trạng thái: Pending (chờ nhận).`)
    setAssigningProject(null)
  }

  const handleConfirmAssignment = (project: Project) => {
    const currentAssign = assignments[project.id]
    const currentManager = currentAssign?.manager || project.manager || DEFAULT_SALES_PEOPLE[0]
    saveAssignments({
      ...assignments,
      [project.id]: { manager: currentManager, status: "assigned" },
    })
    appToast.success("Xác nhận thành công", `${currentManager} đã nhận việc.`)
  }

  useEffect(() => {
    if (open) {
      setSelectedProgressFilter(initialProgressFilter)
      setSearchTerm("")
    }
  }, [open, initialProgressFilter])

  const latestCareMap = useMemo(() => {
    const map = new Map<string, CustomerCare>()
    careRecords.forEach((record) => {
      if (!record.projectId) return
      const existing = map.get(record.projectId)
      if (!existing || (record.updatedAt && record.updatedAt > (existing.updatedAt || ""))) {
        map.set(record.projectId, record)
      }
    })
    return map
  }, [careRecords])

  const projectItems = useMemo(() => {
    return projects.map((p) => {
      const careRecord = latestCareMap.get(p.id)
      const careProgress = careRecord?.careProgress || p.careProgress || ""
      const hasCare = Boolean(careProgress)
      const careNote = careRecord?.careProgressNote || p.careProgressNote || ""
      const updatedAt = careRecord?.updatedAt || p.createdAt || p.startDate || ""

      return {
        project: p,
        hasCare,
        careProgress,
        careNote,
        updatedAt,
      }
    })
  }, [projects, latestCareMap])

  const filteredItems = useMemo(() => {
    return projectItems.filter((item) => {
      const query = searchTerm.toLowerCase().trim()
      if (query) {
        const matchName = item.project.name?.toLowerCase().includes(query)
        const matchPhone = item.project.phone?.toLowerCase().includes(query)
        const matchManager = item.project.manager?.toLowerCase().includes(query)
        if (!matchName && !matchPhone && !matchManager) return false
      }

      if (selectedProgressFilter === "has_care") {
        if (!item.hasCare) return false
      } else if (selectedProgressFilter === "no_care") {
        if (item.hasCare) return false
      } else if (selectedProgressFilter !== "all") {
        if (item.careProgress !== selectedProgressFilter) return false
      }

      return true
    })
  }, [projectItems, searchTerm, selectedProgressFilter])

  const totalCount = projectItems.length
  const processedCount = projectItems.filter((i) => i.hasCare).length
  const unprocessedCount = totalCount - processedCount

  const [previewRecord, setPreviewRecord] = useState<(typeof filteredItems)[number] | null>(null)

  const columns: DataTableColumn<(typeof filteredItems)[number]>[] = [
    { key: "index", header: "STT", headClassName: "w-14 min-w-14 text-center", cellClassName: "w-14 min-w-14 text-center", render: (_, index) => index + 1 },
    { key: "name", header: "Họ và tên", headClassName: "min-w-36", cellClassName: "font-medium", render: (item) => item.project.name || "—" },
    { key: "phone", header: "Điện thoại", headClassName: "min-w-28", render: (item) => item.project.phone || "—" },
    { key: "category", header: "Ngành hàng", headClassName: "min-w-32", render: (item) => item.project.category || "—" },
    { key: "note", header: "Ghi chú CSKH", headClassName: "min-w-40", cellClassName: "max-w-xs break-words text-slate-700 font-normal", render: (item) => item.careNote || "—" },
    {
      key: "progress",
      header: "Tiến trình CSKH",
      headClassName: "min-w-44",
      render: (item) => {
        if (!item.hasCare) {
          return <Badge variant="outline" className="font-semibold text-muted-foreground">Chưa có CSKH</Badge>
        }
        const isReject = item.careProgress.includes("L1.4") || item.careProgress.includes("C3A")
        const isWin = item.careProgress.includes("L4") || item.careProgress.includes("L5") || item.careProgress.includes("L6") || item.careProgress.includes("L7")
        return (
          <Badge
            className={
              isReject
                ? "bg-red-600 text-white hover:bg-red-600"
                : isWin
                  ? "bg-emerald-600 text-white hover:bg-emerald-600"
                  : "bg-primary text-primary-foreground"
            }
          >
            {item.careProgress}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      header: "Hành động",
      headClassName: "w-20 min-w-20 text-center",
      cellClassName: "w-20 min-w-20 text-center",
      render: (item) => (
        <Button
          type="button"
          aria-label="Xem chi tiết"
          title="Xem chi tiết"
          variant="ghost"
          size="icon"
          onClick={() => setPreviewRecord(item)}
          className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] w-[94vw] max-w-6xl flex-col overflow-hidden p-6">
          <DialogHeader className="shrink-0 space-y-3 pb-4 pr-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">Tiến trình CSKH</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Danh sách khách hàng {activeFilterLabel}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 mr-8">
                <Badge variant="outline">Tổng: {totalCount}</Badge>
                <Badge className="bg-primary text-primary-foreground hover:bg-primary">Đã CSKH: {processedCount}</Badge>
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">Chưa xử lý: {unprocessedCount}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Họ tên, điện thoại, người phụ trách..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white pl-9"
                />
              </div>
              <div className="flex w-full items-center gap-2 sm:w-80">
                <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Select value={selectedProgressFilter} onValueChange={setSelectedProgressFilter}>
                  <SelectTrigger className="h-10 w-full bg-white text-sm">
                    <SelectValue placeholder="Chọn tiến trình CSKH" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 overflow-y-auto z-[100]">
                    <SelectItem value="all">Tất cả tiến trình ({totalCount})</SelectItem>
                    <SelectItem value="has_care">Đã có CSKH ({processedCount})</SelectItem>
                    <SelectItem value="no_care">Chưa xử lý ({unprocessedCount})</SelectItem>
                    {CARE_PROGRESS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-auto">
            <PaginatedDataTable
              data={filteredItems}
              columns={columns}
              rowKey={(item) => item.project.id}
              emptyMessage="Không tồn tại bản ghi"
              defaultPageSize={10}
              pageSizeOptions={[10, 20, 50]}
              minTableWidth="100%"
              bordered={false}
              stickyFirstColumn
              stickyLastColumn
              stickyLastColumnCount={1}
            />
          </div>

          <DialogFooter className="shrink-0 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewRecord)} onOpenChange={(openState) => !openState && setPreviewRecord(null)}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-extrabold text-slate-900">Chi tiết chăm sóc khách hàng</DialogTitle>
          </DialogHeader>
          {previewRecord && (
            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Khách hàng</p>
                <p className="text-sm font-bold text-slate-900">{previewRecord.project.name || "—"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Tiến trình chăm sóc</p>
                <p className="text-sm font-bold text-slate-900">
                  {previewRecord.careProgress || "Chưa có CSKH"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Ghi chú chăm sóc</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-slate-800 font-medium min-h-[50px] whitespace-pre-wrap">
                  {previewRecord.careNote || "—"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Ngày tạo</p>
                  <p className="font-semibold text-slate-800">
                    {previewRecord.updatedAt
                      ? new Date(previewRecord.updatedAt).toLocaleString("vi-VN")
                      : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Cập nhật lần cuối</p>
                  <p className="font-semibold text-slate-800">
                    {previewRecord.updatedAt
                      ? new Date(previewRecord.updatedAt).toLocaleString("vi-VN")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setPreviewRecord(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assigningProject)} onOpenChange={(openState) => !openState && setAssigningProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <UserPlus className="h-5 w-5 text-blue-600" />
              {assignments[assigningProject?.id || ""]?.manager || assigningProject?.manager
                ? "Đổi người phụ trách"
                : "Phân việc cho ai"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-muted-foreground">Khách hàng / Dự án:</p>
              <p className="text-sm font-bold text-foreground">{assigningProject?.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Chọn nhân viên Sales phụ trách *</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {DEFAULT_SALES_PEOPLE.map((sale) => (
                  <label
                    key={sale}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-xs transition-all ${selectedSaleName === sale
                        ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-900"
                        : "border-border bg-white text-foreground hover:bg-muted/40"
                      }`}
                    onClick={() => setSelectedSaleName(sale)}
                  >
                    <input type="radio" name="saleChoiceDetail" checked={selectedSaleName === sale} onChange={() => setSelectedSaleName(sale)} className="h-4 w-4 accent-blue-600" />
                    <span>{sale}</span>
                  </label>
                ))}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-xs transition-all ${selectedSaleName === "custom"
                      ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-900"
                      : "border-border bg-white text-foreground hover:bg-muted/40"
                    }`}
                  onClick={() => setSelectedSaleName("custom")}
                >
                  <input type="radio" name="saleChoiceDetail" checked={selectedSaleName === "custom"} onChange={() => setSelectedSaleName("custom")} className="h-4 w-4 accent-blue-600" />
                  <span>Nhân viên khác...</span>
                </label>
                {selectedSaleName === "custom" && (
                  <Input value={customSaleName} onChange={(e) => setCustomSaleName(e.target.value)} placeholder="Nhập tên nhân viên sales..." className="bg-white" autoFocus />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAssigningProject(null)}>Hủy</Button>
            <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleConfirmGiaoXong}>
              <UserCheck className="mr-1.5 h-4 w-4" />
              Giao xong
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedProjectForCare)} onOpenChange={(openState) => !openState && setSelectedProjectForCare(null)}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] w-[94vw] max-w-6xl flex-col overflow-hidden p-0">
          <div className="h-full min-h-0 w-full min-w-0 overflow-hidden px-6 pb-6 pt-10">
            {selectedProjectForCare && (
              <CustomerCarePage
                projectId={selectedProjectForCare.id}
                customerName={selectedProjectForCare.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProcessedDataPieChart({
  processed,
  total,
  percent,
  filterType,
  setFilterType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  fromMonth,
  setFromMonth,
  toMonth,
  setToMonth,
  fromWeek,
  setFromWeek,
  toWeek,
  setToWeek,
  selectedYear,
  setSelectedYear,
  onReset,
  onOpenDetail,
}: {
  processed: number
  total: number
  percent: number
  filterType: DateFilterType
  setFilterType: (type: DateFilterType) => void
  fromDate: string
  setFromDate: (v: string) => void
  toDate: string
  setToDate: (v: string) => void
  fromMonth: string
  setFromMonth: (v: string) => void
  toMonth: string
  setToMonth: (v: string) => void
  fromWeek: string
  setFromWeek: (v: string) => void
  toWeek: string
  setToWeek: (v: string) => void
  selectedYear: string
  setSelectedYear: (v: string) => void
  onReset: () => void
  onOpenDetail?: (initialFilter?: string) => void
}) {
  const { t } = useLocale()
  const unprocessed = Math.max(0, total - processed)

  const activeFilterLabel = useMemo(() => {
    if (filterType === "day") {
      if (fromDate && toDate) return `(${fromDate} → ${toDate})`
      if (fromDate) return `(Từ ${fromDate})`
      if (toDate) return `(Đến ${toDate})`
      return "(Theo ngày)"
    }
    if (filterType === "week") {
      if (fromWeek && toWeek) return `(${fromWeek} → ${toWeek})`
      if (fromWeek) return `(Từ ${fromWeek})`
      if (toWeek) return `(Đến ${toWeek})`
      return "(Theo tuần)"
    }
    if (filterType === "month") {
      if (fromMonth && toMonth) return `(${fromMonth} → ${toMonth})`
      if (fromMonth && !toMonth) return `(Từ ${fromMonth} → nay)`
      if (toMonth) return `(Đến ${toMonth})`
      return "(Theo tháng)"
    }
    if (filterType === "year") {
      return `(Năm ${selectedYear})`
    }
    return ""
  }, [filterType, fromDate, toDate, fromWeek, toWeek, fromMonth, toMonth, selectedYear])

  const handleSelectToday = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const todayStr = `${yyyy}-${mm}-${dd}`
    setFilterType("day")
    setFromDate(todayStr)
    setToDate(todayStr)
  }

  const handleSelectThisWeek = () => {
    const week = currentIsoWeekValue()
    setFilterType("week")
    setFromWeek(week)
    setToWeek(week)
  }

  const handleSelectThisMonth = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    setFilterType("month")
    setFromMonth(`${yyyy}-${mm}`)
    setToMonth(`${yyyy}-${mm}`)
  }

  const handleSelectThisYear = () => {
    const now = new Date()
    setFilterType("year")
    setSelectedYear(now.getFullYear().toString())
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
      <CardHeader className="space-y-4 border-b border-border bg-muted/40 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-foreground">{t("dashboard.processedDataTitle")}</CardTitle>
        
          </div>
          <ActionButton icon={<HeartHandshake className="h-4 w-4" />} onClick={() => onOpenDetail?.("all")}>
            {t("dashboard.careProgress")}
          </ActionButton>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all" as const, label: t("common.all") },
            { id: "day" as const, label: t("common.byDay") },
            { id: "week" as const, label: t("common.byWeek") },
            { id: "month" as const, label: t("common.byMonth") },
            { id: "year" as const, label: t("common.byYear") },
          ].map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filterType === item.id ? "default" : "outline"}
              className={filterType === item.id ? "bg-brand-blue text-white hover:bg-brand-blue-hover" : "bg-background text-foreground"}
              onClick={() => setFilterType(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <span className="hidden h-5 w-px bg-border sm:block" />
          <Button type="button" size="sm" variant="ghost" onClick={handleSelectToday}>{t("common.today")}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleSelectThisWeek}>{t("common.thisWeek")}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleSelectThisMonth}>{t("common.thisMonth")}</Button>
          {filterType !== "all" && (
            <Button type="button" size="sm" variant="ghost" onClick={onReset}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {t("common.clearFilter")}
            </Button>
          )}
        </div>
        {filterType === "day" && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Label className="text-muted-foreground">{t("common.from")}</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-auto bg-background" />
            <Label className="text-muted-foreground">{t("common.to")}</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-auto bg-background" />
          </div>
        )}
        {filterType === "week" && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Label className="text-muted-foreground">{t("common.fromWeek")}</Label>
            <Input type="week" value={fromWeek} onChange={(e) => setFromWeek(e.target.value)} className="h-9 w-auto bg-background" />
            <Label className="text-muted-foreground">{t("common.toWeek")}</Label>
            <Input type="week" value={toWeek} onChange={(e) => setToWeek(e.target.value)} className="h-9 w-auto bg-background" />
          </div>
        )}
        {filterType === "month" && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Label className="text-muted-foreground">{t("common.from")}</Label>
            <MonthPicker value={fromMonth} onChange={setFromMonth} display="long" placeholder={t("common.selectMonth")} />
            <Label className="text-muted-foreground">{t("common.to")}</Label>
            <MonthPicker
              value={toMonth}
              onChange={setToMonth}
              display="long"
              placeholder="MM/yyyy"
              emptyLabel={t("common.untilNow")}
            />
          </div>
        )}
        {filterType === "year" && (
          <div className="flex items-center gap-3 text-sm">
            <Label className="text-muted-foreground">{t("common.year")}</Label>
            <YearPicker
              value={Number(selectedYear)}
              onChange={(year) => setSelectedYear(String(year))}
              minYear={2000}
              maxYear={new Date().getFullYear() + 10}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">{t("dashboard.completionRate")}</span>
          <span className="text-lg font-extrabold text-foreground">{percent}%</span>
        </div>
        <Progress value={percent} className="h-3 bg-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button type="button" className="rounded-2xl border border-border bg-muted/40 p-4 text-left transition hover:border-brand-blue/40 hover:bg-muted" onClick={() => onOpenDetail?.("all")}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("dashboard.totalData")}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{total}</p>
          </button>
          <button type="button" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left transition hover:bg-emerald-500/15" onClick={() => onOpenDetail?.("has_care")}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{t("dashboard.cared")}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{processed}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("common.percentOfTotal", { percent })}</p>
          </button>
          <button type="button" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left transition hover:bg-amber-500/15" onClick={() => onOpenDetail?.("no_care")}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">{t("dashboard.unprocessed")}</p>
            <p className="mt-1 text-2xl font-extrabold text-foreground">{unprocessed}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("common.percentOfTotal", { percent: Math.max(0, 100 - percent) })}</p>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export interface TeamMemberStat {
  id: string
  name: string
  role: string
  department: string
  avatar?: string
  assignedProjects: number
  completedTasks: number
  totalTasks: number
  onTimeRate: number // percentage
  netProfitVnd: number // VNĐ
  issueCount: number // vướng mắc
  status: "active" | "busy" | "leave"
  phone: string
  email: string
}

const MOCK_MEMBER_STATS: TeamMemberStat[] = [
  {
    id: "mem-1",
    name: "Nguyễn Văn A",
    role: "Trưởng nhóm Sales",
    department: "Phòng Marketing & Sales",
    assignedProjects: 6,
    completedTasks: 14,
    totalTasks: 15,
    onTimeRate: 93,
    netProfitVnd: 185000000,
    issueCount: 0,
    status: "active",
    phone: "0987654321",
    email: "nguyenvana@hoangminh.vn",
  },
  {
    id: "mem-2",
    name: "Trần Thị B",
    role: "Chuyên viên CSKH",
    department: "Phòng CSKH & Đối Tác",
    assignedProjects: 5,
    completedTasks: 10,
    totalTasks: 12,
    onTimeRate: 83,
    netProfitVnd: 120000000,
    issueCount: 2,
    status: "busy",
    phone: "0912345678",
    email: "tranthib@hoangminh.vn",
  },
  {
    id: "mem-3",
    name: "Phạm Văn C",
    role: "Điều xe & Vận tải",
    department: "Đội ngũ Logistics & Vận tải",
    assignedProjects: 8,
    completedTasks: 18,
    totalTasks: 18,
    onTimeRate: 100,
    netProfitVnd: 95000000,
    issueCount: 0,
    status: "active",
    phone: "0909123456",
    email: "phamvanc@hoangminh.vn",
  },
  {
    id: "mem-4",
    name: "Lê Văn D",
    role: "Khai thác Chứng từ",
    department: "Đội ngũ Logistics & Vận tải",
    assignedProjects: 4,
    completedTasks: 8,
    totalTasks: 10,
    onTimeRate: 80,
    netProfitVnd: 60000000,
    issueCount: 1,
    status: "active",
    phone: "0933445566",
    email: "levand@hoangminh.vn",
  },
  {
    id: "mem-5",
    name: "Hoàng Thị E",
    role: "Chuyên viên Sales",
    department: "Phòng Marketing & Sales",
    assignedProjects: 7,
    completedTasks: 12,
    totalTasks: 14,
    onTimeRate: 85,
    netProfitVnd: 140000000,
    issueCount: 0,
    status: "active",
    phone: "0977889900",
    email: "hoangthie@hoangminh.vn",
  },
  {
    id: "mem-6",
    name: "Vũ Minh F",
    role: "Quản lý Giao nhận",
    department: "Đội ngũ Logistics & Vận tải",
    assignedProjects: 5,
    completedTasks: 9,
    totalTasks: 11,
    onTimeRate: 81,
    netProfitVnd: 75000000,
    issueCount: 1,
    status: "leave",
    phone: "0911223344",
    email: "vuminhf@hoangminh.vn",
  },
]

export function TeamStatistics() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const [filterType, setFilterType] = useState<DateFilterType>("all")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [fromWeek, setFromWeek] = useState<string>("")
  const [toWeek, setToWeek] = useState<string>("")
  const [fromMonth, setFromMonth] = useState<string>("")
  const [toMonth, setToMonth] = useState<string>("")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const { projects: marketingProjects } = useProjects()
  const [careProjectIds, setCareProjectIds] = useState<Set<string>>(new Set())
  const [allCareRecords, setAllCareRecords] = useState<CustomerCare[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [initialProgressFilter, setInitialProgressFilter] = useState("all")

  const handleOpenDetailModal = (filterInitial: string = "all") => {
    setInitialProgressFilter(filterInitial)
    setDetailModalOpen(true)
  }

  useEffect(() => {
    let active = true
    void getAllCustomerCareRecords().then((records) => {
      if (!active) return
      setAllCareRecords(records)
      setCareProjectIds(new Set(records.map((item) => item.projectId).filter(Boolean)))
    })
    return () => {
      active = false
    }
  }, [])

  // Filter projects by Day, Month, or Year
  const filteredProjectsByDate = useMemo(() => {
    return marketingProjects.filter((project) => {
      const pDateStr = project.createdAt || project.startDate || "2026-08-15"
      const pDate = pDateStr.slice(0, 10) // 'YYYY-MM-DD'
      const pMonth = pDateStr.slice(0, 7) // 'YYYY-MM'
      const pYear = pDateStr.slice(0, 4) // 'YYYY'

      if (filterType === "day") {
        if (fromDate && pDate < fromDate) return false
        if (toDate && pDate > toDate) return false
      } else if (filterType === "week") {
        const pWeek = toIsoWeekValue(pDate)
        if (fromWeek && pWeek < fromWeek) return false
        if (toWeek && pWeek > toWeek) return false
      } else if (filterType === "month") {
        if (fromMonth && pMonth < fromMonth) return false
        if (toMonth && pMonth > toMonth) return false
      } else if (filterType === "year") {
        if (selectedYear && pYear !== selectedYear) return false
      }
      return true
    })
  }, [marketingProjects, filterType, fromDate, toDate, fromWeek, toWeek, fromMonth, toMonth, selectedYear])

  const marketingProcessed = useMemo(() => {
    const total = filteredProjectsByDate.length
    const processed = filteredProjectsByDate.filter((project) => careProjectIds.has(project.id)).length
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0
    return { total, processed, percent }
  }, [filteredProjectsByDate, careProjectIds])

  const handleResetDateFilter = () => {
    setFilterType("all")
    setFromDate("")
    setToDate("")
    setFromWeek("")
    setToWeek("")
    setFromMonth("")
    setToMonth("")
    setSelectedYear(new Date().getFullYear().toString())
  }

  // Departments list for filtering
  const departments = useMemo(() => {
    const set = new Set(MOCK_MEMBER_STATS.map((m) => m.department))
    return ["all", ...Array.from(set)]
  }, [])

  // Filtered members
  const filteredMembers = useMemo(() => {
    return MOCK_MEMBER_STATS.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchDept = selectedDept === "all" || m.department === selectedDept
      return matchSearch && matchDept
    })
  }, [searchTerm, selectedDept])

  // Overall Statistics Calculations
  const statsOverview = useMemo(() => {
    const totalMembers = MOCK_MEMBER_STATS.length
    const activeMembers = MOCK_MEMBER_STATS.filter((m) => m.status === "active").length
    const totalProjects = MOCK_MEMBER_STATS.reduce((acc, m) => acc + m.assignedProjects, 0)
    const totalTasks = MOCK_MEMBER_STATS.reduce((acc, m) => acc + m.totalTasks, 0)
    const completedTasks = MOCK_MEMBER_STATS.reduce((acc, m) => acc + m.completedTasks, 0)
    const totalIssues = MOCK_MEMBER_STATS.reduce((acc, m) => acc + m.issueCount, 0)
    const totalNetProfit = MOCK_MEMBER_STATS.reduce((acc, m) => acc + m.netProfitVnd, 0)
    const avgOnTime = Math.round(
      MOCK_MEMBER_STATS.reduce((acc, m) => acc + m.onTimeRate, 0) / totalMembers
    )

    // Top performer
    const topPerformer = [...MOCK_MEMBER_STATS].sort((a, b) => b.netProfitVnd - a.netProfitVnd)[0]

    // Members with issues
    const membersWithIssues = MOCK_MEMBER_STATS.filter((m) => m.issueCount > 0)

    return {
      totalMembers,
      activeMembers,
      totalProjects,
      totalTasks,
      completedTasks,
      totalIssues,
      totalNetProfit,
      avgOnTime,
      topPerformer,
      membersWithIssues,
    }
  }, [])

  // Department Breakdown
  const deptStats = useMemo(() => {
    const depts = Array.from(new Set(MOCK_MEMBER_STATS.map((m) => m.department)))
    return depts.map((deptName) => {
      const deptMembers = MOCK_MEMBER_STATS.filter((m) => m.department === deptName)
      const memberCount = deptMembers.length
      const totalTasks = deptMembers.reduce((acc, m) => acc + m.totalTasks, 0)
      const completedTasks = deptMembers.reduce((acc, m) => acc + m.completedTasks, 0)
      const profit = deptMembers.reduce((acc, m) => acc + m.netProfitVnd, 0)
      const issues = deptMembers.reduce((acc, m) => acc + m.issueCount, 0)
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        deptName,
        memberCount,
        totalTasks,
        completedTasks,
        profit,
        issues,
        progressPercent,
      }
    })
  }, [])

  return (
    <div className="space-y-8">
      {/* 2. Standalone View: Biểu đồ tròn % Data đã xử lý */}
      <ProcessedDataPieChart
        processed={marketingProcessed.processed}
        total={marketingProcessed.total}
        percent={marketingProcessed.percent}
        filterType={filterType}
        setFilterType={setFilterType}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        fromWeek={fromWeek}
        setFromWeek={setFromWeek}
        toWeek={toWeek}
        setToWeek={setToWeek}
        fromMonth={fromMonth}
        setFromMonth={setFromMonth}
        toMonth={toMonth}
        setToMonth={setToMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        onReset={handleResetDateFilter}
        onOpenDetail={handleOpenDetailModal}
      />

      {/* 3. Customer & Reorder Analytics (Khách hàng Cũ / Mới & Tỷ lệ Tái đặt hàng) */}
      <CustomerReorderAnalytics />

      <CustomerBusinessResults />



      <ProcessedDataDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        projects={filteredProjectsByDate}
        careRecords={allCareRecords}
        activeFilterLabel={
          filterType === "day"
            ? fromDate || toDate
              ? `(Từ ${fromDate || "..."} đến ${toDate || "..."})`
              : "(Theo ngày)"
            : filterType === "week"
              ? fromWeek || toWeek
                ? `(Từ ${fromWeek || "..."} đến ${toWeek || "..."})`
                : "(Theo tuần)"
              : filterType === "month"
                ? fromMonth || toMonth
                  ? `(Từ tháng ${fromMonth || "..."} đến ${toMonth || "..."})`
                  : "(Theo tháng)"
                : filterType === "year"
                  ? `(Năm ${selectedYear})`
                  : "(Tất cả)"
        }
        initialProgressFilter={initialProgressFilter}
      />
    </div>
  )
}
