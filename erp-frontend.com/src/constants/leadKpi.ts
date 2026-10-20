export type LeadKpiCriterionId =
  | "attendance"
  | "deadline"
  | "self_data"
  | "telesale"
  | "quote"
  | "meeting"
  | "convert"

export interface LeadKpiCriterion {
  id: LeadKpiCriterionId
  stt: string
  title: string
  goal: string
  highlightGoal?: boolean
  weight: number
  scoring: string
  source: string
  actualLabel: string
}

export const LEAD_KPI_CRITERIA: LeadKpiCriterion[] = [
  {
    id: "attendance",
    stt: "1",
    title: "Chấm công",
    goal: "≥ 19 công/tháng",
    weight: 10,
    scoring: "≥ 19 công: +10% | < 19 công: -10%",
    source: "Bảng chấm công (HCNS)",
    actualLabel: "Số công",
  },
  {
    id: "deadline",
    stt: "3",
    title: "Deadline công việc",
    goal: "Hoàn thành đúng hạn, đủ 100% công việc",
    highlightGoal: true,
    weight: 30,
    scoring: "Đúng hạn: +30% | Mỗi lần chậm: -10% (tối đa 3 lần)",
    source: "Check list công việc",
    actualLabel: "Số lần chậm",
  },
  {
    id: "self_data",
    stt: "4",
    title: "Tự tìm kiếm data theo mục tiêu tháng",
    goal: "≥ 60 data đúng insight/tháng (~2 data/ngày)",
    weight: 20,
    scoring: "≥ 60 data: +20% | < 60 data: -10%",
    source: "Quản lý Database theo tháng",
    actualLabel: "Số data",
  },
  {
    id: "telesale",
    stt: "5.1",
    title: "Xử lý data – Telesale",
    goal: "Telesale ≥ 80% tổng data được giao",
    weight: 10,
    scoring: "≥ 80%: +10% | < 80%: -10%",
    source: "Quản lý Database theo tháng",
    actualLabel: "% telesale",
  },
  {
    id: "quote",
    stt: "5.2",
    title: "Xử lý data – Báo giá",
    goal: "Báo giá ≥ 50% tổng data đúng insight",
    weight: 10,
    scoring: "≥ 50%: +10% | < 50%: -10%",
    source: "Quản lý Database theo tháng",
    actualLabel: "% báo giá",
  },
  {
    id: "meeting",
    stt: "5.3",
    title: "Xử lý data – Hẹn gặp",
    goal: "Hẹn gặp ≥ 20% tổng KH đã báo giá",
    highlightGoal: true,
    weight: 10,
    scoring: "≥ 20%: +10% | 10% ≤ HG < 20%: 0% | < 10%: -10%",
    source: "Quản lý Database theo tháng",
    actualLabel: "% hẹn gặp",
  },
  {
    id: "convert",
    stt: "5.4",
    title: "Xử lý data – Khách hàng mới chuyển đổi",
    goal: "≥ 8 KH mới/tháng",
    weight: 10,
    scoring: "≥ 8: +10% | 4 < KH mới < 8: 0% | ≤ 4: -10%",
    source: "Quản lý Database theo tháng",
    actualLabel: "Số KH mới",
  },
]

export function scoreLeadKpi(id: LeadKpiCriterionId, actual: number) {
  switch (id) {
    case "attendance":
      return actual >= 19 ? 10 : -10
    case "deadline": {
      const late = Math.max(0, actual)
      return 30 - Math.min(late, 3) * 10
    }
    case "self_data":
      return actual >= 60 ? 20 : -10
    case "telesale":
      return actual >= 80 ? 10 : -10
    case "quote":
      return actual >= 50 ? 10 : -10
    case "meeting":
      if (actual >= 20) return 10
      if (actual >= 10) return 0
      return -10
    case "convert":
      if (actual >= 8) return 10
      if (actual > 4) return 0
      return -10
  }
}

export function emptyLeadKpiActuals(): Record<LeadKpiCriterionId, number> {
  return {
    attendance: 0,
    deadline: 0,
    self_data: 0,
    telesale: 0,
    quote: 0,
    meeting: 0,
    convert: 0,
  }
}

export function evaluateLeadKpi(actuals: Record<LeadKpiCriterionId, number>) {
  const breakdown = LEAD_KPI_CRITERIA.map((criterion) => {
    const actual = actuals[criterion.id] ?? 0
    const percent = scoreLeadKpi(criterion.id, actual)
    return { criterion, actual, percent }
  })
  const total = breakdown.reduce((sum, item) => sum + item.percent, 0)
  return { breakdown, total, ...classifyLeadKpi(total) }
}

export function classifyLeadKpi(total: number) {
  if (total >= 90) return { grade: "A – Tốt", coefficient: 1 }
  if (total >= 70) return { grade: "B – Đạt", coefficient: 0.8 }
  return { grade: "C – Cần cải thiện", coefficient: 0.6 }
}

export const LEAD_KPI_RATING_SCALE = [
  {
    grade: "A – Tốt",
    range: "≥ 90%",
    description: "Hoàn thành vượt trội toàn bộ tiêu chí dẫn",
    coefficient: "1.00",
    action: "Ghi nhận, duy trì",
  },
  {
    grade: "B – Đạt",
    range: "70% – 89%",
    description: "Đạt yêu cầu cơ bản",
    coefficient: "0.80",
    action: "Chỉ ra điểm cần nâng",
  },
  {
    grade: "C – Cần cải thiện",
    range: "< 70%",
    description: "Không đạt nhiều tiêu chí trọng số cao",
    coefficient: "0.60",
    action: "Nhắc nhở - kèm cặp cải thiện",
  },
]
