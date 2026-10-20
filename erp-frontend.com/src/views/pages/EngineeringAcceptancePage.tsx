import React, { useState, useMemo } from "react"
import {
  FileCheck2,
  FileSignature,
  FileText,
  CheckCircle2,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  Building,
  Award,
  Calendar,
  Layers,
  Paperclip,
  Check,
  Eye,
  Briefcase,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  AcceptanceRecord,
  TechnicalItem,
} from "@/types/engineering"
import {
  getAcceptances,
  saveAcceptance,
  getTechnicalItems,
  getEngineeringKPIs,
} from "@/services/EngineeringService"

export default function EngineeringAcceptancePage() {
  const [acceptances, setAcceptances] = useState<AcceptanceRecord[]>(() => getAcceptances())
  const [items, setItems] = useState<TechnicalItem[]>(() => getTechnicalItems())
  const [kpis, setKpis] = useState(() => getEngineeringKPIs())

  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Modals
  const [isNewAcceptanceModalOpen, setIsNewAcceptanceModalOpen] = useState(false)
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<AcceptanceRecord | null>(null)

  // Form State for new acceptance
  const [formType, setFormType] = useState<"internal" | "institutional">("internal")
  const [formItemId, setFormItemId] = useState(items[0]?.id || "")
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0])
  const [formCommittee, setFormCommittee] = useState("TS. Nguyễn Văn Tuấn (Trưởng ban), ThS. Lê Hoàng Long, KS. Đặng Văn Nam")
  const [formAcceptedVolume, setFormAcceptedVolume] = useState("10")
  const [formRating, setFormRating] = useState<"Xuất sắc" | "Đạt yêu cầu" | "Chưa đạt">("Đạt yêu cầu")
  const [formConclusion, setFormConclusion] = useState("Khối lượng thi công đảm bảo chất lượng kỹ thuật, đủ điều kiện phê duyệt nghiệm thu.")
  const [formTaskStatus, setFormTaskStatus] = useState<"Đang thi công" | "Hoàn thành nhiệm vụ">("Đang thi công")
  const [formFileName, setFormFileName] = useState("Bien-ban-nghiem-thu-dot-moi.pdf")

  const selectedItemObj = useMemo(() => {
    return items.find((i) => i.id === formItemId)
  }, [items, formItemId])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return acceptances.filter((rec) => {
      const matchSearch =
        rec.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.committeeMembers.toLowerCase().includes(searchTerm.toLowerCase())

      const matchTab =
        activeTab === "all" ||
        (activeTab === "internal" && rec.type === "internal") ||
        (activeTab === "institutional" && rec.type === "institutional")

      return matchSearch && matchTab
    })
  }, [acceptances, searchTerm, activeTab])

  // Statistics
  const totalInternalVal = useMemo(() => {
    return acceptances
      .filter((a) => a.type === "internal")
      .reduce((sum, a) => sum + a.acceptedValue, 0)
  }, [acceptances])

  const totalInstVal = useMemo(() => {
    return acceptances
      .filter((a) => a.type === "institutional")
      .reduce((sum, a) => sum + a.acceptedValue, 0)
  }, [acceptances])

  const totalDocumentsCount = useMemo(() => {
    return acceptances.reduce((s, a) => s + a.attachedDocuments.length, 0)
  }, [acceptances])

  const handleSignRecord = (id: string) => {
    setAcceptances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, signStatus: "signed" } : a))
    )
    if (selectedRecordDetail && selectedRecordDetail.id === id) {
      setSelectedRecordDetail((prev) => (prev ? { ...prev, signStatus: "signed" } : null))
    }
  }

  const handleSaveAcceptance = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemObj) return

    const acceptedVol = Number(formAcceptedVolume)
    const val = acceptedVol * selectedItemObj.unitPrice
    const prefix = formType === "internal" ? "BB-NTNB-2026" : "BBNT-CS-2026"
    const code = `${prefix}/${String(Math.floor(Math.random() * 90) + 10)}`

    const newRecord: AcceptanceRecord = {
      id: `acc-${Date.now()}`,
      code,
      type: formType,
      taskName: selectedItemObj.targetLocation ? `Đề án tại ${selectedItemObj.targetLocation}` : "Nhiệm vụ địa vật lý",
      unitName: "Đoàn Địa vật lý 1",
      acceptanceDate: formDate,
      committeeMembers: formCommittee,
      itemId: selectedItemObj.id,
      itemName: selectedItemObj.name,
      acceptedVolume: acceptedVol,
      plannedVolume: selectedItemObj.plannedVolume,
      unit: selectedItemObj.unit,
      acceptedValue: val,
      rating: formRating,
      conclusion: formConclusion,
      taskCompletionStatus: formTaskStatus,
      attachedDocuments: [
        {
          name: formFileName,
          size: "4.2 MB",
          uploadDate: formDate,
        },
      ],
      signStatus: "draft",
    }

    saveAcceptance(newRecord)
    setAcceptances(getAcceptances())
    setItems(getTechnicalItems())
    setKpis(getEngineeringKPIs())
    setIsNewAcceptanceModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 text-xs font-semibold">
              TEC-08, 09, 10 & 11
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Nghiệm thu khối lượng, Biên bản & Hồ sơ kỹ thuật
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý quy trình nghiệm thu nội bộ & nghiệm thu cơ sở, đính kèm biên bản kết quả và theo dõi khối lượng nghiệm thu so với kế hoạch (PA-XXVIII).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsNewAcceptanceModalOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Lập biên bản nghiệm thu mới
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nghiệm thu nội bộ (TEC-08)
            </CardTitle>
            <Briefcase className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700">
              {(totalInternalVal / 1000000).toLocaleString("vi-VN")} Tr VNĐ
            </div>
            <p className="mt-1 text-xs text-slate-500">Khối lượng nghiệm thu cấp Đoàn thi công</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nghiệm thu cơ sở (TEC-09)
            </CardTitle>
            <Award className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(totalInstVal / 1000000).toLocaleString("vi-VN")} Tr VNĐ
            </div>
            <p className="mt-1 text-xs text-slate-500">Hội đồng Liên đoàn phê duyệt hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tỷ lệ nghiệm thu cơ sở (TEC-11)
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{kpis.acceptancePercent}%</div>
            <p className="mt-1 text-xs text-slate-500">So với tổng dự toán kế hoạch</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hồ sơ & Biên bản lưu trữ (TEC-10)
            </CardTitle>
            <Paperclip className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalDocumentsCount} tài liệu</div>
            <p className="mt-1 text-xs text-slate-500">File PDF scan, bản vẽ DWG, báo cáo kết quả</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison table: Khối lượng nghiệm thu so với kế hoạch theo nhiệm vụ/đơn vị (TEC-11, PA-XXVIII) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-teal-600" />
                Theo dõi khối lượng đã nghiệm thu so với kế hoạch theo Hạng mục & Đơn vị (TEC-11 & PA-XXVIII)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Hiển thị đối chiếu khối lượng kế hoạch, khối lượng thi công hiện trường, nghiệm thu nội bộ và nghiệm thu cơ sở.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-teal-200 bg-teal-50 text-teal-800">
              Cập nhật đồng bộ tự động
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[110px] font-semibold text-slate-700">Mã HM</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tên hạng mục kỹ thuật</TableHead>
                  <TableHead className="w-[80px] font-semibold text-slate-700">ĐVT</TableHead>
                  <TableHead className="w-[110px] text-right font-semibold text-slate-700">Kế hoạch</TableHead>
                  <TableHead className="w-[110px] text-right font-semibold text-slate-700">Đã thi công</TableHead>
                  <TableHead className="w-[110px] text-right font-semibold text-slate-700">NT nội bộ</TableHead>
                  <TableHead className="w-[110px] text-right font-semibold text-slate-700">NT cơ sở</TableHead>
                  <TableHead className="w-[140px] text-center font-semibold text-slate-700">% Hoàn thành cơ sở</TableHead>
                  <TableHead className="w-[130px] text-right font-semibold text-slate-700">Giá trị NT cơ sở</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const percentInst = Math.round((item.institutionalAcceptedVolume / item.plannedVolume) * 100)
                  const instValue = item.institutionalAcceptedVolume * item.unitPrice
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-bold text-teal-700">{item.code}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-800">
                        {item.name}
                        <div className="text-[11px] text-slate-400 font-normal">{item.targetLocation}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{item.unit}</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-900">{item.plannedVolume}</TableCell>
                      <TableCell className="text-right text-xs font-medium text-blue-600">{item.completedVolume}</TableCell>
                      <TableCell className="text-right text-xs font-medium text-teal-600">{item.internalAcceptedVolume}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-purple-700">{item.institutionalAcceptedVolume}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-teal-600"
                              style={{ width: `${Math.min(100, percentInst)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{percentInst}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-900">
                        {(instValue / 1000000).toLocaleString("vi-VN")} Tr
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Nghiệm thu nội bộ vs Nghiệm thu cơ sở */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="all" className="text-xs">Tất cả biên bản ({acceptances.length})</TabsTrigger>
            <TabsTrigger value="internal" className="text-xs">
              Nghiệm thu nội bộ (TEC-08) ({acceptances.filter((a) => a.type === "internal").length})
            </TabsTrigger>
            <TabsTrigger value="institutional" className="text-xs">
              Nghiệm thu cơ sở (TEC-09) ({acceptances.filter((a) => a.type === "institutional").length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm số biên bản, hội đồng, nhiệm vụ..."
              className="pl-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Content Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[140px] font-semibold text-slate-700">Số biên bản</TableHead>
                    <TableHead className="w-[120px] font-semibold text-slate-700">Loại nghiệm thu</TableHead>
                    <TableHead className="font-semibold text-slate-700">Hạng mục & Nhiệm vụ</TableHead>
                    <TableHead className="w-[100px] font-semibold text-slate-700">Ngày NT</TableHead>
                    <TableHead className="w-[110px] text-right font-semibold text-slate-700">KL nghiệm thu</TableHead>
                    <TableHead className="w-[130px] text-right font-semibold text-slate-700">Giá trị NT (VNĐ)</TableHead>
                    <TableHead className="w-[100px] text-center font-semibold text-slate-700">Xếp loại</TableHead>
                    <TableHead className="w-[130px] font-semibold text-slate-700">Trạng thái NV</TableHead>
                    <TableHead className="w-[110px] font-semibold text-slate-700">Tài liệu</TableHead>
                    <TableHead className="w-[90px] text-right font-semibold text-slate-700">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-8 text-center text-sm text-slate-500">
                        Không tìm thấy biên bản nghiệm thu nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-mono text-xs font-semibold text-teal-800">
                          {rec.code}
                        </TableCell>
                        <TableCell>
                          {rec.type === "internal" ? (
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              Nội bộ (TEC-08)
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                              Cơ sở (TEC-09)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs text-slate-900">{rec.itemName}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{rec.taskName}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{rec.acceptanceDate}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-xs text-slate-900">{rec.acceptedVolume}</span>{" "}
                          <span className="text-[11px] text-slate-500">{rec.unit}</span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-teal-700">
                          {rec.acceptedValue.toLocaleString("vi-VN")} đ
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              rec.rating === "Xuất sắc"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {rec.rating}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-normal ${
                              rec.taskCompletionStatus === "Hoàn thành nhiệm vụ"
                                ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                                : "border-slate-300 text-slate-600"
                            }`}
                          >
                            {rec.taskCompletionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Paperclip className="h-3 w-3 text-slate-400" />
                            <span>{rec.attachedDocuments.length} file</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-teal-700"
                              onClick={() => setSelectedRecordDetail(rec)}
                              title="Xem chi tiết & Biên bản kết quả"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {rec.signStatus === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                onClick={() => handleSignRecord(rec.id)}
                                title="Ký số phê duyệt biên bản"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {/* Modal View Detail & Attached Documents (TEC-10) */}
      <Dialog
        open={!!selectedRecordDetail}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedRecordDetail(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileCheck2 className="h-5 w-5 text-teal-700" />
              Biên bản nghiệm thu kỹ thuật - {selectedRecordDetail?.code}
            </DialogTitle>
          </DialogHeader>

          {selectedRecordDetail && (
            <div className="space-y-4 text-xs text-slate-700 py-2">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">Hạng mục nghiệm thu:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedRecordDetail.itemName}</div>
                  <div className="text-[11px] text-teal-700 font-medium">
                    Loại: {selectedRecordDetail.type === "internal" ? "Nghiệm thu nội bộ (TEC-08)" : "Nghiệm thu cơ sở (TEC-09)"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Nhiệm vụ / Đơn vị:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedRecordDetail.taskName}</div>
                  <div className="text-[11px] text-slate-500">Đơn vị: {selectedRecordDetail.unitName}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-2.5 rounded border border-slate-200 bg-white">
                  <div className="text-slate-500 text-[11px]">Ngày nghiệm thu</div>
                  <div className="font-semibold text-slate-900 mt-1">{selectedRecordDetail.acceptanceDate}</div>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-white">
                  <div className="text-slate-500 text-[11px]">Khối lượng nghiệm thu</div>
                  <div className="font-bold text-teal-700 text-sm mt-0.5">
                    {selectedRecordDetail.acceptedVolume} {selectedRecordDetail.unit}
                  </div>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-white">
                  <div className="text-slate-500 text-[11px]">Giá trị thành tiền</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedRecordDetail.acceptedValue.toLocaleString("vi-VN")} đ
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800">Thành phần Hội đồng nghiệm thu:</div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                  {selectedRecordDetail.committeeMembers}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800">Kết luận & Đánh giá của Hội đồng:</div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
                  <p>{selectedRecordDetail.conclusion}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Badge variant="outline" className="border-teal-300 text-teal-800 bg-teal-50 text-[11px]">
                      Xếp loại: {selectedRecordDetail.rating}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 text-slate-700 text-[11px]">
                      Trạng thái nhiệm vụ: {selectedRecordDetail.taskCompletionStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Attached documents (TEC-10) */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Hồ sơ kỹ thuật & Tài liệu kết quả đính kèm (TEC-10):</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedRecordDetail.attachedDocuments.length} tệp
                  </Badge>
                </div>
                <div className="space-y-2">
                  {selectedRecordDetail.attachedDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-teal-700" />
                        <div>
                          <div className="font-medium text-slate-900 text-xs">{doc.name}</div>
                          <div className="text-[10px] text-slate-400">
                            Dung lượng: {doc.size} • Ngày tải lên: {doc.uploadDate}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
                        onClick={() => alert(`Tải xuống tệp demo: ${doc.name}`)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Tải về
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500">Trạng thái ký duyệt:</span>{" "}
                  {selectedRecordDetail.signStatus === "signed" ? (
                    <b className="text-emerald-700">Đã ký số phê duyệt hợp lệ</b>
                  ) : (
                    <span className="text-amber-600 font-medium">Bản dự thảo (Chờ ký duyệt)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedRecordDetail && selectedRecordDetail.signStatus === "draft" && (
              <Button
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs"
                onClick={() => handleSignRecord(selectedRecordDetail.id)}
              >
                <FileSignature className="mr-1.5 h-3.5 w-3.5" />
                Ký số phê duyệt biên bản
              </Button>
            )}
            <Button
              variant="outline"
              className="text-xs"
              onClick={() => setSelectedRecordDetail(null)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Create Acceptance Record (TEC-08, TEC-09, TEC-10) */}
      <Dialog
        open={isNewAcceptanceModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setIsNewAcceptanceModalOpen(false)
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSaveAcceptance}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Plus className="h-5 w-5 text-teal-700" />
                Lập biên bản nghiệm thu mới (TEC-08 & TEC-09)
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Loại nghiệm thu *</Label>
                  <Select
                    value={formType}
                    onValueChange={(val: "internal" | "institutional") => setFormType(val)}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Nghiệm thu nội bộ cấp Đoàn (TEC-08)</SelectItem>
                      <SelectItem value="institutional">Nghiệm thu cơ sở cấp Liên đoàn (TEC-09)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-slate-700">Ngày nghiệm thu *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Hạng mục kỹ thuật nghiệm thu *</Label>
                <Select value={formItemId} onValueChange={setFormItemId}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue placeholder="Chọn hạng mục kỹ thuật" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((it) => (
                      <SelectItem key={it.id} value={it.id} className="text-xs">
                        {it.code} - {it.name} (Đã thi công: {it.completedVolume} / {it.plannedVolume} {it.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">
                    Khối lượng nghiệm thu ({selectedItemObj?.unit || "đv"}) *
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formAcceptedVolume}
                    onChange={(e) => setFormAcceptedVolume(e.target.value)}
                    className="mt-1 text-xs font-bold text-teal-700"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Đánh giá xếp loại</Label>
                  <Select
                    value={formRating}
                    onValueChange={(val: "Xuất sắc" | "Đạt yêu cầu" | "Chưa đạt") => setFormRating(val)}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Xuất sắc">Xuất sắc</SelectItem>
                      <SelectItem value="Đạt yêu cầu">Đạt yêu cầu</SelectItem>
                      <SelectItem value="Chưa đạt">Chưa đạt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Trạng thái nhiệm vụ</Label>
                  <Select
                    value={formTaskStatus}
                    onValueChange={(val: "Đang thi công" | "Hoàn thành nhiệm vụ") => setFormTaskStatus(val)}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Đang thi công">Đang thi công</SelectItem>
                      <SelectItem value="Hoàn thành nhiệm vụ">Hoàn thành nhiệm vụ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Thành phần Hội đồng nghiệm thu</Label>
                <Input
                  value={formCommittee}
                  onChange={(e) => setFormCommittee(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Kết luận của Hội đồng nghiệm thu</Label>
                <Textarea
                  value={formConclusion}
                  onChange={(e) => setFormConclusion(e.target.value)}
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Tài liệu kết quả đính kèm (Biên bản scan, mặt cắt, báo cáo - TEC-10)
                </Label>
                <Input
                  value={formFileName}
                  onChange={(e) => setFormFileName(e.target.value)}
                  placeholder="Tên file đính kèm: Bien-ban-nghiem-thu.pdf"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="text-xs"
                onClick={() => setIsNewAcceptanceModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white text-xs">
                Tạo biên bản nghiệm thu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
