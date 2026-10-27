package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Đề nghị xoá dự án. */
@Data
public class DeleteRequestRequest {
    @NotBlank
    @Size(max = 1000)
    private String reason;
}
