import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  FileSearch,
  FileText,
  Inbox,
  Send,
  FolderKanban,
  Building2,
  Calendar,
  UserCheck,
  Eye,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  History,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getIncomingDocuments } from "@/services/IncomingDocumentService";
import { getOutgoingDocuments } from "@/services/OutgoingDocumentService";
import { getDossiers } from "@/services/DossierService";

export type UnifiedSearchItem = {
  id: string;
  sourceType: "incoming" | "outgoing" | "dossier";
  code: string;
  title: string;
  category: string;
  unit: string;
  creatorOrSender: string;
  status: string;
  createdDate: string;
  dueDate?: string;
  summary: string;
  attachments?: any[];
  processHistory?: any[];
  rawObject: any;
};

export default function DocumentSearchPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<UnifiedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Item for Detail Modal
  const [viewingItem, setViewingItem] = useState<UnifiedSearchItem | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "attachments" | "history">("info");

  const loadData = async () => {
    setLoading(true);
    try {
      const [inDocs, outDocs, dosList] = await Promise.all([
        getIncomingDocuments(),
        getOutgoingDocuments(),
        getDossiers(),
      ]);

      const unified: UnifiedSearchItem[] = [];

      // 1. Incoming Docs
      inDocs.forEach((doc) => {
        unified.push({
          id: doc.id,
          sourceType: "incoming",
          code: doc.documentNumber,
          title: doc.summary,
          category: doc.documentType,
          unit: doc.senderUnit,
          creatorOrSender: doc.senderUnit,
          status: doc.status,
          createdDate: doc.receivedDate || doc.releaseDate,
          dueDate: doc.dueDate,
          summary: doc.summary,
          attachments: doc.attachments,
          processHistory: doc.processHistory,
          rawObject: doc,
        });
      });

      // 2. Outgoing Docs
      outDocs.forEach((doc) => {
        unified.push({
          id: doc.id,
          sourceType: "outgoing",
          code: doc.officialNumber || doc.documentNumber,
          title: doc.summary,
          category: doc.documentType,
          unit: doc.draftingUnit,
          creatorOrSender: doc.drafterName,
          status: doc.status,
          createdDate: doc.submittedDate || doc.issuedDate || doc.createdAt.slice(0, 10),
          summary: doc.summary,
          attachments: doc.attachments,
          processHistory: doc.processHistory,
          rawObject: doc,
        });
      });

      // 3. Dossiers
      dosList.forEach((dos) => {
        unified.push({
          id: dos.id,
          sourceType: "dossier",
          code: dos.code,
          title: dos.name,
          category: dos.dossierType,
          unit: dos.department,
          creatorOrSender: dos.creatorName,
          status: dos.status,
          createdDate: dos.createdDate,
          dueDate: dos.dueDate,
          summary: dos.summary,
          attachments: dos.attachments,
          processHistory: dos.processHistory,
          rawObject: dos,
        });
      });

      setItems(unified);
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể kết nối danh mục tra cứu hợp nhất.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Results
  const filteredItems = items.filter((item) => {
    const matchesQuery =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.creatorOrSender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource =
      sourceFilter === "all" || item.sourceType === sourceFilter;

    const matchesUnit =
      unitFilter === "all" || item.unit === unitFilter;

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesQuery && matchesSource && matchesUnit && matchesStatus;
  });

  // Source Badge Helper
  const getSourceBadge = (sourceType: UnifiedSearchItem["sourceType"]) => {
    switch (sourceType) {
      case "incoming":
        return (
          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 gap-1 font-normal text-[11px]">
            <Inbox className="h-3 w-3 text-sky-600" />
            Văn bản đến
          </Badge>
        );
      case "outgoing":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 gap-1 font-normal text-[11px]">
            <Send className="h-3 w-3 text-purple-600" />
            Văn bản đi
          </Badge>
        );
      case "dossier":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 gap-1 font-normal text-[11px]">
            <FolderKanban className="h-3 w-3 text-emerald-600" />
            Hồ sơ công việc
          </Badge>
        );
    }
  };

  // Status Badge Helper
  const getStatusBadge = (statusStr: string) => {
    if (statusStr.includes("phê duyệt") || statusStr.includes("phát hành") || statusStr.includes("Hoàn thành")) {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">{statusStr}</Badge>;
    }
    if (statusStr.includes("Chờ") || statusStr.includes("xử lý") || statusStr.includes("phân công")) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">{statusStr}</Badge>;
    }
    if (statusStr.includes("bổ sung")) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 text-[10px]">{statusStr}</Badge>;
    }
    if (statusStr.includes("từ chối")) {
      return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 text-[10px]">{statusStr}</Badge>;
    }
    return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px]">{statusStr}</Badge>;
  };

  // Unique Units List
  const uniqueUnits = Array.from(new Set(items.map((i) => i.unit).filter(Boolean)));
  // Unique Statuses List
  const uniqueStatuses = Array.from(new Set(items.map((i) => i.status).filter(Boolean)));

  // Counts
  const incomingCount = items.filter((i) => i.sourceType === "incoming").length;
  const outgoingCount = items.filter((i) => i.sourceType === "outgoing").length;
  const dossierCount = items.filter((i) => i.sourceType === "dossier").length;

  // Navigation Handler
  const handleNavigateToModule = (item: UnifiedSearchItem) => {
    setViewingItem(null);
    if (item.sourceType === "incoming") {
      navigate("/van-ban-ho-so-phe-duyet/van-ban-den");
    } else if (item.sourceType === "outgoing") {
      navigate("/van-ban-ho-so-phe-duyet/van-ban-di");
    } else {
      navigate("/van-ban-ho-so-phe-duyet/quan-ly-ho-so");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-emerald-600" />
            Tra cứu văn bản & Hồ sơ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống tra cứu tập trung thông minh cho toàn bộ Văn bản đến, Văn bản đi và Hồ sơ công việc tại Liên đoàn Vật lý Địa chất.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs gap-1.5 border-dashed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới Kho tra cứu
          </Button>
        </div>
      </div>

      {/* Summary Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setSourceFilter("all")}
          className={`p-4 rounded-xl border text-left transition-all ${
            sourceFilter === "all"
              ? "bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Tất cả dữ liệu kho</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{items.length}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Văn bản & Hồ sơ lưu trữ</p>
        </button>

        <button
          onClick={() => setSourceFilter("incoming")}
          className={`p-4 rounded-xl border text-left transition-all ${
            sourceFilter === "incoming"
              ? "bg-sky-50/90 border-sky-600 ring-2 ring-sky-500/20 dark:bg-sky-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Văn bản đến</p>
          <h3 className="text-2xl font-bold text-sky-600 mt-1">{incomingCount}</h3>
          <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5">Từ cơ quan ngoài & Nội bộ</p>
        </button>

        <button
          onClick={() => setSourceFilter("outgoing")}
          className={`p-4 rounded-xl border text-left transition-all ${
            sourceFilter === "outgoing"
              ? "bg-purple-50/90 border-purple-600 ring-2 ring-purple-500/20 dark:bg-purple-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Văn bản đi</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">{outgoingCount}</h3>
          <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">Ban hành & Trình ký</p>
        </button>

        <button
          onClick={() => setSourceFilter("dossier")}
          className={`p-4 rounded-xl border text-left transition-all ${
            sourceFilter === "dossier"
              ? "bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-950/50"
              : "bg-card border-border hover:bg-muted/40"
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Hồ sơ nghiệp vụ</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{dossierCount}</h3>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">Kế hoạch, Kỹ thuật, Mua sắm...</p>
        </button>
      </div>

      {/* Main Filter & Search Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hồ sơ, số văn bản, trích yếu nội dung, người lập, đơn vị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-9 w-[160px] bg-background text-xs">
                <SelectValue placeholder="Phân loại kho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho dữ liệu</SelectItem>
                <SelectItem value="incoming">Văn bản đến</SelectItem>
                <SelectItem value="outgoing">Văn bản đi</SelectItem>
                <SelectItem value="dossier">Hồ sơ nghiệp vụ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Filter */}
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="h-9 w-[170px] bg-background text-xs">
              <SelectValue placeholder="Đơn vị liên quan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đơn vị</SelectItem>
              {uniqueUnits.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] bg-background text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {uniqueStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Table */}
      <div className="border border-border/80 rounded-lg bg-card shadow-2xs overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border/70">
              <tr>
                <th className="px-4 py-3 w-[120px]">Phân loại</th>
                <th className="px-4 py-3 w-[140px]">Ký hiệu / Mã số</th>
                <th className="px-4 py-3 min-w-[240px]">Trích yếu nội dung / Tên gọi</th>
                <th className="px-4 py-3 w-[160px]">Đơn vị chủ trì / Gửi</th>
                <th className="px-4 py-3 w-[140px]">Người lập / Ký</th>
                <th className="px-4 py-3 w-[100px]">Ngày tạo</th>
                <th className="px-4 py-3 text-center w-[120px]">Trạng thái</th>
                <th className="px-4 py-3 text-right w-[140px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tìm kiếm kho văn bản & hồ sơ...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy văn bản hoặc hồ sơ nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={`${item.sourceType}-${item.id}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {getSourceBadge(item.sourceType)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">
                      {item.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                        Loại: {item.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p className="font-medium text-foreground">{item.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.creatorOrSender || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {item.createdDate}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setViewingItem(item);
                            setDetailTab("info");
                          }}
                          title="Xem chi tiết & Lịch sử"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                          onClick={() => handleNavigateToModule(item)}
                          title="Điều hướng tới trang quản lý chuyên môn"
                        >
                          <ExternalLink className="h-4 w-4" />
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

      {/* Detail & Process History Modal */}
      {viewingItem && (
        <Dialog open={Boolean(viewingItem)} onOpenChange={() => setViewingItem(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  {getSourceBadge(viewingItem.sourceType)}
                  <div>
                    <DialogTitle className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {viewingItem.code}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      {viewingItem.title}
                    </DialogDescription>
                  </div>
                </div>
                {getStatusBadge(viewingItem.status)}
              </div>
            </DialogHeader>

            <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as any)} className="w-full text-xs">
              <TabsList className="grid grid-cols-3 bg-muted/60 p-1 rounded-lg">
                <TabsTrigger value="info" className="text-xs">Thông tin chung</TabsTrigger>
                <TabsTrigger value="attachments" className="text-xs">Tài liệu đính kèm ({viewingItem.attachments?.length || 0})</TabsTrigger>
                <TabsTrigger value="history" className="text-xs">Lịch sử xử lý ({viewingItem.processHistory?.length || 0})</TabsTrigger>
              </TabsList>

              {/* Tab 1: Info */}
              <TabsContent value="info" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Phân loại đối tượng:</span>
                    <span className="font-semibold text-foreground capitalize">
                      {viewingItem.sourceType === "incoming" ? "Văn bản đến" : viewingItem.sourceType === "outgoing" ? "Văn bản đi" : "Hồ sơ công việc"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Loại danh mục:</span>
                    <span className="font-semibold text-foreground">{viewingItem.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Đơn vị liên quan:</span>
                    <span className="font-semibold text-foreground">{viewingItem.unit}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Người lập / Người gửi:</span>
                    <span className="font-semibold text-foreground">{viewingItem.creatorOrSender || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ngày khởi tạo / Ban hành:</span>
                    <span className="font-mono text-foreground">{viewingItem.createdDate}</span>
                  </div>
                  {viewingItem.dueDate && (
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Hạn xử lý (SLA):</span>
                      <span className="font-mono font-bold text-emerald-700">{viewingItem.dueDate}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase text-muted-foreground">Trích yếu / Nội dung tóm tắt:</h4>
                  <div className="p-3 bg-card border border-border/80 rounded-lg text-foreground leading-relaxed">
                    {viewingItem.summary}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Attachments */}
              <TabsContent value="attachments" className="space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingItem.attachments && viewingItem.attachments.length > 0 ? (
                    viewingItem.attachments.map((att: any) => (
                      <div key={att.id || att.name} className="p-3 border border-border rounded-lg bg-card flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-semibold text-xs truncate">{att.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {att.size ? `${(att.size / 1024 / 1024).toFixed(2)} MB` : "Tệp tin"} • {att.uploadedAt || "Mẫu"}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs h-7 text-emerald-600 border-emerald-200">
                          Tải về
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center col-span-2 py-6">Không có tệp đính kèm.</p>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Process History */}
              <TabsContent value="history" className="space-y-3 pt-3">
                <div className="relative border-l-2 border-emerald-500/40 pl-4 ml-2 space-y-4">
                  {(viewingItem.processHistory || []).map((log: any) => (
                    <div key={log.id || log.timestamp} className="relative">
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
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>
                Đóng
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                onClick={() => handleNavigateToModule(viewingItem)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Mở trang chuyên môn
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
