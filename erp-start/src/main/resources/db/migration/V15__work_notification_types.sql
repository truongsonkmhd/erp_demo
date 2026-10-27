-- Loại thông báo của Dự án / Việc dự án / Nhiệm vụ (tạo ở V12): icon cho chuông, Gmail mặc định bật với loại cần duyệt
-- hoặc được giao. Chỉ đổi mặc định của loại; thiết lập người dùng đã lưu giữ nguyên. Chạy lại không lỗi.
UPDATE tbl_notification_type SET icon = 'FolderCheck', email_default = TRUE,
  description = 'Dự án chờ Liên đoàn trưởng phê duyệt, kết quả phê duyệt và dự án mới đơn vị bạn tham gia.'
WHERE code = 'PROJECT_APPROVAL';
UPDATE tbl_notification_type SET icon = 'FolderX', email_default = TRUE,
  description = 'Đề nghị xoá dự án và quyết định của Liên đoàn trưởng.'
WHERE code = 'PROJECT_DELETE';
UPDATE tbl_notification_type SET icon = 'ClipboardList', email_default = TRUE,
  description = 'Bạn được giao một việc trong dự án hoặc được thêm phối hợp.'
WHERE code = 'TASK_ASSIGNED';
UPDATE tbl_notification_type SET icon = 'ListChecks', email_default = FALSE,
  description = 'Việc bạn giao hoặc tham gia được nhận, cập nhật tiến độ, nộp, nghiệm thu, trả lại hoặc có ghi chú mới.'
WHERE code = 'TASK_UPDATED';
UPDATE tbl_notification_type SET icon = 'Flag', email_default = TRUE,
  description = 'Nhiệm vụ chờ bạn duyệt, kết quả duyệt, tiến độ và hoàn thành nhiệm vụ bạn tham gia.'
WHERE code = 'MISSION_APPROVAL';
