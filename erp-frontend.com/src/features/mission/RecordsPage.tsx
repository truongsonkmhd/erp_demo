import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "@/services/auth/AuthContext"
import { canAccess } from "@/lib/permissions"
import { toast } from "sonner"
import {
  FolderKanban,
  GitBranch,
  Users2,
  Receipt,
  Plus,
  Pencil,
  Trash2,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  Ban,
  FileSpreadsheet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  PageShell,
  Panel,
  money,
  useMissionPermission,
  validPeriod,
  nonNegative,
} from "./ui"
import {
  useMissionData,
  upsertMission,
  removeMission,
  uid,
  type Mission,
  type WorkNode,
  type NodeKind,
  type MissionKind,
  type MissionStatus,
  type ResponsibilityAssignment,
  type ResponsibilityLevel,
  KIND_LABELS,
  STATUS_LABELS,
  LEVEL_LABELS,
  NODE_KIND_LABELS,
} from "./store"
import BoardPage from "./BoardPage"
import { ancestorIds, readWorkspaceLocation, type WorkspaceTab } from "./workspace-state"

const blankMission = (): Mission => ({
  id: "",
  code: "",
  name: "",
  decisionNumber: "",
  target: "",
  kind: "state",
  fundingSource: "Ngân sách Nhà nước",
  budget: 0,
  revenue: 0,
  settlement: 0,
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
  owner: "",
  department: "",
  acceptance: "Chưa nghiệm thu",
  status: "in_progress",
  classificationHistory: [],
})

const blankNode = (missionId: string, parentId: string | null = null, kind: NodeKind = "project"): WorkNode => ({
  id: "",
  missionId,
  parentId,
  kind,
  wbsCode: "",
  name: "",
  quantity: 1,
  unit: kind === "project" ? "Dự án" : kind === "item" ? "Hạng mục" : "km tuyến",
  unitPrice: 0,
  cost: 0,
  revenue: 0,
  requiredSkill: "Khảo sát địa vật lý",
  department: "",
  assignee: "",
  fundingSource: "Ngân sách",
  dueDate: "",
})

