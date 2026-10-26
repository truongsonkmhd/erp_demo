-- Bảng tin VLDC (collection "news"). edited_at = NewsPost.updatedAt of the frontend; updated_at is the system audit column.
CREATE TABLE IF NOT EXISTS tbl_news (
  id             VARCHAR(64)   COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
  kind           VARCHAR(32)   NOT NULL,
  title          VARCHAR(500)  NOT NULL,
  summary        VARCHAR(1000) NOT NULL,
  body           MEDIUMTEXT    NOT NULL,
  audience       VARCHAR(32)   NOT NULL,
  pinned         BOOLEAN       NOT NULL,
  status         VARCHAR(16)   NOT NULL,
  author_role    VARCHAR(64)   NOT NULL,
  author_name    VARCHAR(255)  NOT NULL,
  published_at   VARCHAR(40)   NULL,
  edited_at      VARCHAR(40)   NOT NULL,
  event_date     VARCHAR(10)   NULL,
  event_time     VARCHAR(8)    NULL,
  event_location VARCHAR(255)  NULL,
  created_at     DATETIME(3)   NOT NULL,
  updated_at     DATETIME(3)   NOT NULL,
  updated_by     VARCHAR(255)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
