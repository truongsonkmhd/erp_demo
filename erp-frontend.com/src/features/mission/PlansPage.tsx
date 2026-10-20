import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  CalendarDays,
  FileCheck2,
  GitCommit,
  History,
  Plus,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
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

import { useAuth } from "@/services/auth/AuthContext"
import { PageShell, money, nonNegative, useMissionPermission } from "./ui"
import {
  useMissionData,
  upsertMission,
  removeMission,
  saveMissionData,
  getMissionData,
  actualQuantity,
  uid,
  type Plan,
  type Audit,
} from "./store"

const PLAN_STATUS_CONFIG: Record<
  Plan["status"],
  { label: string; badge: string; desc: string }
> = {
  draft: {
    label: "Dự thảo",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    desc: "Đang lập chỉ tiêu, chưa trình duyệt",
  },
  pending: {
    label: "Chờ phê duyệt",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
    desc: "Đã trình cấp có thẩm quyền xem xét",
  },
  approved: {
    label: "Đã duyệt (Baseline)",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
    desc: "Đường cơ sở chính thức có hiệu lực",
  },
  rejected: {
    label: "Từ chối",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    desc: "Bị trả lời từ chối, bản cũ tiếp tục có hiệu lực",
  },
  superseded: {
    label: "Đã thay thế",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    desc: "Bản lịch sử cũ, đã bị thay bởi phiên bản mới",
  },
}

const blankPlan = (): Plan => ({
  id: "",
  missionId: "",
  nodeId: "",
  year: new Date().getFullYear(),
  quarter: 1,
  month: 1,
  department: "",
  quantity: 0,
  cost: 0,
  days: 30,
  status: "draft",
  version: 1,
  reason: "",
})

