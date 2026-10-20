import { useEffect, useMemo, useState } from "react"
import {
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Eye,
  Clock,
  Send,
  Download,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
} from "lucide-react"

import { ActionButton } from "@/components/ui/action-button"
import { appToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { SelectField, TextareaField } from "@/components/ui/form-fields"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getIncomingDocuments,
  addIncomingDocument,
  assignIncomingDocument,
  updateIncomingDocumentStatus,
  resetIncomingDocumentsDemoData,
} from "@/services/IncomingDocumentService"
import {
  IncomingDocument,
  IncomingDocumentInput,
  IncomingDocumentStatus,
  INCOMING_DOCUMENT_STATUSES,
  INCOMING_DOCUMENT_TYPES,
  URGENCY_LEVELS,
} from "@/types/incomingDocument"

const UNITS_LIST = [
  "Phòng Kỹ thuật - Khối lượng",
  "Phòng Kế hoạch - Tài chính",
  "Phòng Mua sắm - Vật tư",
  "Văn phòng Liên đoàn",
  "Đoàn Địa vật lý 1",
  "Đoàn Địa vật lý 2",
  "Đoàn Địa vật lý 3",
  "Trung tâm Kiểm định thiết bị",
]

const EMPTY_INPUT: IncomingDocumentInput = {
  documentNumber: "",
  releaseDate: new Date().toISOString().slice(0, 10),
  receivedDate: new Date().toLocaleString("vi-VN"),
  summary: "",
  senderUnit: "",
  documentType: "Công văn",
  urgency: "Bình thường",
  status: "Mới tiếp nhận",
  assignedToUnit: "",
  assignedToUser: "",
  coordinatingUnits: [],
  dueDate: "",
  instruction: "",
  attachments: [],
}

