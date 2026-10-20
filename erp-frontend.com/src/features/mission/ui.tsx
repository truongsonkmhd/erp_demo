import type { ReactNode } from "react"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const ROOT = "/ke-hoach-nhiem-vu-du-an"
export const routeCodes = ["ho-so-nhiem-vu", "bang-cong-viec", "ke-hoach", "theo-doi-tien-do", "nguon-luc-nhiem-vu", "so-sanh-don-vi"] as const
export const permissionCode = (page: string, action: string) => `mission-${page}:${action}`
export function useMissionPermission(page: string) {
  const { user } = useAuth()
  return (action: string) => can(user, permissionCode(page, action))
}
export function PageShell({ title, subtitle, children, hideHeader = true }: { title?: string; subtitle?: string; children: ReactNode; hideHeader?: boolean }) {
  return <section className="w-full space-y-5 pb-10">{!hideHeader && title && <header><p className="text-xs font-semibold uppercase tracking-widest text-primary">Quản lý nhiệm vụ & đề án</p><h1 className="mt-1 text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{subtitle}</p></header>}{children}</section>
}
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>
}
export function Field({ label, value, onChange, type = "text", required = false, min }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean; min?: number }) {
  return <div className="space-y-1"><Label>{label}</Label><Input aria-label={label} type={type} min={min} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></div>
}
export function Choice({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; required?: boolean }) {
  return <div className="space-y-1"><Label>{label}</Label><Select value={value} onValueChange={onChange} required={required}><SelectTrigger aria-label={label}><SelectValue placeholder={`Chọn ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
}
export function Empty({ text = "Chưa có dữ liệu. Hãy nhập bản ghi đầu tiên." }: { text?: string }) { return <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p> }
export function Submit({ children = "Lưu" }: { children?: ReactNode }) { return <Button type="submit">{children}</Button> }
export function money(value: number) { return new Intl.NumberFormat("vi-VN").format(value || 0) }
export function validPeriod(start: string, end: string) { return !start || !end || start <= end }
export function nonNegative(...values: number[]) { return values.every((value) => Number.isFinite(value) && value >= 0) }
