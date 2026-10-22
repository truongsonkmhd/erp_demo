-- VLDC: "Giao việc" moves from "Điều hành" into "Không gian làm việc", right below "Công việc". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu m
JOIN tbl_menu g ON g.code = 'vldc-grp-workspace'
SET m.parent_id = g.id, m.sort_order = 103
WHERE m.code = 'vldc-directives';

UPDATE tbl_menu SET sort_order = 104 WHERE code = 'vldc-news';
UPDATE tbl_menu SET sort_order = 105 WHERE code = 'vldc-today';
UPDATE tbl_menu SET sort_order = 106 WHERE code = 'vldc-calendar';
UPDATE tbl_menu SET sort_order = 107 WHERE code = 'vldc-plans';
UPDATE tbl_menu SET sort_order = 108 WHERE code = 'vldc-notifications';
UPDATE tbl_menu SET sort_order = 109 WHERE code = 'vldc-assistant';
