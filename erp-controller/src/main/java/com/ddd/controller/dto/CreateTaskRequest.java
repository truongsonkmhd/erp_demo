package com.xxxx.ddd.controller.dto;

import com.xxxx.ddd.domain.model.enums.work.Complexity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/** Body tạo việc trong dự án. */
@Data
public class CreateTaskRequest {
    @NotBlank
    @Size(max = 30)
    private String code;
    @NotBlank
    private String projectCode;
    @NotBlank
    @Size(max = 1000)
    private String title;
    private String resultRequirement;
    private Complexity complexity;
    @NotNull
    private Long assigneeUserId;
    private List<Long> followerUserIds;
    @NotNull
    private LocalDate dueDate;
}
