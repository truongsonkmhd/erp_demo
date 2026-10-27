-- Lịch làm việc + hệ thống thông báo cho DB thật (erp-demo, đang ở Flyway V8).
-- Nội dung = V9__create_tbl_calendar_event.sql + V10__notifications.sql. Chạy lại nhiều lần vẫn an toàn.
USE `erp-demo`;

-- Lịch làm việc VLDC (collection "calendar_events"). event_date/event_time are the dd/mm/yyyy + HH:mm strings the frontend
-- writes; starts_at is the same moment as a DATETIME so the reminder job can range-scan upcoming entries.
CREATE TABLE IF NOT EXISTS tbl_calendar_event (
  id          VARCHAR(64)  COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  event_date  VARCHAR(10)  NOT NULL,
  event_time  VARCHAR(8)   NOT NULL,
  title       VARCHAR(600) NOT NULL,
  scope       VARCHAR(16)  NOT NULL,
  unit        VARCHAR(255) NOT NULL,
  project     VARCHAR(64)  NOT NULL,
  owner       VARCHAR(64)  NOT NULL,
  link        VARCHAR(64)  NOT NULL,
  note        TEXT         NOT NULL,
  sub_unit    VARCHAR(64)  NULL,
  starts_at   DATETIME     NULL,
  created_at  DATETIME(3)  NOT NULL,
  updated_at  DATETIME(3)  NOT NULL,
  updated_by  VARCHAR(255) NULL,
  INDEX idx_calendar_event_starts (starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thông báo theo loại (type). Adding a kind of notification = one row in tbl_notification_type plus a producer
-- calling NotificationAppService; users choose per type whether it reaches them in the app and/or by e-mail.

CREATE TABLE IF NOT EXISTS tbl_notification_type (
  code                 VARCHAR(50)  NOT NULL PRIMARY KEY,
  name                 VARCHAR(150) NOT NULL,
  description          VARCHAR(500) NULL,
  icon                 VARCHAR(50)  NULL,
  in_app_default       BOOLEAN      NOT NULL DEFAULT TRUE,
  email_default        BOOLEAN      NOT NULL DEFAULT FALSE,
  -- Non-null for reminders: how long before the moment the user is told (each user may change it).
  lead_minutes_default INT          NULL,
  sort_order           INT          NOT NULL DEFAULT 0,
  active               BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tbl_notification_type (code, name, description, icon, in_app_default, email_default, lead_minutes_default, sort_order) VALUES
  ('CALENDAR_DUE',       'Lịch đến hạn',              'Nhắc trước khi một lịch / sự kiện bạn tham gia bắt đầu.',       'CalendarClock', TRUE, TRUE,  30,   10),
  ('PAYMENT_CONFIRM',    'Xác nhận thanh toán',       'Hồ sơ thanh toán cần bạn xác nhận hoặc đã được xác nhận.',     'Wallet',        TRUE, TRUE,  NULL, 20),
  ('EQUIPMENT_TRANSFER', 'Xác nhận chuyển thiết bị',  'Yêu cầu điều chuyển thiết bị cần xác nhận bàn giao / tiếp nhận.', 'Truck',       TRUE, FALSE, NULL, 30),
  ('MEETING_ROOM',       'Phòng họp',                 'Đặt phòng họp, thay đổi lịch họp và nhắc giờ họp.',            'DoorOpen',      TRUE, FALSE, NULL, 40),
  ('INTERNAL_NOTICE',    'Thông báo nội bộ',          'Thông báo do lãnh đạo / trưởng đơn vị phát hành cho đơn vị.',  'Megaphone',     TRUE, FALSE, NULL, 50);

-- One row per (user, notification). dedup_key makes producers idempotent (a reminder is created once).
-- in_app = false keeps the row only as the e-mail record and for dedup; the bell never lists it.
CREATE TABLE IF NOT EXISTS tbl_notification (
  id           BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT        NOT NULL,
  type_code    VARCHAR(50)   NOT NULL,
  title        VARCHAR(255)  NOT NULL,
  body         VARCHAR(1000) NOT NULL,
  link         VARCHAR(255)  NULL,
  ref_id       VARCHAR(64)   NULL,
  dedup_key    VARCHAR(191)  NOT NULL,
  in_app       BOOLEAN       NOT NULL,
  email_status VARCHAR(16)   NULL,
  created_at   DATETIME(3)   NOT NULL,
  read_at      DATETIME(3)   NULL,
  UNIQUE KEY uk_notification_dedup (user_id, dedup_key),
  -- Bell feed (keyset pagination by created_at, id) and unread count.
  KEY idx_notification_feed (user_id, in_app, created_at, id),
  KEY idx_notification_unread (user_id, in_app, read_at),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES tbl_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_type FOREIGN KEY (type_code) REFERENCES tbl_notification_type(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A user's choice for one type; no row = the type's defaults.
CREATE TABLE IF NOT EXISTS tbl_notification_setting (
  id           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT      NOT NULL,
  type_code    VARCHAR(50) NOT NULL,
  in_app       BOOLEAN     NOT NULL,
  email        BOOLEAN     NOT NULL,
  lead_minutes INT         NULL,
  updated_at   DATETIME(3) NOT NULL,
  UNIQUE KEY uk_notification_setting (user_id, type_code),
  CONSTRAINT fk_notification_setting_user FOREIGN KEY (user_id) REFERENCES tbl_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_setting_type FOREIGN KEY (type_code) REFERENCES tbl_notification_type(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The old "Thông báo" page becomes the notification management tab (its permission already covers every role).
SET @has := (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_menu');
SET @ddl := IF(@has = 1, 'UPDATE tbl_menu SET title = ''Quản lý thông báo'', icon = ''BellRing'' WHERE code = ''vldc-notifications''', 'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
UPDATE tbl_page SET name = 'Quản lý thông báo' WHERE code = 'vldc-notifications';

-- "Phát hành" thông báo nội bộ: the function goes to the roles whose position manages a unit (the audience is then
-- limited to the units they manage, checked by the backend). Admin already holds every vldc-notifications permission.
INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM tbl_role r
JOIN tbl_permission p ON p.code = 'vldc-notifications:create'
WHERE r.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'ketoantruong');
