import React, { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Edit,
  Mail,
  Phone,
  UserX,
} from "lucide-react"

import { appToast } from "@/components/ui/app-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { can } from "@/lib/permissions"
import { useAuth } from "@/services/auth/AuthContext"
import { getDepartments, type Department } from "@/services/DepartmentService"
import { getEmployeeById } from "@/services/EmployeeService"
import { mergeToRecord } from "../adaptors/employee-profile.adaptor.ts"
import { EmployeeProfileModal } from "../components/EmployeeProfileModal"
import { EmployeeStatusBadge } from "../components/EmployeeStatusBadge"
import { GeneralInfoTab } from "../components/tabs/GeneralInfoTab"
import { JobContractTab } from "../components/tabs/JobContractTab"
import { ProfessionalTab } from "../components/tabs/ProfessionalTab"
import { WorkHistoryTimelineTab } from "../components/tabs/WorkHistoryTimelineTab"
import { EmployeeDevelopmentTab } from "../components/tabs/EmployeeDevelopmentTab"
import { defaultEmployeeProfileRepository } from "../repositories/employee-profile.storage.ts"
import type { EmployeeRecord, WorkHistoryItem } from "../types/employee-profile.types.ts"

export default function EmployeeProfileDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canUpdate = can(currentUser, "users:update")

  const [record, setRecord] = useState<EmployeeRecord | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasCopiedCode, setHasCopiedCode] = useState(false)

  const loadData = useCallback(async () => {
    if (!id) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setNotFound(false)
    try {
      const [account, depts] = await Promise.all([
        getEmployeeById(id),
        getDepartments().catch(() => [] as Department[]),
      ])

      const profile = defaultEmployeeProfileRepository.getByUserId(id)
      const merged = mergeToRecord(account, profile)
      setRecord(merged)
      setDepartments(depts)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setHasCopiedCode(true)
      appToast.success(`Đã sao chép mã cán bộ ${code}`)
      setTimeout(() => setHasCopiedCode(false), 2000)
    } catch {
      appToast.error("Không thể sao chép mã cán bộ")
    }
  }

  const handleUpdateHistory = (updatedHistory: WorkHistoryItem[]) => {
    if (!record || !id) return
    const currentProfile = defaultEmployeeProfileRepository.getByUserId(id)
    const newProfile = {
      ...(currentProfile || {
        userId: id,
        employeeCode: record.employeeCode,
        workStatus: record.workStatus,
        workHistory: [],
      }),
      workHistory: updatedHistory,
    }
    defaultEmployeeProfileRepository.save(newProfile)
    setRecord((prev) => (prev ? { ...prev, workHistory: updatedHistory } : null))
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <BoatLoading />
      </div>
    )
  }

  if (notFound || !record) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border border-border p-6 text-center rounded-xl shadow-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <UserX className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-1">Không tìm thấy hồ sơ cán bộ</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Mã định danh cán bộ không tồn tại trên hệ thống hoặc bạn không có quyền truy cập hồ sơ này.
          </p>
          <Button onClick={() => navigate("/nhan-su-tien-luong/ho-so-nhan-su")} size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay về danh sách hồ sơ</span>
          </Button>
        </Card>
      </div>
    )
  }

  const initials = record.fullName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "CB"

  return (
    <div className="flex-1 space-y-5 p-6 max-w-7xl mx-auto">
      {/* 1. Breadcrumbs Chuẩn ERP */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigate("/nhan-su-tien-luong")}
          className="hover:text-foreground transition-colors"
        >
          Quản lý nhân sự – tiền lương
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button
          type="button"
          onClick={() => navigate("/nhan-su-tien-luong/ho-so-nhan-su")}
          className="hover:text-foreground transition-colors"
        >
          Hồ sơ nhân sự
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground truncate max-w-xs">{record.fullName}</span>
      </nav>

      {/* 2. Profile Summary Card (Khung tổng quan cán bộ kiểu Web ERP) */}
      <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border-b border-border/40" />
        <CardContent className="px-6 pb-6 pt-0 -mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 rounded-xl border-4 border-background bg-primary/10 shadow-sm shrink-0">
                <AvatarFallback className="rounded-xl text-xl font-bold text-primary font-mono">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{record.fullName}</h1>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 font-mono text-xs font-semibold">
                    <span>{record.employeeCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(record.employeeCode)}
                      className="hover:text-foreground p-0.5"
                      title="Sao chép mã cán bộ"
                    >
                      {hasCopiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <EmployeeStatusBadge status={record.workStatus} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground font-medium">{record.position || "Chưa cập nhật vị trí"}</strong> • {record.department || "Chưa cập nhật đơn vị"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Mail className="h-3 w-3" />
                    <span>{record.email}</span>
                  </span>
                  {record.phone && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Phone className="h-3 w-3" />
                      <span>{record.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex items-center gap-2 mb-1 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/nhan-su-tien-luong/ho-so-nhan-su")}
                className="h-8 text-xs gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại</span>
              </Button>

              {canUpdate && (
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="h-8 text-xs gap-1.5 font-medium shadow-xs"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa (Popup)</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Phân vùng 5 Tabs nội dung */}
      <Tabs defaultValue="info" className="w-full space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-3xl">
          <TabsTrigger value="info" className="text-xs font-medium rounded-lg">
            Thông tin chung
          </TabsTrigger>
          <TabsTrigger value="job" className="text-xs font-medium rounded-lg">
            Công việc & Hợp đồng
          </TabsTrigger>
          <TabsTrigger value="qualification" className="text-xs font-medium rounded-lg">
            Chuyên môn
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs font-medium rounded-lg">
            Quá trình công tác
          </TabsTrigger>
          <TabsTrigger value="development" className="text-xs font-medium rounded-lg">
            Đào tạo & Khen thưởng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 focus-visible:outline-none">
          <GeneralInfoTab record={record} />
        </TabsContent>

        <TabsContent value="job" className="mt-4 focus-visible:outline-none">
          <JobContractTab record={record} />
        </TabsContent>

        <TabsContent value="qualification" className="mt-4 focus-visible:outline-none">
          <ProfessionalTab record={record} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 focus-visible:outline-none">
          <WorkHistoryTimelineTab
            record={record}
            onUpdateHistory={handleUpdateHistory}
            canEdit={canUpdate}
          />
        </TabsContent>

        <TabsContent value="development" className="mt-4 focus-visible:outline-none">
          <EmployeeDevelopmentTab record={record} />
        </TabsContent>
      </Tabs>

      {/* Popup Modal Chỉnh sửa hồ sơ cán bộ (Mở chính giữa màn hình dạng Dialog) */}
      {canUpdate && (
        <EmployeeProfileModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          mode="edit"
          initialRecord={record}
          existingProfiles={defaultEmployeeProfileRepository.getAll()}
          departments={departments}
          onSaved={() => void loadData()}
        />
      )}
    </div>
  )
}
