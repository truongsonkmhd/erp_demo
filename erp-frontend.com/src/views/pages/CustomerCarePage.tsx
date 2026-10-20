import { useMemo, useState } from "react"
import { Edit, Eye, MoreVertical, Plus, Trash2 } from "lucide-react"

import { ActionButton } from "@/components/ui/action-button"
import { appToast } from "@/components/ui/app-toast"
import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SelectField, TextareaField } from "@/components/ui/form-fields"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { CARE_PROGRESS_OPTIONS } from "@/constants/customerCare"
import { useCustomerCare } from "@/hooks/customer-care/useCustomerCare"
import { addCustomerCareRecord, deleteCustomerCareRecord, updateCustomerCareRecord } from "@/services/CustomerCareService"
import { CustomerCare, CustomerCareInput } from "@/types/customerCare"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"

const EMPTY_FORM: CustomerCareInput = {
  careProgress: "",
  careProgressNote: "",
  hasIssue: false,
  issueNote: "",
}

interface CustomerCarePageProps {
  projectId: string
  customerName: string
}

export default function CustomerCarePage({ projectId, customerName }: CustomerCarePageProps) {
  const { user } = useAuth()
  const { records, isLoading, refetch } = useCustomerCare(projectId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notifyLeaderOpen, setNotifyLeaderOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<CustomerCare | null>(null)
  const [detailRecord, setDetailRecord] = useState<CustomerCare | null>(null)
  const [editingRecord, setEditingRecord] = useState<CustomerCare | null>(null)
  const [formData, setFormData] = useState<CustomerCareInput>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerCareInput, string>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const openCreateDialog = () => {
    setEditingRecord(null)
    setFormData(EMPTY_FORM)
    setErrors({})
    setSaveError("")
    setDialogOpen(true)
  }

  const openEditDialog = (record: CustomerCare) => {
    setEditingRecord(record)
    setFormData({
      careProgress: record.careProgress,
      careProgressNote: record.careProgressNote,
      hasIssue: record.hasIssue ?? false,
      issueNote: record.issueNote ?? "",
    })
    setErrors({})
    setSaveError("")
    setDialogOpen(true)
  }

  const usedProgresses = useMemo(
    () => new Set(records.map((record) => record.careProgress).filter(Boolean)),
    [records],
  )

  const unusedProgressOptions = useMemo(
    () => CARE_PROGRESS_OPTIONS.filter((option) => !usedProgresses.has(option)),
    [usedProgresses],
  )

  const availableProgressOptions = useMemo(
    () =>
      CARE_PROGRESS_OPTIONS.map((option) => {
        const isUsed = usedProgresses.has(option) && option !== editingRecord?.careProgress
        return {
          label: isUsed ? `${option} (Đã tạo)` : option,
          value: option,
          disabled: isUsed,
        }
      }),
    [editingRecord?.careProgress, usedProgresses],
  )

  const saveRecord = async () => {
    if (!can(user, `projects-marketing:${editingRecord ? "update" : "create"}`)) return
    const nextErrors: typeof errors = {}
    if (!formData.careProgress) nextErrors.careProgress = "Vui lòng chọn tiến trình chăm sóc"
    if (!formData.careProgressNote.trim()) nextErrors.careProgressNote = "Vui lòng nhập ghi chú chăm sóc"
    const isDuplicateProgress = records.some(
      (record) =>
        record.careProgress === formData.careProgress && record.id !== editingRecord?.id,
    )
    if (isDuplicateProgress) nextErrors.careProgress = "Tiến trình này đã được chọn, vui lòng chọn tiến trình khác"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    setSaveError("")
    try {
      if (editingRecord) await updateCustomerCareRecord(editingRecord.id, formData)
      else await addCustomerCareRecord(formData, projectId, customerName)
      setNotifyLeaderOpen(true)
      void refetch({ silent: true })
    } catch (error) {
      console.error("Không thể lưu chăm sóc khách hàng:", error)
      setSaveError("Không thể lưu dữ liệu. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  const removeRecord = async () => {
    if (!can(user, "projects-marketing:delete")) return
    if (!recordToDelete) return
    try {
      await deleteCustomerCareRecord(recordToDelete.id)
      await refetch()
      appToast.success("Xóa thành công", "Tiến trình chăm sóc đã được xóa.")
    } catch (error) {
      console.error("Không thể xóa tiến trình chăm sóc:", error)
      appToast.error("Không thể xóa", "Vui lòng thử lại sau.")
    } finally {
      setRecordToDelete(null)
    }
  }

  const columns: DataTableColumn<CustomerCare>[] = [
    { key: "index", header: "STT", headClassName: "w-16 min-w-16 text-center", cellClassName: "w-16 min-w-16 text-center", render: (_, index) => index + 1 },
    {
      key: "progress",
      header: "Tiến trình chăm sóc",
      headClassName: "min-w-96",
      render: (item) => {
        const isL4 = item.careProgress?.includes("L4")
        return (
          <span className={isL4 ? "text-red-600 font-bold" : ""}>
            {item.careProgress}
          </span>
        )
      },
    },
    { key: "note", header: "Ghi chú chăm sóc", headClassName: "min-w-[32rem]", cellClassName: "whitespace-normal", render: (item) => item.careProgressNote },
    { key: "updatedAt", header: "Cập nhật lần cuối", headClassName: "min-w-48", render: (item) => new Date(item.updatedAt).toLocaleString("vi-VN") },
    {
      key: "actions", header: "Hành động", headClassName: "w-28 min-w-28 text-center", cellClassName: "w-28 min-w-28 text-center",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Mở menu hành động">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetailRecord(item)}><Eye className="mr-2 h-4 w-4" />Xem chi tiết</DropdownMenuItem>
            {can(user, "projects-marketing:update") && <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="mr-2 h-4 w-4" />Chỉnh sửa</DropdownMenuItem>}
            {can(user, "projects-marketing:delete") && <DropdownMenuItem className="text-destructive" onClick={() => setRecordToDelete(item)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col">
      {isLoading && <BoatLoading fullScreen label="Đang tải tiến trình chăm sóc" />}
      <div className="z-10 flex shrink-0 min-w-0 flex-col gap-3 bg-background pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold sm:text-3xl">Chăm sóc khách hàng</h1><p className="mt-1 text-muted-foreground">{customerName}</p></div>
        {can(user, "projects-marketing:create") && <ActionButton
          icon={<Plus />}
          onClick={openCreateDialog}
          disabled={!projectId || unusedProgressOptions.length === 0}
        >
          Thêm mới
        </ActionButton>}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <PaginatedDataTable data={records} columns={columns} rowKey={(item) => item.id} defaultPageSize={10} minTableWidth="1450px" bordered={false} stickyFirstColumn stickyLastColumn />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingRecord ? "Cập nhật chăm sóc khách hàng" : "Thêm chăm sóc khách hàng"}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <SelectField label="Tiến trình chăm sóc" required searchable clearable options={availableProgressOptions} value={formData.careProgress} onValueChange={(value) => setFormData((current) => ({ ...current, careProgress: value }))} error={errors.careProgress} triggerClassName="bg-white" />
            <TextareaField label="Ghi chú chăm sóc" required rows={5} value={formData.careProgressNote} onChange={(event) => setFormData((current) => ({ ...current, careProgressNote: event.target.value }))} error={errors.careProgressNote} className="bg-white" />
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button><ActionButton onClick={saveRecord} disabled={isSaving}>{isSaving ? "Đang lưu..." : "Lưu lại"}</ActionButton></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailRecord)} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết chăm sóc khách hàng</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="grid gap-5 py-2 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{detailRecord.customerName || customerName || "—"}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Tiến trình chăm sóc</p>
                <p className={`font-medium ${detailRecord.careProgress?.includes("L4") ? "text-red-600 font-bold" : ""}`}>
                  {detailRecord.careProgress || "—"}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Ghi chú chăm sóc</p>
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3">
                  {detailRecord.careProgressNote || "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <p className="font-medium">{new Date(detailRecord.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                <p className="font-medium">{new Date(detailRecord.updatedAt).toLocaleString("vi-VN")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailRecord(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={notifyLeaderOpen}
        title="Xác nhận"
        description="Bạn có muốn thông báo đến leader không?"
        confirmLabel="Đồng ý"
        onOpenChange={(open) => {
          setNotifyLeaderOpen(open)
          if (!open) setDialogOpen(false)
        }}
        onConfirm={() => {
          setNotifyLeaderOpen(false)
          setDialogOpen(false)
          window.setTimeout(() => {
            appToast.success("Thông báo", "Đã thông báo đến leader thành công.")
          }, 150)
        }}
      />

      <ConfirmationDialog
        open={Boolean(recordToDelete)}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa tiến trình chăm sóc này không?"
        confirmLabel="Xóa"
        variant="destructive"
        onOpenChange={(open) => !open && setRecordToDelete(null)}
        onConfirm={removeRecord}
      />
    </div>
  )
}
