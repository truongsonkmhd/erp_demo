-- VLDC: Bảng tin moves below Hộp việc in "Không gian làm việc". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET sort_order = 101 WHERE code = 'vldc-dashboard';
UPDATE tbl_menu SET sort_order = 102 WHERE code = 'vldc-action';
UPDATE tbl_menu SET sort_order = 103 WHERE code = 'vldc-news';
UPDATE tbl_menu SET sort_order = 104 WHERE code = 'vldc-today';
UPDATE tbl_menu SET sort_order = 105 WHERE code = 'vldc-calendar';
UPDATE tbl_menu SET sort_order = 106 WHERE code = 'vldc-plans';
UPDATE tbl_menu SET sort_order = 107 WHERE code = 'vldc-notifications';
UPDATE tbl_menu SET sort_order = 108 WHERE code = 'vldc-assistant';
