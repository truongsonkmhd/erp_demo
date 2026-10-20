-- Safe to re-run. Adds only Page × Action catalog entries for the frontend-local mission module.
USE `erp-demo`;

INSERT IGNORE INTO tbl_page (code, name, url) VALUES
  ('mission-ho-so-nhiem-vu', 'Hồ sơ nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/ho-so-nhiem-vu'),
  ('mission-ke-hoach', 'Kế hoạch nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/ke-hoach'),
  ('mission-theo-doi-tien-do', 'Theo dõi tiến độ nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/theo-doi-tien-do'),
  ('mission-nguon-luc-nhiem-vu', 'Nguồn lực nhiệm vụ', '/ke-hoach-nhiem-vu-du-an/nguon-luc-nhiem-vu'),
  ('mission-so-sanh-don-vi', 'So sánh đơn vị', '/ke-hoach-nhiem-vu-du-an/so-sanh-don-vi');

INSERT IGNORE INTO tbl_permission (code, label, page_id, action_id)
SELECT CONCAT(p.code, ':', a.code), CONCAT(p.name, ' - ', a.name), p.id, a.id
FROM tbl_page p CROSS JOIN tbl_action a
WHERE p.code IN ('mission-ho-so-nhiem-vu', 'mission-ke-hoach', 'mission-theo-doi-tien-do', 'mission-nguon-luc-nhiem-vu', 'mission-so-sanh-don-vi')
  AND a.code IN ('access', 'create', 'update', 'delete');

INSERT IGNORE INTO tbl_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM tbl_role r CROSS JOIN tbl_permission p
WHERE r.code = 'admin' AND p.code LIKE 'mission-%';
