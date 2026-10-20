import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  UserCheck,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Lock,
  RefreshCw,
  Eye,
  FileSearch,
  MessageSquare,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { DossierProcessLog, Dossier } from "@/types/dossier";
import { getAllApprovalLogs, getDossiers } from "@/services/DossierService";

export default function ApprovalLogsPage() {
  const { toast } = useToast();

  const [logs, setLogs] = useState<DossierProcessLog[]>([]);
  const [dossiersMap, setDossiersMap] = useState<Record<string, Dossier>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("all");
  const [selectedActorFilter, setSelectedActorFilter] = useState<string>("all");

  // Log Detail View Modal
  const [viewingLog, setViewingLog] = useState<DossierProcessLog | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const logList = await getAllApprovalLogs();
      const dossierList = await getDossiers();

      const map: Record<string, Dossier> = {};
      dossierList.forEach((dos) => {
        map[dos.id] = dos;
        map[dos.code] = dos;
      });

      setLogs(logList);
      setDossiersMap(map);
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách nhật ký phê duyệt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.dossierCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.dossierName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.note || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      selectedActionFilter === "all" ||
      (selectedActionFilter === "approve" && log.action.includes("Phê duyệt")) ||
      (selectedActionFilter === "request_change" && log.action.includes("bổ sung")) ||
      (selectedActionFilter === "reject" && log.action.includes("Từ chối")) ||
      (selectedActionFilter === "submit" && (log.action.includes("Gửi") || log.action.includes("Tạo")));

    const matchesActor =
      selectedActorFilter === "all" || log.actor === selectedActorFilter;

    return matchesSearch && matchesAction && matchesActor;
  });

  // Action Badge Helper
  const getActionBadge = (action: string) => {
    if (action.includes("Phê duyệt")) {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1 font-normal text-[11px]">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {action}
        </Badge>
      );
    }
    if (action.includes("Từ chối")) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-1 font-normal text-[11px]">
          <XCircle className="h-3 w-3 text-red-600" />
          {action}
        </Badge>
      );
    }
    if (action.includes("bổ sung") || action.includes("Yêu cầu")) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1 font-normal text-[11px]">
          <AlertCircle className="h-3 w-3 text-amber-600" />
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 font-normal text-[11px]">
        {action}
      </Badge>
    );
  };

  // Status Badge Helper
  const getStatusBadge = (statusStr?: string) => {
    if (!statusStr) return <span className="text-muted-foreground">-</span>;
    if (statusStr === "Đã phê duyệt") {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Đã phê duyệt</Badge>;
    }
    if (statusStr === "Bị từ chối") {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">Bị từ chối</Badge>;
    }
    if (statusStr === "Yêu cầu bổ sung") {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">Cần bổ sung</Badge>;
    }
    return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px]">{statusStr}</Badge>;
  };

  // Unique Actors list
  const uniqueActors = Array.from(new Set(logs.map((l) => l.actor)));

  // Stats
  const approveCount = logs.filter((l) => l.action.includes("Phê duyệt")).length;
  const requestChangeCount = logs.filter((l) => l.action.includes("bổ sung")).length;
  const rejectCount = logs.filter((l) => l.action.includes("Từ chối")).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-emerald-600" />
            Nhật ký phê duyệt
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lịch sử toàn bộ các hoạt động trình duyệt, phê duyệt, từ chối và yêu cầu bổ sung hồ sơ được ghi nhận bất biến (Audit Trail).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-900 text-slate-100 border-slate-700 px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            Nhật ký Bảo mật Cố định (Immutable)
          </Badge>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Tổng nhật ký ghi nhận</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{logs.length}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Lịch sử toàn bộ hồ sơ</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/40">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lượt Phê duyệt</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{approveCount}</h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Thông qua thành công</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/40">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lượt Yêu cầu bổ sung</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{requestChangeCount}</h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">Trả về sửa đổi</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/40">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lượt Từ chối</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">{rejectCount}</h3>
              <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">Dừng quy trình</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl dark:bg-red-950/40">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hồ sơ, tên hồ sơ, người thực hiện, nội dung ý kiến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />
            <Select value={selectedActionFilter} onValueChange={setSelectedActionFilter}>
              <SelectTrigger className="h-9 w-[170px] bg-background text-xs">
                <SelectValue placeholder="Loại hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="approve">Phê duyệt</SelectItem>
                <SelectItem value="request_change">Yêu cầu bổ sung</SelectItem>
                <SelectItem value="reject">Từ chối hồ sơ</SelectItem>
                <SelectItem value="submit">Tạo mới & Trình duyệt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actor Filter */}
          <Select value={selectedActorFilter} onValueChange={setSelectedActorFilter}>
            <SelectTrigger className="h-9 w-[180px] bg-background text-xs">
              <SelectValue placeholder="Người thực hiện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả người thực hiện</SelectItem>
              {uniqueActors.map((actor) => (
                <SelectItem key={actor} value={actor}>
                  {actor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Immutable Notice Banner */}
      <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-800 flex items-start gap-2.5 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Quy định Lưu trữ Nhật ký Phê duyệt (Audit Trail Integrity):</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Nhật ký ghi lại tự động mọi tác vụ khi người dùng thực hiện Phê duyệt, Từ chối, Yêu cầu bổ sung hoặc Gửi lại hồ sơ. Để đảm bảo tính trung thực và minh bạch pháp lý, giao diện hệ thống <strong>KHÔNG</strong> cung cấp chức năng chỉnh sửa hoặc xóa các dòng nhật ký này.
          </p>
        </div>
      </div>

      {/* Audit Trail Logs Table */}
      <div className="border border-border/80 rounded-lg bg-card shadow-2xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border/70">
              <tr>
                <th className="px-4 py-3 w-[140px]">Thời điểm</th>
                <th className="px-4 py-3 w-[120px]">Mã hồ sơ</th>
                <th className="px-4 py-3 min-w-[200px]">Hồ sơ liên quan</th>
                <th className="px-4 py-3 w-[160px]">Người thực hiện / Vai trò</th>
                <th className="px-4 py-3 w-[170px]">Hành động</th>
                <th className="px-4 py-3 w-[200px]">Chuyển đổi trạng thái</th>
                <th className="px-4 py-3 min-w-[220px]">Ý kiến / Ghi chú xử lý</th>
                <th className="px-4 py-3 text-right w-[70px]">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải nhật ký phê duyệt...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy nhật ký hoạt động nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                      {log.dossierCode || "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground line-clamp-2">
                      {log.dossierName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{log.actor}</p>
                      <p className="text-[10px] text-muted-foreground">{log.role}</p>
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(log.previousStatus)}
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        {getStatusBadge(log.nextStatus)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.note ? (
                        <p className="text-[11px] text-muted-foreground bg-muted/30 p-1.5 rounded italic border border-border/40 line-clamp-2">
                          "{log.note}"
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-[10px] italic">Không có ghi chú</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setViewingLog(log)}
                        title="Xem chi tiết nhật ký này"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {viewingLog && (
        <Dialog open={Boolean(viewingLog)} onOpenChange={() => setViewingLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <History className="h-5 w-5" />
                Chi tiết Nhật ký Hoạt động Phê duyệt
              </DialogTitle>
              <DialogDescription className="text-xs">
                Sự kiện ghi nhận vào lúc {viewingLog.timestamp}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-lg border border-border/60 space-y-2">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Mã & Tên hồ sơ:</span>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    {viewingLog.dossierCode}: {viewingLog.dossierName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Người thực hiện:</span>
                    <span className="font-semibold text-foreground">{viewingLog.actor}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Vai trò:</span>
                    <span className="font-semibold text-foreground">{viewingLog.role}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-muted-foreground uppercase">Hành động thực hiện:</span>
                  {getActionBadge(viewingLog.action)}
                </div>

                <div className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Trạng thái trước:</span>
                    {getStatusBadge(viewingLog.previousStatus)}
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Trạng thái sau:</span>
                    {getStatusBadge(viewingLog.nextStatus)}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-xs text-muted-foreground uppercase">Ý kiến chỉ đạo / Ghi chú xử lý:</span>
                <div className="p-3 bg-muted/40 border border-border/80 rounded-lg text-foreground italic leading-relaxed">
                  "{viewingLog.note || "Không có ý kiến bổ sung."}"
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" size="sm" onClick={() => setViewingLog(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
