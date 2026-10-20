import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { FileCheck } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MaterialSettlementRepository } from "../repositories/settlement.storage"
import type { MaterialSettlement } from "../types/settlement.types"
import { SETTLEMENT_TABS, type SettlementTabId } from "../types/settlement.constants"
import { SettlementOverviewTab } from "../components/SettlementOverviewTab"
import { SettlementFormModal } from "../components/SettlementFormModal"
import { SettlementDetailModal } from "../components/SettlementDetailModal"
import { MaterialReturnModal } from "../components/MaterialReturnModal"
import { SettlementActionModal, type SettlementWorkflowAction } from "../components/SettlementActionModal"

export function MaterialSettlementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get("tab") as SettlementTabId
  const validTab: SettlementTabId = ["all", "pending", "processing", "completed"].includes(rawTab)
    ? rawTab
    : "all"

  const [currentTab, setCurrentTab] = useState<SettlementTabId>(validTab)
  const [settlements, setSettlements] = useState<MaterialSettlement[]>([])

  // State các Modal Dialog
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<MaterialSettlement | null>(null)
  
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<MaterialSettlement | null>(null)

  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnSettlement, setReturnSettlement] = useState<MaterialSettlement | null>(null)

  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionSettlement, setActionSettlement] = useState<MaterialSettlement | null>(null)
  const [workflowAction, setWorkflowAction] = useState<SettlementWorkflowAction | null>(null)

  const reloadData = () => {
    const list = MaterialSettlementRepository.list()
    setSettlements(list)
    // Cập nhật selectedSettlement nếu đang mở
    if (selectedSettlement) {
      const refreshed = list.find((s) => s.id === selectedSettlement.id) || null
      setSelectedSettlement(refreshed)
    }
  }

  useEffect(() => {
    reloadData()
  }, [])

  useEffect(() => {
    if (rawTab && ["all", "pending", "processing", "completed"].includes(rawTab)) {
      setCurrentTab(rawTab as SettlementTabId)
    }
  }, [rawTab])

  const handleTabChange = (val: string) => {
    const tabId = val as SettlementTabId
    setCurrentTab(tabId)
    setSearchParams({ tab: tabId })
  }

  // Đếm số lượng hồ sơ theo từng tab
  const tabCounts = {
    all: settlements.length,
    pending: settlements.filter(
      (s) => s.status === "draft" || s.status === "unit_confirmed" || s.status === "revision_requested"
    ).length,
    processing: settlements.filter(
      (s) => s.status === "accounting_reviewed" || s.status === "pending_approval"
    ).length,
    completed: settlements.filter(
      (s) => s.status === "approved" || s.status === "rejected"
    ).length,
  }

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setEditingSettlement(null)
    setCreateModalOpen(true)
  }

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (stl: MaterialSettlement) => {
    setEditingSettlement(stl)
    setCreateModalOpen(true)
  }

  // Mở modal chi tiết
  const handleViewDetail = (stl: MaterialSettlement) => {
    setSelectedSettlement(stl)
    setDetailModalOpen(true)
  }

  // Mở modal hoàn trả vật tư
  const handleOpenReturnModal = (stl: MaterialSettlement) => {
    setReturnSettlement(stl)
    setReturnModalOpen(true)
  }

  // Mở modal chuyển trạng thái
  const handleOpenActionModal = (stl: MaterialSettlement, action: SettlementWorkflowAction) => {
    setActionSettlement(stl)
    setWorkflowAction(action)
    setActionModalOpen(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 bg-background min-h-screen">
      {/* Page Header chuẩn Menu 06 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary shrink-0" />
              <span>Quyết toán vật tư & chi phí</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Tổng hợp khối lượng vật tư đã xuất theo từng nhiệm vụ, ghi nhận hoàn trả và quyết toán chi phí thực tế.
          </p>
        </div>

        {/* Thanh Tabs đặt bên phải Header chuẩn Menu 06 */}
        <div className="flex items-center">
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="h-9 p-1 bg-muted/60">
              {SETTLEMENT_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium flex items-center gap-1.5 transition-all"
                >
                  <span>{tab.label}</span>
                  <Badge
                    variant="secondary"
                    className="h-4.5 min-w-4 px-1 text-[10px] rounded-full border-0 font-mono"
                  >
                    {tabCounts[tab.id as keyof typeof tabCounts]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Nội dung danh sách hồ sơ quyết toán */}
      <SettlementOverviewTab
        settlements={settlements}
        currentTab={currentTab}
        onReload={reloadData}
        onOpenCreateModal={handleOpenCreateModal}
        onViewDetail={handleViewDetail}
        onOpenReturnModal={handleOpenReturnModal}
        onOpenActionModal={handleOpenActionModal}
      />

      {/* Modal Lập / Chỉnh sửa hồ sơ quyết toán */}
      <SettlementFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={reloadData}
        editingSettlement={editingSettlement}
      />

      {/* Modal Xem chi tiết hồ sơ quyết toán */}
      <SettlementDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        settlement={selectedSettlement}
        onOpenReturnModal={handleOpenReturnModal}
        onOpenActionModal={handleOpenActionModal}
        onOpenEditModal={handleOpenEditModal}
      />

      {/* Modal Hoàn trả vật tư */}
      <MaterialReturnModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        settlement={returnSettlement}
        onSuccess={reloadData}
      />

      {/* Modal Xử lý workflow quyết toán */}
      <SettlementActionModal
        open={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        settlement={actionSettlement}
        action={workflowAction}
        onSuccess={reloadData}
      />
    </div>
  )
}
