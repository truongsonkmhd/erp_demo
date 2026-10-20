import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Send,
  UserCheck,
  Building2,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  MessageSquare,
  FileSearch,
  ChevronRight,
  UploadCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dossier, DossierStatus, DOSSIER_TYPES } from "@/types/dossier";
import {
  getDossiers,
  approveDossier,
  rejectDossier,
  requestDossierChanges,
  resubmitDossier,
  resetDossiersDemoData,
} from "@/services/DossierService";

export const DEMO_ROLES = [
  { id: "creator", name: "Người lập", actorName: "Phạm Văn Minh", dept: "Phòng Mua sắm - Vật tư" },
  { id: "dept_head", name: "Trưởng đơn vị", actorName: "Lê Thị Ngọc", dept: "Phòng Kế hoạch - Tài chính" },
  { id: "specialist", name: "Phòng chuyên môn", actorName: "Nguyễn Văn Hùng", dept: "Phòng Kỹ thuật - Khối lượng" },
  { id: "deputy_leader", name: "Phó Liên đoàn trưởng", actorName: "Hoàng Minh Tuấn", dept: "Lãnh đạo Liên đoàn" },
  { id: "leader", name: "Liên đoàn trưởng", actorName: "Phạm Trường Sơn", dept: "Thủ trưởng Liên đoàn" },
  { id: "admin", name: "Quản trị hệ thống", actorName: "System Admin", dept: "Phòng CNTT & Quản trị" },
] as const;

export type DemoRole = (typeof DEMO_ROLES)[number]["name"];

