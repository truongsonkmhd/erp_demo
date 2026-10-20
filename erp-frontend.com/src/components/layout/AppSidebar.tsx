import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeftRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronDown,
  Compass,
  Database,
  LayoutDashboard,
  Target,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocale } from "@/i18n/LocaleContext"
import { useAuth } from "@/services/auth/AuthContext"
import { getMyMenus } from "@/services/MenuService"
import {
  getSidebarItemStateClasses,
  getSidebarSubItemStateClasses,
} from "@/components/layout/sidebar-item-styles"

/** Icons for backend menu groups (tbl_menu.icon). The sidebar is fully data-driven. */
const menuIcons: Record<string, typeof BarChart3> = {
  workspace: LayoutDashboard,
  executive: Target,
  organization: Building2,
  core: BriefcaseBusiness,
  accounting: Calculator,
  crossflow: ArrowLeftRight,
  data: Database,
}

type NavGroupProps = {
  title: string
  icon: typeof BarChart3
  active: boolean
  open: boolean
  isCollapsed: boolean
  items: { title: string; url: string }[]
  currentPath: string
  onOpenChange: (open: boolean) => void
}

function NavGroup({ title, icon: Icon, active, open, isCollapsed, items, currentPath, onOpenChange }: NavGroupProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            type="button"
            aria-expanded={open}
            tooltip={isCollapsed ? title : undefined}
            className={`min-h-12 rounded-lg px-3 py-3 text-base transition-[color,box-shadow] ${
              isCollapsed ? "mx-auto !size-10 min-h-0 justify-center p-0" : "w-full"
            } ${getSidebarItemStateClasses(active)}`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!isCollapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left leading-5">{title}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((child) => (
              <SidebarMenuSubItem key={child.url}>
                <SidebarMenuSubButton
                  asChild
                  className={`min-h-9 rounded-lg transition-[color,box-shadow] ${getSidebarSubItemStateClasses(currentPath === child.url)}`}
                >
                  <NavLink to={child.url}>
                    <span>{child.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const { t } = useLocale()
  const { user } = useAuth()
  const { state, setOpen } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  // VLDC menu is data-driven: the server already filtered it by the user's page:access permissions.
  const { data: vldcMenus = [] } = useQuery({
    queryKey: ["menus", "vldc", user?.id],
    queryFn: () => getMyMenus("vldc"),
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  const vldcGroups = vldcMenus
    .map((group) => ({
      id: `vldc:${group.code}`,
      title: group.title,
      icon: menuIcons[group.icon || ""] || Compass,
      items: group.children.filter((child) => child.url).map((child) => ({ title: child.title, url: child.url as string })),
    }))
    .filter((group) => group.items.length)

  const findActiveGroup = (path: string) =>
    vldcGroups.find((group) => group.items.some((item) => item.url === path))?.id || ""

  const [openItem, setOpenItem] = useState(() => findActiveGroup(currentPath))
  const activeGroup = findActiveGroup(currentPath)

  useEffect(() => {
    if (activeGroup) setOpenItem(activeGroup)
  }, [activeGroup])

  const handleOpenChange = (id: string) => (nextOpen: boolean) => {
    if (isCollapsed) {
      setOpen(true)
      setOpenItem(id)
      return
    }
    setOpenItem(nextOpen ? id : "")
  }

  return (
    <Sidebar className="pt-16" collapsible="icon">
        <SidebarContent className="overflow-y-auto border-r border-sidebar-border bg-sidebar pt-2">
        <div className={`flex items-center ${isCollapsed ? "justify-center px-1" : "justify-between px-4"} mb-1 border-b border-sidebar-border py-3`}>
          {!isCollapsed && (
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t("nav.menu")}
            </span>
          )}
          <SidebarTrigger
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-sidebar-accent hover:text-brand-blue"
            title={isCollapsed ? t("nav.expand") : t("nav.collapse")}
          />
        </div>

        <SidebarGroup className={isCollapsed ? "px-2 py-2" : "px-2 py-3"}>
          <SidebarGroupContent>
            <SidebarMenu className={isCollapsed ? "space-y-1.5" : "space-y-2"}>
              {vldcGroups.map((group) => (
                <NavGroup
                  key={group.id}
                  title={group.title}
                  icon={group.icon}
                  active={group.items.some((item) => item.url === currentPath)}
                  open={openItem === group.id}
                  isCollapsed={isCollapsed}
                  items={group.items}
                  currentPath={currentPath}
                  onOpenChange={handleOpenChange(group.id)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
