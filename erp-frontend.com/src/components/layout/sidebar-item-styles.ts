export function getSidebarItemStateClasses(active: boolean) {
  return active
    ? "border border-sidebar-ring/50 !bg-sidebar-active-bg font-medium !text-sidebar-active-text hover:!bg-sidebar-active-bg hover:!text-sidebar-active-text hover:shadow-md"
    : "border border-transparent !bg-transparent font-normal text-sidebar-foreground hover:border-sidebar-border hover:!bg-transparent hover:text-sidebar-foreground hover:shadow-md"
}

export function getSidebarSubItemStateClasses(active: boolean) {
  return active
    ? "!bg-transparent font-medium !text-sidebar-active-text hover:!bg-transparent hover:!text-sidebar-active-text hover:shadow-sm"
    : "!bg-transparent font-normal text-sidebar-foreground hover:!bg-transparent hover:text-sidebar-active-text hover:shadow-sm"
}
