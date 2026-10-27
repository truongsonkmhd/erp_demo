-- Dự án, việc trong dự án và nhiệm vụ (menu Nhiệm vụ / Dự án và Công việc). Thiết kế theo nghiệp vụ: id tự tăng, mã
-- nghiệp vụ ở cột code, người và đơn vị là khoá ngoại tới tbl_user / tbl_department, trạng thái là mã cố định.
-- Thông báo dùng lại tbl_notification (chỉ thêm loại). Idempotent: chạy lại không lỗi. Không seed dữ liệu.

-- 1. Dự án
CREATE TABLE IF NOT EXISTS tbl_project (
  id                 BIGINT        NOT NULL AUTO_INCREMENT,
  code               VARCHAR(30)   NOT NULL,
  name               VARCHAR(500)  NOT NULL,
  description        TEXT          NULL,
  lead_department_id BIGINT        NOT NULL,
  manager_user_id    BIGINT        NULL,
  estimated_budget   DECIMAL(18,0) NOT NULL,
  start_date         DATE          NOT NULL,
  end_date           DATE          NOT NULL,
  status             VARCHAR(20)   NOT NULL DEFAULT 'INITIATED',
  approval_status    VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  approval_note      VARCHAR(1000) NULL,
  approved_by        BIGINT        NULL,
  approved_at        DATETIME(3)   NULL,
  created_at         DATETIME(3)   NOT NULL,
  created_by         BIGINT        NOT NULL,
  updated_at         DATETIME(3)   NOT NULL,
  updated_by         BIGINT        NULL,
  is_deleted         TINYINT(1)    NOT NULL DEFAULT 0,
  deleted_at         DATETIME(3)   NULL,
  deleted_by         BIGINT        NULL,
  CONSTRAINT pk_tbl_project PRIMARY KEY (id),
  CONSTRAINT uk_tbl_project_code UNIQUE (code),
  CONSTRAINT fk_tbl_project_lead_department_id FOREIGN KEY (lead_department_id) REFERENCES tbl_department (id),
  CONSTRAINT fk_tbl_project_manager_user_id FOREIGN KEY (manager_user_id) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_approved_by FOREIGN KEY (approved_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_created_by FOREIGN KEY (created_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_updated_by FOREIGN KEY (updated_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_deleted_by FOREIGN KEY (deleted_by) REFERENCES tbl_user (id),
  CONSTRAINT ck_tbl_project_estimated_budget CHECK (estimated_budget > 0),
  CONSTRAINT ck_tbl_project_dates CHECK (end_date > start_date),
  CONSTRAINT ck_tbl_project_status CHECK (status IN ('INITIATED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED')),
  CONSTRAINT ck_tbl_project_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  INDEX idx_tbl_project_status (status, is_deleted),
  INDEX idx_tbl_project_approval_status (approval_status),
  INDEX idx_tbl_project_lead_department_id (lead_department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Đơn vị phối hợp của dự án (đơn vị chủ trì ở tbl_project.lead_department_id).
CREATE TABLE IF NOT EXISTS tbl_project_department (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  project_id    BIGINT      NOT NULL,
  department_id BIGINT      NOT NULL,
  created_at    DATETIME(3) NOT NULL,
  CONSTRAINT pk_tbl_project_department PRIMARY KEY (id),
  CONSTRAINT uk_tbl_project_department UNIQUE (project_id, department_id),
  CONSTRAINT fk_tbl_project_department_project_id FOREIGN KEY (project_id) REFERENCES tbl_project (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_project_department_department_id FOREIGN KEY (department_id) REFERENCES tbl_department (id),
  INDEX idx_tbl_project_department_department_id (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Đề nghị xoá dự án: Phòng Kỹ thuật đề nghị, Liên đoàn trưởng quyết; mỗi lần một dòng.
CREATE TABLE IF NOT EXISTS tbl_project_delete_request (
  id            BIGINT        NOT NULL AUTO_INCREMENT,
  project_id    BIGINT        NOT NULL,
  reason        VARCHAR(1000) NOT NULL,
  requested_by  BIGINT        NOT NULL,
  requested_at  DATETIME(3)   NOT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  decided_by    BIGINT        NULL,
  decided_at    DATETIME(3)   NULL,
  decision_note VARCHAR(1000) NULL,
  CONSTRAINT pk_tbl_project_delete_request PRIMARY KEY (id),
  CONSTRAINT fk_tbl_project_delete_request_project_id FOREIGN KEY (project_id) REFERENCES tbl_project (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_project_delete_request_requested_by FOREIGN KEY (requested_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_delete_request_decided_by FOREIGN KEY (decided_by) REFERENCES tbl_user (id),
  CONSTRAINT ck_tbl_project_delete_request_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  INDEX idx_tbl_project_delete_request_project_id (project_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Việc trong dự án (việc con: parent_id)
CREATE TABLE IF NOT EXISTS tbl_project_task (
  id                 BIGINT           NOT NULL AUTO_INCREMENT,
  code               VARCHAR(30)      NOT NULL,
  project_id         BIGINT           NOT NULL,
  parent_id          BIGINT           NULL,
  title              VARCHAR(1000)    NOT NULL,
  result_requirement TEXT             NULL,
  department_id      BIGINT           NOT NULL,
  assignee_user_id   BIGINT           NOT NULL,
  status             VARCHAR(20)      NOT NULL DEFAULT 'NEW',
  progress           TINYINT UNSIGNED NOT NULL DEFAULT 0,
  complexity         VARCHAR(20)      NOT NULL DEFAULT 'MEDIUM',
  priority           VARCHAR(20)      NOT NULL DEFAULT 'MEDIUM',
  due_date           DATE             NOT NULL,
  evidence           VARCHAR(2000)    NULL,
  completed_at       DATETIME(3)      NULL,
  created_at         DATETIME(3)      NOT NULL,
  created_by         BIGINT           NOT NULL,
  updated_at         DATETIME(3)      NOT NULL,
  updated_by         BIGINT           NULL,
  is_deleted         TINYINT(1)       NOT NULL DEFAULT 0,
  deleted_at         DATETIME(3)      NULL,
  deleted_by         BIGINT           NULL,
  CONSTRAINT pk_tbl_project_task PRIMARY KEY (id),
  CONSTRAINT uk_tbl_project_task_code UNIQUE (code),
  CONSTRAINT fk_tbl_project_task_project_id FOREIGN KEY (project_id) REFERENCES tbl_project (id),
  CONSTRAINT fk_tbl_project_task_parent_id FOREIGN KEY (parent_id) REFERENCES tbl_project_task (id),
  CONSTRAINT fk_tbl_project_task_department_id FOREIGN KEY (department_id) REFERENCES tbl_department (id),
  CONSTRAINT fk_tbl_project_task_assignee_user_id FOREIGN KEY (assignee_user_id) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_task_created_by FOREIGN KEY (created_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_task_updated_by FOREIGN KEY (updated_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_task_deleted_by FOREIGN KEY (deleted_by) REFERENCES tbl_user (id),
  CONSTRAINT ck_tbl_project_task_status CHECK (status IN ('NEW', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')),
  CONSTRAINT ck_tbl_project_task_progress CHECK (progress <= 100),
  CONSTRAINT ck_tbl_project_task_complexity CHECK (complexity IN ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
  CONSTRAINT ck_tbl_project_task_priority CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  INDEX idx_tbl_project_task_project_id (project_id, status, is_deleted),
  INDEX idx_tbl_project_task_assignee_user_id (assignee_user_id, status),
  INDEX idx_tbl_project_task_parent_id (parent_id),
  INDEX idx_tbl_project_task_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_project_task_follower (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  task_id    BIGINT      NOT NULL,
  user_id    BIGINT      NOT NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT pk_tbl_project_task_follower PRIMARY KEY (id),
  CONSTRAINT uk_tbl_project_task_follower UNIQUE (task_id, user_id),
  CONSTRAINT fk_tbl_project_task_follower_task_id FOREIGN KEY (task_id) REFERENCES tbl_project_task (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_project_task_follower_user_id FOREIGN KEY (user_id) REFERENCES tbl_user (id),
  INDEX idx_tbl_project_task_follower_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_project_task_comment (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  task_id       BIGINT      NOT NULL,
  user_id       BIGINT      NOT NULL,
  department_id BIGINT      NULL,
  content       TEXT        NOT NULL,
  created_at    DATETIME(3) NOT NULL,
  updated_at    DATETIME(3) NULL,
  is_deleted    TINYINT(1)  NOT NULL DEFAULT 0,
  CONSTRAINT pk_tbl_project_task_comment PRIMARY KEY (id),
  CONSTRAINT fk_tbl_project_task_comment_task_id FOREIGN KEY (task_id) REFERENCES tbl_project_task (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_project_task_comment_user_id FOREIGN KEY (user_id) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_project_task_comment_department_id FOREIGN KEY (department_id) REFERENCES tbl_department (id),
  INDEX idx_tbl_project_task_comment_task_id (task_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nhật ký thao tác: chỉ ghi thêm.
CREATE TABLE IF NOT EXISTS tbl_project_task_activity (
  id            BIGINT           NOT NULL AUTO_INCREMENT,
  task_id       BIGINT           NOT NULL,
  actor_user_id BIGINT           NOT NULL,
  action        VARCHAR(30)      NOT NULL,
  from_status   VARCHAR(20)      NULL,
  to_status     VARCHAR(20)      NULL,
  progress      TINYINT UNSIGNED NULL,
  note          VARCHAR(2000)    NULL,
  created_at    DATETIME(3)      NOT NULL,
  CONSTRAINT pk_tbl_project_task_activity PRIMARY KEY (id),
  CONSTRAINT fk_tbl_project_task_activity_task_id FOREIGN KEY (task_id) REFERENCES tbl_project_task (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_project_task_activity_actor_user_id FOREIGN KEY (actor_user_id) REFERENCES tbl_user (id),
  CONSTRAINT ck_tbl_project_task_activity_action CHECK (action IN ('CREATE', 'ACCEPT', 'UPDATE_PROGRESS', 'SUBMIT', 'APPROVE', 'RETURN', 'MOVE', 'SPLIT', 'DELETE')),
  INDEX idx_tbl_project_task_activity_task_id (task_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Nhiệm vụ (cấp dưới đề xuất, cấp trên trực tiếp duyệt)
CREATE TABLE IF NOT EXISTS tbl_mission (
  id               BIGINT           NOT NULL AUTO_INCREMENT,
  code             VARCHAR(30)      NOT NULL,
  title            VARCHAR(1000)    NOT NULL,
  content          TEXT             NULL,
  proposer_user_id BIGINT           NOT NULL,
  approver_user_id BIGINT           NOT NULL,
  project_id       BIGINT           NULL,
  status           VARCHAR(20)      NOT NULL DEFAULT 'PENDING',
  decision_note    VARCHAR(1000)    NULL,
  decided_at       DATETIME(3)      NULL,
  progress         TINYINT UNSIGNED NOT NULL DEFAULT 0,
  priority         VARCHAR(20)      NOT NULL DEFAULT 'MEDIUM',
  due_date         DATE             NOT NULL,
  evidence         VARCHAR(2000)    NULL,
  completed_at     DATETIME(3)      NULL,
  created_at       DATETIME(3)      NOT NULL,
  created_by       BIGINT           NOT NULL,
  updated_at       DATETIME(3)      NOT NULL,
  updated_by       BIGINT           NULL,
  is_deleted       TINYINT(1)       NOT NULL DEFAULT 0,
  deleted_at       DATETIME(3)      NULL,
  deleted_by       BIGINT           NULL,
  CONSTRAINT pk_tbl_mission PRIMARY KEY (id),
  CONSTRAINT uk_tbl_mission_code UNIQUE (code),
  CONSTRAINT fk_tbl_mission_proposer_user_id FOREIGN KEY (proposer_user_id) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_mission_approver_user_id FOREIGN KEY (approver_user_id) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_mission_project_id FOREIGN KEY (project_id) REFERENCES tbl_project (id),
  CONSTRAINT fk_tbl_mission_created_by FOREIGN KEY (created_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_mission_updated_by FOREIGN KEY (updated_by) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_mission_deleted_by FOREIGN KEY (deleted_by) REFERENCES tbl_user (id),
  CONSTRAINT ck_tbl_mission_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE', 'REJECTED')),
  CONSTRAINT ck_tbl_mission_progress CHECK (progress <= 100),
  CONSTRAINT ck_tbl_mission_priority CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  INDEX idx_tbl_mission_approver_user_id (approver_user_id, status),
  INDEX idx_tbl_mission_proposer_user_id (proposer_user_id, status),
  INDEX idx_tbl_mission_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_mission_follower (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  mission_id BIGINT      NOT NULL,
  user_id    BIGINT      NOT NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT pk_tbl_mission_follower PRIMARY KEY (id),
  CONSTRAINT uk_tbl_mission_follower UNIQUE (mission_id, user_id),
  CONSTRAINT fk_tbl_mission_follower_mission_id FOREIGN KEY (mission_id) REFERENCES tbl_mission (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_mission_follower_user_id FOREIGN KEY (user_id) REFERENCES tbl_user (id),
  INDEX idx_tbl_mission_follower_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_mission_comment (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  mission_id    BIGINT      NOT NULL,
  user_id       BIGINT      NOT NULL,
  department_id BIGINT      NULL,
  content       TEXT        NOT NULL,
  created_at    DATETIME(3) NOT NULL,
  updated_at    DATETIME(3) NULL,
  is_deleted    TINYINT(1)  NOT NULL DEFAULT 0,
  CONSTRAINT pk_tbl_mission_comment PRIMARY KEY (id),
  CONSTRAINT fk_tbl_mission_comment_mission_id FOREIGN KEY (mission_id) REFERENCES tbl_mission (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_mission_comment_user_id FOREIGN KEY (user_id) REFERENCES tbl_user (id),
  CONSTRAINT fk_tbl_mission_comment_department_id FOREIGN KEY (department_id) REFERENCES tbl_department (id),
  INDEX idx_tbl_mission_comment_mission_id (mission_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tbl_mission_activity (
  id            BIGINT           NOT NULL AUTO_INCREMENT,
  mission_id    BIGINT           NOT NULL,
  actor_user_id BIGINT           NOT NULL,
  action        VARCHAR(30)      NOT NULL,
  from_status   VARCHAR(20)      NULL,
  to_status     VARCHAR(20)      NULL,
  progress      TINYINT UNSIGNED NULL,
  note          VARCHAR(2000)    NULL,
  created_at    DATETIME(3)      NOT NULL,
  CONSTRAINT pk_tbl_mission_activity PRIMARY KEY (id),
  CONSTRAINT fk_tbl_mission_activity_mission_id FOREIGN KEY (mission_id) REFERENCES tbl_mission (id) ON DELETE CASCADE,
  CONSTRAINT fk_tbl_mission_activity_actor_user_id FOREIGN KEY (actor_user_id) REFERENCES tbl_user (id),
  CONSTRAINT ck_tbl_mission_activity_action CHECK (action IN ('CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'UPDATE_PROGRESS', 'COMPLETE', 'DELETE')),
  INDEX idx_tbl_mission_activity_mission_id (mission_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Loại thông báo cho dự án, việc, nhiệm vụ (bảng tbl_notification_type đã có).
INSERT INTO tbl_notification_type (code, name, description, in_app_default, email_default, sort_order, active) VALUES
  ('PROJECT_APPROVAL', 'Phê duyệt dự án', 'Dự án chờ Liên đoàn trưởng phê duyệt và kết quả phê duyệt', 1, 0, 60, 1),
  ('PROJECT_DELETE', 'Xoá dự án', 'Đề nghị xoá dự án và quyết định của Liên đoàn trưởng', 1, 0, 61, 1),
  ('TASK_ASSIGNED', 'Được giao việc', 'Được giao một việc trong dự án hoặc được thêm vào phối hợp', 1, 0, 62, 1),
  ('TASK_UPDATED', 'Cập nhật việc', 'Việc đổi trạng thái, cập nhật tiến độ hoặc có ghi chú mới', 1, 0, 63, 1),
  ('MISSION_APPROVAL', 'Phê duyệt nhiệm vụ', 'Nhiệm vụ chờ cấp trên duyệt và kết quả duyệt', 1, 0, 64, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);
