import { useMemo, useState } from "react"
import { ClipboardCheck, MoreVertical, Plus, Search, Trash2 } from "lucide-react"

import { ActionButton } from "@/components/ui/action-button"
import { appToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  LEAD_KPI_CRITERIA,
  LEAD_KPI_RATING_SCALE,
  emptyLeadKpiActuals,
  evaluateLeadKpi,
  type LeadKpiCriterionId,
} from "@/constants/leadKpi"

interface EmployeeKpi {
  id: string
  name: string
  actuals: Record<LeadKpiCriterionId, number>
  comment: string
}

const STORAGE_KEY = "hoangminh_lead_kpi"

const DEFAULT_EMPLOYEES: EmployeeKpi[] = [
  {
    id: "emp-thuy",
    name: "Trần Thủy",
    comment: "",
    actuals: { attendance: 20, deadline: 0, self_data: 62, telesale: 85, quote: 55, meeting: 22, convert: 8 },
  },
  {
    id: "emp-yen",
    name: "Vương Yến",
    comment: "Data chưa đối chiếu vì không thuộc khối vận tải đường bộ.",
    actuals: { attendance: 16, deadline: 3, self_data: 40, telesale: 50, quote: 30, meeting: 8, convert: 2 },
  },
  {
    id: "emp-haiyen",
    name: "Đặng Hải Yến",
    comment: "",
    actuals: { attendance: 19, deadline: 1, self_data: 60, telesale: 80, quote: 50, meeting: 15, convert: 5 },
  },
]

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { period?: string; employees?: EmployeeKpi[] }
    return {
      period: parsed.period || "2026-07",
      employees: (parsed.employees || []).map((employee) => ({
        ...employee,
        actuals: { ...emptyLeadKpiActuals(), ...employee.actuals },
        comment: employee.comment || "",
      })),
    }
  } catch {
    return null
  }
}

function gradeClass(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-600 text-white hover:bg-emerald-600"
  if (grade.startsWith("B")) return "bg-blue-600 text-white hover:bg-blue-600"
  return "bg-red-600 text-white hover:bg-red-600"
}

