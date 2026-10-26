package com.xxxx.ddd.application.model;

import lombok.Data;

@Data
public class AuditLogDTO {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String action;
    private String resourceType;
    private String resourceId;
    private String detail;
    private String createdAt;
}
