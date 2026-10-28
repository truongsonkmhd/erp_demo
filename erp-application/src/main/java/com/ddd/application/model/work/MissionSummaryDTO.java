package com.xxxx.ddd.application.model.work;

import com.xxxx.ddd.domain.model.enums.work.MissionStatus;
import java.time.LocalDate;
import lombok.Data;

/** Một nhiệm vụ ở tab Nhiệm vụ (Danh sách / Board). */
@Data
public class MissionSummaryDTO {
    private String code;
    private String title;
    private MissionStatus status;
    /** Đơn vị / tổ đội. */
    private DepartmentRefDTO department;
    /** Người lập (cũng là người thực hiện). */
    private PersonRefDTO proposer;
    /** Cấp trên trực tiếp duyệt. */
    private PersonRefDTO approver;
    private ProjectRefDTO project;
    private LocalDate dueDate;
    private boolean overdue;
    private int progress;
}
