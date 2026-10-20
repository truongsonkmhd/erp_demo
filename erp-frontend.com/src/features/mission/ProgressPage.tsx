import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Bell,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
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

import { PageShell, money, nonNegative, useMissionPermission } from "./ui"
import {
  useMissionData,
  upsertMission,
  removeMission,
  plannedQuantity,
  actualQuantity,
  progressStatus,
  uid,
  type Progress,
  type WorkNode,
} from "./store"

const blankProgress = (): Progress => ({
  id: "",
  missionId: "",
  nodeId: "",
  date: new Date().toISOString().slice(0, 10),
  quantity: 0,
  cost: 0,
  disbursement: 0,
  reason: "",
  remedy: "",
})

export default function ProgressPage() {
  const data = useMissionData()
  const allowed = useMissionPermission("theo-doi-tien-do")

  // State
  const [activeTab, setActiveTab] = useState<"priority" | "comparison" | "logs">("priority")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [missionFilter, setMissionFilter] = useState<string>("all")

  // Log Form Modal
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [logForm, setLogForm] = useState<Progress>(blankProgress)

  // Remedy Modal (UC-12)
  const [remedyDialogOpen, setRemedyDialogOpen] = useState(false)
  const [remedyTarget, setRemedyTarget] = useState<Progress | null>(null)
  const [remedyReason, setRemedyReason] = useState("")
  const [remedyAction, setRemedyAction] = useState("")

  // Detailed ranking & status computation (UC-09, 10, 11, 13)
  const rankedItems = useMemo(() => {
    return data.nodes.map((node) => {
      const mission = data.missions.find((m) => m.id === node.missionId)
      const planned = plannedQuantity(data, node.id)
      const actual = actualQuantity(data, node.id)
      const status = progressStatus(node.dueDate, planned, actual)

      // Calculate days late
      const lateDays =
        node.dueDate && status === "Chậm"
          ? Math.max(0, Math.floor((Date.now() - new Date(node.dueDate + "T23:59:59").getTime()) / 86400000))
          : 0

      // Calculate days remaining
      const daysRemaining = node.dueDate
        ? Math.ceil((new Date(node.dueDate + "T23:59:59").getTime() - Date.now()) / 86400000)
        : null

      // Progress percentage
      const percent = planned > 0 ? Math.round((actual / planned) * 100) : null

      // Forecast calculation (UC-11)
      const entries = data.progress.filter((p) => p.nodeId === node.id)
      const elapsed = entries.length ? Math.max(1, Math.ceil((Date.now() - new Date(entries[0].date).getTime()) / 86400000)) : 0
      const daysLeftInYear = Math.max(0, Math.ceil((new Date(new Date().getFullYear(), 11, 31).getTime() - Date.now()) / 86400000))
      const forecastPercent =
        elapsed > 0 && planned > 0
          ? Math.round(Math.min(100, ((actual + (actual / elapsed) * daysLeftInYear) / planned) * 100))
          : null

      // Cost & Disbursement
      const totalCost = entries.reduce((s, e) => s + (e.cost || 0), 0)
      const totalDisbursement = entries.reduce((s, e) => s + (e.disbursement || 0), 0)

      return {
        node,
        mission,
        planned,
        actual,
        percent,
        status,
        lateDays,
        daysRemaining,
        forecastPercent,
        totalCost,
        totalDisbursement,
        entries,
      }
    })
  }, [data.nodes, data.missions, data.plans, data.progress])

  // Priority list (sorted by urgency: Chậm > Nguy cơ > Sắp đến hạn > Đúng tiến độ)
  const priorityList = useMemo(() => {
    return rankedItems
      .filter((item) => {
        const matchSearch =
          item.node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.node.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.node.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.mission?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.mission?.code || "").toLowerCase().includes(searchTerm.toLowerCase())

        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "late" && item.status === "Chậm") ||
          (statusFilter === "risk" && item.status === "Nguy cơ") ||
          (statusFilter === "ontime" && item.status === "Đúng tiến độ") ||
          (statusFilter === "completed" && item.status === "Hoàn thành")

        const matchMission = missionFilter === "all" || item.node.missionId === missionFilter

        return matchSearch && matchStatus && matchMission
      })
      .sort((a, b) => {
        const score = (s: string) => (s === "Chậm" ? 4 : s === "Nguy cơ" ? 3 : s === "Đúng tiến độ" ? 2 : 1)
        if (score(b.status) !== score(a.status)) return score(b.status) - score(a.status)
        return b.lateDays - a.lateDays
      })
  }, [rankedItems, searchTerm, statusFilter, missionFilter])

  // Stats summary
  const summary = useMemo(() => {
    const total = rankedItems.length
    const late = rankedItems.filter((i) => i.status === "Chậm").length
    const risk = rankedItems.filter((i) => i.status === "Nguy cơ").length
    const onTime = rankedItems.filter((i) => ["Đúng tiến độ", "Hoàn thành"].includes(i.status)).length
    return { total, late, risk, onTime }
  }, [rankedItems])

  // Open Log Form Modal
  const handleOpenAddLog = (nodeId?: string, missionId?: string) => {
    setLogForm({
      ...blankProgress(),
      missionId: missionId || data.missions[0]?.id || "",
      nodeId: nodeId || data.nodes[0]?.id || "",
    })
    setLogDialogOpen(true)
  }

  const handleOpenEditLog = (p: Progress) => {
    setLogForm({ ...p })
    setLogDialogOpen(true)
  }

  // Save Progress Log
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed(logForm.id ? "update" : "create")) {
      toast.error("Bạn không có quyền cập nhật nhật ký thực hiện")
      return
    }

    if (!logForm.date || !nonNegative(logForm.quantity, logForm.cost, logForm.disbursement)) {
      toast.error("Vui lòng kiểm tra lại ngày và các chỉ tiêu số liệu (không âm)")
      return
    }

    const saved: Progress = {
      ...logForm,
      id: logForm.id || uid(),
    }

    upsertMission("progress", saved)
    setLogDialogOpen(false)
    toast.success(logForm.id ? "Đã cập nhật nhật ký thực hiện" : "Đã ghi nhận khối lượng thực hiện mới")
  }

  // Open Remedy Modal (UC-12)
  const handleOpenRemedy = (entry: Progress) => {
    setRemedyTarget(entry)
    setRemedyReason(entry.reason || "")
    setRemedyAction(entry.remedy || "")
    setRemedyDialogOpen(true)
  }

  // Save Remedy
  const handleSaveRemedy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!remedyTarget) return
    if (!allowed("update")) {
      toast.error("Bạn không có quyền cập nhật giải trình")
      return
    }

    if (!remedyReason.trim() || !remedyAction.trim()) {
      toast.error("Vui lòng nêu rõ nguyên nhân và biện pháp khắc phục cụ thể")
      return
    }

    const updated: Progress = {
      ...remedyTarget,
      reason: remedyReason.trim(),
      remedy: remedyAction.trim(),
    }

    upsertMission("progress", updated)
    setRemedyDialogOpen(false)
    toast.success("Đã lưu nguyên nhân và biện pháp khắc phục chậm tiến độ")
  }

  // Send Reminder (UC-13)
  const handleSendReminder = (item: (typeof rankedItems)[0]) => {
    toast.success(`Đã gửi thông báo đôn đốc tiến độ đến cán bộ phụ trách: ${item.node.assignee} (${item.node.department})`)
  }

  // Delete Log
  const handleDeleteLog = (entry: Progress) => {
    if (!allowed("delete")) {
      toast.error("Bạn không có quyền xóa nhật ký")
      return
    }
    if (window.confirm("Xác nhận xóa bản ghi nhật ký này?")) {
      removeMission("progress", entry.id)
      toast.success("Đã xóa bản ghi nhật ký")
    }
  }

  return (
    <PageShell
      title="Theo dõi tiến độ & Xử lý chậm"
      subtitle="PRJ-07, 09, 10, 12, 13 · Đối chiếu kế hoạch - thực hiện, phân loại tiến độ tự động và biên bản xử lý chậm"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chậm tiến độ (Đỏ)</span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.late}</p>
          <p className="mt-1 text-xs text-muted-foreground">Công việc quá hạn cần ưu tiên xử lý ngay</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nguy cơ chậm (Vàng)</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.risk}</p>
          <p className="mt-1 text-xs text-muted-foreground">Còn dưới 14 ngày hoặc tiến độ &lt; 50%</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đúng hạn / Hoàn thành</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.onTime}</p>
          <p className="mt-1 text-xs text-muted-foreground">Đảm bảo chỉ tiêu tiến độ được giao</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng phần tử WBS</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold">{summary.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Điểm kiểm soát khối lượng toàn Liên đoàn</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid h-12 w-full grid-cols-3 rounded-xl border bg-muted/60 p-1 sm:w-[580px]">
          <TabsTrigger value="priority" className="flex items-center gap-2 text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span>Ưu tiên xử lý & Cảnh báo</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            <span>Đối chiếu KH - TH</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span>Nhật ký & Biện pháp</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: DANH SÁCH ƯU TIÊN XỬ LÝ & CẢNH BÁO TỰ ĐỘNG (UC-09, 10, 13) */}
        {/* ========================================================================= */}
        <TabsContent value="priority" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm công việc, cán bộ phụ trách, đơn vị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Mức độ cảnh báo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="late">Chậm tiến độ (Đỏ)</SelectItem>
                  <SelectItem value="risk">Nguy cơ chậm (Vàng)</SelectItem>
                  <SelectItem value="ontime">Đúng tiến độ (Xanh)</SelectItem>
                  <SelectItem value="completed">Đã hoàn thành</SelectItem>
                </SelectContent>
              </Select>

              <Select value={missionFilter} onValueChange={setMissionFilter}>
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
              <Button onClick={() => handleOpenAddLog()} className="shrink-0 gap-2">
                <Plus className="h-4 w-4" />
                Ghi nhận thực hiện mới
              </Button>
            )}
          </div>

          {/* Priority Cards List */}
          <div className="space-y-3">
            {priorityList.map((item) => {
              const isLate = item.status === "Chậm"
              const isRisk = item.status === "Nguy cơ"
              const isDone = item.status === "Hoàn thành"

              return (
                <div
                  key={item.node.id}
                  className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${isLate
                    ? "border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20"
                    : isRisk
                      ? "border-amber-300 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20"
                      : "bg-card"
                    }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold ${isLate
                            ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200"
                            : isRisk
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
                              : isDone
                                ? "bg-teal-100 text-teal-800 border-teal-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                            }`}
                        >
                          {item.status}
                          {isLate && item.lateDays > 0 ? ` (Chậm ${item.lateDays} ngày)` : ""}
                        </Badge>

                        <span className="font-mono text-xs font-bold text-primary">
                          [{item.mission?.code}]
                        </span>

                        <span className="text-xs text-muted-foreground truncate" title={item.mission?.name}>
                          {item.mission?.name}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-foreground">{item.node.name}</h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {item.node.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          Phụ trách: <strong>{item.node.assignee}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Hạn: <strong>{item.node.dueDate || "Chưa giao"}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Stats & Progress */}
                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Khối lượng KH / TH</div>
                        <div className="text-sm font-bold text-foreground">
                          {money(item.planned)} / <span className="text-emerald-600">{money(item.actual)}</span>{" "}
                          <span className="text-xs font-normal text-muted-foreground">{item.node.unit}</span>
                        </div>
                        {item.percent !== null && (
                          <div className="text-[11px] text-muted-foreground">Đạt {item.percent}% kế hoạch</div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {isLate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 border-rose-300 text-rose-700 hover:bg-rose-100"
                            onClick={() => handleSendReminder(item)}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            <span>Đôn đốc</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleOpenAddLog(item.node.id, item.node.missionId)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Ghi số liệu</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* UC-10: Detailed delay reason & remedy preview */}
                  {item.entries.some((e) => e.reason || e.remedy) && (
                    <div className="mt-3 rounded-lg border bg-background/80 p-3 text-xs space-y-1">
                      {item.entries.find((e) => e.reason)?.reason && (
                        <p className="text-rose-700 dark:text-rose-300">
                          <strong>Nguyên nhân chậm:</strong> {item.entries.find((e) => e.reason)?.reason}
                        </p>
                      )}
                      {item.entries.find((e) => e.remedy)?.remedy && (
                        <p className="text-emerald-700 dark:text-emerald-300">
                          <strong>Biện pháp khắc phục:</strong> {item.entries.find((e) => e.remedy)?.remedy}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: ĐỐI CHIẾU KẾ HOẠCH - THỰC HIỆN (UC-07) */}
        {/* ========================================================================= */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="border-b bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold">
                Bảng đối chiếu chỉ tiêu Kế hoạch (KH) – Thực hiện (TH) & Độ lệch (Δ)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/20 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Công việc WBS</th>
                    <th className="px-4 py-3 font-medium">Đơn vị & Cán bộ</th>
                    <th className="px-4 py-3 font-medium">Hạn hoàn thành</th>
                    <th className="px-4 py-3 font-medium">Khối lượng KH</th>
                    <th className="px-4 py-3 font-medium">Khối lượng TH</th>
                    <th className="px-4 py-3 font-medium">Chênh lệch (Δ)</th>
                    <th className="px-4 py-3 font-medium">Tỷ lệ đạt (%)</th>
                    <th className="px-4 py-3 font-medium">Dự toán / Giải ngân</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rankedItems.map((item) => {
                    const diff = item.actual - item.planned
                    const isDeficit = diff < 0

                    return (
                      <tr key={item.node.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-foreground line-clamp-1">{item.node.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            [{item.mission?.code}] {item.mission?.name}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{item.node.department}</div>
                          <div className="text-[11px] text-muted-foreground">{item.node.assignee}</div>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">{item.node.dueDate || "—"}</td>

                        <td className="px-4 py-3 font-bold text-foreground">
                          {item.planned > 0 ? `${money(item.planned)} ${item.node.unit}` : "Chưa có KH"}
                        </td>

                        <td className="px-4 py-3 font-bold text-emerald-600">
                          {money(item.actual)} {item.node.unit}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {item.planned > 0 ? (
                            <span className={isDeficit ? "text-rose-600" : "text-emerald-600"}>
                              {isDeficit ? "" : "+"}
                              {money(diff)} {item.node.unit}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold">
                          {item.percent !== null ? (
                            <span className={item.percent < 100 ? "text-amber-600" : "text-emerald-600"}>
                              {item.percent}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          <div>CP: {money(item.totalCost)} đ</div>
                          <div>GN: {money(item.totalDisbursement)} đ</div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${item.status === "Chậm"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : item.status === "Nguy cơ"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                          >
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: NHẬT KÝ THỰC HIỆN & BIỆN PHÁP XỬ LÝ (UC-12) */}
        {/* ========================================================================= */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Nhật ký khối lượng hoàn thành, giải ngân và biện pháp khắc phục</h3>
            {allowed("create") && (
              <Button size="sm" onClick={() => handleOpenAddLog()} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Thêm nhật ký thực hiện
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {[...data.progress].reverse().map((entry) => {
              const node = data.nodes.find((n) => n.id === entry.nodeId)
              const mission = node ? data.missions.find((m) => m.id === node.missionId) : null

              return (
                <div key={entry.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">[{mission?.code}]</span>
                        <h4 className="text-sm font-bold text-foreground">{node?.name || "Công việc"}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ngày ghi nhận: <strong>{entry.date}</strong> · Đơn vị: {node?.department}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {allowed("update") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleOpenRemedy(entry)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Ghi biện pháp</span>
                        </Button>
                      )}

                      {allowed("delete") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteLog(entry)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2.5 text-xs">
                    <div>Khối lượng: <strong className="text-emerald-600">{money(entry.quantity)} {node?.unit}</strong></div>
                    <div>Chi phí phát sinh: <strong>{money(entry.cost)} đ</strong></div>
                    <div>Giải ngân thực tế: <strong>{money(entry.disbursement)} đ</strong></div>
                  </div>

                  {(entry.reason || entry.remedy) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs border-t pt-2">
                      <div className="rounded-md bg-rose-50/60 p-2 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
                        <strong>Nguyên nhân phát sinh:</strong> {entry.reason || "Chưa ghi nhận"}
                      </div>
                      <div className="rounded-md bg-emerald-50/60 p-2 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <strong>Biện pháp khắc phục:</strong> {entry.remedy || "Chưa có biện pháp"}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOG: GHI NHẬN THỰC HIỆN TIẾN ĐỘ */}
      {/* ========================================================================= */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{logForm.id ? "Sửa nhật ký thực hiện" : "Ghi nhận khối lượng thực hiện mới"}</DialogTitle>
            <DialogDescription>
              Cập nhật số liệu thực hiện chính thức từ phân hệ kỹ thuật và giải ngân tài chính.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveLog} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Nhiệm vụ / Đề án</Label>
                <Select
                  value={logForm.missionId}
                  onValueChange={(v) => {
                    const firstNode = data.nodes.find((n) => n.missionId === v)
                    setLogForm((p) => ({ ...p, missionId: v, nodeId: firstNode?.id || "" }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Công việc WBS</Label>
                <Select
                  value={logForm.nodeId}
                  onValueChange={(v) => setLogForm((p) => ({ ...p, nodeId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.nodes
                      .filter((n) => n.missionId === logForm.missionId)
                      .map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.name} ({node.department})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Ngày ghi nhận thực hiện <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={logForm.date}
                  onChange={(e) => setLogForm((p) => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Khối lượng thực hiện <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={logForm.quantity}
                  onChange={(e) => setLogForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Chi phí phát sinh thực hiện (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={logForm.cost}
                  onChange={(e) => setLogForm((p) => ({ ...p, cost: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1">
                <Label>Giá trị giải ngân thực tế (đ)</Label>
                <Input
                  type="number"
                  min={0}
                  value={logForm.disbursement}
                  onChange={(e) => setLogForm((p) => ({ ...p, disbursement: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Nguyên nhân chậm (nếu có)</Label>
                <Textarea
                  placeholder="Mô tả các trở ngại về địa hình, thiết bị hỏng, thời tiết mưa bão..."
                  rows={2}
                  value={logForm.reason}
                  onChange={(e) => setLogForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Biện pháp khắc phục (nếu có)</Label>
                <Textarea
                  placeholder="Biện pháp xử lý: tăng ca, bổ sung thiết bị, chuyển đổi kíp bay..."
                  rows={2}
                  value={logForm.remedy}
                  onChange={(e) => setLogForm((p) => ({ ...p, remedy: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu số liệu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: GHI NGUYÊN NHÂN & BIỆN PHÁP KHẮC PHỤC (UC-12) */}
      {/* ========================================================================= */}
      <Dialog open={remedyDialogOpen} onOpenChange={setRemedyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ghi nguyên nhân & biện pháp khắc phục chậm tiến độ (UC-12)</DialogTitle>
            <DialogDescription>
              Quy tắc UC-12: Lưu giữ lịch sử thay đổi giải trình; cảnh báo sẽ không tự biến mất khi sửa đổi ghi chú.
            </DialogDescription>
          </DialogHeader>

          {remedyTarget && (
            <form onSubmit={handleSaveRemedy} className="space-y-4">
              <div className="space-y-2">
                <Label>Nguyên nhân gây chậm <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Nêu chi tiết nguyên nhân khách quan và chủ quan..."
                  rows={3}
                  value={remedyReason}
                  onChange={(e) => setRemedyReason(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Biện pháp xử lý / khắc phục <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Giải pháp cụ thể, phân công người chịu trách nhiệm và thời hạn hoàn thành khắc phục..."
                  rows={3}
                  value={remedyAction}
                  onChange={(e) => setRemedyAction(e.target.value)}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRemedyDialogOpen(false)}>
                  Hủy bỏ
                </Button>
                <Button type="submit">Lưu biên bản giải trình & biện pháp</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
