import { usePeopleOptions } from "@/hooks/useOrgOptions"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/ui/month-picker"
import {
  Plus,
  Search,
  MoreVertical,
  CalendarDays,
  Users,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Copy,
  Trash2,
  FileDown,
  HeartHandshake,
  UserPlus,
  UserCheck,
  RefreshCw,
  Mail,
  Bell,
  BellOff,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Project } from "@/types/project"
import { ProjectForm } from "@/views/projects/ProjectForm"
import { useProjects } from "@/hooks/project/useProjects"

import { addProject, updateProject, deleteProject } from "@/services/ProjectService"
import { saveAs } from "file-saver"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ActionButton } from "@/components/ui/action-button"
import { BoatLoading } from "@/components/ui/boat-loading"
import CustomerCarePage from "@/views/pages/CustomerCarePage"
import { appToast } from "@/components/ui/app-toast"
import { useLocale } from "@/i18n/LocaleContext"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"

const DEFAULT_SALES_PEOPLE = [
  "Nguyễn Văn A (Sales Logistics)",
  "Trần Thị B (Sales Freight)",
  "Phạm Văn C (Sales CSKH)",
  "Lê Văn D (Sales Marketing)",
  "Hoàng Thị E (Sales Khách Hàng)",
]

const ASSIGNMENTS_KEY = "hoangminh_project_assignments"

