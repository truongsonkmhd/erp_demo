-- VLDC cross-account workflow (directives, delegated tasks, payment dossiers). Safe to re-run.
USE `erp-demo`;

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM (
  -- Every business role can open and work on directives, inbox and notifications.
  SELECT r0.code AS role_code, perm.code AS perm_code
  FROM tbl_role r0
  CROSS JOIN (
    SELECT 'vldc-directives:access' AS code UNION ALL
    SELECT 'vldc-directives:update' UNION ALL
    SELECT 'vldc-action:access' UNION ALL
    SELECT 'vldc-notifications:access'
  ) perm
  WHERE r0.code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem',
                    'kythuat', 'kehoach', 'tochuc', 'hientruong', 'ketoan', 'ketoantruong')
  UNION ALL
  -- Roles that can hand work down.
  SELECT code, 'vldc-directives:create' FROM tbl_role
  WHERE code IN ('lanhdao', 'truongdonvi', 'matdat', 'bien', 'hangkhong', 'trungtam', 'chunhiem', 'ketoantruong')
  UNION ALL
  -- Payment dossier chain: chunhiem -> kehoach -> ketoan -> ketoantruong -> lanhdao -> ketoan.
  SELECT code, 'vldc-payments:access' FROM tbl_role
  WHERE code IN ('chunhiem', 'kehoach', 'ketoan', 'ketoantruong', 'lanhdao')
  UNION ALL
  SELECT 'chunhiem', 'vldc-payments:create'
  UNION ALL
  SELECT code, 'vldc-payments:update' FROM tbl_role
  WHERE code IN ('kehoach', 'ketoan', 'ketoantruong', 'lanhdao')
) rp
JOIN tbl_role r ON r.code = rp.role_code
JOIN tbl_permission p ON p.code = rp.perm_code;
