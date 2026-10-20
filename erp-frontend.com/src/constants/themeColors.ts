/**
 * Shared System Design Color Tokens
 * Hoàng Minh Logistics / FOBCO Group Unified Color Palette & Theme Tokens
 */

export const BRAND_COLORS = {
  // Brand Blue Primary (#0265DC)
  primary: {
    hex: "#0265DC",
    main: "bg-blue-600 text-white",
    hover: "hover:bg-blue-700",
    lightBg: "bg-blue-50/60",
    border: "border-blue-200",
    text: "text-blue-700",
    ring: "focus:ring-blue-500",
  },
  // Brand Orange Secondary (#F2541B)
  secondary: {
    hex: "#F2541B",
    main: "bg-orange-500 text-white",
    hover: "hover:bg-orange-600",
    lightBg: "bg-orange-50/60",
    border: "border-orange-200",
    text: "text-orange-600",
  },
  // Success / Completed / KH Cũ
  success: {
    hex: "#10B981",
    main: "bg-emerald-600 text-white",
    hover: "hover:bg-emerald-700",
    lightBg: "bg-emerald-50/70",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  // Info / Data Mới / KH Mới
  info: {
    hex: "#0284C7",
    main: "bg-sky-600 text-white",
    hover: "hover:bg-sky-700",
    lightBg: "bg-sky-50/70",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  // Warning / Attention
  warning: {
    hex: "#F59E0B",
    main: "bg-amber-500 text-white",
    hover: "hover:bg-amber-600",
    lightBg: "bg-amber-50/70",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  // Danger / Reject
  danger: {
    hex: "#DC2626",
    main: "bg-red-600 text-white",
    hover: "hover:bg-red-700",
    lightBg: "bg-red-50/70",
    border: "border-red-200",
    text: "text-red-600",
  },
  // Neutral Slate
  neutral: {
    cardBg: "bg-white",
    border: "border-slate-200",
    textDark: "text-slate-900",
    textMuted: "text-slate-500",
  },
} as const

// Standardized Badge styling helper
export const getStatusBadgeStyle = (status: "success" | "warning" | "danger" | "info" | "primary") => {
  switch (status) {
    case "success":
      return "bg-emerald-600 text-white hover:bg-emerald-600 font-semibold"
    case "info":
      return "bg-sky-600 text-white hover:bg-sky-600 font-semibold"
    case "warning":
      return "bg-amber-500 text-white hover:bg-amber-500 font-semibold"
    case "danger":
      return "bg-red-600 text-white hover:bg-red-600 font-semibold"
    case "primary":
    default:
      return "bg-blue-600 text-white hover:bg-blue-600 font-semibold"
  }
}
