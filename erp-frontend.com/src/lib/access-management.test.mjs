import test from "node:test"
import assert from "node:assert/strict"

const { canAccess, firstAllowedPath } = await import("./permissions.ts")

test("chỉ người có quyền vai trò truy cập được khu quản trị truy cập", () => {
  const roleViewer = { role: "staff", roleCodes: ["staff"], permissions: [{ code: "roles:access" }] }
  const userManager = { role: "staff", roleCodes: ["staff"], permissions: [{ code: "users:access" }] }
  assert.equal(canAccess(roleViewer, "access-management"), true)
  assert.equal(canAccess(userManager, "access-management"), false)
})

test("tài khoản chỉ có quyền vai trò vào trang quản trị mới; điều hướng nhân sự hiện có không đổi", () => {
  const roleViewer = { role: "staff", roleCodes: ["staff"], permissions: [{ code: "roles:access" }] }
  const userManager = { role: "staff", roleCodes: ["staff"], permissions: [{ code: "users:access" }] }
  assert.equal(firstAllowedPath(roleViewer), "/access-management")
  assert.equal(firstAllowedPath(userManager), "/nhan-su-tien-luong/ho-so-nhan-su")
})
