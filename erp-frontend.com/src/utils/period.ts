// utils/period.ts
import { format } from "date-fns";

export function normalizePeriod(p: string): string {
    // Chỉ giữ dạng YYYY-MM; nếu người dùng gõ YYYY-MM-DD thì cắt 7 ký tự đầu
    if (!p) return format(new Date(), "yyyy-MM");
    const s = p.trim();
    if (/^\d{4}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(0, 7);
    // fallback: cố gắng parse
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return format(new Date(), "yyyy-MM");
    return format(d, "yyyy-MM");
}

export function nextAvailableMonth(existing: Set<string>): string {
    // Lấy từ tháng hiện tại tiến lên cho đến khi không trùng
    const d = new Date();
    for (let i = 0; i < 60; i++) { // tối đa 5 năm
        const cand = format(d, "yyyy-MM");
        if (!existing.has(cand)) return cand;
        d.setMonth(d.getMonth() + 1);
    }
    return format(new Date(), "yyyy-MM");
}