export default function PlansPage() {
  const data = useMissionData()
  const allowed = useMissionPermission("ke-hoach")
  const { user } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState<"plans" | "adjustments" | "audits">("plans")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterMission, setFilterMission] = useState<string>("all")

  // Modal Plan Form
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [planForm, setPlanForm] = useState<Plan>(blankPlan)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<Plan | null>(null)

  // Review / Decision Modal
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<Plan | null>(null)
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved")
  const [reviewComment, setReviewComment] = useState("")

  // Statistics
  const stats = useMemo(() => {
    const total = data.plans.length
    const approved = data.plans.filter((p) => p.status === "approved").length
    const pending = data.plans.filter((p) => p.status === "pending").length
    const superseded = data.plans.filter((p) => p.status === "superseded").length
    const totalPlannedCost = data.plans
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (p.cost || 0), 0)
    return { total, approved, pending, superseded, totalPlannedCost }
  }, [data.plans])

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return data.plans.filter((plan) => {
      const mission = data.missions.find((m) => m.id === plan.missionId)
      const node = data.nodes.find((n) => n.id === plan.nodeId)

      const matchSearch =
        plan.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mission?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mission?.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node?.name || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchYear = filterYear === "all" || String(plan.year) === filterYear
      const matchStatus = filterStatus === "all" || plan.status === filterStatus
      const matchMission = filterMission === "all" || plan.missionId === filterMission

      return matchSearch && matchYear && matchStatus && matchMission
    })
  }, [data.plans, data.missions, data.nodes, searchTerm, filterYear, filterStatus, filterMission])

  // Nodes for selected mission in form
  const availableNodes = useMemo(() => {
    if (!planForm.missionId) return []
    return data.nodes.filter((n) => n.missionId === planForm.missionId)
  }, [data.nodes, planForm.missionId])

  // Open Create Modal
  const handleOpenCreate = () => {
    const firstMission = data.missions[0]
    const firstNode = data.nodes.find((n) => n.missionId === firstMission?.id)
    setIsAdjusting(false)
    setAdjustTarget(null)
    setPlanForm({
      ...blankPlan(),
      missionId: firstMission?.id || "",
      nodeId: firstNode?.id || "",
      department: firstNode?.department || firstMission?.department || "",
    })
    setPlanDialogOpen(true)
  }

  // Open Edit / Adjustment Modal (UC-08)
  const handleOpenEdit = (plan: Plan) => {
    if (plan.status === "approved") {
      // Rule UC-08: Adjusting an approved plan creates a new version with required reason
      setIsAdjusting(true)
      setAdjustTarget(plan)
      setPlanForm({
        ...plan,
        reason: "",
      })
    } else {
      setIsAdjusting(false)
      setAdjustTarget(null)
      setPlanForm({ ...plan })
    }
    setPlanDialogOpen(true)
  }

  // Save Plan (Create or Adjust)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed(planForm.id ? "update" : "create")) {
      toast.error("Bạn không có quyền thực hiện thao tác này")
      return
    }

    const node = data.nodes.find((n) => n.id === planForm.nodeId)
    if (!node || node.missionId !== planForm.missionId || !planForm.department.trim()) {
      toast.error("Vui lòng chọn nhiệm vụ, công việc WBS và đơn vị thực hiện hợp lệ")
      return
    }

    if (planForm.year < 2000 || planForm.year > 2100 || planForm.month < 1 || planForm.month > 12) {
      toast.error("Kỳ kế hoạch không hợp lệ")
      return
    }

    if (!nonNegative(planForm.quantity, planForm.cost, planForm.days)) {
      toast.error("Chỉ tiêu khối lượng, chi phí và số ngày không được mang giá trị âm")
      return
    }

    const actorName = user?.fullName || user?.username || "Chủ nhiệm nhiệm vụ"

    if (isAdjusting && adjustTarget) {
      // UC-08: Adjust approved plan
      if (!planForm.reason.trim()) {
        toast.error("Quy tắc UC-08: Bắt buộc nêu rõ lý do khi điều chỉnh kế hoạch đã phê duyệt")
        return
      }

      const nextVersion = adjustTarget.version + 1
      const newPlanId = uid()
      const adjustedPlan: Plan = {
        ...planForm,
        id: newPlanId,
        status: "pending",
        version: nextVersion,
        reason: planForm.reason.trim(),
      }

      upsertMission("plans", adjustedPlan)

      // Audit entry
      const audit: Audit = {
        id: uid(),
        planId: newPlanId,
        action: `Đề xuất điều chỉnh v${nextVersion}`,
        actor: actorName,
        at: new Date().toISOString(),
        before: JSON.stringify({
          quantity: adjustTarget.quantity,
          cost: adjustTarget.cost,
          days: adjustTarget.days,
          version: adjustTarget.version,
        }),
        after: JSON.stringify({
          quantity: adjustedPlan.quantity,
          cost: adjustedPlan.cost,
          days: adjustedPlan.days,
          version: adjustedPlan.version,
          reason: adjustedPlan.reason,
        }),
      }
      upsertMission("audits", audit)

      setPlanDialogOpen(false)
      toast.success(`Đã tạo đề xuất điều chỉnh phiên bản v${nextVersion} (Chờ phê duyệt)`)
      return
    }

    // Normal create or edit draft
    const isNew = !planForm.id
    const savedPlan: Plan = {
      ...planForm,
      id: planForm.id || uid(),
      status: planForm.id ? planForm.status : "draft",
      version: planForm.version || 1,
    }

    upsertMission("plans", savedPlan)
    setPlanDialogOpen(false)
    toast.success(isNew ? "Đã lưu kế hoạch mới" : "Đã cập nhật kế hoạch")
  }

  // Submit for Approval (Draft -> Pending)
  const handleSubmitForApproval = (plan: Plan) => {
    if (!allowed("update")) {
      toast.error("Bạn không có quyền thực hiện thao tác này")
      return
    }
    const updated: Plan = { ...plan, status: "pending" }
    upsertMission("plans", updated)

    const audit: Audit = {
      id: uid(),
      planId: plan.id,
      action: "Trình phê duyệt kế hoạch",
      actor: user?.fullName || user?.username || "Chủ nhiệm nhiệm vụ",
      at: new Date().toISOString(),
      before: "Dự thảo",
      after: "Chờ phê duyệt",
    }
    upsertMission("audits", audit)

    toast.success("Đã gửi hồ sơ kế hoạch lên cấp có thẩm quyền phê duyệt")
  }

  // Open Decision Dialog
  const handleOpenDecision = (plan: Plan, action: "approved" | "rejected") => {
    setReviewTarget(plan)
    setReviewAction(action)
    setReviewComment("")
    setReviewDialogOpen(true)
  }

  // Confirm Decision (UC-06 & UC-08)
  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewTarget) return
    if (!allowed("update")) {
      toast.error("Bạn không có quyền phê duyệt kế hoạch")
      return
    }

    const actorName = user?.fullName || user?.username || "Lãnh đạo Liên đoàn"
    const isApprove = reviewAction === "approved"

    if (isApprove) {
      // UC-06 & UC-08: When a new version is approved, mark the older approved version as superseded
      const current = getMissionData()
      const updatedList = current.plans.map((p) => {
        if (p.id === reviewTarget.id) {
          return { ...p, status: "approved" as const }
        }
        // Old approved version for same task & period becomes superseded
        if (
          p.status === "approved" &&
          p.nodeId === reviewTarget.nodeId &&
          p.year === reviewTarget.year &&
          p.month === reviewTarget.month
        ) {
          return { ...p, status: "superseded" as const }
        }
        return p
      })

      saveMissionData({ ...current, plans: updatedList })

      const audit: Audit = {
        id: uid(),
        planId: reviewTarget.id,
        action: `Phê duyệt Baseline v${reviewTarget.version}`,
        actor: actorName,
        at: new Date().toISOString(),
        before: "Chờ duyệt",
        after: `Đã phê duyệt đường cơ sở chính thức: ${reviewComment || "Đạt yêu cầu"}`,
      }
      upsertMission("audits", audit)

      setReviewDialogOpen(false)
      toast.success(`Đã phê duyệt chính thức kế hoạch (Đường cơ sở Baseline v${reviewTarget.version})`)
    } else {
      // Rejected: old baseline remains in effect, this adjusted draft is rejected
      if (!reviewComment.trim()) {
        toast.error("Bắt buộc nêu rõ lý do / ý kiến chỉ đạo khi từ chối phê duyệt")
        return
      }

      const updated: Plan = { ...reviewTarget, status: "rejected" }
      upsertMission("plans", updated)

      const audit: Audit = {
        id: uid(),
        planId: reviewTarget.id,
        action: `Từ chối phê duyệt v${reviewTarget.version}`,
        actor: actorName,
        at: new Date().toISOString(),
        before: "Chờ duyệt",
        after: `Từ chối: ${reviewComment.trim()}`,
      }
      upsertMission("audits", audit)

      setReviewDialogOpen(false)
      toast.info("Đã từ chối kế hoạch. Đường cơ sở cũ (nếu có) tiếp tục duy trì hiệu lực")
    }
  }

  // Delete Draft (Only unapproved plans can be deleted)
  const handleDeletePlanSafely = (plan: Plan) => {
    if (!allowed("delete")) {
      toast.error("Bạn không có quyền xóa kế hoạch")
      return
    }
    if (plan.status === "approved" || plan.status === "superseded") {
      toast.error("Quy tắc UC-06: Không xóa kế hoạch đã duyệt; hãy dùng chức năng Điều chỉnh để lưu vết")
      return
    }
    const hasProgress = data.progress.some((p) => p.nodeId === plan.nodeId)
    if (hasProgress) {
      toast.error("Không thể xóa kế hoạch khi công việc này đã phát sinh số liệu thực hiện")
      return
    }

    if (window.confirm(`Xác nhận xóa bản ghi kế hoạch ${plan.department} - T${plan.month}/${plan.year}?`)) {
      removeMission("plans", plan.id)
      toast.success("Đã xóa kế hoạch nháp")
    }
  }

  return (
    <PageShell
      title="Kế hoạch nhiệm vụ & đề án"
      subtitle="PRJ-06 & PRJ-08 · Lập kế hoạch nhiều cấp, xác lập đường cơ sở (Baseline) và phê duyệt điều chỉnh có lưu vết"
    >
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kế hoạch đã duyệt</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.approved}</p>
          <p className="mt-1 text-xs text-muted-foreground">Đường cơ sở (Baseline) đang có hiệu lực</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đang chờ phê duyệt</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
          <p className="mt-1 text-xs text-muted-foreground">Bản lập mới hoặc đề xuất điều chỉnh</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng kinh phí KH duyệt</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {money(stats.totalPlannedCost)} <span className="text-sm font-normal text-muted-foreground">đ</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Tổng chi phí theo các chỉ tiêu Baseline</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lịch sử thay thế</span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <History className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{stats.superseded}</p>
          <p className="mt-1 text-xs text-muted-foreground">Các phiên bản Baseline cũ được lưu vết</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl border bg-muted/60 p-1 sm:w-[480px]">
          <TabsTrigger value="plans" className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4" />
            <span>Kế hoạch & Phê duyệt</span>
          </TabsTrigger>
          <TabsTrigger value="audits" className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            <span>Lịch sử điều chỉnh</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: DANH SÁCH KẾ HOẠCH & QUY TRÌNH DUYỆT (UC-06) */}
        {/* ========================================================================= */}
        <TabsContent value="plans" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo đơn vị, công việc, nhiệm vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[170px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="approved">Đã duyệt (Baseline)</SelectItem>
                  <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                  <SelectItem value="draft">Dự thảo</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="superseded">Đã thay thế</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMission} onValueChange={setFilterMission}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Nhiệm vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhiệm vụ</SelectItem>
                  {data.missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {allowed("create") && (
              <Button onClick={handleOpenCreate} className="shrink-0 gap-2">
                <Plus className="h-4 w-4" />
                Lập kế hoạch chỉ tiêu
              </Button>
            )}
          </div>

          {/* Plans Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Kỳ kế hoạch</th>
                    <th className="px-4 py-3 font-medium">Nhiệm vụ & Công việc WBS</th>
                    <th className="px-4 py-3 font-medium">Đơn vị thực hiện</th>
                    <th className="px-4 py-3 font-medium">Khối lượng (KH / TH)</th>
                    <th className="px-4 py-3 font-medium">Dự toán chi phí</th>
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPlans.map((plan) => {
                    const mission = data.missions.find((m) => m.id === plan.missionId)
                    const node = data.nodes.find((n) => n.id === plan.nodeId)
                    const actual = actualQuantity(data, plan.nodeId)
                    const statusConfig = PLAN_STATUS_CONFIG[plan.status] || PLAN_STATUS_CONFIG.draft

                    return (
                      <tr key={plan.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          <div>Năm {plan.year}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Quý {plan.quarter} · Tháng {plan.month}
                          </div>
                          <Badge variant="outline" className="mt-1 text-[10px] font-normal">
                            v{plan.version}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-foreground line-clamp-1" title={node?.name}>
                            {node?.name || "Chưa rõ công việc"}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate" title={mission?.name}>
                            [{mission?.code}] {mission?.name}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-medium text-foreground">{plan.department}</td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">
                            {money(plan.quantity)} {node?.unit || "đv"}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Thực hiện: {money(actual)} {node?.unit}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {money(plan.cost)} đ
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">{plan.days} ngày</td>

                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-normal ${statusConfig.badge}`}>
                            {statusConfig.label}
                          </Badge>
                          {plan.reason && (
                            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1 italic" title={plan.reason}>
                              "{plan.reason}"
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Trình duyệt (Draft -> Pending) */}
                            {allowed("update") && plan.status === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] gap-1 text-primary"
                                onClick={() => handleSubmitForApproval(plan)}
                              >
                                <Send className="h-3 w-3" />
                                <span>Trình duyệt</span>
                              </Button>
                            )}

                            {/* Phê duyệt / Từ chối (Pending) */}
                            {allowed("update") && plan.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleOpenDecision(plan, "approved")}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Duyệt</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] gap-1 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleOpenDecision(plan, "rejected")}
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>Từ chối</span>
                                </Button>
                              </>
                            )}

                            {/* Điều chỉnh kế hoạch đã duyệt (UC-08) */}
                            {allowed("update") && plan.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] gap-1"
                                title="Đề xuất điều chỉnh chỉ tiêu (UC-08)"
                                onClick={() => handleOpenEdit(plan)}
                              >
                                <GitCommit className="h-3 w-3 text-muted-foreground" />
                                <span>Điều chỉnh</span>
                              </Button>
                            )}

                            {/* Sửa bản nháp / bản từ chối */}
                            {allowed("update") && (plan.status === "draft" || plan.status === "rejected") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                title="Chỉnh sửa"
                                onClick={() => handleOpenEdit(plan)}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}

                            {/* Xóa bản nháp */}
                            {allowed("delete") && plan.status !== "approved" && plan.status !== "superseded" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                title="Xóa"
                                onClick={() => handleDeletePlanSafely(plan)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredPlans.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 font-medium">Không tìm thấy bản ghi kế hoạch nào</p>
                <p className="text-xs">Bấm "Lập kế hoạch chỉ tiêu" để thiết lập kế hoạch đợt đầu tiên.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: LỊCH SỬ ĐIỀU CHỈNH & AUDIT TRAIL (UC-08) */}
        {/* ========================================================================= */}
        <TabsContent value="audits" className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <span>Nhật ký thẩm định, điều chỉnh và phê duyệt đường cơ sở</span>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Quy tắc UC-08: Mọi thay đổi đều được lưu vết bất biến kèm phiên bản, người thực hiện và ý kiến chỉ đạo.
            </p>
          </div>

          <div className="space-y-3">
            {[...data.audits].reverse().map((audit) => {
              const linkedPlan = data.plans.find((p) => p.id === audit.planId)
              const linkedNode = linkedPlan ? data.nodes.find((n) => n.id === linkedPlan.nodeId) : null

              return (
                <div key={audit.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-semibold text-primary">
                        {audit.action}
                      </Badge>
                      <span className="text-xs font-medium text-foreground">bởi <strong>{audit.actor}</strong></span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(audit.at).toLocaleString("vi-VN")}
                    </span>
                  </div>

                  {linkedNode && (
                    <p className="text-xs text-muted-foreground">
                      Công việc áp dụng: <strong>{linkedNode.name}</strong> ({linkedPlan?.department})
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t pt-2">
                    <div className="rounded-lg bg-muted/30 p-2.5">
                      <span className="block font-semibold text-muted-foreground text-[10px] uppercase">Trước khi đổi / Nội dung cũ</span>
                      <p className="mt-1 text-foreground break-words">{audit.before || "(Không có)"}</p>
                    </div>

                    <div className="rounded-lg bg-primary/5 p-2.5 border border-primary/20">
                      <span className="block font-semibold text-primary text-[10px] uppercase">Sau khi duyệt / Quyết định mới</span>
                      <p className="mt-1 text-foreground break-words">{audit.after}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOG: LẬP KẾ HOẠCH HOẶC ĐIỀU CHỈNH (UC-06 & UC-08) */}
      {/* ========================================================================= */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isAdjusting ? `Đề xuất điều chỉnh kế hoạch (Phiên bản v${(adjustTarget?.version || 1) + 1})` : planForm.id ? "Sửa kế hoạch nháp" : "Lập kế hoạch chỉ tiêu mới"}
            </DialogTitle>
            <DialogDescription>
              {isAdjusting
                ? "Quy tắc UC-08: Nêu rõ lý do điều chỉnh, chỉ tiêu trước - sau và đánh giá tác động ngân sách."
                : "Thiết lập chỉ tiêu khối lượng, dự toán chi phí và thời gian thực hiện theo từng tháng/quý."}
            </DialogDescription>
          </DialogHeader>

          {isAdjusting && adjustTarget && (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
              <span className="font-semibold text-primary flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Thông số đường cơ sở hiện tại (v{adjustTarget.version}):
              </span>
              <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                <div>Khối lượng cũ: <strong>{money(adjustTarget.quantity)}</strong></div>
                <div>Chi phí cũ: <strong>{money(adjustTarget.cost)} đ</strong></div>
                <div>Thời gian cũ: <strong>{adjustTarget.days} ngày</strong></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSavePlan} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Nhiệm vụ / Đề án <span className="text-destructive">*</span></Label>
                <Select
                  value={planForm.missionId}
                  onValueChange={(v) => {
                    const firstNode = data.nodes.find((n) => n.missionId === v)
                    setPlanForm((p) => ({
                      ...p,
                      missionId: v,
                      nodeId: firstNode?.id || "",
                      department: firstNode?.department || "",
                    }))
                  }}
                  disabled={isAdjusting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhiệm vụ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {data.missions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        [{m.code}] {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Công việc / Hạng mục WBS <span className="text-destructive">*</span></Label>
                <Select
                  value={planForm.nodeId}
                  onValueChange={(v) => {
                    const matchedNode = data.nodes.find((n) => n.id === v)
                    setPlanForm((p) => ({
                      ...p,
                      nodeId: v,
                      department: matchedNode?.department || p.department,
                    }))
                  }}
                  disabled={isAdjusting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phần tử WBS..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.wbsCode ? `${node.wbsCode} - ` : ""}{node.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Đơn vị thực hiện <span className="text-destructive">*</span></Label>
                <Input
                  value={planForm.department}
                  onChange={(e) => setPlanForm((p) => ({ ...p, department: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Năm kế hoạch</Label>
                <Input
                  type="number"
                  value={planForm.year}
                  onChange={(e) => setPlanForm((p) => ({ ...p, year: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Tháng thực hiện</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={planForm.month}
                  onChange={(e) => {
                    const m = Number(e.target.value)
                    setPlanForm((p) => ({ ...p, month: m, quarter: Math.ceil(m / 3) }))
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Chỉ tiêu khối lượng kỹ thuật</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={planForm.quantity}
                  onChange={(e) => setPlanForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Chi phí kế hoạch (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={planForm.cost}
                  onChange={(e) => setPlanForm((p) => ({ ...p, cost: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Thời gian thi công dự kiến (ngày)</Label>
                <Input
                  type="number"
                  min={1}
                  value={planForm.days}
                  onChange={(e) => setPlanForm((p) => ({ ...p, days: Number(e.target.value) }))}
                  required
                />
              </div>

              {isAdjusting && (
                <div className="space-y-1 sm:col-span-2">
                  <Label>Lý do điều chỉnh kế hoạch <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="Nêu rõ nguyên nhân kỹ thuật, thời tiết, giải phóng mặt bằng... và đánh giá tác động"
                    rows={3}
                    value={planForm.reason}
                    onChange={(e) => setPlanForm((p) => ({ ...p, reason: e.target.value }))}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPlanDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">
                {isAdjusting ? "Gửi đề xuất điều chỉnh" : "Lưu kế hoạch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: PHÊ DUYỆT HOẶC TỪ CHỐI KẾ HOẠCH (UC-06 & UC-08) */}
      {/* ========================================================================= */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approved" ? "Phê duyệt kế hoạch" : "Từ chối phê duyệt kế hoạch"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approved"
                ? "Kế hoạch được duyệt sẽ chính thức trở thành đường cơ sở (Baseline) để theo dõi và đối chiếu."
                : "Bản kế hoạch đề xuất sẽ bị từ chối; đường cơ sở cũ (nếu có) tiếp tục có hiệu lực."}
            </DialogDescription>
          </DialogHeader>

          {reviewTarget && (
            <form onSubmit={handleConfirmDecision} className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
                <div>Đơn vị: <strong>{reviewTarget.department}</strong></div>
                <div>Kỳ kế hoạch: <strong>Tháng {reviewTarget.month}/{reviewTarget.year} (Phiên bản v{reviewTarget.version})</strong></div>
                <div>Khối lượng: <strong>{money(reviewTarget.quantity)}</strong> · Chi phí: <strong>{money(reviewTarget.cost)} đ</strong></div>
                {reviewTarget.reason && <div>Lý do đề xuất: <em>"{reviewTarget.reason}"</em></div>}
              </div>

              <div className="space-y-1">
                <Label>
                  {reviewAction === "approved" ? "Ý kiến chỉ đạo phê duyệt" : "Lý do từ chối phê duyệt"}
                  {reviewAction === "rejected" && <span className="text-destructive"> *</span>}
                </Label>
                <Textarea
                  placeholder={
                    reviewAction === "approved"
                      ? "Ghi chú ý kiến phê duyệt (tùy chọn)..."
                      : "Nêu rõ lý do từ chối (yêu cầu rà soát lại khối lượng, chi phí...)"
                  }
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required={reviewAction === "rejected"}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  className={reviewAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive"}
                >
                  {reviewAction === "approved" ? "Xác nhận phê duyệt" : "Xác nhận từ chối"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
