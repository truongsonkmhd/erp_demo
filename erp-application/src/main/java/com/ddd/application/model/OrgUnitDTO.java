package com.xxxx.ddd.application.model;

import lombok.Data;

@Data
public class OrgUnitDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Long parentId;
    private String parentCode;
}
