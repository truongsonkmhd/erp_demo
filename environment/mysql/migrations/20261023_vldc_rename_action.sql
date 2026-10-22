-- VLDC: menu "Hộp việc" is now "Công việc". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET title = 'Công việc' WHERE code = 'vldc-action';
UPDATE tbl_page SET name = 'Công việc' WHERE code = 'vldc-action';