function ProjectCard({
  project,
  onView,
  onEdit,
  onCopy,
  onDelete,
}: {
  project: Project
  onView: (p: Project) => void
  onEdit: (p: Project) => void
  onCopy: (p: Project) => void
  onDelete: (p: Project) => void
}) {
  const { t } = useLocale()
  const { user } = useAuth()
  const statusConfig = {
    planning: { label: t("projects.statusPlanning"), className: "bg-status-planning text-white", icon: CalendarDays },
    active: { label: t("projects.statusActive"), className: "bg-status-active text-white", icon: CheckCircle },
    on_hold: { label: t("projects.statusOnHold"), className: "bg-status-delayed text-white", icon: AlertTriangle },
    completed: { label: t("projects.statusCompleted"), className: "bg-status-completed text-white", icon: CheckCircle },
    cancelled: { label: t("projects.statusCancelled"), className: "bg-status-blocked text-white", icon: AlertTriangle },
  } as const
  const status = statusConfig[project.status]
  const StatusIcon = status.icon

  return (
    <Card className="hover:shadow-construction transition-shadow cursor-pointer" onClick={() => onView(project)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 break-words">
              {project.name}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{project.location}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Badge className={`px-2 py-0.5 text-[10px] sm:text-xs ${status.className}`}>
              <StatusIcon className="w-3 h-3 mr-1 hidden sm:inline" />
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label={t("common.openActionMenu")} variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project) }}>
                  <Eye className="w-4 h-4 mr-2" /> {t("common.viewDetails")}
                </DropdownMenuItem>
                {can(user, "projects-marketing:update") && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project) }}>
                  <Edit className="w-4 h-4 mr-2" /> {t("common.editLong")}
                </DropdownMenuItem>}
                {can(user, "projects-marketing:create") && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(project) }}>
                  <Copy className="w-4 h-4 mr-2" /> {t("common.copy")}
                </DropdownMenuItem>}
                {can(user, "projects-marketing:delete") && <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(project) }}>
                  <Trash2 className="w-4 h-4 mr-2" /> {t("common.delete")}
                </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 sm:line-clamp-2 break-words">{project.description}</p>
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">{t("projects.progress")}</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date(project.endDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{t("projects.membersCount", { count: project.teamSize })}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">{t("projects.budget")}</span>
            <span className="font-medium text-foreground">{project.budget.toLocaleString()} VNĐ</span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm mt-1">
            <span className="text-muted-foreground">{t("projects.manager")}</span>
            <span className="text-foreground truncate max-w-[55%] sm:max-w-none">{project.manager}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Projects({ pageTitle }: { pageTitle?: string } = {}) {
  const salesPeople = usePeopleOptions(DEFAULT_SALES_PEOPLE)
  const { user } = useAuth()
  const { t } = useLocale()
  const [searchName, setSearchName] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [searchCategory, setSearchCategory] = useState("")
  const [searchSource, setSearchSource] = useState("")
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [fromMonth, setFromMonth] = useState("")
  const [toMonth, setToMonth] = useState("")
  const { projects, isLoading, refetch } = useProjects()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [careProject, setCareProject] = useState<Project | null>(null)
  const [dialogMode, setDialogMode] = useState<"view" | "create" | "edit" | "copy" | null>(null)

  const [assignments, setAssignments] = useState<Record<string, { manager: string; status: "pending" | "assigned"; assignmentStatus?: "not_notified" | "lead_notified" | "pending" | "assigned" }>>(() => {
    try {
      const saved = localStorage.getItem(ASSIGNMENTS_KEY)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [assigningProject, setAssigningProject] = useState<Project | null>(null)
  const [selectedSaleName, setSelectedSaleName] = useState<string>("")
  const [customSaleName, setCustomSaleName] = useState<string>("")
  const [notifyMail, setNotifyMail] = useState(true)
  const [notifySystem, setNotifySystem] = useState(true)
  const [taskNoteInput, setTaskNoteInput] = useState("")

  const saveAssignments = (newAssignments: Record<string, { manager: string; status: "pending" | "assigned"; assignmentStatus?: "not_notified" | "lead_notified" | "pending" | "assigned" }>) => {
    if (!can(user, "projects-marketing:update")) return
    setAssignments(newAssignments)
    try {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(newAssignments))
    } catch {
      // ignore
    }
  }

  const exportDashboardXlsx = () => {
    const fileUrl = "/template_dashboard2.xlsx"
    saveAs(fileUrl, "dashboard_export.xlsx")
  }

  const filteredProjects = projects.filter((project) => {
    const assignInfo = assignments[project.id]
    const managerName = assignInfo?.manager || project.manager || ""

    const nameQ = searchName.toLowerCase().trim()
    const phoneQ = searchPhone.toLowerCase().trim()
    const categoryQ = searchCategory.toLowerCase().trim()
    const sourceQ = searchSource.toLowerCase().trim()

    const matchesName = !nameQ || project.name.toLowerCase().includes(nameQ) || managerName.toLowerCase().includes(nameQ)
    const matchesPhone = !phoneQ || (project.phone || "").toLowerCase().includes(phoneQ)
    const matchesCategory = !categoryQ || (project.category || "").toLowerCase().includes(categoryQ)
    const matchesSource = !sourceQ || (project.leadSource || "").toLowerCase().includes(sourceQ)

    let matchesDate = true
    if (project.createdAt) {
      const projMonth = project.createdAt.slice(0, 7)
      if (fromMonth && projMonth < fromMonth) matchesDate = false
      if (toMonth && projMonth > toMonth) matchesDate = false
    }

    return matchesName && matchesPhone && matchesCategory && matchesSource && matchesDate
  })

  const handleCreateProject = () => { if (!can(user, "projects-marketing:create")) return; setSelectedProject(null); setDialogMode("create") }
  const handleViewProject = (p: Project) => { setSelectedProject(p); setDialogMode("view") }
  const handleEditProject = (p: Project) => { if (!can(user, "projects-marketing:update")) return; setSelectedProject(p); setDialogMode("edit") }
  const handleCopyProject = (p: Project) => { if (!can(user, "projects-marketing:create")) return; setSelectedProject(p); setDialogMode("copy") }

  const handleOpenAssignDialog = (project: Project) => {
    if (!can(user, "projects-marketing:update")) return
    const currentAssign = assignments[project.id]
    const initialSale = currentAssign?.manager || project.manager || salesPeople[0]
    setAssigningProject(project)
    if (salesPeople.includes(initialSale)) {
      setSelectedSaleName(initialSale)
      setCustomSaleName("")
    } else {
      setSelectedSaleName("custom")
      setCustomSaleName(initialSale)
    }
    setTaskNoteInput("")
    setNotifyMail(true)
    setNotifySystem(true)
  }

  const handleConfirmGiaoXong = () => {
    if (!can(user, "projects-marketing:update")) return
    if (!assigningProject) return
    const finalSale = selectedSaleName === "custom" ? customSaleName.trim() : selectedSaleName
    if (!finalSale) {
      appToast.error(t("common.error"), t("projects.assignError"))
      return
    }

    const updated = {
      ...assignments,
      [assigningProject.id]: {
        manager: finalSale,
        status: "pending" as const,
        assignmentStatus: "pending" as const,
      },
    }
    saveAssignments(updated)

    const notificationsSent: string[] = []
    if (notifyMail) notificationsSent.push("Email")
    if (notifySystem) notificationsSent.push("Notice hệ thống")

    const noticeDetail = notificationsSent.length > 0
      ? `Hệ thống đã gửi thông báo đến ${notificationsSent.join(" & ")} cho ${finalSale}.`
      : `Đã phân việc thành công cho ${finalSale}.`

    appToast.success(t("projects.assignSuccess"), noticeDetail)
    setAssigningProject(null)
  }

  const handleConfirmAssignment = (project: Project) => {
    if (!can(user, "projects-marketing:update")) return
    const currentAssign = assignments[project.id]
    const currentManager = currentAssign?.manager || project.manager || salesPeople[0]

    const updated = {
      ...assignments,
      [project.id]: {
        manager: currentManager,
        status: "assigned" as const,
        assignmentStatus: "assigned" as const,
      },
    }
    saveAssignments(updated)
    appToast.success(t("projects.confirmSuccess"), t("projects.confirmSuccessDetail", { name: currentManager }))
  }

  const handleDeleteProject = async (project: Project) => {
    if (!can(user, "projects-marketing:delete")) return
    if (!confirm(t("projects.deleteConfirm", { name: project.name }))) return
    await deleteProject(project.id)
    await refetch()
  }

  const handleSaveProject = async (projectData: Omit<Project, "id"> | Project) => {
    if (!can(user, `projects-marketing:${dialogMode === "edit" ? "update" : "create"}`)) return
    if (dialogMode === "create" || dialogMode === "copy") {
      await addProject(projectData as Omit<Project, "id">)
    } else if (dialogMode === "edit" && "id" in projectData) {
      await updateProject((projectData as Project).id, projectData as Project)
    }
    await refetch()
    setDialogMode(null)
    setSelectedProject(null)
  }

  const handleCloseDialog = () => { setDialogMode(null); setSelectedProject(null) }

  const customerColumns: DataTableColumn<Project>[] = useMemo(() => [
    { key: "index", header: t("common.stt"), headClassName: "w-16 min-w-16 text-center", cellClassName: "w-16 min-w-16 text-center", render: (_, index) => index + 1 },
    { key: "name", header: t("common.fullName"), headClassName: "min-w-48", cellClassName: "font-medium", render: (item) => item.name || "—" },
    { key: "phone", header: t("common.phone"), headClassName: "min-w-36", render: (item) => item.phone || "—" },
    { key: "category", header: t("common.category"), headClassName: "min-w-56", render: (item) => item.category || "—" },
    { key: "leadSource", header: t("projects.source"), headClassName: "min-w-36", render: (item) => item.leadSource || "—" },
    {
      key: "createdAt",
      header: t("common.createdTime"),
      headClassName: "min-w-44 whitespace-nowrap",
      cellClassName: "whitespace-nowrap",
      render: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—"),
    },
    {
      key: "assignmentStatus",
      header: t("projects.assignmentStatus"),
      headClassName: "min-w-44 whitespace-nowrap text-center",
      cellClassName: "min-w-44 text-center",
      render: (item) => {
        const assignInfo = assignments[item.id]
        const customStatus = assignInfo?.assignmentStatus

        let currentStatus: "not_notified" | "lead_notified" | "pending" | "assigned" = "not_notified"
        if (customStatus) {
          currentStatus = customStatus
        } else if (assignInfo?.status === "pending") {
          currentStatus = "pending"
        } else if (assignInfo?.status === "assigned" || item.manager) {
          currentStatus = "assigned"
        } else {
          currentStatus = "not_notified"
        }

        const handleStatusChange = (newStatus: "not_notified" | "lead_notified" | "pending" | "assigned") => {
          if (!can(user, "projects-marketing:update")) return
          const currentManager = assignInfo?.manager || item.manager || salesPeople[0]
          const updated = {
            ...assignments,
            [item.id]: {
              manager: currentManager,
              status: newStatus === "pending" ? ("pending" as const) : ("assigned" as const),
              assignmentStatus: newStatus,
            },
          }
          saveAssignments(updated)
          if (newStatus === "lead_notified") {
            appToast.success(t("common.success"), "Đã chuyển trạng thái: Đã thông báo đến lead.")
          }
        }

        if (currentStatus === "not_notified") {
          return (
            <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
              <Button
                type="button"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-7 px-3 rounded-md shadow-sm gap-1.5"
                onClick={() => handleStatusChange("lead_notified")}
              >
                <Bell className="w-3.5 h-3.5" />
                {t("projects.statusNotifyAction")}
              </Button>
            </div>
          )
        }

        return (
          <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
            {currentStatus === "lead_notified" && (
              <Badge variant="outline" className="bg-blue-500/15 text-blue-800 border-blue-500/30 font-semibold dark:text-blue-300 gap-1.5 px-2.5 py-1">
                <Bell className="w-3 h-3 text-blue-600 shrink-0" />
                {t("projects.statusLeadNotified")}
              </Badge>
            )}
            {currentStatus === "pending" && (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-800 border-amber-500/30 font-semibold dark:text-amber-300 gap-1.5 px-2.5 py-1">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                {t("projects.statusPendingResponse")}
              </Badge>
            )}
            {currentStatus === "assigned" && (
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-800 border-emerald-500/30 font-semibold dark:text-emerald-300 gap-1.5 px-2.5 py-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                {t("projects.statusWorkAssigned")}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: "manager",
      header: t("projects.assignToSale"),
      headClassName: "w-64 min-w-64 whitespace-nowrap text-center",
      cellClassName: "w-64 min-w-64 text-center",
      render: (item) => {
        const assignInfo = assignments[item.id]

        if (!assignInfo && !item.manager) {
          return (
            <Button
              type="button"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-3 rounded-lg font-semibold shadow-sm"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenAssignDialog(item)
              }}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              {t("projects.assign")}
            </Button>
          )
        }

        const saleName = assignInfo?.manager || item.manager
        const status = assignInfo?.status || "assigned"

        if (status === "pending") {
          return (
            <div className="flex flex-col items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
                {t("projects.pendingLabel", { name: saleName || "" })}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleConfirmAssignment(item)}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline dark:text-emerald-400"
                >
                  {t("projects.confirmReceive")}
                </button>
                <span className="text-muted-foreground/40">•</span>
                <button
                  type="button"
                  onClick={() => handleOpenAssignDialog(item)}
                  className="text-primary hover:text-primary/80 font-medium hover:underline"
                >
                  {t("projects.changePerson")}
                </button>
              </div>
            </div>
          )
        }

        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-xs font-semibold dark:text-emerald-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 dark:text-emerald-400" />
              {saleName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 font-medium"
              onClick={() => handleOpenAssignDialog(item)}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {t("projects.changePerson")}
            </Button>
          </div>
        )
      },
    },
    {
      key: "actions",
      header: t("common.actions"),
      headClassName: "w-20 min-w-20 whitespace-nowrap text-center",
      cellClassName: "w-20 min-w-20 whitespace-nowrap text-center",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" aria-label={t("common.openActionMenu")} variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); handleViewProject(item) }}><Eye className="mr-2 h-4 w-4" />{t("common.viewDetails")}</DropdownMenuItem>
            {can(user, "projects-marketing:update") && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); handleEditProject(item) }}><Edit className="mr-2 h-4 w-4" />{t("common.edit")}</DropdownMenuItem>}
            {can(user, "projects-marketing:update") && <DropdownMenuItem onClick={(event) => { event.stopPropagation(); setCareProject(item) }}><HeartHandshake className="mr-2 h-4 w-4" />{t("projects.careCustomer")}</DropdownMenuItem>}
            {can(user, "projects-marketing:delete") && <DropdownMenuItem className="text-destructive" onClick={(event) => { event.stopPropagation(); handleDeleteProject(item) }}><Trash2 className="mr-2 h-4 w-4" />{t("common.delete")}</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [assignments, t, user, salesPeople])

  const isReassign = Boolean(
    assigningProject && (assignments[assigningProject.id]?.manager || assigningProject.manager)
  )

  return (
    <div className="space-y-6 px-3 sm:px-0">
      {isLoading && <BoatLoading fullScreen label={t("projects.loading")} />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">{pageTitle || t("projects.marketingTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{t("projects.marketingSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="h-10 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all flex items-center justify-center border-0"
            onClick={() => exportDashboardXlsx()}
            aria-label={t("common.exportExcel")}
            title={t("common.exportExcel")}
          >
            <span>{t("common.exportExcel")}</span>
          </Button>

          <ActionButton appearance="primary" onClick={() => setShowSearchPanel((prev) => !prev)}>
            {t("common.search")}
          </ActionButton>

          {can(user, "projects-marketing:create") && <ActionButton onClick={handleCreateProject}>
            <span className="hidden sm:inline">{t("projects.new")}</span>
            <span className="sm:hidden">{t("projects.newMobile")}</span>
          </ActionButton>}
        </div>
      </div>

      {showSearchPanel && (
        <div className="rounded-xl border border-sky-100 bg-white shadow-xs overflow-hidden transition-all duration-200">
          <div className="flex items-center justify-between bg-[#f0f7ff] border-b border-sky-100 px-4 py-2.5">
            <h3 className="text-sm font-bold text-slate-800">Thông tin tìm kiếm</h3>
            <button
              type="button"
              onClick={() => setShowSearchPanel(false)}
              className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none"
              title="Đóng"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Từ Tháng/Năm</Label>
                <MonthPicker value={fromMonth} onChange={setFromMonth} placeholder="" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Đến Tháng/Năm</Label>
                <MonthPicker value={toMonth} onChange={setToMonth} placeholder="" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Họ và tên</Label>
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="bg-white text-sm"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Số điện thoại</Label>
                <Input
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="bg-white text-sm"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Ngành hàng</Label>
                <Input
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="bg-white text-sm"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs font-semibold text-slate-700">Nguồn</Label>
                <Input
                  value={searchSource}
                  onChange={(e) => setSearchSource(e.target.value)}
                  className="bg-white text-sm"
                />
              </div>
            </div>
            {(searchName || searchPhone || searchCategory || searchSource || fromMonth || toMonth) && (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchName("")
                    setSearchPhone("")
                    setSearchCategory("")
                    setSearchSource("")
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
        columns={customerColumns}
        rowKey={(item) => item.id}
        loading={false}
        defaultPageSize={10}
        pageSizeOptions={[10, 20, 50]}
        minTableWidth="1600px"
        onRowClick={handleViewProject}
        bordered={false}
        stickyFirstColumn
        stickyLastColumn
        lastStickyColumnWidth="5rem"
      />

      <Dialog open={Boolean(assigningProject)} onOpenChange={(open) => !open && setAssigningProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              {isReassign ? t("projects.changePersonTitle") : t("projects.assignDialogTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg text-xs space-y-1">
              <p className="text-muted-foreground font-medium">{t("projects.customerProject")}</p>
              <p className="text-foreground font-bold text-sm">{assigningProject?.name}</p>
              {assigningProject?.phone && <p className="text-muted-foreground">SĐT: {assigningProject.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">{t("projects.selectSales")}</Label>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {salesPeople.map((sale) => (
                  <label
                    key={sale}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      selectedSaleName === sale
                        ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "border-border bg-card hover:bg-muted text-foreground"
                    }`}
                    onClick={() => setSelectedSaleName(sale)}
                  >
                    <input
                      type="radio"
                      name="saleChoice"
                      checked={selectedSaleName === sale}
                      onChange={() => setSelectedSaleName(sale)}
                      className="w-4 h-4 text-primary accent-primary"
                    />
                    <span>{sale}</span>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedSaleName === "custom"
                      ? "border-primary bg-primary/10 font-semibold text-foreground"
                      : "border-border bg-card hover:bg-muted text-foreground"
                  }`}
                  onClick={() => setSelectedSaleName("custom")}
                >
                  <input
                    type="radio"
                    name="saleChoice"
                    checked={selectedSaleName === "custom"}
                    onChange={() => setSelectedSaleName("custom")}
                    className="w-4 h-4 text-primary accent-primary"
                  />
                  <span>{t("projects.otherStaff")}</span>
                </label>

                {selectedSaleName === "custom" && (
                  <div className="pt-1">
                    <Input
                      type="text"
                      value={customSaleName}
                      onChange={(e) => setCustomSaleName(e.target.value)}
                      placeholder={t("projects.otherStaffPlaceholder")}
                      className="h-9 text-xs bg-background"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Ghi chú phân việc */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{t("projects.taskNotesLabel")}</Label>
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

          <DialogFooter className="pt-4 border-t border-border gap-2 sm:gap-0">
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
              onClick={handleConfirmGiaoXong}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              {t("projects.confirmAssignDone")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(careProject)} onOpenChange={(open) => !open && setCareProject(null)}>
        <DialogContent className="flex h-[85vh] max-h-[85vh] w-[94vw] max-w-6xl flex-col overflow-hidden p-0">
          <div className="h-full min-h-0 w-full min-w-0 overflow-hidden px-6 pb-6 pt-10">
            {careProject && (
              <CustomerCarePage
                projectId={careProject.id}
                customerName={careProject.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "view"} onOpenChange={() => dialogMode === "view" && handleCloseDialog()}>
        <DialogContent className="sm:max-w-3xl w-[92vw] max-h-[85vh] p-0 rounded-xl overflow-hidden [&>button]:hidden">
          {selectedProject && <ProjectForm project={selectedProject} mode="view" onSave={handleSaveProject} onCancel={handleCloseDialog} />}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "create" || dialogMode === "edit" || dialogMode === "copy"} onOpenChange={() => (dialogMode === "create" || dialogMode === "edit" || dialogMode === "copy") && handleCloseDialog()}>
        <DialogContent className="sm:max-w-3xl w-[92vw] max-h-[85vh] p-0 rounded-xl overflow-hidden [&>button]:hidden">
          <ProjectForm
            project={selectedProject || undefined}
            mode={selectedProject ? (dialogMode as "create" | "edit" | "copy") : "create"}
            onSave={handleSaveProject}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
