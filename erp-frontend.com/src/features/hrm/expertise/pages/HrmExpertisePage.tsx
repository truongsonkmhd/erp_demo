import React, { useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateProposalModal } from "../components/CreateProposalModal"
import { ExpertDetailModal } from "../components/ExpertDetailModal"
import { ExpertFormModal } from "../components/ExpertFormModal"
import { ExpertListTab } from "../components/ExpertListTab"
import { ExpertProposalTab } from "../components/ExpertProposalTab"
import { ExpertSearchTab } from "../components/ExpertSearchTab"
import { ProposalExportModal } from "../components/ProposalExportModal"
import { defaultHrmExpertRepository } from "../repositories/hrm-expert.storage"
import type {
  ExpertProfileRecord,
  ExpertProposalRecord,
} from "../types/hrm-expert.types"

export default function HrmExpertisePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "experts"

  const [experts, setExperts] = useState<ExpertProfileRecord[]>(() =>
    defaultHrmExpertRepository.getAllExperts()
  )
  const [proposals, setProposals] = useState<ExpertProposalRecord[]>(() =>
    defaultHrmExpertRepository.getAllProposals()
  )
  const [selectedProposalId, setSelectedProposalId] = useState<string>(
    () => defaultHrmExpertRepository.getAllProposals()[0]?.id || "PROP-2026-001"
  )

  // Modal states (100% Popup Modals ở giữa màn hình)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedExpertForDetail, setSelectedExpertForDetail] =
    useState<ExpertProfileRecord | null>(null)

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingExpert, setEditingExpert] =
    useState<ExpertProfileRecord | null>(null)

  const [createProposalModalOpen, setCreateProposalModalOpen] = useState(false)
  const [exportProposalModalOpen, setExportProposalModalOpen] = useState(false)
  const [proposalForExport, setProposalForExport] =
    useState<ExpertProposalRecord | null>(null)

  const refreshData = () => {
    setExperts(defaultHrmExpertRepository.getAllExperts())
    setProposals(defaultHrmExpertRepository.getAllProposals())
  }

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  // Thao tác xem CV
  const handleOpenDetail = (expert: ExpertProfileRecord) => {
    setSelectedExpertForDetail(expert)
    setDetailModalOpen(true)
  }

  // Thao tác Thêm / Sửa chuyên gia
  const handleOpenCreateExpert = () => {
    setEditingExpert(null)
    setFormModalOpen(true)
  }

  const handleOpenEditExpert = (expert: ExpertProfileRecord) => {
    setEditingExpert(expert)
    setFormModalOpen(true)
  }

  const handleDeleteExpert = (id: string) => {
    defaultHrmExpertRepository.deleteExpert(id)
    refreshData()
    toast.success("Đã xóa hồ sơ chuyên gia.")
  }

  // Gán chuyên gia từ Tab Tìm kiếm vào Đề án
  const handleAssignFromSearch = (expert: ExpertProfileRecord) => {
    const cur =
      proposals.find((p) => p.id === selectedProposalId) || proposals[0]
    if (!cur) return

    const alreadyIn = cur.assignedExperts.some((a) => a.expertId === expert.id)
    if (alreadyIn) {
      toast.info(`Chuyên gia ${expert.fullName} đã có trong đề án ${cur.id}!`)
      return
    }

    const updated = {
      ...cur,
      assignedExperts: [
        ...cur.assignedExperts,
        {
          expertId: expert.id,
          assignedRole:
            expert.projects.some((p) => p.role === "lead")
              ? "Chủ nhiệm đề án"
              : "Kỹ sư chuyên môn",
          notes: `Ghép nối tự động từ bộ lọc chuyên môn (${expert.primarySpecialty})`,
        },
      ],
    }

    defaultHrmExpertRepository.saveProposal(updated)
    refreshData()
    toast.success(`Đã thêm ${expert.fullName} vào đề án ${cur.proposalTitle}!`)
    setSearchParams({ tab: "proposals" })
  }

  const handleOpenExportProposal = (proposal: ExpertProposalRecord) => {
    setProposalForExport(proposal)
    setExportProposalModalOpen(true)
  }

  return (
    <div className="flex-1 space-y-5 p-6 max-w-[1680px] mx-auto animate-in fade-in-50 duration-200">
      {/* 1. Header Trang & Sub-tabs Chuyển đổi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Năng lực chuyên gia
            </h1>

          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị chuyên môn sâu, tìm kiếm ghép nối nhân sự theo tiêu chí đề án và lập hồ sơ năng lực thầu.
          </p>
        </div>

        {/* Thanh chuyển đổi phân hệ con (HRM-05, HRM-06, HRM-07) */}
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/50 grid grid-cols-3">
              <TabsTrigger
                value="experts"
                className="text-xs font-medium gap-1.5 rounded-lg px-3"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Hồ sơ chuyên gia</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="text-xs font-medium gap-1.5 rounded-lg px-3"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Tìm kiếm & Ghép nối</span>
              </TabsTrigger>
              <TabsTrigger
                value="proposals"
                className="text-xs font-medium gap-1.5 rounded-lg px-3"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Hồ sơ năng lực thầu</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 2. Nội dung theo Sub-tab */}
      {/* --- TAB 1: HRM-05 - HỒ SƠ NĂNG LỰC CHUYÊN GIA --- */}
      {activeTab === "experts" && (
        <div className="animate-in fade-in-50 duration-200">
          <ExpertListTab
            experts={experts}
            onOpenCreate={handleOpenCreateExpert}
            onOpenEdit={handleOpenEditExpert}
            onOpenDetail={handleOpenDetail}
            onDelete={handleDeleteExpert}
          />
        </div>
      )}

      {/* --- TAB 2: HRM-06 - TÌM KIẾM CHUYÊN GIA THEO TIÊU CHÍ ĐA CHIỀU --- */}
      {activeTab === "search" && (
        <div className="animate-in fade-in-50 duration-200">
          <ExpertSearchTab
            experts={experts}
            onOpenDetail={handleOpenDetail}
            onAssignToProposal={handleAssignFromSearch}
          />
        </div>
      )}

      {/* --- TAB 3: HRM-07 - HỖ TRỢ LẬP HỒ SƠ NĂNG LỰC ĐỀ ÁN THẦU --- */}
      {activeTab === "proposals" && (
        <div className="animate-in fade-in-50 duration-200">
          <ExpertProposalTab
            proposals={proposals}
            allExperts={experts}
            selectedProposalId={selectedProposalId}
            onSelectProposal={setSelectedProposalId}
            onOpenCreateProposal={() => setCreateProposalModalOpen(true)}
            onOpenExportProposal={handleOpenExportProposal}
            onProposalUpdated={refreshData}
          />
        </div>
      )}

      {/* 3. CÁC POPUP MODAL MỞ Ở GIỮA MÀN HÌNH (DIALOG) */}
      <ExpertDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        expert={selectedExpertForDetail}
      />

      <ExpertFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        initialRecord={editingExpert}
        onSaved={refreshData}
      />

      <CreateProposalModal
        open={createProposalModalOpen}
        onOpenChange={setCreateProposalModalOpen}
        onCreated={(newProp) => {
          refreshData()
          setSelectedProposalId(newProp.id)
          toast.success("Đã tạo đề án mới thành công!")
        }}
      />

      <ProposalExportModal
        open={exportProposalModalOpen}
        onOpenChange={setExportProposalModalOpen}
        proposal={proposalForExport}
        allExperts={experts}
      />
    </div>
  )
}
