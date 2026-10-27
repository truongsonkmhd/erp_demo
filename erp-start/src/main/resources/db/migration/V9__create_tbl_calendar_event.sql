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
