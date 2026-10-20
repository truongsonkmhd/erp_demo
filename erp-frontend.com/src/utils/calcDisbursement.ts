import { DisbursementItem } from "@/types/disbursement";

// HELPERS
export function calcDisbursement(
    items: DisbursementItem[],
    advanceDeduction: number
) {
    const requested = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const tax = items.reduce(
        (s, i) =>
            s + (Number(i.amount) || 0) * (Number(i.taxRate) || 0) / 100,
        0
    );
    const payable = requested + tax - (Number(advanceDeduction) || 0);

    return { requested, tax, retention: 0, payable };
}
