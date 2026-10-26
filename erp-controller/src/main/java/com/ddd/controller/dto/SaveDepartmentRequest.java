package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveDepartmentRequest {
    @NotBlank private String code;
    @NotBlank private String name;
    private String description;
    /** Đơn vị cha; null ở cấp gốc. */
    private Long parentId;
}
