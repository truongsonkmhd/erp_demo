-- Admin has full permissions and no role level.
UPDATE tbl_user u
INNER JOIN tbl_role r ON r.id = u.role_id
SET u.level_code = NULL
WHERE r.code = 'admin';

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM tbl_role r
CROSS JOIN tbl_permission p
WHERE r.code = 'admin';
