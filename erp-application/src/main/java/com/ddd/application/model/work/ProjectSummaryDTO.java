package com.xxxx.ddd.application.model.work;

import com.xxxx.ddd.domain.model.enums.work.ApprovalStatus;
import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import java.time.LocalDate;
import lombok.Data;

/** Một dòng ở danh sách Dự án. */
@Data
public class ProjectSummaryDTO {
    private String code;
    private String name;
    private DepartmentRefDTO leadDepartment;
    private ProjectStatus status;
    private ApprovalStatus approvalStatus;
    /** Tiến độ % theo độ phức tạp của việc cấp 1 đã hoàn thành. */
    private int progress;
    private LocalDate endDate;
    private int delayDays;
    private int openTaskCount;
    private int overdueTaskCount;
    private boolean hasPendingDeleteRequest;
}
