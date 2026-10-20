import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputField, SelectField, TextareaField } from "@/components/ui/form-fields"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DocumentFolder, ProjectTask } from "@/types/project"
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/utils/taskLabels"

import {
  CalendarIcon,
  Save,
  X,
  Plus,
  Trash2,
  Building,
  MapPin,
  Users,
  DollarSign,
  Pencil
} from "lucide-react"
import { Project, ProjectTemplate, ProjectPhase } from "@/types/project"
import { useProjectTemplates } from "@/hooks/project/useProjectsTemplates"
import { CapitalProject, DesignStepsField, FieldProject, ProjectGroupField } from "@/components/ui/CreatableSelectFieldProps"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { ProjectFormProps } from "@/types/ProjectFormProps"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/i18n/LocaleContext"

//img
import folderIcon from "@/assets/img/ic_folder.png";
import { getEmployees } from "@/services/EmployeeService"

const INDUSTRY_OPTIONS = [
  "Gia dụng, hàng tiêu dùng",
  "Máy móc công nghiệp",
  "Đồ chơi trẻ em",
  "Đồ decor, mô hình trang trí",
  "Thiết bị âm thanh ánh sáng",
  "Thiết bị vệ sinh, nội thất",
  "Vật liệu xây dựng",
  "Thời trang, vải cuốn",
  "Cơ khí, kim khí",
  "Phụ tùng xe",
  "Hóa chất mỹ phẩm",
]

const LEAD_SOURCE_OPTIONS = ["Marketing", "KH giới thiệu", "Sale tự tìm kiếm", "Khác"]

type SalesOption = { id: string; label: string }

type RequiredProjectField = "name" | "phone" | "category"


