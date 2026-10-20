-- Restore tbl_user.level_code (user rank). Permission-by-level stays on tbl_role_level_permission.

USE `hoangminh_pts`;

SET @has_user_level := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'hoangminh_pts'
      AND TABLE_NAME = 'tbl_user'
      AND COLUMN_NAME = 'level_code'
);

SET @sql := IF(
    @has_user_level = 0,
    'ALTER TABLE tbl_user ADD COLUMN level_code VARCHAR(50) NULL COMMENT ''fixed catalog: executive/senior/manager/director'' AFTER role_id',
    'SELECT ''tbl_user.level_code already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE tbl_user u
INNER JOIN tbl_role r ON r.id = u.role_id
SET u.level_code = NULL
WHERE r.code = 'admin';

UPDATE tbl_user u
LEFT JOIN tbl_role r ON r.id = u.role_id
SET u.level_code = CASE
    WHEN u.username LIKE '%director%' OR u.full_name LIKE '%Director%' THEN 'director'
    WHEN u.username LIKE '%manager%' OR u.full_name LIKE '%Manager%' THEN 'manager'
    WHEN u.username LIKE '%senior%' OR u.full_name LIKE '%Senior%' THEN 'senior'
    ELSE 'executive'
END
WHERE (r.code IS NULL OR r.code <> 'admin')
  AND (u.level_code IS NULL OR u.level_code = '');
