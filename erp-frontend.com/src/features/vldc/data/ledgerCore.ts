import type { CashEntry, DebtRecord } from "./types.ts"

/**
 * Thu – Chi – Công nợ kept by the accountants. Money is in VND (đồng). Contract payments (lần 1, lần 2, …) are
 * entered on the debt table and count as receipts, so a receipt for a contract is never entered twice.
 */

/** Roles that enter and edit the records; the other roles with access (Liên đoàn trưởng) only read. */
export const LEDGER_EDITORS = ["ketoan", "ketoantruong"]
export const PAY_METHODS = ["Chuyển khoản", "Tiền mặt"]
export const canEditLedger = (role: string) => LEDGER_EDITORS.includes(role)

export const activeDebts = (rows: DebtRecord[]) => rows.filter((r) => !r.deleted)
export const activeEntries = (rows: CashEntry[], kind: CashEntry["kind"]) => rows.filter((r) => !r.deleted && r.kind === kind)

export const debtPaid = (r: Pick<DebtRecord, "installments">) => r.installments.reduce((s, x) => s + x.amount, 0)
export const debtRemaining = (r: Pick<DebtRecord, "amount" | "installments">) => r.amount - debtPaid(r)
export const debtPct = (r: Pick<DebtRecord, "amount" | "installments">) => (r.amount > 0 ? Math.round((debtPaid(r) / r.amount) * 100) : 0)

export function debtSummary(rows: DebtRecord[]) {
  const debts = activeDebts(rows)
  const total = debts.reduce((s, r) => s + r.amount, 0)
  const paid = debts.reduce((s, r) => s + debtPaid(r), 0)
  const owing = debts.filter((r) => debtRemaining(r) > 0)
  // Finished projects still owed money are what leadership has to chase.
  const doneOwing = owing.filter((r) => r.done)
  return {
    count: debts.length,
    done: debts.filter((r) => r.done).length,
    total,
    paid,
    remaining: total - paid,
    paidPct: total > 0 ? Math.round((paid / total) * 100) : 0,
    owingCount: owing.length,
    doneOwing,
    doneOwingAmount: doneOwing.reduce((s, r) => s + debtRemaining(r), 0),
  }
}

/** A row of the receipts list: a phiếu thu, or one contract payment from the debt table. */
export type ReceiptRow = {
  key: string; date: string; ref: string; content: string; counterparty: string; method: string; amount: number
  debt?: DebtRecord; entry?: CashEntry
}

export function receiptRows(debts: DebtRecord[], entries: CashEntry[]): ReceiptRow[] {
  const fromDebts = activeDebts(debts).flatMap((d) => d.installments.map((x, i): ReceiptRow => ({
    key: `${d.id}#${i}`, date: x.date, ref: `${d.contractNo} • Lần ${i + 1}`, content: `Thanh toán lần ${i + 1} – ${d.projectName}`,
    counterparty: "", method: "", amount: x.amount, debt: d,
  })))
  const manual = activeEntries(entries, "thu").map((e): ReceiptRow => ({
    key: e.id, date: e.date, ref: e.id, content: e.content, counterparty: e.counterparty, method: e.method, amount: e.amount, entry: e,
  }))
  return [...fromDebts, ...manual].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key))
}

/** Totals of receipts and payments; month is "yyyy-mm" (the current month for the "this month" figures). */
export function cashSummary(debts: DebtRecord[], entries: CashEntry[], month: string) {
  const receipts = receiptRows(debts, entries)
  const payments = activeEntries(entries, "chi")
  const sum = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0)
  const inMonth = <T extends { date: string }>(rows: T[]) => rows.filter((r) => r.date.startsWith(month))
  const thu = sum(receipts)
  const chi = sum(payments)
  return {
    thu,
    chi,
    net: thu - chi,
    thuContract: sum(receipts.filter((r) => r.debt)),
    thuOther: sum(receipts.filter((r) => r.entry)),
    chiProject: sum(payments.filter((e) => e.debtId)),
    chiOther: sum(payments.filter((e) => !e.debtId)),
    thuMonth: sum(inMonth(receipts)),
    chiMonth: sum(inMonth(payments)),
    receiptCount: receipts.length,
    paymentCount: payments.length,
  }
}

/** Per project contract: value, received, spent (phiếu chi linked to it) and the difference received – spent. */
export function projectBalances(debts: DebtRecord[], entries: CashEntry[]) {
  const payments = activeEntries(entries, "chi")
  return activeDebts(debts).map((d) => {
    const thu = debtPaid(d)
    const chi = payments.filter((e) => e.debtId === d.id).reduce((s, e) => s + e.amount, 0)
    return { debt: d, thu, chi, net: thu - chi, remaining: debtRemaining(d), pct: debtPct(d) }
  })
}

/** Reasons the record cannot be saved (empty when it can). */
export function debtProblems(r: DebtRecord, all: DebtRecord[]): string[] {
  const out: string[] = []
  if (!r.contractNo.trim()) out.push("Vui lòng nhập số hợp đồng")
  else if (activeDebts(all).some((x) => x.id !== r.id && x.contractNo.trim().toLowerCase() === r.contractNo.trim().toLowerCase())) out.push("Số hợp đồng đã có trong bảng công nợ")
  if (!r.projectName.trim()) out.push("Vui lòng nhập tên dự án")
  if (!(r.amount > 0)) out.push("Số tiền hợp đồng phải lớn hơn 0")
  r.installments.forEach((x, i) => {
    if (!(x.amount > 0)) out.push(`Lần ${i + 1}: số tiền phải lớn hơn 0`)
    if (!x.date) out.push(`Lần ${i + 1}: vui lòng chọn ngày`)
  })
  if (r.amount > 0 && debtPaid(r) > r.amount) out.push("Tổng các lần thanh toán vượt số tiền hợp đồng")
  return out
}

export function entryProblems(e: CashEntry): string[] {
  const out: string[] = []
  if (!e.date) out.push("Vui lòng chọn ngày")
  if (!e.content.trim()) out.push("Vui lòng nhập nội dung")
  if (!(e.amount > 0)) out.push("Số tiền phải lớn hơn 0")
  return out
}

/** Next free id "<prefix>-<year>-NNN" (ids of removed rows stay taken). */
export function nextId(prefix: string, year: string, rows: { id: string }[]): string {
  const head = `${prefix}-${year}-`
  const max = rows.filter((r) => r.id.startsWith(head)).reduce((m, r) => Math.max(m, Number(r.id.slice(head.length)) || 0), 0)
  return `${head}${String(max + 1).padStart(3, "0")}`
}
