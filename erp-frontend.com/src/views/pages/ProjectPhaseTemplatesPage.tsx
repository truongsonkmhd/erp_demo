import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Save, Copy, Download, Upload, ListTree, Layers } from "lucide-react"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"

// ===== Types =====
import { type ProjectPhase as TProjectPhase, type ProjectTask, type ProjectPhaseDocument, toFileExt } from "@/types/project"

export interface ProjectPhaseTemplate {
  id: string
  name: string
  description?: string
  projectPhase: TProjectPhase[]
}

// ===== Utils =====
const uid = (p = "") => globalThis.crypto?.randomUUID?.() ?? `${p}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const STORAGE_KEY = "phase-templates:v1"

const emptyPhase = (order: number): TProjectPhase => ({
  id: uid("phase-"),
  name: "Giai đoạn mới",
  description: "",
  order,
  status: "not_started",
  tasks: [],
  documentProjectPhase: [] as ProjectPhaseDocument[] | undefined,
})

// ===== Page Component =====
export default function ProjectPhaseTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<ProjectPhaseTemplate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Dialog state for phase editor
  const [isPhaseDlgOpen, setPhaseDlgOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<TProjectPhase | null>(null)
  const [phaseForm, setPhaseForm] = useState<Partial<TProjectPhase>>(emptyPhase((templates[0]?.projectPhase?.length ?? 0) + 1))

  // Dialog state for template create/rename
  const [isTplDlgOpen, setTplDlgOpen] = useState(false)
  const [tplForm, setTplForm] = useState<{ id?: string; name: string; description?: string }>({ name: "" })

  // Import dialog
  const [isImportDlgOpen, setImportDlgOpen] = useState(false)
  const [importText, setImportText] = useState("")


  const handleAddPhaseDocs = (phaseId: string, files: FileList | null) => {
    if (!can(user, "templates:update")) return
    if (!files || !selected) return
    const newDocs: ProjectPhaseDocument[] = Array.from(files).map((file) => ({
      id: uid("doc-"),
      name: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Bạn",
      url: URL.createObjectURL(file),
      type: toFileExt?.(file.name.split(".").pop()) ?? "other",
    }))
    setTemplates(prev =>
      prev.map(t => {
        if (t.id !== selected.id) return t
        return {
          ...t,
          projectPhase: t.projectPhase.map(p =>
            p.id === phaseId
              ? { ...p, documentProjectPhase: [...(p.documentProjectPhase || []), ...newDocs] }
              : p
          )
        }
      })
    )
  }

  const removePhaseDoc = (phaseId: string, docId: string) => {
    if (!can(user, "templates:update")) return
    if (!selected) return
    setTemplates(prev =>
      prev.map(t => {
        if (t.id !== selected.id) return t
        return {
          ...t,
          projectPhase: t.projectPhase.map(p =>
            p.id === phaseId
              ? { ...p, documentProjectPhase: (p.documentProjectPhase || []).filter(d => d.id !== docId) }
              : p
          )
        }
      })
    )
  }

  // ===== Load/Save Local Storage =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ProjectPhaseTemplate[]
        setTemplates(parsed)
        if (parsed[0]) setSelectedId(parsed[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    } catch (e) {
      console.error(e)
    }
  }, [templates])

  const selected = useMemo(() => templates.find(t => t.id === selectedId) ?? null, [templates, selectedId])

  // ===== Template actions =====
  const createTemplate = () => {
    if (!can(user, "templates:create")) return
    setTplForm({ name: "Bản mẫu giai đoạn mới", description: "" })
    setTplDlgOpen(true)
  }

  const saveTemplateMeta = () => {
    if (!can(user, `templates:${tplForm.id ? "update" : "create"}`)) return
    if (!tplForm.name.trim()) {
      toast.error("Tên bản mẫu không được để trống")
      return
    }
    if (tplForm.id) {
      setTemplates(prev => prev.map(t => t.id === tplForm.id ? { ...t, name: tplForm.name.trim(), description: tplForm.description } : t))
      toast.success("Đã cập nhật bản mẫu")
    } else {
      const t: ProjectPhaseTemplate = { id: uid("tpl-"), name: tplForm.name.trim(), description: tplForm.description, projectPhase: [] }
      setTemplates(prev => [t, ...prev])
      setSelectedId(t.id)
      toast.success("Đã tạo bản mẫu")
    }
    setTplDlgOpen(false)
  }

  const renameTemplate = (tpl: ProjectPhaseTemplate) => {
    if (!can(user, "templates:update")) return
    setTplForm({ id: tpl.id, name: tpl.name, description: tpl.description })
    setTplDlgOpen(true)
  }

  const deleteTemplate = (id: string) => {
    if (!can(user, "templates:delete")) return
    setTemplates(prev => prev.filter(t => t.id !== id))
    setSelectedId(prev => (prev === id ? (templates.find(t => t.id !== id)?.id ?? null) : prev))
  }
  const nextCopyName = (base: string) => {
    // escape base để dựng regex an toàn
    const esc = base.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
    const re = new RegExp(`^${esc} \\((\\d+)\\)$`)
    const nums = templates
      .map(t => t.name)
      .map(n => {
        if (n === base) return 0
        const m = n.match(re)
        return m ? Number(m[1]) : null
      })
      .filter((x): x is number => x !== null)
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    return `${base} (${next})`
  }
  const duplicateTemplate = (tpl: ProjectPhaseTemplate) => {
    if (!can(user, "templates:create")) return
    // chuẩn hóa base name (bỏ hậu tố (n) nếu có)
    const base = tpl.name.replace(/ \((\d+)\)$/, '')
    const name = nextCopyName(base)

    const copy: ProjectPhaseTemplate = {
      id: uid("tpl-"),
      name,
      description: tpl.description,
      projectPhase: tpl.projectPhase.map(p => ({ ...p, id: uid("phase-") }))
    }
    setTemplates(prev => [copy, ...prev])
    setSelectedId(copy.id)
  }
  // ===== Phase actions =====
  const openAddPhase = () => {
    if (!can(user, "templates:update")) return
    const order = (selected?.projectPhase?.length ?? 0) + 1
    setEditingPhase(null)
    setPhaseForm(emptyPhase(order))
    setPhaseDlgOpen(true)
  }

  const openEditPhase = (phase: TProjectPhase) => {
    if (!can(user, "templates:update")) return
    setEditingPhase(phase)
    setPhaseForm(phase)
    setPhaseDlgOpen(true)
  }

  const savePhase = () => {
    if (!can(user, "templates:update")) return
    if (!selected) return
    const name = (phaseForm.name ?? "").trim()
    if (!name) {
      toast.error("Tên giai đoạn không được để trống")
      return
    }
    const nextPhase: TProjectPhase = {
      id: editingPhase?.id ?? uid("phase-"),
      name,
      description: phaseForm.description ?? "",
      order: Number(phaseForm.order ?? ((selected.projectPhase?.length ?? 0) + 1)),
      status: (phaseForm.status as TProjectPhase["status"]) ?? "not_started",
      startDate: phaseForm.startDate,
      endDate: phaseForm.endDate,
      legalBasis: phaseForm.legalBasis,
      tasks: (phaseForm.tasks as ProjectTask[]) ?? [],
      documentProjectPhase: (phaseForm.documentProjectPhase as ProjectPhaseDocument[]) ?? []
    }
    setTemplates(prev => prev.map(t => {
      if (t.id !== selected.id) return t
      const list = editingPhase
        ? t.projectPhase.map(p => p.id === editingPhase.id ? nextPhase : p)
        : [...t.projectPhase, nextPhase]
      // reorder by order asc
      const ordered = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      return { ...t, projectPhase: ordered }
    }))
    setPhaseDlgOpen(false)
  }

  const removePhase = (phaseId: string) => {
    if (!can(user, "templates:delete")) return
    if (!selected) return
    setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, projectPhase: t.projectPhase.filter(p => p.id !== phaseId) } : t))
  }

  // ===== Export / Import =====
  const exportJSON = () => {
    const payload = JSON.stringify(templates, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `phase-templates-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = () => {
    if (!can(user, "templates:create")) return
    try {
      const parsed = JSON.parse(importText) as ProjectPhaseTemplate[]
      if (!Array.isArray(parsed)) throw new Error("Định dạng không hợp lệ")
      // ensure ids
      const fixed = parsed.map(t => ({
        id: t.id || uid("tpl-"),
        name: t.name || "Bản mẫu không tên",
        description: t.description,
        projectPhase: (t.projectPhase || []).map((p, idx) => ({
          id: p.id || uid("phase-"),
          name: p.name || `Giai đoạn ${idx + 1}`,
          description: p.description || "",
          order: p.order ?? (idx + 1),
          status: p.status ?? "not_started",
          startDate: p.startDate,
          endDate: p.endDate,
          legalBasis: p.legalBasis,
          tasks: p.tasks || [],
          documentProjectPhase: p.documentProjectPhase || []
        }))
      }))
      setTemplates(fixed)
      setSelectedId(fixed[0]?.id ?? null)
      setImportDlgOpen(false)
      toast.success("Đã nhập danh sách bản mẫu")
    } catch (e: any) {
      toast.error(e?.message || "Không thể nhập JSON")
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6" />Quản lý Bản Mẫu Giai Đoạn</h1>
          <p className="text-muted-foreground">Tạo, chỉnh sửa và lưu danh sách giai đoạn để dùng lại khi lập dự án.</p>
          {can(user, "templates:create") && <Button onClick={createTemplate} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Bản mẫu mới
          </Button>}        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: templates list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListTree className="w-5 h-5" />Danh sách bản mẫu</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[480px] pr-2">
              <div className="space-y-2">
                {templates.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có bản mẫu nào. Nhấn "Bản mẫu mới" để tạo.</p>
                )}
                {templates.map(tpl => (
                  <div key={tpl.id} className={`border rounded-md p-3 flex items-start justify-between gap-2 ${selectedId === tpl.id ? "border-primary bg-primary/5" : ""}`}>
                    <div className="cursor-pointer" onClick={() => setSelectedId(tpl.id)}>
                      <div className="font-medium">{tpl.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{tpl.description || ""}</div>
                      <div className="mt-1"><Badge variant="outline">{tpl.projectPhase.length} giai đoạn</Badge></div>
                    </div>
                    <div className="flex gap-1">
                      {can(user, "templates:create") && <Button variant="ghost" size="icon" onClick={() => duplicateTemplate(tpl)} title="Nhân bản"><Copy className="w-4 h-4" /></Button>}
                      {can(user, "templates:update") && <Button variant="ghost" size="icon" onClick={() => renameTemplate(tpl)} title="Đổi tên"><Pencil className="w-4 h-4" /></Button>}
                      {can(user, "templates:delete") && <Button variant="ghost" size="icon" onClick={() => deleteTemplate(tpl.id)} title="Xóa"><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: template detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selected ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{selected.name}</div>
                    <div className="text-sm text-muted-foreground">{selected.description || ""}</div>
                  </div>
                  <div className="flex gap-2">
                    {can(user, "templates:update") && <Button variant="outline" onClick={() => renameTemplate(selected)}><Pencil className="w-4 h-4 mr-2" />Sửa thông tin</Button>}
                    {can(user, "templates:update") && <Button onClick={openAddPhase}><Plus className="w-4 h-4 mr-2" />Thêm giai đoạn</Button>}
                  </div>
                </div>
              ) : (
                <span>Chọn hoặc tạo một bản mẫu để bắt đầu</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-center py-12 text-muted-foreground">Không có bản mẫu nào được chọn.</div>
            ) : selected.projectPhase.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Bản mẫu chưa có giai đoạn</p>
                {can(user, "templates:update") && <Button onClick={openAddPhase}><Plus className="w-4 h-4 mr-2" />Thêm giai đoạn đầu tiên</Button>}
              </div>
            ) : (
              <div className="space-y-3">
                {selected.projectPhase.map((p, idx) => (
                  <Card key={p.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">Giai đoạn {p.order ?? idx + 1}</Badge>
                            <div className="font-semibold">{p.name}</div>
                          </div>
                          {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                          {p.legalBasis && <p className="text-xs text-blue-600 mt-1">Cơ sở pháp lý: {p.legalBasis}</p>}
                          <div className="space-y-1 mt-3">
                            <Label className="text-sm font-medium">Tài liệu đính kèm</Label>
                            <Input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => handleAddPhaseDocs(p.id, e.target.files)}
                            />

                            {p.documentProjectPhase && p.documentProjectPhase.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {p.documentProjectPhase.map((doc) => (
                                  <div key={doc.id} className="inline-flex items-center gap-2">
                                    <a
                                      href={doc.url}
                                      download={doc.name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm text-blue-700 max-w-[200px]"
                                      title="Tải về để xem"
                                    >
                                      <span className="truncate">{doc.name}</span>
                                    </a>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(doc.url, "_blank")}
                                    >
                                      Xem
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removePhaseDoc(p.id, doc.id)}
                                      aria-label="Xóa"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {can(user, "templates:update") && <Button variant="ghost" size="icon" onClick={() => openEditPhase(p)} title="Sửa"><Pencil className="w-4 h-4" /></Button>}
                          {can(user, "templates:delete") && <Button variant="ghost" size="icon" onClick={() => removePhase(p.id)} title="Xóa"><Trash2 className="w-4 h-4" /></Button>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Phase Dialog */}
      <Dialog open={isPhaseDlgOpen} onOpenChange={setPhaseDlgOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editingPhase ? "Sửa giai đoạn" : "Thêm giai đoạn"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên giai đoạn *</Label>
              <Input value={phaseForm.name || ""} onChange={e => setPhaseForm(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea rows={3} value={phaseForm.description || ""} onChange={e => setPhaseForm(v => ({ ...v, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label>Thứ tự</Label>
                <Input type="number" min={1} value={phaseForm.order ?? 1} onChange={e => setPhaseForm(v => ({ ...v, order: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu (mặc định)</Label>
                <Input type="date" value={phaseForm.startDate || ""} onChange={e => setPhaseForm(v => ({ ...v, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ngày kết thúc (mặc định)</Label>
                <Input type="date" value={phaseForm.endDate || ""} onChange={e => setPhaseForm(v => ({ ...v, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cơ sở pháp lý</Label>
              <Input value={phaseForm.legalBasis || ""} onChange={e => setPhaseForm(v => ({ ...v, legalBasis: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhaseDlgOpen(false)}>Hủy</Button>
            <Button onClick={savePhase}><Save className="w-4 h-4 mr-2" />Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template meta Dialog */}
      <Dialog open={isTplDlgOpen} onOpenChange={setTplDlgOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{tplForm.id ? "Sửa thông tin bản mẫu" : "Tạo bản mẫu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input value={tplForm.name} onChange={e => setTplForm(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea rows={3} value={tplForm.description || ""} onChange={e => setTplForm(v => ({ ...v, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTplDlgOpen(false)}>Hủy</Button>
            <Button onClick={saveTemplateMeta}><Save className="w-4 h-4 mr-2" />Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDlgOpen} onOpenChange={setImportDlgOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Nhập danh sách bản mẫu (JSON)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea rows={12} value={importText} onChange={e => setImportText(e.target.value)} placeholder='[
  {
    "id": "tpl-001",
    "name": "Mẫu cơ bản",
    "description": "Chu kỳ dự án chuẩn",
    "projectPhase": [
      { "id": "phase-1", "name": "Khởi động", "order": 1, "status": "not_started", "tasks": [] }
    ]
  }
]'/>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDlgOpen(false)}>Hủy</Button>
            <Button onClick={importJSON}><Upload className="w-4 h-4 mr-2" />Nhập</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
