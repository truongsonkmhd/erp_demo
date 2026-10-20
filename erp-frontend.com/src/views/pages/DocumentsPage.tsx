import { useMemo, useState } from "react"
import { Download, FileText, Plus, Search } from "lucide-react"

import { ActionButton } from "@/components/ui/action-button"
import { appToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { SelectField, TextareaField } from "@/components/ui/form-fields"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompanyDocuments } from "@/hooks/useCompanyDocuments"
import {
  addCompanyDocument,
  deleteCompanyDocument,
  updateCompanyDocument,
  uploadCompanyDocumentFile,
} from "@/services/CompanyDocumentService"
import { COMPANY_DOCUMENT_CATEGORIES, CompanyDocument, CompanyDocumentInput } from "@/types/companyDocument"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"

const EMPTY_FORM: CompanyDocumentInput = {
  name: "",
  category: "Hợp đồng",
  department: "",
  description: "",
  fileName: "",
  fileUrl: "",
  fileType: "",
  fileSize: 0,
  uploadedBy: "",
}

function formatFileSize(bytes: number) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const { documents, isLoading, refetch } = useCompanyDocuments()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyDocument | null>(null)
  const [form, setForm] = useState<CompanyDocumentInput>(EMPTY_FORM)
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [removing, setRemoving] = useState<CompanyDocument | null>(null)

  const filtered = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    return documents.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false
      if (!query) return true
      return (
        item.name.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query) ||
        item.uploadedBy.toLowerCase().includes(query) ||
        item.fileName.toLowerCase().includes(query)
      )
    })
  }, [documents, searchTerm, categoryFilter])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFile(null)
    setDialogOpen(true)
  }

  const openEdit = (item: CompanyDocument) => {
    setEditing(item)
    setForm({
      name: item.name,
      category: item.category,
      department: item.department,
      description: item.description,
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      fileSize: item.fileSize,
      uploadedBy: item.uploadedBy,
    })
    setFile(null)
    setDialogOpen(true)
  }

  const saveDocument = async () => {
    if (!can(user, `documents:${editing ? "update" : "create"}`)) return
    if (!form.name.trim()) {
      appToast.error("Thiếu thông tin", "Vui lòng nhập tên tài liệu.")
      return
    }
    if (!editing && !file) {
      appToast.error("Thiếu tệp", "Vui lòng chọn tệp tài liệu.")
      return
    }

    setIsSaving(true)
    try {
      let fileMeta = {
        fileName: form.fileName,
        fileUrl: form.fileUrl,
        fileType: form.fileType,
        fileSize: form.fileSize,
      }
      if (file) {
        fileMeta = await uploadCompanyDocumentFile(file)
      }
      const payload: CompanyDocumentInput = {
        ...form,
        ...fileMeta,
        name: form.name.trim(),
        uploadedBy: form.uploadedBy.trim() || "Quản trị",
      }
      if (editing) await updateCompanyDocument(editing.id, payload)
      else await addCompanyDocument(payload)
      await refetch({ silent: true })
      setDialogOpen(false)
      appToast.success(editing ? "Đã cập nhật tài liệu" : "Đã thêm tài liệu")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể lưu tài liệu", "Kiểm tra kết nối hoặc quyền tải tệp lên.")
    } finally {
      setIsSaving(false)
    }
  }

  const columns: DataTableColumn<CompanyDocument>[] = [
    { key: "index", header: "STT", headClassName: "w-14 min-w-14 text-center", cellClassName: "text-center", render: (_, index) => index + 1 },
    {
      key: "name",
      header: "Tên tài liệu",
      headClassName: "min-w-56",
      cellClassName: "font-medium",
      render: (item) => (
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" />
          <span>{item.name}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Loại",
      headClassName: "min-w-40",
      render: (item) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
          {item.category}
        </Badge>
      ),
    },
    { key: "department", header: "Phòng ban", headClassName: "min-w-40", render: (item) => item.department || "—" },
    { key: "file", header: "Tệp", headClassName: "min-w-44", render: (item) => item.fileName || "—" },
    { key: "size", header: "Dung lượng", headClassName: "min-w-28", render: (item) => formatFileSize(item.fileSize) },
    { key: "uploadedBy", header: "Người tạo", headClassName: "min-w-36", render: (item) => item.uploadedBy || "—" },
    {
      key: "createdAt",
      header: "Ngày tạo",
      headClassName: "min-w-40",
      render: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—"),
    },
    {
      key: "actions",
      header: "Hành động",
      headClassName: "w-56 min-w-56 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex justify-center gap-1">
          {item.fileUrl && (
            <Button size="sm" variant="outline" className="h-8" asChild>
              <a href={item.fileUrl} target="_blank" rel="noreferrer">
                <Download className="mr-1 h-3.5 w-3.5" />
                Tải
              </a>
            </Button>
          )}
          {can(user, "documents:update") && <Button size="sm" variant="outline" className="h-8" onClick={() => openEdit(item)}>Sửa</Button>}
          {can(user, "documents:delete") && <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => setRemoving(item)}>Xóa</Button>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 px-3 sm:px-0">
      {isLoading && <BoatLoading fullScreen label="Đang tải tài liệu công ty" />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Quản lý tài liệu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lưu trữ và theo dõi tài liệu nội bộ của công ty.
          </p>
        </div>
        {can(user, "documents:create") && <ActionButton icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Thêm tài liệu
        </ActionButton>}
      </div>

      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="gap-2 bg-transparent p-0">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          {COMPANY_DOCUMENT_CATEGORIES.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={categoryFilter} className="mt-5 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên, phòng ban, người tạo..."
              className="bg-white pl-9"
            />
          </div>

          <PaginatedDataTable
            data={filtered}
            columns={columns}
            rowKey={(item) => item.id}
            emptyMessage="Chưa có tài liệu. Hãy thêm tài liệu mới."
            minTableWidth="1400px"
            bordered={false}
            stickyLastColumn
          />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật tài liệu" : "Thêm tài liệu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Tên tài liệu</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ví dụ: Nội quy lao động 2026" className="bg-white" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Loại tài liệu"
                options={COMPANY_DOCUMENT_CATEGORIES.map((item) => ({ value: item, label: item }))}
                value={form.category}
                onValueChange={(value) => setForm((current) => ({ ...current, category: value }))}
                triggerClassName="bg-white"
              />
              <div>
                <Label className="mb-1.5 block">Phòng ban</Label>
                <Input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} placeholder="HCNS, Kế toán..." className="bg-white" />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Người tạo / phụ trách</Label>
              <Input value={form.uploadedBy} onChange={(event) => setForm((current) => ({ ...current, uploadedBy: event.target.value }))} placeholder="Họ tên người upload" className="bg-white" />
            </div>
            <div>
              <Label className="mb-1.5 block">{editing ? "Thay tệp (không bắt buộc)" : "Tệp tài liệu"}</Label>
              <Input
                type="file"
                className="bg-white"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null
                  setFile(nextFile)
                  if (nextFile && !form.name) setForm((current) => ({ ...current, name: nextFile.name.replace(/\.[^.]+$/, "") }))
                }}
              />
              {(file || form.fileName) && (
                <p className="mt-1 text-xs text-muted-foreground">{file?.name || form.fileName}</p>
              )}
            </div>
            <TextareaField
              label="Ghi chú"
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="bg-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <ActionButton onClick={() => void saveDocument()} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm tài liệu"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(removing)}
        title="Xác nhận xóa"
        description={`Xóa tài liệu "${removing?.name || ""}"?`}
        confirmLabel="Xóa"
        variant="destructive"
        onOpenChange={(open) => !open && setRemoving(null)}
        onConfirm={() => {
          if (!removing) return
          if (!can(user, "documents:delete")) return
          void deleteCompanyDocument(removing.id, removing.fileUrl)
            .then(async () => {
              await refetch({ silent: true })
              appToast.success("Đã xóa tài liệu")
            })
            .catch(() => appToast.error("Không thể xóa tài liệu"))
            .finally(() => setRemoving(null))
        }}
      />
    </div>
  )
}
