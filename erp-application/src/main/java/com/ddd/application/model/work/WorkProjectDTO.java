package com.xxxx.ddd.application.model.work;

import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import java.time.LocalDate;
import lombok.Data;

/** Thư mục dự án ở menu Công việc. */
@Data
public class WorkProjectDTO {
    private String code;
    private String name;
    private ProjectStatus status;
    private ApprovalStatus approvalStatus;
    /** Tiến độ % theo độ phức tạp. */
    private int progress;
    private LocalDate endDate;
    private boolean overdue;
    private DepartmentRefDTO leadDepartment;
}
