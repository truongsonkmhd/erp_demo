package com.xxxx.ddd.application.model;

import lombok.Data;

import java.util.List;

@Data
public class RoleDTO {
    private Long id;
    private String code;
    private String name;
    private String summary;
    private Long departmentId;
    private String departmentName;
    private List<RoleLevelDTO> levels;
    private List<PermissionDTO> permissions;
}
