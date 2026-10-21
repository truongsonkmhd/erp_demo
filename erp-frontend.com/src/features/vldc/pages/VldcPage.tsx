import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import toast from "react-hot-toast"
import { useAuth } from "@/services/auth/AuthContext"
import { hasPage, renderPage, setCurrentRole } from "@/features/vldc/legacy/engine"
import { setVldcNavigator, useVldcRole, useVldcShell, vldcActions } from "@/features/vldc/store"
import { useVldcMenus } from "@/features/vldc/useVldcMenus"
import { workflowStore } from "@/features/vldc/workflow/repository"
import { setWorkflowContext } from "@/features/vldc/workflow/views"
import { WORKFLOW_PAGES } from "@/features/vldc/workflow/rules"
import { vldcData } from "@/features/vldc/data/registry"
import { setAuditActor } from "@/features/vldc/data/audit"
import { applySignedInUser, loadOrgFromBackend } from "@/features/vldc/data/orgLoader"
import { DATASETS } from "@/features/vldc/data/datasets"
import { VldcSidebar } from "@/features/vldc/components/VldcSidebar"
import { VldcTopbar } from "@/features/vldc/components/VldcTopbar"
import { VldcModal } from "@/features/vldc/components/VldcModal"
import { VldcCommandPalette } from "@/features/vldc/components/VldcCommandPalette"
import "@/features/vldc/styles/vldc.css"
import "@/features/vldc/styles/vldc-host.css"

const COLLAPSED_KEY = "vldc.sidebar.collapsed"

/** Shared workflow subscription is started once per app session (survives StrictMode remounts). */
let workflowStarted: Promise<() => void> | null = null

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1"
  } catch {
    return false
  }
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

/**
 * Full VLDC shell (sidebar + topbar + page). React never renders children into #content:
 * render[page]() writes it directly, and partial updates (task filters, AI results, DMS
 * search...) keep patching that DOM between navigations.
 */
export default function VldcPage() {
  const { pageId = "dashboard" } = useParams()
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { navSeq, modal } = useVldcShell()
  const [role, roles, setRole] = useVldcRole(user)
  const menus = useVldcMenus(user)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const known = hasPage(pageId)
  const userName = user?.fullName || user?.email || ""
  const group = menus.groups.find((g) => g.items.some((item) => item.url === pathname))?.title

  useEffect(() => {
    setVldcNavigator(navigate)
  }, [navigate])

  // Titles, units and the signed-in person come from the backend; pages re-render once they arrive.
  const roleCodesKey = (user?.roleCodes || []).join(",")
  useEffect(() => {
    applySignedInUser(roleCodesKey ? roleCodesKey.split(",") : [], user?.fullName || "")
    void loadOrgFromBackend().then((ok) => {
      vldcActions.refresh()
      if (ok) vldcActions.rerender()
    })
  }, [roleCodesKey, user?.fullName])

  const roleRef = useRef(role)
  roleRef.current = role
  const modalRef = useRef(modal)
  modalRef.current = modal
  const dirtyRef = useRef(false)
  const pageRef = useRef(pageId)
  pageRef.current = pageId
  /** Set for realtime re-renders so the page keeps its scroll position. */
  const keepScrollRef = useRef(false)

  // Who the shared workflow acts as (set during render so the layout effect below already sees it).
  const isAdmin = !!user?.roleCodes?.includes("admin")
  const perms = isAdmin ? ["*"] : (user?.permissions || []).map((p) => p.code || p.id)
  setWorkflowContext({ role: () => roleRef.current, perms: () => perms, userName: () => userName })
  setAuditActor(() => ({ role: roleRef.current, name: userName }))

  // Realtime: badges always refresh; pages that show workflow or business data re-render in place, now
  // or after the open modal closes so forms are not wiped. Other pages keep their patched DOM untouched.
  useEffect(() => {
    workflowStarted ??= workflowStore.start()
    void vldcData.startAll()
    const onData = (shows: (page: string) => boolean) => () => {
      vldcActions.refresh()
      if (!shows(pageRef.current)) return
      if (modalRef.current) {
        dirtyRef.current = true
        return
      }
      keepScrollRef.current = true
      vldcActions.rerender()
    }
    const offWorkflow = workflowStore.onChange(onData((page) => WORKFLOW_PAGES.has(page)))
    const offData = vldcData.onAnyChange((key) => onData((page) => (DATASETS[key].pages as readonly string[]).includes(page))())
    return () => {
      offWorkflow()
      offData()
    }
  }, [])

  useEffect(() => {
    if (!modal && dirtyRef.current) {
      dirtyRef.current = false
      keepScrollRef.current = true
      vldcActions.rerender()
    }
  }, [modal])

  // Modals and the mobile drawer belong to the page that opened them.
  useEffect(() => {
    setMobileOpen(false)
    return vldcActions.closeModal
  }, [pageId])

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0")
    } catch {
      // private mode: the preference just isn't remembered
    }
  }, [collapsed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable=true]")
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (e.key === "/" && !typing) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useLayoutEffect(() => {
    if (!known) return
    setCurrentRole(role)
    renderPage(pageId)
    if (keepScrollRef.current) keepScrollRef.current = false
    else window.scrollTo({ top: 0 })
  }, [pageId, role, navSeq, known])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate("/auth", { replace: true })
    } catch {
      toast.error("Đăng xuất thất bại")
    }
  }

  const shellClass = ["vldc-scope", "vx-shell", collapsed && "is-collapsed", mobileOpen && "is-mobile-open"].filter(Boolean).join(" ")

  return (
    <div className={shellClass}>
      <VldcSidebar
        groups={menus.groups}
        loading={menus.loading}
        error={menus.error}
        onRetry={() => menus.retry()}
        pathname={pathname}
        role={role}
        userName={userName}
        initials={initialsOf(userName)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        onNavigate={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />
      <div className="vx-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <div className="vx-main">
        <VldcTopbar
          role={role}
          roles={roles}
          page={pageId}
          group={group}
          onRoleChange={setRole}
          onOpenMenu={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        {known ? (
          <section className="content" id="content" key={pageId} />
        ) : (
          <section className="content">
            <div className="vx-nav-empty">Không tìm thấy trang "{pageId}".</div>
          </section>
        )}
      </div>

      <VldcCommandPalette
        open={paletteOpen}
        groups={menus.groups}
        onClose={() => setPaletteOpen(false)}
        onSelect={(url) => {
          setPaletteOpen(false)
          navigate(url)
        }}
      />
      {modal && <VldcModal modal={modal} />}
    </div>
  )
}
