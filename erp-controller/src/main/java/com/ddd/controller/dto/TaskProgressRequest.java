package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Body cập nhật tiến độ. */
@Data
public class TaskProgressRequest {
    @NotNull
    @Min(0)
    @Max(100)
    private Integer progress;
    @Size(max = 2000)
    private String evidence;
    @Size(max = 2000)
    private String note;
}
