import { apiRequest } from "@/lib/api"

/** Node of the backend menu tree (tbl_menu); groups have no url, leaves point at a page. */
export interface MenuNode {
  id: number
  code: string
  title: string
  icon?: string | null
  url?: string | null
  pageCode?: string | null
  module: string
  sortOrder: number
  children: MenuNode[]
}

/** Menus the current user may see — already filtered by "{pageCode}:access" on the server. */
export const getMyMenus = (module?: string) =>
  apiRequest<MenuNode[]>(`/api/menus/me${module ? `?module=${encodeURIComponent(module)}` : ""}`)
