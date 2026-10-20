import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  Users,
  Award,
  Wrench,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

import { PageShell, nonNegative, useMissionPermission } from "./ui"
import {
  useMissionData,
  upsertMission,
  removeMission,
  uid,
  type Resource,
  type WorkNode,
} from "./store"

const RESOURCE_TYPE_CONFIG: Record<
  Resource["type"],
  { label: string; badge: string; icon: any }
> = {
  person: {
    label: "Nhân lực kỹ thuật",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200",
    icon: Users,
  },
  expert: {
    label: "Chuyên gia / Cố vấn",
    badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200",
    icon: Award,
  },
  equipment: {
    label: "Máy móc / Thiết bị ĐVL",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200",
    icon: Wrench,
  },
  material: {
    label: "Vật tư kỹ thuật",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200",
    icon: Boxes,
  },
}

const blankResource = (): Resource => ({
  id: "",
  missionId: "",
  nodeId: "",
  type: "person",
  name: "",
  skill: "",
  quantity: 1,
  department: "",
})

export default function ResourcesPage() {
  const data = useMissionData()
  const allowed = useMissionPermission("nguon-luc-nhiem-vu")

  // State
  const [activeTab, setActiveTab] = useState<"allocation" | "skill_gap">("allocation")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [missionFilter, setMissionFilter] = useState<string>("all")

  // Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<Resource>(blankResource)

  // UC-15: Skill Gap Analysis
  const skillGapAnalysis = useMemo(() => {
    return data.nodes
      .filter((node) => node.requiredSkill && node.requiredSkill.trim().length > 0)
      .map((node) => {
        const mission = data.missions.find((m) => m.id === node.missionId)
        const allocatedResources = data.resources.filter((r) => r.nodeId === node.id)

        // Check if required skill is satisfied by allocated persons/experts
        const matchingOfficers = allocatedResources.filter(
          (r) =>
            ["person", "expert"].includes(r.type) &&
            r.skill.toLowerCase().includes(node.requiredSkill.toLowerCase())
        )

        const matchingEquipment = allocatedResources.filter((r) => r.type === "equipment")

        const isSatisfied = matchingOfficers.length > 0

        return {
          node,
          mission,
          requiredSkill: node.requiredSkill,
          allocatedResources,
          matchingOfficers,
          matchingEquipment,
          isSatisfied,
        }
      })
  }, [data.nodes, data.missions, data.resources])

  const missingGaps = useMemo(() => {
    return skillGapAnalysis.filter((item) => !item.isSatisfied)
  }, [skillGapAnalysis])

  // Filtered Resources
  const filteredResources = useMemo(() => {
    return data.resources.filter((res) => {
      const node = data.nodes.find((n) => n.id === res.nodeId)
      const mission = data.missions.find((m) => m.id === res.missionId)

      const matchSearch =
        res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.skill.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mission?.name || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchType = typeFilter === "all" || res.type === typeFilter
      const matchMission = missionFilter === "all" || res.missionId === missionFilter

      return matchSearch && matchType && matchMission
    })
  }, [data.resources, data.nodes, data.missions, searchTerm, typeFilter, missionFilter])

  // Summary counts
  const summary = useMemo(() => {
    const total = data.resources.length
    const personCount = data.resources.filter((r) => r.type === "person").reduce((s, r) => s + r.quantity, 0)
    const expertCount = data.resources.filter((r) => r.type === "expert").reduce((s, r) => s + r.quantity, 0)
    const equipmentCount = data.resources.filter((r) => r.type === "equipment").reduce((s, r) => s + r.quantity, 0)
    const gapCount = missingGaps.length
    return { total, personCount, expertCount, equipmentCount, gapCount }
  }, [data.resources, missingGaps])

  // Open Create
  const handleOpenCreate = () => {
    const firstMission = data.missions[0]
    const firstNode = data.nodes.find((n) => n.missionId === firstMission?.id)
    setForm({
      ...blankResource(),
      missionId: firstMission?.id || "",
      nodeId: firstNode?.id || "",
      department: firstNode?.department || firstMission?.department || "",
      skill: firstNode?.requiredSkill || "",
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (res: Resource) => {
    setForm({ ...res })
    setDialogOpen(true)
  }

  // Save Resource
  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowed(form.id ? "update" : "create")) {
      toast.error("Bạn không có quyền thực hiện thao tác này")
      return
    }

    if (!form.name.trim() || !form.department.trim() || !nonNegative(form.quantity) || form.quantity === 0) {
      toast.error("Vui lòng điền đầy đủ tên nguồn lực, đơn vị và số lượng hợp lệ (>= 1)")
      return
    }

    const saved: Resource = {
      ...form,
      id: form.id || uid(),
      name: form.name.trim(),
    }

    upsertMission("resources", saved)
    setDialogOpen(false)
    toast.success(form.id ? "Đã cập nhật phân bổ nguồn lực" : "Đã thêm phân bổ nguồn lực thành công")
  }

  const handleDeleteResource = (res: Resource) => {
    if (!allowed("delete")) {
      toast.error("Bạn không có quyền xóa nguồn lực")
      return
    }
    if (window.confirm(`Xác nhận xóa phân bổ "${res.name}"?`)) {
      removeMission("resources", res.id)
      toast.success("Đã xóa phân bổ nguồn lực")
    }
  }

  return (
    <PageShell
      title="Nguồn lực nhiệm vụ & Kiểm tra chuyên môn"
      subtitle="PRJ-14 & PRJ-15 · Phân bổ nhân lực, chuyên gia, máy móc thiết bị, vật tư và cảnh báo thiếu hụt năng lực"
    >
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cảnh báo thiếu chuyên môn</span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{summary.gapCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Công việc chưa có đủ nhân sự đáp ứng kỹ năng</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nhân lực kỹ thuật</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.personCount} <span className="text-xs font-normal text-muted-foreground">người</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Kỹ sư, kỹ thuật viên thực địa và nội nghiệp</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chuyên gia / Cố vấn</span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.expertCount} <span className="text-xs font-normal text-muted-foreground">chuyên gia</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Tiến sĩ, Thạc sĩ phụ trách đề tài</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Thiết bị máy móc ĐVL</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.equipmentCount} <span className="text-xs font-normal text-muted-foreground">bộ máy</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Từ kế, máy địa chấn, trạm trọng lực, GPS</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl border bg-muted/60 p-1 sm:w-[480px]">
          <TabsTrigger value="allocation" className="flex items-center gap-2 text-sm">
            <Boxes className="h-4 w-4" />
            <span>Phân bổ nguồn lực</span>
          </TabsTrigger>
          <TabsTrigger value="skill_gap" className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Kiểm tra thiếu chuyên môn</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: PHÂN BỔ NGUỒN LỰC (UC-14) */}
        {/* ========================================================================= */}
        <TabsContent value="allocation" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm nguồn lực, kỹ năng, thiết bị, đơn vị..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Loại nguồn lực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nguồn lực</SelectItem>
                  <SelectItem value="person">Nhân lực kỹ thuật</SelectItem>
                  <SelectItem value="expert">Chuyên gia</SelectItem>
                  <SelectItem value="equipment">Máy móc thiết bị</SelectItem>
                  <SelectItem value="material">Vật tư</SelectItem>
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
              <Button onClick={handleOpenCreate} className="shrink-0 gap-2">
                <Plus className="h-4 w-4" />
                Gán phân bổ nguồn lực
              </Button>
            )}
          </div>

          {/* Resources Table */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Loại nguồn lực</th>
                    <th className="px-4 py-3 font-medium">Tên nhân sự / Thiết bị / Vật tư</th>
                    <th className="px-4 py-3 font-medium">Chuyên môn / Năng lực</th>
                    <th className="px-4 py-3 font-medium">Số lượng</th>
                    <th className="px-4 py-3 font-medium">Đơn vị chủ quản</th>
                    <th className="px-4 py-3 font-medium">Công việc WBS áp dụng</th>
                    <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResources.map((res) => {
                    const node = data.nodes.find((n) => n.id === res.nodeId)
                    const mission = data.missions.find((m) => m.id === res.missionId)
                    const typeConfig = RESOURCE_TYPE_CONFIG[res.type] || RESOURCE_TYPE_CONFIG.person
                    const Icon = typeConfig.icon

                    return (
                      <tr key={res.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-normal gap-1 ${typeConfig.badge}`}>
                            <Icon className="h-3 w-3" />
                            <span>{typeConfig.label}</span>
                          </Badge>
                        </td>

                        <td className="px-4 py-3 font-bold text-foreground">{res.name}</td>

                        <td className="px-4 py-3 text-muted-foreground">{res.skill || "—"}</td>

                        <td className="px-4 py-3 font-semibold text-foreground">{res.quantity}</td>

                        <td className="px-4 py-3 text-muted-foreground">{res.department}</td>

                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-foreground line-clamp-1">{node?.name || "Chưa rõ"}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            [{mission?.code}] {mission?.name}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {allowed("update") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleOpenEdit(res)}
                              >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}

                            {allowed("delete") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteResource(res)}
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

            {filteredResources.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Boxes className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 font-medium">Chưa có phân bổ nguồn lực nào</p>
                <p className="text-xs">Bấm "Gán phân bổ nguồn lực" để phân công nhân sự hoặc điều động thiết bị.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: KIỂM TRA THIẾU CHUYÊN MÔN / NĂNG LỰC (UC-15) */}
        {/* ========================================================================= */}
        <TabsContent value="skill_gap" className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Đối chiếu năng lực bắt buộc và nhân sự/thiết bị đã gán</span>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Quy tắc UC-15: Công việc có yêu cầu chuyên môn cao phải được bố trí nhân sự/chuyên gia có chứng chỉ và kỹ năng tương ứng trước khi phê duyệt thực hiện.
            </p>
          </div>

          <div className="space-y-3">
            {skillGapAnalysis.map((item) => (
              <div
                key={item.node.id}
                className={`rounded-xl border p-4 shadow-sm transition ${item.isSatisfied
                  ? "bg-card border-emerald-200 dark:border-emerald-950"
                  : "bg-rose-50/50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900"
                  }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold ${item.isSatisfied
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                      >
                        {item.isSatisfied ? "Đã đáp ứng chuyên môn" : "Thiếu chuyên môn bắt buộc"}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-primary">[{item.mission?.code}]</span>
                      <span className="text-xs text-muted-foreground">{item.node.department}</span>
                    </div>

                    <h4 className="text-base font-bold text-foreground">{item.node.name}</h4>

                    <p className="text-xs text-muted-foreground">
                      Chuyên môn bắt buộc: <strong className="text-primary">{item.requiredSkill}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.isSatisfied ? (
                      <div className="text-right text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Đã có {item.matchingOfficers.length} nhân sự đáp ứng</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={() => {
                          setForm({
                            ...blankResource(),
                            missionId: item.node.missionId,
                            nodeId: item.node.id,
                            department: item.node.department,
                            skill: item.requiredSkill,
                          })
                          setDialogOpen(true)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Bổ sung nhân sự chuyên môn</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Allocated Officers List */}
                {item.allocatedResources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-2 text-xs">
                    <span className="text-muted-foreground">Đã phân bổ:</span>
                    {item.allocatedResources.map((res) => (
                      <Badge key={res.id} variant="secondary" className="text-[11px]">
                        {res.name} ({res.skill || res.type})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* DIALOG: PHÂN BỔ NGUỒN LỰC */}
      {/* ========================================================================= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Sửa phân bổ nguồn lực" : "Gán phân bổ nguồn lực vào công việc"}</DialogTitle>
            <DialogDescription>
              Phân công nhân lực, chỉ định chuyên gia hoặc điều động máy móc thiết bị cho công việc WBS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveResource} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>Nhiệm vụ / Đề án</Label>
                <Select
                  value={form.missionId}
                  onValueChange={(v) => {
                    const firstNode = data.nodes.find((n) => n.missionId === v)
                    setForm((p) => ({
                      ...p,
                      missionId: v,
                      nodeId: firstNode?.id || "",
                      department: firstNode?.department || "",
                      skill: firstNode?.requiredSkill || "",
                    }))
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
                <Label>Công việc WBS áp dụng</Label>
                <Select
                  value={form.nodeId}
                  onValueChange={(v) => {
                    const matchedNode = data.nodes.find((n) => n.id === v)
                    setForm((p) => ({
                      ...p,
                      nodeId: v,
                      department: matchedNode?.department || p.department,
                      skill: matchedNode?.requiredSkill || p.skill,
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.nodes
                      .filter((n) => n.missionId === form.missionId)
                      .map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.name} ({node.department})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Loại nguồn lực</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v as Resource["type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Nhân lực kỹ thuật</SelectItem>
                    <SelectItem value="expert">Chuyên gia / Cố vấn</SelectItem>
                    <SelectItem value="equipment">Máy móc / Thiết bị ĐVL</SelectItem>
                    <SelectItem value="material">Vật tư kỹ thuật</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Số lượng</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Tên nhân sự / Thiết bị / Vật tư <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="TS. Nguyễn Văn Tuấn / Hệ thống từ kế CS-3..."
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Chuyên môn / Năng lực / Thông số kỹ thuật</Label>
                <Input
                  placeholder="Kỹ thuật bay đo từ / Phần mềm Oasis Montaj..."
                  value={form.skill}
                  onChange={(e) => setForm((p) => ({ ...p, skill: e.target.value }))}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label>Đơn vị chủ quản <span className="text-destructive">*</span></Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Lưu phân bổ nguồn lực</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
