import { useEffect, useMemo, useState } from "react"
import { NavLink } from "react-router-dom"
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react"
import { getRoles } from "@/features/vldc/legacy/engine"
import { menuIcon } from "@/features/vldc/menuIcons"
import { normalizeVi, type VldcMenuGroup } from "@/features/vldc/useVldcMenus"

type Props = {
  groups: VldcMenuGroup[]
  loading: boolean
  error: boolean
  onRetry: () => void
  pathname: string
  role: string
  userName: string
  initials: string
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate: () => void
  onLogout: () => void
}

const OPEN_KEY = "vldc.sidebar.open"

function readOpen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) || "[]")
  } catch {
    return []
  }
}

export function VldcSidebar({
  groups, loading, error, onRetry, pathname, role, userName, initials,
  collapsed, onToggleCollapsed, onNavigate, onLogout,
}: Props) {
  const r = getRoles()[role]
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState<string[]>(readOpen)
  const activeGroup = groups.find((group) => group.items.some((item) => item.url === pathname))?.code

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(open))
    } catch {
      // private mode: the open state just isn't remembered
    }
  }, [open])

  // The group of the page being viewed is always revealed.
  useEffect(() => {
    if (activeGroup) setOpen((prev) => (prev.includes(activeGroup) ? prev : [...prev, activeGroup]))
  }, [activeGroup])

  const visible = useMemo(() => {
    const q = normalizeVi(query.trim())
    if (!q) return groups
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => normalizeVi(`${item.title} ${group.title}`).includes(q)) }))
      .filter((group) => group.items.length)
  }, [groups, query])

  const toggle = (code: string) => {
    if (collapsed) {
      onToggleCollapsed()
      setOpen((prev) => (prev.includes(code) ? prev : [...prev, code]))
      return
    }
    setOpen((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  return (
    <aside className="vx-side" aria-label="Điều hướng VLDC">
      <div className="vx-brand">
        <div className="vx-logo">VLDC</div>
        <div className="vx-brand-text">
          <b>VLDC ERP</b>
          <span>Liên đoàn Vật lý Địa chất</span>
        </div>
        <button
          type="button"
          className="vx-icon-btn vx-collapse-btn"
          onClick={onToggleCollapsed}
          title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
          aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="vx-role" title={`${r.title} • ${r.unit}`}>
        <span className="vx-role-dot" />
        <div>
          <b>{r.title}</b>
          <span>{r.unit}</span>
        </div>
      </div>

      <label className="vx-search">
        <Search size={15} aria-hidden="true" />
        <input
          className="vx-bare"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm chức năng…"
          aria-label="Tìm chức năng"
        />
        {query ? (
          <button type="button" className="vx-search-clear" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm">
            <X size={14} />
          </button>
        ) : (
          <kbd>Ctrl K</kbd>
        )}
      </label>

      <nav className="vx-nav">
        {loading &&
          Array.from({ length: 7 }, (_, i) => <div key={i} className="vx-skeleton" style={{ width: `${60 + ((i * 17) % 35)}%` }} />)}

        {error && (
          <div className="vx-nav-empty">
            Không tải được menu.
            <button type="button" className="vx-link" onClick={onRetry}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && !visible.length && (
          <div className="vx-nav-empty">{query ? `Không có chức năng nào khớp "${query}".` : "Tài khoản chưa được cấp chức năng nào."}</div>
        )}

        {visible.map((group) => {
          const GroupIcon = menuIcon(group.icon)
          const expanded = !!query || open.includes(group.code)
          const isActive = group.code === activeGroup
          return (
            <div key={group.code} className={`vx-group${isActive ? " is-active" : ""}`}>
              <button
                type="button"
                className="vx-group-head"
                onClick={() => toggle(group.code)}
                aria-expanded={expanded}
                title={collapsed ? group.title : undefined}
              >
                <GroupIcon size={18} aria-hidden="true" />
                <span className="vx-label">{group.title}</span>
                <span className="vx-count">{group.items.length}</span>
                <ChevronDown size={15} className="vx-chevron" aria-hidden="true" />
              </button>
              {expanded && !collapsed && (
                <div className="vx-items">
                  {group.items.map((item) => {
                    const Icon = menuIcon(item.icon)
                    return (
                      <NavLink
                        key={item.code}
                        to={item.url}
                        onClick={onNavigate}
                        className={({ isActive: active }) => `vx-item${active ? " is-active" : ""}`}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span>{item.title}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="vx-user">
        <div className="vx-avatar">{initials}</div>
        <div className="vx-user-text">
          <b>{userName}</b>
          <span>{r.title}</span>
        </div>
        <button type="button" className="vx-icon-btn" onClick={onLogout} title="Đăng xuất" aria-label="Đăng xuất">
          <LogOut size={17} />
        </button>
      </div>
    </aside>
  )
}
