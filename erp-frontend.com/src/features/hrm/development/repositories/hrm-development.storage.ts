import type {
  EvaluationRecord,
  RewardDisciplineRecord,
  SalaryIncreaseRecord,
  TrainingRecord,
} from "../types/hrm-development.types.ts"

const STORAGE_KEY_PREFIX = "hrm_development_db_v1"

const INITIAL_TRAININGS: TrainingRecord[] = [
  {
    id: "trn-001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    courseName: "Bồi dưỡng an toàn lao động trong thăm dò địa vật lý mỏ",
    institution: "Viện Khoa học An toàn & Vệ sinh Lao động",
    trainingType: "chung_chi",
    startDate: "2025-04-10",
    endDate: "2025-04-20",
    cost: 4500000,
    result: "Đạt chứng chỉ loại Giỏi",
    status: "completed",
    createdAt: "2025-04-21T08:00:00Z",
  },
  {
    id: "trn-002",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    courseName: "Ứng dụng phần mềm xử lý dữ liệu từ - trọng lực tiên tiến",
    institution: "Trường Đại học Mỏ - Địa chất Hà Nội",
    trainingType: "tap_huan",
    startDate: "2025-08-05",
    endDate: "2025-08-15",
    cost: 6200000,
    result: "Hoàn thành xuất sắc",
    status: "completed",
    createdAt: "2025-08-16T09:00:00Z",
  },
  {
    id: "trn-003",
    userId: "user-3",
    employeeCode: "CB-0003",
    fullName: "Trần Thị Mai",
    courseName: "Đào tạo nghiệp vụ Quản lý tài chính dự án thăm dò khoáng sản",
    institution: "Học viện Tài chính",
    trainingType: "tai_chuc",
    startDate: "2026-02-15",
    endDate: "2026-05-30",
    cost: 8500000,
    result: "Đang theo học",
    status: "ongoing",
    createdAt: "2026-02-10T14:00:00Z",
  },
]

const INITIAL_SALARY_INCREASES: SalaryIncreaseRecord[] = [
  {
    id: "sal-001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    decisionNumber: "45/QĐ-LĐVLĐC",
    decisionDate: "2025-06-25",
    effectiveDate: "2025-07-01",
    payGrade: "Kỹ sư địa chất chính (Mã ngạch V.05.02.06)",
    oldStep: 2,
    oldCoefficient: 4.74,
    newStep: 3,
    newCoefficient: 5.08,
    type: "regular",
    signatory: "Liên đoàn trưởng",
    notes: "Nâng bậc lương định kỳ 3 năm",
    createdAt: "2025-06-26T10:00:00Z",
  },
  {
    id: "sal-002",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    decisionNumber: "88/QĐ-LĐVLĐC",
    decisionDate: "2025-11-20",
    effectiveDate: "2025-12-01",
    payGrade: "Kỹ sư địa chất (Mã ngạch V.05.02.07)",
    oldStep: 3,
    oldCoefficient: 3.0,
    newStep: 4,
    newCoefficient: 3.33,
    type: "early",
    signatory: "Liên đoàn trưởng",
    notes: "Nâng bậc trước thời hạn 6 tháng do đạt danh hiệu Chiến sĩ thi đua",
    createdAt: "2025-11-21T08:30:00Z",
  },
]

const INITIAL_EVALUATIONS: EvaluationRecord[] = [
  {
    id: "eva-001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    year: 2025,
    period: "year",
    classification: "xuat_sac",
    score: 96,
    achievements: "Hoàn thành vượt mức kế hoạch công tác thực địa các đề án trọng điểm của Liên đoàn.",
    limitations: "Cần tăng cường chuyển giao kỹ thuật phân tích số liệu cho kỹ sư trẻ.",
    evaluator: "Hội đồng Đánh giá Liên đoàn",
    approvalDate: "2025-12-28",
    createdAt: "2025-12-29T10:00:00Z",
  },
  {
    id: "eva-002",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    year: 2025,
    period: "year",
    classification: "tot",
    score: 88,
    achievements: "Chấp hành tốt kỷ luật lao động, hoàn thành đúng tiến độ các báo cáo chuyên môn địa vật lý.",
    limitations: "Cần chủ động hơn trong công tác nghiên cứu đề tài ứng dụng công nghệ mới.",
    evaluator: "Trưởng phòng Kỹ thuật",
    approvalDate: "2025-12-26",
    createdAt: "2025-12-27T09:00:00Z",
  },
  {
    id: "eva-003",
    userId: "user-3",
    employeeCode: "CB-0003",
    fullName: "Trần Thị Mai",
    year: 2025,
    period: "year",
    classification: "tot",
    score: 89,
    achievements: "Thực hiện tốt công tác kế toán, quản lý tài chính minh bạch, quyết toán đề án đúng hạn.",
    limitations: "Không có",
    evaluator: "Trưởng phòng Kế hoạch - Tài chính",
    approvalDate: "2025-12-27",
    createdAt: "2025-12-28T09:00:00Z",
  },
]

