-- Positions, unit tree and default org assignment of the VLDC accounts (same as migrations/20261026_position_org_scope.sql).
-- Runs after vldc_menu_permission.sql (alphabetical order of docker-entrypoint-initdb.d).
USE `erp-demo`;

INSERT INTO tbl_position (code, name, level, manages_unit) VALUES
  ('LANH_DAO', 'Lãnh đạo', 1, 1),
  ('TRUONG_DON_VI', 'Trưởng phòng / Đoàn trưởng', 2, 1),
  ('NHAN_VIEN', 'Nhân viên', 3, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name), level = VALUES(level), manages_unit = VALUES(manages_unit);

-- Ban Lãnh đạo là gốc; các phòng, đoàn và trung tâm là đơn vị con.
UPDATE tbl_department child
JOIN tbl_department root ON root.code = 'BLD'
SET child.parent_id = root.id
WHERE child.code IN ('KT', 'KHTC', 'TCHC', 'MD', 'DB', 'HK', 'TT') AND child.parent_id IS NULL;

-- Đơn vị của người dùng lấy từ đơn vị gắn với role hiện tại (chỉ khi chưa được gán).
UPDATE tbl_user u
JOIN tbl_user_role ur ON ur.user_id = u.id
JOIN tbl_role r ON r.id = ur.role_id
SET u.department_id = r.department_id
WHERE u.department_id IS NULL AND r.department_id IS NOT NULL;

-- Chức vụ mặc định của các tài khoản VLDC (chỉ khi chưa được gán).
UPDATE tbl_user u
JOIN tbl_user_role ur ON ur.user_id = u.id
JOIN tbl_role r ON r.id = ur.role_id
JOIN (
  SELECT 'lanhdao' AS role_code, 'LANH_DAO' AS position_code UNION ALL
  SELECT 'truongdonvi', 'TRUONG_DON_VI' UNION ALL
  SELECT 'matdat', 'TRUONG_DON_VI' UNION ALL
  SELECT 'bien', 'TRUONG_DON_VI' UNION ALL
  SELECT 'hangkhong', 'TRUONG_DON_VI' UNION ALL
  SELECT 'trungtam', 'TRUONG_DON_VI' UNION ALL
  SELECT 'ketoantruong', 'TRUONG_DON_VI' UNION ALL
  SELECT 'chunhiem', 'NHAN_VIEN' UNION ALL
  SELECT 'kythuat', 'NHAN_VIEN' UNION ALL
  SELECT 'kehoach', 'NHAN_VIEN' UNION ALL
  SELECT 'tochuc', 'NHAN_VIEN' UNION ALL
  SELECT 'hientruong', 'NHAN_VIEN' UNION ALL
  SELECT 'ketoan', 'NHAN_VIEN'
) m ON m.role_code = r.code
JOIN tbl_position p ON p.code = m.position_code
SET u.position_id = p.id
WHERE u.position_id IS NULL;

-- BR-07: business roles do not administer roles/permissions. VLDC pages now read titles and units from
-- GET /api/org/directory, so the read access granted by 20261022_vldc_departments.sql is withdrawn.
DELETE rp FROM tbl_role_permission rp
JOIN tbl_role r ON r.id = rp.role_id
JOIN tbl_permission p ON p.id = rp.permission_id
WHERE p.code = 'roles:access'
  AND r.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                 'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong');
