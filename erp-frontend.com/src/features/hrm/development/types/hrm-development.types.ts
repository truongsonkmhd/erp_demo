/**
 * HRM-02: Kiểu dữ liệu nghiệp vụ Đào tạo, Nâng lương, Đánh giá, Khen thưởng / Kỷ luật
 */

// 1. Đào tạo & Bồi dưỡng
export type TrainingType = "chinh_quy" | "tai_chuc" | "tap_huan" | "chung_chi"
export type TrainingStatus = "ongoing" | "completed" | "cancelled"

export interface TrainingRecord {
  id: string
  userId: string
  employeeCode: string
  fullName: string
  courseName: string
  institution: string
  trainingType: TrainingType
  startDate: string
  endDate: string
  cost: number
  result: string
  certificateUrl?: string
  status: TrainingStatus
  createdAt?: string
}

export type TrainingFormData = Omit<TrainingRecord, "id" | "createdAt"> & { id?: string }

// 2. Nâng bậc lương
export type SalaryIncreaseType = "regular" | "early" | "exceptional"

export interface SalaryIncreaseRecord {
  id: string
  userId: string
  employeeCode: string
  fullName: string
  decisionNumber: string
  decisionDate: string
  effectiveDate: string
  payGrade: string
  oldStep: number
  oldCoefficient: number
  newStep: number
  newCoefficient: number
  type: SalaryIncreaseType
  signatory: string
  notes?: string
  createdAt?: string
}

export type SalaryIncreaseFormData = Omit<SalaryIncreaseRecord, "id" | "createdAt"> & { id?: string }

// 3. Đánh giá & Xếp loại thi đua
export type EvaluationClassification = "xuat_sac" | "tot" | "hoan_thanh" | "khong_hoan_thanh"
export type EvaluationPeriod = "year" | "q1" | "q2" | "q3" | "q4"

export interface EvaluationRecord {
  id: string
  userId: string
  employeeCode: string
  fullName: string
  year: number
  period: EvaluationPeriod
  classification: EvaluationClassification
  score?: number
  achievements: string
  limitations: string
  evaluator: string
  approvalDate: string
  createdAt?: string
}

export type EvaluationFormData = Omit<EvaluationRecord, "id" | "createdAt"> & { id?: string }

// 4. Khen thưởng & Kỷ luật
export type RewardDisciplineCategory = "reward" | "discipline"

export interface RewardDisciplineRecord {
  id: string
  userId: string
  employeeCode: string
  fullName: string
  category: RewardDisciplineCategory
  form: string
  decisionNumber: string
  decisionDate: string
  effectiveDate: string
  issuer: string
  reason: string
  notes?: string
  createdAt?: string
}

export type RewardDisciplineFormData = Omit<RewardDisciplineRecord, "id" | "createdAt"> & { id?: string }
