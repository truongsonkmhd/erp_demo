package com.xxxx.ddd.application.model.command;

import lombok.Data;

@Data
public class CreatePermissionCommand {
    private String id;
    private String label;
    private String note;
    private Long pageId;
    private Long actionId;
}
