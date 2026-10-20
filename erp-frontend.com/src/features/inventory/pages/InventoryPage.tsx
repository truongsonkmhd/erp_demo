import React, { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  Box,
  Layers,
  Package,
  PackageMinus,
  PackagePlus,
  Truck,
  Warehouse as WarehouseIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/services/auth/AuthContext"

import type {
  GoodsIssue,
  GoodsReceipt,
  InventoryTransaction,
  Material,
  StockAlert,
  StockBatch,
  StockLevel,
  StockThreshold,
  StockTransfer,
  Warehouse,
} from "../types/inventory.types"
import {
  GoodsIssueRepository,
  GoodsReceiptRepository,
  InventoryLedgerRepository,
  MaterialRepository,
  StockAlertRepository,
  StockBatchRepository,
  StockThresholdRepository,
  StockTransferRepository,
  WarehouseRepository,
} from "../repositories/inventory.storage"
import {
  calculateStockLevels,
  dispatchTransfer,
  generateStockAlerts,
  postIssue,
  postReceipt,
  receiveTransfer,
} from "../services/inventory.service"

import { StockOverviewTab } from "../components/StockOverviewTab"
import { GoodsReceiptListTab } from "../components/GoodsReceiptListTab"
import { GoodsReceiptFormDrawer } from "../components/GoodsReceiptFormDrawer"
import { GoodsReceiptDetailModal } from "../components/GoodsReceiptDetailModal"

import { GoodsIssueListTab } from "../components/GoodsIssueListTab"
import { GoodsIssueFormDrawer } from "../components/GoodsIssueFormDrawer"
import { GoodsIssueDetailModal } from "../components/GoodsIssueDetailModal"

import { StockTransferListTab } from "../components/StockTransferListTab"
import { StockTransferFormDrawer } from "../components/StockTransferFormDrawer"
import { StockTransferDetailModal } from "../components/StockTransferDetailModal"

import { StockAlertListTab } from "../components/StockAlertListTab"

export default function InventoryPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "stock"

  // Data states
  const [materials, setMaterials] = useState<Material[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [batches, setBatches] = useState<StockBatch[]>([])
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])
  const [issues, setIssues] = useState<GoodsIssue[]>([])
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [thresholds, setThresholds] = useState<StockThreshold[]>([])

  // Modal / Drawer states cho Nhập kho
  const [receiptFormOpen, setReceiptFormOpen] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<GoodsReceipt | null>(null)
  const [detailReceipt, setDetailReceipt] = useState<GoodsReceipt | null>(null)

  // Modal / Drawer states cho Xuất kho
  const [issueFormOpen, setIssueFormOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<GoodsIssue | null>(null)
  const [detailIssue, setDetailIssue] = useState<GoodsIssue | null>(null)

  // Modal / Drawer states cho Điều chuyển
  const [transferFormOpen, setTransferFormOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<StockTransfer | null>(null)
  const [detailTransfer, setDetailTransfer] = useState<StockTransfer | null>(null)

  // Load data từ storage
  const reloadData = () => {
    setMaterials(MaterialRepository.list())
    setWarehouses(WarehouseRepository.list())
    setBatches(StockBatchRepository.list())
    setReceipts(GoodsReceiptRepository.list())
    setIssues(GoodsIssueRepository.list())
    setTransfers(StockTransferRepository.list())
    setTransactions(InventoryLedgerRepository.list())
    setThresholds(StockThresholdRepository.list())
  }

  useEffect(() => {
    reloadData()
  }, [])

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  // Tính toán số dư tồn kho từ Sổ cái bất biến
  const stockLevels: StockLevel[] = useMemo(() => {
    return calculateStockLevels(
      materials,
      transactions,
      batches,
      issues,
      thresholds,
      transfers
    )
  }, [materials, transactions, batches, issues, thresholds, transfers])

  // Tự sinh cảnh báo tồn kho
  const alerts: StockAlert[] = useMemo(() => {
    const rawAlerts = generateStockAlerts(stockLevels, batches)
    // Đồng bộ với trạng thái dismissed đã lưu trong storage nếu có
    const saved = StockAlertRepository.list()
    const dismissedMap = new Map(saved.filter((s) => s.dismissed).map((s) => [s.id, s]))

    return rawAlerts.map((a) => {
      const match = dismissedMap.get(a.id)
      return match ? { ...a, dismissed: true, dismissedReason: match.dismissedReason } : a
    })
  }, [stockLevels, batches])

  // Số lượng cảnh báo chưa đóng
  const activeAlertCount = useMemo(() => {
    return alerts.filter((a) => !a.dismissed).length
  }, [alerts])

  // Số lượng phiếu chờ xử lý
  const pendingReceiptCount = useMemo(() => {
    return receipts.filter((r) => r.status === "pending_post").length
  }, [receipts])

  const pendingIssueCount = useMemo(() => {
    return issues.filter((i) => i.status === "pending_approval" || i.status === "approved").length
  }, [issues])

  const inTransitTransferCount = useMemo(() => {
    return transfers.filter((t) => t.status === "in_transit" || t.status === "pending_receive").length
  }, [transfers])

  // ================= ACTION HANDLERS =================

  // 1. Nhập kho
  const handleConfirmPostReceipt = (rc: GoodsReceipt) => {
    const actor = user?.fullName || "Thủ kho tiếp nhận"
    const { transactions: newTxs, newBatches } = postReceipt(rc, actor)

    // Lưu sổ cái giao dịch
    InventoryLedgerRepository.appendMultiple(newTxs)
    // Lưu các lô mới nếu có
    if (newBatches.length > 0) {
      StockBatchRepository.saveMultiple(newBatches)
    }

    // Cập nhật trạng thái phiếu nhập kho
    const updated: GoodsReceipt = {
      ...rc,
      status: "posted",
      postedAt: new Date().toISOString(),
      postedBy: actor,
      updatedAt: new Date().toISOString(),
    }
    GoodsReceiptRepository.save(updated)

    toast.success(`Đã xác nhận ghi sổ nhập kho thành công cho phiếu ${rc.code}!`)
    setDetailReceipt(null)
    reloadData()
  }

  const handleRejectReceipt = (rc: GoodsReceipt) => {
    const updated: GoodsReceipt = {
      ...rc,
      status: "rejected",
      updatedAt: new Date().toISOString(),
    }
    GoodsReceiptRepository.save(updated)
    toast.info(`Đã từ chối phiếu nhập kho ${rc.code}`)
    setDetailReceipt(null)
    reloadData()
  }

  // 2. Xuất kho
  const handleApproveIssue = (is: GoodsIssue) => {
    const updated: GoodsIssue = {
      ...is,
      status: "approved",
      approverName: user?.fullName || "Lãnh đạo phụ trách",
      updatedAt: new Date().toISOString(),
    }
    GoodsIssueRepository.save(updated)
    toast.success(`Đã phê duyệt phiếu xuất kho ${is.code}. Số lượng đã được giữ chỗ an toàn!`)
    setDetailIssue(null)
    reloadData()
  }

  const handleConfirmIssue = (is: GoodsIssue) => {
    const actor = user?.fullName || "Thủ kho xuất"
    const result = postIssue(is, stockLevels, actor)

    if (!result.success || !result.transactions) {
      toast.error(result.errorMessage || "Không thể thực hiện xuất kho!")
      return
    }

    // Lưu sổ cái giao dịch giảm tồn
    InventoryLedgerRepository.appendMultiple(result.transactions)

    // Cập nhật trạng thái phiếu xuất
    const updated: GoodsIssue = {
      ...is,
      status: "issued",
      issuedAt: new Date().toISOString(),
      issuedBy: actor,
      updatedAt: new Date().toISOString(),
    }
    GoodsIssueRepository.save(updated)

    toast.success(`Đã ghi sổ thực xuất kho thành công cho phiếu ${is.code}!`)
    setDetailIssue(null)
    reloadData()
  }

  // 3. Điều chuyển
  const handleApproveTransfer = (tf: StockTransfer) => {
    const updated: StockTransfer = {
      ...tf,
      status: "approved",
      updatedAt: new Date().toISOString(),
    }
    StockTransferRepository.save(updated)
    toast.success(`Đã phê duyệt lệnh điều chuyển ${tf.code}!`)
    setDetailTransfer(null)
    reloadData()
  }

  const handleDispatchTransfer = (tf: StockTransfer) => {
    const actor = user?.fullName || "Thủ kho nguồn"
    const result = dispatchTransfer(tf, stockLevels, actor)

    if (!result.success || !result.transactions) {
      toast.error(result.errorMessage || "Không thể thực hiện xuất điều chuyển!")
      return
    }

    // Ghi sổ xuất kho nguồn
    InventoryLedgerRepository.appendMultiple(result.transactions)

    // Cập nhật trạng thái đang vận chuyển
    const updated: StockTransfer = {
      ...tf,
      status: "in_transit",
      dispatchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    StockTransferRepository.save(updated)

    toast.success(`Đã xuất kho nguồn thành công! Hàng đang trong trạng thái vận chuyển đến ${tf.targetWarehouseName}.`)
    setDetailTransfer(null)
    reloadData()
  }

  const handleReceiveTransfer = (tf: StockTransfer, discrepancyReason?: string) => {
    const actor = user?.fullName || "Thủ kho đích"
    const { transactions: newTxs } = receiveTransfer(tf, actor)

    // Ghi sổ nhập kho đích
    InventoryLedgerRepository.appendMultiple(newTxs)

    const isDiscrepancy = Boolean(discrepancyReason && discrepancyReason.trim())
    const updated: StockTransfer = {
      ...tf,
      status: isDiscrepancy ? "discrepancy" : "completed",
      discrepancyReason: discrepancyReason?.trim(),
      receivedAt: new Date().toISOString(),
      totalReceivedQuantity: tf.totalDispatchedQuantity,
      updatedAt: new Date().toISOString(),
    }
    StockTransferRepository.save(updated)

    toast.success(
      isDiscrepancy
        ? `Đã nhận kho đích với ghi nhận chênh lệch cho lệnh ${tf.code}!`
        : `Đã hoàn tất tiếp nhận điều chuyển vào kho ${tf.targetWarehouseName}!`
    )
    setDetailTransfer(null)
    reloadData()
  }

  // 4. Cảnh báo
  const handleDismissAlert = (alertId: string, reason?: string) => {
    StockAlertRepository.dismiss(alertId, reason)
    reloadData()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 max-w-[1680px] mx-auto animate-in fade-in-50 duration-200">
      {/* 1. Header Trang & Phân hệ Sub-navigation Tabs (Chuẩn Menu 06) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Kho vật tư & thiết bị
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị xuất nhập tồn theo nhiệm vụ, theo dõi thẻ kho bất biến, điều chuyển liên kho và kiểm soát định mức an toàn.
          </p>
        </div>

        {/* Thanh chuyển đổi 5 phân hệ con Tabs ở bên phải Header giống Menu 06 */}
        <div className="flex items-center shrink-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="bg-muted/70 p-1 rounded-xl border border-border/50 grid grid-cols-2 sm:grid-cols-5 h-auto">
              <TabsTrigger
                value="stock"
                className="text-xs font-medium gap-1.5 rounded-lg px-2.5 py-1.5"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Tồn kho</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-semibold">
                  {stockLevels.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="receipts"
                className="text-xs font-medium gap-1.5 rounded-lg px-2.5 py-1.5"
              >
                <PackagePlus className="h-3.5 w-3.5" />
                <span>Nhập kho</span>
                {pendingReceiptCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                    {pendingReceiptCount}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="issues"
                className="text-xs font-medium gap-1.5 rounded-lg px-2.5 py-1.5"
              >
                <PackageMinus className="h-3.5 w-3.5" />
                <span>Xuất kho</span>
                {pendingIssueCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-bold">
                    {pendingIssueCount}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="transfers"
                className="text-xs font-medium gap-1.5 rounded-lg px-2.5 py-1.5"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Điều chuyển</span>
                {inTransitTransferCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500 text-white font-bold animate-pulse">
                    {inTransitTransferCount}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="alerts"
                className="text-xs font-medium gap-1.5 rounded-lg px-2.5 py-1.5"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Cảnh báo</span>
                {activeAlertCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                    {activeAlertCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 2. Nội dung các Tabs (Chuẩn Menu 06) */}

      {/* Tab 1: Tồn kho */}
      {activeTab === "stock" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <StockOverviewTab
            materials={materials}
            warehouses={warehouses}
            stockLevels={stockLevels}
            thresholds={thresholds}
            transactions={transactions}
            onReload={reloadData}
          />
        </div>
      )}

      {/* Tab 2: Nhập kho (PRC-05) */}
      {activeTab === "receipts" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <GoodsReceiptListTab
            receipts={receipts}
            warehouses={warehouses}
            onOpenCreate={() => {
              setEditingReceipt(null)
              setReceiptFormOpen(true)
            }}
            onOpenEdit={(r) => {
              setEditingReceipt(r)
              setReceiptFormOpen(true)
            }}
            onOpenDetail={(r) => setDetailReceipt(r)}
            onDelete={(r) => {
              if (confirm(`Bạn có chắc muốn xóa phiếu nhập ${r.code}?`)) {
                GoodsReceiptRepository.remove(r.id)
                reloadData()
              }
            }}
            onConfirmPost={handleConfirmPostReceipt}
            onReload={reloadData}
          />
        </div>
      )}

      {/* Tab 3: Xuất kho (PRC-06) */}
      {activeTab === "issues" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <GoodsIssueListTab
            issues={issues}
            warehouses={warehouses}
            onOpenCreate={() => {
              setEditingIssue(null)
              setIssueFormOpen(true)
            }}
            onOpenEdit={(i) => {
              setEditingIssue(i)
              setIssueFormOpen(true)
            }}
            onOpenDetail={(i) => setDetailIssue(i)}
            onDelete={(i) => {
              if (confirm(`Bạn có chắc muốn xóa phiếu xuất ${i.code}?`)) {
                GoodsIssueRepository.remove(i.id)
                reloadData()
              }
            }}
            onApprove={handleApproveIssue}
            onConfirmIssue={handleConfirmIssue}
            onReload={reloadData}
          />
        </div>
      )}

      {/* Tab 4: Điều chuyển (PRC-08) */}
      {activeTab === "transfers" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <StockTransferListTab
            transfers={transfers}
            warehouses={warehouses}
            onOpenCreate={() => {
              setEditingTransfer(null)
              setTransferFormOpen(true)
            }}
            onOpenEdit={(t) => {
              setEditingTransfer(t)
              setTransferFormOpen(true)
            }}
            onOpenDetail={(t) => setDetailTransfer(t)}
            onDelete={(t) => {
              if (confirm(`Bạn có chắc muốn xóa lệnh điều chuyển ${t.code}?`)) {
                StockTransferRepository.remove(t.id)
                reloadData()
              }
            }}
            onApprove={handleApproveTransfer}
            onDispatch={handleDispatchTransfer}
            onReceive={(t) => handleReceiveTransfer(t)}
            onReload={reloadData}
          />
        </div>
      )}

      {/* Tab 5: Cảnh báo (PRC-09) */}
      {activeTab === "alerts" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <StockAlertListTab
            alerts={alerts}
            onDismiss={handleDismissAlert}
            onReload={reloadData}
          />
        </div>
      )}

      {/* --- CÁC MODAL & DRAWER ĐIỀU HÀNH --- */}

      {/* Nhập kho */}
      <GoodsReceiptFormDrawer
        open={receiptFormOpen}
        onClose={() => setReceiptFormOpen(false)}
        onSuccess={() => {
          setReceiptFormOpen(false)
          reloadData()
        }}
        editingReceipt={editingReceipt}
        materials={materials}
        warehouses={warehouses}
      />

      <GoodsReceiptDetailModal
        receipt={detailReceipt}
        open={Boolean(detailReceipt)}
        onClose={() => setDetailReceipt(null)}
        onConfirmPost={handleConfirmPostReceipt}
        onReject={handleRejectReceipt}
      />

      {/* Xuất kho */}
      <GoodsIssueFormDrawer
        open={issueFormOpen}
        onClose={() => setIssueFormOpen(false)}
        onSuccess={() => {
          setIssueFormOpen(false)
          reloadData()
        }}
        editingIssue={editingIssue}
        materials={materials}
        warehouses={warehouses}
        stockLevels={stockLevels}
        batches={batches}
      />

      <GoodsIssueDetailModal
        issue={detailIssue}
        open={Boolean(detailIssue)}
        onClose={() => setDetailIssue(null)}
        onApprove={handleApproveIssue}
        onConfirmIssue={handleConfirmIssue}
      />

      {/* Điều chuyển */}
      <StockTransferFormDrawer
        open={transferFormOpen}
        onClose={() => setTransferFormOpen(false)}
        onSuccess={() => {
          setTransferFormOpen(false)
          reloadData()
        }}
        editingTransfer={editingTransfer}
        materials={materials}
        warehouses={warehouses}
        stockLevels={stockLevels}
      />

      <StockTransferDetailModal
        transfer={detailTransfer}
        open={Boolean(detailTransfer)}
        onClose={() => setDetailTransfer(null)}
        onApprove={handleApproveTransfer}
        onDispatch={handleDispatchTransfer}
        onReceive={handleReceiveTransfer}
      />
    </div>
  )
}
