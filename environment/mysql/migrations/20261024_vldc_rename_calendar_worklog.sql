-- VLDC: menu "Sự kiện" is now "Lịch làm việc". Safe to re-run.
USE `erp-demo`;

UPDATE tbl_menu SET title = 'Lịch làm việc' WHERE code = 'vldc-calendar';
UPDATE tbl_page SET name = 'Lịch làm việc' WHERE code = 'vldc-calendar';