const INITIAL_REWARDS_DISCIPLINES: RewardDisciplineRecord[] = [
  {
    id: "rd-001",
    userId: "user-1",
    employeeCode: "CB-0001",
    fullName: "Vũ Đình Nam",
    category: "reward",
    form: "Chiến sĩ thi đua cơ sở",
    decisionNumber: "112/QĐ-LĐVLĐC",
    decisionDate: "2025-12-30",
    effectiveDate: "2025-12-30",
    issuer: "Liên đoàn Vật lý Địa chất",
    reason: "Đạt thành tích xuất sắc trong công tác chuyên môn và đề án đo vẽ địa vật lý năm 2025",
    createdAt: "2025-12-31T08:00:00Z",
  },
  {
    id: "rd-002",
    userId: "user-2",
    employeeCode: "CB-0002",
    fullName: "Nguyễn Văn Tuấn",
    category: "reward",
    form: "Giấy khen Liên đoàn trưởng",
    decisionNumber: "115/QĐ-LĐVLĐC",
    decisionDate: "2025-12-30",
    effectiveDate: "2025-12-30",
    issuer: "Liên đoàn Vật lý Địa chất",
    reason: "Có sáng kiến cải tiến quy trình thu thập dữ liệu hiện trường",
    createdAt: "2025-12-31T08:30:00Z",
  },
]

export class HrmDevelopmentRepository {
  private getStorageKey(subKey: string): string {
    return `${STORAGE_KEY_PREFIX}_${subKey}`
  }

  // --- 1. Đào tạo ---
  getTrainings(): TrainingRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey("trainings"))
      if (!raw) {
        this.saveAllTrainings(INITIAL_TRAININGS)
        return INITIAL_TRAININGS
      }
      return JSON.parse(raw) as TrainingRecord[]
    } catch {
      return INITIAL_TRAININGS
    }
  }

  saveTraining(item: TrainingRecord): void {
    const list = this.getTrainings()
    const index = list.findIndex((x) => x.id === item.id)
    if (index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    this.saveAllTrainings(list)
  }

  deleteTraining(id: string): void {
    const list = this.getTrainings().filter((x) => x.id !== id)
    this.saveAllTrainings(list)
  }

  private saveAllTrainings(list: TrainingRecord[]) {
    try {
      localStorage.setItem(this.getStorageKey("trainings"), JSON.stringify(list))
    } catch (e) {
      console.error("Failed to save trainings to storage", e)
    }
  }

  // --- 2. Nâng bậc lương ---
  getSalaryIncreases(): SalaryIncreaseRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey("salaries"))
      if (!raw) {
        this.saveAllSalaryIncreases(INITIAL_SALARY_INCREASES)
        return INITIAL_SALARY_INCREASES
      }
      return JSON.parse(raw) as SalaryIncreaseRecord[]
    } catch {
      return INITIAL_SALARY_INCREASES
    }
  }

  saveSalaryIncrease(item: SalaryIncreaseRecord): void {
    const list = this.getSalaryIncreases()
    const index = list.findIndex((x) => x.id === item.id)
    if (index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    this.saveAllSalaryIncreases(list)
  }

  deleteSalaryIncrease(id: string): void {
    const list = this.getSalaryIncreases().filter((x) => x.id !== id)
    this.saveAllSalaryIncreases(list)
  }

  private saveAllSalaryIncreases(list: SalaryIncreaseRecord[]) {
    try {
      localStorage.setItem(this.getStorageKey("salaries"), JSON.stringify(list))
    } catch (e) {
      console.error("Failed to save salary increases to storage", e)
    }
  }

  // --- 3. Đánh giá xếp loại ---
  getEvaluations(): EvaluationRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey("evaluations"))
      if (!raw) {
        this.saveAllEvaluations(INITIAL_EVALUATIONS)
        return INITIAL_EVALUATIONS
      }
      return JSON.parse(raw) as EvaluationRecord[]
    } catch {
      return INITIAL_EVALUATIONS
    }
  }

  saveEvaluation(item: EvaluationRecord): void {
    const list = this.getEvaluations()
    const index = list.findIndex((x) => x.id === item.id)
    if (index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    this.saveAllEvaluations(list)
  }

  deleteEvaluation(id: string): void {
    const list = this.getEvaluations().filter((x) => x.id !== id)
    this.saveAllEvaluations(list)
  }

  private saveAllEvaluations(list: EvaluationRecord[]) {
    try {
      localStorage.setItem(this.getStorageKey("evaluations"), JSON.stringify(list))
    } catch (e) {
      console.error("Failed to save evaluations to storage", e)
    }
  }

  // --- 4. Khen thưởng / Kỷ luật ---
  getRewardsDisciplines(): RewardDisciplineRecord[] {
    try {
      const raw = localStorage.getItem(this.getStorageKey("rewards"))
      if (!raw) {
        this.saveAllRewardsDisciplines(INITIAL_REWARDS_DISCIPLINES)
        return INITIAL_REWARDS_DISCIPLINES
      }
      return JSON.parse(raw) as RewardDisciplineRecord[]
    } catch {
      return INITIAL_REWARDS_DISCIPLINES
    }
  }

  saveRewardDiscipline(item: RewardDisciplineRecord): void {
    const list = this.getRewardsDisciplines()
    const index = list.findIndex((x) => x.id === item.id)
    if (index >= 0) {
      list[index] = item
    } else {
      list.unshift(item)
    }
    this.saveAllRewardsDisciplines(list)
  }

  deleteRewardDiscipline(id: string): void {
    const list = this.getRewardsDisciplines().filter((x) => x.id !== id)
    this.saveAllRewardsDisciplines(list)
  }

  private saveAllRewardsDisciplines(list: RewardDisciplineRecord[]) {
    try {
      localStorage.setItem(this.getStorageKey("rewards"), JSON.stringify(list))
    } catch (e) {
      console.error("Failed to save rewards/disciplines to storage", e)
    }
  }
}

export const defaultHrmDevelopmentRepository = new HrmDevelopmentRepository()
