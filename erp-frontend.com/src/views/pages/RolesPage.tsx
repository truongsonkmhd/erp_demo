import { useEffect, useMemo, useState } from "react"
import { Plus, Shield, Trash2, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

import { ActionButton } from "@/components/ui/action-button"
import { appToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { BoatLoading } from "@/components/ui/boat-loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTableColumn, PaginatedDataTable } from "@/components/ui/paginated-data-table"
import { SelectField } from "@/components/ui/form-fields"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { slugifyRoleCode, FIXED_ROLE_LEVELS, isAdminRole, isRoleWithoutLevels } from "@/constants/roles"
import { useEmployees } from "@/hooks/useEmployees"
import { useRoles } from "@/hooks/useRoles"
import { addEmployee, deleteEmployee, resetEmployeePassword, updateEmployee, DEFAULT_EMPLOYEE_PASSWORD } from "@/services/EmployeeService"
import { addRole, deleteRole, getPermissions, updateRole } from "@/services/RoleService"
import { addDepartment, deleteDepartment, getDepartments, updateDepartment, Department } from "@/services/DepartmentService"
import { EmployeeAccount, EmployeeAccountInput, RoleDefinition, RoleDefinitionInput, RolePermission } from "@/types/auth"
import { useAuth } from "@/services/auth/AuthContext"
import { can } from "@/lib/permissions"
import { managementTabs, type ManagementArea } from "./management-tabs"

const EMPTY_EMPLOYEE: EmployeeAccountInput = {
  fullName: "",
  email: "",
  phone: "",
  role: "",
  roleCodes: [],
  accountType: 2,
  levelId: "",
  baseSalary: 0,
  active: true,
}

const EMPTY_ROLE: RoleDefinitionInput = {
  code: "",
  name: "",
  summary: "",
  levels: FIXED_ROLE_LEVELS,
  permissions: [],
  departmentId: null,
}

export default function RolesPage({ area = "full" }: { area?: ManagementArea }) {
  const { user: currentUser } = useAuth()
  const canManageUsers = area === "full" && can(currentUser, "users:access")
  const canManageRoles = can(currentUser, "roles:access")
  const tabs = managementTabs({ area, canUsers: canManageUsers, canRoles: canManageRoles })
  const { employees, isLoading: loadingEmployees, refetch: refetchEmployees } = useEmployees(canManageUsers)
  const { roles, isLoading: loadingRoles, refetch: refetchRoles } = useRoles()

  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EmployeeAccount | null>(null)
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null)
  const [userForm, setUserForm] = useState<EmployeeAccountInput>(EMPTY_EMPLOYEE)
  const [roleForm, setRoleForm] = useState<RoleDefinitionInput>(EMPTY_ROLE)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(() => area === "access" ? "departments" : canManageUsers ? "users" : "roles")
  const [configRoleId, setConfigRoleId] = useState("")
  const [configPermissionIds, setConfigPermissionIds] = useState<string[]>([])
  const [catalogPermissions, setCatalogPermissions] = useState<RolePermission[]>([])
  const [resetTarget, setResetTarget] = useState<EmployeeAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmployeeAccount | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentForm, setDepartmentForm] = useState({ code: "", name: "", description: "" })

  const refreshDepartments = async () => setDepartments(await getDepartments())

  useEffect(() => {
    if (!can(currentUser, "roles:access") && !can(currentUser, "users:access")) return
    void refreshDepartments().catch(() => appToast.error("Không thể tải phòng ban"))
  }, [currentUser])

  const uniqueRoles = useMemo(() => {
    const seen = new Set<string>()
    return roles.filter((role) => {
      const key = (role.code || role.name || role.id).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [roles])

  const roleOptions = uniqueRoles.map((role) => ({ value: role.id, label: role.name }))
  const visibleRoles = uniqueRoles.filter((role) => !isAdminRole(role))
  const selectedRole = uniqueRoles.find((role) => role.id === userForm.role) || uniqueRoles.find((role) => role.code === userForm.role)
  const selectedRoleHasNoLevels = isRoleWithoutLevels(selectedRole)
  const levels = selectedRoleHasNoLevels ? [] : selectedRole?.levels ?? []
  const levelOptions = levels.map((level, index) => ({ value: level.id || `level-${index}`, label: level.name }))
  const configRole = uniqueRoles.find((role) => role.id === configRoleId)
  const configRoleIsAdmin = isAdminRole(configRole)
  const rolePermissionOptions = useMemo(() => {
    if (!configRole) return []
    const collected: RolePermission[] = [
      ...catalogPermissions,
      ...(configRole.permissions || []),
    ]
    const seen = new Set<string>()
    return collected.filter((permission) => {
      if (!permission?.id || seen.has(permission.id)) return false
      seen.add(permission.id)
      return true
    })
  }, [catalogPermissions, configRole])
  const matrixPages = useMemo(() => Array.from(new Set(rolePermissionOptions.map((permission) => permission.pageCode).filter(Boolean))) as string[], [rolePermissionOptions])

  useEffect(() => {
    if (!can(currentUser, "roles:access")) return
    let active = true
    void getPermissions()
      .then((items) => {
        if (active) setCatalogPermissions(items)
      })
      .catch(() => {
        if (active) setCatalogPermissions([])
      })
    return () => {
      active = false
    }
  }, [roles, currentUser])

  useEffect(() => {
    if (!configRoleId && uniqueRoles[0]) setConfigRoleId(uniqueRoles[0].id)
  }, [configRoleId, uniqueRoles])

  useEffect(() => {
    if (configRoleIsAdmin) {
      setConfigPermissionIds(catalogPermissions.map((item) => item.id))
      return
    }
    setConfigPermissionIds((configRole?.permissions || []).map((item) => item.id))
  }, [configRole, configRoleIsAdmin, catalogPermissions])

  const findRole = (code: string) => uniqueRoles.find((role) => role.code === code || role.id === code)

  const openCreateUser = () => {
    const first = uniqueRoles[0]
    setEditingUser(null)
    setUserForm({
      ...EMPTY_EMPLOYEE,
      role: first?.id || "",
      roleCodes: first ? [first.code] : [],
      accountType: 2,
      levelId: isRoleWithoutLevels(first) ? "" : first?.levels[0]?.id || "",
    })
    setUserDialogOpen(true)
  }

  const openEditUser = (employee: EmployeeAccount) => {
    setEditingUser(employee)
    setUserForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone || "",
      role: findRole(employee.role)?.id || employee.role,
      roleCodes: employee.roleCodes || [employee.role],
      accountType: employee.accountType || 2,
      levelId: isRoleWithoutLevels(employee.role) || isRoleWithoutLevels(findRole(employee.role)) ? "" : employee.levelId,
      baseSalary: employee.baseSalary ?? 0,
      active: employee.active,
    })
    setUserDialogOpen(true)
  }

  const changeUserRole = (roleId: string) => {
    const next = uniqueRoles.find((role) => role.id === roleId)
    setUserForm((current) => ({
      ...current,
      role: roleId,
      roleCodes: Array.from(new Set([next?.code || roleId, ...current.roleCodes.slice(1)])),
      levelId: isRoleWithoutLevels(next) ? "" : next?.levels[0]?.id || "",
    }))
  }

  const saveUser = async () => {
    if (!userForm.fullName.trim() || !userForm.email.trim() || !userForm.roleCodes.length) {
      appToast.error("Thiếu thông tin", "Nhập họ tên, email và role.")
      return
    }
    const email = userForm.email.trim()
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      appToast.error("Email không hợp lệ", "Vui lòng nhập địa chỉ email đăng nhập hợp lệ.")
      return
    }
    const roleCode = findRole(userForm.role)?.code || userForm.role
    const payload = {
      ...userForm,
      email,
      role: roleCode,
      roleCodes: userForm.roleCodes,
      levelId: isRoleWithoutLevels(roleCode) ? "" : userForm.levelId,
    }
    setIsSaving(true)
    try {
      if (editingUser) await updateEmployee(editingUser.id, payload)
      else await addEmployee(payload)
      await refetchEmployees({ silent: true })
      setUserDialogOpen(false)
      appToast.success(
        editingUser ? "Đã cập nhật người dùng" : "Đã tạo người dùng",
        editingUser ? undefined : `Mật khẩu mặc định: ${DEFAULT_EMPLOYEE_PASSWORD}`
      )
    } catch (error) {
      console.error(error)
      appToast.error("Không thể lưu người dùng")
    } finally {
      setIsSaving(false)
    }
  }

  const resetUserPassword = async () => {
    if (!resetTarget) return
    try {
      await resetEmployeePassword(resetTarget.id)
      appToast.success("Đã reset mật khẩu", `Mật khẩu mặc định: ${DEFAULT_EMPLOYEE_PASSWORD}`)
    } catch (error) {
      console.error(error)
      appToast.error("Không thể reset mật khẩu")
    } finally {
      setResetTarget(null)
    }
  }

  const removeUser = async () => {
    if (!deleteTarget) return
    try {
      await deleteEmployee(deleteTarget.id)
      await refetchEmployees({ silent: true })
      appToast.success("Đã xóa người dùng")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể xóa người dùng")
    } finally {
      setDeleteTarget(null)
    }
  }

  const openCreateRole = () => {
    setEditingRole(null)
    setRoleForm(EMPTY_ROLE)
    setRoleDialogOpen(true)
  }

  const openEditRole = (role: RoleDefinition) => {
    setEditingRole(role)
    setRoleForm({
      code: role.code,
      name: role.name,
      summary: role.summary,
      departmentId: role.departmentId,
      levels: isRoleWithoutLevels(role) ? [] : (role.levels?.length ? role.levels : EMPTY_ROLE.levels),
      permissions: role.permissions?.length ? role.permissions : EMPTY_ROLE.permissions,
    })
    setRoleDialogOpen(true)
  }

  const toggleLevel = (level: typeof FIXED_ROLE_LEVELS[0]) => {
    setRoleForm((prev) => {
      const isSelected = prev.levels.some(
        (l) => l.id === level.id || l.name.toLowerCase() === level.name.toLowerCase()
      )
      if (isSelected) {
        if (prev.levels.length <= 1) {
          appToast.error("Giữ ít nhất 1 cấp", "Vai trò cần giữ ít nhất 1 cấp bậc.")
          return prev
        }
        return {
          ...prev,
          levels: prev.levels.filter(
            (l) => l.id !== level.id && l.name.toLowerCase() !== level.name.toLowerCase()
          ),
        }
      } else {
        const order = ["executive", "senior", "manager", "director"]
        const updated = [...prev.levels, level].sort((a, b) => {
          const indexA = order.indexOf(a.id) !== -1 ? order.indexOf(a.id) : 99
          const indexB = order.indexOf(b.id) !== -1 ? order.indexOf(b.id) : 99
          return indexA - indexB
        })
        return { ...prev, levels: updated }
      }
    })
  }

  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      appToast.error("Thiếu tên role")
      return
    }
    if (!isRoleWithoutLevels(roleForm) && (!roleForm.levels || roleForm.levels.length === 0)) {
      appToast.error("Thiếu cấp bậc", "Vui lòng chọn ít nhất 1 cấp bậc cho vai trò.")
      return
    }
    const payload: RoleDefinitionInput = {
      ...roleForm,
      code: roleForm.code.trim() || slugifyRoleCode(roleForm.name),
      levels: roleForm.levels,
      permissions: roleForm.permissions.filter((permission) => permission.label.trim()),
    }
    setIsSaving(true)
    try {
      if (editingRole) await updateRole(editingRole.id, payload)
      else await addRole(payload)
      await refetchRoles({ silent: true })
      setRoleDialogOpen(false)
      appToast.success(editingRole ? "Đã cập nhật role" : "Đã tạo role")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể lưu role")
    } finally {
      setIsSaving(false)
    }
  }

  const removeRole = async (role: RoleDefinition) => {
    if (!confirm(`Xóa role "${role.name}"?`)) return
    try {
      await deleteRole(role.id)
      await refetchRoles({ silent: true })
      appToast.success("Đã xóa role")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể xóa role")
    }
  }

  const openDepartment = (department?: Department) => {
    setEditingDepartment(department || null)
    setDepartmentForm(department ? { code: department.code, name: department.name, description: department.description || "" } : { code: "", name: "", description: "" })
    setDepartmentDialogOpen(true)
  }

  const saveDepartment = async () => {
    if (!departmentForm.code.trim() || !departmentForm.name.trim()) {
      appToast.error("Nhập mã và tên phòng ban")
      return
    }
    setIsSaving(true)
    try {
      if (editingDepartment) await updateDepartment(editingDepartment.id, departmentForm)
      else await addDepartment(departmentForm)
      await refreshDepartments()
      await refetchRoles({ silent: true })
      setDepartmentDialogOpen(false)
      appToast.success("Đã lưu phòng ban")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể lưu phòng ban")
    } finally { setIsSaving(false) }
  }

  const removeDepartment = async (department: Department) => {
    if (!confirm(`Xóa phòng ban "${department.name}"? Phòng ban còn role sẽ không thể xóa.`)) return
    try {
      await deleteDepartment(department.id)
      await refreshDepartments()
      appToast.success("Đã xóa phòng ban")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể xóa phòng ban", "Hãy chuyển các role ra khỏi phòng ban trước.")
    }
  }

  const saveRolePermissions = async () => {
    if (!configRole) {
      appToast.error("Hãy chọn vai trò")
      return
    }
    if (configRoleIsAdmin) return
    setIsSaving(true)
    try {
      await updateRole(configRole.id, {
        code: configRole.code,
        permissions: rolePermissionOptions.filter((item) => configPermissionIds.includes(item.id)),
      })
      await refetchRoles({ silent: true })
      appToast.success("Đã lưu quyền cho vai trò")
    } catch (error) {
      console.error(error)
      appToast.error("Không thể lưu quyền")
    } finally {
      setIsSaving(false)
    }
  }

  const userColumns: DataTableColumn<EmployeeAccount>[] = [
    { key: "index", header: "STT", headClassName: "w-14 min-w-14 text-center", cellClassName: "text-center", render: (_, index) => index + 1 },
    { key: "fullName", header: "Họ và tên", headClassName: "min-w-44", cellClassName: "font-medium", render: (item) => item.fullName },
    { key: "email", header: "Email đăng nhập", headClassName: "min-w-52", render: (item) => item.email },
    { key: "phone", header: "Điện thoại", headClassName: "min-w-32", render: (item) => item.phone || "—" },
    { key: "accountType", header: "Loại tài khoản", headClassName: "min-w-36", render: (item) => ({ 1: "Admin", 2: "Nhân viên", 3: "Bên ngoài" }[item.accountType]) },
    {
      key: "baseSalary",
      header: "Lương cơ bản",
      headClassName: "min-w-40 text-right",
      cellClassName: "text-right font-medium",
      render: (item) =>
        item.baseSalary
          ? `${item.baseSalary.toLocaleString("vi-VN")} VNĐ`
          : "—",
    },
    {
      key: "role",
      header: "Role / Quyền",
      headClassName: "min-w-40",
      render: (item) => (
        <div className="flex flex-wrap gap-1">{item.roleCodes.map((code) => <Badge key={code} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">{findRole(code)?.name || code}</Badge>)}</div>
      ),
    },
    {
      key: "level",
      header: "Cấp bậc",
      headClassName: "min-w-44",
      render: (item) =>
        isRoleWithoutLevels(item.role) || isRoleWithoutLevels(findRole(item.role))
          ? "—"
          : findRole(item.role)?.levels.find((level) => level.id === item.levelId)?.name || item.levelId || "—",
    },
    {
      key: "active",
      header: "Trạng thái",
      headClassName: "min-w-28 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <Badge variant="outline" className={item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
          {item.active ? "Đang dùng" : "Tạm khóa"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Hành động",
      headClassName: "w-64 min-w-64 text-center",
      cellClassName: "text-center",
      render: (item) => (
        <div className="flex justify-center gap-2">
          {can(currentUser, "users:update") && <Button size="sm" variant="outline" className="h-8" onClick={() => openEditUser(item)}>Sửa</Button>}
          {can(currentUser, "users:update") && <Button size="sm" variant="outline" className="h-8" onClick={() => setResetTarget(item)}>Reset MK</Button>}
          {can(currentUser, "users:delete") && <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={() => setDeleteTarget(item)}>Xóa</Button>}
        </div>
      ),
    },
  ]

  const isLoading = (canManageUsers && loadingEmployees) || loadingRoles

  return (
    <div className="space-y-6 px-3 sm:px-0">
      {isLoading && <BoatLoading fullScreen label="Đang tải quyền và người dùng" />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{area === "access" ? "Quản trị truy cập" : "Người dùng & vai trò"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {area === "access" ? "Quản lý phòng ban, vai trò và phân quyền Page × Action." : "Quản lý tài khoản nhân viên, vai trò và cấu hình quyền."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(activeTab === "roles" || activeTab === "permissions") && can(currentUser, "roles:create") && (
            <ActionButton appearance="outline" icon={<Plus className="h-4 w-4" />} onClick={openCreateRole}>
              Tạo vai trò
            </ActionButton>
          )}
          {activeTab === "departments" && can(currentUser, "roles:create") && (
            <ActionButton icon={<Plus className="h-4 w-4" />} onClick={() => openDepartment()}>Tạo phòng ban</ActionButton>
          )}
          {area === "full" && activeTab === "users" && can(currentUser, "users:create") && (
            <ActionButton icon={<Plus className="h-4 w-4" />} onClick={openCreateUser}>
              Tạo người dùng
            </ActionButton>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="gap-2 bg-transparent p-0">
          {tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}
        </TabsList>

        {area === "full" && (
        <TabsContent value="users" className="mt-5">
          <PaginatedDataTable
            data={employees}
            columns={userColumns}
            rowKey={(item) => item.id}
            emptyMessage="Chưa có người dùng. Hãy tạo tài khoản và gán vai trò."
            minTableWidth="1400px"
            bordered={false}
            stickyLastColumn
            defaultPageSize={50}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </TabsContent>
        )}

        <TabsContent value="departments" className="mt-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {departments.map((department) => (
              <Card key={department.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div><CardTitle>{department.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{department.code}</p></div>
                    <div className="flex gap-1">
                      {can(currentUser, "roles:update") && <Button size="sm" variant="outline" onClick={() => openDepartment(department)}>Sửa</Button>}
                      {can(currentUser, "roles:delete") && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void removeDepartment(department)}>Xóa</Button>}
                    </div>
                  </div>
                  {department.description && <p className="text-sm text-muted-foreground">{department.description}</p>}
                </CardHeader>
                <CardContent>
                  <p className="mb-2 text-sm font-medium">Vai trò trong phòng ban</p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueRoles.filter((role) => role.departmentId === department.id).map((role) => <Badge key={role.id} variant="outline">{role.name}</Badge>)}
                    {!uniqueRoles.some((role) => role.departmentId === department.id) && <span className="text-sm text-muted-foreground">Chưa có vai trò</span>}
                  </div>
                  {can(currentUser, "roles:create") && <Button size="sm" variant="outline" className="mt-4" onClick={() => { setEditingRole(null); setRoleForm({ ...EMPTY_ROLE, departmentId: department.id }); setRoleDialogOpen(true) }}>Thêm vai trò</Button>}
                </CardContent>
              </Card>
            ))}
          </div>
          {!departments.length && <p className="text-sm text-muted-foreground">Chưa có phòng ban.</p>}
        </TabsContent>

        <TabsContent value="roles" className="mt-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {visibleRoles.map((role) => (
                <Card key={role.id} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-brand-blue" />
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {can(currentUser, "roles:update") && <Button size="sm" variant="outline" className="h-8" onClick={() => openEditRole(role)}>Sửa</Button>}
                        {can(currentUser, "roles:delete") && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => void removeRole(role)} aria-label="Xóa role">
                          <Trash2 className="h-4 w-4" />
                        </Button>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.summary}</p>
                    <p className="text-xs text-muted-foreground">Phòng ban: {role.departmentName || "Chưa gán"}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isAdminRole(role) ? (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="mb-1 text-sm font-semibold text-blue-900">Full quyền — không phân cấp bậc</p>
                        <p className="text-sm text-blue-800">
                          Tài khoản Admin luôn có toàn bộ quyền hệ thống, không cần cấu hình theo cấp.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="mb-2 text-sm font-semibold">Quyền áp dụng cho toàn bộ vai trò</p>
                        {(role.permissions || []).length ? (
                          <ul className="space-y-1 text-sm text-slate-600">
                            {role.permissions.map((permission) => (
                              <li key={permission.id}>{permission.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">Chưa gán quyền cho vai trò này.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-5">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-extrabold text-slate-900">
                    {configRoleIsAdmin ? "Quyền Admin" : "Cấu hình quyền vai trò"}
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {configRoleIsAdmin
                      ? "Tài khoản Admin luôn có toàn bộ quyền hệ thống."
                      : "Quyền được áp dụng cho toàn bộ tài khoản thuộc vai trò."}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Chọn vai trò */}
              <div className="grid gap-4 sm:grid-cols-1">
                <SelectField
                  label="Vai trò"
                  placeholder="Chọn vai trò"
                  options={roleOptions}
                  value={configRoleId}
                  onValueChange={setConfigRoleId}
                  triggerClassName="bg-white"
                />
              </div>

              {/* Ma trận quyền Page × Action */}
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[600px] text-sm">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left">Trang</th>{["access", "create", "update", "delete"].map((action) => <th key={action} className="p-3 text-center">{{ access: "Truy cập", create: "Tạo mới", update: "Chỉnh sửa", delete: "Xóa" }[action]}</th>)}</tr></thead>
                  <tbody>{matrixPages.map((page) => <tr key={page} className="border-t">
                    <td className="p-3 font-medium">{rolePermissionOptions.find((permission) => permission.pageCode === page)?.label.split(" - ")[0] || page}</td>
                    {["access", "create", "update", "delete"].map((action) => {
                      const permission = rolePermissionOptions.find((item) => item.pageCode === page && item.actionCode === action)
                      return <td key={action} className="p-3 text-center">{permission && <Checkbox checked={configRoleIsAdmin || configPermissionIds.includes(permission.id)} disabled={configRoleIsAdmin || !can(currentUser, "roles:update")}
                        onCheckedChange={(checked) => setConfigPermissionIds((current) => checked ? [...new Set([...current, permission.id])] : current.filter((id) => id !== permission.id))} />}</td>
                    })}
                  </tr>)}</tbody>
                </table>
              </div>
              {/* Footer Save Button */}
              {!configRoleIsAdmin && can(currentUser, "roles:update") && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-start">
                <ActionButton
                  onClick={() => void saveRolePermissions()}
                  disabled={isSaving || !configRole}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-5"
                >
                  {isSaving ? "Đang lưu..." : "Lưu quyền vai trò"}
                </ActionButton>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Sửa người dùng & quyền" : "Tạo người dùng"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">Họ và tên</Label>
              <Input value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Email đăng nhập</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={userForm.email}
                  onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Điện thoại</Label>
                <Input value={userForm.phone} onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))} />
              </div>
            </div>
            <div className={cn("grid gap-4", selectedRoleHasNoLevels ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
              <SelectField
                label="Role"
                required
                placeholder="Chọn role"
                options={roleOptions}
                value={userForm.role}
                onValueChange={changeUserRole}
                triggerClassName="bg-white"
              />
              {!selectedRoleHasNoLevels && (
                <SelectField
                  label="Cấp bậc"
                  placeholder="Chọn cấp bậc"
                  options={levelOptions}
                  value={userForm.levelId}
                  onValueChange={(value) => setUserForm((current) => ({ ...current, levelId: value }))}
                  triggerClassName="bg-white"
                />
              )}
            </div>
            <div>
              <Label className="mb-2 block">Các vai trò của tài khoản</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                {uniqueRoles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={userForm.roleCodes.includes(role.code)} onCheckedChange={(checked) => setUserForm((current) => {
                    const roleCodes = checked ? [...new Set([...current.roleCodes, role.code])] : current.roleCodes.filter((code) => code !== role.code)
                    return { ...current, roleCodes, role: roleCodes[0] || "" }
                  })} />{role.name}
                </label>)}
              </div>
            </div>
            <SelectField label="Loại tài khoản" options={[{ value: "1", label: "Admin" }, { value: "2", label: "Nhân viên" }, { value: "3", label: "Bên ngoài" }]}
              value={String(userForm.accountType)} onValueChange={(value) => setUserForm((current) => ({ ...current, accountType: Number(value) as 1 | 2 | 3 }))} />
            <p className="text-xs text-slate-500">Loại tài khoản chỉ để phân loại; quyền truy cập do vai trò quyết định.</p>
            <div>
              <Label className="mb-1.5 block">Lương cơ bản (VNĐ)</Label>
              <Input
                type="number"
                min={0}
                value={userForm.baseSalary || ""}
                onChange={(event) =>
                  setUserForm((current) => ({
                    ...current,
                    baseSalary: Number(event.target.value) || 0,
                  }))
                }
                placeholder="Nhập lương cơ bản"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label htmlFor="employee-active">Tài khoản đang hoạt động</Label>
              <Switch id="employee-active" checked={userForm.active} onCheckedChange={(checked) => setUserForm((current) => ({ ...current, active: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Hủy</Button>
            <ActionButton onClick={() => void saveUser()} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editingUser ? "Cập nhật" : "Tạo người dùng"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Sửa vai trò" : "Tạo vai trò"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block">Tên role</Label>
                <Input
                  value={roleForm.name}
                  onChange={(event) => setRoleForm((current) => ({
                    ...current,
                    name: event.target.value,
                    code: editingRole ? current.code : slugifyRoleCode(event.target.value),
                  }))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Mã role</Label>
                <Input value={roleForm.code} onChange={(event) => setRoleForm((current) => ({ ...current, code: event.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Mô tả quyền</Label>
              <Textarea rows={3} value={roleForm.summary} onChange={(event) => setRoleForm((current) => ({ ...current, summary: event.target.value }))} />
            </div>
            <div>
              <Label className="mb-1.5 block">Phòng ban</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={roleForm.departmentId ?? ""} onChange={(event) => setRoleForm((current) => ({ ...current, departmentId: event.target.value ? Number(event.target.value) : 0 }))}>
                <option value="">Chưa gán phòng ban</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </div>

            {!isRoleWithoutLevels(roleForm) && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn cấp bậc áp dụng cho vai trò này:
                </Label>
                <span className="text-[11px] text-blue-600 font-semibold">
                  Đã chọn: {roleForm.levels.length} / 4 cấp
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {FIXED_ROLE_LEVELS.map((level, idx) => {
                  const isSelected = roleForm.levels.some(
                    (l) => l.id === level.id || l.name.toLowerCase() === level.name.toLowerCase()
                  )
                  return (
                    <div
                      key={level.id}
                      onClick={() => toggleLevel(level)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-3 rounded-xl text-center cursor-pointer transition-all duration-200 select-none",
                        isSelected
                          ? "bg-white border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20 scale-[1.02]"
                          : "bg-slate-50 border border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300"
                      )}
                    >
                      <div className="absolute top-2 right-2">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-100" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <Badge className={cn("text-[10px] uppercase font-bold mb-1", isSelected ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600")}>
                        Level {idx + 1}
                      </Badge>
                      <span className={cn("text-xs font-extrabold", isSelected ? "text-slate-900" : "text-slate-500")}>
                        {level.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                        {level.id === "executive" && "Tuyến đầu"}
                        {level.id === "senior" && "Cấp cao"}
                        {level.id === "manager" && "Quản lý"}
                        {level.id === "director" && "Giám đốc"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Hủy</Button>
            <ActionButton onClick={() => void saveRole()} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editingRole ? "Cập nhật vai trò" : "Tạo vai trò"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingDepartment ? "Sửa phòng ban" : "Tạo phòng ban"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Mã phòng ban</Label><Input value={departmentForm.code} onChange={(event) => setDepartmentForm((current) => ({ ...current, code: event.target.value }))} /></div>
            <div><Label>Tên phòng ban</Label><Input value={departmentForm.name} onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))} /></div>
            <div><Label>Mô tả</Label><Textarea value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDepartmentDialogOpen(false)}>Hủy</Button><Button disabled={isSaving} onClick={() => void saveDepartment()}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(resetTarget)}
        title="Reset mật khẩu"
        description={`Reset mật khẩu của "${resetTarget?.fullName || ""}" về mặc định ${DEFAULT_EMPLOYEE_PASSWORD}?`}
        confirmLabel="Reset"
        cancelLabel="Hủy"
        onOpenChange={(open) => !open && setResetTarget(null)}
        onConfirm={() => void resetUserPassword()}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Xác nhận xóa"
        description={`Xóa người dùng "${deleteTarget?.fullName || ""}"?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => void removeUser()}
      />

    </div>
  )
}
