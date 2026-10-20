package com.xxxx.ddd.application.model;

import lombok.Data;

@Data
public class PermissionDTO {
    private String id;
    private String code;
    private String label;
    private String note;
    private Long pageId;
    private Long actionId;
    private String pageCode;
    private String actionCode;
}
