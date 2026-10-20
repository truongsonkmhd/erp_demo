-- Tạo tài khoản tương ứng từng role + cấp bậc (để test quyền).
-- Mật khẩu mặc định: Welcome@123
-- Admin đã có sẵn (admin / admin123), không tạo lại.
-- INSERT IGNORE: bỏ qua nếu username/email đã tồn tại.

USE `hoangminh_pts`;

SET @pwd := '$2b$10$1Ic/ruM9WUrwRylXYhGDhO5ySgdY0u0GZr.Wmb/UzgrvQJ6Ldd7yC';

INSERT IGNORE INTO tbl_user
    (username, email, password, full_name, phone, role_id, level_code, base_salary, active, is_deleted)
SELECT v.username, v.email, @pwd, v.full_name, v.phone, r.id, v.level_code, v.base_salary, 1, 0
FROM (
    -- Sale
    SELECT 'sale_executive' AS username, 'sale.executive@local' AS email, 'Sale Executive' AS full_name, '0900000001' AS phone, 'sale' AS role_code, 'executive' AS level_code, 10000000 AS base_salary
    UNION ALL SELECT 'sale_senior',     'sale.senior@local',     'Sale Senior',     '0900000002', 'sale', 'senior',     12000000
    UNION ALL SELECT 'sale_manager',    'sale.manager@local',    'Sale Manager',    '0900000003', 'sale', 'manager',    15000000
    UNION ALL SELECT 'sale_director',   'sale.director@local',   'Sale Director',   '0900000004', 'sale', 'director',   20000000
    -- Marketing
    UNION ALL SELECT 'mkt_executive',   'mkt.executive@local',   'Marketing Executive', '0900000011', 'marketing', 'executive', 10000000
    UNION ALL SELECT 'mkt_senior',      'mkt.senior@local',      'Marketing Senior',    '0900000012', 'marketing', 'senior',     12000000
    UNION ALL SELECT 'mkt_manager',     'mkt.manager@local',     'Marketing Manager',   '0900000013', 'marketing', 'manager',    15000000
    UNION ALL SELECT 'mkt_director',    'mkt.director@local',    'Marketing Director',  '0900000014', 'marketing', 'director',   20000000
    -- CSKH
    UNION ALL SELECT 'cskh_executive',  'cskh.executive@local',  'CSKH Executive', '0900000021', 'cskh', 'executive', 10000000
    UNION ALL SELECT 'cskh_senior',     'cskh.senior@local',     'CSKH Senior',    '0900000022', 'cskh', 'senior',     12000000
    UNION ALL SELECT 'cskh_manager',    'cskh.manager@local',    'CSKH Manager',   '0900000023', 'cskh', 'manager',    15000000
    UNION ALL SELECT 'cskh_director',   'cskh.director@local',   'CSKH Director',  '0900000024', 'cskh', 'director',   20000000
    -- Kho vận
    UNION ALL SELECT 'wh_executive',    'wh.executive@local',    'Kho vận Executive', '0900000031', 'warehouse', 'executive', 10000000
    UNION ALL SELECT 'wh_senior',       'wh.senior@local',       'Kho vận Senior',    '0900000032', 'warehouse', 'senior',     12000000
    UNION ALL SELECT 'wh_manager',      'wh.manager@local',      'Kho vận Manager',   '0900000033', 'warehouse', 'manager',    15000000
    UNION ALL SELECT 'wh_director',     'wh.director@local',     'Kho vận Director',  '0900000034', 'warehouse', 'director',   20000000
    -- Kế toán
    UNION ALL SELECT 'acc_executive',   'acc.executive@local',   'Kế toán Executive', '0900000041', 'accounting', 'executive', 10000000
    UNION ALL SELECT 'acc_senior',      'acc.senior@local',      'Kế toán Senior',    '0900000042', 'accounting', 'senior',     12000000
    UNION ALL SELECT 'acc_manager',     'acc.manager@local',     'Kế toán Manager',   '0900000043', 'accounting', 'manager',    15000000
    UNION ALL SELECT 'acc_director',    'acc.director@local',    'Kế toán Director',  '0900000044', 'accounting', 'director',   20000000
) v
JOIN tbl_role r ON r.code = v.role_code;

SELECT u.full_name, u.email, r.name AS role_name, u.level_code, u.active
FROM tbl_user u
JOIN tbl_role r ON r.id = u.role_id
WHERE u.is_deleted = 0
ORDER BY r.id, FIELD(IFNULL(u.level_code, ''), 'executive', 'senior', 'manager', 'director', '');
