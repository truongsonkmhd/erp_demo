import type { EmployeeProfile, EmployeeProfileFormData } from "./employee-profile.types.ts"

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9+() -]{9,15}$/

export function validateEmployeeProfileInput(
  input: Partial<EmployeeProfileFormData>,
  existingProfiles: EmployeeProfile[] = [],
  currentUserId?: string,
): ValidationResult {
  const errors: Record<string, string> = {}

  // 1. Mã cán bộ
  const code = (input.employeeCode || "").trim()
  if (!code) {
    errors.employeeCode = "Vui lòng nhập mã cán bộ"
  } else if (/\s/.test(input.employeeCode || "")) {
    errors.employeeCode = "Mã cán bộ không được chứa khoảng trắng"
  } else {
    const isDuplicate = existingProfiles.some(
      (p) => p.employeeCode.trim().toLowerCase() === code.toLowerCase() && p.userId !== currentUserId,
    )
    if (isDuplicate) {
      errors.employeeCode = "Mã cán bộ đã tồn tại trong hệ thống"
    }
  }

  // 2. Họ và tên
  const fullName = (input.fullName || "").trim()
  if (!fullName) {
    errors.fullName = "Vui lòng nhập họ và tên cán bộ"
  }

  // 3. Email
  const email = (input.email || "").trim()
  if (!email) {
    errors.email = "Vui lòng nhập địa chỉ email"
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Địa chỉ email không đúng định dạng"
  }

  // 4. Số điện thoại (nếu có)
  const phone = (input.phone || "").trim()
  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = "Số điện thoại không đúng định dạng"
  }

  // 5. Đơn vị
  const department = (input.department || "").trim()
  if (!department) {
    errors.department = "Vui lòng chọn hoặc nhập đơn vị công tác"
  }

  // 6. Vị trí việc làm
  const position = (input.position || "").trim()
  if (!position) {
    errors.position = "Vui lòng chọn hoặc nhập vị trí việc làm"
  }

  // 7. Trạng thái làm việc
  if (!input.workStatus) {
    errors.workStatus = "Vui lòng chọn trạng thái làm việc"
  }

  // 8. Ngày hiệu lực và hết hạn hợp đồng
  if (input.contractStartDate && input.contractEndDate) {
    const start = new Date(input.contractStartDate).getTime()
    const end = new Date(input.contractEndDate).getTime()
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      errors.contractEndDate = "Ngày hết hạn hợp đồng phải sau ngày hiệu lực"
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
