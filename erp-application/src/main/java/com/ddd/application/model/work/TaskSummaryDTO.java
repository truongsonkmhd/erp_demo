package com.xxxx.ddd.application.model.work;

import com.xxxx.ddd.domain.model.enums.work.Complexity;
import com.xxxx.ddd.domain.model.enums.work.Priority;
import com.xxxx.ddd.domain.model.enums.work.TaskStatus;
import java.time.LocalDate;
import lombok.Data;

/** Một việc trên Board / Danh sách của dự án. */
@Data
public class TaskSummaryDTO {
    private String code;
    private String projectCode;
    private String title;
    private TaskStatus status;
    /** Tiến độ %. */
    private int progress;
    private Complexity complexity;
    private Priority priority;
    private LocalDate dueDate;
    private boolean overdue;
    private PersonRefDTO assignee;
    private DepartmentRefDTO department;
}
