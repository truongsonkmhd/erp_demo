import { apiRequest } from "@/lib/api"
import { changeFeed } from "./registry"
import type { CashEntry as LegacyCashEntry, Contract as LegacyContract } from "./types"

/**
 * Hợp đồng, lịch thanh toán, thu / chi – served by the backend (/api/vldc/contracts, MySQL). The client reads what the
 * backend returns and asks it for every change (it never writes rows itself), then re-fetches; other open pages
 * re-fetch from the /topic/vldc/contracts feed. Money in VND. Users without access (not KH-TC, Kế toán, Liên đoàn
 * trưởng) simply get an empty ledger.
 */

export type Installment = { id: string; name: string; amount: number; dueDate: string | null; condition: string | null; paid: number; remaining: number; locked: boolean; overdue: boolean }
export type Payment = { id: string; installmentId: string; installmentName: string; date: string; amount: number; method: string; note: string | null; recordedBy: string | null; recordedAt: string }
export type HistoryLine = { at: string; by: string; action: string; detail: string | null }
export type Permissions = { editInfo: boolean; addendum: boolean; editSchedule: boolean; confirm: boolean; record: boolean; deletePayment: boolean; liquidate: boolean; delete: boolean }
export type ContractStatus = "Dự thảo" | "Đang thực hiện" | "Đã thanh lý"
export type LedgerContract = {
  id: string; contractNo: string; kind: "thu" | "chi"; projectId: string | null; party: string; content: string; value: number
  signedDate: string | null; endDate: string | null; status: ContractStatus; projectDone: boolean; createdByName: string | null
  paid: number; remaining: number; scheduleTotal: number; scheduleMatches: boolean; overdue: number; nextDueDate: string | null; nextDueName: string | null
  installments: Installment[]; payments: Payment[]; history: HistoryLine[]; can: Permissions
}
export type LedgerCash = { id: string; kind: "thu" | "chi"; date: string; amount: number; content: string; counterparty: string | null; method: string; projectId: string | null; createdByName: string | null; canEdit: boolean }
export type Summary = {
  revenue: number; contractRevenue: number; thu: number; thuContract: number; thuOther: number; chi: number; chiContract: number; chiOther: number
  thuMonth: number; chiMonth: number; receivable: number; payable: number; overdueReceivable: number; overduePayable: number
  receivableContracts: number; doneOwing: number
}
type Ledger = { contracts: LedgerContract[]; cashEntries: LedgerCash[]; summary: Summary; canCreate: boolean; canManageMoney: boolean }

export type ContractInput = { contractNo: string; kind: "thu" | "chi"; projectId: string; party: string; content: string; value: number; signedDate: string; endDate: string }
export type InstallmentInput = { id?: string; name: string; amount: number; dueDate: string; condition: string }
export type CashInput = { kind: "thu" | "chi"; date: string; amount: number; content: string; counterparty: string; method: string; projectId: string }

export const PAY_METHODS = ["Chuyển khoản", "Tiền mặt"]
const EMPTY_SUMMARY: Summary = {
  revenue: 0, contractRevenue: 0, thu: 0, thuContract: 0, thuOther: 0, chi: 0, chiContract: 0, chiOther: 0, thuMonth: 0, chiMonth: 0,
  receivable: 0, payable: 0, overdueReceivable: 0, overduePayable: 0, receivableContracts: 0, doneOwing: 0,
}
let state: Ledger = { contracts: [], cashEntries: [], summary: EMPTY_SUMMARY, canCreate: false, canManageMoney: false }
let loaded: Promise<void> | undefined
let stopWatch: (() => void) | undefined
const listeners = new Set<() => void>()

async function refresh() {
  try {
    state = await apiRequest<Ledger>("/api/vldc/contracts")
  } catch (e) {
    // 403: this role does not follow contracts – it just sees none.
    if ((e as { status?: number }).status !== 403) throw e
    state = { contracts: [], cashEntries: [], summary: EMPTY_SUMMARY, canCreate: false, canManageMoney: false }
  }
  listeners.forEach((fn) => fn())
}

async function change<T>(run: () => Promise<T>): Promise<T> {
  const result = await run()
  await refresh()
  return result
}

const enc = encodeURIComponent
const call = <T = void>(method: string, path: string, body?: unknown) => apiRequest<T>(`/api/vldc${path}`, { method, ...(body === undefined ? {} : { body }) })

