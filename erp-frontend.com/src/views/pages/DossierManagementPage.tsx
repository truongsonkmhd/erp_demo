import { useEffect, useMemo, useState } from "react"
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Search,
  Eye,
  Send,
  Edit,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Paperclip,
  Download,
  Building2,
  Calendar,
  User,
  ArrowRight,
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
  getDossiers,
  addDossier,
  updateDossier,
  submitDossierForApproval,
  resetDossiersDemoData,
} from "@/services/DossierService"
import {
  Dossier,
  DossierInput,
  DossierStatus,
  DOSSIER_STATUSES,
  DOSSIER_TYPES,
} from "@/types/dossier"

const DEPARTMENTS_LIST = [
  "Phòng Kỹ thuật - Khối lượng",
  "Phòng Kế hoạch - Tài chính",
  "Phòng Mua sắm - Vật tư",
  "Văn phòng Liên đoàn",
  "Đoàn Địa vật lý 1",
  "Đoàn Địa vật lý 2",
  "Đoàn Địa vật lý 3",
]

const EMPTY_DOSSIER_INPUT: DossierInput = {
  code: `HS-2026-${Math.floor(Math.random() * 900 + 100)}`,
  name: "",
  dossierType: "Đề nghị mua sắm",
  department: DEPARTMENTS_LIST[0],
  creatorName: "Phạm Văn Minh",
  createdDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  summary: "",
  attachments: [],
}

