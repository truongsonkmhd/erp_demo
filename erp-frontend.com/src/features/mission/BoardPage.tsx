import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Clock,
  Filter,
  Search,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { PageShell, money, useMissionPermission } from "./ui"
import {
  useMissionData,
  saveMissionData,
  plannedQuantity,
  actualQuantity,
  progressStatus,
  WORKFLOW_STATUS_CONFIG,
  NODE_KIND_LABELS,
  type WorkNode,
  type WorkflowStatus,
  type Mission,
} from "./store"
import { boardWorkItems } from "./workspace-state"

const COLUMNS: { id: WorkflowStatus; label: string; dot: string; border: string; bg: string; badge: string }[] = [
  {
    id: "new",
    label: "Mới tiếp nhận",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-slate-800",
    bg: "bg-slate-50/50 dark:bg-slate-950/20",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    id: "in_progress",
    label: "Đang thực hiện",
    dot: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-900",
    bg: "bg-blue-50/30 dark:bg-blue-950/10",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    id: "review",
    label: "Chờ nghiệm thu",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50/30 dark:bg-amber-950/10",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    id: "completed",
    label: "Đã hoàn thành",
    dot: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-900",
    bg: "bg-emerald-50/30 dark:bg-emerald-950/10",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
]

export default function BoardPage({ embedded = false, missionId, focusNodeId, onDetailDismiss, onOpenStructure }: { embedded?: boolean; missionId?: string; focusNodeId?: string | null; onDetailDismiss?: () => void; onOpenStructure?: (node: WorkNode) => void }) {
  const data = useMissionData()
  const allowed = useMissionPermission("theo-doi-tien-do")

  // Filter State
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMission, setSelectedMission] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all")

  // Drag State
  const [activeId, setActiveId] = useState<string | null>(null)

  // Card detail modal
  const [detailNode, setDetailNode] = useState<WorkNode | null>(null)
  const effectiveMission = missionId || selectedMission

  useEffect(() => {
    if (!focusNodeId) return
    const node = data.nodes.find((item) => item.id === focusNodeId && item.kind === "work" && (effectiveMission === "all" || item.missionId === effectiveMission))
    if (node) setDetailNode(node)
  }, [focusNodeId, effectiveMission, data.nodes])

  // Sensors for dnd-kit: 6px movement triggers drag, allowing clean clicks for modal
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Department options
  const departments = useMemo(() => {
    return [...new Set(boardWorkItems(data.nodes, effectiveMission).map((n) => n.department).filter(Boolean))].sort()
  }, [data.nodes, effectiveMission])

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return boardWorkItems(data.nodes, effectiveMission).filter((node) => {
      const mission = data.missions.find((m) => m.id === node.missionId)
      const planned = plannedQuantity(data, node.id)
      const actual = actualQuantity(data, node.id)
      const urgency = progressStatus(node.dueDate, planned, actual)

      const matchSearch =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (node.wbsCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mission?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mission?.code || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchDept = selectedDepartment === "all" || node.department === selectedDepartment

      const matchUrgency =
        selectedUrgency === "all" ||
        (selectedUrgency === "late" && urgency === "Chậm") ||
        (selectedUrgency === "risk" && urgency === "Nguy cơ") ||
        (selectedUrgency === "ontime" && ["Đúng tiến độ", "Hoàn thành"].includes(urgency))

      return matchSearch && matchDept && matchUrgency
    })
  }, [data, searchTerm, effectiveMission, selectedDepartment, selectedUrgency])

  // Group nodes by workflowStatus
  const columnsData = useMemo(() => {
    const map: Record<WorkflowStatus, WorkNode[]> = {
      new: [],
      in_progress: [],
      review: [],
      completed: [],
    }

    filteredNodes.forEach((node) => {
      const status = node.workflowStatus || "new"
      if (map[status]) {
        map[status].push(node)
      } else {
        map.new.push(node)
      }
    })

    // Sort by rank within each column
    Object.keys(map).forEach((key) => {
      const col = key as WorkflowStatus
      map[col].sort((a, b) => (a.rank || 0) - (b.rank || 0))
    })

    return map
  }, [filteredNodes])

  // Active dragged item for DragOverlay
  const activeNode = useMemo(() => {
    if (!activeId) return null
    return data.nodes.find((n) => n.id === activeId) || null
  }, [activeId, data.nodes])

  // Drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  // Drag end: drop on column or over another card
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return
    if (!allowed("update")) {
      toast.error("Bạn không có quyền thay đổi trạng thái công việc")
      return
    }

    const activeNodeId = String(active.id)
    const overId = String(over.id)

    const currentNode = data.nodes.find((n) => n.id === activeNodeId)
    if (!currentNode || currentNode.kind !== "work") return

    // Target is either a column container or a card inside a column
    const isColumnTarget = COLUMNS.some((c) => c.id === overId)
    const targetStatus: WorkflowStatus = isColumnTarget
      ? (overId as WorkflowStatus)
      : (data.nodes.find((n) => n.id === overId)?.workflowStatus || "new")

    // Filter other nodes in the target column
    const otherNodesInCol = data.nodes
      .filter((n) => n.kind === "work" && n.missionId === currentNode.missionId && (n.workflowStatus || "new") === targetStatus && n.id !== activeNodeId)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0))

    let insertIndex = otherNodesInCol.length
    if (!isColumnTarget) {
      const overIndex = otherNodesInCol.findIndex((n) => n.id === overId)
      if (overIndex !== -1) insertIndex = overIndex
    }

    const newColNodes = [...otherNodesInCol]
    newColNodes.splice(insertIndex, 0, {
      ...currentNode,
      workflowStatus: targetStatus,
    })

    const rankMap = new Map<string, number>()
    newColNodes.forEach((item, idx) => {
      rankMap.set(item.id, idx + 1)
    })

    const finalNodes = data.nodes.map((node) => {
      if (node.id === activeNodeId) {
        return {
          ...node,
          workflowStatus: targetStatus,
          rank: rankMap.get(node.id) ?? (insertIndex + 1),
        }
      }
      if (rankMap.has(node.id)) {
        return {
          ...node,
          rank: rankMap.get(node.id)!,
        }
      }
      return node
    })

    saveMissionData({ ...data, nodes: finalNodes })
    const statusLabel = WORKFLOW_STATUS_CONFIG[targetStatus]?.label || targetStatus
    toast.success(`Đã chuyển công việc "${currentNode.name}" sang [${statusLabel}]`)
  }

  // Quick move via arrows
  const handleQuickMove = (nodeId: string, nextStatus: WorkflowStatus) => {
    if (!allowed("update")) {
      toast.error("Bạn không có quyền thay đổi trạng thái công việc")
      return
    }
    const node = data.nodes.find((n) => n.id === nodeId)
    if (!node || node.kind !== "work") return

    const updated = data.nodes.map((n) => (n.id === nodeId ? { ...n, workflowStatus: nextStatus } : n))
    saveMissionData({ ...data, nodes: updated })
    toast.success(`Đã chuyển "${node.name}" sang [${WORKFLOW_STATUS_CONFIG[nextStatus].label}]`)
  }

  return (
    <PageShell
      title="Bảng tiến độ công việc Kanban"
      subtitle="Kéo - thả quản lý vòng đời công việc: Mới tiếp nhận → Đang thực hiện → Chờ nghiệm thu → Hoàn thành"
      hideHeader={embedded}
    >
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã WBS, tên việc, cán bộ phụ trách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {!embedded && <Select value={selectedMission} onValueChange={setSelectedMission}>
            <SelectTrigger className="w-[190px] h-9 text-xs">
              <SelectValue placeholder="Nhiệm vụ / Đề án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhiệm vụ</SelectItem>
              {data.missions.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  [{m.code}] {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>}

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Đơn vị thực hiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đơn vị</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Cảnh báo tiến độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả cảnh báo</SelectItem>
              <SelectItem value="ontime">Đúng hạn / Hoàn thành</SelectItem>
              <SelectItem value="risk">Nguy cơ chậm (Vàng)</SelectItem>
              <SelectItem value="late">Chậm tiến độ (Đỏ)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground ml-1">
            Tổng thẻ: <strong>{filteredNodes.length}</strong>
          </span>
        </div>
      </div>

      {/* Kanban Board Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const colItems = columnsData[col.id] || []
            const colTotalCost = colItems.reduce((s, n) => s + (n.cost || 0), 0)

            return (
              <KanbanColumn
                key={col.id}
                col={col}
                items={colItems}
                totalCost={colTotalCost}
                missions={data.missions}
                data={data}
                onOpenDetail={setDetailNode}
                onMoveNode={handleQuickMove}
                canMove={allowed("update")}
              />
            )
          })}
        </div>

        {/* Drag Overlay for smooth preview */}
        <DragOverlay dropAnimation={null}>
          {activeNode ? (
            <div className="rotate-2 opacity-95 shadow-2xl pointer-events-none cursor-grabbing w-[300px]">
              <KanbanCardItem
                node={activeNode}
                mission={data.missions.find((m) => m.id === activeNode.missionId)}
                planned={plannedQuantity(data, activeNode.id)}
                actual={actualQuantity(data, activeNode.id)}
                onOpenDetail={() => {}}
                onMoveNode={() => {}}
                canMove={false}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      {detailNode && (
        <Dialog open={Boolean(detailNode)} onOpenChange={(open) => { if (!open) { setDetailNode(null); onDetailDismiss?.() } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono font-bold text-primary">
                  {detailNode.wbsCode || "WBS"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {NODE_KIND_LABELS[detailNode.kind]?.label || detailNode.kind}
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-lg font-bold">{detailNode.name}</DialogTitle>
              <DialogDescription>
                Chi tiết công việc thuộc phân hệ quản lý nhiệm vụ & đề án
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái vòng đời:</span>
                  <Badge variant="outline" className={WORKFLOW_STATUS_CONFIG[detailNode.workflowStatus || "new"].badge}>
                    {WORKFLOW_STATUS_CONFIG[detailNode.workflowStatus || "new"].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cán bộ phụ trách:</span>
                  <strong>{detailNode.assignee}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn vị thi công:</span>
                  <strong>{detailNode.department}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạn hoàn thành:</span>
                  <strong>{detailNode.dueDate || "Chưa giao"}</strong>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khối lượng kỹ thuật:</span>
                  <strong>{detailNode.quantity} {detailNode.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dự toán chi phí:</span>
                  <strong className="text-emerald-600">{money(detailNode.cost)} đ</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chuyên môn yêu cầu:</span>
                  <strong>{detailNode.requiredSkill || "—"}</strong>
                </div>
              </div>
            </div>

            <DialogFooter>
              {onOpenStructure && <Button type="button" variant="outline" onClick={() => { onOpenStructure(detailNode); setDetailNode(null); onDetailDismiss?.() }}><ExternalLink className="mr-2 h-4 w-4" />Xem trong cấu trúc</Button>}
              <Button type="button" onClick={() => { setDetailNode(null); onDetailDismiss?.() }}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  )
}

// =========================================================================
// SUB-COMPONENT: KANBAN COLUMN (DROPPABLE CONTAINER)
// =========================================================================
interface KanbanColumnProps {
  col: (typeof COLUMNS)[number]
  items: WorkNode[]
  totalCost: number
  missions: Mission[]
  data: ReturnType<typeof useMissionData>
  onOpenDetail: (node: WorkNode) => void
  onMoveNode: (nodeId: string, nextStatus: WorkflowStatus) => void
  canMove: boolean
}

function KanbanColumn({
  col,
  items,
  totalCost,
  missions,
  data,
  onOpenDetail,
  onMoveNode,
  canMove,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border ${col.border} ${col.bg} p-3 shadow-sm min-h-[580px] transition-all duration-150 ${
        isOver ? "ring-2 ring-primary ring-offset-2 bg-primary/5 dark:bg-primary/10" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
          <h3 className="text-sm font-bold text-foreground">{col.label}</h3>
          <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 ${col.badge}`}>
            {items.length}
          </Badge>
        </div>

        <span className="text-[11px] font-semibold text-muted-foreground">
          {money(totalCost)} đ
        </span>
      </div>

      {/* Sortable Drop Zone */}
      <SortableContext
        id={col.id}
        items={items.map((n) => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5 min-h-[220px]">
          {items.map((node) => (
            <KanbanCardItem
              key={node.id}
              node={node}
              mission={missions.find((m) => m.id === node.missionId)}
              planned={plannedQuantity(data, node.id)}
              actual={actualQuantity(data, node.id)}
              onOpenDetail={onOpenDetail}
              onMoveNode={onMoveNode}
              canMove={canMove}
            />
          ))}

          {items.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center text-xs text-muted-foreground">
              {canMove ? "Thả thẻ công việc vào đây" : "Chưa có công việc"}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// =========================================================================
// SUB-COMPONENT: KANBAN CARD ITEM (WITH FULL-SURFACE DRAGGABLE SUPPORT)
// =========================================================================
interface KanbanCardItemProps {
  node: WorkNode
  mission?: Mission
  planned: number
  actual: number
  onOpenDetail: (node: WorkNode) => void
  onMoveNode: (nodeId: string, nextStatus: WorkflowStatus) => void
  canMove: boolean
  isOverlay?: boolean
}

function KanbanCardItem({
  node,
  mission,
  planned,
  actual,
  onOpenDetail,
  onMoveNode,
  canMove,
  isOverlay = false,
}: KanbanCardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: isOverlay || !canMove,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // System Urgency Status (UC-09)
  const urgency = progressStatus(node.dueDate, planned, actual)

  const urgencyBadgeClass =
    urgency === "Chậm"
      ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200"
      : urgency === "Nguy cơ"
      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200"
      : urgency === "Hoàn thành"
      ? "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"

  const STAGES: WorkflowStatus[] = ["new", "in_progress", "review", "completed"]
  const currentStageIndex = STAGES.indexOf(node.workflowStatus || "new")
  const prevStage = currentStageIndex > 0 ? STAGES[currentStageIndex - 1] : null
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canMove ? attributes : {})}
      {...(canMove ? listeners : {})}
      onClick={() => onOpenDetail(node)}
      className={`group relative select-none rounded-lg border bg-card p-3 shadow-sm transition-all duration-150 hover:border-primary/50 hover:shadow-md ${
        isDragging ? "opacity-25 border-dashed border-primary" : canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {canMove && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}

          {node.wbsCode && (
            <span className="font-mono text-[11px] font-bold text-primary shrink-0">
              {node.wbsCode}
            </span>
          )}

          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${urgencyBadgeClass}`}>
            {urgency}
          </Badge>
        </div>

        {node.dueDate && (
          <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {node.dueDate}
          </span>
        )}
      </div>

      {/* Task Name */}
      <h4 className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-foreground group-hover:text-primary">
        {node.name}
      </h4>

      {/* Mission Code tag */}
      {mission && (
        <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground italic" title={mission.name}>
          [{mission.code}] {mission.name}
        </p>
      )}

      {/* Meta Footer */}
      <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1 truncate max-w-[130px]" title={node.assignee}>
          <UserCheck className="h-3 w-3 text-muted-foreground/70 shrink-0" />
          <span className="truncate">{node.assignee}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {money(node.cost)} đ
          </span>

          {/* Quick stage transition buttons */}
          {!isOverlay && canMove && (
            <div className="flex items-center gap-0.5 ml-1 border-l pl-1">
              {prevStage && (
                <button
                  type="button"
                  title={`Chuyển về: ${WORKFLOW_STATUS_CONFIG[prevStage].label}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveNode(node.id, prevStage)
                  }}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
              )}
              {nextStage && (
                <button
                  type="button"
                  title={`Chuyển sang: ${WORKFLOW_STATUS_CONFIG[nextStage].label}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveNode(node.id, nextStage)
                  }}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
