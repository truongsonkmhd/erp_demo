package com.xxxx.ddd.controller.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class SaveRoleRequest {
    private String code;
    @NotBlank
    private String name;
    private String summary;
    private Long departmentId;
    private List<PermissionItemRequest> permissions;
}
