package com.xxxx.ddd.application.model.command;

import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/** Lập / sửa dự án. code chỉ dùng khi lập; status chỉ dùng khi sửa dự án đã duyệt. */
@Data
public class SaveProjectCommand {
    private String code;
    private String name;
    private String description;
    private Long leadDepartmentId;
    private Long managerUserId;
    private List<Long> coDepartmentIds;
    /** Đồng. */
    private BigDecimal estimatedBudget;
    private LocalDate startDate;
    private LocalDate endDate;
    private ProjectStatus status;
}
