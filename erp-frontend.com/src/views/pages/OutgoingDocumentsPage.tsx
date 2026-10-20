import { useEffect, useMemo, useState } from "react"
import {
  FileUp,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Send,
  PenTool,
  CheckCircle2,
  FileCheck,
  Building2,
  Paperclip,
  Download,
  Calendar,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
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
  getOutgoingDocuments,
  addOutgoingDocument,
  submitOutgoingDocumentForSignature,
  signOutgoingDocument,
  issueOutgoingDocument,
  resetOutgoingDocumentsDemoData,
} from "@/services/OutgoingDocumentService"
import {
  OutgoingDocument,
  OutgoingDocumentInput,
  OutgoingDocumentStatus,
  OUTGOING_DOCUMENT_STATUSES,
  OUTGOING_DOCUMENT_TYPES,
  URGENCY_LEVELS,
} from "@/types/outgoingDocument"

const APPROVERS_LIST = [
  "Phạm Trường Sơn (Liên đoàn trưởng)",
  "Hoàng Minh Tuấn (Phó Liên đoàn trưởng)",
]

const DRAFTING_UNITS = [
  "Văn phòng Liên đoàn",
  "Phòng Kỹ thuật - Khối lượng",
  "Phòng Kế hoạch - Tài chính",
  "Phòng Mua sắm - Vật tư",
  "Đoàn Địa vật lý 1",
  "Đoàn Địa vật lý 2",
  "Đoàn Địa vật lý 3",
]

const EMPTY_INPUT: OutgoingDocumentInput = {
  documentNumber: `Dự thảo-CV/2026-${Math.floor(Math.random() * 90 + 10)}`,
  summary: "",
  documentType: "Công văn",
  urgency: "Bình thường",
  draftingUnit: DRAFTING_UNITS[0],
  drafterName: "Trần Thị Mai",
  approverName: APPROVERS_LIST[0],
  recipients: "Các Phòng chuyên môn và Đoàn Địa vật lý",
  attachments: [],
}

