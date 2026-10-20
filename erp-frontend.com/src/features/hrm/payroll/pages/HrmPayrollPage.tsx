import React, { useMemo, useState } from "react"
import {
  Calendar,
  ChevronDown,
  Copy,
  DollarSign,
  Download,
  Edit3,
  Filter,
  Landmark,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"

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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"

import { AdjustSalaryModal } from "../components/AdjustSalaryModal"
import { CreatePayrollPeriodModal } from "../components/CreatePayrollPeriodModal"
import { PayslipModal } from "../components/PayslipModal"
import { PayrollSettingsModal } from "../components/PayrollSettingsModal"
import { PayrollStatusBadge } from "../components/PayrollStatusBadge"
import { ReviewPayrollModal } from "../components/ReviewPayrollModal"
import { defaultHrmPayrollRepository } from "../repositories/hrm-payroll.storage"
import type {
  PayrollFilterState,
  PayrollItemRecord,
  PayrollPeriodRecord,
} from "../types/hrm-payroll.types"
import { formatVND } from "../utils/payroll-calculator"
import { exportPayrollPeriodToExcel } from "../utils/payroll-export"

export default function HrmPayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriodRecord[]>(() =>
    defaultHrmPayrollRepository.getAllPeriods()
  )
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const all = defaultHrmPayrollRepository.getAllPeriods()
    return all[0]?.id || "PAY-2026-10"
  })

  // Filter state
  const [filters, setFilters] = useState<PayrollFilterState>({
    keyword: "",
    department: "all",
    status: "all",
  })

  // Modal states (100% Popup Modals ở giữa màn hình)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [payslipModalOpen, setPayslipModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PayrollItemRecord | null>(null)

  // Kỳ lương hiện tại đang được chọn
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || periods[0] || null
  }, [periods, selectedPeriodId])

  // Danh sách các phòng ban xuất hiện trong kỳ lương
  const departments = useMemo(() => {
    if (!currentPeriod) return []
    const set = new Set<string>()
    currentPeriod.items.forEach((item) => {
      if (item.department) set.add(item.department)
    })
    return Array.from(set)
  }, [currentPeriod])

  // Dữ liệu lọc theo từ khóa và phòng ban
  const filteredItems = useMemo(() => {
    if (!currentPeriod) return []
    return currentPeriod.items.filter((item) => {
      const matchKeyword =
        !filters.keyword.trim() ||
        item.fullName.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        item.position.toLowerCase().includes(filters.keyword.toLowerCase())

      const matchDept =
        filters.department === "all" || item.department === filters.department

      return matchKeyword && matchDept
    })
  }, [currentPeriod, filters])

  // Tổng hợp số liệu dòng Footer
  const totals = useMemo(() => {
    if (!filteredItems.length) {
      return {
        baseSalary: 0,
        positionAllowance: 0,
        fieldworkAllowance: 0,
        fieldworkDays: 0,
        hazardAllowance: 0,
        grossIncome: 0,
        totalInsurance: 0,
        personalIncomeTax: 0,
        netSalary: 0,
      }
    }
    return filteredItems.reduce(
      (acc, item) => ({
        baseSalary: acc.baseSalary + item.baseSalary,
        positionAllowance: acc.positionAllowance + item.positionAllowance,
        fieldworkAllowance: acc.fieldworkAllowance + item.fieldworkAllowance,
        fieldworkDays: acc.fieldworkDays + item.fieldworkDays,
        hazardAllowance: acc.hazardAllowance + item.hazardAllowance,
        grossIncome: acc.grossIncome + item.grossIncome,
        totalInsurance: acc.totalInsurance + item.totalInsuranceDeduction,
        personalIncomeTax: acc.personalIncomeTax + item.personalIncomeTax,
        netSalary: acc.netSalary + item.netSalary,
      }),
      {
        baseSalary: 0,
        positionAllowance: 0,
        fieldworkAllowance: 0,
        fieldworkDays: 0,
        hazardAllowance: 0,
        grossIncome: 0,
        totalInsurance: 0,
        personalIncomeTax: 0,
        netSalary: 0,
      }
    )
  }, [filteredItems])

  const refreshData = () => {
    const updated = defaultHrmPayrollRepository.getAllPeriods()
    setPeriods(updated)
  }

  const handlePeriodCreated = (newPeriod: PayrollPeriodRecord) => {
    refreshData()
    setSelectedPeriodId(newPeriod.id)
    toast.success(`Đã khởi tạo ${newPeriod.title} thành công!`)
  }

  const handleStatusUpdated = (updated: PayrollPeriodRecord) => {
    refreshData()
    toast.success(`Đã cập nhật trạng thái kỳ lương thành công!`)
  }

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    toast.success(`Đã sao chép mã cán bộ: ${code}`)
  }

  const handleOpenAdjust = (item: PayrollItemRecord) => {
    setSelectedItem(item)
    setAdjustModalOpen(true)
  }

  const handleOpenPayslip = (item: PayrollItemRecord) => {
    setSelectedItem(item)
    setPayslipModalOpen(true)
  }

  const handleExportExcel = () => {
    if (!currentPeriod) return
    exportPayrollPeriodToExcel(currentPeriod)
    toast.success(`Đã xuất file Excel bảng lương ${currentPeriod.title}!`)
  }

  if (!currentPeriod) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Chưa có dữ liệu kỳ tính lương.
      </div>
    )
  }

  const averageNetSalary =
    currentPeriod.totalEmployees > 0
      ? Math.round(currentPeriod.totalNet / currentPeriod.totalEmployees)
      : 0

  return (
    <div className="flex-1 space-y-5 p-6 max-w-[1680px] mx-auto animate-in fade-in-50 duration-200">
      {/* 1. Header & Điều hướng kỳ tính lương */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dữ liệu tiền lương
            </h1>

          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị bảng lương cán bộ, ngạch bậc viên chức, phụ cấp khảo sát địa chất thực địa và trích nộp bảo hiểm.
          </p>
        </div>

        {/* Nhóm hành động chính */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ chọn kỳ tính lương */}
          <div className="w-56">
            <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
              <SelectTrigger className="h-8 text-xs font-medium bg-card">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
                <SelectValue placeholder="Chọn kỳ lương" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewModalOpen(true)}
            className="h-8 text-xs gap-1.5 border-border shadow-xs"
            title="Thẩm định & Duyệt kỳ lương"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Thẩm định kỳ</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-8 text-xs gap-1.5 border-border shadow-xs"
            title="Xuất bảng lương ra Excel"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsModalOpen(true)}
            className="h-8 text-xs gap-1.5 border-border shadow-xs"
            title="Cấu hình tham số mức lương cơ sở & tỷ lệ trích"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Cấu hình</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="h-8 text-xs gap-1.5 font-medium shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Kỳ lương mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Bốn thẻ chỉ số ERP Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng quỹ lương thực lĩnh */}
        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tổng quỹ lương thực lĩnh
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {formatVND(currentPeriod.totalNet)}
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {currentPeriod.totalEmployees} cán bộ
                </span>
                <span>được chi trả lương</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Landmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Lương bình quân cán bộ */}
        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Lương bình quân / người
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {formatVND(averageNetSalary)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Đã tính đủ phụ cấp thực địa dã ngoại
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Trạng thái kỳ tính lương */}
        <Card
          className="border border-border/80 bg-card shadow-xs rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setReviewModalOpen(true)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Trạng thái kỳ lương
              </span>
              <div className="pt-0.5">
                <PayrollStatusBadge status={currentPeriod.status} />
              </div>
              <div className="text-[11px] text-muted-foreground truncate max-w-[190px]">
                {currentPeriod.status === "paid"
                  ? "Đã chuyển khoản kho bạc"
                  : currentPeriod.status === "approved"
                    ? "Đã ký duyệt chấp thuận"
                    : currentPeriod.status === "pending_review"
                      ? "Kế toán trưởng đang thẩm định"
                      : "Đang rà soát số liệu"}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Tổng trích nộp BHXH & Đoàn phí */}
        <Card className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Trích nộp BHXH & KPCĐ
              </span>
              <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                {formatVND(currentPeriod.totalInsurance)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Thuế TNCN tạm tính:{" "}
                <span className="font-mono text-destructive">
                  {formatVND(currentPeriod.totalTax)}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Thanh tìm kiếm và bộ lọc nhanh */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-xl bg-card border border-border shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              placeholder="Tìm theo tên, mã cán bộ, vị trí..."
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          {/* Lọc theo phòng ban */}
          <div className="w-52">
            <Select
              value={filters.department}
              onValueChange={(val) => setFilters({ ...filters, department: val })}
            >
              <SelectTrigger className="h-8.5 text-xs bg-background">
                <SelectValue placeholder="Tất cả phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Tất cả đơn vị ({currentPeriod.items.length})
                </SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-xs">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thông tin hiển thị */}
        <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-2">
          <span>
            Hiển thị <strong>{filteredItems.length}</strong> /{" "}
            <strong>{currentPeriod.items.length}</strong> cán bộ
          </span>
          {filters.keyword || filters.department !== "all" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ keyword: "", department: "all", status: "all" })}
              className="h-7 text-[11px] px-2 text-primary"
            >
              Đặt lại lọc
            </Button>
          ) : null}
        </div>
      </div>

      {/* 4. Data Grid Bảng lương mật độ cao sử dụng PaginatedDataTable chuẩn */}
      <PaginatedDataTable
        data={filteredItems}
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
            cellClassName: "sticky left-0 z-10 bg-card font-mono font-semibold text-foreground",
            render: (item) => (
              <div className="flex items-center gap-1 group">
                <span className="font-mono font-semibold text-foreground">
                  {item.employeeCode}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(item.employeeCode, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity"
                  title="Sao chép mã cán bộ"
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
            cellClassName: "sticky left-28 z-10 bg-card font-medium text-foreground",
            render: (item) => (
              <button
                type="button"
                onClick={() => handleOpenPayslip(item)}
                className="text-left hover:text-primary hover:underline transition-colors truncate max-w-[150px]"
                title="Xem phiếu lương"
              >
                {item.fullName}
              </button>
            ),
          },
          {
            key: "department",
            header: "Đơn vị công tác",
            headClassName: "min-w-[140px] font-semibold text-foreground",
            cellClassName: "truncate max-w-[140px] text-muted-foreground",
            render: (item) => item.department,
          },
          {
            key: "payGrade",
            header: "Ngạch bậc viên chức",
            headClassName: "min-w-[160px] font-semibold text-foreground",
            cellClassName: "truncate max-w-[160px] text-muted-foreground",
            render: (item) => item.payGrade,
          },
          {
            key: "salaryCoefficient",
            header: "HSL",
            headClassName: "w-16 text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono font-medium text-foreground",
            render: (item) => item.salaryCoefficient.toFixed(2),
          },
          {
            key: "baseSalary",
            header: "Lương ngạch bậc",
            headClassName: "min-w-[110px] text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (item) => formatVND(item.baseSalary),
          },
          {
            key: "positionAllowance",
            header: "PC Chức vụ",
            headClassName: "min-w-[100px] text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (item) => (item.positionAllowance > 0 ? formatVND(item.positionAllowance) : "—"),
          },
          {
            key: "fieldworkAllowance",
            header: `PC Thực địa (${totals.fieldworkDays}n)`,
            headClassName: "min-w-[120px] text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (item) =>
              item.fieldworkAllowance > 0 ? (
                <span>
                  {formatVND(item.fieldworkAllowance)}
                  <span className="text-[10px] text-muted-foreground/70 ml-1">
                    ({item.fieldworkDays}n)
                  </span>
                </span>
              ) : (
                "—"
              ),
          },
          {
            key: "hazardAllowance",
            header: "PC Độc hại",
            headClassName: "min-w-[100px] text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-muted-foreground",
            render: (item) => (item.hazardAllowance > 0 ? formatVND(item.hazardAllowance) : "—"),
          },
          {
            key: "grossIncome",
            header: "Tổng Gross",
            headClassName: "min-w-[120px] text-right font-bold text-foreground bg-muted/20",
            cellClassName: "text-right font-mono font-semibold text-foreground bg-muted/10",
            render: (item) => formatVND(item.grossIncome),
          },
          {
            key: "totalInsuranceDeduction",
            header: "Trừ BHXH + Đoàn",
            headClassName: "min-w-[110px] text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-destructive",
            render: (item) => `-${formatVND(item.totalInsuranceDeduction)}`,
          },
          {
            key: "personalIncomeTax",
            header: "Thuế TNCN",
            headClassName: "min-w-[95px] text-right font-semibold text-foreground",
            cellClassName: "text-right font-mono text-destructive",
            render: (item) =>
              item.personalIncomeTax > 0 ? `-${formatVND(item.personalIncomeTax)}` : "0 ₫",
          },
          {
            key: "netSalary",
            header: "Thực lĩnh (Net)",
            headClassName: "min-w-[130px] text-right font-extrabold text-foreground bg-primary/5",
            cellClassName: "text-right font-mono font-bold text-primary bg-primary/5 text-sm",
            render: (item) => formatVND(item.netSalary),
          },
          {
            key: "actions",
            header: "Thao tác",
            headClassName: "w-24 text-center font-bold text-foreground sticky right-0 z-20 bg-muted/60 backdrop-blur-xs",
            cellClassName: "text-center sticky right-0 z-10 bg-card",
            render: (item) => (
              <div className="flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenPayslip(item)}
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                  title="Xem Phiếu lương cá nhân"
                >
                  <ReceiptText className="h-3.5 w-3.5" />
                </Button>

                {currentPeriod.status !== "paid" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenAdjust(item)}
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                    title="Điều chỉnh lương & Phụ cấp"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ),
          },
        ]}
        rowKey={(row) => row.id}
        defaultPageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
        bordered
        minTableWidth="1600px"
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="6rem"
        renderFooter={() => (
          <TableFooter className="bg-muted/60 font-bold border-t-2 border-border text-foreground">
            <TableRow className="h-10 hover:bg-transparent">
              <TableCell className="text-center">∑</TableCell>
              <TableCell className="sticky left-0 z-10 bg-muted/60 font-mono">
                TỔNG CỘNG
              </TableCell>
              <TableCell className="sticky left-28 z-10 bg-muted/60">
                {filteredItems.length} cán bộ
              </TableCell>
              <TableCell colSpan={2}></TableCell>
              <TableCell className="text-right font-mono">—</TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatVND(totals.baseSalary)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatVND(totals.positionAllowance)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatVND(totals.fieldworkAllowance)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatVND(totals.hazardAllowance)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs font-bold bg-muted/40">
                {formatVND(totals.grossIncome)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-destructive">
                -{formatVND(totals.totalInsurance)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-destructive">
                -{formatVND(totals.personalIncomeTax)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-extrabold text-primary bg-primary/10">
                {formatVND(totals.netSalary)}
              </TableCell>
              <TableCell className="sticky right-0 z-10 bg-muted/60"></TableCell>
            </TableRow>
          </TableFooter>
        )}
      />

      {/* 5. CÁC POPUP MODALS CĂN GIỮA MÀN HÌNH (DIALOG) */}
      <CreatePayrollPeriodModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={handlePeriodCreated}
      />

      <AdjustSalaryModal
        open={adjustModalOpen}
        onOpenChange={setAdjustModalOpen}
        item={selectedItem}
        periodId={currentPeriod.id}
        onSaved={refreshData}
      />

      <PayslipModal
        open={payslipModalOpen}
        onOpenChange={setPayslipModalOpen}
        item={selectedItem}
        period={currentPeriod}
      />

      <ReviewPayrollModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        period={currentPeriod}
        onStatusUpdated={handleStatusUpdated}
      />

      <PayrollSettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        onSaved={refreshData}
      />
    </div>
  )
}