export const ledgerStore = {
  start(): Promise<void> {
    stopWatch ??= changeFeed.watch("contracts", () => void refresh().catch((e) => console.warn("[contracts] Tải lại lỗi:", e)))
    return (loaded ??= refresh().catch((e) => {
      loaded = undefined
      console.warn("[contracts] Không tải được hợp đồng:", e)
    }))
  },
  onChange(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  contracts: () => state.contracts,
  cashEntries: () => state.cashEntries,
  summary: () => state.summary,
  canCreate: () => state.canCreate,
  canManageMoney: () => state.canManageMoney,
  find: (idOrNo: string) => state.contracts.find((c) => c.id === idOrNo || c.contractNo === idOrNo),

  create: (input: ContractInput) => change(() => call<string>("POST", "/contracts", input)),
  updateInfo: (id: string, input: ContractInput) => change(() => call("PUT", `/contracts/${enc(id)}`, input)),
  remove: (id: string) => change(() => call("DELETE", `/contracts/${enc(id)}`)),
  addendum: (id: string, value: number, note: string) => change(() => call("POST", `/contracts/${enc(id)}/addendum`, { value, note })),
  setSchedule: (id: string, installments: InstallmentInput[]) => change(() => call("PUT", `/contracts/${enc(id)}/schedule`, { installments })),
  confirm: (id: string) => change(() => call("POST", `/contracts/${enc(id)}/confirm`, {})),
  recordPayment: (id: string, p: { installmentId: string; date: string; amount: number; method: string; note: string }) =>
    change(() => call("POST", `/contracts/${enc(id)}/payments`, p)),
  deletePayment: (id: string, paymentId: string) => change(() => call("DELETE", `/contracts/${enc(id)}/payments/${enc(paymentId)}`)),
  liquidate: (id: string) => change(() => call("POST", `/contracts/${enc(id)}/liquidate`, {})),
  setProjectDone: (id: string, done: boolean) => change(() => call("PUT", `/contracts/${enc(id)}/project-done`, { done })),
  saveCash: (id: string, input: CashInput) => change(() => (id ? call<string>("PUT", `/cash-entries/${enc(id)}`, input) : call<string>("POST", "/cash-entries", input))),
  deleteCash: (id: string) => change(() => call("DELETE", `/cash-entries/${enc(id)}`)),

  /**
   * Running contracts in the former Contract shape (million VND, milestones) for the pages that still read it
   * (accounting overview, receivables, alerts, search, reports). The id is the contract number, as before.
   */
  legacyContracts(): LegacyContract[] {
    return state.contracts.filter((c) => c.status !== "Dự thảo").map((c) => {
      const paidOf = (iid: string) => c.payments.filter((p) => p.installmentId === iid).reduce((s, p) => s + p.amount, 0)
      return {
        id: c.contractNo, kind: c.kind, party: c.party, name: c.content || c.contractNo, value: c.value / 1e6, projectId: c.projectId ?? "",
        stage: c.status, nextObligation: c.nextDueName ? `${c.nextDueName}${c.nextDueDate ? ` – hạn ${c.nextDueDate}` : ""}` : "Không còn đợt mở",
        risk: c.overdue > 0 ? "Cao" : "Thấp", obligations: [],
        milestones: c.installments.map((i) => ({ name: i.name, value: i.amount / 1e6, invoiced: i.amount / 1e6, paid: paidOf(i.id) / 1e6, due: i.dueDate ?? "9999-12-31" })),
      }
    })
  },

  /** Every receipt and payment (contract payments + thu khác / chi khác) in the former CashEntry shape (giải ngân). */
  legacyCashEntries(): LegacyCashEntry[] {
    const fromContracts = state.contracts.flatMap((c) => c.payments.map((p): LegacyCashEntry => ({
      id: p.id, kind: c.kind, date: p.date, content: `${p.installmentName} – ${c.contractNo}`, counterparty: c.party, amount: p.amount,
      method: p.method, createdBy: p.recordedBy ?? "", createdAt: p.recordedAt,
    })))
    const other = state.cashEntries.map((e): LegacyCashEntry => ({
      id: e.id, kind: e.kind, date: e.date, content: e.content, counterparty: e.counterparty ?? "", amount: e.amount, method: e.method,
      createdBy: e.createdByName ?? "", createdAt: e.date,
    }))
    return [...fromContracts, ...other]
  },
}
