/**
 * The backend answers a failed form check with "field: constraint" in English (Bean Validation), e.g.
 * "estimatedBudget: must be greater than 0". This turns it into the form's own words; any other message stays as it is.
 */

const FIELDS: Record<string, string> = {
  code: "Mã", name: "Tên", title: "Tên", description: "Mô tả", content: "Nội dung", note: "Ghi chú / lý do", reason: "Lý do",
  leadDepartmentId: "Đơn vị chủ trì", departmentId: "Đơn vị / tổ đội", estimatedBudget: "Ngân sách dự kiến",
  startDate: "Ngày bắt đầu", endDate: "Ngày kết thúc", dueDate: "Hạn hoàn thành", projectCode: "Dự án",
  assigneeUserId: "Người thực hiện", complexity: "Độ phức tạp", resultRequirement: "Kết quả yêu cầu",
  progress: "Tiến độ", evidence: "Minh chứng", toStatus: "Trạng thái",
}

const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^must not be (blank|null|empty)$/, () => "không được để trống"],
  [/^must be greater than 0$/, () => "phải lớn hơn 0"],
  [/^must be greater than or equal to (-?\d+)$/, (m) => (m[1] === "0" ? "không được âm" : `phải từ ${m[1]} trở lên`)],
  [/^must be less than or equal to (-?\d+)$/, (m) => `không được lớn hơn ${m[1]}`],
  [/^size must be between 0 and (\d+)$/, (m) => `tối đa ${m[1]} ký tự`],
  [/^size must be between (\d+) and (\d+)$/, (m) => `phải từ ${m[1]} đến ${m[2]} ký tự`],
  [/^must be a future date$|^must be a date in the present or in the future$/, () => "không được trước hôm nay"],
]

function one(part: string): string {
  const m = /^\s*([A-Za-z]+)\s*:\s*(.+?)\s*$/.exec(part)
  if (!m || !FIELDS[m[1]]) return part.trim()
  for (const [re, say] of RULES) {
    const r = m[2].match(re)
    if (r) return `${FIELDS[m[1]]} ${say(r)}`
  }
  return `${FIELDS[m[1]]}: ${m[2]}`
}

/** "estimatedBudget: must be greater than 0" → "Ngân sách dự kiến phải lớn hơn 0" (several "; "- or ", "-joined parts too). */
export function serverMessage(message: string): string {
  if (!/^\s*[A-Za-z]+\s*:/.test(message)) return message
  return message.split(/;\s*|,\s*(?=[A-Za-z]+\s*:)/).map(one).join(". ")
}
