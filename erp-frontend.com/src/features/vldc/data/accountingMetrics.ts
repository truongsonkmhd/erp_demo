import type { Advance, BankAccount, BankLine, ClosingTask, Contract, FixedAsset, Voucher } from "./types.ts"
import { managesAllUnits } from "./access.ts"

/** Accounting figures derived from stored records (money in million VND). */

const sum = <T>(rows: T[], pick: (r: T) => number) => rows.reduce((s, r) => s + pick(r), 0)
const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)

export type Debt = { contract: Contract; outstanding: number; overdue: number; agingDays: number; nextDue?: string }

/** Invoiced but unpaid amount of a contract; aging counts from the oldest overdue unpaid milestone. */
export function contractDebt(contract: Contract, today: string): Debt {
  const open = contract.milestones.filter((m) => m.invoiced > m.paid)
  const overdue = open.filter((m) => m.due < today)
  const oldest = overdue.map((m) => m.due).sort()[0]
  return {
    contract,
    outstanding: sum(open, (m) => m.invoiced - m.paid),
    overdue: sum(overdue, (m) => m.invoiced - m.paid),
    agingDays: oldest ? daysBetween(oldest, today) : 0,
    nextDue: open.filter((m) => m.due >= today).map((m) => m.due).sort()[0],
  }
}

export const AGING_BUCKETS = ["Trong hạn", "1–30 ngày", "31–60 ngày", "> 60 ngày"] as const

export function debtSummary(contracts: Contract[], kind: Contract["kind"], today: string) {
  const debts = contracts.filter((c) => c.kind === kind).map((c) => contractDebt(c, today)).filter((d) => d.outstanding > 0)
  const bucketOf = (d: Debt) => (d.agingDays === 0 ? 0 : d.agingDays <= 30 ? 1 : d.agingDays <= 60 ? 2 : 3)
  const buckets = AGING_BUCKETS.map((label, i) => ({ label, amount: sum(debts.filter((d) => bucketOf(d) === i), (d) => d.outstanding) }))
  return {
    debts: debts.sort((a, b) => b.agingDays - a.agingDays),
    total: sum(debts, (d) => d.outstanding),
    overdue: sum(debts, (d) => d.overdue),
    over60: buckets[3].amount,
    over60Count: debts.filter((d) => bucketOf(d) === 3).length,
    collected: sum(contracts.filter((c) => c.kind === kind), (c) => sum(c.milestones, (m) => m.paid)),
    buckets,
  }
}

export const advanceRemaining = (a: Advance) => a.amount - a.returned

export function advanceSummary(advances: Advance[], today: string) {
  const open = advances.filter((a) => advanceRemaining(a) > 0)
  const overdue = open.filter((a) => a.due < today)
  return {
    open,
    outstanding: sum(open, advanceRemaining),
    overdueCount: overdue.length,
    overdueAmount: sum(overdue, advanceRemaining),
    missingInvoice: open.filter((a) => a.missingInvoice).length,
    settled: advances.length - open.length,
  }
}

export const POSTED = "Đã ghi sổ"

export function voucherSummary(vouchers: Voucher[]) {
  const pending = vouchers.filter((v) => v.status !== POSTED)
  return {
    count: vouchers.length,
    pending: pending.length,
    needSupplement: vouchers.filter((v) => v.status === "Cần bổ sung").length,
    awaitingApproval: vouchers.filter((v) => v.status === "Chờ ký duyệt" || v.status === "Chờ kiểm soát").length,
    pendingAmount: sum(pending, (v) => v.amount),
  }
}

export type LedgerEntry = { date: string; voucherId: string; desc: string; projectId: string; debit: string; credit: string; amount: number; posted: boolean }

/** Double entries generated from vouchers (simplified chart of accounts). */
const ACCOUNTS: Record<string, [string, string]> = {
  "Ủy nhiệm chi": ["331", "112"],
  "Phiếu chi": ["141", "111"],
  "Phiếu thu": ["112", "131"],
  "Chứng từ khác": ["154", "331"],
}

