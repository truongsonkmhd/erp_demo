import React, { useCallback, useEffect, useState } from "react"
import { Award, GraduationCap, Medal, RefreshCw, TrendingUp } from "lucide-react"

import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getEmployees, type EmployeeAccount } from "@/services/EmployeeService"
import { defaultHrmDevelopmentRepository } from "../repositories/hrm-development.storage.ts"
import { TrainingTab } from "../components/tabs/TrainingTab"
import { SalaryIncreaseTab } from "../components/tabs/SalaryIncreaseTab"
import { EvaluationTab } from "../components/tabs/EvaluationTab"
import { RewardDisciplineTab } from "../components/tabs/RewardDisciplineTab"
import type {
  EvaluationRecord,
  RewardDisciplineRecord,
  SalaryIncreaseRecord,
  TrainingRecord,
} from "../types/hrm-development.types.ts"

export default function HrmDevelopmentPage() {
  const [activeTab, setActiveTab] = useState<"training" | "salary" | "evaluation" | "rewards">("training")
  const [employees, setEmployees] = useState<EmployeeAccount[]>([])
  const [loading, setLoading] = useState(true)

  // Dữ liệu 4 nghiệp vụ
  const [trainings, setTrainings] = useState<TrainingRecord[]>([])
  const [salaries, setSalaries] = useState<SalaryIncreaseRecord[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([])
  const [rewards, setRewards] = useState<RewardDisciplineRecord[]>([])

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const emps = await getEmployees().catch(() => [] as EmployeeAccount[])
      setEmployees(emps)

      setTrainings(defaultHrmDevelopmentRepository.getTrainings())
      setSalaries(defaultHrmDevelopmentRepository.getSalaryIncreases())
      setEvaluations(defaultHrmDevelopmentRepository.getEvaluations())
      setRewards(defaultHrmDevelopmentRepository.getRewardsDisciplines())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAllData()
  }, [loadAllData])

  // Handlers CRUD Đào tạo
  const handleSaveTraining = (record: TrainingRecord) => {
    defaultHrmDevelopmentRepository.saveTraining(record)
    setTrainings(defaultHrmDevelopmentRepository.getTrainings())
  }
  const handleDeleteTraining = (id: string) => {
    defaultHrmDevelopmentRepository.deleteTraining(id)
    setTrainings(defaultHrmDevelopmentRepository.getTrainings())
  }

  // Handlers CRUD Nâng lương
  const handleSaveSalary = (record: SalaryIncreaseRecord) => {
    defaultHrmDevelopmentRepository.saveSalaryIncrease(record)
    setSalaries(defaultHrmDevelopmentRepository.getSalaryIncreases())
  }
  const handleDeleteSalary = (id: string) => {
    defaultHrmDevelopmentRepository.deleteSalaryIncrease(id)
    setSalaries(defaultHrmDevelopmentRepository.getSalaryIncreases())
  }

  // Handlers CRUD Đánh giá
  const handleSaveEvaluation = (record: EvaluationRecord) => {
    defaultHrmDevelopmentRepository.saveEvaluation(record)
    setEvaluations(defaultHrmDevelopmentRepository.getEvaluations())
  }
  const handleDeleteEvaluation = (id: string) => {
    defaultHrmDevelopmentRepository.deleteEvaluation(id)
    setEvaluations(defaultHrmDevelopmentRepository.getEvaluations())
  }

  // Handlers CRUD Khen thưởng / Kỷ luật
  const handleSaveRewardDiscipline = (record: RewardDisciplineRecord) => {
    defaultHrmDevelopmentRepository.saveRewardDiscipline(record)
    setRewards(defaultHrmDevelopmentRepository.getRewardsDisciplines())
  }
  const handleDeleteRewardDiscipline = (id: string) => {
    defaultHrmDevelopmentRepository.deleteRewardDiscipline(id)
    setRewards(defaultHrmDevelopmentRepository.getRewardsDisciplines())
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <BoatLoading />
      </div>
    )
  }

  const excellentCount = evaluations.filter((e) => e.classification === "xuat_sac").length
  const rewardCount = rewards.filter((r) => r.category === "reward").length

  return (
    <div className="flex-1 space-y-5 p-6 max-w-[1600px] mx-auto">
      {/* 1. Header Trang Chuẩn Web ERP */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Đào tạo & Thi đua - Khen thưởng
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
              HRM-02
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi đào tạo bồi dưỡng, nâng bậc lương, đánh giá xếp loại định kỳ và khen thưởng - kỷ luật cán bộ.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadAllData()}
            className="h-9 text-xs gap-1.5"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tải lại</span>
          </Button>
        </div>
      </div>

      {/* 2. Thẻ chỉ số tổng quan (ERP Metric Cards) - Tương tác chuyển nhanh Tab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card Đào tạo */}
        <button
          type="button"
          onClick={() => setActiveTab("training")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-primary/50 shadow-2xs ${
            activeTab === "training" ? "ring-2 ring-primary/30 border-primary" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Lượt đào tạo / bồi dưỡng</span>
            <div className="text-2xl font-bold text-foreground font-mono">{trainings.length}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
        </button>

        {/* Card Nâng lương */}
        <button
          type="button"
          onClick={() => setActiveTab("salary")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-emerald-500/50 shadow-2xs ${
            activeTab === "salary" ? "ring-2 ring-emerald-500/30 border-emerald-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Quyết định nâng lương</span>
            <div className="text-2xl font-bold text-emerald-600 font-mono">{salaries.length}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </button>

        {/* Card Đánh giá xuất sắc */}
        <button
          type="button"
          onClick={() => setActiveTab("evaluation")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-amber-500/50 shadow-2xs ${
            activeTab === "evaluation" ? "ring-2 ring-amber-500/30 border-amber-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Cán bộ đạt Xuất sắc</span>
            <div className="text-2xl font-bold text-amber-600 font-mono">{excellentCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
        </button>

        {/* Card Khen thưởng */}
        <button
          type="button"
          onClick={() => setActiveTab("rewards")}
          className={`flex items-center justify-between p-3.5 rounded-xl border bg-card text-left transition-all hover:border-purple-500/50 shadow-2xs ${
            activeTab === "rewards" ? "ring-2 ring-purple-500/30 border-purple-500" : "border-border"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-muted-foreground">Lượt khen thưởng</span>
            <div className="text-2xl font-bold text-purple-600 font-mono">{rewardCount}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Medal className="h-5 w-5" />
          </div>
        </button>
      </div>

      {/* 3. Phân vùng 4 Tabs nghiệp vụ */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as typeof activeTab)}
        className="w-full space-y-4"
      >
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/40 grid grid-cols-2 lg:grid-cols-4 max-w-2xl">
          <TabsTrigger value="training" className="text-xs font-medium rounded-lg">
            Đào tạo & Bồi dưỡng
          </TabsTrigger>
          <TabsTrigger value="salary" className="text-xs font-medium rounded-lg">
            Quá trình nâng lương
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="text-xs font-medium rounded-lg">
            Đánh giá xếp loại
          </TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs font-medium rounded-lg">
            Khen thưởng & Kỷ luật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="mt-4 focus-visible:outline-none">
          <TrainingTab
            records={trainings}
            employees={employees}
            onSave={handleSaveTraining}
            onDelete={handleDeleteTraining}
          />
        </TabsContent>

        <TabsContent value="salary" className="mt-4 focus-visible:outline-none">
          <SalaryIncreaseTab
            records={salaries}
            employees={employees}
            onSave={handleSaveSalary}
            onDelete={handleDeleteSalary}
          />
        </TabsContent>

        <TabsContent value="evaluation" className="mt-4 focus-visible:outline-none">
          <EvaluationTab
            records={evaluations}
            employees={employees}
            onSave={handleSaveEvaluation}
            onDelete={handleDeleteEvaluation}
          />
        </TabsContent>

        <TabsContent value="rewards" className="mt-4 focus-visible:outline-none">
          <RewardDisciplineTab
            records={rewards}
            employees={employees}
            onSave={handleSaveRewardDiscipline}
            onDelete={handleDeleteRewardDiscipline}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
