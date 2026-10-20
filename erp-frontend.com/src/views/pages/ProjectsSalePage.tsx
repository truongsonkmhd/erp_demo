import { useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/ui/month-picker"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Bell,
  Send,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectSale } from "@/types/projectSale"
import { useProjectSales } from "@/hooks/project/useProjectSales"
import {
  addProjectSale,
  bulkUpdateProjectSales,
  updateProjectSale,
  deleteProjectSale,
} from "@/services/ProjectSaleService"
import { importProjectSalesFromExcel, ProjectSaleImportKind } from "@/services/projectSaleExcelImport"
import { saveAs } from "file-saver"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { ActionButton } from "@/components/ui/action-button"
import { BoatLoading } from "@/components/ui/boat-loading"
import { ProjectSaleForm } from "@/views/projects/ProjectSaleForm"
import { appToast } from "@/components/ui/app-toast"
import { useLocale } from "@/i18n/LocaleContext"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"
import icExcelIcon from "@/assets/ic/ic_excel.svg"

const DEFAULT_SALES_PEOPLE = [
  "Nguyễn Văn A (Sales Logistics)",
  "Trần Thị B (Sales Freight)",
  "Phạm Văn C (Sales CSKH)",
  "Lê Văn D (Sales Marketing)",
  "Hoàng Thị E (Sales Khách Hàng)",
]