export function ledgerEntries(vouchers: Voucher[]): LedgerEntry[] {
  return [...vouchers]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((v) => {
      const [debit, credit] = ACCOUNTS[v.type] ?? ["642", "331"]
      return { date: v.date, voucherId: v.id, desc: v.note || `${v.type} – ${v.counterparty}`, projectId: v.projectId, debit, credit, amount: v.amount, posted: v.status === POSTED }
    })
}

export const LEDGERS: { name: string; account?: string }[] = [
  { name: "Nhật ký chung" },
  { name: "Sổ cái TK 111 – Tiền mặt", account: "111" },
  { name: "Sổ cái TK 112 – Tiền gửi", account: "112" },
  { name: "Sổ chi tiết TK 131 – Phải thu", account: "131" },
  { name: "Sổ chi tiết TK 141 – Tạm ứng", account: "141" },
  { name: "Sổ chi tiết TK 154 – Chi phí dự án", account: "154" },
  { name: "Sổ chi tiết TK 331 – Phải trả", account: "331" },
]

export function ledgerFor(name: string, vouchers: Voucher[]): LedgerEntry[] {
  const account = LEDGERS.find((l) => l.name === name)?.account
  const entries = ledgerEntries(vouchers)
  return account ? entries.filter((e) => e.debit === account || e.credit === account) : entries
}

export function cashSummary(accounts: BankAccount[], lines: BankLine[]) {
  const erp = sum(accounts, (a) => a.erpBalance)
  const statement = sum(accounts, (a) => a.statementBalance)
  const unmatched = lines.filter((l) => !l.matchedVoucherId)
  return {
    erp,
    statement,
    diff: erp - statement,
    mismatchedAccounts: accounts.filter((a) => a.erpBalance !== a.statementBalance).length,
    unmatched: unmatched.length,
    matchRate: lines.length ? Math.round(((lines.length - unmatched.length) / lines.length) * 100) : 100,
  }
}

export function closingSummary(tasks: ClosingTask[]) {
  const done = tasks.filter((t) => t.done).length
  return { period: tasks[0]?.period ?? "", done, open: tasks.length - done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 100 }
}

export function assetSummary(assets: FixedAsset[]) {
  return {
    count: assets.length,
    cost: sum(assets, (a) => a.cost),
    nbv: sum(assets, (a) => a.nbv),
    mismatched: assets.filter((a) => a.status.startsWith("Lệch")).length,
    fullyDepreciated: assets.filter((a) => a.nbv === 0).length,
    linked: assets.filter((a) => a.equipmentId).length,
  }
}

/** Revenue (receivable contracts) and debts for the leadership view: what was signed, invoiced, collected and is still owed. */
export function revenueSummary(contracts: Contract[], today: string) {
  const thu = contracts.filter((c) => c.kind === "thu")
  const ms = thu.flatMap((c) => c.milestones)
  const contractValue = sum(thu, (c) => c.value)
  const invoiced = sum(ms, (m) => m.invoiced)
  const collected = sum(ms, (m) => m.paid)
  const parties = [...new Set(thu.map((c) => c.party))]
  const customers = parties.map((party) => {
    const own = thu.filter((c) => c.party === party)
    const debts = own.map((c) => contractDebt(c, today))
    return {
      party, contracts: own.length, value: sum(own, (c) => c.value),
      invoiced: sum(own.flatMap((c) => c.milestones), (m) => m.invoiced), collected: sum(own.flatMap((c) => c.milestones), (m) => m.paid),
      outstanding: sum(debts, (d) => d.outstanding), overdue: sum(debts, (d) => d.overdue), agingDays: Math.max(0, ...debts.map((d) => d.agingDays)),
    }
  }).sort((a, b) => b.outstanding - a.outstanding || b.agingDays - a.agingDays)
  const ap = debtSummary(contracts, "chi", today)
  return {
    contractValue, invoiced, collected, receivable: invoiced - collected, notInvoiced: contractValue - invoiced,
    collectedPct: invoiced ? Math.round((collected / invoiced) * 100) : 0,
    customers, payable: ap.total, payableOverdue: ap.overdue,
  }
}

/** Contracts are drafted by the business roles; the federation head only views them. */
export const canCreateContract = (role: string) => !managesAllUnits(role)
