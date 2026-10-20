import React, { useState, useMemo } from "react"
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  RotateCcw,
  Sparkles,
  ClipboardList,
  Eye,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  TechnicalInspection,
  TechnicalItem,
  TechnicalRevisionAudit,
} from "@/types/engineering"
import {
  getInspections,
  saveInspection,
  getTechnicalItems,
  getEngineeringKPIs,
} from "@/services/EngineeringService"

export default function EngineeringQualityInspectionPage() {
  const [inspections, setInspections] = useState<TechnicalInspection[]>(() => getInspections())
  const [items] = useState<TechnicalItem[]>(() => getTechnicalItems())
  const [kpis, setKpis] = useState(() => getEngineeringKPIs())

  const [searchTerm, setSearchTerm] = useState("")
  const [resultFilter, setResultFilter] = useState("all")

  // Modals
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = useState(false)
  const [selectedInspectionForAudit, setSelectedInspectionForAudit] = useState<TechnicalInspection | null>(null)
  const [isAddAuditModalOpen, setIsAddAuditModalOpen] = useState(false)

  // Form State: New Inspection
  const [formItemId, setFormItemId] = useState(items[0]?.id || "")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formInspector, setFormInspector] = useState("Phòng Kỹ thuật - Khối lượng (ThS. Nguyễn Văn Hòa)")
  const [formInspectedVolume, setFormInspectedVolume] = useState("10")
  const [formResult, setFormResult] = useState<"passed" | "request_revision" | "re_measurement">("passed")
  const [formQualityScore, setFormQualityScore] = useState(90)
  const [formFindings, setFormFindings] = useState("Số liệu đo đạc đảm bảo độ trung thực, tỷ số tín hiệu/nhiễu đạt yêu cầu.")

  // Form State: Add Audit revision
  const [auditInspector, setAuditInspector] = useState("KS. Đỗ Quang Huy (Kỹ thuật)")
  const [auditComment, setAuditComment] = useState("")
  const [auditAction, setAuditAction] = useState("")

  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      const matchSearch =
        insp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insp.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insp.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insp.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insp.findings.toLowerCase().includes(searchTerm.toLowerCase())

      const matchResult = resultFilter === "all" || insp.result === resultFilter
      return matchSearch && matchResult
    })
  }, [inspections, searchTerm, resultFilter])

  // Aggregate stats
  const avgScore = useMemo(() => {
    if (inspections.length === 0) return 0
    return Math.round(inspections.reduce((s, i) => s + i.qualityScore, 0) / inspections.length)
  }, [inspections])

  const pendingRevisionsCount = useMemo(() => {
    return inspections.filter((i) => i.result === "request_revision" || i.result === "re_measurement").length
  }, [inspections])

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedItem = items.find((i) => i.id === formItemId)
    if (!selectedItem) return

    const newInspection: TechnicalInspection = {
      id: `insp-${Date.now()}`,
      code: `KT-2026/${String(Math.floor(Math.random() * 900) + 100)}`,
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      taskName: selectedItem.targetLocation ? `Đề án tại ${selectedItem.targetLocation}` : "Nhiệm vụ địa vật lý",
      unitName: "Đoàn Địa vật lý 1",
      inspectionDate: formDate,
      inspectorName: formInspector,
      inspectedVolume: Number(formInspectedVolume),
      result: formResult,
      qualityScore: Number(formQualityScore),
      findings: formFindings,
      revisionHistory: [],
    }

    saveInspection(newInspection)
    setInspections(getInspections())
    setKpis(getEngineeringKPIs())
    setIsNewInspectionModalOpen(false)
  }

  const handleAddAuditRevision = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInspectionForAudit || !auditComment.trim()) return

    const newRevision: TechnicalRevisionAudit = {
      revisionId: `rev-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      inspector: auditInspector,
      comment: auditComment,
      actionRequired: auditAction || "Đã kiểm tra và lưu vết",
      status: "resolved",
    }

    const updatedInspection: TechnicalInspection = {
      ...selectedInspectionForAudit,
      revisionHistory: [...selectedInspectionForAudit.revisionHistory, newRevision],
    }

    saveInspection(updatedInspection)
    setInspections(getInspections())
    setSelectedInspectionForAudit(updatedInspection)
    setIsAddAuditModalOpen(false)
    setAuditComment("")
    setAuditAction("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-800 text-xs font-semibold">
              TEC-06 & TEC-07
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Kiểm tra kỹ thuật & Theo dõi chất lượng nghiệm thu
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Kiểm tra khối lượng và kết quả đo đạc địa vật lý, lưu vết toàn bộ quá trình thanh tra – chỉnh sửa (Audit Trail) và theo dõi tỷ lệ nghiệm thu đạt lần đầu (First-pass yield).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewInspectionModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Lập phiếu kiểm tra kỹ thuật
          </Button>
        </div>
      </div>

      {/* KPI Cards (TEC-07) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tỷ lệ đạt lần đầu (FPY)
            </CardTitle>
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{kpis.firstPassYield}%</div>
            <p className="mt-1 text-xs text-slate-500">Chỉ số chất lượng nghiệm thu TEC-07</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Điểm chất lượng trung bình
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{avgScore} / 100</div>
            <p className="mt-1 text-xs text-slate-500">Thang điểm kỹ thuật địa vật lý</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng lượt kiểm tra
            </CardTitle>
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{inspections.length} đợt</div>
            <p className="mt-1 text-xs text-slate-500">Phòng Kỹ thuật - Khối lượng thực hiện</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cần sửa đổi / Đo bù
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingRevisionsCount} hạng mục</div>
            <p className="mt-1 text-xs text-slate-500">Đang lưu vết khắc phục lỗi hiện trường</p>
          </CardContent>
        </Card>
      </div>

      {/* Unit Quality Tracking Panel (TEC-07 PA-XXV) */}
      <Card className="border-slate-200 bg-slate-50/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-indigo-600" />
            Bảng theo dõi chất lượng nghiệm thu theo Đơn vị thi công (PA-XXV & MT-20)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Đánh giá chất lượng kỹ thuật, tỷ lệ đạt lần đầu và mức độ tuân thủ quy trình quy phạm địa vật lý.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">Đoàn Địa vật lý 1</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">Đạt chuẩn</Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Tỷ lệ đạt lần đầu:</span>
                <span className="font-bold text-indigo-600 text-sm">92%</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Điểm chất lượng TB:</span>
                <span className="font-semibold text-emerald-600 text-xs">91.5 / 100</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Nhiệm vụ trọng điểm:</span>
                <span className="text-xs text-slate-700">Mỏ chì kẽm Chợ Điền</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">Đoàn Địa vật lý 2</span>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">Khá tốt</Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Tỷ lệ đạt lần đầu:</span>
                <span className="font-bold text-indigo-600 text-sm">86%</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Điểm chất lượng TB:</span>
                <span className="font-semibold text-emerald-600 text-xs">88.0 / 100</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Nhiệm vụ trọng điểm:</span>
                <span className="text-xs text-slate-700">Bauxit Đắk Nông</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">Đoàn Địa vật lý 3</span>
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[11px]">Đạt chuẩn</Badge>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Tỷ lệ đạt lần đầu:</span>
                <span className="font-bold text-indigo-600 text-sm">89%</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Điểm chất lượng TB:</span>
                <span className="font-semibold text-emerald-600 text-xs">89.2 / 100</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Nhiệm vụ trọng điểm:</span>
                <span className="text-xs text-slate-700">Nước ngầm Ba Chẽ</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-8">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm mã phiếu kiểm tra, hạng mục, người kiểm tra, sai số phát hiện..."
                className="pl-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="md:col-span-4">
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Lọc theo kết luận kiểm tra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kết quả kiểm tra</SelectItem>
                  <SelectItem value="passed">Đạt yêu cầu</SelectItem>
                  <SelectItem value="request_revision">Yêu cầu chỉnh sửa</SelectItem>
                  <SelectItem value="re_measurement">Yêu cầu đo bù</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Hồ sơ kiểm tra kỹ thuật & Lưu vết sửa đổi (Audit Trail) ({filteredInspections.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Quản lý kiểm tra chất lượng, yêu cầu chỉnh sửa và truy vết toàn bộ quá trình (TEC-06)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[120px] font-semibold text-slate-700">Mã phiếu KT</TableHead>
                  <TableHead className="font-semibold text-slate-700">Hạng mục & Nhiệm vụ</TableHead>
                  <TableHead className="w-[120px] font-semibold text-slate-700">Ngày kiểm tra</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cán bộ kiểm tra</TableHead>
                  <TableHead className="w-[110px] text-right font-semibold text-slate-700">KL kiểm tra</TableHead>
                  <TableHead className="w-[110px] text-center font-semibold text-slate-700">Điểm CL</TableHead>
                  <TableHead className="w-[140px] font-semibold text-slate-700">Kết luận</TableHead>
                  <TableHead className="w-[110px] text-center font-semibold text-slate-700">Lưu vết</TableHead>
                  <TableHead className="w-[100px] text-right font-semibold text-slate-700">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                      Không tìm thấy đợt kiểm tra kỹ thuật nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspections.map((insp) => (
                    <TableRow key={insp.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-semibold text-indigo-700">
                        {insp.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-xs text-slate-900">{insp.itemName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{insp.taskName}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {insp.inspectionDate}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {insp.inspectorName}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-900">
                        {insp.inspectedVolume}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-bold text-xs ${
                            insp.qualityScore >= 90
                              ? "text-emerald-600"
                              : insp.qualityScore >= 80
                              ? "text-blue-600"
                              : "text-amber-600"
                          }`}
                        >
                          {insp.qualityScore} / 100
                        </span>
                      </TableCell>
                      <TableCell>
                        {insp.result === "passed" && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Đạt yêu cầu
                          </Badge>
                        )}
                        {insp.result === "request_revision" && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Y/c chỉnh sửa
                          </Badge>
                        )}
                        {insp.result === "re_measurement" && (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-[11px]">
                            <RotateCcw className="mr-1 h-3 w-3" /> Y/c đo bù
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {insp.revisionHistory.length > 0 ? (
                          <Badge variant="secondary" className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border-indigo-200">
                            <History className="mr-1 h-3 w-3" /> {insp.revisionHistory.length} vết
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400">Không có lỗi</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-600 hover:text-indigo-600"
                          onClick={() => setSelectedInspectionForAudit(insp)}
                          title="Xem lưu vết Audit Trail & Chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal View Audit Trail Details (TEC-06) */}
      <Dialog
        open={!!selectedInspectionForAudit}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedInspectionForAudit(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <History className="h-5 w-5 text-indigo-600" />
              Lưu vết kiểm tra kỹ thuật & Lịch sử chỉnh sửa (Audit Trail) - {selectedInspectionForAudit?.code}
            </DialogTitle>
          </DialogHeader>

          {selectedInspectionForAudit && (
            <div className="space-y-4 text-xs text-slate-700 py-2">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-medium">Hạng mục:</span>
                    <div className="font-semibold text-slate-900">{selectedInspectionForAudit.itemName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Cán bộ kiểm tra:</span>
                    <div className="font-semibold text-slate-900">{selectedInspectionForAudit.inspectorName}</div>
                  </div>
                </div>
                <div className="mt-2 text-slate-600">
                  <span className="font-medium text-slate-800">Sai số & Phát hiện kỹ thuật:</span> {selectedInspectionForAudit.findings}
                </div>
              </div>

              {/* Audit Trail Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-indigo-600" />
                    Lịch sử quá trình kiểm tra – chỉnh sửa – đo bù (TEC-06)
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => setIsAddAuditModalOpen(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Thêm lưu vết xử lý
                  </Button>
                </div>

                {selectedInspectionForAudit.revisionHistory.length === 0 ? (
                  <div className="rounded border border-dashed border-slate-200 p-4 text-center text-slate-500 text-xs">
                    Chưa có vết chỉnh sửa nào. Khối lượng đạt chuẩn ngay trong lần kiểm tra đầu tiên.
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-indigo-100">
                    {selectedInspectionForAudit.revisionHistory.map((rev, index) => (
                      <div key={rev.revisionId || index} className="relative flex gap-3 pl-1">
                        <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 text-xs">{rev.inspector}</span>
                            <span className="text-[11px] text-slate-400">{rev.date}</span>
                          </div>
                          <p className="mt-1 text-slate-700 text-xs leading-relaxed">{rev.comment}</p>
                          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
                            <span className="text-indigo-700 font-medium">Hành động: {rev.actionRequired}</span>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                              Đã xử lý
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => setSelectedInspectionForAudit(null)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Add Revision to Audit Trail */}
      <Dialog
        open={isAddAuditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setIsAddAuditModalOpen(false)
        }}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleAddAuditRevision}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900">
                Thêm chỉ đạo lưu vết chỉnh sửa (TEC-06)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Cán bộ kiểm tra / Chỉ đạo</Label>
                <Input
                  value={auditInspector}
                  onChange={(e) => setAuditInspector(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Ý kiến kiểm tra / Yêu cầu chỉnh sửa *</Label>
                <Textarea
                  value={auditComment}
                  onChange={(e) => setAuditComment(e.target.value)}
                  placeholder="VD: Yêu cầu đo bù 200m tuyến hoặc lọc nhiễu công nghiệp..."
                  rows={3}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Hành động khắc phục hiện trường</Label>
                <Input
                  value={auditAction}
                  onChange={(e) => setAuditAction(e.target.value)}
                  placeholder="VD: Đo bù và bổ sung biên bản xác nhận"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setIsAddAuditModalOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                Ghi nhận lưu vết
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Create Technical Inspection */}
      <Dialog
        open={isNewInspectionModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setIsNewInspectionModalOpen(false)
        }}
      >
        <DialogContent className="max-w-xl">
          <form onSubmit={handleCreateInspection}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Plus className="h-5 w-5 text-indigo-600" />
                Lập phiếu kiểm tra kỹ thuật mới (TEC-06)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Hạng mục kiểm tra *</Label>
                <Select value={formItemId} onValueChange={setFormItemId}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue placeholder="Chọn hạng mục kỹ thuật" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((it) => (
                      <SelectItem key={it.id} value={it.id} className="text-xs">
                        {it.code} - {it.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Ngày kiểm tra *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Khối lượng kiểm tra</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formInspectedVolume}
                    onChange={(e) => setFormInspectedVolume(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Cán bộ Phòng Kỹ thuật kiểm tra</Label>
                <Input
                  value={formInspector}
                  onChange={(e) => setFormInspector(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Kết luận kiểm tra</Label>
                  <Select
                    value={formResult}
                    onValueChange={(val: "passed" | "request_revision" | "re_measurement") => setFormResult(val)}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">Đạt yêu cầu</SelectItem>
                      <SelectItem value="request_revision">Yêu cầu chỉnh sửa</SelectItem>
                      <SelectItem value="re_measurement">Yêu cầu đo bù</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Điểm chất lượng (thang 100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={formQualityScore}
                    onChange={(e) => setFormQualityScore(Number(e.target.value))}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Sai số, nhiễu và phát hiện kỹ thuật</Label>
                <Textarea
                  value={formFindings}
                  onChange={(e) => setFormFindings(e.target.value)}
                  rows={3}
                  className="mt-1 text-xs"
                  placeholder="Ghi nhận sai số biên độ, tiếp xúc điện cực, tỷ số tín hiệu/nhiễu..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setIsNewInspectionModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                Lưu phiếu kiểm tra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
