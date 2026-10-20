package com.xxxx.ddd.application.model;

import lombok.Data;

import java.util.List;

@Data
public class RoleLevelDTO {
    private String id;
    private String name;
    private String seat;
    private String description;
    private List<String> permissionIds;
}
