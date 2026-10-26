-- VLDC Giao việc: back in the menu for every business role, with the grants of 20261020_vldc_workflow_permissions.sql
-- restored (they were revoked by hand). Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET active = 1 WHERE code = 'vldc-directives';

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM (
  -- Every business role can open and work on directives.
  SELECT r0.code AS role_code, perm.code AS perm_code
  FROM tbl_role r0
  CROSS JOIN (SELECT 'vldc-directives:access' AS code UNION ALL SELECT 'vldc-directives:update') perm
  WHERE r0.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                    'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong')
  UNION ALL
  -- Roles that can hand work down.
  SELECT code, 'vldc-directives:create' FROM tbl_role
  WHERE code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem', 'ketoantruong')
) rp
JOIN tbl_role r ON r.code = rp.role_code
JOIN tbl_permission p ON p.code = rp.perm_code;
