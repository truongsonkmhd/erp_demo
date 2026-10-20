import { useQuery } from "@tanstack/react-query"
import { getMyMenus, type MenuNode } from "@/services/MenuService"
import type { CurrentUser } from "@/services/auth/AuthService"

export type VldcMenuItem = { code: string; title: string; icon?: string | null; url: string; group: string }
export type VldcMenuGroup = { code: string; title: string; icon?: string | null; items: VldcMenuItem[] }

function toGroups(nodes: MenuNode[]): VldcMenuGroup[] {
  return nodes
    .map((group) => ({
      code: group.code,
      title: group.title,
      icon: group.icon,
      items: group.children
        .filter((child) => child.url)
        .map((child) => ({ code: child.code, title: child.title, icon: child.icon, url: child.url as string, group: group.title })),
    }))
    .filter((group) => group.items.length)
}

/** VLDC menu tree for the current user; the server already filtered it by "{page}:access". */
export function useVldcMenus(user: CurrentUser | null) {
  const query = useQuery({
    queryKey: ["menus", "vldc", user?.id],
    queryFn: () => getMyMenus("vldc"),
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    select: toGroups,
  })
  return { groups: query.data ?? [], loading: query.isLoading, error: query.isError, retry: query.refetch }
}

/** Accent/case-insensitive match so "ke toan" finds "Kế toán". */
export function normalizeVi(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
}