export default function LeadKpiPage({ embedded = false }: { embedded?: boolean }) {
  const saved = loadState()
  const [period, setPeriod] = useState(saved?.period || "2026-07")
  const [employees, setEmployees] = useState<EmployeeKpi[]>(saved?.employees?.length ? saved.employees : DEFAULT_EMPLOYEES)
  const [searchTerm, setSearchTerm] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [editing, setEditing] = useState<EmployeeKpi | null>(null)
  const [removing, setRemoving] = useState<EmployeeKpi | null>(null)

  const persist = (nextEmployees: EmployeeKpi[], nextPeriod = period) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ period: nextPeriod, employees: nextEmployees }))
  }

  const rows = useMemo(
    () =>
      employees.map((employee) => ({
        employee,
        result: evaluateLeadKpi(employee.actuals),
      })),
    [employees],
  )

  const filteredRows = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return rows
    return rows.filter((row) => row.employee.name.toLowerCase().includes(query) || row.result.grade.toLowerCase().includes(query))
  }, [rows, searchTerm])

  const summary = useMemo(() => {
    const countA = rows.filter((row) => row.result.grade.startsWith("A")).length
    const countB = rows.filter((row) => row.result.grade.startsWith("B")).length
    const countC = rows.filter((row) => row.result.grade.startsWith("C")).length
    const avg = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.result.total, 0) / rows.length) : 0
    return { countA, countB, countC, avg, total: rows.length }
  }, [rows])

  const periodLabel = useMemo(() => {
    const [year, month] = period.split("-")
    return year && month ? `${month}/${year}` : period
  }, [period])

  const saveEmployees = (next: EmployeeKpi[]) => {
    setEmployees(next)
    persist(next)
    if (editing) {
      const updated = next.find((item) => item.id === editing.id)
      if (updated) setEditing(updated)
    }
  }

  const addEmployee = () => {
    const name = newName.trim()
    if (!name) {
      appToast.error("Thiếu thông tin", "Vui lòng nhập họ tên nhân viên.")
      return
    }
    const created: EmployeeKpi = {
      id: `emp-${Date.now()}`,
      name,
      actuals: emptyLeadKpiActuals(),
      comment: "",
    }
    saveEmployees([...employees, created])
    setNewName("")
    setAddOpen(false)
    setEditing(created)
    appToast.success("Đã thêm nhân viên", "Tiếp tục nhập số liệu KPI.")
  }

  const updateEditing = (patch: Partial<EmployeeKpi> | { actuals: Record<LeadKpiCriterionId, number> }) => {
    if (!editing) return
    const nextEditing = { ...editing, ...patch }
    setEditing(nextEditing)
    saveEmployees(employees.map((item) => (item.id === editing.id ? nextEditing : item)))
  }

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { key: "index", header: "STT", headClassName: "w-16 min-w-16 text-center", cellClassName: "w-16 min-w-16 text-center", render: (_, index) => index + 1 },
    { key: "name", header: "Họ và tên", headClassName: "min-w-48", cellClassName: "font-medium", render: (row) => row.employee.name },
    {
      key: "total",
      header: "Tổng KPI dẫn",
      headClassName: "min-w-36 text-center",
      cellClassName: "text-center font-bold",
      render: (row) => `${row.result.total}%`,
    },
    {
      key: "grade",
      header: "Xếp loại",
      headClassName: "min-w-44 text-center",
      cellClassName: "text-center",
      render: (row) => <Badge className={gradeClass(row.result.grade)}>{row.result.grade}</Badge>,
    },
    {
      key: "coef",
      header: "Hệ số lương",
      headClassName: "min-w-32 text-center",
      cellClassName: "text-center font-semibold",
      render: (row) => row.result.coefficient.toFixed(2),
    },
    {
      key: "actions",
      header: "Hành động",
      headClassName: "w-28 min-w-28 text-center",
      cellClassName: "w-28 min-w-28 text-center",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Mở menu hành động">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(row.employee)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />Nhập / xem KPI
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setRemoving(row.employee)}>
              <Trash2 className="mr-2 h-4 w-4" />Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const editingResult = editing ? evaluateLeadKpi(editing.actuals) : null

  return (
    <div className={embedded ? "space-y-5" : "space-y-5 px-1 sm:px-4"}>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!embedded && <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">KPI dẫn</h1>}
          <p className={`text-sm text-muted-foreground ${embedded ? "" : "mt-1"}`}>
            Hệ thống đánh giá kết quả làm việc Phòng Kinh doanh – kỳ {periodLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap text-xs font-semibold">Kỳ đánh giá</Label>
            <Input
              type="month"
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value)
                persist(employees, event.target.value)
              }}
              className="h-10 w-40 bg-background"
            />
          </div>
          <ActionButton icon={<Plus />} onClick={() => setAddOpen(true)}>Thêm nhân viên</ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Nhân viên" value={String(summary.total)} />
        <SummaryCard label="Điểm TB" value={`${summary.avg}%`} />
        <SummaryCard label="Xếp loại A" value={String(summary.countA)} tone="green" />
        <SummaryCard label="Xếp loại B" value={String(summary.countB)} tone="blue" />
        <SummaryCard label="Xếp loại C" value={String(summary.countC)} tone="red" />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm theo tên hoặc xếp loại..."
          className="bg-background pl-9"
        />
      </div>

      <PaginatedDataTable
        data={filteredRows}
        columns={columns}
        rowKey={(row) => row.employee.id}
        onRowClick={(row) => setEditing(row.employee)}
        defaultPageSize={10}
        bordered={false}
        stickyFirstColumn
        stickyLastColumn
      />

      <div className="grid gap-3 md:grid-cols-3">
        {LEAD_KPI_RATING_SCALE.map((item) => (
          <Card key={item.grade}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <Badge className={gradeClass(item.grade)}>{item.grade}</Badge>
                <span className="text-sm font-semibold text-muted-foreground">{item.range}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{item.description}</p>
              <p>Hệ số lương: <span className="font-semibold text-foreground">{item.coefficient}</span></p>
              <p>Hành động: {item.action}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm nhân viên</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Họ và tên</Label>
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Nhập họ tên" className="bg-background" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Hủy</Button>
            <ActionButton onClick={addEmployee}>Thêm và nhập KPI</ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="flex max-h-[90vh] w-[94vw] max-w-4xl flex-col overflow-hidden">
          {editing && editingResult && (
            <>
              <DialogHeader>
                <DialogTitle>Nhập KPI – {editing.name}</DialogTitle>
              </DialogHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-auto py-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Tổng KPI dẫn</p>
                    <p className="text-2xl font-extrabold">{editingResult.total}%</p>
                    <Progress value={Math.max(0, Math.min(100, editingResult.total))} className="mt-2 h-2" />
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Xếp loại</p>
                    <Badge className={`mt-2 ${gradeClass(editingResult.grade)}`}>{editingResult.grade}</Badge>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Hệ số lương KPI</p>
                    <p className="text-2xl font-extrabold">{editingResult.coefficient.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {LEAD_KPI_CRITERIA.map((criterion) => {
                    const actual = editing.actuals[criterion.id] ?? 0
                    const percent = editingResult.breakdown.find((item) => item.criterion.id === criterion.id)?.percent ?? 0
                    return (
                      <div key={criterion.id} className="rounded-xl border p-4">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{criterion.stt}. {criterion.title}</p>
                            <p className="text-xs text-muted-foreground">{criterion.goal} · Trọng số {criterion.weight}%</p>
                          </div>
                          <Badge variant="outline" className={percent < 0 ? "border-red-300 text-red-600" : "border-emerald-300 text-emerald-700"}>
                            {percent}%
                          </Badge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                          <div className="space-y-1">
                            <Label className="text-xs">{criterion.actualLabel}</Label>
                            <Input
                              type="number"
                              value={actual}
                              onChange={(event) =>
                                updateEditing({
                                  actuals: {
                                    ...editing.actuals,
                                    [criterion.id]: Number(event.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-background"
                            />
                          </div>
                          <p className="self-end text-xs text-muted-foreground sm:max-w-72">{criterion.scoring}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2">
                  <Label>Nhận xét của quản lý trực tiếp</Label>
                  <Textarea
                    rows={3}
                    value={editing.comment}
                    onChange={(event) => updateEditing({ comment: event.target.value })}
                    placeholder="Nhập nhận xét..."
                    className="bg-background"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Đóng</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(removing)}
        title="Xác nhận xóa"
        description={`Xóa nhân viên "${removing?.name || ""}" khỏi bảng KPI kỳ này?`}
        confirmLabel="Xóa"
        variant="destructive"
        onOpenChange={(open) => !open && setRemoving(null)}
        onConfirm={() => {
          if (!removing) return
          saveEmployees(employees.filter((item) => item.id !== removing.id))
          if (editing?.id === removing.id) setEditing(null)
          setRemoving(null)
          appToast.success("Đã xóa", removing.name)
        }}
      />
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "green" | "blue" | "red" }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "blue"
      ? "text-blue-700 dark:text-blue-400"
      : tone === "red"
      ? "text-red-700 dark:text-red-400"
      : "text-foreground"
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-extrabold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
