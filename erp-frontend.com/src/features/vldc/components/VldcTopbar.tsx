import { Bell, CalendarDays, ChevronRight, Inbox, Menu, Search, Sparkles, type LucideIcon } from "lucide-react"
import { getPageMeta, getRoles, getShellBadges } from "@/features/vldc/legacy/engine"
import { vldcActions } from "@/features/vldc/store"

type Props = {
  role: string
  roles: string[]
  page: string
  group?: string
  onRoleChange: (role: string) => void
  onOpenMenu: () => void
  onOpenPalette: () => void
}

type Shortcut = { page: string; label: string; icon: LucideIcon; badge?: { count: number; cls: string } }

export function VldcTopbar({ role, roles, page, group, onRoleChange, onOpenMenu, onOpenPalette }: Props) {
  const allRoles = getRoles()
  const [title, sub] = getPageMeta(page) ?? ["", ""]
  // Recomputed on every render; the store bumps badgeSeq whenever the legacy data changes.
  const badges = getShellBadges()
  const shortcuts: Shortcut[] = [
    { page: "assistant", label: "Trợ lý AI", icon: Sparkles },
    { page: "notifications", label: "Thông báo", icon: Bell, badge: badges.notices },
    { page: "calendar", label: "Lịch hôm nay", icon: CalendarDays, badge: badges.events },
    { page: "action", label: "Việc của tôi", icon: Inbox, badge: badges.tasks },
  ]

  return (
    <header className="vx-top">
      <button type="button" className="vx-icon-btn vx-menu-btn" onClick={onOpenMenu} aria-label="Mở menu">
        <Menu size={20} />
      </button>

      <div className="vx-title">
        <nav className="vx-crumbs" aria-label="Breadcrumb">
          <span>VLDC</span>
          {group && (
            <>
              <ChevronRight size={12} aria-hidden="true" />
              <span>{group}</span>
            </>
          )}
        </nav>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>

      <button type="button" className="vx-quick" onClick={onOpenPalette}>
        <Search size={16} aria-hidden="true" />
        <span>Tìm nhanh chức năng…</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="vx-actions">
        {shortcuts.map(({ page: target, label, icon: Icon, badge }) => (
          <button
            key={target}
            type="button"
            className={`vx-icon-btn vx-action${page === target ? " is-active" : ""}${target === "assistant" ? " is-ai" : ""}`}
            onClick={() => vldcActions.show(target)}
            title={badge ? `${label} (${badge.count})` : label}
            aria-label={badge ? `${label}, ${badge.count} mục` : label}
          >
            <Icon size={19} />
            {badge && badge.count > 0 && <span className={`vx-badge ${badge.cls === "b-danger" ? "is-danger" : ""}`}>{badge.count}</span>}
          </button>
        ))}

        {/* Only the roles the account holds (admin: all) — the backend still decides the menu. */}
        {roles.length > 1 && (
          <select className="vx-role-select" value={role} onChange={(e) => onRoleChange(e.target.value)} aria-label="Xem dưới vai trò">
            {roles.map((key) => (
              <option key={key} value={key}>
                {allRoles[key].title}
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  )
}
