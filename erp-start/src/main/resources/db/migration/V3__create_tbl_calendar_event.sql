-- Lịch làm việc VLDC (collection "calendar_events"). event_date is dd/mm/yyyy as the frontend writes it.
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
  created_at  DATETIME(3)  NOT NULL,
  updated_at  DATETIME(3)  NOT NULL,
  updated_by  VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
