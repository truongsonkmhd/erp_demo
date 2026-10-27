package com.xxxx.ddd.controller.dto;

import com.xxxx.ddd.domain.model.enums.work.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/** Body lập / sửa dự án (code bắt buộc khi lập, bỏ qua khi sửa). */
@Data
public class SaveProjectRequest {
    @Size(max = 30)
    private String code;
    @NotBlank
    @Size(max = 500)
    private String name;
    private String description;
    @NotNull
    private Long leadDepartmentId;
    private Long managerUserId;
    private List<Long> coDepartmentIds;
    @NotNull
    @Positive
    private BigDecimal estimatedBudget;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
    private ProjectStatus status;
}
