import React, { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Building2,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  PackagePlus,
  Plus,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/services/auth/AuthContext"

import {
  PurchaseContractRepository,
  PurchaseRequestRepository,
  SupplierRepository,
} from "../repositories/procurement.storage"
import type {
  PurchaseContract,
  PurchaseRequest,
  Supplier,
} from "../types/procurement.types"

import { PurchaseRequestListTab } from "../components/PurchaseRequestListTab"
import { PurchaseRequestFormDrawer } from "../components/PurchaseRequestFormDrawer"
import { PurchaseRequestDetailModal } from "../components/PurchaseRequestDetailModal"
import { PendingApprovalTab } from "../components/PendingApprovalTab"
import { ApprovalActionModal } from "../components/ApprovalActionModal"
import { SupplierListTab } from "../components/SupplierListTab"
import { SupplierFormDrawer } from "../components/SupplierFormDrawer"
import { SupplierDetailModal } from "../components/SupplierDetailModal"
import { PurchaseContractListTab } from "../components/PurchaseContractListTab"
import { PurchaseContractFormDrawer } from "../components/PurchaseContractFormDrawer"
import { PurchaseContractDetailModal } from "../components/PurchaseContractDetailModal"

export default function ProcurementPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "requests"

  // Data states
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [contracts, setContracts] = useState<PurchaseContract[]>([])

  // Modal / Drawer states
  const [requestFormOpen, setRequestFormOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)
  const [detailRequest, setDetailRequest] = useState<PurchaseRequest | null>(null)

  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [approvalTargetRequest, setApprovalTargetRequest] = useState<PurchaseRequest | null>(null)
  const [approvalActionType, setApprovalActionType] = useState<"approve" | "request_revision" | "reject" | null>(null)

  const [supplierFormOpen, setSupplierFormOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null)

  const [contractFormOpen, setContractFormOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<PurchaseContract | null>(null)
  const [detailContract, setDetailContract] = useState<PurchaseContract | null>(null)

  // Load data từ storage
  const reloadData = () => {
    setRequests(PurchaseRequestRepository.list())
    setSuppliers(SupplierRepository.list())
    setContracts(PurchaseContractRepository.list())
  }

  useEffect(() => {
    reloadData()
  }, [])

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  // Đếm hồ sơ chờ duyệt
  const pendingCount = useMemo(() => {
    return requests.filter(
      (r) =>
        r.status === "pending_dept" ||
        r.status === "pending_planning" ||
        r.status === "pending_leader"
    ).length
  }, [requests])

  // Lọc đề xuất đã duyệt để tạo HĐ
  const approvedRequests = useMemo(() => {
    return requests.filter((r) => r.status === "approved" || r.status === "ordered")
  }, [requests])

  // Lọc NCC đang hợp tác
  const activeSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.status === "active")
  }, [suppliers])

  // Handlers cho PurchaseRequest
  const handleOpenCreateRequest = () => {
    setEditingRequest(null)
    setRequestFormOpen(true)
  }

  const handleOpenEditRequest = (req: PurchaseRequest) => {
    setEditingRequest(req)
    setRequestFormOpen(true)
  }

  const handleOpenDetailRequest = (req: PurchaseRequest) => {
    setDetailRequest(req)
  }

  const handleRecallRequest = (req: PurchaseRequest) => {
    const updated: PurchaseRequest = {
      ...req,
      status: "draft",
      approvalHistory: [
        ...(req.approvalHistory || []),
        {
          id: `wf-${Date.now()}`,
          stepName: "Thu hồi đề xuất",
          actorName: user?.fullName || "Người đề xuất",
          actorRole: user?.role || "Cán bộ đề xuất",
          action: "cancel",
          actionName: "Thu hồi về bản nháp",
          comment: "Thu hồi để rà soát chỉnh sửa thông tin",
          timestamp: new Date().toISOString(),
          previousStatus: req.status,
          newStatus: "draft",
        },
      ],
      updatedAt: new Date().toISOString(),
    }
    PurchaseRequestRepository.save(updated)
    reloadData()
  }

  const handleDeleteRequest = (req: PurchaseRequest) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bản nháp đề xuất ${req.code}?`)) {
      PurchaseRequestRepository.remove(req.id)
      reloadData()
    }
  }

  // Handlers cho Approval
  const handleOpenApprovalModal = (
    req: PurchaseRequest,
    action: "approve" | "request_revision" | "reject"
  ) => {
    setApprovalTargetRequest(req)
    setApprovalActionType(action)
    setApprovalModalOpen(true)
  }

  // Handlers cho Supplier
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null)
    setSupplierFormOpen(true)
  }

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup)
    setSupplierFormOpen(true)
  }

  const handleOpenDetailSupplier = (sup: Supplier) => {
    setDetailSupplier(sup)
  }

  const handleDeleteSupplier = (sup: Supplier) => {
    if (sup.contractCount > 0) {
      alert("Không thể xóa nhà cung cấp đã có hợp đồng kinh tế phát sinh!")
      return
    }
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp ${sup.name}?`)) {
      SupplierRepository.remove(sup.id)
      reloadData()
    }
  }

  // Handlers cho Contract
  const handleOpenCreateContract = () => {
    setEditingContract(null)
    setContractFormOpen(true)
  }

  const handleOpenEditContract = (ct: PurchaseContract) => {
    setEditingContract(ct)
    setContractFormOpen(true)
  }

  const handleOpenDetailContract = (ct: PurchaseContract) => {
    setDetailContract(ct)
  }

  const handleDeleteContract = (ct: PurchaseContract) => {
    if (confirm(`Bạn có chắc chắn muốn xóa hợp đồng ${ct.contractNumber}?`)) {
      PurchaseContractRepository.remove(ct.id)
      reloadData()
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[1680px] mx-auto animate-in fade-in-50 duration-200">
      {/* 1. Header Trang & Phân hệ Sub-navigation Tabs (Chuẩn Menu 06) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Mua sắm vật tư & thiết bị
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị toàn bộ chu trình đề xuất nhu cầu, kiểm tra dự toán, phê duyệt workflow nhiều cấp, hồ sơ nhà cung cấp và hợp đồng kinh tế.
          </p>
        </div>

        {/* Thanh chuyển đổi phân hệ con Tabs ở bên phải Header giống Menu 06 */}
        <div className="flex items-center shrink-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/50 grid grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger
                value="requests"
                className="text-xs font-medium gap-1.5 rounded-lg px-3 py-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Đề nghị mua sắm</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-semibold">
                  {requests.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="approvals"
                className="text-xs font-medium gap-1.5 rounded-lg px-3 py-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Chờ phê duyệt</span>
                {pendingCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="suppliers"
                className="text-xs font-medium gap-1.5 rounded-lg px-3 py-1.5"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Nhà cung cấp</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-muted-foreground/20 text-muted-foreground font-semibold">
                  {suppliers.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="text-xs font-medium gap-1.5 rounded-lg px-3 py-1.5"
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Hợp đồng</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-muted-foreground/20 text-muted-foreground font-semibold">
                  {contracts.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 2. Nội dung các Tabs (Chuẩn Menu 06) */}
      {activeTab === "requests" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <PurchaseRequestListTab
            requests={requests}
            onOpenCreate={handleOpenCreateRequest}
            onOpenEdit={handleOpenEditRequest}
            onOpenDetail={handleOpenDetailRequest}
            onRecall={handleRecallRequest}
            onDelete={handleDeleteRequest}
            onReload={reloadData}
          />
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <PendingApprovalTab
            requests={requests}
            onOpenDetail={handleOpenDetailRequest}
            onOpenApprovalModal={handleOpenApprovalModal}
            onReload={reloadData}
          />
        </div>
      )}

      {activeTab === "suppliers" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <SupplierListTab
            suppliers={suppliers}
            onOpenCreate={handleOpenCreateSupplier}
            onOpenEdit={handleOpenEditSupplier}
            onOpenDetail={handleOpenDetailSupplier}
            onDelete={handleDeleteSupplier}
            onReload={reloadData}
          />
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <PurchaseContractListTab
            contracts={contracts}
            onOpenCreate={handleOpenCreateContract}
            onOpenEdit={handleOpenEditContract}
            onOpenDetail={handleOpenDetailContract}
            onDelete={handleDeleteContract}
            onReload={reloadData}
          />
        </div>
      )}

      {/* --- CÁC MODAL & DRAWER ĐIỀU HÀNH --- */}

      {/* Form tạo / sửa đề xuất */}
      <PurchaseRequestFormDrawer
        open={requestFormOpen}
        onOpenChange={setRequestFormOpen}
        requestToEdit={editingRequest}
        currentUser={{ fullName: user?.fullName, role: user?.roleName || user?.role }}
        onSaved={() => {
          reloadData()
        }}
      />

      {/* Modal chi tiết đề xuất */}
      <PurchaseRequestDetailModal
        open={Boolean(detailRequest)}
        onOpenChange={(op) => !op && setDetailRequest(null)}
        request={detailRequest}
        canApprove={true}
        onApproveAction={(req) => {
          setDetailRequest(null)
          handleOpenApprovalModal(req, "approve")
        }}
      />

      {/* Modal xử lý phê duyệt */}
      <ApprovalActionModal
        open={approvalModalOpen}
        onOpenChange={setApprovalModalOpen}
        request={approvalTargetRequest}
        actionType={approvalActionType}
        currentUser={{ fullName: user?.fullName, role: user?.roleName || user?.role }}
        onActionComplete={() => {
          reloadData()
        }}
      />

      {/* Form tạo / sửa Nhà cung cấp */}
      <SupplierFormDrawer
        open={supplierFormOpen}
        onOpenChange={setSupplierFormOpen}
        supplierToEdit={editingSupplier}
        onSaved={() => {
          reloadData()
        }}
      />

      {/* Modal chi tiết Nhà cung cấp */}
      <SupplierDetailModal
        open={Boolean(detailSupplier)}
        onOpenChange={(op) => !op && setDetailSupplier(null)}
        supplier={detailSupplier}
        onOpenEdit={handleOpenEditSupplier}
      />

      {/* Form tạo / sửa Hợp đồng */}
      <PurchaseContractFormDrawer
        open={contractFormOpen}
        onOpenChange={setContractFormOpen}
        contractToEdit={editingContract}
        approvedRequests={approvedRequests}
        activeSuppliers={activeSuppliers}
        onSaved={() => {
          reloadData()
        }}
      />

      {/* Modal chi tiết Hợp đồng */}
      <PurchaseContractDetailModal
        open={Boolean(detailContract)}
        onOpenChange={(op) => !op && setDetailContract(null)}
        contract={detailContract}
      />
    </div>
  )
}