function getStatusBadge(status: IncomingDocumentStatus) {
  switch (status) {
    case "Mới tiếp nhận":
      return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200">Mới tiếp nhận</Badge>
    case "Đã tiếp nhận":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đã tiếp nhận</Badge>
    case "Đã phân công":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã phân công</Badge>
    case "Đang xử lý":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Đang xử lý</Badge>
    case "Hoàn thành":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Hoàn thành</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getUrgencyBadge(urgency: string) {
  switch (urgency) {
    case "Hỏa tốc":
      return <Badge className="bg-red-600 text-white font-semibold animate-pulse">Hỏa tốc</Badge>
    case "Thượng khẩn":
      return <Badge className="bg-orange-500 text-white font-medium">Thượng khẩn</Badge>
    case "Khẩn":
      return <Badge className="bg-amber-500 text-white">Khẩn</Badge>
    default:
      return <Badge variant="outline" className="text-gray-600">Bình thường</Badge>
  }
}

export default function IncomingDocumentsPage() {
  const [documents, setDocuments] = useState<IncomingDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")

  // Modals state
  const [detailDoc, setDetailDoc] = useState<IncomingDocument | null>(null)
  const [assignDoc, setAssignDoc] = useState<IncomingDocument | null>(null)
  const [statusDoc, setStatusDoc] = useState<IncomingDocument | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Assign form
  const [assignUnit, setAssignUnit] = useState("")
  const [assignUser, setAssignUser] = useState("")
  const [coordinatingUnits, setCoordinatingUnits] = useState<string[]>([])
  const [assignDueDate, setAssignDueDate] = useState("")
  const [instructionText, setInstructionText] = useState("")

  // Update Status Form
  const [nextStatus, setNextStatus] = useState<IncomingDocumentStatus>("Đang xử lý")
  const [statusNote, setStatusNote] = useState("")
  const [statusActor, setStatusActor] = useState("Cán bộ xử lý")

  // Create Form
  const [createForm, setCreateForm] = useState<IncomingDocumentInput>(EMPTY_INPUT)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await getIncomingDocuments()
      setDocuments(data)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể tải danh sách văn bản đến")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredDocuments = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    return documents.filter((doc) => {
      if (statusFilter !== "all" && doc.status !== statusFilter) return false
      if (typeFilter !== "all" && doc.documentType !== typeFilter) return false
      if (urgencyFilter !== "all" && doc.urgency !== urgencyFilter) return false

      if (!query) return true
      return (
        doc.documentNumber.toLowerCase().includes(query) ||
        doc.summary.toLowerCase().includes(query) ||
        doc.senderUnit.toLowerCase().includes(query) ||
        (doc.assignedToUnit && doc.assignedToUnit.toLowerCase().includes(query))
      )
    })
  }, [documents, searchTerm, statusFilter, typeFilter, urgencyFilter])

  // Open Assign Modal
  const openAssignModal = (item: IncomingDocument) => {
    setAssignDoc(item)
    setAssignUnit(item.assignedToUnit || UNITS_LIST[0])
    setAssignUser(item.assignedToUser || "")
    setCoordinatingUnits(item.coordinatingUnits || [])
    setAssignDueDate(item.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
    setInstructionText(item.instruction || "")
  }

  const handleAssignSubmit = async () => {
    if (!assignDoc) return
    if (!assignUnit) {
      appToast.error("Thiếu thông tin", "Vui lòng chọn đơn vị chủ trì xử lý.")
      return
    }
    setIsSubmitting(true)
    try {
      await assignIncomingDocument(assignDoc.id, {
        assignedToUnit: assignUnit,
        assignedToUser: assignUser,
        coordinatingUnits,
        dueDate: assignDueDate,
        instruction: instructionText,
        actor: "Lãnh đạo Liên đoàn",
        role: "Ban Liên đoàn",
      })
      appToast.success("Đã phân công xử lý văn bản thành công!")
      setAssignDoc(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể lưu phân công xử lý")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Status Modal
  const openStatusModal = (item: IncomingDocument) => {
    setStatusDoc(item)
    setNextStatus(item.status === "Hoàn thành" ? "Hoàn thành" : "Đang xử lý")
    setStatusNote("")
    setStatusActor("Cán bộ xử lý")
  }

  const handleStatusSubmit = async () => {
    if (!statusDoc) return
    setIsSubmitting(true)
    try {
      await updateIncomingDocumentStatus(
        statusDoc.id,
        nextStatus,
        statusNote,
        statusActor,
        "Người xử lý",
      )
      appToast.success(`Đã cập nhật trạng thái thành "${nextStatus}"`)
      setStatusDoc(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể cập nhật trạng thái")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create Document
  const handleCreateSubmit = async () => {
    if (!createForm.documentNumber.trim() || !createForm.summary.trim() || !createForm.senderUnit.trim()) {
      appToast.error("Thiếu thông tin", "Vui lòng nhập Số văn bản, Trích yếu và Đơn vị gửi.")
      return
    }
    setIsSubmitting(true)
    try {
      await addIncomingDocument(createForm)
      appToast.success("Đã tiếp nhận văn bản đến mới!")
      setCreateOpen(false)
      setCreateForm(EMPTY_INPUT)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi thêm văn bản mới")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetData = async () => {
    setIsLoading(true)
    try {
      await resetIncomingDocumentsDemoData()
      appToast.success("Đã khôi phục dữ liệu demo mẫu ban đầu!")
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Khôi phục dữ liệu không thành công")
    } finally {
      setIsLoading(false)
    }
  }

  const columns: DataTableColumn<IncomingDocument>[] = [
    {
      key: "index",
      header: "STT",
      headClassName: "w-12 text-center",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_, idx) => idx + 1,
    },
    {
      key: "documentNumber",
      header: "Số văn bản",
      headClassName: "min-w-36 font-semibold",
      cellClassName: "font-semibold text-brand-blue",
      render: (item) => (
        <div>
          <span>{item.documentNumber}</span>
          <div className="text-xs font-normal text-muted-foreground">{item.releaseDate}</div>
        </div>
      ),
    },
    {
      key: "summary",
      header: "Trích yếu nội dung",
      headClassName: "min-w-64 max-w-md",
      render: (item) => (
        <div className="space-y-1">
          <p className="line-clamp-2 font-medium leading-snug">{item.summary}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{item.senderUnit}</span>
          </div>
        </div>
      ),
    },
    {
      key: "documentType",
      header: "Loại VB",
      headClassName: "min-w-28 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge variant="outline" className="bg-slate-50">
          {item.documentType}
        </Badge>
      ),
    },
    {
      key: "urgency",
      header: "Độ khẩn",
      headClassName: "min-w-28 text-center",
      cellClassName: "text-center",
      render: (item) => getUrgencyBadge(item.urgency),
    },
    {
      key: "receivedDate",
      header: "Ngày tiếp nhận",
      headClassName: "min-w-36 text-center",
      cellClassName: "text-center text-xs text-muted-foreground",
      render: (item) => item.receivedDate,
    },
    {
      key: "assignedToUnit",
      header: "Đơn vị xử lý / Hạn",
      headClassName: "min-w-44",
      render: (item) => (
        <div>
          {item.assignedToUnit ? (
            <>
              <p className="font-medium text-xs text-slate-800">{item.assignedToUnit}</p>
              {item.dueDate && (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> Hạn: {item.dueDate}
                </p>
              )}
            </>
          ) : (
            <span className="text-xs italic text-amber-600">Chưa phân công</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "min-w-32 text-center",
      cellClassName: "text-center",
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "actions",
      header: "Thao tác",
      headClassName: "w-52 min-w-52 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-xs"
            onClick={() => setDetailDoc(item)}
            title="Xem chi tiết"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Chi tiết
          </Button>

          <Button
            size="sm"
            variant="default"
            className="h-8 px-2 text-xs bg-brand-blue hover:bg-blue-700"
            onClick={() => openAssignModal(item)}
            title="Phân công xử lý"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1" /> Phân công
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {isLoading && <BoatLoading fullScreen label="Đang tải danh sách văn bản đến..." />}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
            <FileText className="h-7 w-7 text-brand-blue" />
            Văn bản đến
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý, tiếp nhận và theo dõi tiến độ xử lý văn bản đến của Liên đoàn Vật lý Địa chất.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetData} title="Reset dữ liệu mẫu demo">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Reset Demo
          </Button>
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setCreateForm(EMPTY_INPUT)
              setCreateOpen(true)
            }}
          >
            Tiếp nhận VB mới
          </ActionButton>
        </div>
      </div>

      {/* Statistics summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Tổng số văn bản</p>
              <p className="text-2xl font-bold text-slate-800">{documents.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-cyan-800 font-medium uppercase">Mới tiếp nhận</p>
              <p className="text-2xl font-bold text-cyan-900">
                {documents.filter((d) => d.status === "Mới tiếp nhận").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-cyan-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-800 font-medium uppercase">Đã phân công</p>
              <p className="text-2xl font-bold text-purple-900">
                {documents.filter((d) => d.status === "Đã phân công" || d.status === "Đang xử lý").length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-medium uppercase">Hoàn thành</p>
              <p className="text-2xl font-bold text-emerald-900">
                {documents.filter((d) => d.status === "Hoàn thành").length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search controls */}
      <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo số văn bản, trích yếu, đơn vị gửi..."
              className="bg-white pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SelectField
              label=""
              options={[
                { value: "all", label: "Tất cả độ khẩn" },
                ...URGENCY_LEVELS.map((u) => ({ value: u, label: `Độ khẩn: ${u}` })),
              ]}
              value={urgencyFilter}
              onValueChange={setUrgencyFilter}
              triggerClassName="w-44 bg-white"
            />

            <SelectField
              label=""
              options={[
                { value: "all", label: "Tất cả loại VB" },
                ...INCOMING_DOCUMENT_TYPES.map((t) => ({ value: t, label: t })),
              ]}
              value={typeFilter}
              onValueChange={setTypeFilter}
              triggerClassName="w-40 bg-white"
            />
          </div>
        </div>

        {/* Status Tabs Filter */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-slate-100 p-1">
            <TabsTrigger value="all">Tất cả ({documents.length})</TabsTrigger>
            <TabsTrigger value="Mới tiếp nhận">
              Mới ({documents.filter((d) => d.status === "Mới tiếp nhận").length})
            </TabsTrigger>
            <TabsTrigger value="Đã tiếp nhận">Đã tiếp nhận</TabsTrigger>
            <TabsTrigger value="Đã phân công">Đã phân công</TabsTrigger>
            <TabsTrigger value="Đang xử lý">Đang xử lý</TabsTrigger>
            <TabsTrigger value="Hoàn thành">Hoàn thành</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Paginated Data Table */}
      <PaginatedDataTable
        data={filteredDocuments}
        columns={columns}
        rowKey={(item) => item.id}
        emptyMessage="Không tìm thấy văn bản đến nào phù hợp."
        minTableWidth="1300px"
        stickyLastColumn
      />

      {/* ==================================================================== */}
      {/* MODAL: Xem chi tiết văn bản đến */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(detailDoc)} onOpenChange={(open) => !open && setDetailDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-brand-blue">
              <FileText className="h-5 w-5" />
              Chi tiết Văn bản đến - {detailDoc?.documentNumber}
            </DialogTitle>
          </DialogHeader>

          {detailDoc && (
            <Tabs defaultValue="info" className="w-full mt-2">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                <TabsTrigger value="attachments">Tệp đính kèm ({detailDoc.attachments.length})</TabsTrigger>
                <TabsTrigger value="history">Lịch sử xử lý ({detailDoc.processHistory.length})</TabsTrigger>
              </TabsList>

              {/* Tab Thông tin chung */}
              <TabsContent value="info" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm border">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Số văn bản</span>
                    <p className="font-bold text-slate-800 text-base">{detailDoc.documentNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Đơn vị gửi</span>
                    <p className="font-semibold text-slate-800">{detailDoc.senderUnit}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Loại văn bản</span>
                    <p>{detailDoc.documentType}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Độ khẩn</span>
                    <div>{getUrgencyBadge(detailDoc.urgency)}</div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Ngày ban hành</span>
                    <p>{detailDoc.releaseDate}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Ngày tiếp nhận</span>
                    <p>{detailDoc.receivedDate}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Trích yếu nội dung</span>
                  <div className="p-3 bg-white border rounded-md text-sm leading-relaxed font-medium">
                    {detailDoc.summary}
                  </div>
                </div>

                {/* Phần phân công xử lý */}
                <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 space-y-3">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Thông tin Phân công xử lý
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Đơn vị chủ trì:</span>
                      <p className="font-bold text-slate-800">{detailDoc.assignedToUnit || "Chưa phân công"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Người chủ trì:</span>
                      <p className="font-semibold">{detailDoc.assignedToUser || "Chưa chỉ định"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Đơn vị phối hợp:</span>
                      <p>{detailDoc.coordinatingUnits?.length ? detailDoc.coordinatingUnits.join(", ") : "Không có"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Hạn xử lý:</span>
                      <p className="font-semibold text-rose-600">{detailDoc.dueDate || "Chưa quy định"}</p>
                    </div>
                  </div>

                  {detailDoc.instruction && (
                    <div className="pt-2 border-t border-purple-200">
                      <span className="text-xs font-semibold text-purple-900 block">Ý kiến chỉ đạo của Lãnh đạo:</span>
                      <p className="text-sm italic text-slate-700 mt-1">{detailDoc.instruction}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab Tệp đính kèm */}
              <TabsContent value="attachments" className="space-y-3 pt-3">
                {detailDoc.attachments.length === 0 ? (
                  <p className="text-sm text-center py-6 text-muted-foreground">Không có tệp đính kèm.</p>
                ) : (
                  <div className="space-y-2">
                    {detailDoc.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-5 w-5 text-brand-blue" />
                          <div>
                            <p className="font-medium text-sm text-slate-800">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Dung lượng: {(file.size / 1024).toFixed(0)} KB • Tải lên: {file.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-8" asChild>
                          <a href={file.url} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5 mr-1" /> Tải về
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab Lịch sử xử lý */}
              <TabsContent value="history" className="space-y-3 pt-3">
                <div className="relative border-l-2 border-purple-200 ml-4 space-y-6 pl-4 py-2">
                  {detailDoc.processHistory.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full bg-purple-600 ring-4 ring-white" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">{log.action}</span>
                          <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                        </div>
                        <p className="text-xs text-purple-700 font-medium">
                          {log.actor} ({log.role})
                        </p>
                        {log.note && <p className="text-xs text-slate-600 bg-slate-100 p-2 rounded mt-1">{log.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="default"
              className="bg-brand-blue"
              onClick={() => {
                if (detailDoc) {
                  openAssignModal(detailDoc)
                  setDetailDoc(null)
                }
              }}
            >
              <UserCheck className="h-4 w-4 mr-1.5" /> Phân công xử lý văn bản này
            </Button>
            <Button variant="outline" onClick={() => setDetailDoc(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Tiếp nhận & Phân công xử lý */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(assignDoc)} onOpenChange={(open) => !open && setAssignDoc(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-blue">
              <UserCheck className="h-5 w-5" />
              Mô phỏng Phân công xử lý Văn bản - {assignDoc?.documentNumber}
            </DialogTitle>
          </DialogHeader>

          {assignDoc && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="font-semibold text-blue-900 line-clamp-2">{assignDoc.summary}</p>
                <p className="text-xs text-blue-700 mt-1">Đơn vị gửi: {assignDoc.senderUnit}</p>
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Đơn vị chủ trì xử lý (*)</Label>
                <SelectField
                  label=""
                  options={UNITS_LIST.map((unit) => ({ value: unit, label: unit }))}
                  value={assignUnit}
                  onValueChange={setAssignUnit}
                  triggerClassName="bg-white"
                />
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Cán bộ chủ trì</Label>
                <Input
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hùng (Trưởng phòng)"
                  className="bg-white"
                />
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Hạn xử lý (*)</Label>
                <Input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Ý kiến chỉ đạo của Lãnh đạo</Label>
                <TextareaField
                  rows={3}
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  placeholder="Nhập nội dung chỉ đạo, giao nhiệm vụ..."
                  className="bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDoc(null)}>
              Hủy
            </Button>
            <ActionButton onClick={handleAssignSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Xác nhận phân công"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Tiếp nhận văn bản đến mới */}
      {/* ==================================================================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-blue">
              <Plus className="h-5 w-5" />
              Tiếp nhận Văn bản đến mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block font-semibold">Số văn bản (*)</Label>
                <Input
                  value={createForm.documentNumber}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Ví dụ: 156/CV-BTNMT"
                  className="bg-white"
                />
              </div>
              <div>
                <Label className="mb-1.5 block font-semibold">Đơn vị gửi (*)</Label>
                <Input
                  value={createForm.senderUnit}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, senderUnit: e.target.value }))}
                  placeholder="Ví dụ: Cục Địa chất Việt Nam"
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block font-semibold">Trích yếu nội dung (*)</Label>
              <TextareaField
                rows={3}
                value={createForm.summary}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Nhập nội dung trích yếu của văn bản đến..."
                className="bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Loại văn bản"
                options={INCOMING_DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
                value={createForm.documentType}
                onValueChange={(val) =>
                  setCreateForm((prev) => ({ ...prev, documentType: val as any }))
                }
                triggerClassName="bg-white"
              />

              <SelectField
                label="Mức độ khẩn"
                options={URGENCY_LEVELS.map((u) => ({ value: u, label: u }))}
                value={createForm.urgency}
                onValueChange={(val) =>
                  setCreateForm((prev) => ({ ...prev, urgency: val as any }))
                }
                triggerClassName="bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Ngày ban hành</Label>
                <Input
                  type="date"
                  value={createForm.releaseDate}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, releaseDate: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Hạn xử lý (nếu có)</Label>
                <Input
                  type="date"
                  value={createForm.dueDate || ""}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <ActionButton onClick={handleCreateSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Tiếp nhận văn bản"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
