import { ChevronRight, Menu, Search } from "lucide-react"
import { getPageMeta, getRoles, getShellBadges } from "@/features/vldc/legacy/engine"
import { VldcNotificationBell } from "./VldcNotificationBell"

type Props = {
  role: string
  roles: string[]
  page: string
  group?: string
  onRoleChange: (role: string) => void
  onOpenMenu: () => void
  onOpenPalette: () => void
}

export function VldcTopbar({ role, roles, page, group, onRoleChange, onOpenMenu, onOpenPalette }: Props) {
  const allRoles = getRoles()
  const [title, sub] = getPageMeta(page) ?? ["", ""]
  // Recomputed on every render; the store bumps badgeSeq whenever the legacy data changes.
  // Older in-browser business notices (workflow, Firestore); the bell itself counts the server notifications.
  const legacyUnread = getShellBadges().notices.count

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
        <VldcNotificationBell legacyUnread={legacyUnread} />

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
