import { useSyncExternalStore } from "react"
import { flushSync } from "react-dom"
import { connectShell, getRoles, hasPage } from "@/features/vldc/legacy/engine"
import { redirectOf } from "@/features/vldc/data/menuPolicy"
import type { CurrentUser } from "@/services/auth/AuthService"

export const VLDC_ROOT = "/vldc"
const FALLBACK_ROLE = "hientruong"

export type VldcModal = { title: string; html: string; seq: number } | null

export type VldcShellState = {
  /** Bumped when show() targets the current page so it re-renders, as the legacy app did. */
  navSeq: number
  modal: VldcModal
  /** Bumped when legacy data that feeds the topbar badges changes. */
  badgeSeq: number
}

let state: VldcShellState = { navSeq: 0, modal: null, badgeSeq: 0 }
let navigate: (to: string) => void = () => {}
/** Set by rerender(): the next render keeps the scroll position (the same page drawn again, not a navigation). */
let keepScrollNext = false

export function consumeKeepScroll(): boolean {
  const keep = keepScrollNext
  keepScrollNext = false
  return keep
}

const listeners = new Set<() => void>()

function setState(patch: Partial<VldcShellState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** VldcPage registers the router's navigate so legacy inline show('x') calls become route changes. */
export function setVldcNavigator(fn: (to: string) => void) {
  navigate = fn
}

export const vldcActions = {
  show(page: string) {
    vldcActions.go(redirectOf(page))
  },
  /** Opens a page or one of its sub pages ("projects/VLDC-2027-001/giao-viec?wbs=W1"); the same address re-renders. */
  go(path: string) {
    if (!hasPage(path.split(/[/?]/)[0])) return
    const to = `${VLDC_ROOT}/${path}`
    if (window.location.pathname + window.location.search === to) setState({ navSeq: state.navSeq + 1 })
    else navigate(to)
  },
  openModal(title: string, html: string) {
    // Legacy callers run from native inline handlers; render synchronously so the modal
    // markup exists as soon as openModal() returns, like the original DOM code.
    const seq = (state.modal?.seq ?? 0) + 1
    flushSync(() => setState({ modal: { title, html, seq } }))
  },
  closeModal() {
    setState({ modal: null })
  },
  refresh() {
    setState({ badgeSeq: state.badgeSeq + 1 })
  },
  /** Re-renders the current page in place (used when shared workflow data changes). */
  rerender() {
    keepScrollNext = true
    setState({ navSeq: state.navSeq + 1 })
  },
}

connectShell(vldcActions)

export function useVldcShell(): VldcShellState {
  return useSyncExternalStore(subscribe, () => state)
}

/**
 * Legacy role keys the user may view the pages as (data scoping of tasks, calendar, notices...).
 * Backend VLDC roles share the legacy keys; admin may view as any of them, executive first.
 */
export function vldcRolesOf(user: CurrentUser | null): string[] {
  const codes = user?.roleCodes || (user?.role ? [user.role] : [])
  const all = Object.keys(getRoles())
  if (codes.includes("admin")) return all
  const own = all.filter((key) => codes.includes(key))
  return own.length ? own : [FALLBACK_ROLE]
}

let viewRole: string | null = null
const roleListeners = new Set<() => void>()

/** Role the pages are rendered as: the one picked in the topbar if allowed, else the user's first. */
export function useVldcRole(user: CurrentUser | null): [string, string[], (role: string) => void] {
  const roles = vldcRolesOf(user)
  const picked = useSyncExternalStore(
    (l) => {
      roleListeners.add(l)
      return () => roleListeners.delete(l)
    },
    () => viewRole,
  )
  const setRole = (role: string) => {
    viewRole = role
    roleListeners.forEach((l) => l())
  }
  return [picked && roles.includes(picked) ? picked : roles[0], roles, setRole]
}
