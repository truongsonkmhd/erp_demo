# VLDC ERP Demo 10.1 — React + TypeScript

Bản chuyển đổi của `VLDC_ERP_Demo_10.1_RnD_AllStaff` (index.html + app.js) sang Vite + React 18 + TypeScript.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build ra dist/
npm run preview    # xem bản build
```

Mật khẩu demo chung: `123456`. Cần Internet để hiển thị ảnh nền từ website Liên đoàn.

## Cấu trúc

```
src/
  main.tsx                 entry
  App.tsx                  Login ↔ App shell + Modal
  store.ts                 state dùng chung (role, page, modal, badge) — useSyncExternalStore
  components/
    LoginScreen.tsx        đăng nhập + chọn nhanh vai trò
    Sidebar.tsx            menu theo vai trò (navigationForRole)
    Topbar.tsx             tiêu đề trang, badge Thông báo/Lịch/Việc, đổi vai trò
    Modal.tsx              modal dùng chung
    PageHost.tsx           điểm mount #content cho các trang legacy
  legacy/engine.ts         toàn bộ logic + template trang từ app.js (đã gộp các bản vá 5.0 → 10.1)
  styles/app.css           CSS gốc từ index.html
```

## Cách hoạt động (hybrid)

- Khung ứng dụng (login, sidebar, topbar, modal, state vai trò/trang/badge) là component React.
- Nội dung từng trang vẫn là HTML template trong `legacy/engine.ts` (`render.*`), ghi vào `#content`.
  Các nút trong template dùng `onclick="..."` gọi những hàm được gắn lên `window` ở cuối `engine.ts`.
- Legacy gọi `show()` / `openModal()` / `closeModal()` / cập nhật badge → chuyển qua `store.ts`
  (`connectShell`), không còn thao tác DOM của khung.

## Chuyển dần một trang sang JSX

1. Tạo component, ví dụ `src/pages/AuditPage.tsx`.
2. Trong `PageHost`, nếu `page === 'audit'` thì render component đó thay vì gọi `renderPage`.
3. Xóa `render.audit` khỏi `engine.ts` khi không còn dùng.