export default function PendingTasksPage() {
  const { toast } = useToast();

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Demo Role
  const [currentRoleObj, setCurrentRoleObj] = useState<typeof DEMO_ROLES[number]>(DEMO_ROLES[1]); // Default Trưởng đơn vị

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"my_pending" | "all_pending" | "due_soon" | "overdue" | "changes_requested">("my_pending");

  // Selected Dossier for View Detail Modal
  const [viewingDossier, setViewingDossier] = useState<Dossier | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "attachments" | "workflow" | "history">("info");

  // Action Confirmation Dialog States
  const [approveTarget, setApproveTarget] = useState<Dossier | null>(null);
  const [approveNote, setApproveNote] = useState("");

  const [rejectTarget, setRejectTarget] = useState<Dossier | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [requestChangeTarget, setRequestChangeTarget] = useState<Dossier | null>(null);
  const [requestChangeNote, setRequestChangeNote] = useState("");

  const [resubmitTarget, setResubmitTarget] = useState<Dossier | null>(null);
  const [resubmitNote, setResubmitNote] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  // Load Dossiers
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDossiers();
      setDossiers(data);
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách việc cần xử lý.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper check if dossier is pending for current role
  const isTargetForRole = (dos: Dossier, roleName: DemoRole): boolean => {
    if (roleName === "Quản trị hệ thống") return true;

    if (roleName === "Người lập") {
      return (
        dos.status === "Dự thảo" ||
        dos.status === "Yêu cầu bổ sung" ||
        dos.currentStep.includes("Bước 1")
      );
    }

    if (roleName === "Trưởng đơn vị") {
      return dos.status === "Chờ Trưởng đơn vị duyệt" || dos.currentStep.includes("Bước 2");
    }

    if (roleName === "Phòng chuyên môn") {
      return dos.status === "Chờ Phòng chuyên môn duyệt" || dos.currentStep.includes("Bước 3");
    }

    if (roleName === "Phó Liên đoàn trưởng") {
      return (
        (dos.status === "Chờ Lãnh đạo phê duyệt" && dos.currentStep.includes("Bước 4")) ||
        dos.currentHandler.includes("Phó Liên đoàn") ||
        dos.currentHandler.includes("Hoàng Minh Tuấn")
      );
    }

    if (roleName === "Liên đoàn trưởng") {
      return (
        (dos.status === "Chờ Lãnh đạo phê duyệt" && dos.currentStep.includes("Bước 5")) ||
        dos.currentHandler.includes("Liên đoàn trưởng") ||
        dos.currentHandler.includes("Phạm Trường Sơn")
      );
    }

    return false;
  };

  // Dates logic helpers
  const todayStr = new Date().toISOString().slice(0, 10);
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const isOverdue = (dueDateStr: string) => dueDateStr < todayStr;
  const isDueSoon = (dueDateStr: string) => dueDateStr >= todayStr && dueDateStr <= in3Days;

  // Filtered List calculation
  const roleDossiers = dossiers.filter((dos) => {
    const matchesSearch =
      dos.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dos.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dos.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dos.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || dos.dossierType === filterType;

    return matchesSearch && matchesType;
  });

  const myPendingList = roleDossiers.filter((dos) => isTargetForRole(dos, currentRoleObj.name) && dos.status !== "Đã phê duyệt" && dos.status !== "Bị từ chối");
  const allPendingList = roleDossiers.filter((dos) => dos.status.startsWith("Chờ") || dos.status === "Dự thảo" || dos.status === "Yêu cầu bổ sung");
  const dueSoonList = roleDossiers.filter((dos) => isDueSoon(dos.dueDate) && dos.status !== "Đã phê duyệt" && dos.status !== "Bị từ chối");
  const overdueList = roleDossiers.filter((dos) => isOverdue(dos.dueDate) && dos.status !== "Đã phê duyệt" && dos.status !== "Bị từ chối");
  const changesRequestedList = roleDossiers.filter((dos) => dos.status === "Yêu cầu bổ sung");

  const getActiveTabList = () => {
    switch (activeTab) {
      case "my_pending":
        return myPendingList;
      case "all_pending":
        return allPendingList;
      case "due_soon":
        return dueSoonList;
      case "overdue":
        return overdueList;
      case "changes_requested":
        return changesRequestedList;
      default:
        return myPendingList;
    }
  };

  const displayList = getActiveTabList();

  // Handle Approve Action
  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      const updated = await approveDossier(
        approveTarget.id,
        currentRoleObj.actorName,
        currentRoleObj.name,
        approveNote.trim()
      );
      setDossiers((prev) => prev.map((item) => (item.id === approveTarget.id ? updated : item)));
      toast({
        title: "Đã phê duyệt hồ sơ",
        description: `Hồ sơ ${updated.code} đã được phê duyệt và chuyển bước xử lý tiếp theo.`,
      });
      setApproveTarget(null);
      setApproveNote("");
    } catch (error) {
      toast({
        title: "Lỗi phê duyệt",
        description: "Không thể thực hiện hành động phê duyệt.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Action
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập lý do từ chối hồ sơ.",
        variant: "destructive",
      });
      return;
    }
    setActionLoading(true);
    try {
      const updated = await rejectDossier(
        rejectTarget.id,
        currentRoleObj.actorName,
        currentRoleObj.name,
        rejectReason.trim()
      );
      setDossiers((prev) => prev.map((item) => (item.id === rejectTarget.id ? updated : item)));
      toast({
        title: "Đã từ chối hồ sơ",
        description: `Hồ sơ ${updated.code} đã chuyển sang trạng thái Bị từ chối.`,
      });
      setRejectTarget(null);
      setRejectReason("");
    } catch (error) {
      toast({
        title: "Lỗi từ chối",
        description: "Không thể từ chối hồ sơ.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Request Change Action
  const handleConfirmRequestChange = async () => {
    if (!requestChangeTarget) return;
    if (!requestChangeNote.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập nội dung yêu cầu bổ sung.",
        variant: "destructive",
      });
      return;
    }
    setActionLoading(true);
    try {
      const updated = await requestDossierChanges(
        requestChangeTarget.id,
        currentRoleObj.actorName,
        currentRoleObj.name,
        requestChangeNote.trim()
      );
      setDossiers((prev) => prev.map((item) => (item.id === requestChangeTarget.id ? updated : item)));
      toast({
        title: "Đã gửi Yêu cầu bổ sung",
        description: `Hồ sơ ${updated.code} đã trả về người lập để bổ sung thông tin.`,
      });
      setRequestChangeTarget(null);
      setRequestChangeNote("");
    } catch (error) {
      toast({
        title: "Lỗi yêu cầu bổ sung",
        description: "Không thể yêu cầu bổ sung hồ sơ.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Resubmit Action (by Creator)
  const handleConfirmResubmit = async () => {
    if (!resubmitTarget) return;
    setActionLoading(true);
    try {
      const updated = await resubmitDossier(
        resubmitTarget.id,
        currentRoleObj.actorName,
        resubmitNote.trim() || "Đã bổ sung tài liệu và giải trình đầy đủ theo yêu cầu."
      );
      setDossiers((prev) => prev.map((item) => (item.id === resubmitTarget.id ? updated : item)));
      toast({
        title: "Đã gửi lại phê duyệt",
        description: `Hồ sơ ${updated.code} đã chuyển lại bước Duyệt cấp Đơn vị.`,
      });
      setResubmitTarget(null);
      setResubmitNote("");
    } catch (error) {
      toast({
        title: "Lỗi gửi lại hồ sơ",
        description: "Không thể gửi lại phê duyệt.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Demo
  const handleResetDemo = async () => {
    try {
      const resetList = await resetDossiersDemoData();
      setDossiers(resetList);
      toast({
        title: "Khôi phục dữ liệu demo",
        description: "Đã thiết lập lại trạng thái các công việc chờ xử lý.",
      });
    } catch (error) {
      toast({
        title: "Lỗi khôi phục",
        description: "Không thể reset dữ liệu.",
        variant: "destructive",
      });
    }
  };

  // Helper Badge Color
  const getStatusBadge = (status: DossierStatus) => {
    switch (status) {
      case "Dự thảo":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">Dự thảo</Badge>;
      case "Chờ Trưởng đơn vị duyệt":
      case "Chờ Phòng chuyên môn duyệt":
      case "Chờ Lãnh đạo phê duyệt":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">Chờ phê duyệt</Badge>;
      case "Yêu cầu bổ sung":
        return <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300">Yêu cầu bổ sung</Badge>;
      case "Đã phê duyệt":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">Đã phê duyệt</Badge>;
      case "Bị từ chối":
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300">Bị từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-emerald-600" />
            Việc cần xử lý
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Màn hình xử lý công việc & trình duyệt hồ sơ theo vai trò thực hiện tại Liên đoàn Vật lý Địa chất.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            className="text-xs gap-1.5 border-dashed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Khôi phục Trạng thái Demo
          </Button>
        </div>
      </div>

      {/* High-Prominence Demo Role Switcher Bar */}
      <div className="bg-linear-to-r from-emerald-900 to-teal-800 text-white p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="font-bold text-sm tracking-wide uppercase text-emerald-100">
              Bộ chọn Vai trò Demo người dùng (Role Switcher)
            </h2>
          </div>
          <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-[11px]">
            Chế độ Demo Tương tác
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {DEMO_ROLES.map((role) => {
            const isSelected = currentRoleObj.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setCurrentRoleObj(role)}
                className={`p-2.5 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? "bg-white text-emerald-950 border-white font-bold shadow-sm"
                    : "bg-emerald-950/40 text-emerald-100 border-emerald-700/50 hover:bg-emerald-800/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{role.name}</span>
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <p className={`text-[10px] mt-0.5 font-medium line-clamp-1 ${isSelected ? "text-emerald-800" : "text-emerald-300/80"}`}>
                    {role.actorName}
                  </p>
                </div>
                <p className={`text-[9px] mt-1 line-clamp-1 ${isSelected ? "text-slate-600" : "text-emerald-200/60"}`}>
                  {role.dept}
                </p>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-emerald-200/90 flex items-center gap-1.5 pt-1 border-t border-emerald-700/50">
          <Sparkles className="h-3.5 w-3.5 text-amber-300 shrink-0" />
          <span>
            Đang giả lập vai trò: <strong className="text-white underline">{currentRoleObj.name} ({currentRoleObj.actorName})</strong>. Danh sách bên dưới tự động lọc đúng hồ sơ cần vai trò này phê duyệt.
          </span>
        </div>
      </div>

      {/* Summary Cards Metric Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveTab("my_pending")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === "my_pending"
              ? "bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Chờ tôi xử lý</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-bold text-emerald-600">{myPendingList.length}</h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-200">
              Trực tiếp
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("all_pending")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === "all_pending"
              ? "bg-amber-50/90 border-amber-600 ring-2 ring-amber-500/20 dark:bg-amber-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Tất cả chờ duyệt</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-bold text-amber-600">{allPendingList.length}</h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full dark:bg-amber-900 dark:text-amber-200">
              Toàn luồng
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("due_soon")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === "due_soon"
              ? "bg-sky-50/90 border-sky-600 ring-2 ring-sky-500/20 dark:bg-sky-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Sắp đến hạn (&lt;3 ngày)</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-bold text-sky-600">{dueSoonList.length}</h3>
            <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded-full dark:bg-sky-900 dark:text-sky-200">
              Cần ưu tiên
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === "overdue"
              ? "bg-red-50/90 border-red-600 ring-2 ring-red-500/20 dark:bg-red-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Quá hạn xử lý</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-bold text-red-600">{overdueList.length}</h3>
            <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200 font-semibold">
              Khẩn cấp
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("changes_requested")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === "changes_requested"
              ? "bg-orange-50/90 border-orange-600 ring-2 ring-orange-500/20 dark:bg-orange-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Yêu cầu bổ sung</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-bold text-orange-600">{changesRequestedList.length}</h3>
            <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full dark:bg-orange-900 dark:text-orange-200">
              Bổ sung
            </span>
          </div>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hồ sơ, tên hồ sơ, người lập, đơn vị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-[180px] bg-background text-xs">
              <SelectValue placeholder="Loại hồ sơ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại hồ sơ</SelectItem>
              {DOSSIER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dossier List Table */}
      <div className="border border-border/80 rounded-lg bg-card shadow-2xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border/70">
              <tr>
                <th className="px-4 py-3 w-[110px]">Mã hồ sơ</th>
                <th className="px-4 py-3 min-w-[220px]">Tên hồ sơ</th>
                <th className="px-4 py-3 w-[130px]">Loại hồ sơ</th>
                <th className="px-4 py-3 w-[140px]">Người lập / Đơn vị</th>
                <th className="px-4 py-3 w-[150px]">Bước hiện tại</th>
                <th className="px-4 py-3 w-[110px]">Hạn xử lý</th>
                <th className="px-4 py-3 text-center w-[120px]">Trạng thái</th>
                <th className="px-4 py-3 text-right min-w-[160px]">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải danh sách công việc cần xử lý...
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Không có hồ sơ nào trong mục này với vai trò <strong>{currentRoleObj.name}</strong>.
                  </td>
                </tr>
              ) : (
                displayList.map((dos) => {
                  const isActionable = isTargetForRole(dos, currentRoleObj.name) && dos.status !== "Đã phê duyệt" && dos.status !== "Bị từ chối";
                  const overdue = isOverdue(dos.dueDate);
                  const isCreator = currentRoleObj.name === "Người lập" || currentRoleObj.name === "Quản trị hệ thống";
                  const isNeedResubmit = isCreator && (dos.status === "Yêu cầu bổ sung" || dos.status === "Dự thảo");

                  return (
                    <tr
                      key={dos.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isActionable ? "bg-emerald-50/20 dark:bg-emerald-950/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                        {dos.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{dos.name}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {dos.summary}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px]">
                          {dos.dossierType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p className="font-medium text-foreground">{dos.creatorName}</p>
                        <p className="text-[10px] text-muted-foreground">{dos.department}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-emerald-800 dark:text-emerald-300 text-[11px]">
                          {dos.currentStep}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {dos.currentHandler}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className={`inline-flex items-center gap-1 ${overdue ? "text-red-600 font-bold" : "text-muted-foreground"}`}>
                          <Calendar className="h-3 w-3" />
                          {dos.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(dos.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Eye button to view details */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            onClick={() => {
                              setViewingDossier(dos);
                              setDetailTab("info");
                            }}
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Approval Actions when role matches & active */}
                          {isActionable && dos.status !== "Yêu cầu bổ sung" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] h-7 px-2 gap-1 shadow-xs"
                                onClick={() => setApproveTarget(dos)}
                                title="Phê duyệt hồ sơ"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Duyệt
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-[11px] h-7 px-2 gap-1 dark:bg-amber-950 dark:text-amber-200"
                                onClick={() => setRequestChangeTarget(dos)}
                                title="Yêu cầu bổ sung"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                Bổ sung
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-300 text-red-700 bg-red-50 hover:bg-red-100 text-[11px] h-7 px-2 gap-1 dark:bg-red-950 dark:text-red-200"
                                onClick={() => setRejectTarget(dos)}
                                title="Từ chối hồ sơ"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Từ chối
                              </Button>
                            </>
                          )}

                          {/* Resubmit button for Creator when status is Yêu cầu bổ sung */}
                          {isNeedResubmit && (
                            <Button
                              size="sm"
                              className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] h-7 px-2 gap-1 shadow-xs"
                              onClick={() => setResubmitTarget(dos)}
                              title="Bổ sung & Gửi lại"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Gửi lại
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Approve Confirmation */}
      {approveTarget && (
        <Dialog open={Boolean(approveTarget)} onOpenChange={() => setApproveTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Xác nhận Phê duyệt Hồ sơ
              </DialogTitle>
              <DialogDescription className="text-xs">
                Bạn đang phê duyệt hồ sơ <strong>{approveTarget.code}</strong> với vai trò <strong>{currentRoleObj.name} ({currentRoleObj.actorName})</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="bg-muted/40 p-2.5 rounded border border-border/60">
                <p className="font-semibold text-foreground">{approveTarget.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Bước hiện tại: {approveTarget.currentStep}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Ý kiến chỉ đạo / Ghi chú phê duyệt (Tùy chọn)</Label>
                <Textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  placeholder="Nhập ý kiến chỉ đạo hoặc ghi chú duyệt..."
                  rows={3}
                  className="bg-background text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setApproveTarget(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleConfirmApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {actionLoading ? "Đang xử lý..." : "Xác nhận Phê duyệt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 2: Reject Confirmation */}
      {rejectTarget && (
        <Dialog open={Boolean(rejectTarget)} onOpenChange={() => setRejectTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Xác nhận Từ chối Hồ sơ
              </DialogTitle>
              <DialogDescription className="text-xs">
                Bạn đang từ chối hồ sơ <strong>{rejectTarget.code}</strong> với vai trò <strong>{currentRoleObj.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="bg-red-50 p-2.5 rounded border border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200">
                <p className="font-semibold">{rejectTarget.name}</p>
                <p className="text-[11px] opacity-80 mt-0.5">Hồ sơ sẽ chuyển sang trạng thái "Bị từ chối" và dừng quy trình.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Lý do từ chối <span className="text-red-500">*</span></Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập cụ thể lý do từ chối hồ sơ này..."
                  rows={3}
                  className="bg-background text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="text-xs gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                {actionLoading ? "Đang xử lý..." : "Xác nhận Từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 3: Request Changes Confirmation */}
      {requestChangeTarget && (
        <Dialog open={Boolean(requestChangeTarget)} onOpenChange={() => setRequestChangeTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Yêu cầu Bổ sung Hồ sơ
              </DialogTitle>
              <DialogDescription className="text-xs">
                Yêu cầu người lập bổ sung tài liệu / làm rõ nội dung đối với hồ sơ <strong>{requestChangeTarget.code}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200">
                <p className="font-semibold">{requestChangeTarget.name}</p>
                <p className="text-[11px] opacity-80 mt-0.5">Hồ sơ sẽ được trả về cho <strong>{requestChangeTarget.creatorName}</strong> để chỉnh sửa bổ sung.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Nội dung yêu cầu bổ sung <span className="text-red-500">*</span></Label>
                <Textarea
                  value={requestChangeNote}
                  onChange={(e) => setRequestChangeNote(e.target.value)}
                  placeholder="Nhập chi tiết các mục cần làm rõ hoặc file đính kèm cần bổ sung..."
                  rows={3}
                  className="bg-background text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setRequestChangeTarget(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleConfirmRequestChange}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
              >
                <AlertCircle className="h-4 w-4" />
                {actionLoading ? "Đang xử lý..." : "Gửi Yêu cầu Bổ sung"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 4: Resubmit Confirmation (Creator) */}
      {resubmitTarget && (
        <Dialog open={Boolean(resubmitTarget)} onOpenChange={() => setResubmitTarget(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-sky-700 dark:text-sky-400 flex items-center gap-2">
                <Send className="h-5 w-5" />
                Bổ sung & Gửi lại Phê duyệt
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mô phỏng người lập bổ sung nội dung và trình duyệt lại hồ sơ <strong>{resubmitTarget.code}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="bg-sky-50 p-2.5 rounded border border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-900 dark:text-sky-200">
                <p className="font-semibold">{resubmitTarget.name}</p>
                <p className="text-[11px] opacity-80 mt-0.5">Hồ sơ sẽ chuyển lại bước Duyệt cấp Đơn vị để tiếp tục tiến trình.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Nội dung giải trình / Đã bổ sung</Label>
                <Textarea
                  value={resubmitNote}
                  onChange={(e) => setResubmitNote(e.target.value)}
                  placeholder="Ghi rõ thông tin đã bổ sung hoặc đính kèm tài liệu mới..."
                  rows={3}
                  className="bg-background text-xs resize-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setResubmitTarget(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                disabled={actionLoading}
                onClick={handleConfirmResubmit}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5"
              >
                <Send className="h-4 w-4" />
                {actionLoading ? "Đang gửi..." : "Gửi lại Phê duyệt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 5: View Dossier Detail Modal (4 Tabs) */}
      {viewingDossier && (
        <Dialog open={Boolean(viewingDossier)} onOpenChange={() => setViewingDossier(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <DialogTitle className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chi tiết Hồ sơ: {viewingDossier.code}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {viewingDossier.name}
                  </DialogDescription>
                </div>
                {getStatusBadge(viewingDossier.status)}
              </div>
            </DialogHeader>

            <Tabs value={detailTab} onValueChange={(val) => setDetailTab(val as any)} className="w-full text-xs">
              <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-lg">
                <TabsTrigger value="info" className="text-xs">Thông tin chung</TabsTrigger>
                <TabsTrigger value="attachments" className="text-xs">Tài liệu đính kèm ({viewingDossier.attachments?.length || 0})</TabsTrigger>
                <TabsTrigger value="workflow" className="text-xs">Quy trình phê duyệt</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">Lịch sử xử lý ({viewingDossier.processHistory?.length || 0})</TabsTrigger>
              </TabsList>

              {/* Tab 1: General Info */}
              <TabsContent value="info" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Loại hồ sơ:</span>
                    <span className="font-semibold text-foreground">{viewingDossier.dossierType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Đơn vị lập:</span>
                    <span className="font-semibold text-foreground">{viewingDossier.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Người lập hồ sơ:</span>
                    <span className="font-semibold text-foreground">{viewingDossier.creatorName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ngày khởi tạo:</span>
                    <span className="font-mono text-foreground">{viewingDossier.createdDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Hạn xử lý (SLA):</span>
                    <span className="font-mono font-bold text-emerald-700">{viewingDossier.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Người đang xử lý:</span>
                    <span className="font-semibold text-sky-700 dark:text-sky-400">{viewingDossier.currentHandler}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase text-muted-foreground">Tóm tắt nội dung / Đề xuất:</h4>
                  <div className="p-3 bg-card border border-border/80 rounded-lg text-foreground leading-relaxed">
                    {viewingDossier.summary}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Attachments */}
              <TabsContent value="attachments" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingDossier.attachments && viewingDossier.attachments.length > 0 ? (
                    viewingDossier.attachments.map((att) => (
                      <div key={att.id} className="p-3 border border-border rounded-lg bg-card flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-semibold text-xs truncate">{att.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {(att.size / 1024 / 1024).toFixed(2)} MB • {att.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-7 text-emerald-600 border-emerald-200">
                          Tải về
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center col-span-2 py-6">Chưa có tài liệu đính kèm.</p>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Workflow Diagram */}
              <TabsContent value="workflow" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
                  {(viewingDossier.workflowSteps || []).map((step) => (
                    <div
                      key={step.stepNumber}
                      className={`p-3 rounded-xl border flex flex-col justify-between ${
                        step.status === "completed"
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                          : step.status === "current"
                          ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 text-amber-950 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200"
                          : "bg-muted/30 border-border text-muted-foreground"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs">Bước {step.stepNumber}</span>
                          {step.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          {step.status === "current" && <Clock className="h-4 w-4 text-amber-600 animate-pulse" />}
                        </div>
                        <p className="font-bold text-xs">{step.stepName}</p>
                        <p className="text-[11px] mt-1 font-semibold">{step.roleName}</p>
                        <p className="text-[10px] opacity-80 mt-0.5 line-clamp-1">{step.assigneeName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Tab 4: Process History Log */}
              <TabsContent value="history" className="space-y-3 pt-3">
                <div className="relative border-l-2 border-emerald-500/40 pl-4 ml-2 space-y-4">
                  {(viewingDossier.processHistory || []).map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-background" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">{log.action}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{log.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium mt-0.5">
                          {log.actor} ({log.role})
                        </p>
                        {log.note && (
                          <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded mt-1 border border-border/50">
                            "{log.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setViewingDossier(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