export default function RecordsPage() {
  const data = useMissionData()
  const { user } = useAuth()
  const allowed = useMissionPermission("ho-so-nhiem-vu")
  const canViewBoard = canAccess(user, "ke-hoach-nhiem-vu-du-an/bang-cong-viec")
  const [searchParams, setSearchParams] = useSearchParams()
  const location = readWorkspaceLocation(searchParams.toString(), data.missions)
  const activeTab = !allowed("access") && ["wbs", "responsibility", "finance"].includes(location.tab) ? "overview" : location.tab
  const selectedMissionId = location.missionId || ""
  const openMission = (id: string, tab: WorkspaceTab = "overview") => {
    setSearchParams(id ? { mission: id, tab } : {})
  }
  const setSelectedMissionId = (id: string) => openMission(id)
  const setActiveTab = (tab: WorkspaceTab) => openMission(selectedMissionId, tab)

  // State
  const [focusedWorkId, setFocusedWorkId] = useState<string | null>(null)
  const [highlightedWorkId, setHighlightedWorkId] = useState<string | null>(null)
  useEffect(() => {
    if (activeTab !== "wbs" || !highlightedWorkId) return
    const frame = requestAnimationFrame(() => document.getElementById(`wbs-node-${highlightedWorkId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }))
    return () => cancelAnimationFrame(frame)
  }, [activeTab, highlightedWorkId])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterKind, setFilterKind] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Dialogs
  const [missionDialogOpen, setMissionDialogOpen] = useState(false)
  const [missionForm, setMissionForm] = useState<Mission>(blankMission)

  const [classificationDialogOpen, setClassificationDialogOpen] = useState(false)
  const [changeKindTarget, setChangeKindTarget] = useState<Mission | null>(null)
  const [newKind, setNewKind] = useState<MissionKind>("state")
  const [changeKindReason, setChangeKindReason] = useState("")

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false)
  const [nodeForm, setNodeForm] = useState<WorkNode>(() => blankNode(selectedMissionId))

  const [respDialogOpen, setRespDialogOpen] = useState(false)
  const [respForm, setRespForm] = useState<Partial<ResponsibilityAssignment>>({
    level: "lead_investigator",
    officerName: "",
    officerRole: "",
    unitName: "",
    fromDate: new Date().toISOString().split("T")[0],
    status: "active",
    notes: "",
  })

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "node-1": true, "node-1-1": true })
  const [respFilter, setRespFilter] = useState<"all" | "active" | "history">("all")

  // Selected mission and nodes
  const currentMission = useMemo(() => {
    return data.missions.find((m) => m.id === selectedMissionId) || null
  }, [data.missions, selectedMissionId])

  const currentNodes = useMemo(() => {
    if (!currentMission) return []
    return data.nodes.filter((n) => n.missionId === currentMission.id)
  }, [data.nodes, currentMission])

  const currentResponsibilities = useMemo(() => {
    if (!currentMission) return []
    return (data.responsibilities || []).filter((r) => r.missionId === currentMission.id)
  }, [data.responsibilities, currentMission])

  // Filtered missions for list
  const filteredMissions = useMemo(() => {
    return data.missions.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.department.toLowerCase().includes(searchTerm.toLowerCase())
      const matchKind = filterKind === "all" || m.kind === filterKind
      const matchStatus = filterStatus === "all" || (m.status || "in_progress") === filterStatus
      return matchSearch && matchKind && matchStatus
    })
  }, [data.missions, searchTerm, filterKind, filterStatus])

  // Tree computation
  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  // Statistics
  const stats = useMemo(() => {
    const totalMissions = data.missions.length
    const totalBudget = data.missions.reduce((sum, m) => sum + (m.budget || 0), 0)
    const stateCount = data.missions.filter((m) => m.kind === "state").length
    const publicCount = data.missions.filter((m) => m.kind === "public").length
    const serviceCount = data.missions.filter((m) => m.kind === "service").length
    const totalNodes = data.nodes.length
    return { totalMissions, totalBudget, stateCount, publicCount, serviceCount, totalNodes }
  }, [data.missions, data.nodes])

  // Handlers - Mission (UC-01)
  const handleOpenCreateMission = () => {
    setMissionForm(blankMission())
    setMissionDialogOpen(true)
  }

  const handleOpenEditMission = (m: Mission) => {
    setMissionForm({ ...m })
    setMissionDialogOpen(true)
  }

  const handleSaveMission = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed(missionForm.id ? "update" : "create")) {
      toast.error("Bạn không có quyền thực hiện thao tác này")
      return
    }
    if (!missionForm.code.trim() || !missionForm.name.trim() || !missionForm.owner.trim() || !missionForm.department.trim()) {
      toast.error("Vui lòng điền đầy đủ: Mã số, Tên nhiệm vụ, Chủ nhiệm và Đơn vị chủ trì")
      return
    }
    // Check duplicate code
    const isDuplicate = data.missions.some(
      (m) => m.code.toLowerCase() === missionForm.code.trim().toLowerCase() && m.id !== missionForm.id
    )
    if (isDuplicate) {
      toast.error("Mã nhiệm vụ / đề án đã tồn tại trong hệ thống")
      return
    }
    if (!validPeriod(missionForm.startDate, missionForm.endDate)) {
      toast.error("Thời gian không hợp lệ: Ngày bắt đầu phải trước ngày kết thúc")
      return
    }
    if (!nonNegative(missionForm.budget, missionForm.revenue, missionForm.settlement)) {
      toast.error("Số tiền ngân sách / dự toán không được mang giá trị âm")
      return
    }

    const id = missionForm.id || uid()
    const savedMission: Mission = {
      ...missionForm,
      id,
      code: missionForm.code.trim(),
      name: missionForm.name.trim(),
      classificationHistory: missionForm.classificationHistory || [],
    }

    upsertMission("missions", savedMission)
    setSelectedMissionId(id)
    setMissionDialogOpen(false)
    toast.success(missionForm.id ? "Đã cập nhật hồ sơ nhiệm vụ thành công" : "Đã tạo mới hồ sơ nhiệm vụ thành công")
  }

  // Handlers - Phân loại hoạt động (UC-02)
  const handleOpenChangeKind = (m: Mission) => {
    setChangeKindTarget(m)
    setNewKind(m.kind)
    setChangeKindReason("")
    setClassificationDialogOpen(true)
  }

  const handleSaveChangeKind = (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeKindTarget) return
    if (!allowed("update")) {
      toast.error("Bạn không có quyền sửa phân loại hoạt động")
      return
    }
    if (newKind === changeKindTarget.kind) {
      toast.info("Nhóm hoạt động mới trùng với nhóm hiện tại")
      setClassificationDialogOpen(false)
      return
    }
    if (!changeKindReason.trim()) {
      toast.error("Quy tắc nghiệp vụ UC-02: Bắt buộc phải nhập lý do khi thay đổi phân loại hoạt động")
      return
    }

    const auditEntry = {
      id: uid(),
      fromKind: changeKindTarget.kind,
      toKind: newKind,
      reason: changeKindReason.trim(),
      changedBy: "Người quản trị",
      changedAt: new Date().toLocaleString("vi-VN"),
    }

    const updated: Mission = {
      ...changeKindTarget,
      kind: newKind,
      classificationHistory: [...(changeKindTarget.classificationHistory || []), auditEntry],
    }

    upsertMission("missions", updated)
    setClassificationDialogOpen(false)
    toast.success(`Đã chuyển phân loại sang "${KIND_LABELS[newKind].label}" và lưu vết lịch sử`)
  }

  // Handlers - Close/Cancel Mission (UC-01 Rule)
  const handleCancelMission = (m: Mission) => {
    if (!allowed("update")) {
      toast.error("Bạn không có quyền cập nhật trạng thái nhiệm vụ")
      return
    }
    const reason = window.prompt(`Quy tắc UC-01: Không xóa hồ sơ đã phát sinh thực hiện.\nNhập lý do ĐÓNG/HỦY nhiệm vụ "${m.code}":`)
    if (reason === null) return
    if (!reason.trim()) {
      toast.error("Vui lòng nêu rõ lý do đóng/hủy hồ sơ")
      return
    }

    const updated: Mission = {
      ...m,
      status: "cancelled",
      cancelReason: reason.trim(),
    }
    upsertMission("missions", updated)
    toast.success(`Hồ sơ ${m.code} đã được chuyển sang trạng thái Đã đóng/hủy`)
  }

  const handleDeleteMissionSafely = (m: Mission) => {
    if (!allowed("delete")) {
      toast.error("Bạn không có quyền xóa hồ sơ")
      return
    }
    const linkedNodes = data.nodes.filter((n) => n.missionId === m.id)
    const linkedPlans = data.plans.filter((p) => p.missionId === m.id)
    const linkedProgress = data.progress.filter((p) => p.missionId === m.id)

    if (linkedNodes.length > 0 || linkedPlans.length > 0 || linkedProgress.length > 0) {
      toast.error(
        `Không thể xóa vật lý hồ sơ ${m.code} vì đã có ${linkedNodes.length} cấp công việc WBS hoặc kế hoạch/tiến độ. Hãy dùng chức năng Đóng/Hủy để lưu vết.`
      )
      return
    }

    if (window.confirm(`Xác nhận xóa hẳn hồ sơ ${m.code} - ${m.name}?`)) {
      removeMission("missions", m.id)
      if (selectedMissionId === m.id) {
        setSelectedMissionId("")
      }
      toast.success("Đã xóa hồ sơ")
    }
  }

  // Handlers - WBS Nodes (UC-03)
  const handleOpenAddNode = (parentId: string | null = null, kind: NodeKind = "project") => {
    if (!currentMission) {
      toast.error("Vui lòng chọn một nhiệm vụ trước")
      return
    }
    setNodeForm(blankNode(currentMission.id, parentId, kind))
    setNodeDialogOpen(true)
  }

  const handleOpenEditNode = (n: WorkNode) => {
    setNodeForm({ ...n })
    setNodeDialogOpen(true)
  }

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed(nodeForm.id ? "update" : "create")) {
      toast.error("Bạn không có quyền thao tác cấu trúc WBS")
      return
    }
    if (!nodeForm.name.trim() || !nodeForm.department.trim() || !nodeForm.assignee.trim()) {
      toast.error("Vui lòng nhập tên công việc, đơn vị thực hiện và cán bộ phụ trách")
      return
    }
    if (nodeForm.kind !== "project" && !nodeForm.parentId) {
      toast.error("Vui lòng chọn cấp cha cho phần tử WBS này")
      return
    }

    const calculatedCost = (nodeForm.quantity || 0) * (nodeForm.unitPrice || 0)
    const cost = nodeForm.cost > 0 ? nodeForm.cost : calculatedCost

    const savedNode: WorkNode = {
      ...nodeForm,
      id: nodeForm.id || uid(),
      missionId: currentMission!.id,
      name: nodeForm.name.trim(),
      cost,
    }

    upsertMission("nodes", savedNode)
    if (savedNode.parentId) {
      setExpandedNodes((prev) => ({ ...prev, [savedNode.parentId!]: true }))
    }
    setNodeDialogOpen(false)
    toast.success("Đã lưu phần tử cấu trúc công việc WBS")
  }

  const handleDeleteNodeSafely = (node: WorkNode) => {
    if (!allowed("delete")) {
      toast.error("Bạn không có quyền xóa phần tử WBS")
      return
    }
    const hasChildren = data.nodes.some((n) => n.parentId === node.id)
    if (hasChildren) {
      toast.error(`Không thể xóa "${node.name}" vì đang chứa các cấp công việc con bên dưới. Hãy xóa các cấp con trước.`)
      return
    }
    const hasPlans = data.plans.some((p) => p.nodeId === node.id)
    const hasProgress = data.progress.some((p) => p.nodeId === node.id)
    if (hasPlans || hasProgress) {
      toast.error(`Không thể xóa "${node.name}" vì đã lập kế hoạch hoặc phát sinh số liệu thực hiện.`)
      return
    }

    if (window.confirm(`Xác nhận xóa phần tử WBS: ${node.name}?`)) {
      removeMission("nodes", node.id)
      toast.success("Đã xóa phần tử WBS")
    }
  }

  // Handlers - Responsibility Chain (UC-04)
  const handleOpenAddResp = () => {
    setRespForm({
      level: "field_officer",
      officerName: "",
      officerRole: "",
      unitName: currentMission?.department || "",
      fromDate: new Date().toISOString().split("T")[0],
      status: "active",
      notes: "",
    })
    setRespDialogOpen(true)
  }

  const handleSaveResp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentMission) return
    if (!respForm.officerName?.trim() || !respForm.unitName?.trim() || !respForm.fromDate) {
      toast.error("Vui lòng nhập tên cán bộ, đơn vị và ngày bắt đầu hiệu lực")
      return
    }

    const newAssignment: ResponsibilityAssignment = {
      id: uid(),
      missionId: currentMission.id,
      level: respForm.level as ResponsibilityLevel,
      officerName: respForm.officerName.trim(),
      officerRole: respForm.officerRole?.trim() || LEVEL_LABELS[respForm.level as ResponsibilityLevel].label,
      unitName: respForm.unitName.trim(),
      fromDate: respForm.fromDate,
      toDate: respForm.toDate || null,
      status: (respForm.status as "active" | "transferred" | "expired") || "active",
      notes: respForm.notes?.trim() || "",
    }

    const currentList = data.responsibilities || []
    upsertMission("responsibilities", newAssignment)
    setRespDialogOpen(false)
    toast.success("Đã cập nhật phân công trong chuỗi trách nhiệm")
  }

  // Tree render helpers
  const projectNodes = currentNodes.filter((n) => !n.parentId || n.kind === "project" || !currentNodes.some((p) => p.id === n.parentId))
  const getChildren = (parentId: string) => currentNodes.filter((n) => n.parentId === parentId)

  // Total cost rollup
  const totalWbsCost = useMemo(() => {
    const rootItems = currentNodes.filter((n) => !n.parentId)
    return rootItems.length > 0
      ? rootItems.reduce((sum, n) => sum + (n.cost || 0), 0)
      : currentNodes.reduce((sum, n) => sum + (n.cost || 0), 0)
  }, [currentNodes])

  return (
    <PageShell
      title="Nhiệm vụ & công việc"
      subtitle="Chọn một nhiệm vụ để xem hồ sơ, cấu trúc công việc, tiến độ Kanban và tài chính cùng ngữ cảnh."
      hideHeader
    >
      {!currentMission && (
      /* KPI Overview Cards */
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hồ sơ nhiệm vụ</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.totalMissions}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{stats.stateCount} Nhà nước</span> · <span>{stats.publicCount} Sự nghiệp</span> · <span>{stats.serviceCount} Dịch vụ</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng kinh phí dự toán</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {money(stats.totalBudget)} <span className="text-sm font-normal text-muted-foreground">đ</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Kinh phí được phê duyệt toàn Liên đoàn</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phân rã công việc WBS</span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <GitBranch className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.totalNodes}</p>
          <p className="mt-1 text-xs text-muted-foreground">Tổng số phần tử phân rã 5 cấp</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Công việc trên Kanban</span>
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{data.nodes.filter((node) => node.kind === "work").length}</p>
          <p className="mt-1 text-xs text-muted-foreground">Chọn nhiệm vụ để xem bảng tiến độ</p>
        </div>
      </div>
      )}

      {currentMission && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <Button variant="ghost" size="sm" className="mb-3 gap-1 px-0 text-muted-foreground" onClick={() => openMission("")}>
            <ChevronRight className="h-4 w-4 rotate-180" /> Tất cả nhiệm vụ
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{currentMission.code}</span>
                <Badge variant="outline" className={KIND_LABELS[currentMission.kind].badge}>{KIND_LABELS[currentMission.kind].label}</Badge>
                <Badge variant="outline" className={STATUS_LABELS[currentMission.status || "in_progress"].badge}>{STATUS_LABELS[currentMission.status || "in_progress"].label}</Badge>
              </div>
              <h2 className="mt-2 text-xl font-bold">{currentMission.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">Chủ nhiệm: {currentMission.owner || "Chưa gán"} · Đơn vị: {currentMission.department || "Chưa gán"} · {currentMission.startDate} → {currentMission.endDate}</p>
            </div>
            {allowed("update") && <Button variant="outline" size="sm" onClick={() => handleOpenEditMission(currentMission)}><Pencil className="mr-2 h-4 w-4" />Sửa hồ sơ</Button>}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkspaceTab)} className="space-y-4">
        {currentMission && <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border bg-muted/60 p-1">
          <TabsTrigger value="overview" className="gap-2 text-sm">Tổng quan</TabsTrigger>
          {allowed("access") && <TabsTrigger value="wbs" className="gap-2 text-sm"><GitBranch className="h-4 w-4" />Cấu trúc & phân công</TabsTrigger>}
          {canViewBoard && <TabsTrigger value="kanban" className="gap-2 text-sm"><FolderKanban className="h-4 w-4" />Kanban</TabsTrigger>}
          {allowed("access") && <TabsTrigger value="responsibility" className="gap-2 text-sm"><Users2 className="h-4 w-4" />Trách nhiệm</TabsTrigger>}
          {allowed("access") && <TabsTrigger value="finance" className="gap-2 text-sm"><Receipt className="h-4 w-4" />Tài chính</TabsTrigger>}
        </TabsList>}

        <TabsContent value="overview" className="space-y-4">
          {currentMission && <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Hồ sơ"><p className="text-sm">{currentMission.target || "Chưa nhập mục tiêu"}</p><p className="mt-2 text-xs text-muted-foreground">Nguồn vốn: {currentMission.fundingSource || "Chưa nhập"}</p></Panel>
            <Panel title="Công việc"><p className="text-2xl font-bold">{currentNodes.filter((n) => n.kind === "work").length}</p>{canViewBoard && <Button variant="link" className="mt-2 px-0" onClick={() => setActiveTab("kanban")}>Xem bảng Kanban <ArrowRight className="ml-1 h-4 w-4" /></Button>}</Panel>
            <Panel title="Kinh phí"><p className="text-2xl font-bold">{money(currentMission.budget)} đ</p><p className="mt-2 text-xs text-muted-foreground">{currentMission.acceptance}</p></Panel>
          </div>}
          {currentMission && <div className="flex flex-wrap gap-2">
            {allowed("access") && <Button variant="outline" onClick={() => setActiveTab("wbs")}>Xem cấu trúc WBS</Button>}
            {canViewBoard && <Button onClick={() => setActiveTab("kanban")}>Mở Kanban</Button>}
          </div>}
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          {currentMission && canViewBoard && <BoardPage
            embedded
            missionId={currentMission.id}
            focusNodeId={focusedWorkId}
            onDetailDismiss={() => setFocusedWorkId(null)}
            onOpenStructure={allowed("access") ? (node) => {
              setExpandedNodes((previous) => ({ ...previous, ...Object.fromEntries(ancestorIds(currentNodes, node.id).map((id) => [id, true])) }))
              setHighlightedWorkId(node.id)
              setActiveTab("wbs")
            } : undefined}
          />}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 1: HỒ SƠ VÀ PHÂN LOẠI HOẠT ĐỘNG (UC-01 & UC-02) */}
        {/* ========================================================================= */}
        <TabsContent value="missions" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo mã, tên, chủ nhiệm, đơn vị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterKind} onValueChange={setFilterKind}>
                <SelectTrigger className="w-[190px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Nhóm hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhóm hoạt động</SelectItem>
                  <SelectItem value="state">Nhiệm vụ Nhà nước</SelectItem>
                  <SelectItem value="public">Dịch vụ sự nghiệp công</SelectItem>
                  <SelectItem value="service">Dịch vụ áp dụng đơn giá</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                  <SelectItem value="draft">Dự thảo</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy / Đóng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {allowed("create") && (
              <Button onClick={handleOpenCreateMission} className="shrink-0 gap-2">
                <Plus className="h-4 w-4" />
                Lập hồ sơ nhiệm vụ mới
              </Button>
            )}
          </div>

          {/* Missions List Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMissions.map((m) => {
              const isSelected = m.id === selectedMissionId
              const kindConfig = KIND_LABELS[m.kind] || KIND_LABELS.state
              const statusConfig = STATUS_LABELS[m.status || "in_progress"] || STATUS_LABELS.in_progress

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMissionId(m.id)}
                  className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md ${
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "bg-card"
                  }`}
                >
                  <div>
                    {/* Header badge row */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">{m.code}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[11px] font-normal ${kindConfig.badge}`}>
                          {kindConfig.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[11px] font-normal ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Mission Name */}
                    <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
                      {m.name}
                    </h3>

                    {m.decisionNumber && (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        Căn cứ: {m.decisionNumber}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="truncate">{m.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>Chủ nhiệm: <strong className="text-foreground">{m.owner}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{m.startDate} → {m.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Dự toán: <strong className="text-emerald-600 dark:text-emerald-400">{money(m.budget)} đ</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 flex items-center justify-between border-t pt-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-primary gap-1 px-2"
                      onClick={() => {
                        openMission(m.id, "wbs")
                      }}
                    >
                      <span>Xem WBS</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {allowed("update") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 px-2"
                            title="Đổi phân loại hoạt động (UC-02)"
                            onClick={() => handleOpenChangeKind(m)}
                          >
                            <History className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Phân loại</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs px-2"
                            title="Chỉnh sửa hồ sơ"
                            onClick={() => handleOpenEditMission(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}

                      {allowed("update") && m.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 px-2"
                          title="Đóng / Hủy có lý do (UC-01)"
                          onClick={() => handleCancelMission(m)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {allowed("delete") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 px-2"
                          title="Xóa hồ sơ (chỉ khi chưa có dữ liệu)"
                          onClick={() => handleDeleteMissionSafely(m)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredMissions.length === 0 && (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 font-medium">Không tìm thấy hồ sơ nhiệm vụ nào phù hợp</p>
              <p className="text-xs">Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo một hồ sơ mới.</p>
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: CẤU TRÚC PHÂN RÃ CÔNG VIỆC WBS (UC-03) */}
        {/* ========================================================================= */}
        <TabsContent value="wbs" className="space-y-4">
          {currentMission ? (
            <div className="space-y-4">
              {allowed("create") && <div className="flex justify-end"><Button onClick={() => handleOpenAddNode(null, "project")} className="gap-2"><Plus className="h-4 w-4" />Thêm dự án thành phần</Button></div>}

              {/* Hierarchical WBS Tree */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Cây phân rã công việc WBS 5 cấp</span>
                    <span className="text-xs text-muted-foreground">
                      (Nhiệm vụ → Dự án thành phần → Hạng mục → Công việc → Khối lượng)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => {
                        const all: Record<string, boolean> = {}
                        currentNodes.forEach((n) => (all[n.id] = true))
                        setExpandedNodes(all)
                      }}
                    >
                      Mở rộng tất cả
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      onClick={() => setExpandedNodes({})}
                    >
                      Thu gọn
                    </Button>
                  </div>
                </div>

                {projectNodes.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <GitBranch className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-2 font-medium">Chưa có cấu trúc công việc WBS cho nhiệm vụ này</p>
                    <p className="text-xs">Bấm "Thêm Dự án thành phần" để bắt đầu phân rã cây công việc.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {projectNodes.map((projectNode) => (
                      <WbsNodeItem
                        key={projectNode.id}
                        node={projectNode}
                        level={1}
                        allNodes={currentNodes}
                        expandedNodes={expandedNodes}
                        onToggleExpand={toggleExpand}
                        onAddChild={handleOpenAddNode}
                        onEdit={handleOpenEditNode}
                        onDelete={handleDeleteNodeSafely}
                        onOpenWork={(id) => {
                          setFocusedWorkId(id)
                          setActiveTab("kanban")
                        }}
                        highlightedWorkId={highlightedWorkId}
                        allowed={allowed}
                      />
                    ))}
                  </div>
                )}

                {/* Footer summary */}
                <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                  <span>Tổng số phần tử WBS: <strong>{currentNodes.length}</strong> nút</span>
                  <span>Tổng chi phí cấu trúc WBS: <strong className="text-emerald-600 font-semibold">{money(totalWbsCost)} đ</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              Vui lòng chọn một hồ sơ nhiệm vụ để xem cấu trúc WBS.
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: GIAO CHUỖI TRÁCH NHIỆM THEO THỜI GIAN (UC-04) */}
        {/* ========================================================================= */}
        <TabsContent value="responsibility" className="space-y-4">
          {currentMission ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Chuỗi trách nhiệm quản lý & thực hiện (5 cấp)</h2>
                    <p className="text-xs text-muted-foreground">
                      Nhiệm vụ: <strong>{currentMission.code} · {currentMission.name}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={respFilter} onValueChange={(v) => setRespFilter(v as typeof respFilter)}>
                      <SelectTrigger className="w-[170px] h-9 text-xs">
                        <SelectValue placeholder="Trạng thái hiệu lực" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả nhân sự</SelectItem>
                        <SelectItem value="active">Đang hiệu lực</SelectItem>
                        <SelectItem value="history">Lịch sử chuyển giao</SelectItem>
                      </SelectContent>
                    </Select>

                    {allowed("update") && (
                      <Button size="sm" onClick={handleOpenAddResp} className="gap-1.5 h-9">
                        <Plus className="h-4 w-4" />
                        Gán / Chuyển giao trách nhiệm
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* 5 Levels Pipeline Visualization */}
              <div className="grid gap-3 sm:grid-cols-5">
                {(Object.entries(LEVEL_LABELS) as [ResponsibilityLevel, { label: string; order: number }][]).map(
                  ([levelKey, meta]) => {
                    const activeInLevel = currentResponsibilities.find(
                      (r) => r.level === levelKey && r.status === "active"
                    )

                    return (
                      <div
                        key={levelKey}
                        className={`rounded-xl border p-4 shadow-sm transition ${
                          activeInLevel ? "bg-card border-primary/40" : "bg-muted/30 border-dashed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            Cấp {meta.order}
                          </span>
                          {activeInLevel && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        </div>
                        <h4 className="mt-2 text-xs font-semibold text-muted-foreground">{meta.label}</h4>
                        {activeInLevel ? (
                          <div className="mt-2 space-y-0.5">
                            <p className="text-sm font-bold text-foreground">{activeInLevel.officerName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{activeInLevel.officerRole}</p>
                            <p className="text-[10px] text-muted-foreground/80 truncate">{activeInLevel.unitName}</p>
                            <p className="text-[10px] text-primary/80">Từ {activeInLevel.fromDate}</p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-muted-foreground italic">Chưa phân công</p>
                        )}
                      </div>
                    )
                  }
                )}
              </div>

              {/* Responsibility Records Table */}
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="border-b bg-muted/40 px-4 py-3">
                  <span className="text-sm font-semibold">Danh sách phân công & truy vết lịch sử theo mốc thời gian</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b bg-muted/20 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Cấp trách nhiệm</th>
                        <th className="px-4 py-3 font-medium">Cán bộ đảm nhiệm</th>
                        <th className="px-4 py-3 font-medium">Chức vụ / Vai trò</th>
                        <th className="px-4 py-3 font-medium">Đơn vị</th>
                        <th className="px-4 py-3 font-medium">Thời gian hiệu lực</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentResponsibilities
                        .filter((r) => {
                          if (respFilter === "active") return r.status === "active"
                          if (respFilter === "history") return r.status !== "active"
                          return true
                        })
                        .map((r) => (
                          <tr key={r.id} className="hover:bg-muted/30 transition">
                            <td className="px-4 py-3 font-medium text-foreground">
                              {LEVEL_LABELS[r.level]?.label || r.level}
                            </td>
                            <td className="px-4 py-3 font-bold text-foreground">{r.officerName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{r.officerRole}</td>
                            <td className="px-4 py-3 text-muted-foreground">{r.unitName}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {r.fromDate} → {r.toDate || "Nay"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  r.status === "active"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {r.status === "active" ? "Đang hiệu lực" : "Đã chuyển giao"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.notes || "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              Vui lòng chọn một hồ sơ nhiệm vụ để xem chuỗi trách nhiệm.
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: TRUY VẾT TÀI CHÍNH TỪ NGUỒN VỐN ĐẾN QUYẾT TOÁN (UC-05) */}
        {/* ========================================================================= */}
        <TabsContent value="finance" className="space-y-4">
          {currentMission ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={KIND_LABELS[currentMission.kind].badge}>
                      {KIND_LABELS[currentMission.kind].label}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-primary">{currentMission.code}</span>
                  </div>
                  <h2 className="text-xl font-bold">{currentMission.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Cơ chế dòng tiền: <strong>{currentMission.fundingSource}</strong>
                  </p>
                </div>

                {/* Financial Pipeline Flow */}
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                  <div className="rounded-xl border bg-muted/20 p-4 relative">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">1. Nguồn vốn</span>
                    <p className="mt-2 text-sm font-bold truncate" title={currentMission.fundingSource}>
                      {currentMission.fundingSource}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Cấp theo quyết định</p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4 relative">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">2. Dự toán duyệt</span>
                    <p className="mt-2 text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {money(currentMission.budget)} đ
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Ngân sách trần</p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4 relative">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">3. Chi phí WBS</span>
                    <p className="mt-2 text-base font-bold text-blue-600 dark:text-blue-400">
                      {money(totalWbsCost)} đ
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Tổng dồn cây công việc</p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4 relative">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">4. Nghiệm thu</span>
                    <p className="mt-2 text-sm font-bold text-foreground">
                      {currentMission.acceptance}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Phân hệ kỹ thuật liên thông</p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4 relative">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">5. Quyết toán</span>
                    <p className="mt-2 text-base font-bold text-purple-600 dark:text-purple-400">
                      {money(currentMission.settlement)} đ
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Đã phê duyệt quyết toán</p>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="mt-6 rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span>Tỷ lệ phân rã dự toán WBS so với Ngân sách duyệt:</span>
                    <strong>
                      {currentMission.budget > 0
                        ? `${Math.round((totalWbsCost / currentMission.budget) * 100)}%`
                        : "0%"}
                    </strong>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        totalWbsCost > currentMission.budget ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          currentMission.budget > 0 ? (totalWbsCost / currentMission.budget) * 100 : 0
                        )}%`,
                      }}
                    />
                  </div>
                  {totalWbsCost > currentMission.budget && (
                    <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Cảnh báo: Tổng chi phí phân rã WBS vượt quá tổng kinh phí dự toán được phê duyệt!
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              Vui lòng chọn một hồ sơ nhiệm vụ để xem truy vết tài chính.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOG 1: TẠO / SỬA HỒ SƠ NHIỆM VỤ (UC-01) */}
      {/* ========================================================================= */}
      <Dialog open={missionDialogOpen} onOpenChange={setMissionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{missionForm.id ? "Cập nhật hồ sơ nhiệm vụ / đề án" : "Lập hồ sơ nhiệm vụ / đề án mới"}</DialogTitle>
            <DialogDescription>
              Điền các thông tin định danh, căn cứ pháp lý, nguồn vốn và chỉ tiêu tài chính theo chuẩn Liên đoàn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveMission} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Mã nhiệm vụ <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="NV-ĐVL-2026-01"
                  value={missionForm.code}
                  onChange={(e) => setMissionForm((p) => ({ ...p, code: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Tên nhiệm vụ / đề án <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nhập tên nhiệm vụ hoặc đề án..."
                  value={missionForm.name}
                  onChange={(e) => setMissionForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Số quyết định / Hợp đồng căn cứ</Label>
                <Input
                  placeholder="Số 142/QĐ-BTNMT ngày 15/01/2026"
                  value={missionForm.decisionNumber || ""}
                  onChange={(e) => setMissionForm((p) => ({ ...p, decisionNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Nhóm hoạt động (UC-02)</Label>
                <Select
                  value={missionForm.kind}
                  onValueChange={(v) => setMissionForm((p) => ({ ...p, kind: v as MissionKind }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">Nhiệm vụ Nhà nước</SelectItem>
                    <SelectItem value="public">Dịch vụ sự nghiệp công</SelectItem>
                    <SelectItem value="service">Dịch vụ áp dụng đơn giá / SXKD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-3">
                <Label>Mục tiêu nhiệm vụ</Label>
                <Textarea
                  placeholder="Mô tả mục tiêu kỹ thuật, địa chất, địa vật lý cần đạt..."
                  rows={2}
                  value={missionForm.target || ""}
                  onChange={(e) => setMissionForm((p) => ({ ...p, target: e.target.value }))}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Nguồn vốn <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ngân sách Nhà nước / Quỹ sự nghiệp / Vốn doanh nghiệp"
                  value={missionForm.fundingSource}
                  onChange={(e) => setMissionForm((p) => ({ ...p, fundingSource: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Tổng dự toán kinh phí (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={missionForm.budget}
                  onChange={(e) => setMissionForm((p) => ({ ...p, budget: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Doanh thu / Kinh phí nhận (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={missionForm.revenue}
                  onChange={(e) => setMissionForm((p) => ({ ...p, revenue: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Giá trị quyết toán duyệt (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={missionForm.settlement}
                  onChange={(e) => setMissionForm((p) => ({ ...p, settlement: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Trạng thái</Label>
                <Select
                  value={missionForm.status || "in_progress"}
                  onValueChange={(v) => setMissionForm((p) => ({ ...p, status: v as MissionStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Dự thảo</SelectItem>
                    <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                    <SelectItem value="suspended">Tạm dừng</SelectItem>
                    <SelectItem value="completed">Đã hoàn thành</SelectItem>
                    <SelectItem value="settled">Đã quyết toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ngày bắt đầu <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={missionForm.startDate}
                  onChange={(e) => setMissionForm((p) => ({ ...p, startDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Ngày kết thúc <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={missionForm.endDate}
                  onChange={(e) => setMissionForm((p) => ({ ...p, endDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Tình trạng nghiệm thu</Label>
                <Select
                  value={missionForm.acceptance}
                  onValueChange={(v) => setMissionForm((p) => ({ ...p, acceptance: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chưa nghiệm thu">Chưa nghiệm thu</SelectItem>
                    <SelectItem value="Đang nghiệm thu">Đang nghiệm thu</SelectItem>
                    <SelectItem value="Đã nghiệm thu">Đã nghiệm thu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Đơn vị chủ trì <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Đoàn Địa vật lý Máy bay & Biển / Đoàn 59..."
                  value={missionForm.department}
                  onChange={(e) => setMissionForm((p) => ({ ...p, department: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Chủ nhiệm nhiệm vụ <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="TS. Nguyễn Văn Tuấn"
                  value={missionForm.owner}
                  onChange={(e) => setMissionForm((p) => ({ ...p, owner: e.target.value }))}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setMissionDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu hồ sơ nhiệm vụ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 2: ĐỔI PHÂN LOẠI HOẠT ĐỘNG KÈM LÝ DO & LỊCH SỬ (UC-02) */}
      {/* ========================================================================= */}
      <Dialog open={classificationDialogOpen} onOpenChange={setClassificationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đổi phân loại hoạt động & Lưu vết lịch sử</DialogTitle>
            <DialogDescription>
              Quy tắc UC-02: Phân loại quyết định bộ chỉ tiêu và hồ sơ tài chính. Mọi lần đổi phân loại phải bắt buộc nhập lý do và lưu lại lịch sử bất biến.
            </DialogDescription>
          </DialogHeader>

          {changeKindTarget && (
            <form onSubmit={handleSaveChangeKind} className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div>Nhiệm vụ: <strong>{changeKindTarget.code}</strong></div>
                <div>Hiện tại: <Badge variant="outline" className={KIND_LABELS[changeKindTarget.kind].badge}>{KIND_LABELS[changeKindTarget.kind].label}</Badge></div>
              </div>

              <div className="space-y-2">
                <Label>Chọn phân loại mới <span className="text-destructive">*</span></Label>
                <Select value={newKind} onValueChange={(v) => setNewKind(v as MissionKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="state">Nhiệm vụ Nhà nước (Ngân sách Nhà nước)</SelectItem>
                    <SelectItem value="public">Dịch vụ sự nghiệp công (Kinh phí sự nghiệp)</SelectItem>
                    <SelectItem value="service">Dịch vụ áp dụng đơn giá / SXKD (Hợp đồng)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">{KIND_LABELS[newKind].desc}</p>
              </div>

              <div className="space-y-2">
                <Label>Lý do điều chỉnh phân loại <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Nêu rõ lý do thay đổi phân loại (vd: Điều chỉnh từ NSNN sang Hợp đồng dịch vụ do quyết định số...)"
                  rows={3}
                  value={changeKindReason}
                  onChange={(e) => setChangeKindReason(e.target.value)}
                  required
                />
              </div>

              {/* Classification History List */}
              {changeKindTarget.classificationHistory && changeKindTarget.classificationHistory.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    Lịch sử các lần thay đổi trước đây:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {changeKindTarget.classificationHistory.map((item) => (
                      <div key={item.id} className="rounded-md border p-2 text-[11px] bg-card">
                        <div className="flex justify-between text-muted-foreground">
                          <span>{item.changedAt} bởi {item.changedBy}</span>
                          <span>{KIND_LABELS[item.fromKind]?.label} → {KIND_LABELS[item.toKind]?.label}</span>
                        </div>
                        <p className="mt-1 text-foreground italic">"{item.reason}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setClassificationDialogOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit">Xác nhận đổi phân loại</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 3: THÊM / SỬA CẤP PHÂN RÃ CÔNG VIỆC WBS (UC-03) */}
      {/* ========================================================================= */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{nodeForm.id ? "Sửa cấp công việc WBS" : "Thêm cấp công việc vào cây WBS"}</DialogTitle>
            <DialogDescription>
              Cấu trúc cây 5 cấp: Nhiệm vụ → Dự án thành phần → Hạng mục → Công việc → Khối lượng kỹ thuật.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNode} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Cấp phân rã WBS</Label>
                <Select
                  value={nodeForm.kind}
                  onValueChange={(v) => {
                    const nextK = v as NodeKind
                    setNodeForm((p) => ({
                      ...p,
                      kind: nextK,
                      parentId: nextK === "project" ? null : p.parentId,
                    }))
                  }}
                  disabled={Boolean(nodeForm.id)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Cấp 1: Dự án thành phần</SelectItem>
                    <SelectItem value="item">Cấp 2: Hạng mục công trình</SelectItem>
                    <SelectItem value="work">Cấp 3: Công việc thực hiện</SelectItem>
                    <SelectItem value="volume">Cấp 4: Khối lượng kỹ thuật</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Mã WBS (vd: 1.1, 1.1.2)</Label>
                <Input
                  placeholder="1.1"
                  value={nodeForm.wbsCode || ""}
                  onChange={(e) => setNodeForm((p) => ({ ...p, wbsCode: e.target.value }))}
                />
              </div>

              {nodeForm.kind !== "project" && (
                <div className="space-y-1 sm:col-span-2">
                  <Label>Thuộc cấp cha <span className="text-destructive">*</span></Label>
                  <Select
                    value={nodeForm.parentId || ""}
                    onValueChange={(v) => setNodeForm((p) => ({ ...p, parentId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cấp cha trực tiếp..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentNodes
                        .filter((n) => {
                          if (nodeForm.kind === "item") return n.kind === "project"
                          if (nodeForm.kind === "work") return n.kind === "item"
                          if (nodeForm.kind === "volume") return n.kind === "work"
                          return false
                        })
                        .map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            [{NODE_KIND_LABELS[parent.kind].label}] {parent.wbsCode ? `${parent.wbsCode} - ` : ""}{parent.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1 sm:col-span-2">
                <Label>Tên công việc / hạng mục <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nhập tên cụ thể..."
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Khối lượng kỹ thuật</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={nodeForm.quantity}
                  onChange={(e) => setNodeForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Đơn vị tính</Label>
                <Input
                  placeholder="km tuyến, trạm, điểm đo, mẫu..."
                  value={nodeForm.unit}
                  onChange={(e) => setNodeForm((p) => ({ ...p, unit: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Đơn giá dự toán (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={nodeForm.unitPrice || 0}
                  onChange={(e) => {
                    const price = Number(e.target.value)
                    setNodeForm((p) => ({
                      ...p,
                      unitPrice: price,
                      cost: (p.quantity || 0) * price,
                    }))
                  }}
                />
              </div>

              <div className="space-y-1">
                <Label>Dự toán chi phí (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={nodeForm.cost}
                  onChange={(e) => setNodeForm((p) => ({ ...p, cost: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Chuyên môn / năng lực yêu cầu</Label>
                <Input
                  placeholder="Kỹ thuật bay đo từ / Địa chấn nông / Trắc địa GPS..."
                  value={nodeForm.requiredSkill}
                  onChange={(e) => setNodeForm((p) => ({ ...p, requiredSkill: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Đơn vị thực hiện <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Tổ bay đo chuyên đề 1"
                  value={nodeForm.department}
                  onChange={(e) => setNodeForm((p) => ({ ...p, department: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Cán bộ kỹ thuật phụ trách <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="KS. Bùi Văn Hùng"
                  value={nodeForm.assignee}
                  onChange={(e) => setNodeForm((p) => ({ ...p, assignee: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Hạn hoàn thành</Label>
                <Input
                  type="date"
                  value={nodeForm.dueDate}
                  onChange={(e) => setNodeForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNodeDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu cấu trúc WBS</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG 4: GÁN / CHUYỂN GIAO CHUỖI TRÁCH NHIỆM (UC-04) */}
      {/* ========================================================================= */}
      <Dialog open={respDialogOpen} onOpenChange={setRespDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gán / Chuyển giao trách nhiệm (5 cấp)</DialogTitle>
            <DialogDescription>
              Lưu hiệu lực theo mốc thời gian để truy vết người chịu trách nhiệm tại từng thời điểm.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveResp} className="space-y-3">
            <div className="space-y-1">
              <Label>Cấp trách nhiệm</Label>
              <Select
                value={respForm.level}
                onValueChange={(v) => setRespForm((p) => ({ ...p, level: v as ResponsibilityLevel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="director">Cấp 1: Lãnh đạo phụ trách (Ban Giám đốc)</SelectItem>
                  <SelectItem value="managing_dept">Cấp 2: Phòng quản lý điều phối</SelectItem>
                  <SelectItem value="executing_unit">Cấp 3: Đơn vị chủ trì thực hiện</SelectItem>
                  <SelectItem value="lead_investigator">Cấp 4: Chủ nhiệm nhiệm vụ</SelectItem>
                  <SelectItem value="field_officer">Cấp 5: Cán bộ / Kỹ thuật viên chính</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Họ và tên cán bộ <span className="text-destructive">*</span></Label>
              <Input
                placeholder="TS. Nguyễn Văn Tuấn"
                value={respForm.officerName || ""}
                onChange={(e) => setRespForm((p) => ({ ...p, officerName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Chức vụ / Chức danh</Label>
              <Input
                placeholder="Chủ nhiệm đề án / Kỹ sư trưởng bay đo..."
                value={respForm.officerRole || ""}
                onChange={(e) => setRespForm((p) => ({ ...p, officerRole: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Đơn vị công tác <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Đoàn Địa vật lý Máy bay & Biển"
                value={respForm.unitName || ""}
                onChange={(e) => setRespForm((p) => ({ ...p, unitName: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Hiệu lực từ ngày <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={respForm.fromDate}
                  onChange={(e) => setRespForm((p) => ({ ...p, fromDate: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Đến ngày</Label>
                <Input
                  type="date"
                  value={respForm.toDate || ""}
                  onChange={(e) => setRespForm((p) => ({ ...p, toDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Trạng thái phân công</Label>
              <Select
                value={respForm.status}
                onValueChange={(v) => setRespForm((p) => ({ ...p, status: v as ResponsibilityAssignment["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hiệu lực (Hiện tại)</SelectItem>
                  <SelectItem value="transferred">Đã chuyển giao / Bàn giao</SelectItem>
                  <SelectItem value="expired">Hết hiệu lực</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Ghi chú phân công</Label>
              <Textarea
                placeholder="Quyết định phân công số... hoặc phạm vi phụ trách..."
                rows={2}
                value={respForm.notes || ""}
                onChange={(e) => setRespForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRespDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu phân công trách nhiệm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

// =========================================================================
// SUB-COMPONENT: WBS NODE RECURSIVE RENDERER
// =========================================================================
interface WbsNodeItemProps {
  node: WorkNode
  level: number
  allNodes: WorkNode[]
  expandedNodes: Record<string, boolean>
  onToggleExpand: (id: string) => void
  onAddChild: (parentId: string, kind: NodeKind) => void
  onEdit: (node: WorkNode) => void
  onDelete: (node: WorkNode) => void
  onOpenWork: (id: string) => void
  highlightedWorkId: string | null
  allowed: (action: string) => boolean
}

function WbsNodeItem({
  node,
  level,
  allNodes,
  expandedNodes,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onOpenWork,
  highlightedWorkId,
  allowed,
}: WbsNodeItemProps) {
  const children = allNodes.filter((n) => n.parentId === node.id)
  const isExpanded = expandedNodes[node.id] ?? true
  const hasChildren = children.length > 0

  const kindBadgeColors: Record<NodeKind, string> = {
    project: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200",
    item: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
    work: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
    volume: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
  }

  const nextKind: Record<NodeKind, NodeKind | null> = {
    project: "item",
    item: "work",
    work: "volume",
    volume: null,
  }

  const nextKindTarget = nextKind[node.kind]

  return (
    <div className="text-xs">
      {/* Node Row */}
      <div
        id={`wbs-node-${node.id}`}
        className={`flex items-center justify-between gap-3 p-3 transition hover:bg-muted/40 ${
          node.id === highlightedWorkId ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : level === 1 ? "bg-muted/20 font-semibold" : ""
        }`}
        style={{ paddingLeft: `${Math.max(12, level * 24)}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.id)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <Badge variant="outline" className={`text-[10px] shrink-0 font-normal ${kindBadgeColors[node.kind]}`}>
            {NODE_KIND_LABELS[node.kind]?.label || node.kind}
          </Badge>

          {node.wbsCode && (
            <span className="font-mono text-[11px] text-muted-foreground shrink-0 font-bold">
              {node.wbsCode}
            </span>
          )}

          {node.kind === "work" ? (
            <button type="button" className="truncate text-left font-medium text-primary hover:underline" title="Xem công việc trên Kanban" onClick={() => onOpenWork(node.id)}>{node.name}</button>
          ) : <span className="truncate font-medium text-foreground">{node.name}</span>}

          {node.quantity > 0 && node.unit && (
            <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
              ({node.quantity} {node.unit})
            </span>
          )}
        </div>

        {/* Right stats and actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden md:block">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{money(node.cost)} đ</span>
            <span className="block text-[10px] text-muted-foreground">{node.department}</span>
          </div>

          <div className="text-right hidden lg:block">
            <span className="text-foreground">{node.assignee}</span>
            <span className="block text-[10px] text-muted-foreground">{node.dueDate ? `Hạn: ${node.dueDate}` : "—"}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {allowed("create") && nextKindTarget && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-primary gap-1 px-2"
                title={`Thêm ${NODE_KIND_LABELS[nextKindTarget]?.label} con`}
                onClick={() => onAddChild(node.id, nextKindTarget)}
              >
                <Plus className="h-3 w-3" />
                <span className="hidden xl:inline">{NODE_KIND_LABELS[nextKindTarget]?.label}</span>
              </Button>
            )}

            {allowed("update") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                title="Sửa cấp công việc"
                onClick={() => onEdit(node)}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}

            {allowed("delete") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                title="Xóa cấp công việc"
                onClick={() => onDelete(node)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recursive Children */}
      {hasChildren && isExpanded && (
        <div className="divide-y divide-border/60">
          {children.map((childNode) => (
            <WbsNodeItem
              key={childNode.id}
              node={childNode}
              level={level + 1}
              allNodes={allNodes}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenWork={onOpenWork}
              highlightedWorkId={highlightedWorkId}
              allowed={allowed}
            />
          ))}
        </div>
      )}
    </div>
  )
}
