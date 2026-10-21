/** Records of the VLDC business collections in Firestore (one collection per type, keyed by id). */

export type Scope = "federation" | "unit" | "project" | "personal"

/** One step in a task's trail: at "yyyy-mm-ddTHH:MM", by a role code or a unit/person label. */
export type TaskStep = { at: string; by: string; action: string; note?: string }
export type InboxTask = {
  id: string; type: string; title: string; source: string; sourcePage: string; owner: string; cc: string[]
  priority: string; status: string; sla: string; overdue: boolean; from: string; project: string; next: string
  history: TaskStep[]
}
export type CommonTask = { id: string; title: string; scope: string; owner: string; due: string; status: string; link: string }

/** date "dd/mm/yyyy", time "HH:MM". */
export type CalendarEvent = {
  id: string; date: string; time: string; title: string; scope: Scope; unit: string; project: string; owner: string; link: string; note: string
}
export type Plan = {
  id: string; level: string; scope: Scope; title: string; period: string; owner: string; progress: number; status: string
  parent: string; items: string[]; unit?: string; project?: string; ownerRole?: string
}
/** readBy: role codes that have opened the notice. */
export type Notice = {
  id: string; scope: Scope; title: string; body: string; time: string; priority: string; readBy: string[]; link: string
  unit?: string; project?: string; ownerRole?: string
}

export type Decision = { id: string; title: string; unit: string; severity: string; due: string; source: string; open: boolean }
/** date "dd/mm/yyyy"; status "Sắp diễn ra" | "Đã chuẩn bị" | "Đã kết thúc". */
/** A meeting conclusion; taskId is set once it has been issued as an inbox task. */
export type Conclusion = { text: string; ownerRole: string; due: string; taskId?: string }
export type Meeting = {
  id: string; date: string; title: string; time: string; scope: string; status: string; agenda: number; docs: number
  actions: number; openConclusions: number; conclusions: Conclusion[]
}
export type StrategicGoal = { id: string; goal: string; owner: string; target: string; actual: number; weight: number }
export type Initiative = { id: string; name: string; progress: number }
/** probability/impact on a 1–5 scale. */
export type Risk = {
  id: string; title: string; owner: string; probability: number; impact: number; mitigation: string; open: boolean; project?: string
}

export type OrgUnit = { id: string; name: string; type: string; leader: string; deputy?: string; staff: string; staffCount: number; mission: string; public: boolean }
export type OrgStats = {
  id: string; total: number; doctor: number; master: number; engineerBachelor: number; technicianWorker: number
  under5: number; from5to15: number; over15: number
}
export type ResearchProject = {
  id: string; title: string; owner: string; lead: string; stage: string; gate: string; progress: number; budget: number
  trl: number; product: string; risk: string; applied: boolean
}
export type DigitalAdoption = {
  id: string; unit: string; usage: number; interaction: number; process: number; data: number; adapt: number; effect: number; ai: number; score: number
}

/** inspectionDue "yyyy-mm-dd"; repairCost in million VND. */
export type Equipment = {
  id: string; name: string; quantity: number; year: string; condition: string; group: string; unit: string
  status: string; utilization: number; inspectionDue: string; repairCost: number
}
export type WbsItem = { name: string; progress: number; status: string }
/** Money in billion VND; technical/costUsed in %. */
export type Project = {
  id: string; name: string; unit: string; technical: number; costUsed: number; budget: number; delayDays: number
  upcomingMilestones: number; changeRequests: number; changeRequestsPending: number; wbs: WbsItem[]
}
/** Amounts in million VND; posted = hạch toán, acceptedPct = khối lượng đã nghiệm thu (%). */
export type FinanceLine = {
  id: string; source: string; project: string; item: string; unit: string; budget: number; committed: number; paid: number
  posted: number; acceptedPct: number
}
/** Cumulative billion VND per month of the year; actual is null for months not reached yet. */
export type Disbursement = { id: string; month: number; plan: number; actual: number | null }
/** Skill levels 1–5; certExpiry "yyyy-mm-dd". */
export type StaffSkill = {
  id: string; name: string; unit: string; geophysics: number; gis: number; data: number; pm: number; onField: boolean; certExpiry: string
}

/** Amounts in million VND; dates "yyyy-mm-dd". kind "thu" = receivable contract, "chi" = payable. */
export type ContractMilestone = { name: string; value: number; invoiced: number; paid: number; due: string }
export type Contract = {
  id: string; kind: "thu" | "chi"; party: string; name: string; value: number; projectId: string; stage: string
  nextObligation: string; risk: string; obligations: string[]; milestones: ContractMilestone[]
}
export type Voucher = {
  id: string; date: string; type: string; counterparty: string; projectId: string; amount: number; status: string
  fundSource: string; workItemId?: string; contractId?: string; note?: string
}
export type Advance = { id: string; person: string; projectId: string; amount: number; returned: number; due: string; missingInvoice: boolean }
export type BankAccount = { id: string; name: string; erpBalance: number; statementBalance: number }
export type BankLine = { id: string; date: string; text: string; amount: number; suggestedVoucherId?: string; confidence: number; matchedVoucherId?: string }
export type FixedAsset = { id: string; name: string; equipmentId?: string; cost: number; nbv: number; unit: string; source: string; status: string }
export type ClosingTask = { id: string; period: string; item: string; owner: string; done: boolean; note: string }
/** Billion VND. */
export type CashflowMonth = { id: string; month: string; inflow: number; outflow: number }
export type Handoff = { id: string; ref: string; from: string; to: string; condition: string; slaHours: number; status: string; workItemId?: string }

/** DMS file metadata (no binary); updatedAt "yyyy-mm-dd". */
export type DmsFile = {
  id: string; projectId: string; folder: string; name: string; format: string; version: number; updatedAt: string
  author: string; status: string; checkedOutBy?: string; tags: string[]
}
export type ArchiveRecord = {
  id: string; name: string; year: number; unit: string; type: string; docs: number; metadataPct: number
  paperLocation: string; status: string; structure: string[]; access: string
}
export type GeoDataset = {
  id: string; name: string; type: string; projectId: string; sizeGb: number; storageUri: string; access: string
  checksum: string; backup: boolean; lastAccess: string[]
}
export type ImportJob = { id: string; source: string; type: string; rows: number; ok: number; errors: number; runner: string; at: string; status: string }
/** weeklyRate: dossiers converted per week, used for the completion forecast. */
export type MigrationBatch = { id: string; unit: string; total: number; scanned: number; indexed: number; validated: number; migrated: number; weeklyRate: number; issues: string[] }
export type MasterCatalog = { id: string; name: string; count: number; owner: string; status: string; lastReview: string }
export type DataQualityRule = { id: string; rule: string; scope: string; violations: number; owner: string; status: string }
/** threshold: % for cost, days for the others. */
export type AlertRule = { id: string; name: string; metric: "cost" | "deadline" | "calibration" | "debt"; threshold: number; level: string; enabled: boolean }
export type ReportDef = { id: string; group: string; name: string; source: string; schedule: string; recipients: string; lastRun: string }
export type DocTemplate = { id: string; type: string; title: string; target: "project" | "contract" | "equipment"; body: string }