export default function ProjectsSalePage() {
  const { t } = useLocale()
  const { user } = useAuth()
  const pageCode = useLocation().pathname.slice(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [fromMonth, setFromMonth] = useState("")
  const [toMonth, setToMonth] = useState("")
  const { projectSales, isLoading, refetch } = useProjectSales()
  const [selectedProject, setSelectedProject] = useState<ProjectSale | null>(null)
  const [dialogMode, setDialogMode] = useState<"view" | "create" | "edit" | "copy" | null>(null)

  // State cho Phân Việc (Manager assign task)
  const [assigningProject, setAssigningProject] = useState<ProjectSale | null>(null)
  const [assignedStaffInput, setAssignedStaffInput] = useState("")
  const [customStaffInput, setCustomStaffInput] = useState("")
  const [taskNoteInput, setTaskNoteInput] = useState("")
  const [notifyMail, setNotifyMail] = useState(true)
  const [notifySystem, setNotifySystem] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const warehouseImportRef = useRef<HTMLInputElement>(null)
  const quoteImportRef = useRef<HTMLInputElement>(null)

  const exportSaleXlsx = () => {
    const fileUrl = "/template_dashboard2.xlsx"
    saveAs(fileUrl, "du_an_sale_export.xlsx")
  }

  const filteredProjects = projectSales.filter((p) => {
    const q = searchTerm.toLowerCase().trim()
    const matchesQuery = !q || (
      (p.customerCode || "").toLowerCase().includes(q) ||
      (p.orderCode || "").toLowerCase().includes(q) ||
      (p.batchCode || "").toLowerCase().includes(q) ||
      (p.customerName || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q) ||
      (p.productName || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.serviceType || "").toLowerCase().includes(q) ||
      (p.customerType || "").toLowerCase().includes(q)
    )

    let matchesDate = true
    if (p.createdAt) {
      const projMonth = p.createdAt.slice(0, 7)
      if (fromMonth && projMonth < fromMonth) matchesDate = false
      if (toMonth && projMonth > toMonth) matchesDate = false
    }

    return matchesQuery && matchesDate
  })

  const handleImportExcel = async (file: File | undefined, kind: ProjectSaleImportKind) => {
    if (!can(user, `${pageCode}:update`)) return
    if (!file) return
    setIsImporting(true)
    try {
      const result = await importProjectSalesFromExcel(file, kind, projectSales)
      if (!result.updated) {
        appToast.error(t("common.error"), t("projects.importNoMatch"))
        return
      }
      await bulkUpdateProjectSales(result.updates)
      await refetch()
      appToast.success(
        kind === "warehouse" ? t("projects.importWarehouseSuccess") : t("projects.importQuoteSuccess"),
        t("projects.importResult").replace("{{updated}}", String(result.updated)).replace("{{skipped}}", String(result.skipped)),
      )
    } catch (error) {
      console.error(error)
      appToast.error(t("common.error"), t("projects.importFailed"))
    } finally {
      setIsImporting(false)
      if (kind === "warehouse" && warehouseImportRef.current) warehouseImportRef.current.value = ""
      if (kind === "quote" && quoteImportRef.current) quoteImportRef.current.value = ""
    }
  }

  const handleOpenAssignDialog = (project: ProjectSale) => {
    if (!can(user, `${pageCode}:update`)) return
    setAssigningProject(project)
    const currentAssigned = project.assignedStaff || project.assignee || ""
    if (DEFAULT_SALES_PEOPLE.includes(currentAssigned)) {
      setAssignedStaffInput(currentAssigned)
      setCustomStaffInput("")
    } else if (currentAssigned) {
      setAssignedStaffInput("custom")
      setCustomStaffInput(currentAssigned)
    } else {
      setAssignedStaffInput(DEFAULT_SALES_PEOPLE[0])
      setCustomStaffInput("")
    }
    setTaskNoteInput("")
    setNotifyMail(true)
    setNotifySystem(true)
  }

  const handleConfirmAssignTask = async () => {
    if (!can(user, `${pageCode}:update`)) return
    if (!assigningProject) return
    const finalStaff = assignedStaffInput === "custom" ? customStaffInput.trim() : assignedStaffInput
    if (!finalStaff) {
      appToast.error(t("common.error"), "Vui lòng chọn hoặc nhập tên nhân viên thực hiện!")
      return
    }

    try {
      setIsAssigning(true)
      await updateProjectSale(assigningProject.id, {
        ...assigningProject,
        assignedStaff: finalStaff,
        assignee: finalStaff,
      })
      await refetch()

      const notificationsSent: string[] = []
      if (notifyMail) notificationsSent.push("Email")
      if (notifySystem) notificationsSent.push("Notice hệ thống")

      const noticeDetail = notificationsSent.length > 0
        ? `Đã gửi thông báo qua ${notificationsSent.join(" & ")} cho ${finalStaff}.`
        : `Đã phân việc thành công cho ${finalStaff}.`

      appToast.success(t("projects.assignTaskSuccess"), noticeDetail)
      setAssigningProject(null)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi phân việc", "Không thể cập nhật phân việc. Vui lòng thử lại sau.")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleViewProject = (p: ProjectSale) => { setSelectedProject(p); setDialogMode("view") }
  const handleEditProject = (p: ProjectSale) => {
    if (!can(user, `${pageCode}:update`)) return
    if (p.freightPaymentStatus === "Đã thu cước") {
      appToast.warning(t("projects.editLockedTitle"), t("projects.editLockedDetail"))
      setSelectedProject(p)
      setDialogMode("view")
      return
    }
    setSelectedProject(p)
    setDialogMode("edit")
  }

  const handleDeleteProject = async (p: ProjectSale) => {
    if (!can(user, `${pageCode}:delete`)) return
    if (!confirm(t("projects.deleteSaleConfirm", { code: `${p.customerCode} - ${p.orderCode}` }))) return
    await deleteProjectSale(p.id)
    await refetch()
  }

  const handleSaveProject = async (projectData: Omit<ProjectSale, "id"> | ProjectSale) => {
    if (!can(user, `${pageCode}:${dialogMode === "edit" ? "update" : "create"}`)) return
    if (dialogMode === "create" || dialogMode === "copy") {
      await addProjectSale(projectData as Omit<ProjectSale, "id">)
    } else if (dialogMode === "edit" && "id" in projectData) {
      await updateProjectSale((projectData as ProjectSale).id, projectData as ProjectSale)
    }
    await refetch()
    setDialogMode(null)
    setSelectedProject(null)
  }

  const handleCloseDialog = () => { setDialogMode(null); setSelectedProject(null) }

  const columns: DataTableColumn<ProjectSale>[] = useMemo(() => [
    { key: "index", header: t("common.stt"), headClassName: "w-14 min-w-14 text-center", cellClassName: "w-14 min-w-14 text-center", render: (_, index) => index + 1 },
    {
      key: "customerCode",
      header: t("common.customerCode"),
      headClassName: "min-w-28",
      cellClassName: "font-bold text-blue-700 dark:text-blue-300",
      render: (item) => item.customerCode || "—",
    },
    { key: "orderCode", header: t("common.orderCode"), headClassName: "min-w-32", cellClassName: "font-semibold", render: (item) => item.orderCode || "—" },
    { key: "batchCode", header: t("common.batchCode"), headClassName: "min-w-32", render: (item) => item.batchCode || "—" },
    { key: "customerName", header: t("common.customerName"), headClassName: "min-w-36", render: (item) => item.customerName || "—" },
    {
      key: "customerType",
      header: t("projects.customerType"),
      headClassName: "min-w-40",
      render: (item) => item.customerType || "—",
    },
    { key: "phone", header: t("tasks.phoneShort"), headClassName: "min-w-32", render: (item) => item.phone || "—" },
    { key: "serviceType", header: t("common.service"), headClassName: "min-w-44", render: (item) => item.serviceType || "—" },
    { key: "productName", header: t("common.productName"), headClassName: "min-w-44", render: (item) => item.productName || "—" },
    { key: "category", header: t("common.category"), headClassName: "min-w-36", render: (item) => item.category || "—" },
    { key: "unitPriceRmb", header: t("projects.unitPriceRmb"), headClassName: "min-w-28 text-right", cellClassName: "text-right", render: (item) => item.unitPriceRmb?.toLocaleString() || "0" },
    { key: "quantity", header: t("common.quantity"), headClassName: "min-w-24 text-center", cellClassName: "text-center", render: (item) => item.quantity?.toLocaleString() || "0" },
    { key: "domesticShippingRmb", header: t("projects.domesticShippingRmb"), headClassName: "min-w-32 text-right", cellClassName: "text-right", render: (item) => item.domesticShippingRmb?.toLocaleString() || "0" },
    { key: "costExchangeRate", header: t("projects.costExchangeRate"), headClassName: "min-w-28 text-right", cellClassName: "text-right", render: (item) => item.costExchangeRate?.toLocaleString() || "0" },
    { key: "sellingExchangeRate", header: t("projects.sellingExchangeRate"), headClassName: "min-w-28 text-right", cellClassName: "text-right", render: (item) => item.sellingExchangeRate?.toLocaleString() || "0" },
    { key: "totalGoodsCostVnd", header: t("projects.totalGoodsCostVnd"), headClassName: "min-w-36 text-right", cellClassName: "text-right font-medium", render: (item) => (item.totalGoodsCostVnd || 0).toLocaleString() },
    { key: "totalGoodsSellingVnd", header: t("projects.totalGoodsSellingVnd"), headClassName: "min-w-36 text-right", cellClassName: "text-right font-bold text-blue-700 dark:text-blue-300", render: (item) => (item.totalGoodsSellingVnd || 0).toLocaleString() },
    { key: "purchasingFeeVnd", header: t("projects.purchasingFeeVnd"), headClassName: "min-w-32 text-right", cellClassName: "text-right", render: (item) => (item.purchasingFeeVnd || 0).toLocaleString() },
    { key: "weightKg", header: t("projects.weightKg"), headClassName: "min-w-32 text-center", cellClassName: "text-center", render: (item) => item.weightKg || "0" },
    { key: "volumeCbm", header: t("projects.volumeCbm"), headClassName: "min-w-28 text-center", cellClassName: "text-center", render: (item) => item.volumeCbm || "0" },
    {
      key: "orderStatus",
      header: t("projects.orderTracking"),
      headClassName: "min-w-36 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge variant="outline" className="bg-blue-500/15 text-blue-800 border-blue-500/30 dark:text-blue-300">
          {item.orderStatus || "—"}
        </Badge>
      ),
    },
    {
      key: "shipmentStatus",
      header: t("projects.shipmentTracking"),
      headClassName: "min-w-36 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300">
          {item.shipmentStatus || "—"}
        </Badge>
      ),
    },
    {
      key: "freightPaymentStatus",
      header: t("projects.freightCollection"),
      headClassName: "min-w-32 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge
          variant="outline"
          className={
            item.freightPaymentStatus === "Đã thu cước"
              ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30 dark:text-emerald-300"
              : "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:text-amber-300"
          }
        >
          {item.freightPaymentStatus || "—"}
        </Badge>
      ),
    },
    {
      key: "documentStatus",
      header: t("projects.documentsCol"),
      headClassName: "min-w-32 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge
          variant="outline"
          className={
            item.documentStatus === "Đã bàn giao"
              ? "bg-purple-500/15 text-purple-800 border-purple-500/30 dark:text-purple-300"
              : "bg-muted text-muted-foreground border-border"
          }
        >
          {item.documentStatus || "—"}
        </Badge>
      ),
    },
    { key: "notes", header: t("common.notes"), headClassName: "min-w-48", cellClassName: "truncate max-w-48", render: (item) => item.notes || "—" },
    {
      key: "actions",
      header: t("common.actions"),
      headClassName: "w-[1%] whitespace-nowrap text-center",
      cellClassName: "w-[1%] whitespace-nowrap text-center",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={t("common.openActionMenu")} onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewProject(item) }}><Eye className="mr-2 h-4 w-4" />{t("common.viewDetails")}</DropdownMenuItem>
            {can(user, `${pageCode}:update`) && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditProject(item) }}><Edit className="mr-2 h-4 w-4" />{t("common.edit")}</DropdownMenuItem>}
            {can(user, `${pageCode}:delete`) && <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteProject(item) }}><Trash2 className="mr-2 h-4 w-4" />{t("common.delete")}</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [t, user, pageCode])

  return (
    <div className="space-y-6 px-3 sm:px-0">
      {isLoading && <BoatLoading fullScreen label={t("projects.loadingCskh")} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{t("projects.cskhTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{t("projects.cskhSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={warehouseImportRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => void handleImportExcel(event.target.files?.[0], "warehouse")}
          />
          <input
            ref={quoteImportRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => void handleImportExcel(event.target.files?.[0], "quote")}
          />
          {can(user, `${pageCode}:update`) && <ActionButton
            appearance="outline"
            onClick={() => warehouseImportRef.current?.click()}
            disabled={isImporting}
            title={t("projects.importWarehouse")}
            aria-label={t("projects.importWarehouse")}
            icon={<img src={icExcelIcon} alt="" className="w-4 h-4 shrink-0" />}
            className="px-3.5 text-xs font-semibold"
          >
            <span className="hidden sm:inline">{t("projects.importWarehouse")}</span>
          </ActionButton>}
          {can(user, `${pageCode}:update`) && <ActionButton
            appearance="outline"
            onClick={() => quoteImportRef.current?.click()}
            disabled={isImporting}
            title={t("projects.importQuote")}
            aria-label={t("projects.importQuote")}
            icon={<img src={icExcelIcon} alt="" className="w-4 h-4 shrink-0" />}
            className="px-3.5 text-xs font-semibold"
          >
            <span className="hidden sm:inline">{t("projects.importQuote")}</span>
          </ActionButton>}
          <ActionButton
            appearance="primary"
            onClick={exportSaleXlsx}
            title={t("common.exportExcel")}
            aria-label={t("common.exportExcel")}
            className="border-0 bg-emerald-600 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 focus-visible:bg-emerald-700 focus-visible:ring-emerald-600 active:bg-emerald-700"
          >
            {t("common.exportExcel")}
          </ActionButton>

          <ActionButton
            appearance="primary"
            onClick={() => setShowSearchPanel((prev) => !prev)}
            title={t("common.search")}
          >
            {t("common.search")}
          </ActionButton>
        </div>
      </div>

      {showSearchPanel && (
        <div className="rounded-xl border border-sky-100 bg-white shadow-xs overflow-hidden transition-all duration-200">
          <div className="flex items-center justify-between bg-[#f0f7ff] border-b border-sky-100 px-4 py-2.5">
            <h3 className="text-sm font-bold text-slate-800">Thông tin tìm kiếm</h3>
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={() => setShowSearchPanel(false)}
              className="h-6 w-6 rounded"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Từ Tháng/Năm</Label>
                <MonthPicker value={fromMonth} onChange={setFromMonth} placeholder="MM/yyyy" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Đến Tháng/Năm</Label>
                <MonthPicker value={toMonth} onChange={setToMonth} placeholder="MM/yyyy" emptyLabel="Tất cả" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Từ khóa tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Nhập mã KH, tên KH, SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white text-sm"
                  />
                </div>
              </div>
            </div>
            {(searchTerm || fromMonth || toMonth) && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchTerm("")
                    setFromMonth("")
                    setToMonth("")
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <PaginatedDataTable
        data={filteredProjects}
        columns={columns}
        rowKey={(item) => item.id}
        loading={false}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
        minTableWidth="2200px"
        onRowClick={handleViewProject}
        bordered={false}
        stickyFirstColumn
        stickyLastColumn
      />

      <Dialog open={Boolean(dialogMode)} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="sm:max-w-5xl w-[94vw] h-[90vh] max-h-[90vh] p-0 rounded-xl overflow-hidden [&>button]:hidden">
          {dialogMode && (
            <ProjectSaleForm
              project={selectedProject || undefined}
              mode={dialogMode}
              onSave={handleSaveProject}
              onCancel={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Phân việc cho Manager */}
      <Dialog open={Boolean(assigningProject)} onOpenChange={(open) => !open && setAssigningProject(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              {t("projects.assignTaskTitle")}
            </DialogTitle>
          </DialogHeader>

          {assigningProject && (
            <div className="space-y-4 pt-2">
              {/* Tóm tắt đơn hàng */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Mã đơn hàng:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-sm">{assigningProject.orderCode || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Khách hàng:</span>
                  <span className="font-semibold text-foreground">{assigningProject.customerName || "—"} ({assigningProject.customerCode || "—"})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Sản phẩm / Dịch vụ:</span>
                  <span className="text-foreground">{assigningProject.productName || "—"} • {assigningProject.serviceType || "Logistics"}</span>
                </div>
              </div>

              {/* Chọn nhân viên thực hiện */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">{t("projects.assigneeLabel")}</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {DEFAULT_SALES_PEOPLE.map((sale) => (
                    <label
                      key={sale}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        assignedStaffInput === sale
                          ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 font-semibold text-foreground"
                          : "border-border bg-card hover:bg-muted text-foreground"
                      }`}
                      onClick={() => setAssignedStaffInput(sale)}
                    >
                      <input
                        type="radio"
                        name="assignSaleChoice"
                        checked={assignedStaffInput === sale}
                        onChange={() => setAssignedStaffInput(sale)}
                        className="w-4 h-4 text-blue-600 accent-blue-600"
                      />
                      <span>{sale}</span>
                    </label>
                  ))}

                  <label
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      assignedStaffInput === "custom"
                        ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 font-semibold text-foreground"
                        : "border-border bg-card hover:bg-muted text-foreground"
                    }`}
                    onClick={() => setAssignedStaffInput("custom")}
                  >
                    <input
                      type="radio"
                      name="assignSaleChoice"
                      checked={assignedStaffInput === "custom"}
                      onChange={() => setAssignedStaffInput("custom")}
                      className="w-4 h-4 text-blue-600 accent-blue-600"
                    />
                    <span>Nhân viên khác...</span>
                  </label>

                  {assignedStaffInput === "custom" && (
                    <div className="pt-1">
                      <Input
                        type="text"
                        value={customStaffInput}
                        onChange={(e) => setCustomStaffInput(e.target.value)}
                        placeholder="Nhập tên hoặc email nhân viên..."
                        className="h-9 text-xs bg-background"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Ghi chú phân việc */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t("projects.taskNotesLabel")}</label>
                <textarea
                  value={taskNoteInput}
                  onChange={(e) => setTaskNoteInput(e.target.value)}
                  placeholder="Nhập hướng dẫn hoặc yêu cầu xử lý công việc cho nhân viên..."
                  className="w-full h-20 p-2.5 text-xs rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Checkbox Thông báo Email & System Notice */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hình thức thông báo</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyMail}
                      onChange={(e) => setNotifyMail(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span className="flex items-center gap-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      {t("projects.notifyEmail")}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifySystem}
                      onChange={(e) => setNotifySystem(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                    />
                    <span className="flex items-center gap-1.5 font-medium">
                      <Bell className="w-3.5 h-3.5 text-amber-600" />
                      {t("projects.notifySystem")}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssigningProject(null)}
              className="text-xs"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={isAssigning}
              onClick={handleConfirmAssignTask}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {t("projects.confirmAssignTask")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
