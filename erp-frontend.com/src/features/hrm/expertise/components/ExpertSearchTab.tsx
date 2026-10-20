import React, { useMemo, useState } from "react"
import {
  Award,
  Briefcase,
  Check,
  CheckCircle,
  Compass,
  Filter,
  GraduationCap,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  ExpertProfileRecord,
  ExpertSearchCriteria,
} from "../types/hrm-expert.types"
import {
  DEGREE_LABELS,
  ROLE_LABELS,
  searchExperts,
} from "../utils/expert-search"

interface ExpertSearchTabProps {
  experts: ExpertProfileRecord[]
  onOpenDetail: (expert: ExpertProfileRecord) => void
  onAssignToProposal: (expert: ExpertProfileRecord) => void
}

export function ExpertSearchTab({
  experts,
  onOpenDetail,
  onAssignToProposal,
}: ExpertSearchTabProps) {
  const [criteria, setCriteria] = useState<ExpertSearchCriteria>({
    keyword: "",
    specialty: "all",
    minYearsOfExperience: 10, // Mặc định tìm cán bộ nòng cốt >= 10 năm
    academicDegree: "all",
    methodology: "Đo từ hàng không", // Tiêu chí ví dụ theo yêu cầu đề bài
    requiredRole: "all",
    hasCertificate: "all",
    fieldworkOnly: false,
  })

  // Tìm kiếm tức thời theo bộ tiêu chí
  const results = useMemo(() => {
    return searchExperts(experts, criteria)
  }, [experts, criteria])

  const handleReset = () => {
    setCriteria({
      keyword: "",
      specialty: "all",
      minYearsOfExperience: 0,
      academicDegree: "all",
      methodology: "all",
      requiredRole: "all",
      hasCertificate: "all",
      fieldworkOnly: false,
    })
  }

  const handleApplyPreset1 = () => {
    // Preset: Chuyên gia Địa vật lý trên 10 năm kinh nghiệm từng tham gia đo từ hàng không (Theo yêu cầu HRM-06)
    setCriteria({
      keyword: "",
      specialty: "all",
      minYearsOfExperience: 10,
      academicDegree: "all",
      methodology: "Đo từ hàng không",
      requiredRole: "all",
      hasCertificate: "all",
      fieldworkOnly: false,
    })
    toast.info("Đã áp dụng bộ lọc mẫu: Địa vật lý ≥ 10 năm kinh nghiệm & Đo từ hàng không")
  }

  const handleApplyPreset2 = () => {
    // Preset: Chủ nhiệm đề án địa chấn có chứng chỉ nổ mìn
    setCriteria({
      keyword: "",
      specialty: "all",
      minYearsOfExperience: 15,
      academicDegree: "all",
      methodology: "Địa chấn phản xạ phân giải cao",
      requiredRole: "lead",
      hasCertificate: "nổ mìn",
      fieldworkOnly: true,
    })
    toast.info("Đã áp dụng bộ lọc mẫu: Chủ nhiệm đề án địa chấn & Chứng chỉ nổ mìn")
  }

  return (
    <div className="space-y-4">
      {/* 1. Thanh gợi ý tìm kiếm nhanh (Presets) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">Bộ lọc tiêu chí mẫu:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyPreset1}
            className="h-7 text-[11px] bg-background hover:bg-primary/10"
          >
            Đo từ hàng không (≥ 10 năm KN)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyPreset2}
            className="h-7 text-[11px] bg-background hover:bg-primary/10"
          >
            Chủ nhiệm địa chấn nổ mìn (≥ 15 năm)
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Đặt lại</span>
        </Button>
      </div>

      {/* 2. Khung bộ lọc đa tiêu chí chuyên sâu */}
      <Card className="border border-border/80 bg-card shadow-xs rounded-xl p-4">
        <div className="space-y-3.5 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1.5 pb-2 border-b border-border/50">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Thiết lập tiêu chí ghép nối nhân sự</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tiêu chí 1: Phương pháp kỹ thuật */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Phương pháp kỹ thuật đã tham gia
              </Label>
              <Select
                value={criteria.methodology}
                onValueChange={(val) => setCriteria({ ...criteria, methodology: val })}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Tất cả phương pháp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tất cả phương pháp</SelectItem>
                  <SelectItem value="Đo từ hàng không" className="text-xs">
                    Đo từ hàng không & Phổ gamma
                  </SelectItem>
                  <SelectItem value="Đo từ & Trọng lực mặt đất" className="text-xs">
                    Đo từ & Trọng lực mặt đất
                  </SelectItem>
                  <SelectItem value="Địa chấn phản xạ phân giải cao" className="text-xs">
                    Địa chấn phản xạ phân giải cao
                  </SelectItem>
                  <SelectItem value="Đo sâu điện phân cực kích thích IP" className="text-xs">
                    Đo sâu điện phân cực kích thích IP
                  </SelectItem>
                  <SelectItem value="Khảo sát địa vật lý bằng Drone" className="text-xs">
                    Khảo sát địa vật lý bằng Drone (UAV)
                  </SelectItem>
                  <SelectItem value="Xử lý 3D" className="text-xs">
                    Xử lý & Mô hình hóa số liệu 3D
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tiêu chí 2: Thâm niên kinh nghiệm */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Kinh nghiệm tối thiểu
              </Label>
              <Select
                value={criteria.minYearsOfExperience.toString()}
                onValueChange={(val) =>
                  setCriteria({ ...criteria, minYearsOfExperience: parseInt(val) || 0 })
                }
              >
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Chọn số năm KN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs">Không yêu cầu</SelectItem>
                  <SelectItem value="5" className="text-xs">Từ 5 năm trở lên</SelectItem>
                  <SelectItem value="10" className="text-xs">Từ 10 năm trở lên (Chuyên gia)</SelectItem>
                  <SelectItem value="15" className="text-xs">Từ 15 năm trở lên (Cao cấp)</SelectItem>
                  <SelectItem value="20" className="text-xs">Từ 20 năm trở lên (Đầu ngành)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tiêu chí 3: Từng làm Chủ nhiệm đề án */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Kinh nghiệm vai trò đề án
              </Label>
              <Select
                value={criteria.requiredRole}
                onValueChange={(val) => setCriteria({ ...criteria, requiredRole: val })}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tất cả vai trò</SelectItem>
                  <SelectItem value="lead" className="text-xs">Đã từng làm Chủ nhiệm</SelectItem>
                  <SelectItem value="chief_engineer" className="text-xs">
                    Đã từng làm Kỹ sư trưởng
                  </SelectItem>
                  <SelectItem value="field_leader" className="text-xs">
                    Đã từng làm Tổ trưởng thực địa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tiêu chí 4: Chứng chỉ chuyên môn */}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Yêu cầu chứng chỉ
              </Label>
              <Select
                value={criteria.hasCertificate}
                onValueChange={(val) => setCriteria({ ...criteria, hasCertificate: val })}
              >
                <SelectTrigger className="h-8.5 text-xs bg-background">
                  <SelectValue placeholder="Không yêu cầu chứng chỉ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Không yêu cầu</SelectItem>
                  <SelectItem value="Khoáng sản Hạng I" className="text-xs">
                    Hành nghề Thăm dò Khoáng sản Hạng I
                  </SelectItem>
                  <SelectItem value="bức xạ" className="text-xs">
                    An toàn bức xạ và hạt nhân
                  </SelectItem>
                  <SelectItem value="nổ mìn" className="text-xs">
                    Nổ mìn kích nổ địa chấn
                  </SelectItem>
                  <SelectItem value="UAV" className="text-xs">
                    Chứng chỉ điều khiển Drone UAV
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="searchFieldwork"
                checked={criteria.fieldworkOnly}
                onCheckedChange={(val) =>
                  setCriteria({ ...criteria, fieldworkOnly: Boolean(val) })
                }
              />
              <Label htmlFor="searchFieldwork" className="text-xs cursor-pointer font-medium">
                Bắt buộc chuyên gia phải sẵn sàng đi thực địa dã ngoại dài ngày
              </Label>
            </div>

            <div className="text-xs text-muted-foreground">
              Tìm thấy <strong className="text-foreground">{results.length}</strong> chuyên gia phù hợp
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Danh sách kết quả ghép nối kèm Match Score */}
      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border/70">
            Không tìm thấy chuyên gia nào đáp ứng toàn bộ các tiêu chí đã chọn. Hãy thử nới lỏng số năm kinh nghiệm hoặc phương pháp.
          </div>
        ) : (
          results.map(({ expert, matchScore, matchedReasons }) => (
            <Card
              key={expert.id}
              className="border border-border/80 bg-card shadow-xs rounded-xl hover:border-primary/50 transition-all overflow-hidden"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Thông tin chính */}
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm font-mono shrink-0 border border-primary/20">
                      {expert.employeeCode.slice(-2)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(expert)}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors text-left"
                        >
                          {expert.fullName}
                        </button>
                        <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60">
                          {expert.employeeCode}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-muted/40">
                          {DEGREE_LABELS[expert.academicDegree] || expert.academicDegree}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">
                          {expert.yearsOfExperience} năm kinh nghiệm
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {expert.position} • {expert.department} •{" "}
                        <strong className="text-foreground">{expert.primarySpecialty}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge & Nút thao tác */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Độ phù hợp:</div>
                      <div
                        className={`text-lg font-extrabold font-mono ${
                          matchScore >= 90
                            ? "text-emerald-600 dark:text-emerald-400"
                            : matchScore >= 70
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {matchScore}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDetail(expert)}
                        className="h-8 text-xs"
                      >
                        Xem CV
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onAssignToProposal(expert)}
                        className="h-8 text-xs gap-1 font-medium bg-primary text-primary-foreground"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Chọn vào đề án</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Các tiêu chí được đáp ứng (Matched Reasons) */}
                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-muted-foreground mr-1">Tiêu chí đáp ứng:</span>
                  {matchedReasons.map((reason, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] gap-1"
                    >
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                      <span>{reason}</span>
                    </Badge>
                  ))}
                </div>

                {/* Tóm tắt kinh nghiệm đề án liên quan */}
                <div className="text-[11px] text-muted-foreground line-clamp-1 bg-muted/20 p-2 rounded-lg">
                  <span className="font-medium text-foreground">Đề án tiêu biểu: </span>
                  {expert.projects
                    .map(
                      (p) =>
                        `${p.projectName} (${ROLE_LABELS[p.role] || p.role})`
                    )
                    .join(" • ") || "Chưa có đề án"}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
