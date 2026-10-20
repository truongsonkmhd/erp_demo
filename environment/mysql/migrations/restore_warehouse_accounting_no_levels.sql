-- Restore Kho vận + Kế toán and keep them without user/role levels.

USE `hoangminh_pts`;

UPDATE tbl_role
SET is_deleted = 0,
    summary = CASE
        WHEN code = 'warehouse' THEN 'Theo dõi hành trình đơn hàng theo mã lô hàng và xem toàn bộ trạng thái vận chuyển. Không phân cấp bậc.'
        WHEN code = 'accounting' THEN 'Nắm thanh toán, dữ liệu tài chính, doanh số, lợi nhuận. Không phân cấp bậc.'
        ELSE summary
    END
WHERE code IN ('warehouse', 'accounting');

INSERT INTO tbl_role (code, name, summary, is_deleted)
SELECT v.code, v.name, v.summary, 0
FROM (
    SELECT 'warehouse' AS code, 'Kho vận' AS name, 'Theo dõi hành trình đơn hàng theo mã lô hàng và xem toàn bộ trạng thái vận chuyển. Không phân cấp bậc.' AS summary
    UNION ALL
    SELECT 'accounting', 'Kế toán', 'Nắm thanh toán, dữ liệu tài chính, doanh số, lợi nhuận. Không phân cấp bậc.'
) v
WHERE NOT EXISTS (SELECT 1 FROM tbl_role r WHERE r.code = v.code);

DELETE rlp
FROM tbl_role_level_permission rlp
INNER JOIN tbl_role r ON r.id = rlp.role_id
WHERE r.code IN ('warehouse', 'accounting');

UPDATE tbl_user u
INNER JOIN tbl_role r ON r.id = u.role_id
SET u.level_code = NULL
WHERE r.code IN ('warehouse', 'accounting');
