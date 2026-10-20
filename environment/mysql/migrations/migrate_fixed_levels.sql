-- Migrate fixed role levels: drop tbl_role_level, store level_code on user
USE hoangminh_pts;

-- 1) Add level_code
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'hoangminh_pts' AND TABLE_NAME = 'tbl_user' AND COLUMN_NAME = 'level_code'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE tbl_user ADD COLUMN level_code VARCHAR(50) NULL COMMENT ''fixed catalog'' AFTER role_id',
  'SELECT ''level_code exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Copy from old level rows
UPDATE tbl_user u
INNER JOIN tbl_role_level l ON u.level_id = l.id
SET u.level_code = l.code
WHERE u.level_code IS NULL;

UPDATE tbl_user SET level_code = 'director' WHERE username = 'admin' AND (level_code IS NULL OR level_code = '');
UPDATE tbl_user SET level_code = 'executive' WHERE level_code IS NULL OR level_code = '';

-- 3) Drop FK + level_id
SET @fk := (
  SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA='hoangminh_pts' AND TABLE_NAME='tbl_user' AND COLUMN_NAME='level_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE tbl_user DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_level_id := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='hoangminh_pts' AND TABLE_NAME='tbl_user' AND COLUMN_NAME='level_id'
);
SET @sql := IF(@col_level_id > 0, 'ALTER TABLE tbl_user DROP COLUMN level_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Recreate level-permission overrides keyed by level_code
DROP TABLE IF EXISTS tbl_role_level_permission;
DROP TABLE IF EXISTS tbl_role_level;

CREATE TABLE tbl_role_level_permission (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    role_id BIGINT(20) NOT NULL,
    level_code VARCHAR(50) NOT NULL,
    permission_id BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_role_level_permission (role_id, level_code, permission_id),
    CONSTRAINT fk_rlp_role FOREIGN KEY (role_id) REFERENCES tbl_role (id),
    CONSTRAINT fk_rlp_perm FOREIGN KEY (permission_id) REFERENCES tbl_permission (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