function getDossierStatusBadge(status: DossierStatus) {
  switch (status) {
    case "Dự thảo":
      return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Dự thảo</Badge>
    case "Chờ Trưởng đơn vị duyệt":
    case "Chờ Phòng chuyên môn duyệt":
    case "Chờ Lãnh đạo phê duyệt":
      return <Badge className="bg-amber-100 text-amber-900 border-amber-300">Chờ phê duyệt</Badge>
    case "Yêu cầu bổ sung":
      return <Badge className="bg-orange-100 text-orange-900 border-orange-300">Yêu cầu bổ sung</Badge>
    case "Đã phê duyệt":
      return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300">Đã phê duyệt</Badge>
    case "Bị từ chối":
      return <Badge className="bg-red-100 text-red-900 border-red-300">Bị từ chối</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function DossierManagementPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")

  // Modal States
  const [detailItem, setDetailItem] = useState<Dossier | null>(null)
  const [editItem, setEditItem] = useState<Dossier | null>(null)
  const [submitItem, setSubmitItem] = useState<Dossier | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Form States
  const [createForm, setCreateForm] = useState<DossierInput>(EMPTY_DOSSIER_INPUT)
  const [editForm, setEditForm] = useState<DossierInput>(EMPTY_DOSSIER_INPUT)
  const [submitNote, setSubmitNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await getDossiers()
      setDossiers(data)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể tải danh sách hồ sơ")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const filteredDossiers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    return dossiers.filter((item) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && !item.status.startsWith("Chờ")) return false
        if (statusFilter !== "pending" && item.status !== statusFilter) return false
      }
      if (typeFilter !== "all" && item.dossierType !== typeFilter) return false
      if (deptFilter !== "all" && item.department !== deptFilter) return false

      if (!query) return true
      return (
        item.code.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.creatorName.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query)
      )
    })
  }, [dossiers, searchTerm, statusFilter, typeFilter, deptFilter])

  // Submit Approval
  const handleSubmitApprovalAction = async () => {
    if (!submitItem) return
    setIsSubmitting(true)
    try {
      await submitDossierForApproval(submitItem.id, submitNote)
      appToast.success(`Đã gửi phê duyệt hồ sơ ${submitItem.code} thành công!`)
      setSubmitItem(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi gửi phê duyệt hồ sơ")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create Dossier
  const handleCreateSubmit = async () => {
    if (!createForm.code.trim() || !createForm.name.trim() || !createForm.summary.trim()) {
      appToast.error("Thiếu thông tin", "Vui lòng nhập Mã hồ sơ, Tên hồ sơ và Nội dung tóm tắt.")
      return
    }
    setIsSubmitting(true)
    try {
      await addDossier(createForm)
      appToast.success("Đã tạo hồ sơ mới thành công!")
      setCreateOpen(false)
      setCreateForm(EMPTY_DOSSIER_INPUT)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể tạo hồ sơ mới")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update Dossier
  const handleEditSubmit = async () => {
    if (!editItem) return
    if (!editForm.name.trim() || !editForm.summary.trim()) {
      appToast.error("Thiếu thông tin", "Vui lòng nhập đầy đủ Tên hồ sơ và Nội dung tóm tắt.")
      return
    }
    setIsSubmitting(true)
    try {
      await updateDossier(editItem.id, editForm)
      appToast.success("Đã cập nhật thông tin hồ sơ thành công!")
      setEditItem(null)
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Lỗi khi cập nhật hồ sơ")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetData = async () => {
    setIsLoading(true)
    try {
      await resetDossiersDemoData()
      appToast.success("Đã khôi phục dữ liệu hồ sơ mẫu ban đầu!")
      await loadData(true)
    } catch (error) {
      console.error(error)
      appToast.error("Khôi phục dữ liệu không thành công")
    } finally {
      setIsLoading(false)
    }
  }

  const columns: DataTableColumn<Dossier>[] = [
    {
      key: "index",
      header: "STT",
      headClassName: "w-12 text-center",
      cellClassName: "text-center font-medium text-muted-foreground",
      render: (_, idx) => idx + 1,
    },
    {
      key: "code",
      header: "Mã hồ sơ",
      headClassName: "min-w-32 font-semibold",
      cellClassName: "font-semibold text-brand-blue",
      render: (item) => (
        <div>
          <span>{item.code}</span>
          <div className="text-xs font-normal text-muted-foreground">{item.createdDate}</div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Tên hồ sơ / Đơn vị lập",
      headClassName: "min-w-64 max-w-md",
      render: (item) => (
        <div className="space-y-1">
          <p className="line-clamp-2 font-medium leading-snug">{item.name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>{item.department} • {item.creatorName}</span>
          </div>
        </div>
      ),
    },
    {
      key: "dossierType",
      header: "Loại hồ sơ",
      headClassName: "min-w-36 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge variant="outline" className="bg-slate-50 font-normal">
          {item.dossierType}
        </Badge>
      ),
    },
    {
      key: "currentHandler",
      header: "Người xử lý / Hạn",
      headClassName: "min-w-44",
      render: (item) => (
        <div>
          <p className="font-medium text-xs text-slate-800">{item.currentHandler}</p>
          <p className="text-xs text-purple-700 font-semibold mt-0.5">{item.currentStep}</p>
          {item.dueDate && (
            <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" /> Hạn: {item.dueDate}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      headClassName: "min-w-36 text-center",
      cellClassName: "text-center",
      render: (item) => getDossierStatusBadge(item.status),
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
            onClick={() => setDetailItem(item)}
            title="Xem chi tiết"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Chi tiết
          </Button>

          {(item.status === "Dự thảo" || item.status === "Yêu cầu bổ sung") && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs text-purple-700 border-purple-200"
                onClick={() => {
                  setEditItem(item)
                  setEditForm({
                    code: item.code,
                    name: item.name,
                    dossierType: item.dossierType,
                    department: item.department,
                    creatorName: item.creatorName,
                    createdDate: item.createdDate,
                    dueDate: item.dueDate || "",
                    summary: item.summary,
                    attachments: item.attachments || [],
                  })
                }}
                title="Sửa hồ sơ"
              >
                <Edit className="h-3.5 w-3.5 mr-1" /> Sửa
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-8 px-2 text-xs bg-brand-blue hover:bg-blue-700"
                onClick={() => {
                  setSubmitItem(item)
                  setSubmitNote("")
                }}
                title="Gửi phê duyệt"
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Gửi duyệt
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      {isLoading && <BoatLoading fullScreen label="Đang tải danh sách hồ sơ..." />}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-brand-blue" />
            Quản lý hồ sơ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh sách, thông tin, tài liệu đính kèm và tiến độ phê duyệt hồ sơ nội bộ.
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
                ...EMPTY_DOSSIER_INPUT,
                code: `HS-2026-${Math.floor(Math.random() * 900 + 100)}`,
              })
              setCreateOpen(true)
            }}
          >
            Tạo hồ sơ mới
          </ActionButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase">Tổng hồ sơ</p>
              <p className="text-2xl font-bold text-slate-800">{dossiers.length}</p>
            </div>
            <FolderKanban className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-800 font-medium uppercase">Chờ phê duyệt</p>
              <p className="text-2xl font-bold text-amber-900">
                {dossiers.filter((d) => d.status.startsWith("Chờ")).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-800 font-medium uppercase">Yêu cầu bổ sung</p>
              <p className="text-2xl font-bold text-orange-900">
                {dossiers.filter((d) => d.status === "Yêu cầu bổ sung").length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-medium uppercase">Đã phê duyệt</p>
              <p className="text-2xl font-bold text-emerald-900">
                {dossiers.filter((d) => d.status === "Đã phê duyệt").length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="rounded-xl border bg-card p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã hồ sơ, tên hồ sơ, người lập..."
              className="bg-white pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SelectField
              label=""
              options={[
                { value: "all", label: "Tất cả đơn vị" },
                ...DEPARTMENTS_LIST.map((dep) => ({ value: dep, label: dep })),
              ]}
              value={deptFilter}
              onValueChange={setDeptFilter}
              triggerClassName="w-48 bg-white"
            />

            <SelectField
              label=""
              options={[
                { value: "all", label: "Tất cả loại hồ sơ" },
                ...DOSSIER_TYPES.map((t) => ({ value: t, label: t })),
              ]}
              value={typeFilter}
              onValueChange={setTypeFilter}
              triggerClassName="w-44 bg-white"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-slate-100 p-1">
            <TabsTrigger value="all">Tất cả ({dossiers.length})</TabsTrigger>
            <TabsTrigger value="Dự thảo">Dự thảo ({dossiers.filter((d) => d.status === "Dự thảo").length})</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt ({dossiers.filter((d) => d.status.startsWith("Chờ")).length})</TabsTrigger>
            <TabsTrigger value="Yêu cầu bổ sung">Bổ sung ({dossiers.filter((d) => d.status === "Yêu cầu bổ sung").length})</TabsTrigger>
            <TabsTrigger value="Đã phê duyệt">Đã duyệt ({dossiers.filter((d) => d.status === "Đã phê duyệt").length})</TabsTrigger>
            <TabsTrigger value="Bị từ chối">Từ chối ({dossiers.filter((d) => d.status === "Bị từ chối").length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Data Table */}
      <PaginatedDataTable
        data={filteredDossiers}
        columns={columns}
        rowKey={(item) => item.id}
        emptyMessage="Không tìm thấy hồ sơ nào phù hợp."
        minTableWidth="1350px"
        stickyLastColumn
      />

      {/* ==================================================================== */}
      {/* MODAL: Xem chi tiết Hồ sơ */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-brand-blue">
              <FolderKanban className="h-5 w-5" />
              Chi tiết Hồ sơ - {detailItem?.code}
            </DialogTitle>
          </DialogHeader>

          {detailItem && (
            <Tabs defaultValue="info" className="w-full mt-2">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Thông tin chung</TabsTrigger>
                <TabsTrigger value="attachments">Tài liệu ({detailItem.attachments.length})</TabsTrigger>
                <TabsTrigger value="workflow">Quy trình phê duyệt</TabsTrigger>
                <TabsTrigger value="history">Lịch sử xử lý ({detailItem.processHistory.length})</TabsTrigger>
              </TabsList>

              {/* Tab 1: Thông tin chung */}
              <TabsContent value="info" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm border">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Mã hồ sơ</span>
                    <p className="font-bold text-brand-blue text-base">{detailItem.code}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Loại hồ sơ</span>
                    <p className="font-semibold">{detailItem.dossierType}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Đơn vị lập</span>
                    <p className="font-semibold text-slate-800">{detailItem.department}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Người lập</span>
                    <p>{detailItem.creatorName}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Ngày tạo</span>
                    <p>{detailItem.createdDate}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Hạn xử lý</span>
                    <p className="font-semibold text-rose-600">{detailItem.dueDate || "Chưa ấn định"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Bước phê duyệt hiện tại</span>
                    <p className="font-bold text-purple-700">{detailItem.currentStep}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase block">Trạng thái hồ sơ</span>
                    <div>{getDossierStatusBadge(detailItem.status)}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Tên hồ sơ / Mục tiêu</span>
                  <div className="p-3 bg-white border rounded-md text-sm font-semibold text-slate-800">
                    {detailItem.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Nội dung tóm tắt đề xuất</span>
                  <div className="p-3 bg-white border rounded-md text-sm leading-relaxed text-slate-700">
                    {detailItem.summary}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Tài liệu đính kèm */}
              <TabsContent value="attachments" className="space-y-3 pt-3">
                {detailItem.attachments.length === 0 ? (
                  <p className="text-sm text-center py-6 text-muted-foreground">Chưa có tài liệu đính kèm.</p>
                ) : (
                  <div className="space-y-2">
                    {detailItem.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-5 w-5 text-brand-blue" />
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
                )}
              </TabsContent>

              {/* Tab 3: Quy trình phê duyệt */}
              <TabsContent value="workflow" className="space-y-4 pt-3">
                <h4 className="font-semibold text-sm text-slate-900">Sơ đồ luồng phê duyệt hồ sơ:</h4>
                <div className="space-y-3">
                  {detailItem.workflowSteps.map((step, idx) => (
                    <div
                      key={step.stepNumber}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        step.status === "completed"
                          ? "bg-emerald-50 border-emerald-200"
                          : step.status === "current"
                          ? "bg-purple-50 border-purple-300 ring-2 ring-purple-400"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                            step.status === "completed"
                              ? "bg-emerald-600 text-white"
                              : step.status === "current"
                              ? "bg-purple-600 text-white"
                              : "bg-slate-300 text-slate-700"
                          }`}
                        >
                          {step.stepNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{step.stepName}</p>
                          <p className="text-xs text-muted-foreground">
                            Vai trò: <strong className="text-slate-700">{step.roleName}</strong> • {step.assigneeName}
                          </p>
                        </div>
                      </div>

                      <div>
                        {step.status === "completed" && (
                          <Badge className="bg-emerald-600 text-white">Đã hoàn thành</Badge>
                        )}
                        {step.status === "current" && (
                          <Badge className="bg-purple-600 text-white animate-pulse">Đang xử lý</Badge>
                        )}
                        {step.status === "pending" && <Badge variant="outline">Chờ tới lượt</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 4: Lịch sử xử lý */}
              <TabsContent value="history" className="space-y-3 pt-3">
                <div className="relative border-l-2 border-purple-200 ml-4 space-y-6 pl-4 py-2">
                  {detailItem.processHistory.map((log) => (
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
            {detailItem && (detailItem.status === "Dự thảo" || detailItem.status === "Yêu cầu bổ sung") && (
              <Button
                variant="default"
                className="bg-brand-blue"
                onClick={() => {
                  setSubmitItem(detailItem)
                  setDetailItem(null)
                }}
              >
                <Send className="h-4 w-4 mr-1.5" /> Gửi phê duyệt ngay
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailItem(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Gửi phê duyệt hồ sơ */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(submitItem)} onOpenChange={(open) => !open && setSubmitItem(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-blue">
              <Send className="h-5 w-5" />
              Gửi phê duyệt Hồ sơ - {submitItem?.code}
            </DialogTitle>
          </DialogHeader>

          {submitItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="font-semibold text-blue-900 line-clamp-2">{submitItem.name}</p>
                <p className="text-xs text-blue-700 mt-1">Đơn vị trình: {submitItem.department}</p>
              </div>

              <div>
                <Label className="mb-1.5 block font-semibold">Ý kiến / Ghi chú gửi trình duyệt</Label>
                <TextareaField
                  rows={3}
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  placeholder="Nhập ghi chú đề nghị phê duyệt..."
                  className="bg-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitItem(null)}>
              Hủy
            </Button>
            <ActionButton onClick={handleSubmitApprovalAction} disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Xác nhận gửi phê duyệt"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* MODAL: Tạo hồ sơ mới / Sửa hồ sơ */}
      {/* ==================================================================== */}
      <Dialog
        open={createOpen || Boolean(editItem)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false)
            setEditItem(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-blue">
              {editItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editItem ? `Chỉnh sửa Hồ sơ - ${editItem.code}` : "Tạo Hồ sơ mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block font-semibold">Mã hồ sơ (*)</Label>
                <Input
                  value={editItem ? editForm.code : createForm.code}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editItem) setEditForm((prev) => ({ ...prev, code: val }))
                    else setCreateForm((prev) => ({ ...prev, code: val }))
                  }}
                  className="bg-white font-semibold"
                />
              </div>

              <SelectField
                label="Loại hồ sơ (*)"
                options={DOSSIER_TYPES.map((t) => ({ value: t, label: t }))}
                value={editItem ? editForm.dossierType : createForm.dossierType}
                onValueChange={(val) => {
                  if (editItem) setEditForm((prev) => ({ ...prev, dossierType: val as any }))
                  else setCreateForm((prev) => ({ ...prev, dossierType: val as any }))
                }}
                triggerClassName="bg-white"
              />
            </div>

            <div>
              <Label className="mb-1.5 block font-semibold">Tên hồ sơ (*)</Label>
              <Input
                value={editItem ? editForm.name : createForm.name}
                onChange={(e) => {
                  const val = e.target.value
                  if (editItem) setEditForm((prev) => ({ ...prev, name: val }))
                  else setCreateForm((prev) => ({ ...prev, name: val }))
                }}
                placeholder="Ví dụ: Hồ sơ đề nghị mua sắm máy đo từ phổ gamma"
                className="bg-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Đơn vị lập (*)"
                options={DEPARTMENTS_LIST.map((d) => ({ value: d, label: d }))}
                value={editItem ? editForm.department : createForm.department}
                onValueChange={(val) => {
                  if (editItem) setEditForm((prev) => ({ ...prev, department: val }))
                  else setCreateForm((prev) => ({ ...prev, department: val }))
                }}
                triggerClassName="bg-white"
              />

              <div>
                <Label className="mb-1.5 block font-semibold">Người lập (*)</Label>
                <Input
                  value={editItem ? editForm.creatorName : createForm.creatorName}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editItem) setEditForm((prev) => ({ ...prev, creatorName: val }))
                    else setCreateForm((prev) => ({ ...prev, creatorName: val }))
                  }}
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block font-semibold">Nội dung tóm tắt đề xuất (*)</Label>
              <TextareaField
                rows={3}
                value={editItem ? editForm.summary : createForm.summary}
                onChange={(e) => {
                  const val = e.target.value
                  if (editItem) setEditForm((prev) => ({ ...prev, summary: val }))
                  else setCreateForm((prev) => ({ ...prev, summary: val }))
                }}
                placeholder="Mô tả nội dung, mục tiêu đề xuất của hồ sơ..."
                className="bg-white"
              />
            </div>

            <div>
              <Label className="mb-1.5 block font-semibold">Hạn xử lý (*)</Label>
              <Input
                type="date"
                value={editItem ? editForm.dueDate || "" : createForm.dueDate || ""}
                onChange={(e) => {
                  const val = e.target.value
                  if (editItem) setEditForm((prev) => ({ ...prev, dueDate: val }))
                  else setCreateForm((prev) => ({ ...prev, dueDate: val }))
                }}
                className="bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false)
                setEditItem(null)
              }}
            >
              Hủy
            </Button>
            <ActionButton
              onClick={editItem ? handleEditSubmit : handleCreateSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : editItem ? "Cập nhật hồ sơ" : "Tạo hồ sơ mới"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
