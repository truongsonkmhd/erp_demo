package com.xxxx.ddd.application.model.command;

import lombok.Data;

import java.util.List;

@Data
public class SaveRoleCommand {
    private String code;
    private String name;
    private String summary;
    private Long departmentId;
    private List<String> permissionIds;
}
