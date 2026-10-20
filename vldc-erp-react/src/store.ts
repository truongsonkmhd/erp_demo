import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { connectShell, hasPage, setCurrentRole } from './legacy/engine';

export type ModalState = { title: string; html: string; seq: number } | null;

export type ShellState = {
  loggedIn: boolean;
  role: string;
  page: string;
  /** Bumped on every navigation so show() of the current page re-renders it, as the original did. */
  navSeq: number;
  modal: ModalState;
  /** Bumped when legacy data that feeds the topbar badges changes. */
  badgeSeq: number;
};

let state: ShellState = {
  loggedIn: false,
  role: 'lanhdao',
  page: 'dashboard',
  navSeq: 0,
  modal: null,
  badgeSeq: 0
};

const listeners = new Set<() => void>();

function setState(patch: Partial<ShellState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const actions = {
  login(role: string) {
    setCurrentRole(role);
    setState({ loggedIn: true, role, page: 'dashboard', navSeq: state.navSeq + 1 });
  },
  switchRole(role: string) {
    setCurrentRole(role);
    setState({ role, page: 'dashboard', navSeq: state.navSeq + 1 });
  },
  show(page: string) {
    if (!hasPage(page)) return;
    setState({ page, navSeq: state.navSeq + 1 });
  },
  openModal(title: string, html: string) {
    // Legacy callers run from native inline handlers; render the modal synchronously
    // so its markup exists as soon as openModal() returns, like the original DOM code.
    const seq = (state.modal?.seq ?? 0) + 1;
    flushSync(() => setState({ modal: { title, html, seq } }));
  },
  closeModal() {
    setState({ modal: null });
  },
  refresh() {
    setState({ badgeSeq: state.badgeSeq + 1 });
  }
};

connectShell(actions);

export function useShell(): ShellState {
  return useSyncExternalStore(subscribe, () => state);
}
