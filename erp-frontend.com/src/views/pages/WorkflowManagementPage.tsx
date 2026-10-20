import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  GitMerge,
  Layers,
  Clock,
  Play,
  Pause,
  UserCheck,
  Building2,
  Sparkles,
  Sliders,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DOSSIER_TYPES } from "@/types/dossier";
import {
  WorkflowConfig,
  WorkflowStepConfig,
  WORKFLOW_ROLES,
  WorkflowRole,
} from "@/types/workflow";
import {
  getWorkflows,
  addWorkflow,
  updateWorkflow,
  toggleWorkflowStatus,
  deleteWorkflow,
  resetWorkflowDemoData,
} from "@/services/WorkflowService";

export default function WorkflowManagementPage() {
  const { toast } = useToast();

  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDossierType, setSelectedDossierType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Selected Workflow for Visual Diagram View Modal
  const [viewingWorkflow, setViewingWorkflow] = useState<WorkflowConfig | null>(null);

  // Editor Modal (Create / Edit Workflow)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDossierType, setFormDossierType] = useState<string>("Kế hoạch");
  const [formDepartment, setFormDepartment] = useState("Toàn Liên đoàn");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVersion, setFormVersion] = useState("v1.0");
  const [formSteps, setFormSteps] = useState<WorkflowStepConfig[]>([]);

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load Workflows
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách quy trình phê duyệt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered List
  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wf.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedDossierType === "all" || wf.dossierType === selectedDossierType;

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && wf.isActive) ||
      (selectedStatus === "inactive" && !wf.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingWorkflowId(null);
    setFormCode(`QT-DEMO-0${workflows.length + 1}`);
    setFormName("");
    setFormDossierType("Kế hoạch");
    setFormDepartment("Toàn Liên đoàn");
    setFormDescription("");
    setFormIsActive(true);
    setFormVersion("v1.0");
    setFormSteps([
      {
        id: "step-new-1",
        stepNumber: 1,
        stepName: "Khởi tạo & Kiểm tra hồ sơ",
        roleName: "Người lập",
        departmentHint: "Cán bộ chuyên trách",
        slaDays: 1,
        isRequired: true,
      },
      {
        id: "step-new-2",
        stepNumber: 2,
        stepName: "Duyệt cấp Đơn vị",
        roleName: "Trưởng đơn vị",
        departmentHint: "Lãnh đạo đơn vị",
        slaDays: 2,
        isRequired: true,
      },
      {
        id: "step-new-3",
        stepNumber: 3,
        stepName: "Thẩm định Chuyên môn",
        roleName: "Phòng chuyên môn",
        departmentHint: "Phòng Kỹ thuật / KH-TC",
        slaDays: 3,
        isRequired: true,
      },
      {
        id: "step-new-4",
        stepNumber: 4,
        stepName: "Phê duyệt Ban hành",
        roleName: "Liên đoàn trưởng",
        departmentHint: "Thủ trưởng cơ quan",
        slaDays: 2,
        isRequired: true,
      },
    ]);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (wf: WorkflowConfig) => {
    setEditingWorkflowId(wf.id);
    setFormCode(wf.code);
    setFormName(wf.name);
    setFormDossierType(wf.dossierType);
    setFormDepartment(wf.department);
    setFormDescription(wf.description);
    setFormIsActive(wf.isActive);
    setFormVersion(wf.version);
    setFormSteps(
      wf.steps.map((s) => ({ ...s }))
    );
    setIsEditorOpen(true);
  };

  // Toggle Active Status
  const handleToggleStatus = async (wf: WorkflowConfig) => {
    try {
      const updated = await toggleWorkflowStatus(wf.id);
      setWorkflows((prev) =>
        prev.map((item) => (item.id === wf.id ? updated : item))
      );
      if (viewingWorkflow?.id === wf.id) {
        setViewingWorkflow(updated);
      }
      toast({
        title: updated.isActive ? "Đã bật quy trình" : "Đã tắt quy trình",
        description: `Quy trình ${updated.code} hiện tại ở trạng thái ${
          updated.isActive ? "Đang áp dụng" : "Tạm dừng"
        }.`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái quy trình.",
        variant: "destructive",
      });
    }
  };

  // Add Step to Form
  const handleAddStep = () => {
    const nextNum = formSteps.length + 1;
    const newStep: WorkflowStepConfig = {
      id: `step-dynamic-${Date.now()}-${nextNum}`,
      stepNumber: nextNum,
      stepName: `Bước ${nextNum}: Duyệt xử lý`,
      roleName: "Phòng chuyên môn",
      departmentHint: "Bộ phận chuyên trách",
      slaDays: 2,
      isRequired: true,
    };
    setFormSteps([...formSteps, newStep]);
  };

  // Update Step Field in Form
  const handleUpdateStep = (index: number, field: keyof WorkflowStepConfig, value: any) => {
    const updated = [...formSteps];
    updated[index] = { ...updated[index], [field]: value };
    setFormSteps(updated);
  };

  // Move Step Up/Down
  const handleMoveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formSteps.length - 1)
    ) {
      return;
    }

    const updated = [...formSteps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate step numbers
    const reordered = updated.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
    }));
    setFormSteps(reordered);
  };

  // Remove Step
  const handleRemoveStep = (index: number) => {
    if (formSteps.length <= 1) {
      toast({
        title: "Không thể xóa",
        description: "Quy trình phê duyệt phải có ít nhất 01 bước.",
        variant: "destructive",
      });
      return;
    }
    const updated = formSteps.filter((_, idx) => idx !== index);
    const reordered = updated.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
    }));
    setFormSteps(reordered);
  };

  // Save Form (Create or Update)
  const handleSaveWorkflow = async () => {
    if (!formCode.trim() || !formName.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Mã quy trình và Tên quy trình.",
        variant: "destructive",
      });
      return;
    }

    if (formSteps.length === 0) {
      toast({
        title: "Thiếu bước phê duyệt",
        description: "Cần thiết lập ít nhất 01 bước trong quy trình.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stepsNormalized = formSteps.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
      }));

      if (editingWorkflowId) {
        const updated = await updateWorkflow(editingWorkflowId, {
          code: formCode.trim(),
          name: formName.trim(),
          dossierType: formDossierType,
          department: formDepartment.trim() || "Toàn Liên đoàn",
          description: formDescription.trim(),
          isActive: formIsActive,
          version: formVersion.trim() || "v1.0",
          steps: stepsNormalized,
        });
        setWorkflows((prev) =>
          prev.map((item) => (item.id === editingWorkflowId ? updated : item))
        );
        if (viewingWorkflow?.id === editingWorkflowId) {
          setViewingWorkflow(updated);
        }
        toast({
          title: "Cập nhật thành công",
          description: `Đã cập nhật cấu hình quy trình ${updated.code}.`,
        });
      } else {
        const newWf = await addWorkflow({
          code: formCode.trim(),
          name: formName.trim(),
          dossierType: formDossierType,
          department: formDepartment.trim() || "Toàn Liên đoàn",
          description: formDescription.trim(),
          isActive: formIsActive,
          version: formVersion.trim() || "v1.0",
          steps: stepsNormalized,
        });
        setWorkflows((prev) => [newWf, ...prev]);
        toast({
          title: "Tạo mới thành công",
          description: `Đã bổ sung quy trình phê duyệt mới: ${newWf.code}.`,
        });
      }

      setIsEditorOpen(false);
    } catch (error) {
      toast({
        title: "Lỗi lưu quy trình",
        description: "Không thể ghi dữ liệu quy trình vào hệ thống.",
        variant: "destructive",
      });
    }
  };

  // Delete Workflow
  const handleDeleteWorkflow = async () => {
    if (!deletingId) return;
    try {
      await deleteWorkflow(deletingId);
      setWorkflows((prev) => prev.filter((item) => item.id !== deletingId));
      if (viewingWorkflow?.id === deletingId) {
        setViewingWorkflow(null);
      }
      toast({
        title: "Đã xóa quy trình",
        description: "Quy trình demo đã được xóa khỏi hệ thống.",
      });
      setDeletingId(null);
    } catch (error) {
      toast({
        title: "Lỗi xóa quy trình",
        description: "Không thể xóa quy trình được chọn.",
        variant: "destructive",
      });
    }
  };

  // Reset Demo
  const handleResetDemo = async () => {
    try {
      const resetList = await resetWorkflowDemoData();
      setWorkflows(resetList);
      setViewingWorkflow(null);
      toast({
        title: "Khôi phục dữ liệu mẫu",
        description: "Đã thiết lập lại dữ liệu các quy trình phê duyệt mặc định.",
      });
    } catch (error) {
      toast({
        title: "Lỗi khôi phục",
        description: "Không thể khôi phục dữ liệu demo.",
        variant: "destructive",
      });
    }
  };

  // Stats
  const activeCount = workflows.filter((w) => w.isActive).length;
  const inactiveCount = workflows.filter((w) => !w.isActive).length;
  const configuredTypesCount = new Set(workflows.map((w) => w.dossierType)).size;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <GitMerge className="h-6 w-6 text-emerald-600" />
            Quy trình phê duyệt
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấu hình, quản lý và theo dõi sơ đồ các bước phê duyệt hồ sơ theo vai trò xử lý tại Liên đoàn Vật lý Địa chất.
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
            Khôi phục Demo
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Tạo quy trình demo mới
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tổng số quy trình</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{workflows.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dữ liệu demo lưu trữ session</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/40">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Quy trình Đang áp dụng</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Sẵn sàng kích hoạt luồng</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/40">
              <Play className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Quy trình Tạm dừng</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{inactiveCount}</h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Mô phỏng bật/tắt demo</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/40">
              <Pause className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Loại hồ sơ áp dụng</p>
              <h3 className="text-2xl font-bold text-sky-600 mt-1">{configuredTypesCount}</h3>
              <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">Cấu hình luồng riêng</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl dark:bg-sky-950/40">
              <Sliders className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm mã quy trình, tên quy trình, mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dossier Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />
            <Select value={selectedDossierType} onValueChange={setSelectedDossierType}>
              <SelectTrigger className="h-9 w-[180px] bg-background text-xs">
                <SelectValue placeholder="Loại hồ sơ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hồ sơ</SelectItem>
                {DOSSIER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-9 w-[150px] bg-background text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang áp dụng</SelectItem>
              <SelectItem value="inactive">Tạm dừng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Default Flow Info Banner */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-900 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-emerald-900 dark:text-emerald-300">
            Luồng mặc định tiêu chuẩn Liên đoàn:
          </p>
          <p className="text-emerald-800 dark:text-emerald-400">
            <span className="font-semibold">Người lập</span> ➔ <span className="font-semibold">Trưởng đơn vị</span> ➔ <span className="font-semibold">Phòng chuyên môn</span> ➔ <span className="font-semibold">Phó Liên đoàn trưởng</span> ➔ <span className="font-semibold">Liên đoàn trưởng</span>.
          </p>
          <p className="text-emerald-700/80 dark:text-emerald-500 text-[11px]">
            Hệ thống hỗ trợ tùy chỉnh linh hoạt các bước, vai trò và số ngày SLA riêng biệt cho từng loại hồ sơ (Mua sắm, Nghiệm thu, Nghỉ phép...).
          </p>
        </div>
      </div>

      {/* Main List Table */}
      <div className="border border-border/80 rounded-lg bg-card shadow-2xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border/70">
              <tr>
                <th className="px-4 py-3 w-[100px]">Mã QT</th>
                <th className="px-4 py-3 min-w-[220px]">Tên Quy trình & Mô tả</th>
                <th className="px-4 py-3 w-[150px]">Loại hồ sơ áp dụng</th>
                <th className="px-4 py-3 w-[160px]">Đơn vị phụ trách</th>
                <th className="px-4 py-3 text-center w-[90px]">Số bước</th>
                <th className="px-4 py-3 text-center w-[130px]">Trạng thái</th>
                <th className="px-4 py-3 text-right w-[150px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải dữ liệu quy trình phê duyệt...
                  </td>
                </tr>
              ) : filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy quy trình phê duyệt nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((wf) => (
                  <tr key={wf.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                      {wf.code}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {wf.version}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{wf.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {wf.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="bg-emerald-50/50 text-emerald-800 border-emerald-200 text-[11px] font-normal dark:bg-emerald-950/40 dark:text-emerald-300">
                        {wf.dossierType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{wf.department}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-foreground text-xs">
                        {wf.steps.length} bước
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={wf.isActive}
                          onCheckedChange={() => handleToggleStatus(wf)}
                        />
                        <span className={`text-[11px] font-medium ${wf.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {wf.isActive ? "Áp dụng" : "Tạm dừng"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          onClick={() => setViewingWorkflow(wf)}
                          title="Xem sơ đồ quy trình"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/50"
                          onClick={() => handleOpenEdit(wf)}
                          title="Chỉnh sửa quy trình"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => setDeletingId(wf.id)}
                          title="Xóa quy trình"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Workflow Diagram View Modal */}
      {viewingWorkflow && (
        <Dialog open={Boolean(viewingWorkflow)} onOpenChange={() => setViewingWorkflow(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <GitMerge className="h-5 w-5" />
                    Sơ đồ quy trình phê duyệt: {viewingWorkflow.code}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1">
                    {viewingWorkflow.name} ({viewingWorkflow.dossierType})
                  </DialogDescription>
                </div>
                <Badge className={viewingWorkflow.isActive ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}>
                  {viewingWorkflow.isActive ? "Đang áp dụng" : "Tạm dừng"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* General Description */}
              <div className="bg-muted/40 p-3 rounded-lg border border-border/60 text-xs space-y-1">
                <p><span className="font-semibold">Đơn vị chủ trì:</span> {viewingWorkflow.department}</p>
                <p><span className="font-semibold">Mô tả luồng:</span> {viewingWorkflow.description}</p>
                <p><span className="font-semibold">Tổng thời gian SLA chuẩn:</span> {viewingWorkflow.steps.reduce((sum, s) => sum + s.slaDays, 0)} ngày làm việc</p>
              </div>

              {/* Visual Flow Stepper Diagram */}
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Sơ đồ thứ tự các bước phê duyệt ({viewingWorkflow.steps.length} bước)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {viewingWorkflow.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="relative bg-card border border-emerald-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between dark:border-emerald-900 hover:border-emerald-500 transition-colors"
                    >
                      {/* Step Header */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                            {step.stepNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                            SLA: {step.slaDays} ngày
                          </span>
                        </div>
                        <h5 className="font-bold text-xs text-foreground line-clamp-2">
                          {step.stepName}
                        </h5>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <UserCheck className="h-3 w-3 shrink-0" />
                          {step.roleName}
                        </p>
                        {step.departmentHint && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                            ({step.departmentHint})
                          </p>
                        )}
                        {step.description && (
                          <p className="text-[10px] text-muted-foreground mt-1 bg-muted/30 p-1 rounded italic">
                            "{step.description}"
                          </p>
                        )}
                      </div>

                      {/* Connection Arrow indicator for Desktop */}
                      {idx < viewingWorkflow.steps.length - 1 && (
                        <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-4 h-4 bg-emerald-600 text-white rounded-full items-center justify-center shadow-xs">
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps Detail Table */}
              <div className="border border-border/70 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-semibold border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-center w-[50px]">Bước</th>
                      <th className="px-3 py-2">Tên bước phê duyệt</th>
                      <th className="px-3 py-2">Vai trò xử lý</th>
                      <th className="px-3 py-2">Đơn vị / Ghi chú Hướng dẫn</th>
                      <th className="px-3 py-2 text-center w-[90px]">SLA (Ngày)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {viewingWorkflow.steps.map((step) => (
                      <tr key={step.id}>
                        <td className="px-3 py-2 text-center font-bold text-emerald-700">
                          #{step.stepNumber}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">{step.stepName}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-800 dark:text-emerald-300">
                          {step.roleName}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {step.departmentHint || "-"}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-semibold">
                          {step.slaDays} ngày
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setViewingWorkflow(null)}>
                Đóng
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                onClick={() => {
                  const wf = viewingWorkflow;
                  setViewingWorkflow(null);
                  handleOpenEdit(wf);
                }}
              >
                <Edit className="h-3.5 w-3.5" />
                Chỉnh sửa quy trình này
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Editor Modal (Create / Edit Workflow) */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <GitMerge className="h-5 w-5" />
              {editingWorkflowId ? "Chỉnh sửa Cấu hình Quy trình" : "Tạo Quy trình Phê duyệt Demo Mới"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thiết lập mã quy trình, tên bước, vai trò xử lý và thứ tự thực hiện theo quy định của Liên đoàn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Mã quy trình <span className="text-red-500">*</span></Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. QT-KH-01"
                  className="bg-background h-8 text-xs font-mono font-semibold"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">Tên quy trình phê duyệt <span className="text-red-500">*</span></Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Quy trình Phê duyệt Hồ sơ Kế hoạch & Dự toán..."
                  className="bg-background h-8 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Loại hồ sơ áp dụng</Label>
                <Select value={formDossierType} onValueChange={setFormDossierType}>
                  <SelectTrigger className="h-8 bg-background text-xs">
                    <SelectValue placeholder="Chọn loại hồ sơ" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSSIER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Đơn vị chủ trì / Phụ trách</Label>
                <Input
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="e.g. Toàn Liên đoàn / Phòng Kỹ thuật"
                  className="bg-background h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Trạng thái áp dụng</Label>
                <div className="flex items-center gap-2 h-8 pt-1">
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                  <span className={formIsActive ? "font-semibold text-emerald-600" : "text-muted-foreground"}>
                    {formIsActive ? "Kích hoạt (Đang áp dụng)" : "Tạm dừng"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs font-medium">Mô tả mục đích / Phạm vi quy trình</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết mục đích áp dụng luồng..."
                  rows={2}
                  className="bg-background text-xs resize-none"
                />
              </div>
            </div>

            {/* Steps Builder Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h4 className="font-bold text-xs uppercase text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    Cấu hình danh sách các bước phê duyệt ({formSteps.length} bước)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Định nghĩa thứ tự, tên bước, vai trò phê duyệt và thời gian SLA tối đa từng bước.
                  </p>
                </div>
                <Button
                  onClick={handleAddStep}
                  variant="outline"
                  size="sm"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-xs gap-1 dark:bg-emerald-950 dark:border-emerald-900"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm bước mới
                </Button>
              </div>

              <div className="space-y-3">
                {formSteps.map((step, index) => (
                  <div
                    key={step.id || index}
                    className="p-3 bg-card border border-border/80 rounded-lg shadow-2xs space-y-2 relative"
                  >
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-xs text-foreground">
                          Bước {index + 1}
                        </span>
                      </div>

                      {/* Action buttons: Move Up, Move Down, Delete */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => handleMoveStep(index, "up")}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={index === formSteps.length - 1}
                          onClick={() => handleMoveStep(index, "down")}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStep(index)}
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Xóa bước này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-[11px] text-muted-foreground">Tên bước phê duyệt</Label>
                        <Input
                          value={step.stepName}
                          onChange={(e) => handleUpdateStep(index, "stepName", e.target.value)}
                          placeholder="e.g. Duyệt cấp Đơn vị..."
                          className="h-7 text-xs bg-background"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Vai trò xử lý</Label>
                        <Select
                          value={step.roleName}
                          onValueChange={(val) => handleUpdateStep(index, "roleName", val)}
                        >
                          <SelectTrigger className="h-7 bg-background text-xs">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            {WORKFLOW_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Thời gian SLA (Ngày)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={step.slaDays}
                          onChange={(e) =>
                            handleUpdateStep(index, "slaDays", parseInt(e.target.value) || 1)
                          }
                          className="h-7 text-xs bg-background font-mono"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-4">
                        <Label className="text-[11px] text-muted-foreground">
                          Ghi chú / Đơn vị thực hiện chi tiết
                        </Label>
                        <Input
                          value={step.departmentHint || ""}
                          onChange={(e) =>
                            handleUpdateStep(index, "departmentHint", e.target.value)
                          }
                          placeholder="e.g. Trưởng Phòng Kế hoạch - Tài chính..."
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              {editingWorkflowId ? "Lưu thay đổi quy trình" : "Tạo quy trình mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      {deletingId && (
        <Dialog open={Boolean(deletingId)} onOpenChange={() => setDeletingId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Xác nhận xóa quy trình demo
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Bạn có chắc chắn muốn xóa quy trình này? Thao tác này sẽ loại bỏ quy trình khỏi danh sách cấu hình demo.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="border-t border-border pt-3 mt-4">
              <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>
                Hủy
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteWorkflow}>
                Xác nhận Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
