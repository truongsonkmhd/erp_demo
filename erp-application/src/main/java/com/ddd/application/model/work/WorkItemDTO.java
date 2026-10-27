package com.xxxx.ddd.application.model.work;

import java.time.LocalDate;
import lombok.Data;

/**
 * Một dòng ở menu Công việc. kind: PROJECT_APPROVAL, PROJECT_DELETE, PROJECT_ASSIGN, PROJECT_TASK, MISSION; reason: vì sao
 * dòng ở đây (APPROVE_PROJECT, CONFIRM_DELETE, ASSIGN_TASKS, DO_TASK, REVIEW_TASK, APPROVE_MISSION, DO_MISSION, FOLLOW;
 * null ở tab Toàn Liên đoàn). status: mã trạng thái của dự án / việc / nhiệm vụ.
 */
@Data
public class WorkItemDTO {
    private String kind;
    private String code;
    private String title;
    private String projectCode;
    private String status;
    private LocalDate dueDate;
    private boolean overdue;
    private boolean atRisk;
    private int progress;
    /** Người đăng nhập phải xử lý (false: phối hợp hoặc chỉ xem). */
    private boolean mine;
    private String reason;
    /** Người tạo ra việc cần xử lý: người lập dự án / đề nghị xoá / giao việc / lập nhiệm vụ. */
    private PersonRefDTO from;
    /** Người đang phải làm: người thực hiện việc, người lập nhiệm vụ, người duyệt nhiệm vụ chờ duyệt. */
    private PersonRefDTO owner;
    private DepartmentRefDTO department;
    private String link;
}
