package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePermissionRequest {
    private String id;
    private String code;
    private String label;
    private String note;
    private Long pageId;
    private Long actionId;
}