export function ProjectForm({ project, onSave, onCancel, mode }: ProjectFormProps) {
  const { t } = useLocale()
  const isViewMode = mode === "view"
  const { projectTemplates, loading } = useProjectTemplates()
  const [expandedPhases, setExpandedPhases] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false)
  const [currentPhaseId, setCurrentPhaseId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null)
  const [newCompanyName, setNewCompanyName] = useState("")
  const [salesOptions, setSalesOptions] = useState<SalesOption[]>([])
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [formErrors, setFormErrors] = useState<Partial<Record<RequiredProjectField, string>>>({})

  // xác định quyền admin từ custom claims
  const [newTask, setNewTask] = useState<Partial<ProjectTask>>({
    name: "",
    description: "",
    status: "not_started",
    priority: "medium",
    progress: 0,
    legalBasis: "",
    assignUser: "",
    documentsTask: []
  })
  const [newPhase, setNewPhase] = useState<Partial<ProjectPhase>>({
    name: "",
    description: "",
    order: 1,
    status: "not_started",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    legalBasis: "",
    tasks: [],
    documentProjectPhase: []
  })
  const [documents, setDocuments] = useState<DocumentFolder[]>([])

  const [formData, setFormData] = useState<Partial<Project>>({
    name: "",
    description: "",
    status: "planning",
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    teamSize: 1,
    budget: 0,
    manager: "",
    location: "",
    category: "",
    phases: [],
    tasks: [],
    investmentLevel: "",
    investmentApproval: "",
    projectGroup: "",
    investor: "",
    investmentType: "",
    managementType: "",
    projectScale: "",
    designStepCount: 1,
    designCapacity: "",
    approvalDate: "",
    legalDocuments: [],
    constructionLevel: "",
    constructionType: "",
    designStandards: "",
    goals: "",
    syntheticMethod: "",
    notes: "",
    numberTBMT: "",
    timeExceution: "",
    contrator: "",
    contractorPrice: 0,
    relatedDocuments: [],
    roleExecutor: "",
    capitalProject: "",
    field: "",
    documentFolder: [],
    milestones: [],
    phone: "",
    email: "",
    leadSource: "",
    salesOwnerId: "",
  })
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)

  const [newFolderName, setNewFolderName] = useState("")

  const removeFolderById = (folders: DocumentFolder[], targetId: string): DocumentFolder[] => {
    return folders
      .filter(f => f.id !== targetId)
      .map(f => ({ ...f, subfolders: removeFolderById(f.subfolders, targetId) }))
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }

  useEffect(() => {
    if (project && (mode === "edit" || mode === "copy" || mode === "view")) {
      setFormData({
        ...project,
        phases: project.phases?.map((phase) => ({
          ...phase,
          id: mode === "copy" ? `phase-${Date.now()}-${Math.random()}` : phase.id,
          tasks: phase.tasks.map((task) => ({
            ...task,
            id: mode === "copy" ? `task-${Date.now()}-${Math.random()}` : task.id,
          })),
        })),
        tasks: project.tasks?.map((task) => ({
          ...task,
          id: mode === "copy" ? `task-${Date.now()}-${Math.random()}` : task.id,
        })),
        id: mode === "edit" ? project.id : undefined,
        documentFolder: project.documentFolder || [],
      });
      setDocuments(project.documentFolder || []);
      setActiveTab("basic");
    }
  }, [project, mode]);

  useEffect(() => {
    let active = true

    const loadSales = async () => {
      try {
        const employees = await getEmployees()
        if (!active) return
        setSalesOptions(
          employees.map((item) => ({
            id: item.id,
            label: item.fullName || item.email || item.id,
          })),
        )
      } catch {
        if (active) setSalesOptions([])
      } finally {
        if (active) setIsLoadingSales(false)
      }
    }

    loadSales()
    return () => { active = false }
  }, [])

  const handleInputChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (field in formErrors && value) {
      setFormErrors((prev) => ({ ...prev, [field as RequiredProjectField]: undefined }))
    }
  }

  const togglePhaseTasks = (phaseId: string) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    )
  }

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template)
    const phases = template.phases.map((phase, index) => ({
      ...phase,
      id: `phase-${Date.now()}-${index}`,
      tasks: phase.tasks.map((task, taskIndex) => ({
        ...task,
        id: `task-${Date.now()}-${index}-${taskIndex}`,
        phaseId: `phase-${Date.now()}-${index}`
      }))
    }))
    const tasks = phases.flatMap(phase => phase.tasks)
    setFormData(prev => ({
      ...prev,
      name: prev.name || template.name,
      category: template.category,
      phases,
      tasks
    }))
    setActiveTab("phases")
  }

  const handleTaskSubmit = async () => {
    const taskData: ProjectTask = {
      id: editingTask ? editingTask.id : `task-${Date.now()}-${Math.random()}`,
      name: newTask.name || "",
      description: newTask.description || "",
      status: newTask.status || "not_started",
      priority: newTask.priority || "medium",
      progress: newTask.progress || 0,
      legalBasis: newTask.legalBasis || "",
      documentsTask: newTask.documentsTask || [],
      assignUser: newTask.assignUser || "",
      assignee: newTask.assignee || "",
      startDate: newTask.startDate || null,
      endDate: newTask.endDate || null,
      dependencies: newTask.dependencies || []

    }

    const updatedPhases = formData.phases?.map(phase => {
      if (phase.id === currentPhaseId) {
        const updatedTasks = editingTask
          ? phase.tasks.map(t => t.id === editingTask.id ? taskData : t)
          : [...phase.tasks, taskData]
        return { ...phase, tasks: updatedTasks }
      }
      return phase
    })

    const updatedTasks = editingTask
      ? formData.tasks?.map(t => t.id === editingTask.id ? taskData : t)
      : [...(formData.tasks || []), taskData]

    setFormData(prev => ({
      ...prev,
      phases: updatedPhases,
      tasks: updatedTasks
    }))

    setIsTaskDialogOpen(false)
    resetTaskForm()
  }

  const resetTaskForm = () => {
    setNewTask({
      name: "",
      description: "",
      status: "not_started",
      priority: "medium",
      progress: 0,
      legalBasis: "",
      documentsTask: []
    })
    setEditingTask(null)
    setCurrentPhaseId(null)
  }

  const handlePhaseSubmit = () => {
    const phaseData: ProjectPhase = {
      id: editingPhase ? editingPhase.id : `phase-${Date.now()}-${Math.random()}`,
      name: newPhase.name || "",
      description: newPhase.description || "",
      order: newPhase.order || 1,
      status: newPhase.status || "not_started",
      startDate: newPhase.startDate,
      endDate: newPhase.endDate,
      legalBasis: newPhase.legalBasis || "",
      tasks: editingPhase ? editingPhase.tasks : [],
      documentProjectPhase: editingPhase ? editingPhase.documentProjectPhase : []
    }

    setFormData(prev => ({
      ...prev,
      phases: editingPhase
        ? prev.phases?.map(p => p.id === editingPhase.id ? phaseData : p)
        : [...(prev.phases || []), phaseData]
    }))

    setIsPhaseDialogOpen(false)
    resetPhaseForm()
  }

  const resetPhaseForm = () => {
    setNewPhase({
      name: "",
      description: "",
      order: (formData.phases?.length || 0) + 1,
      status: "not_started",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      legalBasis: "",
      tasks: [],
      documentProjectPhase: []
    })
    setEditingPhase(null)
  }

  const handleAddTask = (phaseId: string) => {
    setCurrentPhaseId(phaseId)
    setEditingTask(null)
    setNewTask({
      name: "",
      description: "",
      status: "not_started",
      priority: "medium",
      progress: 0,
      legalBasis: "",
      documentsTask: []
    })
    setIsTaskDialogOpen(true)
  }

  const handleEditTask = (task: ProjectTask, phaseId: string) => {
    setEditingTask(task)
    setNewTask(task)
    setCurrentPhaseId(phaseId)
    setIsTaskDialogOpen(true)
  }

  const handleEditPhase = (phase: ProjectPhase) => {
    setEditingPhase(phase)
    setNewPhase({
      name: phase.name,
      description: phase.description,
      order: phase.order,
      status: phase.status,
      startDate: phase.startDate,
      endDate: phase.endDate,
      legalBasis: phase.legalBasis,
      tasks: phase.tasks,
      documentProjectPhase: phase.documentProjectPhase
    })
    setIsPhaseDialogOpen(true)
  }

  const requiredFields: Array<[RequiredProjectField, string]> = [
      ["name", t("projects.fieldRequired")],
      ["phone", t("projects.fieldRequired")],
      ["category", t("projects.fieldRequired")],
  ]

  const validateFields = (fields: RequiredProjectField[]) => {
    const errors = requiredFields.reduce<Partial<Record<RequiredProjectField, string>>>(
      (result, [field, message]) => {
        const value = String(formData[field] ?? "").trim()
        if (fields.includes(field) && !value) {
          result[field] = message
        }
        return result
      },
      {}
    )

    setFormErrors(errors)
    setSaveError("")
    const firstInvalidField = fields.find((field) => errors[field])
    if (firstInvalidField) {
      const element = document.getElementById(`project-${firstInvalidField}`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
      window.setTimeout(() => element?.focus(), 250)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    if (!validateFields(["name", "phone", "category"])) return

    const projectData = {
      ...formData,
      documentFolder: documents,
      ...(mode === "edit" && { id: project?.id }),
      createdAt: mode === "create" ? new Date().toISOString() : project?.createdAt,
      updatedAt: new Date().toISOString()
    } as Omit<Project, "id"> | Project

    setIsSaving(true)
    try {
      await onSave(projectData)
    } catch (error) {
      console.error("Không thể lưu dự án:", error)
      setSaveError(t("projects.saveFailed"))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddFolder = () => {
    const folder: DocumentFolder = {
      id: `folder-${Date.now()}-${Math.random()}`,
      name: newFolderName,
      subfolders: [],
      files: []
    }

    const next =
      currentFolderId
        ? updateFolder(documents, currentFolderId, folder)
        : [...documents, folder]

    setDocuments(next)
    setFormData(prev => ({ ...prev, documentFolder: next }))

    setNewFolderName("")
    setIsFolderDialogOpen(false)
  }


  const updateFolder = (folders: DocumentFolder[], parentId: string, newFolder: DocumentFolder): DocumentFolder[] => {
    return folders.map(folder => {
      if (folder.id === parentId) {
        return { ...folder, subfolders: [...folder.subfolders, newFolder] }
      }
      return { ...folder, subfolders: updateFolder(folder.subfolders, parentId, newFolder) }
    })
  }

  const renderFolderTree = (folders: DocumentFolder[]) => {
    return folders.map(folder => {
      const isExpanded = expandedFolders.includes(folder.id)

      return (
        <div key={folder.id} className="ml-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              className="flex items-center gap-1"
              onClick={() => toggleFolder(folder.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <img src={folderIcon} alt="" className="w-6 h-6" />

              <span className="font-medium">{folder.name}</span>
            </button>

            {!isViewMode && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentFolderId(folder.id)
                    setIsFolderDialogOpen(true)
                  }}
                  aria-label="Thêm thư mục con"
                >
                  <Plus className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDocuments(prev => removeFolderById(prev, folder.id))
                    setFormData(prev => ({
                      ...prev,
                      documentFolder: removeFolderById(prev.documentFolder || [], folder.id),
                    }))
                  }}
                  aria-label="Xóa thư mục"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {isExpanded && (
            <>
              {folder.subfolders.length > 0 && renderFolderTree(folder.subfolders)}
            </>
          )}
        </div>
      )
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col max-h-[85vh] overflow-hidden bg-card rounded-xl">
      {/* Header cố định */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0 sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'create' && t("projects.formCreateTitle")}
            {mode === 'edit' && t("projects.formEditTitle")}
            {mode === 'copy' && t("projects.formCopyTitle")}
            {mode === 'view' && t("projects.formViewTitle")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'edit' && t("projects.formEditSubtitle")}
            {mode === 'copy' && t("projects.formCopySubtitle")}
            {mode === 'view' && t("projects.formViewSubtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted [&_svg]:size-6"
          onClick={onCancel}
        >
          <X />
        </Button>
      </div>

      {/* Nội dung form cuộn được */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-card">
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="grid grid-cols-1 gap-5 p-0 md:grid-cols-2">
            <InputField
              label={t("projects.formFullName")}
              required
              id="project-name"
              error={formErrors.name}
              readOnly={isViewMode}
              className="h-11 bg-background read-only:cursor-default"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />

            <InputField
              label={t("projects.formPhone")}
              required
              id="project-phone"
              error={formErrors.phone}
              readOnly={isViewMode}
              type="tel"
              inputMode="tel"
              className="h-11 bg-background read-only:cursor-default"
              value={formData.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />

            <SelectField
              label={t("projects.formCategory")}
              required
              id="project-category"
              error={formErrors.category}
              searchable
              clearable
              disabled={isViewMode}
              triggerClassName="bg-background hover:bg-background disabled:opacity-100"
              placeholder=""
              value={formData.category || ""}
              onValueChange={(value) => handleInputChange("category", value)}
              options={INDUSTRY_OPTIONS}
            />

            <InputField
              label={t("projects.formEmail")}
              id="email"
              readOnly={isViewMode}
              type="email"
              className="h-11 bg-background read-only:cursor-default"
              value={formData.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />

            <SelectField
              label={t("projects.formSource")}
              disabled={isViewMode}
              searchable
              clearable
              containerClassName="md:col-span-2"
              triggerClassName="bg-background hover:bg-background disabled:opacity-100"
              placeholder=""
              value={formData.leadSource || ""}
              onValueChange={(value) => handleInputChange("leadSource", value)}
              options={LEAD_SOURCE_OPTIONS}
            />

            <TextareaField
              label={t("projects.formNotes")}
              id="notes"
              readOnly={isViewMode}
              containerClassName="md:col-span-2"
              value={formData.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="bg-background"
              rows={3}
            />

          </CardContent>
        </Card>

        <Card className="border border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Thư mục dự án</CardTitle>
            {!isViewMode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentFolderId(null)
                  setIsFolderDialogOpen(true)
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Thêm thư mục
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="space-y-1">{renderFolderTree(documents)}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có thư mục.</p>
            )}
          </CardContent>
        </Card>

        <div className="hidden grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Thông Tin Dự Án
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên Dự Án *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nhập tên dự án"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô Tả</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Mô tả chi tiết về dự án"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Địa Điểm</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Địa điểm thực hiện dự án"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng Thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Lập Kế Hoạch</SelectItem>
                    <SelectItem value="active">Đang Hoạt Động</SelectItem>
                    <SelectItem value="on_hold">Tạm Dừng</SelectItem>
                    <SelectItem value="completed">Hoàn Thành</SelectItem>
                    <SelectItem value="cancelled">Đã Hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <CapitalProject
                  value={formData.capitalProject}
                  onChange={(v) => handleInputChange("capitalProject", v)}
                />
              </div>

              <div className="space-y-2">
                <FieldProject
                  value={formData.field}
                  onChange={(v) => handleInputChange("field", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-2">
                  <div className="space-y-2">
                    <Label>
                      Cấp Công Trình <span className="text-red-500">*</span>
                    </Label>
                    <select
                      className="border border-input rounded-md px-3 py-2 w-full bg-background"
                      value={formData.constructionLevel || ""}
                      onChange={(e) => handleInputChange("constructionLevel", e.target.value)}
                    >
                      <option value="">-- Chọn cấp công trình --</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <ProjectGroupField
                      value={formData.projectGroup}
                      onChange={(v) => handleInputChange("projectGroup", v)}
                    />
                  </div>

                  <div className="space-y-2">
                    <DesignStepsField
                      value={formData.designStepCount || 1}
                      onChange={(v) => handleInputChange("designStepCount", v)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cấp QD Chủ Trương Đầu Tư</Label>
                  <Input value={formData.investmentLevel || ""} onChange={(e) => handleInputChange('investmentLevel', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Phê Duyệt Quyết Định Đầu Tư</Label>
                  <Input value={formData.investmentApproval || ""} onChange={(e) => handleInputChange('investmentApproval', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Chủ Đầu Tư</Label>
                  <Input value={formData.investor || ""} onChange={(e) => handleInputChange('investor', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Hình Thức Đầu Tư</Label>
                  <Input value={formData.investmentType || ""} onChange={(e) => handleInputChange('investmentType', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Loại Hình Quản Lý</Label>
                  <Input value={formData.managementType || ""} onChange={(e) => handleInputChange('managementType', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Quy Mô Dự Án</Label>
                  <Input value={formData.projectScale || ""} onChange={(e) => handleInputChange('projectScale', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Đơn Vị Thiết Kế</Label>
                  <Input value={formData.designCapacity || ""} onChange={(e) => handleInputChange('designCapacity', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Ngày Lập Quyết Toán</Label>
                  <Input type="date" value={formData.approvalDate || ""} onChange={(e) => handleInputChange('approvalDate', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Loại Công Trình</Label>
                  <Input value={formData.constructionType || ""} onChange={(e) => handleInputChange('constructionType', e.target.value)} />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Phương Pháp Tổng Hợp</Label>
                  <select
                    className="border rounded p-2 w-full"
                    value={formData.syntheticMethod || ""}
                    onChange={(e) => handleInputChange('syntheticMethod', e.target.value)}
                  >
                    <option value="">-- Chọn phương pháp --</option>
                    <option value="Tự tổng hợp">Tự tổng hợp</option>
                    <option value="Tổng hợp từ hệ thống">Tổng hợp từ hệ thống</option>
                    <option value="Tổng hợp từ báo cáo định kỳ">Tổng hợp từ báo cáo định kỳ</option>
                    <option value="Kế thừa dự án trước">Kế thừa dự án trước</option>
                    <option value="Tổng hợp từ nhà thầu">Tổng hợp từ nhà thầu</option>
                    <option value="Tổng hợp từ đơn vị tư vấn">Tổng hợp từ đơn vị tư vấn</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Tiêu Chuẩn Thiết Kế</Label>
                  <Input value={formData.designStandards || ""} onChange={(e) => handleInputChange('designStandards', e.target.value)} />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Mục Tiêu</Label>
                  <Textarea value={formData.goals || ""} onChange={(e) => handleInputChange('goals', e.target.value)} rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Gói Thầu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Số TBMT</Label>
                    <Input
                      value={formData.numberTBMT || ""}
                      onChange={(e) => handleInputChange("numberTBMT", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Thời Gian Thực Hiện</Label>
                    <Input
                      value={formData.timeExceution || ""}
                      onChange={(e) => handleInputChange("timeExceution", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Giá Trúng Thầu (VNĐ) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="contractorPrice"
                        type="number"
                        min="0"
                        value={formData.contractorPrice || 0}
                        onChange={(e) =>
                          handleInputChange("contractorPrice", parseInt(e.target.value))
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Vai Trò Thực Hiện</Label>
                    <Input
                      value={formData.roleExecutor || ""}
                      onChange={(e) => handleInputChange("roleExecutor", e.target.value)}
                    />
                  </div>

                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nhà Thầu</Label>
                    <select
                      className="border rounded p-2 w-full"
                      value={formData.contrator || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleInputChange("contrator", v);
                        setFormData((prev) => ({
                          ...prev,
                          contractorCompanyName:
                            v === "Độc lập"
                              ? [prev.contractorCompanyName?.[0] || ""]
                              : Array.isArray(prev.contractorCompanyName)
                                ? prev.contractorCompanyName.filter(Boolean)
                                : [],
                        }));
                      }}
                    >
                      <option value="">-- Chọn nhà thầu --</option>
                      <option value="Độc lập">Độc lập</option>
                      <option value="Liên danh">Liên danh</option>
                    </select>
                  </div>

                  {formData.contrator === "Liên danh" ? (
                    <div className="space-y-2">
                      <Label>Các Công Ty Liên Danh</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="Nhập tên công ty và nhấn Thêm"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            const name = newCompanyName.trim();
                            if (!name) return;
                            setFormData((prev) => ({
                              ...prev,
                              contractorCompanyName: [
                                ...(prev.contractorCompanyName || []),
                                name,
                              ],
                            }));
                            setNewCompanyName("");
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" /> Thêm
                        </Button>
                      </div>

                      {(formData.contractorCompanyName?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {formData.contractorCompanyName!.map((name, idx) => (
                            <Badge
                              key={`${name}-${idx}`}
                              variant="secondary"
                              className="gap-1"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    contractorCompanyName: (
                                      prev.contractorCompanyName || []
                                    ).filter((_, i) => i !== idx),
                                  }))
                                }
                                aria-label="Xóa công ty"
                                title="Xóa"
                                className="inline-flex"
                              >
                                <X className="w-3 h-3 ml-1" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Tên Công Ty Trúng Thầu</Label>
                      <Input
                        value={formData.contractorCompanyName?.[0] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contractorCompanyName: [e.target.value],
                          }))
                        }
                        placeholder="Nhập tên công ty"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi Tiết Thực Hiện</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày Bắt Đầu</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(new Date(formData.startDate), "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate ? new Date(formData.startDate) : undefined}
                        onSelect={(date) => handleInputChange('startDate', date?.toISOString().split('T')[0])}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ngày Kết Thúc</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(new Date(formData.endDate), "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate ? new Date(formData.endDate) : undefined}
                        onSelect={(date) => handleInputChange('endDate', date?.toISOString().split('T')[0])}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager">Quản Lý Dự Án</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="manager"
                    value={formData.manager || ""}
                    onChange={(e) => handleInputChange('manager', e.target.value)}
                    placeholder="Tên người quản lý dự án"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Quy Mô Nhóm</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="teamSize"
                    type="number"
                    min="1"
                    value={formData.teamSize || 1}
                    onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Ngân Sách (VNĐ)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    value={formData.budget || 0}
                    onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer cố định ở cuối chứa nút Quay lại và Lưu lại / Tạo dự án */}
      <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-border bg-card shrink-0 sticky bottom-0 z-10">
        {saveError && <p className="mr-auto text-sm text-destructive">{saveError}</p>}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-5 font-normal"
        >
          {isViewMode ? t("common.close") : t("common.cancel")}
        </Button>
        {!isViewMode && (
          <Button type="submit" disabled={isSaving} className="px-6 bg-brand-blue hover:bg-brand-blue-hover text-white font-medium shadow-sm">
            {isSaving
              ? t("projects.formSaving")
              : mode === 'edit' ? t("projects.formUpdateSubmit") : t("projects.formCreateSubmit")}
          </Button>
        )}
      </div>

      <Dialog open={isTaskDialogOpen} onOpenChange={(open) => {
        setIsTaskDialogOpen(open)
        if (!open) resetTaskForm()
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Sửa Công Việc' : 'Thêm Công Việc'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">Tên Công Việc *</Label>
              <Input
                id="taskName"
                value={newTask.name || ""}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên công việc"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskName">
                Người thực hiện *
                <br />
                <span className="text-sm block text-red-400">
                  (Chỉ quyền admin mới dùng được chức năng này,
                  nếu quyên nhân viên thì sẽ tự gán tên vào nhiệm vụ)
                </span>
              </Label>
              <Select
                value={newTask.assignUser || ""}                              // ✅ binding giá trị
                onValueChange={(v) =>                                          // ✅ cập nhật state
                  setNewTask((prev) => ({ ...prev, assignUser: v, assignee: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_test_01">Phạm Trường Sơn</SelectItem>
                  <SelectItem value="user_test_02">Phạm Văn Dương</SelectItem>
                  <SelectItem value="user_test_03">Phạm Văn Trung</SelectItem>
                  <SelectItem value="user_test_04">Nguyễn Văn D</SelectItem>
                  <SelectItem value="user_test_05">Trần Thị A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">Mô Tả</Label>
              <Textarea
                id="taskDescription"
                value={newTask.description || ""}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về công việc"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskStatus">Trạng Thái</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({
                      ...prev,
                      status: value as 'not_started' | 'in_progress' | 'completed' | 'blocked'
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Chưa Bắt Đầu</SelectItem>
                    <SelectItem value="in_progress">Đang Thực Hiện</SelectItem>
                    <SelectItem value="completed">Hoàn Thành</SelectItem>
                    <SelectItem value="on_hold">Tạm Dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskPriority">Ưu Tiên</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({
                      ...prev,
                      priority: value as 'low' | 'medium' | 'high' | 'critical'
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung Bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskProgress">Tiến Độ (%)</Label>
              <Input
                id="taskProgress"
                type="number"
                min="0"
                max="100"
                value={newTask.progress || 0}
                onChange={(e) => setNewTask(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskLegalBasis">Cơ Sở Pháp Lý</Label>
              <Input
                id="taskLegalBasis"
                value={newTask.legalBasis || ""}
                onChange={(e) => setNewTask(prev => ({ ...prev, legalBasis: e.target.value }))}
                placeholder="Nhập cơ sở pháp lý (nếu có)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsTaskDialogOpen(false)
                resetTaskForm()
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleTaskSubmit}
              disabled={!newTask.name}
            >
              {editingTask ? 'Cập Nhật' : 'Thêm Công Việc'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhaseDialogOpen} onOpenChange={(open) => {
        setIsPhaseDialogOpen(open)
        if (!open) resetPhaseForm()
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPhase ? 'Sửa Giai Đoạn' : 'Thêm Giai Đoạn'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phaseName">Tên Giai Đoạn *</Label>
              <Input
                id="phaseName"
                value={newPhase.name || ""}
                onChange={(e) => setNewPhase(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên giai đoạn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phaseDescription">Mô Tả</Label>
              <Textarea
                id="phaseDescription"
                value={newPhase.description || ""}
                onChange={(e) => setNewPhase(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về giai đoạn"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phaseOrder">Thứ Tự</Label>
              <Input
                id="phaseOrder"
                type="number"
                min="1"
                value={newPhase.order || 1}
                onChange={(e) => setNewPhase(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phaseLegalBasis">Cơ Sở Pháp Lý</Label>
              <Input
                id="phaseLegalBasis"
                value={newPhase.legalBasis || ""}
                onChange={(e) => setNewPhase(prev => ({ ...prev, legalBasis: e.target.value }))}
                placeholder="Nhập cơ sở pháp lý (nếu có)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPhaseDialogOpen(false)
                resetPhaseForm()
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handlePhaseSubmit}
              disabled={!newPhase.name}
            >
              {editingPhase ? 'Cập Nhật' : 'Thêm Giai Đoạn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Thư Mục</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Tên Thư Mục *</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nhập tên thư mục"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleAddFolder}
              disabled={!newFolderName}
            >
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