function getStatusBadge(status: OutgoingDocumentStatus) {
  switch (status) {
    case "Dự thảo":
      return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Dự thảo</Badge>
    case "Chờ ký":
      return <Badge className="bg-amber-100 text-amber-900 border-amber-300">Chờ ký</Badge>
    case "Đã ký":
      return <Badge className="bg-purple-100 text-purple-900 border-purple-300">Đã ký</Badge>
    case "Đã phát hành":
      return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">Đã phát hành</Badge>
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

export default function OutgoingDocumentsPage() {
  const [documents, setDocuments] = useState<OutgoingDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all")

  // Modals state
  const [detailDoc, setDetailDoc] = useState<OutgoingDocument | null>(null)
  const [submitSignDoc, setSubmitSignDoc] = useState<OutgoingDocument | null>(null)
  const [signModalDoc, setSignModalDoc] = useState<OutgoingDocument | null>(null)
  const [issueModalDoc, setIssueModalDoc] = useState<OutgoingDocument | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Form states
  const [approverSelected, setApproverSelected] = useState(APPROVERS_LIST[0])
  const [submitNote, setSubmitNote] = useState("")
  const [signNote, setSignNote] = useState("")
  const [officialNumInput, setOfficialNumInput] = useState("")
  const [issueNote, setIssueNote] = useState("")

  const [createForm, setCreateForm] = useState<OutgoingDocumentInput>(EMPTY_INPUT)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await getOutgoingDocuments()
      setDocuments(data)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể tải danh sách văn bản đi")
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
        (doc.officialNumber && doc.officialNumber.toLowerCase().includes(query)) ||
        doc.summary.toLowerCase().includes(query) ||
        doc.drafterName.toLowerCase().includes(query) ||
        doc.recipients.toLowerCase().includes(query)
      )
    })
  }, [documents, searchTerm, statusFilter, typeFilter, urgencyFilter])

  // Trình ký submit
  const handleSubmitSignAction = async () => {
    if (!submitSignDoc) return
    setIsSubmitting(true)
    try {
      await submitOutgoingDocumentForSignature(submitSignDoc.id, approverSelected, submitNote)
      appToast.success(`Đã trình ký thành công tới ${approverSelected}!`)
      setSubmitSignDoc(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi trình ký văn bản")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ký duyệt (Mô phỏng chữ ký số)
  const handleSignAction = async () => {
    if (!signModalDoc) return
    setIsSubmitting(true)
    try {
      await signOutgoingDocument(signModalDoc.id, signNote)
      appToast.success("Đã phê duyệt và ký số mô phỏng thành công!")
      setSignModalDoc(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi ký duyệt văn bản")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Phát hành văn bản
  const handleIssueAction = async () => {
    if (!issueModalDoc) return
    if (!officialNumInput.trim()) {
      appToast.error("Thiếu số văn bản", "Vui lòng nhập số văn bản phát hành chính thức.")
      return
    }
    setIsSubmitting(true)
    try {
      await issueOutgoingDocument(issueModalDoc.id, officialNumInput, issueNote)
      appToast.success(`Đã phát hành văn bản chính thức số ${officialNumInput}!`)
      setIssueModalDoc(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi phát hành văn bản")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create new draft
  const handleCreateSubmit = async () => {
    if (!createForm.summary.trim() || !createForm.drafterName.trim()) {
      appToast.error("Thiếu thông tin", "Vui lòng nhập Trích yếu nội dung và Người soạn thảo.")
      return
    }
    setIsSubmitting(true)
    try {
      await addOutgoingDocument(createForm)
      appToast.success("Đã tạo dự thảo văn bản đi mới!")
      setCreateOpen(false)
      setCreateForm(EMPTY_INPUT)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi tạo dự thảo văn bản đi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetData = async () => {
    setIsLoading(true)
    try {
      await resetOutgoingDocumentsDemoData()
      appToast.success("Đã khôi phục dữ liệu văn bản đi mẫu ban đầu!")
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Khôi phục dữ liệu không thành công")
    } finally {
      setIsLoading(false)
    }
  }

  const columns: DataTableColumn<OutgoingDocument>[] = [
    {
      key: "index",
      header: "STT",
      headClassName: "w-12 text-center",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_, idx) => idx + 1,
    },
    {
      key: "documentNumber",
      header: "Số hiệu / Ký hiệu",
      headClassName: "min-w-36 font-semibold",
      cellClassName: "font-semibold text-purple-700",
      render: (item) => (
        <div>
          <span>{item.officialNumber || item.documentNumber}</span>
          <div className="text-xs font-normal text-muted-foreground">
            {item.issuedDate ? `Phát hành: ${item.issuedDate.slice(0, 10)}` : `Tạo: ${item.createdAt.slice(0, 10)}`}
          </div>
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
            <User className="h-3 w-3" />
            <span>Soạn: {item.drafterName} ({item.draftingUnit})</span>
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
      key: "recipients",
      header: "Nơi nhận",
      headClassName: "min-w-44",
      render: (item) => (
        <p className="line-clamp-2 text-xs text-slate-700 font-normal">{item.recipients}</p>
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
      header: "Thao tác nghiệp vụ",
      headClassName: "w-56 min-w-56 text-center",
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

          {item.status === "Dự thảo" && (
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setSubmitSignDoc(item)
                setApproverSelected(item.approverName || APPROVERS_LIST[0])
                setSubmitNote("")
              }}
              title="Trình ký"
            >
              <Send className="h-3.5 w-3.5 mr-1" /> Trình ký
            </Button>
          )}

          {item.status === "Chờ ký" && (
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2 text-xs bg-purple-700 hover:bg-purple-800 text-white"
              onClick={() => {
                setSignModalDoc(item)
                setSignNote("")
              }}
              title="Mô phỏng ký duyệt"
            >
              <PenTool className="h-3.5 w-3.5 mr-1" /> Ký duyệt
            </Button>
          )}

          {item.status === "Đã ký" && (
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setIssueModalDoc(item)
                setOfficialNumInput(`${Math.floor(Math.random() * 90 + 10)}/QĐ-LĐVLĐC`)
                setIssueNote("")
              }}
              title="Phát hành văn bản"
            >
              <FileCheck className="h-3.5 w-3.5 mr-1" /> Phát hành
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {isLoading && <BoatLoading fullScreen label="Đang tải danh sách văn bản đi..." />}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
            <FileUp className="h-7 w-7 text-purple-700" />
            Văn bản đi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý quy trình soạn thảo, trình ký, phê duyệt và phát hành văn bản đi của Liên đoàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetData} title="Reset dữ liệu mẫu demo">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Reset Demo
          </Button>
          <ActionButton
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setCreateForm({
                ...EMPTY_INPUT,
                documentNumber: `Dự thảo-CV/2026-${Math.floor(Math.random() * 900 + 100)}`,
              })
              setCreateOpen(true)
            }}
          >
            Tạo văn bản đi mới
          </ActionButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Dự thảo</p>
              <p className="text-2xl font-bold text-slate-800">
                {documents.filter((d) => d.status === "Dự thảo").length}
              </p>
            </div>
            <FileUp className="h-8 w-8 text-slate-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-800 font-medium uppercase">Chờ ký duyệt</p>
              <p className="text-2xl font-bold text-amber-900">
                {documents.filter((d) => d.status === "Chờ ký").length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-800 font-medium uppercase">Đã ký số</p>
              <p className="text-2xl font-bold text-purple-900">
                {documents.filter((d) => d.status === "Đã ký").length}
              </p>
            </div>
            <PenTool className="h-8 w-8 text-purple-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-medium uppercase">Đã phát hành</p>
              <p className="text-2xl font-bold text-emerald-900">
                {documents.filter((d) => d.status === "Đã phát hành").length}
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
              placeholder="Tìm theo số hiệu, trích yếu, người soạn, nơi nhận..."
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
                ...OUTGOING_DOCUMENT_TYPES.map((t) => ({ value: t, label: t })),
              ]}
              value={typeFilter}
              onValueChange={setTypeFilter}
              triggerClassName="w-40 bg-white"
            />
          </div>
        </div>

        {/* Status Tabs Filter */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-slate-100 p-1">
            <TabsTrigger value="all">Tất cả ({documents.length})</TabsTrigger>
            <TabsTrigger value="Dự thảo">Dự thảo ({documents.filter((d) => d.status === "Dự thảo").length})</TabsTrigger>
            <TabsTrigger value="Chờ ký">Chờ ký ({documents.filter((d) => d.status === "Chờ ký").length})</TabsTrigger>
            <TabsTrigger value="Đã ký">Đã ký ({documents.filter((d) => d.status === "Đã ký").length})</TabsTrigger>
            <TabsTrigger value="Đã phát hành">Phát hành ({documents.filter((d) => d.status === "Đã phát hành").length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Paginated Data Table */}
      <PaginatedDataTable
        data={filteredDocuments}
        columns={columns}
        rowKey={(item) => item.id}
        emptyMessage="Không tìm thấy văn bản đi nào phù hợp."
        minTableWidth="1300px"
        stickyLastColumn
      />

      {/* ==================================================================== */}
      {/* MODAL: Xem chi tiết văn bản đi */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(detailDoc)} onOpenChange={(open) => !open && setDetailDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-purple-900">
              <FileUp className="h-5 w-5 text-purple-700" />
              Chi tiết Văn bản đi - {detailDoc?.officialNumber || detailDoc?.documentNumber}
            </DialogTitle>
          </DialogHeader>

          {detailDoc && (
            <Tabs defaultValue="info" className="w-full mt-2">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                <TabsTrigger value="signature">Chữ ký số & Tệp</TabsTrigger>
                <TabsTrigger value="history">Lịch sử trình ký & phát hành ({detailDoc.processHistory.length})</TabsTrigger>
              </TabsList>

              {/* Tab Thông tin chung */}
              <TabsContent value="info" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm border">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Số hiệu / Ký hiệu</span>
                    <p className="font-bold text-purple-900 text-base">{detailDoc.officialNumber || detailDoc.documentNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Trạng thái</span>
                    <div>{getStatusBadge(detailDoc.status)}</div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Đơn vị soạn thảo</span>
                    <p className="font-semibold text-slate-800">{detailDoc.draftingUnit}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Người soạn thảo</span>
                    <p>{detailDoc.drafterName}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Lãnh đạo ký duyệt</span>
                    <p className="font-semibold text-slate-800">{detailDoc.approverName}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Độ khẩn</span>
                    <div>{getUrgencyBadge(detailDoc.urgency)}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Trích yếu nội dung</span>
                  <div className="p-3 bg-white border rounded-md text-sm leading-relaxed font-medium">
                    {detailDoc.summary}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Nơi nhận văn bản</span>
                  <div className="p-3 bg-slate-50 border rounded-md text-sm text-slate-700">
                    {detailDoc.recipients}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Chữ ký số mô phỏng */}
              <TabsContent value="signature" className="space-y-4 pt-3">
                <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-3">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-purple-700" />
                    Trạng thái Chữ ký số mô phỏng
                  </h4>

                  {detailDoc.status === "Đã ký" || detailDoc.status === "Đã phát hành" ? (
                    <div className="bg-white p-4 border border-purple-300 rounded-md shadow-sm space-y-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> CHỮ KÝ SỐ MÔ PHỎNG HỢP LỆ
                        </span>
                        <span className="text-xs text-muted-foreground">{detailDoc.signedDate}</span>
                      </div>
                      <p className="text-sm">
                        <strong>Người ký:</strong> {detailDoc.approverName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mã băm chứng thư: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-800">SHA256:7f8e...90ab-SIMULATED-SIGNATURE</code>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-3 border border-amber-200 rounded-md text-amber-900 text-sm">
                      Văn bản chưa được đóng dấu chữ ký số. Cần thực hiện bước <strong>Trình ký & Ký duyệt</strong>.
                    </div>
                  )}
                </div>

                {/* Tệp đính kèm */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Tệp đính kèm văn bản ({detailDoc.attachments.length})</h4>
                  {detailDoc.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-5 w-5 text-purple-700" />
                        <div>
                          <p className="font-medium text-sm text-slate-800">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB • Tải lên: {file.uploadedAt}
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
              </TabsContent>

              {/* Tab Lịch sử trình ký */}
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
            <Button variant="outline" onClick={() => setDetailDoc(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Mô phỏng Trình ký */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(submitSignDoc)} onOpenChange={(open) => !open && setSubmitSignDoc(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900">
              <Send className="h-5 w-5 text-amber-600" />
              Mô phỏng Trình ký Văn bản đi - {submitSignDoc?.documentNumber}
            </DialogTitle>
          </DialogHeader>

          {submitSignDoc && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="font-semibold text-amber-900 line-clamp-2">{submitSignDoc.summary}</p>
                <p className="text-xs text-amber-700 mt-1">Đơn vị soạn: {submitSignDoc.draftingUnit}</p>
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Chọn Lãnh đạo ký duyệt (*)</Label>
                <SelectField
                  label=""
                  options={APPROVERS_LIST.map((ap) => ({ value: ap, label: ap }))}
                  value={approverSelected}
                  onValueChange={setApproverSelected}
                  triggerClassName="bg-white"
                />
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Ý kiến trình ký</Label>
                <TextareaField
                  rows={3}
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  placeholder="Nhập nội dung ghi chú trình ký Lãnh đạo..."
                  className="bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitSignDoc(null)}>
              Hủy
            </Button>
            <ActionButton
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSubmitSignAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang gửi..." : "Xác nhận trình ký"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Mô phỏng Ký duyệt */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(signModalDoc)} onOpenChange={(open) => !open && setSignModalDoc(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-900">
              <PenTool className="h-5 w-5 text-purple-700" />
              Mô phỏng Ký duyệt Chữ ký số - {signModalDoc?.documentNumber}
            </DialogTitle>
          </DialogHeader>

          {signModalDoc && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="font-semibold text-purple-900 line-clamp-2">{signModalDoc.summary}</p>
                <p className="text-xs text-purple-700 mt-1">Lãnh đạo ký duyệt: {signModalDoc.approverName}</p>
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Ý kiến phê duyệt</Label>
                <TextareaField
                  rows={3}
                  value={signNote}
                  onChange={(e) => setSignNote(e.target.value)}
                  placeholder="Đã duyệt. Đồng ý ban hành..."
                  className="bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignModalDoc(null)}>
              Hủy
            </Button>
            <ActionButton
              className="bg-purple-700 hover:bg-purple-800 text-white"
              onClick={handleSignAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang ký số..." : "Xác nhận ký duyệt mô phỏng"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Mô phỏng Phát hành văn bản */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(issueModalDoc)} onOpenChange={(open) => !open && setIssueModalDoc(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-900">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              Phát hành Văn bản chính thức
            </DialogTitle>
          </DialogHeader>

          {issueModalDoc && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                <p className="font-semibold text-emerald-900 line-clamp-2">{issueModalDoc.summary}</p>
                <p className="text-xs text-emerald-700 mt-1">Nơi nhận: {issueModalDoc.recipients}</p>
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Số văn bản chính thức phát hành (*)</Label>
                <Input
                  value={officialNumInput}
                  onChange={(e) => setOfficialNumInput(e.target.value)}
                  placeholder="Ví dụ: 89/QĐ-LĐVLĐC"
                  className="bg-white font-bold text-purple-900"
                />
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Ghi chú phát hành văn bản</Label>
                <TextareaField
                  rows={2}
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  placeholder="Ghi chú vào sổ văn bản đi..."
                  className="bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueModalDoc(null)}>
              Hủy
            </Button>
            <ActionButton
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleIssueAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang phát hành..." : "Xác nhận phát hành"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Tạo văn bản đi mới */}
      {/* ==================================================================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-900">
              <Plus className="h-5 w-5 text-purple-700" />
              Tạo dự thảo Văn bản đi mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block font-semibold">Ký hiệu dự thảo (*)</Label>
                <Input
                  value={createForm.documentNumber}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, documentNumber: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <SelectField
                label="Loại văn bản"
                options={OUTGOING_DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
                value={createForm.documentType}
                onValueChange={(val) =>
                  setCreateForm((prev) => ({ ...prev, documentType: val as any }))
                }
                triggerClassName="bg-white"
              />
            </div>

            <div>
              <Label className="mb-1.5 block font-semibold">Trích yếu nội dung (*)</Label>
              <TextareaField
                rows={3}
                value={createForm.summary}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Nhập nội dung trích yếu của văn bản đi..."
                className="bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Đơn vị soạn thảo"
                options={DRAFTING_UNITS.map((u) => ({ value: u, label: u }))}
                value={createForm.draftingUnit}
                onValueChange={(val) => setCreateForm((prev) => ({ ...prev, draftingUnit: val }))}
                triggerClassName="bg-white"
              />

              <div>
                <Label className="mb-1.5 block font-semibold">Người soạn thảo (*)</Label>
                <Input
                  value={createForm.drafterName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, drafterName: e.target.value }))}
                  placeholder="Họ tên cán bộ soạn thảo"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Lãnh đạo ký duyệt dự kiến"
                options={APPROVERS_LIST.map((ap) => ({ value: ap, label: ap }))}
                value={createForm.approverName}
                onValueChange={(val) => setCreateForm((prev) => ({ ...prev, approverName: val }))}
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

            <div>
              <Label className="mb-1.5 block font-semibold">Nơi nhận văn bản</Label>
              <Input
                value={createForm.recipients}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, recipients: e.target.value }))}
                placeholder="Ví dụ: Các Phòng chuyên môn, Cục Địa chất Việt Nam..."
                className="bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <ActionButton onClick={handleCreateSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Tạo dự thảo"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
